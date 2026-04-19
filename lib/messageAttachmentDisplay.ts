import type { MessageAttachmentDTO } from "@/app/actions/messageActions";
import { CHAT_NON_RASTER_FILE_REGEX } from "@/lib/chatAttachments";

/**
 * PDFs and Office files are sometimes stored with `kind: image` (e.g. Cloudinary
 * mis-classification). Only true raster images should use the image preview.
 */
export function shouldRenderMessageAttachmentAsImage(
  a: Pick<MessageAttachmentDTO, "kind" | "mimeType" | "url" | "fileName">,
): boolean {
  if (a.kind === "file" || a.kind === "video") return false;

  const mime = (a.mimeType || "").split(";")[0].trim().toLowerCase();
  if (mime && !mime.startsWith("image/")) return false;

  const name = (a.fileName || "").trim();
  if (name && CHAT_NON_RASTER_FILE_REGEX.test(name)) return false;

  let path = "";
  try {
    path = new URL(a.url).pathname.toLowerCase();
  } catch {
    path = a.url.toLowerCase();
  }
  if (CHAT_NON_RASTER_FILE_REGEX.test(path)) return false;

  if (path.includes("/raw/upload/")) return false;

  return true;
}
