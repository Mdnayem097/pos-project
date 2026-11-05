"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Store,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Receipt,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [ordersOpen, setOrdersOpen] = useState(true);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#fae5d7] bg-[#FFF5EE] text-stone-700 lg:flex">
        {/* Header / Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#fae5d7]/80">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white shadow-sm">
            <Store size={20} strokeWidth={2.4} />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none text-stone-900">
              Retail POS
            </p>
            <p className="mt-1 text-xs text-stone-500">Main Branch</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main">
          {/* Main Links */}
          <Link
            href="/"
            aria-current={isActive("/") ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive("/")
                ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            {isActive("/") && (
              <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
            )}
            <LayoutDashboard size={19} className={isActive("/") ? "text-brand-500" : "text-stone-400"} />
            Dashboard
          </Link>

          <Link
            href="/products"
            aria-current={isActive("/products") ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive("/products")
                ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            {isActive("/products") && (
              <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
            )}
            <Package size={19} className={isActive("/products") ? "text-brand-500" : "text-stone-400"} />
            Products
          </Link>

          <Link
            href="/inventory"
            aria-current={isActive("/inventory") ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive("/inventory")
                ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
          >
            {isActive("/inventory") && (
              <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
            )}
            <Boxes size={19} className={isActive("/inventory") ? "text-brand-500" : "text-stone-400"} />
            Inventory
          </Link>

          {/* Section: SALES */}
          <div className="pt-4 pb-1">
            <div className="flex items-center gap-2 px-3 pb-2 text-[11px] font-bold tracking-wider text-brand-700/80 uppercase">
              <span>SALES</span>
              <span className="h-px flex-1 bg-[#fae5d7]" />
            </div>

            {/* Orders Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setOrdersOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200/50 hover:text-stone-900"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart size={19} className="text-stone-500" />
                  <span className="font-semibold text-stone-900">Orders</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-stone-400 transition-transform duration-200 ${
                    ordersOpen ? "" : "-rotate-90"
                  }`}
                />
              </button>

              {ordersOpen && (
                <div className="mt-1 space-y-1 pl-3">
                  {/* All Orders */}
                  <Link
                    href="/orders"
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      pathname === "/orders" || pathname === "/sales"
                        ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                        : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                    }`}
                  >
                    <ArrowRight
                      size={14}
                      className={pathname === "/orders" || pathname === "/sales" ? "text-brand-500" : "text-stone-400"}
                    />
                    <span>All Orders</span>
                  </Link>

                  {/* POS Sale */}
                  <Link
                    href="/pos"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                      pathname === "/pos"
                        ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                        : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ArrowRight
                        size={14}
                        className={pathname === "/pos" ? "text-brand-500" : "text-stone-400"}
                      />
                      <span>POS Sale</span>
                    </div>
                    <ExternalLink size={13} className="text-stone-400" />
                  </Link>

                  {/* POS Counters */}
                  <Link
                    href="/pos"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200/50 hover:text-stone-900"
                  >
                    <ArrowRight size={14} className="text-stone-400" />
                    <span>POS Counters</span>
                  </Link>

                  {/* Return Orders */}
                  <Link
                    href="/orders?status=Cancelled"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200/50 hover:text-stone-900"
                  >
                    <ArrowRight size={14} className="text-stone-400" />
                    <span>Return Orders</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Customers */}
            <div className="mt-1">
              <Link
                href="/customers"
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive("/customers")
                    ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users
                    size={19}
                    className={isActive("/customers") ? "text-brand-500" : "text-stone-400"}
                  />
                  <span>Customers</span>
                </div>
                <ChevronRight size={16} className="text-stone-400" />
              </Link>
            </div>
          </div>
        </nav>

        {/* User / Shift footer */}
        <div className="flex items-center gap-3 border-t border-[#fae5d7] bg-[#FFF5EE] px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
            AD
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">Admin</p>
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Shift open since 09:00
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-[#fae5d7] bg-[#FFF5EE] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {[
          { href: "/", label: "Home", icon: LayoutDashboard },
          { href: "/orders", label: "Orders", icon: ShoppingCart },
          { href: "/pos", label: "POS", icon: Receipt },
          { href: "/products", label: "Items", icon: Package },
          { href: "/inventory", label: "Stock", icon: Boxes },
          { href: "/customers", label: "People", icon: Users },
        ].map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active ? "text-brand-600 font-semibold" : "text-stone-500"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
