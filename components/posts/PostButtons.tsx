"use client";
import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { likePost, toggleSavePost } from "@/lib/actions";
import { getPostLikers } from "@/app/actions/userAction";
import FollowersModal from "@/components/profile/FollowersModal";

interface PostButtonsProps {
  postId: string;
  initialLikes: number;
  userId: string;
  initialIsLiked: boolean;
  initialIsSaved: boolean;
}

export default function PostButtons({ 
  postId, 
  initialLikes, 
  userId, 
  initialIsLiked, 
  initialIsSaved 
}: PostButtonsProps) {
  
  const [likesCount, setLikesCount] = useState(initialLikes || 0);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);
  const [likersList, setLikersList] = useState<any[]>([]);

  // 1. دالة عرض المتابعين (محسنة)
  const handleShowLikers = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (likesCount <= 0) return; 

    const list = await getPostLikers(postId);
    setLikersList(list);
    setIsLikersModalOpen(true);
  };

  // 2. دالة عمل اللايك (محسنة لتحديث القائمة)
  const handleLike = async () => {
    const newStatus = !isLiked;
    
    // تحديث واجهة المستخدم فوراً (Optimistic Update)
    setIsLiked(newStatus);
    setLikesCount(prev => (newStatus ? prev + 1 : Math.max(0, prev - 1)));
    
    try {
      await likePost(postId, userId);
      
      // تحديث قائمة الأشخاص في المودال لو كان مفتوح عشان اسمك يظهر فوراً
      if (isLikersModalOpen) {
        const updatedList = await getPostLikers(postId);
        setLikersList(updatedList);
      }
    } catch (error) {
      // تراجع عن التغييرات لو حصل خطأ في السيرفر
      setIsLiked(!newStatus);
      setLikesCount(prev => (!newStatus ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleSave = async () => {
    const newSaveStatus = !isSaved;
    setIsSaved(newSaveStatus);
    try {
      await toggleSavePost(postId, userId);
    } catch (error) {
      setIsSaved(!newSaveStatus);
    }
  };

  return (
    <div className="flex flex-col w-full px-2">
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-6 items-center">
          
          {/* زر القلب مع عدد اللايكات جنبه */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleLike} 
              className={`transition-all duration-300 active:scale-90 ${isLiked ? 'text-red-500' : 'text-purple-500'}`}
            >
              <Heart 
                size={22} 
                fill={isLiked ? "#ef4444" : "none"} 
                stroke={isLiked ? "#ef4444" : "currentColor"}
                strokeWidth={2.5} 
              />
            </button>
            
            {/* عدد اللايكات - جنب القلب وممكن نضغط عليه */}
            <span 
              onClick={handleShowLikers}
              className={`text-sm font-bold transition-all ${
                likesCount > 0 ? "cursor-pointer hover:text-white text-zinc-400" : "text-zinc-500"
              }`}
            >
              {likesCount}
            </span>
          </div>

          {/* زر الكومنت */}
          <button className="text-purple-500 hover:text-purple-400 transition-colors">
            <MessageCircle size={22} strokeWidth={2.5} />
            <span className="sr-only">Comment</span>
          </button>
          
          {/* زر الشير */}
          <button className="text-purple-500 hover:text-purple-400 transition-colors">
            <Share2 size={22} strokeWidth={2.5} />
            <span className="sr-only">Share</span>
          </button>
        </div>

        {/* زر السيف */}
        <button 
          onClick={handleSave} 
          className={`transition-all duration-300 active:scale-90 ${isSaved ? 'text-purple-400' : 'text-purple-500'}`}
        >
          <Bookmark size={22} fill={isSaved ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>
      </div>

      {/* المودال الخاص بعرض المعجبين */}
      <FollowersModal 
        isOpen={isLikersModalOpen} 
        onClose={() => setIsLikersModalOpen(false)} 
        title="Liked by" 
        users={likersList} 
      />
    </div>
  );
}