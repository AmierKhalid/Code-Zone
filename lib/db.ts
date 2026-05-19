import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    // Reduce Prisma query logging overhead in production
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "error", "warn"],
  });
}

type PrismaWithConversation = PrismaClient & {
  conversation?: { findMany: (...args: unknown[]) => Promise<unknown> };
};

type EngineConfigShape = {
  runtimeDataModel?: {
    models?: Record<string, { fields?: { name: string }[] }>;
  };
};

/** After `prisma generate`, a cached global client (dev HMR) may lack new delegates. */
function prismaClientHasMessaging(client: PrismaClient): boolean {
  const conv = (client as PrismaWithConversation).conversation;
  return typeof conv?.findMany === "function";
}

/** HMR can keep a client that has Conversation but predates Message snippet columns. */
function prismaClientMessageHasSnippetSupport(client: PrismaClient): boolean {
  const fields = (client as unknown as { _engineConfig?: EngineConfigShape })
    ._engineConfig?.runtimeDataModel?.models?.Message?.fields;
  if (!fields?.length) return false;
  const names = new Set(fields.map((f) => f.name));
  return names.has("snippetCode") && names.has("snippetLang");
}

function prismaCachedClientIsCurrent(client: PrismaClient): boolean {
  return (
    prismaClientHasMessaging(client) && prismaClientMessageHasSnippetSupport(client)
  );
}

if (globalForPrisma.prisma && !prismaCachedClientIsCurrent(globalForPrisma.prisma)) {
  globalForPrisma.prisma = undefined;
}

const prismaClient = globalForPrisma.prisma ?? createPrisma();

if (!prismaCachedClientIsCurrent(prismaClient)) {
  throw new Error(
    "Prisma client is out of date (messaging and/or Message.snippetCode & snippetLang). Run `npx prisma generate`, then restart the dev server completely (not only hot reload).",
  );
}

globalForPrisma.prisma = prismaClient;

export const db = prismaClient;
