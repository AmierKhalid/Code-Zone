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
import { SignupValidation } from "@/lib/Validation/validation";
import { z } from "zod";
import Loader from "@/components/shared/Loader";
import { Link, useNavigate } from "react-router-dom";
import {
  useAccountCreation,
  useSignInAccount,
} from "@/lib/react-query/queries&mutations";
import { useUserContext } from "@/context/AuthContext";

const SignupPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const { mutateAsync: createAccount, isPending: isCreating } = useAccountCreation();
  const { mutateAsync: signInAccount, isPending: isSigningIn } = useSignInAccount();

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
    try {
      const newUser = await createAccount(values);
      if (!newUser) {
        toast({ title: "Couldn't sign up" });
        return;
      }

      const session = await signInAccount({
        email: values.email,
        password: values.password,
      });
      if (!session) {
        toast({ title: "Failed to create session" });
        return;
      }

      const isLoggedIn = await checkAuthUser();
      if (isLoggedIn) {
        form.reset();
        navigate("/");
      } else {
        toast({ title: "Session verification failed" });
      }
    } catch {
      toast({ title: "Sign up failed" });
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
                  <Input type="text" {...field} className="shad-input" />
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

          <Button
            type="submit"
            className="shad-button_primary"
            disabled={isCreating || isSigningIn}
          >
            {isCreating || isSigningIn || isUserLoading ? (
              <div className="flex items-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Sign up"
            )}
          </Button>

          <p className="text-sm text-light-2 text-center mt-2">
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="text-primary-500 font-medium ml-1 hover:underline"
            >
              Log in
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
};

export default SignupPage;
