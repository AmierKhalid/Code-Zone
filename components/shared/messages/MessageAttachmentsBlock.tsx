"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MessageAttachmentDTO } from "@/app/actions/messageActions";
import {
  formatByteSize,
  resolvedStoredAttachmentKind,
  type ChatAttachmentKind,
} from "@/lib/chatAttachments";
import { shouldRenderMessageAttachmentAsImage } from "@/lib/messageAttachmentDisplay";

type Props = {
  attachments: MessageAttachmentDTO[];
  align: "start" | "end";
};

async function downloadUrlAsFile(url: string, filename: string) {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename || "download";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(href);
  }
}

function FileAttachmentRow({
  a,
  mine,
}: {
  a: MessageAttachmentDTO;
  mine: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const name = a.fileName?.trim() || "attachment";

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadUrlAsFile(a.url, name);
    } catch {
      toast.error("Could not download this file. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`flex max-w-full w-full items-center gap-3 rounded-2xl border px-3.5 py-3 ${
        mine
          ? "border-primary-500/25 bg-primary-500/10 text-light-1"
          : "border-dark-4 bg-dark-4 text-light-2"
      }`}
      role="group"
      aria-label={`File attachment: ${name}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dark-3/80 text-primary-500">
        <FileText className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate small-semibold md:base-medium">
          {a.fileName || "Attachment"}
        </span>
        <span className="mt-0.5 block tiny-medium text-light-4">
          {a.mimeType?.split(";")[0] || "File"}
          {a.byteSize != null ? ` · ${formatByteSize(a.byteSize)}` : ""}
        </span>
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleDownload()}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition disabled:cursor-wait disabled:opacity-70 ${
          mine
            ? "bg-primary-500/25 text-light-1 hover:bg-primary-500/35"
            : "bg-dark-3/80 text-primary-500 hover:bg-dark-3"
        }`}
        aria-label={`Download ${name}`}
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {busy ? "…" : "Download"}
      </button>
    </div>
  );
}

function ImageAttachmentTile({
  a,
  mine,
}: {
  a: MessageAttachmentDTO;
  mine: boolean;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return <FileAttachmentRow a={a} mine={mine} />;
  }
  return (
    <Link
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-dark-4/80 bg-dark-3/40 ring-1 ring-white/5 transition hover:ring-primary-500/40"
    >
      <Image
        src={a.url}
        alt={a.fileName || "Image attachment"}
        width={720}
        height={480}
        className="max-h-[min(50vh,22rem)] w-auto max-w-full object-contain"
        sizes="(max-width: 768px) 85vw, 28rem"
        unoptimized
        onError={() => setBroken(true)}
      />
      <span className="sr-only">Open image in new tab</span>
    </Link>
  );
}

export default function MessageAttachmentsBlock({
  attachments,
  align,
}: Props) {
  if (attachments.length === 0) return null;

  const mine = align === "end";

  return (
    <div
      className={`flex w-full max-w-[min(92%,36rem)] flex-col gap-2 ${
        mine ? "items-end" : "items-start"
      }`}
    >
      {attachments.map((a) => {
        const kind: ChatAttachmentKind = resolvedStoredAttachmentKind(
          a.kind,
          a.mimeType,
          a.fileName,
          a.url,
        );

        if (kind === "image" && shouldRenderMessageAttachmentAsImage(a)) {
          return (
            <div key={a.id} className="w-full max-w-[min(92%,36rem)]">
              <ImageAttachmentTile a={a} mine={mine} />
            </div>
          );
        }

        if (kind === "video") {
          return (
            <div
              key={a.id}
              className="w-full overflow-hidden rounded-2xl border border-dark-4/80 bg-black/40 ring-1 ring-white/5"
            >
              <video
                src={a.url}
                controls
                playsInline
                preload="metadata"
                className="max-h-[min(50vh,22rem)] w-full object-contain"
              />
              {a.fileName ? (
                <p className="border-t border-dark-4/60 px-3 py-2 tiny-medium text-light-4">
                  {a.fileName}
                </p>
              ) : null}
            </div>
          );
        }

        return <FileAttachmentRow key={a.id} a={a} mine={mine} />;
      })}
    </div>
  );
}
