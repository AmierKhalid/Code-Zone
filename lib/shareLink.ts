/** Build an absolute URL for the current origin (call from the client only). */
export function absoluteUrlForPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${p}`;
}

export type ShareLinkResult = "shared" | "copied" | "cancelled";

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException
    ? e.name === "AbortError"
    : e instanceof Error && e.name === "AbortError";
}

/**
 * Opens the native share sheet when available; otherwise copies the link.
 * Returns `cancelled` when the user closes the share sheet without sharing.
 */
export async function shareOrCopyLink(options: {
  path: string;
  title?: string;
  text?: string;
}): Promise<ShareLinkResult> {
  const url = absoluteUrlForPath(options.path);

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url,
      });
      return "shared";
    } catch (e) {
      if (isAbortError(e)) return "cancelled";
      // Unsupported combination or other error — try clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    throw new Error("CLIPBOARD_UNAVAILABLE");
  }
}
