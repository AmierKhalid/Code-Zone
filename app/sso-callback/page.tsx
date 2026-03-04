"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import Loader from "@/components/shared/Loader";

export default function SSOCallbackPage() {
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
