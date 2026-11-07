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
  const isPosPage = pathname === "/pos";

  // Role / permission route guards
  useEffect(() => {
    if (!isLoading && user) {
      // Permission-based route guards:
      if (
        pathname === "/products" &&
        !hasPermission("products:view") &&
        !hasPermission("products:read") &&
        !hasPermission("products:manage")
      ) {
        router.replace(hasPermission("pos:access") ? "/pos" : "/");
      }
      if (
        pathname === "/inventory" &&
        !hasPermission("inventory:view") &&
        !hasPermission("inventory:read") &&
        !hasPermission("inventory:manage")
      ) {
        router.replace(hasPermission("pos:access") ? "/pos" : "/");
      }
      if (
        pathname === "/users" &&
        !hasPermission("users:view") &&
        !hasPermission("users:manage")
      ) {
        router.replace("/");
      }
      if (
        pathname === "/roles" &&
        !hasPermission("roles:view") &&
        !hasPermission("roles:manage")
      ) {
        router.replace("/");
      }
    }
  }, [isLoading, user, pathname, router, hasPermission]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-stone-50 dark:bg-[#0B0F19]">{children}</main>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FFF5EE] dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20 animate-pulse">
            <span className="font-display text-xl font-bold">POS</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] max-h-screen w-full max-w-full overflow-hidden bg-stone-100 dark:bg-[#0B0F19] text-stone-900 dark:text-slate-100 print:min-h-0 print:h-auto print:max-h-none print:bg-white print:overflow-visible print:block">
      {user?.mustChangePassword && <ChangePasswordModal forced={true} />}
      <div className="print:hidden shrink-0 h-full">
        <Sidebar />
      </div>
      <div className="flex min-w-0 max-w-full flex-1 flex-col h-full overflow-hidden print:h-auto print:overflow-visible print:block">
        <div className="print:hidden shrink-0 z-20">
          <Topbar />
        </div>
        <main
          className={`flex-1 w-full max-w-full min-w-0 print:p-0 print:m-0 print:w-full overflow-x-hidden ${
            isPosPage
              ? "p-2 sm:p-3 lg:px-4 lg:py-2 pb-24 lg:pb-2 h-full min-h-0 flex flex-col overflow-y-auto custom-scrollbar"
              : "px-3 pb-28 pt-4 sm:pt-6 sm:px-4 lg:px-[25px] lg:pb-10 overflow-y-auto"
          }`}
        >
          <div className={`w-full max-w-full min-w-0 ${isPosPage ? "h-full flex-1 flex flex-col min-h-0" : ""}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
