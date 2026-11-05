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
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [ordersOpen, setOrdersOpen] = useState(true);
  const { user, hasPermission, logout } = useAuth();

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
          {/* Dashboard Link - Filtered by permission */}
          {canViewDashboard && (
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
          )}

          {/* Products Link - Filtered by permission */}
          {canViewProducts && (
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
          )}

          {/* Inventory Link - Filtered by permission */}
          {canViewInventory && (
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
          )}

          {/* Section: SALES */}
          {(canViewOrders || canViewPos || canViewCounters || canViewReturns || canViewCustomers) && (
            <div className="pt-4 pb-1">
              <div className="flex items-center gap-2 px-3 pb-2 text-[11px] font-bold tracking-wider text-brand-700/80 uppercase">
                <span>SALES</span>
                <span className="h-px flex-1 bg-[#fae5d7]" />
              </div>

              {/* Orders Dropdown */}
              {(canViewOrders || canViewPos || canViewCounters || canViewReturns) && (
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
                      {canViewOrders && (
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
                            className={
                              pathname === "/orders" || pathname === "/sales"
                                ? "text-brand-500"
                                : "text-stone-400"
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
                      )}

                      {/* POS Counters */}
                      {canViewCounters && (
                        <Link
                          href="/counters"
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                            pathname === "/counters"
                              ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                              : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                          }`}
                        >
                          <ArrowRight
                            size={14}
                            className={
                              pathname === "/counters" ? "text-brand-500" : "text-stone-400"
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
                              ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                              : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                          }`}
                        >
                          <ArrowRight
                            size={14}
                            className={
                              pathname === "/returns" ? "text-brand-500" : "text-stone-400"
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
              )}
            </div>
          )}

          {/* Section: ACCESS CONTROL */}
          {(canViewUsers || canViewRoles) && (
            <div className="pt-4 pb-1">
              <div className="flex items-center gap-2 px-3 pb-2 text-[11px] font-bold tracking-wider text-brand-700/80 uppercase">
                <span>ACCESS CONTROL</span>
                <span className="h-px flex-1 bg-[#fae5d7]" />
              </div>

              {canViewUsers && (
                <Link
                  href="/users"
                  aria-current={isActive("/users") ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive("/users")
                      ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                      : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
                >
                  {isActive("/users") && (
                    <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
                  )}
                  <Users
                    size={19}
                    className={isActive("/users") ? "text-brand-500" : "text-stone-400"}
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
                      ? "bg-white text-brand-700 font-semibold shadow-sm border border-[#fae5d7]"
                      : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                  }`}
                >
                  {isActive("/roles") && (
                    <span className="absolute -left-3 bottom-2 top-2 w-1 rounded-r bg-brand-500" />
                  )}
                  <Shield
                    size={19}
                    className={isActive("/roles") ? "text-brand-500" : "text-stone-400"}
                  />
                  <span>Roles & Perms</span>
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="border-t border-[#fae5d7] bg-[#FFF5EE] p-3">
          <div className="flex items-center justify-between rounded-xl border border-[#fae5d7] bg-white p-2.5 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-stone-900 leading-tight">
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
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-[#fae5d7] bg-[#FFF5EE] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {[
          ...(canViewDashboard ? [{ href: "/", label: "Home", icon: LayoutDashboard }] : []),
          ...(canViewOrders ? [{ href: "/orders", label: "Orders", icon: ShoppingCart }] : []),
          ...(canViewPos ? [{ href: "/pos", label: "POS", icon: Receipt }] : []),
          ...(canViewProducts ? [{ href: "/products", label: "Items", icon: Package }] : []),
          ...(canViewInventory ? [{ href: "/inventory", label: "Stock", icon: Boxes }] : []),
          ...(canViewCustomers ? [{ href: "/customers", label: "People", icon: Users }] : []),
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
