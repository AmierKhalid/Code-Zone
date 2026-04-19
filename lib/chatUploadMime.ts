/** Browser `File.type` is often empty or `application/octet-stream`; infer from extension. */
const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown",
  ".json": "application/json",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  /** PowerPoint design template / similar; treat as document not image */
  ".pdt": "application/vnd.ms-powerpoint",
};

export function effectiveMimeForChatFile(file: File): string {
  const raw = (file.type || "").trim().toLowerCase();
  if (raw && raw !== "application/octet-stream") return raw;
  const name = file.name.trim().toLowerCase();
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot) : "";
  return EXT_TO_MIME[ext] || "application/octet-stream";
}
