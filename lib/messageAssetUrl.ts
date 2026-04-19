/** Accept only assets uploaded to this project's Cloudinary (prevents arbitrary URL injection). */
export function isTrustedMessageAssetUrl(url: string): boolean {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloud) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.hostname !== "res.cloudinary.com") return false;
    const path = decodeURIComponent(u.pathname).toLowerCase();
    const cloudLower = cloud.toLowerCase();
    const segments = path.split("/").filter((s) => s.length > 0);
    const inAccount = segments[0] === cloudLower;
    const inMessagesFolder =
      path.includes("/messages/") || path.includes("/messages%2f");
    return inAccount && inMessagesFolder;
  } catch {
    return false;
  }
}
