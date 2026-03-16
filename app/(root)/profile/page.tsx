import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/app/actions/userAction";
import Image from "next/image";
import Link from "next/link";
import ProfileTabs from "@/components/profile/ProfileTabs";

interface Repo {
  name: string;
  description: string;
  tech: string;
  date?: string;
}

interface Post {
  title: string;
  content: string;
  date?: string;
}

const repos: Repo[] = [
  {
    name: "Code-Zone",
    description: "Developer platform for sharing coding projects",
    tech: "Next.js • Prisma • PostgreSQL",
    date: "2026-03-10",
  },
  {
    name: "AI Chat App",
    description: "AI chat interface with OpenAI API",
    tech: "React • Node • OpenAI",
    date: "2026-03-05",
  },
];

const posts: Post[] = [
  {
    title: "How to build a Next.js app",
    content: "Guide for building fullstack apps with Next.js",
    date: "2026-03-12",
  },
  {
    title: "Prisma tips",
    content: "Useful tips for Prisma ORM",
    date: "2026-03-01",
  },
];

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Not authenticated
      </div>
    );
  }

  const currentUserResult = await getCurrentUser();

  if (!currentUserResult.success || !currentUserResult.user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading profile...
      </div>
    );
  }

  const user = currentUserResult.user;

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">

          <aside className="lg:col-span-1 flex flex-col items-center lg:items-center text-center">

            <Image
              src={user.image || "/icons/profile-placeholder.svg"}
              width={140}
              height={140}
              alt="profile"
              priority
              sizes="140px"
              className="rounded-full border-2 border-purple-500"
            />

            <h1 className="text-xl sm:text-2xl font-bold mt-4">
              {user.name || user.username}
            </h1>

            <p className="text-purple-400">@{user.username}</p>

            <p className="text-gray-400 mt-3 max-w-xs">
              {user.bio || "Developer 🚀"}
            </p>

            <div className="flex gap-6 mt-4 text-sm text-gray-400 justify-center">
              <span>
                <b className="text-white">120</b> Followers
              </span>

              <span>
                <b className="text-white">80</b> Following
              </span>
            </div>

            <Link
              href="/profile/edit"
              className="mt-5 w-full sm:w-auto px-6 bg-purple-600 hover:bg-purple-700 transition py-2 rounded-lg text-center"
            >
              Edit Profile
            </Link>

          </aside>

          <main className="lg:col-span-3 w-full flex justify-center">

            <div className="w-full max-w-4xl">
              <ProfileTabs posts={posts} repos={repos} />
            </div>

          </main>

        </div>

      </div>
    </div>
  );
}