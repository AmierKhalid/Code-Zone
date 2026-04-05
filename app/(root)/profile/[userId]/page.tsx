"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { 
  getProfileData, 
  toggleFollow, 
  getFollowersList, 
  getFollowingList,
  getCurrentUser 
} from "@/app/actions/userAction";
import FollowersModal from "@/components/profile/FollowersModal";
import { Grid3X3, Bookmark, Tag, Plus, Settings } from "lucide-react";

export default function OtherUserProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string; 
  
  const [targetUser, setTargetUser] = useState<any>(null);
  const [currentLoginUser, setCurrentLoginUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [listData, setListData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getProfileData(userId);
        const currentUserRes = await getCurrentUser();

        if (data) {
          setTargetUser(data);
          setIsFollowing(data.isFollowing);
        }
        if (currentUserRes.success) {
          setCurrentLoginUser(currentUserRes.user);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadData();
  }, [userId]);

  const isMe = currentLoginUser?.id === targetUser?.id;

  const openModal = async (type: "Followers" | "Following") => {
    setModalTitle(type);
    setIsModalOpen(true);
    const list = type === "Following" 
      ? await getFollowingList(userId) 
      : await getFollowersList(userId);
    setListData(list.map((u: any) => ({ id: u.id, name: u.name, username: u.username, image: u.image })));
  };

  // --- دالة الفولو المدمجة مع تحديث العداد الفوري (Optimistic Update) ---
  const handleFollow = async () => {
    if (isMe || !targetUser) return;

    const prevStatus = isFollowing;
    
    // 1. تحديث شكل الزرار والعداد فوراً في الواجهة
    setIsFollowing(!prevStatus);
    setTargetUser((prev: any) => ({
      ...prev,
      followersCount: prevStatus 
        ? prev.followersCount - 1  
        : prev.followersCount + 1,
    }));

    try {
      // 2. إرسال الطلب للأكشن في السيرفر
      const result = await toggleFollow(userId);

      if (!result.success) {
        // 3. في حالة فشل السيرفر نرجع الحالة القديمة للعداد والزرار
        setIsFollowing(prevStatus);
        setTargetUser((prev: any) => ({
          ...prev,
          followersCount: prevStatus ? prev.followersCount + 1 : prev.followersCount - 1,
        }));
      }
    } catch (error) {
      // 4. في حالة حدوث خطأ شبكة
      setIsFollowing(prevStatus);
      console.error("Network error during follow:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 animate-pulse text-sm font-bold uppercase tracking-widest">
      Loading...
    </div>
  );
  
  if (!targetUser) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      User not found
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-20 w-full flex justify-center font-sans">
      <div className="w-full max-w-4xl flex flex-col pt-16 px-8">
        
        <div className="flex flex-row items-center md:items-start gap-8 md:gap-14 mb-16">
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-lg">
              <div className="w-full h-full rounded-full border-4 border-black overflow-hidden bg-zinc-900 relative">
                <Image 
                  src={targetUser.image || "/assets/profile.svg"} 
                  alt="profile" 
                  fill 
                  className="object-cover rounded-full" 
                />
              </div>
            </div>
            {isMe && (
              <button 
                onClick={() => router.push("/create-post")} 
                className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 border-4 border-black shadow-xl transition-all transform hover:scale-110 active:scale-95 z-10"
              >
                <Plus size={20} strokeWidth={4} />
              </button>
            )}
          </div>

          <div className="flex flex-col flex-1 gap-5 items-start">
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-white mb-1 leading-none">
                {targetUser.name}
              </h1>
              <p className="text-purple-500 font-semibold text-lg md:text-xl">@{targetUser.username}</p>
            </div>

            <div className="flex gap-10 md:gap-14 py-2">
              <div className="flex flex-col items-center md:items-start">
                <span className="font-black text-xl md:text-2xl">{targetUser.postsCount || 0}</span>
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">posts</span>
              </div>
              <div onClick={() => openModal("Followers")} className="flex flex-col items-center md:items-start cursor-pointer group">
                <span className="font-black text-xl md:text-2xl group-hover:text-purple-500 transition-colors">
                  {targetUser.followersCount || 0}
                </span>
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1 group-hover:text-white transition-colors">followers</span>
              </div>
              <div onClick={() => openModal("Following")} className="flex flex-col items-center md:items-start cursor-pointer group">
                <span className="font-black text-xl md:text-2xl group-hover:text-purple-500 transition-colors">
                  {targetUser.followingCount || 0}
                </span>
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1 group-hover:text-white transition-colors">following</span>
              </div>
            </div>

            <div className="max-w-md min-h-[1.5rem]">
              {targetUser.bio ? (
                <p className="text-sm md:text-base text-zinc-200 leading-relaxed font-medium">{targetUser.bio}</p>
              ) : isMe ? (
                <p className="text-sm md:text-base text-zinc-500 italic font-medium">Add a bio to tell people about yourself...</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3 w-full justify-start mt-2">
              <div className="flex gap-2 w-full max-w-xs md:max-w-sm">
                {isMe ? (
                  <>
                    <button 
                      onClick={() => router.push("/profile/edit")} 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-[13px] md:text-sm font-black uppercase tracking-wider py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-500/20"
                    >
                      Edit Profile
                    </button>
                    <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] md:text-sm font-black uppercase tracking-wider py-4 rounded-xl border border-zinc-800 transition-all active:scale-95">
                      Share
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleFollow} 
                      className={`flex-[2] py-4 rounded-xl text-[13px] md:text-sm font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${
                        isFollowing ? "bg-zinc-900 text-white border border-zinc-800" : "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                    <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] md:text-sm font-black uppercase tracking-wider py-4 rounded-xl border border-zinc-800 transition-all active:scale-95">
                      Message
                    </button>
                  </>
                )}
              </div>
              {isMe && (
                <button 
                  onClick={() => router.push("/settings")} 
                  className="p-3.5 bg-zinc-900/80 rounded-xl hover:bg-zinc-800 transition-all border border-zinc-800 group"
                >
                  <Settings size={24} className="text-zinc-400 group-hover:text-white transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <FollowersModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalTitle} 
        users={listData} 
      />
    </div>
  );
}