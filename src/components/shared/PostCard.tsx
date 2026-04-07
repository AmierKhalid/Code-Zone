import { useState, useRef, useEffect } from "react";
import { Models } from "appwrite";
import { Link } from "react-router-dom";
import { multiFormatDateString, getProfileImageUrl } from "../../lib/utils";
import { useUserContext } from "@/context/AuthContext";
import PostStats from "./PostStats";

type PostCardProps = {
  post: Models.Document;
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();
  
  // --- UI STATES ---
  const [showComments, setShowComments] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const quickEmojis = ["🔥", "🚀", "❤️", "💻", "👏", "😮"];

  // --- HANDLERS ---
  const addEmoji = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  // Auto-scroll to comments when opened
  useEffect(() => {
    if (showComments && commentSectionRef.current) {
      commentSectionRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
    }
  }, [showComments]);

  if (!post.creator) return null;

  return (
    <div className="post-card group p-5 md:p-7 border border-dark-4 bg-dark-2/50 backdrop-blur-sm rounded-[30px] w-full max-w-5xl transition-all hover:shadow-lg">
      
      {/* HEADER: User Info & Post Metadata */}
      <div className="flex-between mb-5">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creator.$id}`}>
            <img
              src={getProfileImageUrl(post.creator) || "/assets/icons/profile-placeholder.svg"}
              alt="creator"
              className="w-12 h-12 rounded-full object-cover border-2 border-primary-500/20"
            />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className="base-medium lg:body-bold text-light-1">
                {post.creator.name}
              </p>
              <img src="/assets/icons/verify.svg" width={14} height={14} alt="verified" />
            </div>
            <div className="flex items-center gap-2 text-light-3">
              <p className="subtle-semibold lg:small-regular opacity-70">
                {multiFormatDateString(post.$createdAt)}
              </p>
              {post.location && (
                <p className="subtle-semibold lg:small-regular opacity-70">
                  • {post.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button: Visible only to post owner */}
        <Link
          to={`/update-post/${post.$id}`}
          className={`${user.id !== post.creator.$id && "hidden"} p-2 hover:bg-dark-4 rounded-full transition`}>
          <img src={"/assets/icons/edit.svg"} alt="edit" width={20} height={20} className="opacity-70" />
        </Link>
      </div>

      {/* CONTENT: Caption, Tags & Main Image */}
      <Link to={`/posts/${post.$id}`}>
        <div className="small-medium lg:base-medium mb-4">
          <p className="text-light-1 leading-relaxed">{post.caption}</p>
          <ul className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag: string, index: number) => (
              tag !== "" && (
                <li key={`${tag}${index}`} className="text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full text-[12px]">
                  #{tag}
                </li>
              )
            ))}
          </ul>
        </div>

        {/* Post Image with Loading State handling */}
        <div className="relative overflow-hidden rounded-[24px] border border-dark-4 bg-dark-3 w-full">
          {isImageLoading && (
            <div className="absolute inset-0 flex justify-center items-center bg-dark-3 z-10 min-h-[200px]">
              <div className="w-10 h-10 border-4 border-t-primary-500 border-r-transparent border-b-primary-500 border-l-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={post.imageUrl || post["image-url"] || "/assets/images/profile-placeholder.svg"}
            alt="post image"
            className={`w-full h-auto max-h-[600px] object-contain transition-opacity duration-700 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsImageLoading(false)}
          />
        </div>
      </Link>

      {/* ACTIONS: Like, Save & Comment Toggle */}
      <div className="mt-6 flex items-center gap-4">
        <PostStats post={post} userId={user.id} />
        
        {/* Comment toggle button */}
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition bg-dark-3/50 px-4 py-2 rounded-full border border-dark-4"
          onClick={() => setShowComments(!showComments)}
        >
          <img src="/assets/icons/chat.svg" alt="comment" width={20} height={20} />
          <p className="small-medium lg:base-medium text-light-3">0</p>
        </div>
      </div>

      {/* COMMENTS SECTION: Interactive Input & Emojis */}
      {showComments && (
        <div 
          ref={commentSectionRef} 
          className="mt-5 pt-5 border-t border-dark-4/50 animate-in fade-in slide-in-from-top-2"
        >
          {/* Quick Emoji Bar */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => { e.preventDefault(); addEmoji(emoji); }}
                className="bg-dark-4 hover:bg-primary-500/20 px-3 py-1 rounded-full border border-dark-4 transition text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Comment Input Field */}
          <div className="flex items-center gap-3">
            <img 
              src={user.imageUrl || "/assets/icons/profile-placeholder.svg"} 
              className="w-9 h-9 rounded-full object-cover border border-dark-4" 
              alt="user profile"
            />
            <div className="flex-1 flex items-center bg-dark-3 rounded-2xl px-4 py-2 border border-dark-4 focus-within:border-primary-500 transition-all">
              <input 
                type="text" 
                autoFocus 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب تعليقك هنا..." 
                className="bg-transparent border-none text-light-1 text-[14px] flex-1 outline-none text-right"
              />
              <button className="text-primary-500 font-bold text-[14px] ml-3 hover:text-white transition">
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;