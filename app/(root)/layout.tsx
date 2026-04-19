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
    <main className="flex h-dvh max-h-dvh w-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <Topbar />
      <LeftSidebar />
      <section className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden md:ml-72">
        {children}
      </section>
      <Bottombar />
    </main>
  );
}
