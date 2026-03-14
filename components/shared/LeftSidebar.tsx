"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { sidebarLinks } from "../../constants/index";
import { INavLink } from "@/app/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Loader from "@/components/shared/Loader";

const LeftSidebar = () => {
  const pathname = usePathname();
  const { user, isLoading } = useCurrentUser();

  const displayName = user?.name ?? user?.username ?? "User";
  const displayUsername = user?.username ? `@${user.username}` : "";
  const imageUrl = user?.image ?? "/icons/profile-placeholder.svg";

  return (
    <nav className="leftsidebar">
      <div className="flex flex-col gap-11">
        <Link href="/" className="flex gap-3 items-center">
          <Image
            className="w-12 h-12"
            src="images/logo.svg"
            alt="Code-Zone Logo"
            height={36}
            width={170}
          />
          <h1 className="text-[25px] te font-bold whitespace-nowrap text-center">
            Code-<span className="text-fuchsia-500">Zone</span>
          </h1>
        </Link>

        <Link
          href={user ? `/profile` : "#"}
          className="flex gap-1 items-center"
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
              />
              <div className="flex flex-col">
                <p className="body-bold">{displayName}</p>
                <p className="small-regular text-light-3">{displayUsername}</p>
              </div>
            </>
          )}
        </Link>

        <ul className="flex flex-col gap-6">
          {sidebarLinks.map((link: INavLink) => {
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
