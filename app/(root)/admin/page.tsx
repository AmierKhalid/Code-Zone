import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { isAdminAuth } from "@/app/actions/adminActions";
import AdminDashboardClient from "@/components/shared/admin/AdminDashboardClient";

export const metadata = {
  title: "Admin Panel | Code-Zone",
  description: "System admin control board for managing Code-Zone platform.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAuthorized = await isAdminAuth();

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh] p-6 bg-dark-1">
        <div className="max-w-md w-full bg-dark-2 rounded-2xl border border-red/20 p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(255,90,90,0.05)]">
          <div className="w-16 h-16 rounded-full bg-red/10 border border-red/30 flex items-center justify-center text-red mb-6 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-light-1 tracking-tight mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-light-3 mb-8 max-w-[280px]">
            You do not have administrative privileges to access the Code-Zone control center.
          </p>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-dark-4 hover:bg-dark-3 text-light-2 hover:text-light-1 text-sm font-semibold rounded-xl border border-dark-4 transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden bg-dark-1">
      <AdminDashboardClient />
    </div>
  );
}
