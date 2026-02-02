"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const logout = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  return (
   <div className="justify-center">
  <button
    onClick={logout}
    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
  >
    Logout
  </button>
 
</div>
  );
};

export default LogoutButton;
