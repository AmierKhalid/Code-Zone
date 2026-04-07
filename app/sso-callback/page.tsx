"use client";

import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";
import Loader from "@/components/shared/Loader";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveUserToDB } from "@/app/actions/userAction";

export default function SSOCallbackPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const savingRef = useRef(false);

  // when the page mounts and the user is authenticated we try to persist the
  // profile in our own database. `getCurrentUser` (used elsewhere) already
  // calls `saveUserToDB` when needed, but the callback page is the first entry
  // point after an OAuth redirect so we proactively run it here as well.  After
  // saving we let Clerk continue its normal redirect behaviour by not
  // interfering with `AuthenticateWithRedirectCallback`.
  useEffect(() => {
    if (!isLoaded || !userId || savingRef.current) return;
    savingRef.current = true;
    saveUserToDB()
      .catch((err) => {
        console.error("Failed to save OAuth user to DB:", err);
      })
      .finally(() => {
        // even if saving fails we still allow the user to continue
        router.replace("/");
      });
  }, [isLoaded, userId, router]);

  return (
    <div className="flex-center min-h-screen w-full flex flex-col items-center justify-center gap-4">
      <Loader />
      <p className="text-light-3">Completing sign in...</p>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      />
    </div>
  );
}
