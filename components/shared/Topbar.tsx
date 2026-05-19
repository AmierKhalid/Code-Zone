"use client";

import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "../ui/button";
import {
  getUnreadNotificationCount,
  listMyNotifications,
  markAllNotificationsRead,
} from "@/app/actions/notificationActions";
import { useNotificationPanelPosition } from "@/hooks/useNotificationPanelPosition";
import NotificationEntry, {
  type ListedNotification,
} from "@/components/shared/NotificationEntry";

const Topbar: React.FC = () => {
  const { user, isLoading } = useCurrentUser();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<ListedNotification[]>([]);
  const [isFetching, startTransition] = useTransition();
  const notifRef = useRef<HTMLDivElement>(null);
  const panelPortalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const panelStyle = useNotificationPanelPosition(open, notifRef, "topbar");

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName =
    user?.name ??
    user?.username ??
    (isClerkLoaded ? clerkUser?.fullName ?? clerkUser?.username : null) ??
    "User";
  const imageUrl =
    user?.image ??
    (isClerkLoaded ? clerkUser?.imageUrl : null) ??
    "/icons/profile-placeholder.svg";

  const notificationLabel = useMemo(
    () =>
      unreadCount > 99
        ? "99+"
        : unreadCount > 0
          ? String(unreadCount)
          : "",
    [unreadCount],
  );

  const refreshNotifications = useCallback(async () => {
    const [countRes, listRes] = await Promise.all([
      getUnreadNotificationCount(),
      listMyNotifications(12),
    ]);
    if (countRes.success) setUnreadCount(countRes.count);
    if (listRes.success)
      setNotifications(listRes.notifications as ListedNotification[]);
  }, []);

  useEffect(() => {
    void refreshNotifications();
    const timer = setInterval(() => void refreshNotifications(), 25000);
    return () => clearInterval(timer);
  }, [refreshNotifications]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifRef.current?.contains(t)) return;
      if (panelPortalRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const onOpenNotifications = () => {
    setOpen((prev) => !prev);
    if (open || unreadCount === 0) return;
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (res.success) setUnreadCount(0);
    });
  };

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link href="/" className="flex gap-3 items-center">
          <Image
            src="/images/logo.svg"
            alt="Code-Zone Logo"
            className="w-12 h-12"
            width={130}
            height={36}


          />
          <h1 className="text-[25px] font-bold whitespace-nowrap text-center">
            Code-<span className="text-fuchsia-500">Zone</span>
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
            <Button variant="ghost" className="shad-button_ghost h-9 w-9 p-0">
              <Image
                src="/icons/logout.svg"
                alt="Logout"
                width={18}
                height={18}
              />
            </Button>
          </SignOutButton>

          <div className="relative" ref={notifRef}>
            <Button
              type="button"
              variant="ghost"
              className="shad-button_ghost relative h-9 w-9 p-0"
              onClick={onOpenNotifications}
            >
              <Image
                src="/icons/notification-bell.svg"
                alt="Notifications"
                width={28}
                height={28}
              />
              {notificationLabel && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary-500 text-[10px] text-white flex-center">
                  {notificationLabel}
                </span>
              )}
            </Button>

            {mounted &&
              open &&
              createPortal(
                <div
                  ref={panelPortalRef}
                  style={panelStyle}
                  className="bg-dark-3 border border-dark-4 rounded-xl shadow-xl p-2 max-w-[90vw] pointer-events-auto"
                >
                  <div className="px-2 py-1 text-light-2 small-medium">
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="text-light-4 text-sm px-3 py-4">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <NotificationEntry
                          key={n.id}
                          n={n}
                          onClose={() => setOpen(false)}
                          onHandled={refreshNotifications}
                        />
                      ))
                    )}
                  </div>
                  {isFetching && (
                    <p className="px-3 py-1 text-[11px] text-light-4">
                      Updating...
                    </p>
                  )}
                </div>,
                document.body,
              )}
          </div>

          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-dark-4 animate-pulse" />
          ) : (
            <Link href={user ? `/profile/${user.id}` : "/sign-in"}>
              <Image
                src={imageUrl}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover"
                width={32}
                height={32}

              />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default Topbar;
