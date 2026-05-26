import { NextResponse } from "next/server";

type ExecuteRequest = {
  language?: string;
  code?: string;
};


const JUDGE0_API = "https://ce.judge0.com/submissions";

const LANGUAGE_IDS: Record<string, number> = {
  python:     71,  // Python 3
  javascript: 63,  // JavaScript (Node.js)
  typescript: 74,  // TypeScript
  java:       62,  // Java
  csharp:     51,  // C# 
  cpp:        54,  // C++ 
  c:          50,  // C 
  go:         60,  // Go
  rust:       73,  // Rust
  bash:       46,  // Bash
};

const EXEC_TIMEOUT_MS = 15_000; 

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ExecuteRequest;
    const language = (body.language || "").toLowerCase();
    const source = body.code || "";

    if (!source.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      return NextResponse.json(
        { error: `Language "${language}" is not supported yet` },
        { status: 400 }
      );
    }

    // Submit to Judge0 CE with wait=true (synchronous result)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXEC_TIMEOUT_MS);

    let judgeRes: Response;
    try {
      judgeRes = await fetch(`${JUDGE0_API}?wait=true&base64_encoded=false`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: source,
          language_id: languageId,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      const message = err instanceof Error && err.name === "AbortError"
        ? "Execution timed out. Your code may have an infinite loop."
        : "Could not reach the code execution service. Please try again.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    clearTimeout(timeout);

    if (!judgeRes.ok) {
      return NextResponse.json(
        { error: `Execution service error (${judgeRes.status}). Please try again.` },
        { status: 502 }
      );
    }

    const data = await judgeRes.json() as {
      stdout?:         string | null;
      stderr?:         string | null;
      compile_output?: string | null;
      message?:        string | null;
      status?:         { id: number; description: string };
    };

    const statusId = data.status?.id ?? 0;

    // Status IDs: 3 = Accepted, 4 = Wrong Answer, 5 = TLE, 6 = CE, 7-12 = Runtime errors
    if (statusId === 5) {
      return NextResponse.json({
        output: "Time Limit Exceeded — your code ran too long.",
        exitCode: 1,
      });
    }

    // Build output: prefer stdout, fall back to compile error or runtime error
    const stdout        = (data.stdout        || "").trim();
    const stderr        = (data.stderr        || "").trim();
    const compileOutput = (data.compile_output || "").trim();

    let output = stdout;
    if (!output && compileOutput) output = compileOutput;
    if (!output && stderr)        output = stderr;
    if (!output)                  output = "Program finished with no output.";

    // Append stderr below stdout if both exist
    if (stdout && stderr) output = `${stdout}\n\n${stderr}`;

    const exitCode = statusId === 3 ? 0 : 1;

    return NextResponse.json({ output, exitCode });
  } catch (error) {
    console.error("Code execution error:", error);
    const message = error instanceof Error ? error.message : "Failed to execute code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
