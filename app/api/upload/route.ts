import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { assertChatUploadAllowed } from "@/app/api/upload/chatUploadPolicy";
import { cloudinaryResourceToKind } from "@/lib/chatAttachments";
import { effectiveMimeForChatFile } from "@/lib/chatUploadMime";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Post / profile media (legacy). */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const raw = formData.get("file");
    const folderField = formData.get("folder");
    const originalNameRaw = formData.get("originalName");
    const originalName =
      typeof originalNameRaw === "string" && originalNameRaw.trim()
        ? originalNameRaw.trim()
        : "upload";

    if (!raw || typeof raw === "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const blob = raw as Blob;

    const file: File =
      raw instanceof File
        ? raw
        : new File([await blob.arrayBuffer()], originalName, {
            type: blob.type || "application/octet-stream",
          });

    const folder =
      folderField === "messages"
        ? "messages"
        : folderField === "posts"
          ? "posts"
          : "posts";

    if (folder === "messages") {
      const policyErr = assertChatUploadAllowed(file);
      if (policyErr) {
        return NextResponse.json({ error: policyErr }, { status: 400 });
      }
    }

    const mimeForUpload = effectiveMimeForChatFile(file);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeForUpload};base64,${base64}`;

    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });

    const mime = mimeForUpload;
    const kind =
      folder === "messages"
        ? cloudinaryResourceToKind(uploaded.resource_type, mime)
        : uploaded.resource_type === "image"
          ? "image"
          : uploaded.resource_type === "video"
            ? "video"
            : "file";

    return NextResponse.json({
      url: uploaded.secure_url,
      bytes: uploaded.bytes ?? file.size,
      kind,
      fileName: file.name || null,
      mimeType: mime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
