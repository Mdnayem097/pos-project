"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, hasPermission } = useAuth();
  const isLoginPage = pathname === "/login";

  // Role / permission route guards
  useEffect(() => {
    if (!isLoading && user) {
      // If Cashier tries to open Dashboard, Products or Inventory
      if (
        user.role === "cashier" &&
        (pathname === "/" || pathname === "/products" || pathname === "/inventory")
      ) {
        router.replace("/pos");
      }
    }
  }, [isLoading, user, pathname, router]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-stone-50">{children}</main>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF5EE]">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20 animate-pulse">
            <span className="font-display text-xl font-bold">POS</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-100">
      {user?.mustChangePassword && <ChangePasswordModal forced={true} />}
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-3 pb-28 pt-6 sm:px-4 lg:px-[25px] lg:pb-10">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
