import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  /** Multipart uploads (e.g. chat attachments) need a higher cap than the default ~1MB. */
  experimental: {
    serverActions: { bodySizeLimit: "32mb" },
    proxyClientMaxBodySize: "32mb",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com", pathname: "/**" },
      {protocol: "https", hostname: "res.cloudinary.com", pathname: "/**"},
    ],
  },
};

export default nextConfig;
