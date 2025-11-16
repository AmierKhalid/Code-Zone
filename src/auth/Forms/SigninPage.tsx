import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SigninValidation } from "@/lib/Validation/validation";
import { z } from "zod";
import Loader from "@/components/shared/Loader";
import { Link, useNavigate } from "react-router-dom";
import { useSignInAccount } from "@/lib/react-query/queries&mutations";
import { useUserContext } from "@/context/AuthContext";

const SigninPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const { mutateAsync: signInAccount, isPending } = useSignInAccount();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof SigninValidation>) => {
    try {
      const session = await signInAccount({
        email: values.email,
        password: values.password,
      });

      if (!session) {
        toast({ 
          title: "Sign in failed", 
          description: "Could not create a session. Please try again." 
        });
        return;
      }

      const isLoggedIn = await checkAuthUser();
      if (isLoggedIn) {
        form.reset();
        navigate("/");
      } else {
        toast({ 
          title: "Sign in failed", 
          description: "Failed to verify your session. Please try again." 
        });
      }
    } catch (error: any) {
      // Extract error message from Appwrite
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      let userMessage = "Sign in failed";
      
      if (errorMessage.includes("Invalid credentials") || errorMessage.includes("401")) {
        userMessage = "Invalid email or password. Please check your credentials.";
      } else if (errorMessage.includes("User not found")) {
        userMessage = "Account not found. Please sign up first.";
      } else if (errorMessage.includes("Email verification")) {
        userMessage = "Please verify your email before signing in.";
      }
      
      toast({ 
        title: userMessage,
        description: "Please check your email and password and try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[420px] items-center px-4">
      <Form {...form}>
        <div className="flex flex-col items-center w-full mb-6">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/assets/images/logo.svg"
              alt="Logo"
              className="w-[60px] h-[50px] object-cover"
            />
            <h1 className="text-[36px] font-bold">
              Code<span className="text-fuchsia-500">Zone</span>
            </h1>
          </div>
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
                <FormMessage />
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
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="shad-button_primary" disabled={isPending}>
            {isPending || isUserLoading ? (
              <div className="flex items-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-sm text-light-2 text-center mt-2">
            Don’t have an account?{" "}
            <Link
              to="/sign-up"
              className="text-primary-500 font-medium ml-1 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
};

export default SigninPage;
