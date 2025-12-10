import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { Toaster } from "../components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Code Zone",
  description: "the best Plce for developers",
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={`${inter.variable} font-inter antialiased`}>
        <main className="">{children}</main>
        <Toaster />
      </body>
    </html>
    </ClerkProvider>
  );
};
export default RootLayout;


//first of all we need to change the website name,logo and the side image
