import { z } from "zod";

export const SignupValidation = z.object({
  name: z
    .string()
    .min(2, { message: "Too short!" })
    .max(25, { message: "Too long!" }),
  username: z
    .string()
    .min(2, { message: "Too short!" })
    .max(25, { message: "Too long!" }),
  email: z.string().email(),
  password: z.string().min(8, { message: "Too short! at least 8 characters!" }),
});
export const SigninValidation = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "too short!, at least 8 characters!" }),
});

export const PostValidation = z.object({
  caption: z
    .string()
    .min(5, { message: "Caption must be at least 5 characters." })
    .max(2200, { message: "Caption must be less than 2,200 characters" }),
  file: z.custom<File[]>(),
  location: z
    .string()
    .min(1, { message: "This field is required" })
    .max(1000, { message: "Location must be less than 1000 characters" }),
  tags: z
    .string()
    .min(1, { message: "Tags are required" })
    .max(500, { message: "Tags must be less than 500 characters" }),
});
