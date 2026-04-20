import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Code Zone",
  description: "the best Place for developers",
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} font-inter antialiased flex min-h-dvh flex-col`}
        >
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
          <Toaster richColors position="top-center" />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
