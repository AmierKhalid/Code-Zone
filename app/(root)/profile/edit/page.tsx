"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateProfile } from "@/app/actions/profileAction";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Loader from "@/components/shared/Loader";

export default function EditProfile() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    username: user?.username ?? "",
    bio: user?.bio ?? "",
    image: user?.image ?? "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (userLoading || !user) {
    return <Loader />;
  }

  const handleImageChange = (file: File) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData({
        ...formData,
        image: reader.result as string,
      });
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success("Profile updated!");
      router.push(`/profile`);
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* LEFT PROFILE PREVIEW */}
        <div className="flex flex-col items-center md:items-start">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image
              src={formData.image || "/avatar.png"}
              alt={formData.name || "User avatar"}
              width={128}
              height={128}
              className="w-32 h-32 rounded-full border-2 border-purple-500 object-cover"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-sm transition">
              Change
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            title="Upload profile image"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImageChange(e.target.files[0]);
              }
            }}
          />

          <h1 className="text-xl font-bold mt-4">
            {formData.name || "Your Name"}
          </h1>

          <p className="text-purple-400">@{formData.username || "username"}</p>

          <p className="text-gray-400 mt-3 text-center md:text-left">
            {formData.bio || "Developer 🚀"}
          </p>
        </div>

        {/* RIGHT FORM */}
        <div className="md:col-span-3">
          <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-gray-400">Name</label>

              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-[#0f0f13] border-[#1c1c24]"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-400">
                Username
              </label>

              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="bg-[#0f0f13] border-[#1c1c24]"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-400">Bio</label>

              <Textarea
                rows={4}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="bg-[#0f0f13] border-[#1c1c24]"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-400">
                Avatar URL
              </label>

              <Input
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="bg-[#0f0f13] border-[#1c1c24]"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? <Loader /> : "Update Profile"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
