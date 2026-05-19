/** Groq OpenAI-compatible chat API — free tier with rate limits; see https://console.groq.com/ */

export interface GroqMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Node/undici often throws TypeError with message "fetch failed" — give actionable text. */
function toGroqNetworkError(err: unknown): Error {
  if (err instanceof Error && err.message.startsWith("Could not connect to Groq")) {
    return err;
  }
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : String(err);
  const cause =
    err instanceof Error && err.cause instanceof Error
      ? err.cause.message
      : "";
  const combined = `${raw}${cause ? ` (${cause})` : ""}`;
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|certificate|SSL|TLS/i.test(combined)) {
    return new Error(
      "Could not connect to Groq (api.groq.com) from the server. Check internet, VPN, firewall, " +
        "and that HTTPS to api.groq.com is allowed. " +
        (cause ? `Underlying: ${cause}` : raw !== "fetch failed" ? `(${raw})` : ""),
    );
  }
  return err instanceof Error ? err : new Error(combined);
}

/** True when Groq could not be reached (TLS/DNS/firewall, etc.) — safe to try Gemini or fallback. */
export function isGroqTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message;
  if (m.startsWith("Could not connect to Groq")) return true;
  return /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|socket hang up|NetworkError|certificate|SSL|TLS/i.test(
    m,
  );
}

/** Models commonly available on Groq — see https://console.groq.com/docs/models */
const DEFAULT_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-20b",
] as const;

class GroqClient {
  private apiKey: string;

  constructor() {
    this.apiKey = (process.env.GROQ_API_KEY || "").trim();
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  getModels(): string[] {
    return [...DEFAULT_MODELS];
  }

  defaultModel(): string {
    const fromEnv = (process.env.GROQ_DEFAULT_MODEL || "").trim();
    if (fromEnv && this.getModels().includes(fromEnv)) return fromEnv;
    return DEFAULT_MODELS[0];
  }

  /** Resolves client model id for the Groq API (ignores unknown ids). */
  pickModel(requested?: string): string {
    const models = this.getModels();
    if (requested && models.includes(requested)) return requested;
    return this.defaultModel();
  }

  private async parseError(response: Response): Promise<string> {
    const raw = await response.text();
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } };
      return j.error?.message || raw.slice(0, 2000) || response.statusText;
    } catch {
      return raw.slice(0, 2000) || response.statusText;
    }
  }

  private toOpenAIMessages(messages: GroqMessage[]) {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  private async readSseStream(
    body: ReadableStream<Uint8Array> | null,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    if (!body) throw new Error("Groq: empty response body");
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const c = json.choices?.[0]?.delta?.content;
          if (typeof c === "string" && c.length > 0) onChunk(c);
        } catch {
          // ignore partial JSON lines
        }
      }
    }
  }

  async chat(
    messages: GroqMessage[],
    model?: string,
    onStream?: (chunk: string) => void,
  ): Promise<string> {
    if (!this.apiKey) throw new Error("Groq API key not configured");

    const modelId = this.pickModel(model);
    const openaiMessages = this.toOpenAIMessages(messages);

    if (onStream) {
      try {
        const response = await fetch(GROQ_CHAT_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelId,
            messages: openaiMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const detail = await this.parseError(response);
          throw new Error(`Groq API error (${response.status}): ${detail}`);
        }

        let full = "";
        await this.readSseStream(response.body, (chunk) => {
          full += chunk;
          onStream(chunk);
        });
        return full;
      } catch (e) {
        throw toGroqNetworkError(e);
      }
    }

    try {
      const response = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages: openaiMessages,
          stream: false,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const detail = await this.parseError(response);
        throw new Error(`Groq API error (${response.status}): ${detail}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      throw toGroqNetworkError(e);
    }
  }

  async generateGeneralResponse(
    userMessage: string,
    conversationHistory: GroqMessage[] = [],
    model?: string,
    onStream?: (chunk: string) => void,
  ): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant specializing in programming, software development, and technology.

Be accurate and concise. If you don't know something, say so honestly.

Always format answers in **GitHub-flavored Markdown**: headings, lists, **bold** / *italic*, \`inline code\`, and fenced code blocks for multi-line code.`;

    const messages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    return this.chat(messages, model, onStream);
  }

  async generateCodeExplanation(
    code: string,
    language: string,
    model?: string,
    onStream?: (chunk: string) => void,
  ): Promise<string> {
    const systemPrompt = `You are an expert programming assistant. Analyze the provided code and give a comprehensive explanation including:
1. What the code does (purpose and functionality)
2. How it works (step-by-step breakdown)
3. Key concepts and patterns used
4. Potential improvements or best practices
5. Time and space complexity if applicable
6. Security considerations if relevant
7. be profissional and accurate and do not use emojies

Be thorough but concise. Use markdown formatting with code blocks where helpful.

Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\``;

    const messages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Please explain this code thoroughly." },
    ];

    return this.chat(messages, model, onStream);
  }
}

export const groqClient = new GroqClient();
