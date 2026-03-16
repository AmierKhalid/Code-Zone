"use client";

import { useState } from "react";

interface Repo {
  name: string;
  description: string;
  tech: string;
}

interface Post {
  title: string;
  content: string;
}

interface Props {
  posts: Post[];
  repos: Repo[];
}

export default function ProfileTabs({ posts, repos }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "repos" | "posts">(
    "overview"
  );

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-6 overflow-x-auto border-b border-gray-800 pb-3 text-sm">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab("repos")}
          className={`pb-2 whitespace-nowrap ${
            activeTab === "repos"
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Repositories
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-2 whitespace-nowrap ${
            activeTab === "posts"
              ? "text-purple-400 border-b-2 border-purple-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Posts
        </button>
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24]">
            <p className="text-gray-400 text-sm">Repositories</p>
            <h2 className="text-2xl font-bold mt-1">{repos.length}</h2>
          </div>

          <div className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24]">
            <p className="text-gray-400 text-sm">Posts</p>
            <h2 className="text-2xl font-bold mt-1">{posts.length}</h2>
          </div>
        </div>
      )}

      {/* Repositories */}
      {activeTab === "repos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {repos.map((repo, i) => (
            <div
              key={i}
              className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24] hover:border-purple-500 transition"
            >
              <h3 className="font-semibold text-lg">{repo.name}</h3>
              <p className="text-gray-400 text-sm mt-2">{repo.description}</p>
              <div className="mt-3 text-xs text-purple-400">{repo.tech}</div>
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {activeTab === "posts" && (
        <div className="mt-10 space-y-4">
          {posts.map((post, i) => (
            <div
              key={i}
              className="bg-[#0f0f13] p-5 rounded-xl border border-[#1c1c24]"
            >
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{post.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}