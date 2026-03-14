import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/app/actions/userAction";
import Image from "next/image";
import Link from "next/link";

export default async function ProfilePage() {
  const { userId } = await auth();

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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* LEFT PROFILE */}
          <aside className="lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left">

            <Image
              src={user.image || "/icons/profile-placeholder.svg"}
              width={140}
              height={140}
              alt="profile"
              className="rounded-full border-2 border-purple-500"
            />

            <h1 className="text-xl sm:text-2xl font-bold mt-4">
              {user.name || user.username}
            </h1>

            <p className="text-purple-400">@{user.username}</p>

            <p className="text-gray-400 mt-3 max-w-xs">
              {user.bio || "Developer 🚀"}
            </p>

            {/* Stats */}
            <div className="flex gap-6 mt-4 text-sm text-gray-400">
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

          {/* RIGHT CONTENT */}
          <main className="lg:col-span-3">

            {/* Tabs */}
            <div className="flex gap-6 overflow-x-auto border-b border-gray-800 pb-3 text-sm scrollbar-hide">

              <button className="text-purple-400 border-b-2 border-purple-500 pb-2 whitespace-nowrap">
                Overview
              </button>

              <button className="text-gray-400 hover:text-white whitespace-nowrap">
                Repositories
              </button>

              <button className="text-gray-400 hover:text-white whitespace-nowrap">
                Projects
              </button>

            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">

              <div className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24]">
                <p className="text-gray-400 text-sm">Repositories</p>
                <h2 className="text-2xl font-bold mt-1">12</h2>
              </div>

              <div className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24]">
                <p className="text-gray-400 text-sm">Projects</p>
                <h2 className="text-2xl font-bold mt-1">5</h2>
              </div>

              <div className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24]">
                <p className="text-gray-400 text-sm">Stars</p>
                <h2 className="text-2xl font-bold mt-1">34</h2>
              </div>

            </div>

            {/* Repositories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">

              <div className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24] hover:border-purple-500 transition">

                <h3 className="font-semibold text-lg">
                  Code-Zone
                </h3>

                <p className="text-gray-400 text-sm mt-2">
                  Developer platform for sharing coding projects
                </p>

                <div className="mt-3 text-xs text-purple-400">
                  Next.js • Prisma • PostgreSQL
                </div>

              </div>

              <div className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24] hover:border-purple-500 transition">

                <h3 className="font-semibold text-lg">
                  AI Chat App
                </h3>

                <p className="text-gray-400 text-sm mt-2">
                  AI chat interface with OpenAI API
                </p>

                <div className="mt-3 text-xs text-purple-400">
                  React • Node • OpenAI
                </div>

              </div>

            </div>

          </main>

        </div>
      </div>
    </div>
  );
}
