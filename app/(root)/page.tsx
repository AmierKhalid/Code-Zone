import React from 'react'
import { prisma } from "@/lib/prisma" 
import PostButtons from '@/components/posts/PostButtons'
import Image from 'next/image'
import { auth } from "@clerk/nextjs/server"

const Page = async () => {
  // 1. الحصول على معرف المستخدم من Clerk (مرة واحدة فقط)
  const { userId: clerkId } = await auth(); 

  // التحقق من تسجيل الدخول
  if (!clerkId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p className="text-xl font-bold animate-pulse">Please sign in to see posts.</p>
      </div>
    );
  }

  // 2. جلب بيانات اليوزر من الداتابيز باستخدام accountId (الاسم الموجود في السكيما)
  const currentUser = await prisma.user.findUnique({
    where: { accountId: clerkId } 
  });

  // المعرف الخاص باليوزر داخل الداتابيز (الذي نستخدمه في العلاقات)
  const userId = currentUser?.id || "";

  // 3. جلب البوستات مع العلاقات (المؤلف، اللايكات، السيفز)
  const posts = await prisma.post.findMany({
    include: { 
      author: true,
      likes: {
        select: { userId: true } 
      },
      saves: {
        select: { userId: true }
      },
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-10">
        {posts.length === 0 ? (
           <p className="text-zinc-500 text-center">No posts available yet.</p>
        ) : (
          posts.map((post) => {
            // التحقق من حالة اللايك والسيف لليوزر الحالي
            const isLiked = post.likes.some((like) => like.userId === userId);
            const isSaved = post.saves.some((save) => save.userId === userId);

            return (
              <div key={post.id} className="w-full bg-[#0f0f0f] border border-gray-800 rounded-3xl p-8 shadow-2xl transition-all hover:border-zinc-700">
                
                {/* الرأس (Avatar + Name) */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-purple-900 relative overflow-hidden">
                    {post.author?.image ? (
                      <Image 
                        src={post.author.image} 
                        alt="avatar" 
                        fill 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs">No Img</div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100 tracking-tight">
                      {post.author?.name || "Anonymous User"}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">
                      Public • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* المحتوى النصي والتاجات */}
                <div className="px-2 mb-6">
                  <p className="text-white text-xl font-medium leading-relaxed mb-3">
                    {post.caption}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {post.tags?.map((tag: string, index: number) => (
                      <span key={index} className="text-purple-500 text-sm font-black tracking-wide">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* الميديا (الصورة) */}
                {post.mediaUrl && (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-800 mb-6 bg-black">
                    <Image 
                      src={post.mediaUrl} 
                      alt="post content" 
                      fill 
                      className="object-contain" 
                      unoptimized 
                    />
                  </div>
                )}

                {/* أزرار التفاعل */}
                <div className="pt-2">
                  <PostButtons 
                    postId={post.id} 
                    initialLikes={post.likes.length} 
                    userId={userId} 
                    initialIsLiked={isLiked} 
                    initialIsSaved={isSaved} 
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Page;