import { z } from "zod";
import { CHAT_MAX_ATTACHMENTS, CHAT_MAX_FILE_BYTES } from "@/lib/chatAttachments";

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

export const CommentContentValidation = z
  .string()
  .min(1, { message: "Comment cannot be empty." })
  .max(2000, { message: "Comment is too long (max 2000 characters)." });

export const MessageBodyValidation = z
  .string()
  .trim()
  .min(1, { message: "Message cannot be empty." })
  .max(5000, { message: "Message is too long (max 5000 characters)." });

/** Optional caption with a code snippet (may be empty when sending snippet-only). */
export const MessageCaptionWithSnippetValidation = z
  .string()
  .max(5000, { message: "Message is too long (max 5000 characters)." });

export const SnippetCodeValidation = z
  .string()
  .max(20000, { message: "Code snippet is too long (max 20,000 characters)." })
  .transform((s) => s.replace(/\r\n/g, "\n").trim())
  .refine((s) => s.length > 0, { message: "Code snippet cannot be empty." });

export const SnippetLangValidation = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[a-zA-Z0-9#+.-]+$/, { message: "Invalid language id." });

export const ChatAttachmentInputSchema = z.object({
  url: z.string().url({ message: "Invalid attachment URL." }),
  kind: z.enum(["image", "video", "file"]),
  fileName: z.string().max(255).nullable().optional(),
  mimeType: z.string().max(120).nullable().optional(),
  byteSize: z
    .number()
    .int()
    .min(0)
    .max(CHAT_MAX_FILE_BYTES)
    .nullable()
    .optional(),
});

export const ChatAttachmentsArrayValidation = z
  .array(ChatAttachmentInputSchema)
  .max(CHAT_MAX_ATTACHMENTS, {
    message: `You can attach up to ${CHAT_MAX_ATTACHMENTS} files per message.`,
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
