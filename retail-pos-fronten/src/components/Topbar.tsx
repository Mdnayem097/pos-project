"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Moon,
  Plus,
  Store,
  Sun,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchCounters } from "@/lib/api";

export default function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [openCountersCount, setOpenCountersCount] = useState<number>(0);
  const [closedCountersCount, setClosedCountersCount] = useState<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    async function checkCounters() {
      try {
        const counters = await fetchCounters();
        if (counters && counters.length > 0) {
          const activeCounters = counters.filter((c) => c.isActive);
          const open = activeCounters.filter((c) => c.isOpen).length;
          const closed = activeCounters.filter((c) => !c.isOpen).length;
          setOpenCountersCount(open);
          setClosedCountersCount(closed);
        }
      } catch {}
    }
    checkCounters();

    function handleCounterUpdate() {
      checkCounters();
    }
    window.addEventListener("counter-state-updated", handleCounterUpdate);
    window.addEventListener("focus", handleCounterUpdate);
    return () => {
      window.removeEventListener("counter-state-updated", handleCounterUpdate);
      window.removeEventListener("focus", handleCounterUpdate);
    };
  }, [pathname]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  const pageInfo = useMemo(() => {
    if (pathname === "/pos") return { module: "Sales", title: "Point of Sale" };
    if (pathname === "/products") return { module: "Catalog", title: "Products" };
    if (pathname === "/inventory") return { module: "Catalog", title: "Inventory" };
    if (pathname === "/orders") return { module: "Sales", title: "Orders & Invoices" };
    if (pathname === "/counters") return { module: "Sales", title: "POS Counters" };
    if (pathname === "/returns") return { module: "Sales", title: "Return Orders" };
    if (pathname === "/customers") return { module: "People", title: "Customers" };
    if (pathname === "/users") return { module: "Access Control", title: "Admin Users" };
    if (pathname === "/roles") return { module: "Access Control", title: "Roles & Permissions" };
    return { module: "Overview", title: "Dashboard" };
  }, [pathname]);

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 sm:gap-4 border-b border-stone-200/80 bg-stone-100/90 dark:border-[#1F293D] dark:bg-[#0B0F19]/90 px-3 sm:px-5 lg:px-7 py-2 sm:py-2.5 backdrop-blur transition-colors duration-200">
      {/* Left: Dynamic Location Breadcrumbs & Store Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Brand / Menu Button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("toggle-mobile-sidebar"));
            }
          }}
          className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-xs lg:hidden active:scale-95 transition"
          title="Open Full Navigation Menu"
        >
          <Store size={17} strokeWidth={2.4} />
        </button>

        {/* Page Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
          <span className="font-medium text-stone-500 dark:text-slate-400 hidden md:inline truncate">{pageInfo.module}</span>
          <ChevronRight size={13} className="text-stone-300 dark:text-slate-500 hidden md:inline shrink-0" />
          <h1 className="font-bold text-stone-900 dark:text-white truncate text-xs sm:text-sm">
            {pageInfo.title}
          </h1>
        </div>

        {/* Branch & Date Badge */}
        <div className="hidden xl:flex items-center gap-2 rounded-lg bg-white dark:bg-[#111827] px-2.5 py-1 text-xs border border-stone-200/70 dark:border-[#1F293D] text-stone-600 dark:text-slate-300 shadow-2xs">
          <span className="flex items-center gap-1.5 font-medium text-stone-700 dark:text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Main Branch
          </span>
          <span className="text-stone-300 dark:text-slate-500">•</span>
          <span className="text-stone-500 dark:text-slate-400 text-[11px] font-mono">{todayStr}</span>
        </div>
      </div>

      {/* Right: Quick Actions & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Counter Status: Compact Open & Closed counters count with full responsiveness */}
        <Link
          href="/counters"
          className="inline-flex items-center gap-1 sm:gap-2 rounded-lg border border-stone-200 bg-white dark:border-[#1F293D] dark:bg-[#111827] px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-medium text-stone-700 dark:text-slate-200 shadow-2xs transition hover:border-brand-400 hover:text-brand-600 shrink-0"
          title={`POS Counters: ${openCountersCount} Open, ${closedCountersCount} Closed (Click to manage)`}
        >
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                openCountersCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-stone-300 dark:bg-stone-600"
              }`}
            />
            <span className="font-bold text-stone-900 dark:text-white">{openCountersCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hidden sm:inline">Open</span>
          </span>
          <span className="text-stone-300 dark:text-slate-500 mx-0.5">·</span>
          <span className="flex items-center gap-1 sm:gap-1.5">
            <span className="h-2 w-2 rounded-full bg-stone-400 dark:bg-stone-500" />
            <span className="font-bold text-stone-700 dark:text-slate-300">{closedCountersCount}</span>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 hidden sm:inline">Closed</span>
          </span>
        </Link>

        {/* New Sale Button */}
        <Link
          href="/pos"
          className="inline-flex h-8 sm:h-auto items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-600 active:translate-y-px shrink-0"
          title="Start New Sale (POS)"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">New Sale</span>
        </Link>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-stone-200 dark:bg-stone-700 mx-0.5" />

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="relative grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 hover:text-stone-900 dark:border-[#1F293D] dark:bg-[#111827] dark:text-slate-300 dark:hover:bg-[#162035] dark:hover:text-white shadow-2xs shrink-0 active:scale-95"
        >
          {theme === "dark" ? (
            <Sun size={15} className="text-amber-400" />
          ) : (
            <Moon size={15} className="text-stone-600" />
          )}
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50 hover:text-stone-800 dark:border-[#1F293D] dark:bg-[#111827] dark:text-slate-400 dark:hover:bg-[#162035] dark:hover:text-stone-200 shadow-2xs shrink-0"
        >
          <Bell size={15} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 ring-2 ring-white dark:ring-stone-800" />
        </button>

        {/* User Profile Menu */}
        {user && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-stone-200 bg-white dark:border-[#1F293D] dark:bg-[#111827] p-1 sm:pr-2.5 text-xs font-medium text-stone-700 dark:text-slate-200 shadow-2xs transition hover:border-brand-400"
              title={`${user.name} (${user.role})`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-500 text-xs font-bold text-white shadow-2xs shrink-0">
                {initials}
              </span>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="font-semibold text-stone-900 dark:text-white text-xs truncate max-w-[110px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-slate-400 uppercase font-medium">
                  {user.role}
                </span>
              </div>
              <ChevronDown size={14} className="text-stone-400 ml-0.5 hidden sm:block shrink-0" />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-stone-200 bg-white dark:border-[#1F293D] dark:bg-[#111827] p-1.5 shadow-xl dark:shadow-black/60 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setProfileOpen(false)}
              >
                <div className="border-b border-stone-100 dark:border-[#1F293D] px-3 py-2.5">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">{user.name}</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                  <span className="mt-1.5 inline-block rounded bg-brand-50 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                    {user.role}
                  </span>
                </div>

                {/* Switch theme directly in profile too */}
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-stone-700 dark:text-slate-200 transition hover:bg-stone-100 dark:hover:bg-[#162035]/60"
                >
                  <span className="flex items-center gap-2">
                    {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
                    <span>Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400">Toggle</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
