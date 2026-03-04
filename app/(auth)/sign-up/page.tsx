"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { MouseEvent } from "react";
import { SignupValidation } from "@/lib/validations";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

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
import Loader from "@/components/shared/Loader";
import VerificationDialog from "@/components/shared/VerificationDialog";
import { saveUserToDB } from "@/app/actions/userAction";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SignupValidation>) {
    if (!isLoaded || !signUp) return;
    setIsFormLoading(true);
    try {
      await signUp.create({
        emailAddress: values.email,
        password: values.password,
        firstName: values.name,
        username: values.username,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingEmail(values.email);
      setIsVerificationOpen(true);
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      const longMessage = (clerkError?.longMessage as string | undefined) ?? "";

      // Prefer Clerk's detailed message and also surface it next to the most
      // relevant field so the user knows exactly what to fix.
      const message =
        longMessage || (err instanceof Error ? err.message : "Something went wrong");

      const lower = longMessage.toLowerCase();

      if (lower.includes("password")) {
        form.setError("password", {
          type: "manual",
          message,
        });
      } else if (lower.includes("email")) {
        form.setError("email", {
          type: "manual",
          message,
        });
      } else if (lower.includes("username")) {
        form.setError("username", {
          type: "manual",
          message,
        });
      }

      toast.error(message);
    } finally {
      setIsFormLoading(false);
    }
  }

  async function handleVerificationComplete(code: string) {
    if (!signUp || !setActive) return;
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });

        const saveResult = await saveUserToDB();
        if (!saveResult.success) {
          toast.error(saveResult.error);
          return;
        }

        toast.success("Account created successfully!");
        setIsVerificationOpen(false);
        router.push("/");
      }
    } catch {
      throw new Error("Invalid code");
    }
  }

  async function handleResend() {
    if (!signUp) return;
    await signUp.prepareEmailAddressVerification({
      strategy: "email_code",
    });
  }

  async function handleOAuthSignUp(
    strategy: "oauth_google" | "oauth_github",
    e: MouseEvent,
  ) {
    e.preventDefault();
    if (!signUp || isOAuthLoading) return;
    setIsOAuthLoading(true);
    const providerName = strategy === "oauth_google" ? "Google" : "GitHub";

    try {
      await toast.promise(
        signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: "/sso-callback",
          redirectUrlComplete: "/",
        }),
        {
          loading: `Signing up with ${providerName}...`,
          success: `Redirecting to ${providerName}…`,
          error: `${providerName} sign-up failed`,
        },
      );
    } catch (err: any) {
      console.error(`${providerName} OAuth sign-up error:`, err);
      toast.error(
        `${providerName} sign-up failed: ${
          err.errors?.[0]?.longMessage || err.message || "Unknown error"
        }`,
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

  return (
    <div className="flex flex-col w-full max-w-[420px] items-center px-4">
      <VerificationDialog
        isOpen={isVerificationOpen}
        email={pendingEmail}
        onClose={() => setIsVerificationOpen(false)}
        onComplete={handleVerificationComplete}
        onResend={handleResend}
        resendColldown={60}
      />

      <Form {...form}>
        <div className="flex flex-col items-center w-full mb-6">
          <h2 className="text-2xl font-semibold text-center mb-1">
            Create a new account
          </h2>
          <p className="text-light-3 text-sm text-center">
            Enter your information to get started
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 w-full"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input type="text" {...field} className="shad-input" />
                </FormControl>
                <FormMessage className="text-red" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input type="text" {...field} className="shad-input" />
                </FormControl>
                <FormMessage className="text-red" />
              </FormItem>
            )}
          />
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

              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="shad-button_primary w-full"
            disabled={isFormLoading}
          >
            {isFormLoading ? <Loader /> : "Sign up"}
          </Button>
          <div id="clerk-captcha" className=" justify-center hidden" />

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
              onClick={(e) => handleOAuthSignUp("oauth_google", e)}
            >

                <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />

            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isOAuthLoading}
              className="flex-1 bg-[#24292F] text-white border border-zinc-700 hover:bg-[#1B1F23] hover:border-zinc-600 transition flex items-center justify-center gap-2"
              onClick={(e) => handleOAuthSignUp("oauth_github", e)}
            >

                <img src="/icons/github.svg" alt="GitHub" className="w-5 h-5" />

            </Button>
          </div>

          <p className="text-sm text-light-4 text-center ">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary-500 font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}
