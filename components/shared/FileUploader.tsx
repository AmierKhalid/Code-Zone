"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import Image from "next/image";
import { Button } from "@/components/ui";
type FileUploaderProps = {
  fieldChange: (FILES: File[]) => void;
  mediaUrl?: string;
};
const FileUploader = ({ fieldChange, mediaUrl }: FileUploaderProps) => {
  const [fileUrl, setFileUrl] = useState<string | null>(mediaUrl ?? null);
  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      // notify react-hook-form about files
      fieldChange(acceptedFiles as unknown as File[]);
      if (acceptedFiles.length > 0) {
        setFileUrl(URL.createObjectURL(acceptedFiles[0]));
      }
    },
    [fieldChange],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico"],
      "video/*": [".mp4", ".mov", ".avi"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB limit
  });
  return (
    <div
      {...getRootProps()}
      className={`flex flex-center flex-col bg-dark-3 rounded-xl cursor-pointer transition-colors ${
        isDragActive ? "bg-dark-4 border-2 border-primary-500" : ""
      }`}
    >
      <input {...getInputProps()} className="cursor-pointer" />
      {fileUrl ? (
        <>
          <div className="flex flex-1 justify-center w-full p-5 lg:p-10">
            <img
              src={fileUrl}
              alt="uploaded file"
              className="file_uploader-img"
            />
          </div>
          <p className="file_uploader-label">Click or drag to replace</p>
        </>
      ) : (
        <div className="file_uploader-box">
          <Image
            src="/icons/file-upload.svg"
            width={96}
            height={77}
            alt="file upload"
          />
          <h3 className="base-medium text-light-2 mb-2 mt-6">
            {isDragActive ? "Drop your file here" : "Drag file here"}
          </h3>
          <p className="text-light-4 small-regular mb-6">
            SVG, PNG, JPG, GIF, MP4 (max 50MB)
          </p>
          <Button className="shad-button_dark_4">Select from device</Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
