"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SignupValidation } from "@/lib/validations";

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

import Link from "next/link";
import { useSignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";

const Page = () => {
  const router = useRouter();
  const { signUp, isLoaded } = useSignUp();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const [loading, setLoading] = useState(false);

  // 🔐 Block signed-in users
  useEffect(() => {
    if (userLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [userLoaded, isSignedIn, router]);

  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof SignupValidation>) => {
    if (!isLoaded || !signUp || isSignedIn) return;

    try {
      setLoading(true);

      await signUp.create({
        emailAddress: values.email,
        password: values.password,
        username: values.username,
      });

      await signUp.update({
        firstName: values.name,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      toast.success("Check your email to verify your account 📩");
      router.push("/verify-email");
    } catch (error: any) {
      const message =
        error?.errors?.[0]?.message ||
        "Signup failed. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!userLoaded) return null;

  return (
    <div className="flex flex-col w-full max-w-[420px] items-center px-4">
      <Form {...form}>
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
                  <Input {...field} autoComplete="name" />
                </FormControl>
                <FormMessage />
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
                  <Input {...field} autoComplete="username" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    {...field}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div id="clerk-captcha" />

          <Button disabled={loading} className="w-full">
            {loading ? <Loader /> : "Create account"}
          </Button>

          {/* OAuth */}
          <div className="flex gap-3">
            <Button
              type="button"
              disabled={!isLoaded || loading}
              onClick={() =>
                signUp?.authenticateWithRedirect({
                  strategy: "oauth_google",
                  redirectUrl: "/sign-up",
                  redirectUrlComplete: "/",
                })
              }
              className="flex-1 bg-gray-100 text-black"
            >
              Google
            </Button>

            <Button
              type="button"
              disabled={!isLoaded || loading}
              onClick={() =>
                signUp?.authenticateWithRedirect({
                  strategy: "oauth_github",
                  redirectUrl: "/sign-up",
                  redirectUrlComplete: "/",
                })
              }
              className="flex-1 bg-black text-white"
            >
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary-500 font-medium"
            >
              Log in
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
};

export default Page;
