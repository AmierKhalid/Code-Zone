import type { Metadata } from "next";
import { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Code Zone — Developer Community Hub",
    template: "%s | Code Zone",
  },
  description:
    "Build, share, and collaborate on coding projects. Join the Code Zone developer community to showcase your work, get feedback, and grow your network.",
  keywords: [
    "developer community",
    "code sharing",
    "collaboration",
    "programming",
    "projects",
    "code review",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://code-zone.vercel.app",
  ),
  openGraph: {
    type: "website",
    siteName: "Code Zone",
    title: "Code Zone — Developer Community Hub",
    description:
      "Build, share, and collaborate on coding projects with a vibrant developer community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Zone — Developer Community Hub",
    description:
      "Build, share, and collaborate on coding projects with a vibrant developer community.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#877EFF",
  width: "device-width",
  initialScale: 1,
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-inter antialiased flex min-h-dvh flex-col`}
      >
        <ClerkProvider>
          <Analytics />
          <SpeedInsights />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          <Toaster richColors position="bottom-right" />
        </ClerkProvider>
      </body>
    </html>
  );
};

export default RootLayout;
