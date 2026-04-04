"use client";

import { useState } from "react";
import { likePost, savePost } from "@/lib/actions"; 
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";

interface PostButtonsProps {
  postId: string;
  initialLikes: number;
  userId: string;
  isLikedInitially?: boolean;
  isSavedInitially?: boolean;
}

export default function PostButtons({ 
  postId, 
  initialLikes, 
  userId,
  isLikedInitially = false,
  isSavedInitially = false
}: PostButtonsProps) {
  
  const [isLiked, setIsLiked] = useState(isLikedInitially);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isSaved, setIsSaved] = useState(isSavedInitially);

  // حجم ثابت وموحد لجميع الأيقونات
  const ICON_SIZE = 24; 
  const STROKE_WIDTH = 2; // سمك الخط موحد

  const handleLike = async () => {
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikesCount(prev => (newStatus ? prev + 1 : prev - 1));
    try {
      await likePost(postId, userId);
    } catch (error) {
      setIsLiked(!newStatus);
      setLikesCount(prev => (!newStatus ? prev + 1 : prev - 1));
    }
  };

  const handleSave = async () => {
    const newSaveStatus = !isSaved;
    setIsSaved(newSaveStatus);
    try {
      await savePost(postId, userId);
    } catch (error) {
      setIsSaved(!newSaveStatus);
    }
  };

  return (
    <div className="flex flex-col w-full bg-white px-4 pb-4">
      
      {/* خط فاصل خفيف جداً */}
      <div className="w-full h-[1px] bg-gray-50 mb-4" />

      <div className="flex items-center justify-between w-full">
        
        {/* الجانب الأيسر: الأيقونات */}
        <div className="flex items-center gap-5">
          
          {/* زر اللايك + الرقم */}
          <div className="flex items-center gap-1.5 min-w-[45px]"> 
            <button 
              onClick={handleLike}
              className="flex items-center justify-center hover:opacity-70 transition-opacity outline-none"
            >
              <Heart 
                size={ICON_SIZE} 
                strokeWidth={STROKE_WIDTH}
                style={{
                  fill: isLiked ? "#ef4444" : "transparent",
                  color: isLiked ? "#ef4444" : "#374151",
                }}
              />
            </button>
            <span className={`text-sm font-bold w-4 ${isLiked ? "text-red-500" : "text-gray-900"}`}>
              {likesCount}
            </span>
          </div>

          {/* زر الكومنت */}
          <button className="flex items-center justify-center text-gray-700 hover:text-black transition-colors outline-none">
            <MessageCircle size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
          </button>

          {/* زر المشاركة */}
          <button className="flex items-center justify-center text-gray-700 hover:text-black transition-colors outline-none">
            <Send size={ICON_SIZE} strokeWidth={STROKE_WIDTH} />
          </button>
        </div>

        {/* الجانب الأيمن: زر الحفظ */}
        <button 
          onClick={handleSave} 
          className="flex items-center justify-center outline-none"
        >
          <Bookmark 
            size={ICON_SIZE} 
            strokeWidth={STROKE_WIDTH}
            className={`transition-all duration-200 ${
              isSaved 
                ? "fill-blue-600 text-blue-600" 
                : "text-gray-700 hover:text-black"
            }`} 
          />
        </button>
      </div>
    </div>
  );
}