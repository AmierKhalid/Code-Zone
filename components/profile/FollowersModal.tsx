"use client";

import Image from "next/image";
import { X } from "lucide-react"; // تأكدي إنك منزلة lucide-react أو استخدمي أي أيقونة قفل
import Link from "next/link";

interface UserInfo {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // "Followers" أو "Following"
  users: UserInfo[];
}

export default function FollowersModal({ isOpen, onClose, title, users }: FollowersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-900">
          <h3 className="text-xl font-black italic uppercase tracking-tighter text-purple-500">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Users List */}
        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          {users.length > 0 ? (
            users.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 hover:bg-zinc-900/50 rounded-3xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* User Image */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-zinc-800">
                    <Image 
                      src={user.image || "/icons/profile-placeholder.svg"} 
                      alt={user.name || "User"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* User Info */}
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm group-hover:text-purple-400 transition-colors">
                      {user.name || "Anonymous User"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      @{user.username || "username"}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Link 
                  href={`/profile/${user.id}`}
                  onClick={onClose}
                  className="bg-zinc-900 hover:bg-purple-600 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl border border-zinc-800 hover:border-purple-500 transition-all"
                >
                  View Profile
                </Link>
              </div>
            ))
          ) : (
            <div className="py-10 text-center flex flex-col items-center gap-2">
              <p className="text-zinc-600 font-bold">No {title.toLowerCase()} yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}