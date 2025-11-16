import { Client, Databases, Storage, Account, Avatars, ID } from "appwrite";

// Helper function to get environment variables with validation
function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    // Debug: Log available env vars (only in dev mode)
    if (import.meta.env.DEV) {
      console.warn("Available VITE_ environment variables:", 
        Object.keys(import.meta.env).filter(k => k.startsWith("VITE_"))
      );
    }
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please ensure your .env.local file in the root directory contains all required variables.\n` +
      `Important: Variables must be prefixed with VITE_ to be accessible in the browser.\n` +
      `Required variables:\n` +
      `- VITE_APPWRITE_URL\n` +
      `- VITE_APPWRITE_PROJECT_ID\n` +
      `- VITE_APPWRITE_DATABASE_ID\n` +
      `- VITE_APPWRITE_STORAGE_ID\n` +
      `- VITE_APPWRITE_USERS_COLLECTION_ID\n` +
      `- VITE_APPWRITE_POSTS_COLLECTION_ID\n` +
      `- VITE_APPWRITE_SAVES_COLLECTION_ID\n` +
      `\nAfter updating .env.local, restart your development server.`
    );
  }
  return value;
}

// Get environment variables
// Support both VITE_APPWRITE_URL and VITE_APPWRITE_ENDPOINT for compatibility
const appwriteUrl = import.meta.env.VITE_APPWRITE_URL || import.meta.env.VITE_APPWRITE_ENDPOINT;
if (!appwriteUrl) {
  throw new Error(
    `Missing required environment variable: VITE_APPWRITE_URL or VITE_APPWRITE_ENDPOINT\n` +
    `Please ensure your .env.local file contains either:\n` +
    `- VITE_APPWRITE_URL=...\n` +
    `- or VITE_APPWRITE_ENDPOINT=...\n` +
    `\nAfter updating .env.local, restart your development server.`
  );
}
const appwriteProjectId = getEnvVar("VITE_APPWRITE_PROJECT_ID");

// Initialize client
const client = new Client();

client
  .setEndpoint(appwriteUrl)
  .setProject(appwriteProjectId);

// Appwrite service exports
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

// Config object
export const appwriteConfig = {
  endpoint: appwriteUrl,
  projectId: appwriteProjectId,
  databaseId: getEnvVar("VITE_APPWRITE_DATABASE_ID"),
  storageId: getEnvVar("VITE_APPWRITE_STORAGE_ID"),
  usersCollectionId: getEnvVar("VITE_APPWRITE_USERS_COLLECTION_ID"),
  postsCollectionId: getEnvVar("VITE_APPWRITE_POSTS_COLLECTION_ID"),
  savesCollectionId: getEnvVar("VITE_APPWRITE_SAVES_COLLECTION_ID"),
};

// Re-export client and ID for use elsewhere
export { client, ID };
