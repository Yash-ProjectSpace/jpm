'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "MANAGER") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading" || (status === "authenticated" && (session?.user as any)?.role !== "MANAGER")) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

 // THE FOOLPROOF SHELL
  return (
    // THE FIX: A simple flex row.
    <div className="flex min-h-screen bg-slate-50">
      
      {/* 1. The Sticky Sidebar */}
      <AdminSidebar />
      
      {/* 2. The Main Content Area */}
      {/* flex-1 tells it to fill the remaining space. min-w-0 prevents overflow bugs */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
      
    </div>
  );
}