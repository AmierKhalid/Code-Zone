import { CHAT_MAX_FILE_BYTES } from "@/lib/chatAttachments";
import { effectiveMimeForChatFile } from "@/lib/chatUploadMime";

const BLOCKED_MIME_PREFIXES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-executable",
  "application/x-dosexec",
  "application/x-sh",
  "text/javascript",
  "application/javascript",
];

export function assertChatUploadAllowed(file: File): string | null {
  if (file.size > CHAT_MAX_FILE_BYTES) {
    return `File is too large (max ${Math.round(CHAT_MAX_FILE_BYTES / (1024 * 1024))} MB).`;
  }
  const mime = effectiveMimeForChatFile(file).toLowerCase();
  for (const p of BLOCKED_MIME_PREFIXES) {
    if (mime.startsWith(p)) return "This file type is not allowed.";
  }
  if (mime.startsWith("image/")) return null;
  if (mime.startsWith("video/")) return null;
  const allowedDocs = new Set([
    "application/pdf",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
  ]);
  if (allowedDocs.has(mime)) return null;
  return "Unsupported file type for chat. Use images, video, PDF, Office docs, or zip.";
}
