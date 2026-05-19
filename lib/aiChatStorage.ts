interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatHistory {
  messages: AIChatMessage[];
  lastUpdated: Date;
}

const AI_CHAT_STORAGE_KEY = "ai-chat-history";
const MAX_HISTORY_MESSAGES = 50;

export function saveAIChatHistory(messages: AIChatMessage[]): void {
  try {
    const history: AIChatHistory = {
      messages: messages.slice(-MAX_HISTORY_MESSAGES), // Keep only last 50 messages
      lastUpdated: new Date(),
    };
    localStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn("Failed to save AI chat history:", error);
  }
}

export function loadAIChatHistory(): AIChatMessage[] {
  try {
    const stored = localStorage.getItem(AI_CHAT_STORAGE_KEY);
    if (!stored) return [];

    const history: AIChatHistory = JSON.parse(stored);
    return history.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.warn("Failed to load AI chat history:", error);
    return [];
  }
}

export function clearAIChatHistory(): void {
  try {
    localStorage.removeItem(AI_CHAT_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear AI chat history:", error);
  }
}

export function isAIChatHistoryEmpty(): boolean {
  try {
    const stored = localStorage.getItem(AI_CHAT_STORAGE_KEY);
    return !stored;
  } catch {
    return true;
  }
}

export function getAIChatHistoryAge(): number | null {
  try {
    const stored = localStorage.getItem(AI_CHAT_STORAGE_KEY);
    if (!stored) return null;

    const history: AIChatHistory = JSON.parse(stored);
    return Date.now() - new Date(history.lastUpdated).getTime();
  } catch {
    return null;
  }
}

export function isAIChatHistoryOld(maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
  const age = getAIChatHistoryAge();
  return age === null || age > maxAgeMs;
}
