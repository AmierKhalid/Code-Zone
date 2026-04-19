export type ChatAttachmentKind = "image" | "video" | "file";

/** Filenames or URL paths that must never be shown as inline image previews. */
export const CHAT_NON_RASTER_FILE_REGEX =
  /\.(pdf|docx?|xlsx?|pptx?|pdt|potx?|zip|txt|csv|json|md|rtf|odt|ods|odp)$/i;

export const CHAT_MAX_ATTACHMENTS = 6;
export const CHAT_MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Client `<input accept>` hint (browser still allows “All files” on desktop). */
export const CHAT_FILE_ACCEPT =
  "image/*,video/mp4,video/webm,video/quicktime,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.json,.csv,.md";

export function formatByteSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function attachmentKindLabel(kind: ChatAttachmentKind): string {
  switch (kind) {
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "file":
      return "Attachment";
    default:
      return "Attachment";
  }
}

export function mimeToAttachmentKind(mime: string): ChatAttachmentKind {
  const m = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  return "file";
}

function looksLikeNonRasterFromMeta(
  fileName?: string | null,
  url?: string | null,
): boolean {
  const name = (fileName ?? "").trim();
  if (name && CHAT_NON_RASTER_FILE_REGEX.test(name)) return true;
  let path = "";
  try {
    if (url) path = new URL(url).pathname;
  } catch {
    if (url) path = url;
  }
  const p = path.toLowerCase();
  if (p && CHAT_NON_RASTER_FILE_REGEX.test(p)) return true;
  if (p.includes("/raw/upload/")) return true;
  return false;
}

/**
 * Uses stored `kind` plus `mimeType` (and optional `fileName` / `url`) so DB rows
 * that wrongly say `image` for PDFs still behave as files in previews and tiles.
 */
export function resolvedStoredAttachmentKind(
  kind: string,
  mimeType: string | null | undefined,
  fileName?: string | null,
  url?: string | null,
): ChatAttachmentKind {
  const k =
    kind === "image" || kind === "video" || kind === "file" ? kind : "file";
  const m = (mimeType ?? "").toLowerCase().split(";")[0]?.trim() ?? "";
  if (k === "image") {
    if (m && !m.startsWith("image/")) return "file";
    if (looksLikeNonRasterFromMeta(fileName, url)) return "file";
    return "image";
  }
  if (k === "video") {
    if (m && !m.startsWith("video/")) return "file";
    if (looksLikeNonRasterFromMeta(fileName, url)) return "file";
    return "video";
  }
  return "file";
}

export function cloudinaryResourceToKind(
  resourceType: string,
  mime: string,
): ChatAttachmentKind {
  const m = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  // Prefer MIME for chat: Cloudinary `resource_type` can disagree with the
  // actual file (e.g. some uploads), which would otherwise render as a broken <img>.
  if (m.startsWith("image/")) {
    if (resourceType === "video") return "video";
    return "image";
  }
  if (m.startsWith("video/")) {
    if (resourceType === "image") return "image";
    return "video";
  }
  return "file";
}
