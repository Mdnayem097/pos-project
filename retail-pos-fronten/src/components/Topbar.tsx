"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, LogOut, Search, ShoppingCart, Store, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-stone-100/85 px-3 py-3 backdrop-blur sm:px-4 lg:px-[25px]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500 text-stone-950 lg:hidden">
        <Store size={19} strokeWidth={2.4} />
      </span>

      <div className="relative max-w-md flex-1">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="search"
          aria-label="Search"
          placeholder="Search products, invoices, customers"
          className="input pl-10"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/counters"
          className="hidden items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 transition hover:border-brand-500 hover:text-brand-700 md:flex"
          title="Manage POS Counters & Shifts"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Counter 1 open
        </Link>
        <Link href="/pos" className="btn-primary">
          <ShoppingCart size={17} />
          <span className="hidden sm:inline">New sale</span>
        </Link>
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg border border-stone-300 bg-white p-2.5 text-stone-600 transition hover:bg-stone-50"
        >
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
        </button>

        {/* User profile dropdown pill */}
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-1.5 pr-2.5 text-xs font-medium text-stone-700 transition hover:border-brand-400"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-500 text-xs font-bold text-white">
                {initials}
              </span>
              <span className="hidden font-semibold sm:inline">{user.name.split(" ")[0]}</span>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-xl"
                onMouseLeave={() => setProfileOpen(false)}
              >
                <div className="border-b border-stone-100 px-3 py-2">
                  <p className="text-xs font-bold text-stone-900">{user.name}</p>
                  <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                  <span className="mt-1 inline-block rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-stone-600">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
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
