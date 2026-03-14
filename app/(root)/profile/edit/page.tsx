"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success("Profile updated!");
      router.push(`/profile/${user.id}`);
    } else {
      toast.error(result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-4 gap-10">

        {/* LEFT PROFILE PREVIEW */}
        <div className="col-span-1">

          <img
            src={formData.image || "/avatar.png"}
            className="w-32 h-32 rounded-full border-2 border-purple-500"
          />

          <h1 className="text-xl font-bold mt-4">
            {formData.name || "Your Name"}
          </h1>

          <p className="text-purple-400">
            @{formData.username || "username"}
          </p>

          <p className="text-gray-400 mt-3">
            {formData.bio || "Developer 🚀"}
          </p>

        </div>


        {/* RIGHT FORM */}
        <div className="col-span-3">

          <h1 className="text-2xl font-bold mb-6">
            Edit Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm mb-2 text-gray-400">
                Name
              </label>
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
              <label className="block text-sm mb-2 text-gray-400">
                Bio
              </label>
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
