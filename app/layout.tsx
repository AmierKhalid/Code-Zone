import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import LogoutButton from "../components/ui/LogoutButton";

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
        <body className={`${inter.variable} font-inter antialiased`}>
          <main>{children}</main>

          {/* Logout Button */}
          <LogoutButton />
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
