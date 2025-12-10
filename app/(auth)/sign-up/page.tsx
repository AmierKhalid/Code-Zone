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
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";



const page = () => {

  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  




  // 1. Define your form.
  const form = useForm<z.infer<typeof SignupValidation>>({
    resolver: zodResolver(SignupValidation),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof SignupValidation>) {
    if(!isLoaded)  return;
    //----------------After taking users input verification pop-up will be shown----------------//
    // try{
    //   await signUp.create({
    //     firstName: values.name,
    //     username: values.username,
    //   emailAddress: values.email,
    //   password: values.password,
    //   });
    //   await signUp.prepareEmailAddressVerification({
    //     strategy:"email_code"
    //   })
    //   setShowDialog(true);
    // }
    // catch(error:any){
    //   toast.error(error.message);
    // }
  }

  return (
    <div className="flex flex-col w-full max-w-[420px] items-center px-4">
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
                <FormMessage className="text-red" />
              </FormItem>
            )}
          />
          <Button type="submit" className="shad-button_primary w-full">
            Sign up
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-dark-4"></div>
            <span className="text-light-4 text-sm">Or continue with</span>
            <div className="flex-1 h-px bg-dark-4"></div>
          </div>

          {/* OAuth Buttons */}
          {/* <div className="flex gap-3 w-full">
            <Button
              type="button"
              className="flex-1 bg-dark-3 hover:bg-dark-4 text-light-1 border border-dark-4"
            >
              <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              className="flex-1 bg-dark-3 hover:bg-dark-4 text-light-1 border border-dark-4"
            >
              <img src="/icons/github.svg" alt="GitHub" className="w-5 h-5" />
            </Button>
          </div> */}
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              className="flex-1 bg-light-2 text-gray-700 border border-zinc-300 hover:bg-gray-100 hover:border-zinc-400 flex items-center justify-center gap-2"
            >
              <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
              
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#24292F] text-white border border-zinc-700 hover:bg-[#1B1F23] hover:border-zinc-600 transition"
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
};

export default page;
