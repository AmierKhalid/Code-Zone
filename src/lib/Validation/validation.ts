import { z } from "zod"
  export const SignupValidation = z.object({
    name:z.string().min(2,{message:"do you call this a name silly!"}),
    username: z.string().min(2,{message:"this can not be an username silly!"}).max(25,{message:"this can not be an username silly!"}),
    email:z.string().email(),
    password: z.string().min(8,{message:"protect your account idiot!, at least 8 characters!"}),
    
})
  export const SigninValidation = z.object({
    email:z.string().email(),
    password: z.string().min(8,{message:"protect your account idiot!, at least 8 characters!"}),
    
})
  export const PostValidation = z.object({
    caption:z.string().min(1).max(5000),
    file: z.custom<File[]>(),
    location:z.string().min(2).max(500),
    tags:z.string(),
    
})
  export const ProfileValidation = z.object({
    file: z.custom<File[]>(),
    name: z.string().min(2),
    username: z.string().min(2),
    email: z.string().email(),
    bio: z.string().max(160).optional().or(z.literal("")),
  })