"use client";
import Bottombar from "@/components/shared/Bottombar";
import { Button } from "@/components/ui";
import { toast } from "sonner";
import Link from "next/link";

// Home Page
export default function Home() {
  return (
    <main className="min-h-screen flex flex-1 items-center justify-center flex-col">
      <Button
        className="shad-button_primary p-6"
        onClick={() => toast.success("toast works")}
      >
        test toast
        <br />
        متشيلهوش ي زياد
      </Button>

      <br />

      <Link
        href="/profile"
        className="mt-5 w-full sm:w-auto px-6 bg-purple-600 hover:bg-purple-700 transition py-2 rounded-lg text-center inline-block"
      >
        Your Profile
      </Link>
    </main>
  );
}
