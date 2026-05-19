import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],

  /** Multipart uploads (e.g. chat attachments) need a higher cap than the default ~1MB. */
  experimental: {
    serverActions: { bodySizeLimit: "32mb" },
    proxyClientMaxBodySize: "32mb",
  },

  /* ── Production Performance ─────────────────────────────────── */
  // Enable gzip/brotli compression (Vercel handles this by default, but helpful for self-hosting)
  compress: true,

  // Power on React strict mode for catching side-effect bugs before deployment
  reactStrictMode: true,

  // Opt into the new production-optimised source maps (hidden from devtools)
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
    // Serve modern formats automatically for smaller payloads
    formats: ["image/avif", "image/webp"],
    // Device-aware sizes to avoid serving desktop images on mobile
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Allow far-future caching of optimized images
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  /* ── Security & Caching Headers ─────────────────────────────── */
  async headers() {
    return [
      {
        // Cache immutable static assets (JS/CSS chunks, fonts, images in _next)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache public assets (icons, logos, etc.)
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Security headers for all pages
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  webpack: (config, { isServer, dev }) => {
    // Handle node: protocol for Prisma client
    if (!isServer) {
      // Completely ignore Prisma client on client side
      config.externals = config.externals || [];
      config.externals.push({
        "@prisma/client": "commonjs @prisma/client",
        "@prisma/client/runtime": "commonjs @prisma/client/runtime",
        prisma: "commonjs prisma",
      });

      // Handle node: protocol imports (Webpack 5+ signature — avoids DEP_WEBPACK_EXTERNALS_FUNCTION_PARAMETERS)
      config.externals.push(
        (
          { request }: { request?: string },
          callback: (err?: Error | null, result?: string) => void,
        ) => {
          if (request?.startsWith("node:")) {
            return callback(null, "{}");
          }
          callback();
        },
      );
    }
    return config;
  },
};

export default nextConfig;
