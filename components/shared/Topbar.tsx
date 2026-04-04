"use client";

import Link from "next/link";
import Image from "next/image";
import { SignOutButton } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "../ui/button";

const Topbar: React.FC = () => {
  const { user, isLoading } = useCurrentUser();
  const displayName = user?.name ?? user?.username ?? "User";
  const imageUrl = user?.image ?? "/icons/profile-placeholder.svg";

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

        <div className="flex gap-4 items-center">
          <SignOutButton signOutOptions={{ redirectUrl: "/sign-in" }}>
            <Button variant="ghost" className="shad-button_ghost">
              <Image
                src="/icons/logout.svg"
                alt="Logout"
                width={20}
                height={20}
                style={{ width: "auto", height: "auto" }}
              />
            </Button>
          </SignOutButton>

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
