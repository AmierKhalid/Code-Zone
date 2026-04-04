"use client";
import Bottombar from "@/components/shared/Bottombar";
import { Button } from "@/components/ui";
import { toast } from "sonner";

// Home Page
export default function Home() {
  return (
    <main className="min-h-screen flex flex-1 items-center justify-center flex-col">
      <Button
        className="shad-button_primary p-6"
        onClick={() => toast.success("toast works")}
      >
        test toast<br />
        متشيلهوش ي زياد
      </Button>




      



    </main>
  );
}
