"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
import { Button } from "../ui/button";
import { sidebarLinks } from "../../constants/index";
import { INavLink } from "@/app/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getUnreadNotificationCount,
  listMyNotifications,
  markAllNotificationsRead,
} from "@/app/actions/notificationActions";
import { useNotificationPanelPosition } from "@/hooks/useNotificationPanelPosition";
import NotificationEntry, {
  type ListedNotification,
} from "@/components/shared/NotificationEntry";

const LeftSidebar = () => {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<ListedNotification[]>([]);
  const [isFetching, startTransition] = useTransition();
  const notifRef = useRef<HTMLDivElement>(null);
  const panelPortalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const panelStyle = useNotificationPanelPosition(open, notifRef, "sidebar");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  const displayName =
    user?.name ??
    user?.username ??
    (isClerkLoaded ? (clerkUser?.fullName ?? clerkUser?.username) : null) ??
    "User";
  const displayUsername = user?.username
    ? `@${user.username}`
    : isClerkLoaded && clerkUser?.username
      ? `@${clerkUser.username}`
      : "";
  const imageUrl =
    user?.image ??
    (isClerkLoaded ? clerkUser?.imageUrl : null) ??
    "/icons/profile-placeholder.svg";
  const notificationLabel = useMemo(
    () =>
      unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : "",
    [unreadCount],
  );

  const refreshNotifications = useCallback(async () => {
    const [countRes, listRes] = await Promise.all([
      getUnreadNotificationCount(),
      listMyNotifications(10),
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
    <nav className="leftsidebar">
      <div className="flex flex-col gap-11">
        <Link href="/" className="flex gap-3 items-center">
          <Image
            className="w-12 h-12"
            src="/images/logo.svg"
            alt="Code-Zone Logo"
            height={36}
            width={170}
          />
          <h1 className="text-[25px] te font-bold whitespace-nowrap text-center">
            Code-<span className="text-fuchsia-500">Zone</span>
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={user ? `/profile/${user.id}` : "#"}
            className="flex gap-3 items-center flex-1 min-w-0"
          >
            {isLoading ? (
              <div className="flex gap-3 items-center">
                <div className="h-14 w-14 rounded-full bg-dark-4 animate-pulse" />
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-24 bg-dark-4 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-dark-4 rounded animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                <Image
                  src={imageUrl}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover"
                  height={56}
                  width={56}
                  style={{ width: "auto", height: "auto" }}
                />
                <div className="flex flex-col min-w-0">
                  <p className="body-bold truncate">{displayName}</p>
                  <p className="small-regular text-light-3 truncate">
                    {displayUsername}
                  </p>
                </div>
              </>
            )}
          </Link>

          <div className="relative shrink-0" ref={notifRef}>
            <Button
              type="button"
              variant="ghost"
              className="shad-button_ghost h-11 w-11 p-0 relative "
              onClick={onOpenNotifications}
            >
              <Image
                src="/icons/notification-bell.svg"
                alt="Notifications"
                height={24}
                width={24}
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
                  className="bg-dark-3 border border-dark-4 rounded-xl shadow-xl p-2 max-w-[95vw] pointer-events-auto"
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
        </div>

        <ul className="flex flex-col gap-6">
          {[
            ...sidebarLinks,
            ...(user?.isAdmin
              ? [
                  {
                    imgURL: "/icons/posts.svg",
                    route: "/admin",
                    label: "Admin Panel",
                  },
                ]
              : []),
          ].map((link: INavLink) => {
            const isActive = pathname === link.route;
            return (
              <li
                key={link.label}
                className={`group transition leftsidebar-link ${
                  isActive && "bg-primary-500"
                }`}
              >
                <Link href={link.route} className="flex gap-4 items-center p-4">
                  <Image
                    className={`group-hover:invert-white ${
                      isActive && "invert-white"
                    }`}
                    src={link.imgURL}
                    alt={link.label}
                    height={24}
                    width={24}
                  />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
        <Button variant="ghost" className="shad-button_ghost w-full">
          <Image src="/icons/logout.svg" alt="Logout" height={20} width={20} />
          <p className="small-medium lg:base-medium">Logout</p>
        </Button>
      </SignOutButton>
    </nav>
  );
};

export default LeftSidebar;
