import React from 'react'
import { prisma } from "@/lib/prisma"
import PostButtons from '@/components/posts/PostButtons'

const Page = async () => {
  // معرف المستخدم الحالي (تأكدي أنه نفس المعرف الموجود في قاعدة البيانات)
  const currentUserId = "cmnikoyrj00005kt4ax35efo8";

  // جلب البوستات مع العلاقات اللازمة
  const posts = await prisma.post.findMany({
    include: {
      author: true,
      likes: true, // جلب قائمة اللايكات للتأكد من حالة القلب
      saves: true, // جلب قائمة السيف للتأكد من حالة الحفظ
    },
    orderBy: {
      createdAt: 'desc' 
    }
  })

  return (
    <div className="min-h-screen flex flex-col items-center p-10 bg-white text-black">
      <h1 className="text-2xl font-bold mb-8 text-black tracking-tight">POSTS</h1>

      <div className="w-full max-w-2xl space-y-6">
        {posts.map((post) => {
          // المنطق السحري: هل المستخدم الحالي قام بعمل لايك لهذا البوست؟
          const hasLiked = post.likes.some(like => like.userId === currentUserId);
          
          // هل المستخدم الحالي قام بحفظ هذا البوست؟
          const hasSaved = post.saves.some(save => save.userId === currentUserId);

          return (
            <div key={post.id} className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>
                
                <div className="text-sm text-gray-500 font-medium">
                  By: <span className="text-gray-900">{post.author?.name || "Anonymous user"}</span>
                </div>
              </div>

              {/* مكون الأزرار مع تمرير الحالات الحقيقية القادمة من Prisma */}
              <PostButtons 
                postId={post.id} 
                userId={currentUserId}
                initialLikes={post.likesCount ?? 0} 
                isLikedInitially={hasLiked} 
                isSavedInitially={hasSaved}
              />
            </div>
          );
        })}

        {posts.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium italic">No posts yet..!!!!!!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Page