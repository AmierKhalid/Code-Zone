"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFollowUser } from "@/app/actions/userAction";

type FollowToggleButtonProps = {
  targetUserId: string;
  initialIsFollowing: boolean;
};

export default function FollowToggleButton({
  targetUserId,
  initialIsFollowing,
}: FollowToggleButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    if (isPending) return;
    const prev = isFollowing;
    setIsFollowing(!prev);

    startTransition(async () => {
      const res = await toggleFollowUser(targetUserId);
      if (!res.success) {
        setIsFollowing(prev);
        toast.error(res.error);
        return;
      }
      setIsFollowing(res.isFollowing);
    });
  };

  return (
    <Button
      type="button"
      className="shad-button_primary px-8"
      onClick={onToggle}
      disabled={isPending}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}

