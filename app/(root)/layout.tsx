import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LeftSidebar from "@/components/shared/LeftSidebar";
import { saveUserToDB } from "@/app/actions/userAction";
import React, { ReactNode } from "react";
import Bottombar from "@/components/shared/Bottombar";
import Topbar from "@/components/shared/Topbar";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await saveUserToDB();

  return (
    <main className="w-full md:flex md:justify-center md:gap-12">
      <Topbar />
      <LeftSidebar />
      <section className="flex flex-1 h-full">{children}</section>
      <Bottombar />
    </main>
  );
}
