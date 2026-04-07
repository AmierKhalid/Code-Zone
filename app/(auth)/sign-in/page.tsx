"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import type { EmailCodeFactor } from "@clerk/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SigninValidation } from "@/lib/validations";
import Loader from "@/components/shared/Loader";
import VerificationDialog from "@/components/shared/VerificationDialog";
import { saveUserToDB } from "@/app/actions/userAction";

type ClerkErrorLike = {
  errors?: { longMessage?: string; message?: string }[];
  message?: string;
};

function getClerkLongMessage(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  const e = err as ClerkErrorLike;
  return e.errors?.[0]?.longMessage || e.errors?.[0]?.message || e.message || null;
}

type EmailVerificationCapableSignIn = {
  prepareEmailAddressVerification: (params: { strategy: "email_code" }) => Promise<unknown>;
};

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showSecondFactor, setShowSecondFactor] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [secondFactorEmailId, setSecondFactorEmailId] = useState<string | null>(
    null
  );

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    if (!isLoaded || !signIn) return;
    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
        });
        const saveResult = await saveUserToDB();
        if (!saveResult.success) toast.error(saveResult.error);
        toast.success("Welcome back!");
        router.push("/");
        return;
      }

      // a user can be required to verify their email before the session is
      // activated. we treat this like second‑factor but reuse the same dialog.
      // Clerk types omit "needs_email_verification" but the API can return it at runtime
      if ((signInAttempt.status as string) === "needs_email_verification") {
        const signInWithEmailVerification =
          signIn as unknown as EmailVerificationCapableSignIn;
        await signInWithEmailVerification.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setPendingEmail(values.email);
        setShowVerification(true);
        return;
      }

      if (signInAttempt.status === "needs_second_factor") {
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor =>
            factor.strategy === "email_code"
        );
        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setPendingEmail(values.email);
          setSecondFactorEmailId(emailCodeFactor.emailAddressId);
          setShowSecondFactor(true);
        } else {
          toast.error("Additional verification is required.");
        }
      } else {
        toast.error("Sign-in could not be completed. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        getClerkLongMessage(err) ||
        (err instanceof Error ? err.message : "Invalid email or password");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSecondFactorComplete(code: string) {
    if (!signIn || !setActive) return;
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        await saveUserToDB();
        setShowSecondFactor(false);
        toast.success("Welcome back!");
        router.push("/");
      }
    } catch {
      throw new Error("Invalid code");
    }
  }

  async function handleResendSecondFactor() {
    if (!signIn || !secondFactorEmailId) return;
    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: secondFactorEmailId,
    });
  }

  async function handleVerificationComplete(code: string) {
    if (!signIn || !setActive) return;
    try {
      const result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        const saveResult = await saveUserToDB();
        if (!saveResult.success) toast.error(saveResult.error);
        setShowVerification(false);
        toast.success("Welcome back!");
        router.push("/");
      }
    } catch {
      throw new Error("Invalid code");
    }
  }

  async function handleResendVerification() {
    if (!signIn) return;
    const signInWithEmailVerification =
      signIn as unknown as EmailVerificationCapableSignIn;
    await signInWithEmailVerification.prepareEmailAddressVerification({
      strategy: "email_code",
    });
  }

  async function handleOAuthSignIn(strategy: "oauth_google" | "oauth_github", e: React.MouseEvent) {
    e.preventDefault();
    if (!signIn || isOAuthLoading) return;
    setIsOAuthLoading(true);
    const providerName = strategy === "oauth_google" ? "Google" : "GitHub";

    try {
      // show a promise toast while the redirect request is being sent
      await toast.promise(
        signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        }),
        {
          loading: `Signing in with ${providerName}...`,
          success: `Redirecting to ${providerName}...`,
          error: `${providerName} sign-in failed`,
        }
      );
      // note: after a successful redirect the app will unload, so we don't need
      // additional success handling here. isOAuthLoading will be reset if the
      // user returns due to error.
    } catch (err: unknown) {
      console.error("OAuth sign-in error:", err);
      toast.error(
        `${providerName} sign-in failed: ${
          getClerkLongMessage(err) || "Unknown error"
        }`
      );
      setIsOAuthLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex-center w-full">
        <Loader />
      </div>
    );
  }

  if (showSecondFactor || showVerification) {
    return (
      <div className="flex flex-col w-full max-w-[420px] items-center px-4">
        <VerificationDialog
          isOpen={showSecondFactor || showVerification}
          email={pendingEmail}
          onClose={() => {
            setShowSecondFactor(false);
            setShowVerification(false);
          }}
          onComplete={
            showSecondFactor
              ? handleSecondFactorComplete
              : handleVerificationComplete
          }
          onResend={
            showSecondFactor
              ? handleResendSecondFactor
              : handleResendVerification
          }
          resendColldown={60}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[420px] items-center px-4">
      <Form {...form}>
        <div className="flex flex-col items-center w-full mb-6">
          <h2 className="text-2xl font-semibold text-center mb-1">
            Welcome back!
          </h2>
          <p className="text-light-3 text-sm text-center">
            Please enter your details
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 w-full"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" {...field} className="shad-input" />
                </FormControl>
                <FormMessage className="text-red" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} className="shad-input" />
                </FormControl>
                <FormMessage className="text-red" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="shad-button_primary w-full"
            disabled={isLoading}
          >
            {isLoading ? <Loader /> : "Sign in"}
          </Button>
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-dark-4"></div>
            <span className="text-light-4 text-sm">Or continue with</span>
            <div className="flex-1 h-px bg-dark-4"></div>
          </div>
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              disabled={isOAuthLoading}
              className="flex-1 bg-light-2 text-gray-700 border border-zinc-300 hover:bg-gray-100 hover:border-zinc-400 flex items-center justify-center gap-2"
              onClick={(e) => handleOAuthSignIn("oauth_google", e)}
            >


                <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />

            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isOAuthLoading}
              className="flex-1 bg-[#24292F] text-white border border-zinc-700 hover:bg-[#1B1F23] hover:border-zinc-600 transition flex items-center justify-center gap-2"
              onClick={(e) => handleOAuthSignIn("oauth_github", e)}
            >

                <img src="/icons/github.svg" alt="GitHub" className="w-5 h-5" />

            </Button>
          </div>

          <p className="text-sm text-light-4 text-center mt-4">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary-500 font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>

        </form>

      </Form>
    </div>
  );
}

