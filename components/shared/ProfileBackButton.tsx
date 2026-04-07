"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProfileBackButton() {
  const router = useRouter();

  return (
    <div className="hidden md:flex max-w-5xl w-full mb-4">
      <Button
        type="button"
        onClick={() => router.back()}
        variant="ghost"
        className="shad-button_ghost"
      >
        <img src="/icons/back.svg" alt="back" width={24} height={24} />
        <p className="small-medium lg:base-medium">Back</p>
      </Button>
    </div>
  );
}
