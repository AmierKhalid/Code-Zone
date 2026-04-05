"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  getCurrentUser, 
  getProfileData, 
  getFollowingList, 
  getFollowersList 
} from "@/app/actions/userAction";
import FollowersModal from "@/components/profile/FollowersModal";
import { Plus, Grid, Share2, Settings } from "lucide-react"; // مكتبة الأيقونات

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [listData, setListData] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const currentUserRes = await getCurrentUser();
      if (currentUserRes.success && currentUserRes.user) {
        const data = await getProfileData(currentUserRes.user.id);
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleOpenList = async (type: "Followers" | "Following") => {
    setModalTitle(type);
    setIsModalOpen(true);
    const list = type === "Following" 
      ? await getFollowingList(profile.id) 
      : await getFollowersList(profile.id);
    setListData(list || []);
  };

  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen bg-black text-purple-500 font-bold animate-pulse">
      LOADING...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* --- 1. الـ Header (صورة البروفايل + الاسم) --- */}
      <div className="flex flex-col items-center pt-10 px-4">
        
        {/* الصورة مع علامة الـ + الزرقاء */}
        <div className="relative mb-4">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-purple-600">
            <div className="w-full h-full rounded-full border-[3px] border-black overflow-hidden bg-zinc-900">
              <Image 
                src={profile.image || "/assets/profile.svg"} 
                alt="profile" 
                fill 
                className="object-cover" 
              />
            </div>
          </div>
          {/* زرار الـ Plus الأزرق */}
          <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-black hover:scale-110 transition-transform cursor-pointer">
            <Plus size={16} strokeWidth={4} className="text-white" />
          </div>
        </div>

        {/* الاسم واليوزر نيم */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold tracking-tight">{profile.name}</h1>
          <p className="text-zinc-500 text-sm font-medium">@{profile.username}</p>
        </div>

        {/* أزرار التحكم (Edit / Share) */}
        <div className="flex gap-2 w-full max-w-[350px] mb-8">
          <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-2.5 rounded-lg border border-zinc-800 transition-all active:scale-95">
            Edit profile
          </button>
          <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold py-2.5 rounded-lg border border-zinc-800 transition-all active:scale-95">
            Share profile
          </button>
          <button className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
            <Settings size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* --- 2. الـ Stats (العدادات) بنظام ضيق وشيك --- */}
        <div className="flex justify-around w-full max-w-sm py-4 border-y border-zinc-900/50 mb-6">
          <div className="text-center">
            <span className="block font-bold text-lg leading-none">{profile.postsCount || 0}</span>
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">posts</span>
          </div>
          
          <div onClick={() => handleOpenList("Followers")} className="text-center cursor-pointer active:opacity-50">
            <span className="block font-bold text-lg leading-none">{profile.followersCount || 0}</span>
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">followers</span>
          </div>

          <div onClick={() => handleOpenList("Following")} className="text-center cursor-pointer active:opacity-50">
            <span className="block font-bold text-lg leading-none">{profile.followingCount || 0}</span>
            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">following</span>
          </div>
        </div>

        {/* --- 3. الـ Bio (اختياري) --- */}
        {profile.bio && (
          <div className="w-full max-w-sm px-2 mb-8">
            <p className="text-xs text-zinc-400 text-center italic">{profile.bio}</p>
          </div>
        )}

        {/* --- 4. الأيقونات تحت العدادات (Grid View) --- */}
        <div className="w-full max-w-4xl border-t border-zinc-900 flex justify-center py-3">
           <Grid size={20} className="text-white" />
        </div>
      </div>

      {/* المودال الخاص بالمتابعين */}
      <FollowersModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        users={listData}
      />
    </div>
  );
}