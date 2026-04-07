import { Client, Databases, Storage, Account, Avatars, ID } from "appwrite";

function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  return value || "mock_value";
}

const appwriteUrl = import.meta.env.VITE_APPWRITE_URL || import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const appwriteProjectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || "mock_project_id";

const client = new Client();

client
  .setEndpoint(appwriteUrl)
  .setProject(appwriteProjectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export const appwriteConfig = {
  endpoint: appwriteUrl,
  projectId: appwriteProjectId,
  databaseId: getEnvVar("VITE_APPWRITE_DATABASE_ID"),
  storageId: getEnvVar("VITE_APPWRITE_STORAGE_ID"),
  usersCollectionId: getEnvVar("VITE_APPWRITE_USERS_COLLECTION_ID"),
  postsCollectionId: getEnvVar("VITE_APPWRITE_POSTS_COLLECTION_ID"),
  savesCollectionId: getEnvVar("VITE_APPWRITE_SAVES_COLLECTION_ID"),
};

export { client, ID };