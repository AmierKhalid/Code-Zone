"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { searchUsers } from "@/app/actions/userAction";
import { Input } from "@/components/ui/input"; // بنستخدم الـ UI اللي عندك

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        setLoading(true);
        const users = await searchUsers(searchTerm);
        setResults(users);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300); // بنستنى 300ms عشان ميعملش سيرش مع كل حرف يكتبه (Performance)

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-black text-white p-6 w-full">
      <div className="max-w-2xl mx-auto pt-10">
        <h1 className="text-3xl font-black mb-8 tracking-tighter">Explore</h1>

        {/* حقل البحث */}
        <div className="relative mb-10">
          <Input
            placeholder="Search by name or @username..."
            className="bg-[#0A0A0A] border-zinc-800 rounded-2xl py-7 pl-6 focus:border-purple-600 transition-all text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* عرض النتائج */}
        <div className="space-y-4">
          {loading && <p className="text-zinc-500 animate-pulse text-center">Searching...</p>}
          
          {!loading && results.length > 0 && results.map((user) => (
            <Link 
              key={user.id} 
              href={`/profile/${user.id}`} // المسار اللي اتفقنا عليه لبروفايلات الآخرين
              className="flex items-center gap-4 p-4 bg-[#0A0A0A] border border-zinc-900 rounded-[1.5rem] hover:bg-zinc-900 transition-all group"
            >
              <div className="relative w-14 h-14 rounded-full border-2 border-purple-600/30 p-0.5 group-hover:border-purple-600 transition-all">
                <Image
                  src={user.image || "/icons/profile-placeholder.svg"}
                  alt={user.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <p className="font-black text-white group-hover:text-purple-400 transition-colors">{user.name}</p>
                <p className="text-zinc-500 text-sm font-medium">@{user.username}</p>
              </div>
              <div className="ml-auto text-purple-600 opacity-0 group-hover:opacity-100 transition-all pr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </Link>
          ))}

          {!loading && searchTerm && results.length === 0 && (
            <p className="text-center text-zinc-600 mt-10">No users found for "{searchTerm}"</p>
          )}
        </div>
      </div>
    </div>
  );
}