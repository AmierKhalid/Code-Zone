import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com", pathname: "/**" },
      {protocol: "https", hostname: "res.cloudinary.com", pathname: "/**"},
    ],
  },
};

export default nextConfig;
