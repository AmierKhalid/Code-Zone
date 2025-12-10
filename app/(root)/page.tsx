"use client";
import { Button } from "@/components/ui";

import { toast } from "sonner";

// Home Page
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center flex-col">
      <Button
        className="shad-button_primary"
        onClick={() => toast.success("toast works")}
      >
        test toast
      </Button>
    </main>
  );
}
