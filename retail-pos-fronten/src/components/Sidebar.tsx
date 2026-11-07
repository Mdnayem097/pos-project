"use client";

import { useEffect, useState } from "react";
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
  LogOut,
  Shield,
  Menu,
  RotateCcw,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user, hasPermission, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Listen for toggle event from Topbar on mobile
  useEffect(() => {
    function handleToggle() {
      setMobileDrawerOpen((prev) => !prev);
    }
    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-mobile-sidebar", handleToggle);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Permission checks based on backend ROLE_PERMISSIONS
  const canViewDashboard = hasPermission("dashboard:view");
  const canViewProducts = hasPermission("products:read") || hasPermission("products:manage") || hasPermission("products:view");
  const canViewInventory = hasPermission("inventory:read") || hasPermission("inventory:manage") || hasPermission("inventory:view");
  const canViewOrders = hasPermission("orders:read") || hasPermission("orders:manage") || hasPermission("orders:view");
  const canViewPos = hasPermission("pos:access");
  const canViewCounters = hasPermission("counters:read") || hasPermission("counters:manage") || hasPermission("counters:view");
  const canViewReturns = hasPermission("returns:read") || hasPermission("returns:manage") || hasPermission("returns:view");
  const canViewCustomers = hasPermission("customers:read") || hasPermission("customers:manage") || hasPermission("customers:view");
  const canViewUsers = hasPermission("users:view");
  const canViewRoles = hasPermission("roles:view");

  // Determine user initials
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  const roleBadgeColor =
    user?.role === "admin"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : user?.role === "manager"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-[#fae5d7] dark:border-[#1F293D] bg-[#FFF5EE] dark:bg-[#0B0F19] text-stone-700 dark:text-slate-300 lg:flex transition-colors duration-200">
        {/* Header / Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#fae5d7]/80 dark:border-[#1F293D] shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white shadow-sm">
            <Store size={20} strokeWidth={2.4} />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none text-stone-900 dark:text-white">
              Retail POS
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">Main Branch</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar" aria-label="Main">
          {/* Dashboard Link - Filtered by permission */}
          {canViewDashboard && (
            <Link
              href="/"
              aria-current={isActive("/") ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive("/")
                  ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                  : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              {isActive("/") && (
                <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
              )}
              <LayoutDashboard size={19} className={isActive("/") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
              Dashboard
            </Link>
          )}

          {/* Products Link - Filtered by permission */}
          {canViewProducts && (
            <Link
              href="/products"
              aria-current={isActive("/products") ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive("/products")
                  ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                  : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              {isActive("/products") && (
                <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
              )}
              <Package size={19} className={isActive("/products") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
              Products
            </Link>
          )}

          {/* Inventory Link - Filtered by permission */}
          {canViewInventory && (
            <Link
              href="/inventory"
              aria-current={isActive("/inventory") ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive("/inventory")
                  ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                  : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              {isActive("/inventory") && (
                <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
              )}
              <Boxes size={19} className={isActive("/inventory") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
              Inventory
            </Link>
          )}

          {/* Section: SALES */}
          {(canViewOrders || canViewPos || canViewCounters || canViewReturns || canViewCustomers) && (
            <div className="pt-4 pb-1">
              <div className="flex items-center gap-2 px-3 pb-2 text-[11px] font-bold tracking-wider text-brand-700/80 dark:text-brand-400 uppercase">
                <span>SALES</span>
                <span className="h-px flex-1 bg-[#fae5d7] dark:bg-[#131B2B]" />
              </div>

              {/* Orders Dropdown */}
              {(canViewOrders || canViewPos || canViewCounters || canViewReturns) && (
                <div>
                  <button
                    type="button"
                    onClick={() => setOrdersOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 dark:text-slate-300 transition hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart size={19} className="text-stone-500 dark:text-slate-400" />
                      <span className="font-semibold text-stone-900 dark:text-white">Orders</span>
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
                      {canViewOrders && (
                        <Link
                          href="/orders"
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                            pathname === "/orders" || pathname === "/sales"
                              ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                              : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                          }`}
                        >
                          <ArrowRight
                            size={14}
                            className={
                              pathname === "/orders" || pathname === "/sales"
                                ? "text-brand-500"
                                : "text-stone-400 dark:text-slate-500"
                            }
                          />
                          <span>All Orders</span>
                        </Link>
                      )}

                      {/* POS Sale */}
                      {canViewPos && (
                        <Link
                          href="/pos"
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                            pathname === "/pos"
                              ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                              : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ArrowRight
                              size={14}
                              className={pathname === "/pos" ? "text-brand-500" : "text-stone-400 dark:text-slate-500"}
                            />
                            <span>POS Sale</span>
                          </div>
                          <ExternalLink size={13} className="text-stone-400 dark:text-slate-500" />
                        </Link>
                      )}

                      {/* POS Counters */}
                      {canViewCounters && (
                        <Link
                          href="/counters"
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                            pathname === "/counters"
                              ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                              : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                          }`}
                        >
                          <ArrowRight
                            size={14}
                            className={
                              pathname === "/counters" ? "text-brand-500" : "text-stone-400 dark:text-slate-500"
                            }
                          />
                          <span>POS Counters</span>
                        </Link>
                      )}

                      {/* Return Orders */}
                      {canViewReturns && (
                        <Link
                          href="/returns"
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                            pathname === "/returns"
                              ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                              : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                          }`}
                        >
                          <ArrowRight
                            size={14}
                            className={
                              pathname === "/returns" ? "text-brand-500" : "text-stone-400 dark:text-slate-500"
                            }
                          />
                          <span>Return Orders</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Customers */}
              {canViewCustomers && (
                <div className="mt-1">
                  <Link
                    href="/customers"
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive("/customers")
                        ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                        : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users
                        size={19}
                        className={isActive("/customers") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"}
                      />
                      <span>Customers</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-400 dark:text-slate-500" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Section: ACCESS CONTROL */}
          {(canViewUsers || canViewRoles) && (
            <div className="pt-4 pb-1">
              <div className="flex items-center gap-2 px-3 pb-2 text-[11px] font-bold tracking-wider text-brand-700/80 dark:text-brand-400 uppercase">
                <span>ACCESS CONTROL</span>
                <span className="h-px flex-1 bg-[#fae5d7] dark:bg-[#131B2B]" />
              </div>

              {canViewUsers && (
                <Link
                  href="/users"
                  aria-current={isActive("/users") ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive("/users")
                      ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                      : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  {isActive("/users") && (
                    <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
                  )}
                  <Users
                    size={19}
                    className={isActive("/users") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"}
                  />
                  <span>Admin Users</span>
                </Link>
              )}

              {canViewRoles && (
                <Link
                  href="/roles"
                  aria-current={isActive("/roles") ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive("/roles")
                      ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-sm border border-[#fae5d7] dark:border-[#1F293D]"
                      : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  {isActive("/roles") && (
                    <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
                  )}
                  <Shield
                    size={19}
                    className={isActive("/roles") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"}
                  />
                  <span>Roles & Perms</span>
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="border-t border-[#fae5d7] dark:border-[#1F293D] bg-[#FFF5EE] dark:bg-[#0B0F19] p-3 shrink-0">
          <div className="flex items-center justify-between rounded-xl border border-[#fae5d7] dark:border-[#1F293D] bg-white dark:bg-[#131B2B] p-2.5 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 dark:bg-brand-500/15 text-xs font-bold text-brand-800 dark:text-brand-200">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-stone-900 dark:text-white leading-tight">
                  {user?.name || "Retail Staff"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold border ${roleBadgeColor}`}
                  >
                    {user?.role || "Staff"}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Online" />
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => logout()}
              title="Logout from POS"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (All Sidebar Options) */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[#fae5d7] dark:border-[#1F293D] bg-[#FFF5EE] dark:bg-[#0B0F19] text-stone-700 dark:text-slate-300 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#fae5d7]/80 dark:border-[#1F293D] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-xs">
                  <Store size={20} strokeWidth={2.4} />
                </span>
                <div>
                  <p className="font-display text-base font-bold leading-none text-stone-900 dark:text-white">
                    Retail POS
                  </p>
                  <p className="mt-1 text-[11px] text-stone-500 dark:text-slate-400">Main Branch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-stone-200/60 dark:hover:bg-[#162035] hover:text-stone-700 dark:hover:text-stone-200"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Mobile Navigation Drawer">
              {/* Dashboard */}
              {canViewDashboard && (
                <Link
                  href="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive("/")
                      ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                      : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  <LayoutDashboard size={19} className={isActive("/") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                  <span>Dashboard</span>
                </Link>
              )}

              {/* Products */}
              {canViewProducts && (
                <Link
                  href="/products"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive("/products")
                      ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                      : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  <Package size={19} className={isActive("/products") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                  <span>Products</span>
                </Link>
              )}

              {/* Inventory */}
              {canViewInventory && (
                <Link
                  href="/inventory"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive("/inventory")
                      ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                      : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  <Boxes size={19} className={isActive("/inventory") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                  <span>Inventory</span>
                </Link>
              )}

              {/* Sales Section */}
              <div className="pt-3 pb-1">
                <div className="flex items-center gap-2 px-3 pb-1.5 text-[10px] font-bold tracking-wider text-brand-700/80 dark:text-brand-400 uppercase">
                  <span>SALES</span>
                  <span className="h-px flex-1 bg-[#fae5d7] dark:bg-[#131B2B]" />
                </div>

                {canViewOrders && (
                  <Link
                    href="/orders"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive("/orders")
                        ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                        : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                    }`}
                  >
                    <ShoppingCart size={18} className={isActive("/orders") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                    <span>All Orders</span>
                  </Link>
                )}

                {canViewPos && (
                  <Link
                    href="/pos"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive("/pos")
                        ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                        : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                    }`}
                  >
                    <Receipt size={18} className={isActive("/pos") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                    <span>POS Terminal</span>
                  </Link>
                )}

                {canViewCounters && (
                  <Link
                    href="/counters"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive("/counters")
                        ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                        : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                    }`}
                  >
                    <Store size={18} className={isActive("/counters") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                    <span>POS Counters</span>
                  </Link>
                )}

                {canViewReturns && (
                  <Link
                    href="/returns"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive("/returns")
                        ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                        : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                    }`}
                  >
                    <RotateCcw size={18} className={isActive("/returns") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                    <span>Return Orders</span>
                  </Link>
                )}

                {canViewCustomers && (
                  <Link
                    href="/customers"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive("/customers")
                        ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                        : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                    }`}
                  >
                    <Users size={18} className={isActive("/customers") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                    <span>Customers</span>
                  </Link>
                )}
              </div>

              {/* Access Control */}
              {(canViewUsers || canViewRoles) && (
                <div className="pt-3 pb-1">
                  <div className="flex items-center gap-2 px-3 pb-1.5 text-[10px] font-bold tracking-wider text-brand-700/80 dark:text-brand-400 uppercase">
                    <span>ACCESS CONTROL</span>
                    <span className="h-px flex-1 bg-[#fae5d7] dark:bg-[#131B2B]" />
                  </div>

                  {canViewUsers && (
                    <Link
                      href="/users"
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        isActive("/users")
                          ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                          : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                      }`}
                    >
                      <Users size={18} className={isActive("/users") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                      <span>Admin Users</span>
                    </Link>
                  )}

                  {canViewRoles && (
                    <Link
                      href="/roles"
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        isActive("/roles")
                          ? "bg-white dark:bg-[#131B2B] text-brand-700 dark:text-brand-400 font-semibold shadow-xs border border-[#fae5d7] dark:border-[#1F293D]"
                          : "text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-[#131B2B]/70 hover:text-stone-900 dark:hover:text-stone-100"
                      }`}
                    >
                      <Shield size={18} className={isActive("/roles") ? "text-brand-500" : "text-stone-400 dark:text-slate-500"} />
                      <span>Roles & Perms</span>
                    </Link>
                  )}
                </div>
              )}
            </nav>

            {/* Theme Toggle Button inside Mobile Drawer */}
            <div className="border-t border-[#fae5d7] dark:border-[#1F293D] bg-[#FFF5EE] dark:bg-[#0B0F19] px-3 pt-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl border border-[#fae5d7] dark:border-[#1F293D] bg-white dark:bg-[#131B2B] p-2.5 text-xs font-semibold text-stone-700 dark:text-stone-200 shadow-xs"
              >
                <span className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Sun size={16} className="text-amber-400" />
                  ) : (
                    <Moon size={16} className="text-stone-600 dark:text-slate-300" />
                  )}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </span>
                <span className="rounded bg-brand-50 dark:bg-brand-500/15/50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                  Switch
                </span>
              </button>
            </div>

            {/* Mobile Footer with User Profile and Logout */}
            <div className="border-t border-[#fae5d7] dark:border-[#1F293D] bg-[#FFF5EE] dark:bg-[#0B0F19] p-3">
              <div className="flex items-center justify-between rounded-xl border border-[#fae5d7] dark:border-[#1F293D] bg-white dark:bg-[#131B2B] p-2.5 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 dark:bg-brand-500/15 text-xs font-bold text-brand-800 dark:text-brand-200">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-stone-900 dark:text-white leading-tight">
                      {user?.name || "Retail Staff"}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-slate-400 uppercase font-medium">
                      {user?.role || "Staff"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logout();
                  }}
                  title="Logout"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Clean 4-Column Mobile Bottom Navigation: Home, POS, Stock, and Menu */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#fae5d7] dark:border-[#1F293D] bg-[#FFF5EE]/95 dark:bg-[#0B0F19]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden shadow-lg transition-colors duration-200"
      >
        {/* 1. Home */}
        <Link
          href="/"
          aria-current={isActive("/") ? "page" : undefined}
          className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
            isActive("/")
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </Link>

        {/* 2. POS */}
        <Link
          href="/pos"
          aria-current={isActive("/pos") ? "page" : undefined}
          className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
            isActive("/pos")
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <Receipt size={20} />
          <span>POS</span>
        </Link>

        {/* 3. Stock */}
        <Link
          href="/inventory"
          aria-current={isActive("/inventory") ? "page" : undefined}
          className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
            isActive("/inventory")
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <Boxes size={20} />
          <span>Stock</span>
        </Link>

        {/* 4. Menu / More - Opens Full Sidebar Drawer */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen((prev) => !prev)}
          className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
            mobileDrawerOpen
              ? "text-brand-600 dark:text-brand-400 font-bold"
              : "text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
