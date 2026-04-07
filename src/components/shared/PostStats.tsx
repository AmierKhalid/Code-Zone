import { Models } from "appwrite";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { checkIsLiked } from "@/lib/utils";
import {
  useLikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
} from "@/lib/react-query/queries";

type PostStatsProps = {
  post: Models.Document;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const location = useLocation();
  
  // Handling Likes
  const likesList = post.likes 
    ? (Array.isArray(post.likes) 
        ? post.likes.map((user: Models.Document | string) => 
            typeof user === 'string' ? user : user.$id
          )
        : [])
    : [];

  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false); // حالة إظهار قائمة الشير

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavePost } = useDeleteSavedPost();
  const { data: currentUser } = useGetCurrentUser();

  const savedPostRecord = currentUser?.save?.find(
    (record: Models.Document) => {
      const recordPostId = typeof record.post === 'string' 
        ? record.post 
        : record.post?.$id;
      return recordPostId === post.$id;
    }
  );

  useEffect(() => {
    const newLikesList = post.likes 
      ? (Array.isArray(post.likes) 
          ? post.likes.map((user: Models.Document | string) => 
              typeof user === 'string' ? user : user.$id
            )
          : [])
      : [];
    setLikes(newLikesList);
  }, [post.likes]);

  useEffect(() => {
    setIsSaved(!!savedPostRecord);
  }, [currentUser, savedPostRecord]);

  const handleLikePost = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    e.stopPropagation();
    let likesArray = [...likes];
    if (likesArray.includes(userId)) {
      likesArray = likesArray.filter((Id) => Id !== userId);
    } else {
      likesArray.push(userId);
    }
    setLikes(likesArray);
    likePost({ postId: post.$id, likesArray });
  };

  const handleSavePost = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    e.stopPropagation();
    if (savedPostRecord) {
      setIsSaved(false);
      deleteSavePost(savedPostRecord.$id);
    } else {
      setIsSaved(true);
      savePost({ userId: userId, postId: post.$id });
    }
  };

  // ميزة الشير
  const postUrl = `${window.location.origin}/posts/${post.$id}`;
  
  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(postUrl);
    alert("Link copied to clipboard! 🔗");
    setShowShareMenu(false);
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Check out this post on Code-Zone: ${postUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    setShowShareMenu(false);
  };

  const containerStyles = location.pathname.startsWith("/profile") ? "w-full" : "";

  return (
    <div className={`flex justify-between items-center z-20 ${containerStyles}`}>
      {/* الجزء الخاص باللايك */}
      <div className="flex gap-2 mr-5">
        <img
          src={`${checkIsLiked(likes, userId) ? "/assets/icons/liked.svg" : "/assets/icons/like.svg"}`}
          alt="like"
          width={20}
          height={20}
          onClick={handleLikePost}
          className="cursor-pointer"
        />
        <p className="small-medium lg:base-medium">{likes.length}</p>
      </div>

      {/* الجزء الخاص بالشير والسيف */}
      <div className="flex gap-2 items-center relative">
        
        {/* أيقونة الشير */}
        <div className="relative">
          <img
            src="/assets/icons/share.svg"
            alt="share"
            width={20}
            height={20}
            className="cursor-pointer mr-2 opacity-80 hover:opacity-100 transition"
            onClick={(e) => {
              e.stopPropagation();
              setShowShareMenu(!showShareMenu);
            }}
          />

          {/* قائمة الشير المنبثقة (Modal-like Menu) */}
          {showShareMenu && (
            <div className="absolute bottom-10 right-0 bg-dark-3 border border-dark-4 p-2 rounded-lg shadow-2xl z-50 min-w-[140px] flex flex-col gap-1">
              <button 
                onClick={handleCopyLink}
                className="flex items-center gap-2 p-2 hover:bg-dark-4 rounded-md transition text-left"
              >
                <p className="small-medium text-light-1">Copy Link</p>
              </button>
              <button 
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2 p-2 hover:bg-dark-4 rounded-md transition text-left"
              >
                <p className="small-medium text-light-1">WhatsApp</p>
              </button>
            </div>
          )}
        </div>

        {/* أيقونة السيف */}
        <img
          src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
          alt="save"
          width={20}
          height={20}
          className="cursor-pointer"
          onClick={handleSavePost}
        />
      </div>
    </div>
  );
};

export default PostStats;