"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { respondToCollabInvite } from "@/app/actions/collabInviteActions";
import { toast } from "sonner";

export type ListedNotification = {
  id: string;
  type: string;
  createdAt: Date | string;
  isRead?: boolean;
  actor: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  post: { id: string; caption: string | null } | null;
  collabInvite: {
    id: string;
    sessionId: string;
    status: string;
  } | null;
};

function timeAgo(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input);
  const deltaSec = Math.max(
    1,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const min = Math.floor(deltaSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function getNotificationText(n: ListedNotification) {
  const actorName = n.actor.name ?? n.actor.username ?? "Someone";
  if (n.type === "FOLLOW") return `${actorName} started following you`;
  if (n.type === "LIKE") return `${actorName} liked your post`;
  if (n.type === "COMMENT") return `${actorName} commented on your post`;
  if (n.type === "COLLAB_INVITE") {
    return `${actorName} invited you to collaborate on code`;
  }
  return `${actorName} sent you a notification`;
}

function getNotificationHref(n: ListedNotification) {
  if (n.type === "FOLLOW") return `/profile/${n.actor.id}`;
  if (n.post?.id) return `/posts/${n.post.id}`;
  return "/";
}

type Props = {
  n: ListedNotification;
  onClose: () => void;
  onHandled?: () => void | Promise<void>;
};

export default function NotificationEntry({
  n,
  onClose,
  onHandled,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const isPendingCollab =
    n.type === "COLLAB_INVITE" &&
    n.collabInvite?.status === "PENDING" &&
    n.collabInvite.id;

  const handleRespond = async (accept: boolean) => {
    if (!n.collabInvite?.id) return;
    setBusy(true);
    try {
      const res = await respondToCollabInvite({
        inviteId: n.collabInvite.id,
        accept,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      if (accept && res.sessionId) {
        toast.success("Invite accepted — opening messages with session link");
        router.push(`/Message?collab=${encodeURIComponent(res.sessionId)}`);
      } else {
        toast.success("Invite declined");
      }
      onClose();
      await onHandled?.();
    } finally {
      setBusy(false);
    }
  };

  if (isPendingCollab) {
    return (
      <div className="flex gap-2 items-start px-3 py-2 rounded-lg border border-dark-4 bg-dark-2/80">
        <Image
          src={n.actor.image || "/icons/profile-placeholder.svg"}
          alt={n.actor.name ?? n.actor.username ?? "User"}
          width={28}
          height={28}
          className="rounded-full object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-light-2 text-sm line-clamp-2">{getNotificationText(n)}</p>
          <p className="text-light-4 text-xs mt-1">{timeAgo(n.createdAt)}</p>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              disabled={busy}
              onClick={() => void handleRespond(true)}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs border-dark-4"
              disabled={busy}
              onClick={() => void handleRespond(false)}
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={getNotificationHref(n)}
      className="flex gap-2 items-start px-3 py-2 rounded-lg hover:bg-dark-4"
      onClick={() => onClose()}
    >
      <Image
        src={n.actor.image || "/icons/profile-placeholder.svg"}
        alt={n.actor.name ?? n.actor.username ?? "User"}
        width={28}
        height={28}
        className="rounded-full object-cover shrink-0"
      />
      <div className="min-w-0">
        <p className="text-light-2 text-sm line-clamp-2">{getNotificationText(n)}</p>
        <p className="text-light-4 text-xs mt-1">{timeAgo(n.createdAt)}</p>
      </div>
    </Link>
  );
}
