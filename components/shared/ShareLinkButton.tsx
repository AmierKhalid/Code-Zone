"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shareOrCopyLink } from "@/lib/shareLink";

type ShareLinkButtonProps = {
  path: string;
  shareTitle?: string;
  shareText?: string;
  /** Show “Share” text next to the icon (e.g. profile header). */
  withLabel?: boolean;
  className?: string;
  iconSize?: number;
};

export default function ShareLinkButton({
  path,
  shareTitle,
  shareText,
  withLabel = false,
  className,
  iconSize = 20,
}: ShareLinkButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    try {
      const result = await shareOrCopyLink({
        path,
        title: shareTitle,
        text: shareText,
      });
      if (result === "copied") {
        toast.success("Link copied to clipboard");
      }
    } catch (e) {
      if (e instanceof Error && e.message === "CLIPBOARD_UNAVAILABLE") {
        toast.error("Could not copy the link. Try copying from the address bar.");
      } else {
        toast.error("Something went wrong while sharing.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={busy}
      onClick={() => void handleShare()}
      className={cn(
        "h-auto gap-2 rounded-lg p-2 text-light-1 hover:bg-dark-4 disabled:opacity-50",
        withLabel &&
          "inline-flex h-12 min-h-12 items-center justify-center px-5",
        className,
      )}
      aria-label={withLabel ? undefined : "Share link"}
    >
      <img
        src="/icons/share.svg"
        alt=""
        width={iconSize}
        height={iconSize}
        className="shrink-0 opacity-90"
      />
      {withLabel ? (
        <span className="small-medium whitespace-nowrap">Share</span>
      ) : null}
    </Button>
  );
}
