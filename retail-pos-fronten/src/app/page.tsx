"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Download,
  Package,
  RotateCcw,
  Shield,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import Badge from "@/components/Badge";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCounters,
  fetchCustomers,
  fetchProducts,
  fetchSales,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  Counter,
  Customer,
  PaymentMethod,
  Product,
  Sale,
} from "@/lib/types";

const statusTone: Record<string, "green" | "amber" | "red" | "stone" | "brand"> = {
  Delivered: "green",
  Completed: "green",
  New: "brand",
  Pending: "amber",
  Refunded: "red",
  Cancelled: "red",
};

const paymentMethods: PaymentMethod[] = ["Cash", "Card", "bKash", "Nagad"];

const paymentColor: Record<PaymentMethod, string> = {
  Cash: "bg-brand-500",
  Card: "bg-stone-900",
  bKash: "bg-brand-300",
  Nagad: "bg-stone-300",
  COD: "bg-emerald-600",
};

const CHART_HEIGHT = 168; // px available for the tallest bar

function initials(name: string) {
  if (name === "Walk-in") return "W";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  // Role permissions checking
  const canViewOrders =
    hasPermission("orders:view") ||
    hasPermission("orders:read") ||
    hasPermission("orders:manage");

  const canViewProducts =
    hasPermission("products:view") ||
    hasPermission("products:read") ||
    hasPermission("products:manage");

  const canViewInventory =
    hasPermission("inventory:view") ||
    hasPermission("inventory:read") ||
    hasPermission("inventory:manage");

  const canViewCustomers =
    hasPermission("customers:view") ||
    hasPermission("customers:read") ||
    hasPermission("customers:manage");

  const canViewCounters =
    hasPermission("counters:view") ||
    hasPermission("counters:read") ||
    hasPermission("counters:manage");

  const canViewReturns =
    hasPermission("returns:view") ||
    hasPermission("returns:read") ||
    hasPermission("returns:manage");

  const canAccessPos = hasPermission("pos:access");

  const canViewUsers =
    hasPermission("users:view") ||
    hasPermission("users:read") ||
    hasPermission("users:manage");

  const canViewRoles =
    hasPermission("roles:view") ||
    hasPermission("roles:read") ||
    hasPermission("roles:manage");

  // State
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [countersList, setCountersList] = useState<Counter[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadPermittedData() {
      try {
        const promises: [
          Promise<Sale[] | null>,
          Promise<Product[] | null>,
          Promise<Customer[] | null>,
          Promise<Counter[] | null>
        ] = [
          canViewOrders ? fetchSales().catch(() => null) : Promise.resolve(null),
          canViewProducts || canViewInventory ? fetchProducts().catch(() => null) : Promise.resolve(null),
          canViewCustomers ? fetchCustomers().catch(() => null) : Promise.resolve(null),
          canViewCounters ? fetchCounters().catch(() => null) : Promise.resolve(null),
        ];

        const [salesData, prodsData, custData, countersData] = await Promise.all(promises);

        if (isMounted) {
          if (salesData) setSalesList(salesData);
          if (prodsData) setProductsList(prodsData);
          if (custData) setCustomersList(custData);
          if (countersData) setCountersList(countersData);
        }
      } catch (err) {
        console.warn("Could not load permitted dashboard data:", err);
      }
    }

    loadPermittedData();

    return () => {
      isMounted = false;
    };
  }, [canViewOrders, canViewProducts, canViewInventory, canViewCustomers, canViewCounters]);

  // Sales computations
  const completed = useMemo(
    () => salesList.filter((s) => s.status === "Completed"),
    [salesList]
  );

  const todaySales = useMemo(
    () => completed.reduce((sum, s) => sum + s.total, 0),
    [completed]
  );

  const paymentSplit = useMemo(
    () =>
      paymentMethods.map((method) => ({
        method,
        amount: completed
          .filter((s) => s.payment === method)
          .reduce((sum, s) => sum + s.total, 0),
      })),
    [completed]
  );

  const pendingCount = useMemo(
    () => salesList.filter((s) => s.status === "Pending").length,
    [salesList]
  );

  const refundedCount = useMemo(
    () => salesList.filter((s) => s.status === "Refunded").length,
    [salesList]
  );

  // Inventory computations
  const lowStock = useMemo(
    () => productsList.filter((p) => p.stock <= p.reorderLevel),
    [productsList]
  );

  // Counters computations
  const openCountersCount = useMemo(
    () => countersList.filter((c) => c.isActive && c.isOpen).length,
    [countersList]
  );

  // Weekly sales chart computation
  const weeklySales = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayName = days[d.getDay()];
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const amount = completed
        .filter((s) => s.date.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total, 0);
      return { day: dayName, amount };
    });
  }, [completed]);

  const maxWeekly = Math.max(1, ...weeklySales.map((d) => d.amount));
  const weeklyTotal = weeklySales.reduce((sum, d) => sum + d.amount, 0);

  // Top best-selling products computation
  const topProducts = useMemo(() => {
    const map = new Map<string, { sold: number; revenue: number }>();
    for (const s of completed) {
      if (!Array.isArray(s.itemsDetail)) continue;
      for (const item of s.itemsDetail) {
        const cur = map.get(item.productName) || { sold: 0, revenue: 0 };
        cur.sold += item.qty;
        cur.revenue += item.total;
        map.set(item.productName, cur);
      }
    }
    return Array.from(map.entries())
      .map(([name, stat]) => ({ name, sold: stat.sold, revenue: stat.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [completed]);

  const maxTop = Math.max(1, ...topProducts.map((p) => p.revenue));

  function exportCSV() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Invoice,Date,Customer,Items,Payment,Status,Total",
        ...salesList.map(
          (s) =>
            `${s.id},"${s.date}","${s.customer}",${s.items},${s.payment},${s.status},${s.total}`
        ),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "store-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Check if any visual metric or widget is permitted
  const hasAnyKpi =
    canViewOrders || canViewCustomers || canViewInventory || canViewProducts || canViewCounters;
  const hasChartsSection = canViewOrders || canViewProducts;
  const hasBottomSection = canViewOrders || canViewInventory || canViewProducts;

  return (
    <div className="space-y-6">
      {/* Header with Personalized User Greeting & Role Badge */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">
              Good afternoon, {user?.name ? user.name.split(" ")[0] : "Admin"}
            </h1>
            {user?.role && (
              <span className="rounded-full bg-brand-50 border border-brand-200/80 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-700 shadow-2xs">
                {user.role}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Store overview tailored specifically to your role permissions.
          </p>
        </div>

        {canViewOrders && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-stone-300 bg-white p-0.5 text-sm font-medium shadow-2xs">
              <button
                type="button"
                aria-pressed="true"
                className="rounded-md bg-stone-900 px-3 py-1.5 text-white"
              >
                Today
              </button>
              <button
                type="button"
                aria-pressed="false"
                className="rounded-md px-3 py-1.5 text-stone-600 hover:text-stone-900"
              >
                7 days
              </button>
              <button
                type="button"
                aria-pressed="false"
                className="rounded-md px-3 py-1.5 text-stone-600 hover:text-stone-900"
              >
                30 days
              </button>
            </div>
            <button
              type="button"
              onClick={exportCSV}
              className="btn-ghost shadow-2xs bg-white border border-stone-200"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Authorized Quick Action Modules Hub */}
      <section aria-label="Permitted Store Modules">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {canAccessPos && (
            <Link
              href="/pos"
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white">
                  <ShoppingCart size={18} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900">POS Sale</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">Billing terminal</p>
              </div>
            </Link>
          )}

          {canViewProducts && (
            <Link
              href="/products"
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  <Package size={18} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900">Products</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">Catalog & items</p>
              </div>
            </Link>
          )}

          {canViewInventory && (
            <Link
              href="/inventory"
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white">
                  <Boxes size={18} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900">Inventory</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">Stock & reorders</p>
              </div>
            </Link>
          )}

          {canViewOrders && (
            <Link
              href="/orders"
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <ShoppingCart size={18} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900">Orders</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">Sales invoices</p>
              </div>
            </Link>
          )}

          {canViewCounters && (
            <Link
              href="/counters"
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-purple-50 text-purple-600 transition group-hover:bg-purple-600 group-hover:text-white">
                  <Store size={18} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-600"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900">POS Counters</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">Shifts & cash drawer</p>
              </div>
            </Link>
          )}

          {canViewReturns && (
            <Link
              href="/returns"
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-600 transition group-hover:bg-rose-600 group-hover:text-white">
                  <RotateCcw size={18} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900">Returns</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">Refund vouchers</p>
              </div>
            </Link>
          )}

          {canViewCustomers && (
            <Link
              href="/customers"
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-teal-600 transition group-hover:bg-teal-600 group-hover:text-white">
                  <Users size={18} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900">Customers</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">Buyer directory</p>
              </div>
            </Link>
          )}

          {(canViewUsers || canViewRoles) && (
            <Link
              href={canViewUsers ? "/users" : "/roles"}
              className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-3.5 shadow-2xs transition hover:border-brand-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <Shield size={18} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600"
                />
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-900">Access Control</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">Users & permissions</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* KPI Numbers Row: Filtered dynamically based on Role Permissions */}
      {hasAnyKpi && (
        <section
          className={`card grid divide-y divide-stone-200 overflow-hidden transition-shadow duration-300 hover:shadow-md ${
            canViewOrders
              ? "sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:divide-x lg:divide-y-0"
          }`}
        >
          {/* Sales Today: Only visible if orders:view */}
          {canViewOrders && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80 sm:col-span-2 lg:col-span-1">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-brand-500" />
              <p className="text-sm font-medium text-stone-500 transition-colors duration-200 group-hover:text-stone-800">
                Sales today
              </p>
              <p className="mt-2 font-display text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight transition-transform duration-200 group-hover:translate-x-0.5">
                {formatCurrency(todaySales)}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
                Live store revenue
              </p>

              <div
                className="mt-4 flex h-2 overflow-hidden rounded-full bg-stone-100 transition-all duration-200 group-hover:ring-1 group-hover:ring-brand-200/60"
                role="img"
                aria-label="Sales by payment method"
              >
                {paymentSplit.map((p) => (
                  <div
                    key={p.method}
                    className={paymentColor[p.method]}
                    style={{ width: `${todaySales > 0 ? (p.amount / todaySales) * 100 : 0}%` }}
                  />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600">
                {paymentSplit.map((p) => (
                  <li
                    key={p.method}
                    className="flex items-center gap-1.5 transition-colors duration-200 group-hover:text-stone-900"
                  >
                    <span
                      className={`h-2 w-2 rounded-sm transition-transform duration-200 group-hover:scale-110 ${paymentColor[p.method]}`}
                    />
                    <span className="text-stone-500">{p.method}</span>
                    <span className="font-semibold tabular-nums text-stone-900">
                      {formatCurrency(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Orders: Only visible if orders:view */}
          {canViewOrders && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-emerald-500" />
              <p className="text-sm font-medium text-stone-500 transition-colors duration-200 group-hover:text-stone-800">
                Orders
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-700">
                {salesList.length}
              </p>
              <p className="mt-1 text-xs text-stone-500 transition-colors duration-200 group-hover:text-stone-700">
                {pendingCount} pending, {refundedCount} refunded
              </p>
            </div>
          )}

          {/* Customers: Only visible if customers:view */}
          {canViewCustomers && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-brand-500" />
              <p className="text-sm font-medium text-stone-500 transition-colors duration-200 group-hover:text-stone-800">
                Customers
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-600">
                {customersList.length}
              </p>
              <p className="mt-1 text-xs text-stone-500 transition-colors duration-200 group-hover:text-stone-700">
                Registered members
              </p>
            </div>
          )}

          {/* Low Stock: Only visible if inventory:view or products:view */}
          {(canViewInventory || canViewProducts) && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-red-500" />
              <p className="text-sm font-medium text-stone-500 transition-colors duration-200 group-hover:text-stone-800">
                Low stock
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-red-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-red-700">
                {lowStock.length}
              </p>
              <p className="mt-1 text-xs text-stone-500 transition-colors duration-200 group-hover:text-stone-700">
                Items below reorder level
              </p>
            </div>
          )}

          {/* POS Counters Status: If user can view counters */}
          {canViewCounters && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-purple-500" />
              <p className="text-sm font-medium text-stone-500 transition-colors duration-200 group-hover:text-stone-800">
                Active Shifts
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-stone-900 transition-all duration-200 group-hover:translate-x-0.5">
                {openCountersCount}
              </p>
              <p className="mt-1 text-xs text-stone-500 transition-colors duration-200 group-hover:text-stone-700">
                Of {countersList.length} store registers
              </p>
            </div>
          )}
        </section>
      )}

      {/* Middle Section: Weekly Sales Chart & Best Sellers */}
      {hasChartsSection && (
        <section
          className={`grid gap-5 ${
            canViewOrders && canViewProducts
              ? "xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {/* Weekly sales chart: Only visible if orders:view */}
          {canViewOrders && (
            <div
              className={`card p-5 transition-all duration-300 hover:shadow-md ${
                canViewProducts ? "xl:col-span-2" : "col-span-1"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Sales, last 7 days</h2>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {formatCurrency(weeklyTotal)} in total
                  </p>
                </div>
                <span className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" />
                  Today so far
                </span>
              </div>

              <div className="mt-6 flex items-end gap-3 sm:gap-5">
                {weeklySales.map((d, i) => {
                  const isToday = i === weeklySales.length - 1;
                  const height =
                    d.amount > 0 ? Math.max(6, Math.round((d.amount / maxWeekly) * CHART_HEIGHT)) : 4;
                  return (
                    <div key={d.day + i} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <span
                        className={`text-xs tabular-nums ${
                          isToday ? "font-semibold text-brand-600" : "text-stone-500"
                        }`}
                      >
                        {d.amount > 0 ? `${(d.amount / 1000).toFixed(1)}k` : "0"}
                      </span>
                      <div
                        className={`w-full rounded-t-md ${isToday ? "bg-brand-500" : "bg-stone-200"}`}
                        style={{ height: `${height}px` }}
                      />
                      <span
                        className={`text-xs ${
                          isToday ? "font-semibold text-stone-900" : "text-stone-500"
                        }`}
                      >
                        {isToday ? "Today" : d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Best sellers: Only visible if products:view or orders:view */}
          {canViewProducts && (
            <div
              className={`card p-5 transition-all duration-300 hover:shadow-md ${
                !canViewOrders ? "col-span-1" : ""
              }`}
            >
              <h2 className="text-lg font-semibold">Best sellers</h2>
              <p className="mt-0.5 text-sm text-stone-500">By revenue this week</p>
              {topProducts.length === 0 ? (
                <p className="mt-12 text-center text-xs text-stone-400">No sales recorded yet</p>
              ) : (
                <ol className="mt-5 space-y-4">
                  {topProducts.map((p, i) => (
                    <li key={p.name}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium">
                          <span className="mr-2 tabular-nums text-stone-400">{i + 1}</span>
                          {p.name}
                        </span>
                        <span className="font-semibold tabular-nums">{formatCurrency(p.revenue)}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full ${i === 0 ? "bg-brand-500" : "bg-stone-800"}`}
                          style={{ width: `${(p.revenue / maxTop) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-stone-500">{p.sold} sold</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>
      )}

      {/* Bottom Section: Recent Orders Table & Low Stock List */}
      {hasBottomSection && (
        <section
          className={`grid gap-5 ${
            canViewOrders && (canViewInventory || canViewProducts)
              ? "xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {/* Recent Orders: Only visible if orders:view */}
          {canViewOrders && (
            <div
              className={`card overflow-hidden transition-all duration-300 hover:shadow-md ${
                canViewInventory || canViewProducts ? "xl:col-span-2" : "col-span-1"
              }`}
            >
              <div className="flex items-center justify-between px-5 py-3">
                <h2 className="text-lg font-semibold">Recent orders</h2>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  View all sales
                </Link>
              </div>
              {/* Mobile View: Clean List (Zero Horizontal Scroll) */}
              <div className="block sm:hidden divide-y divide-stone-100 border-t border-stone-200">
                {salesList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-stone-400">
                    No orders recorded yet
                  </div>
                ) : (
                  salesList.slice(0, 6).map((s) => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
                          {initials(s.customer)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-stone-900">{s.customer}</p>
                          <p className="text-[11px] text-stone-500 font-mono">#{s.id} · {s.payment}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-stone-900 tabular-nums">{formatCurrency(s.total)}</p>
                        <div className="mt-0.5">
                          <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-y border-stone-200 bg-stone-50 text-xs font-medium text-stone-500">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Invoice</th>
                      <th className="px-5 py-2.5 font-medium">Customer</th>
                      <th className="px-5 py-2.5 font-medium">Payment</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                      <th className="px-5 py-2.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {salesList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-stone-400">
                          No orders recorded yet
                        </td>
                      </tr>
                    ) : (
                      salesList.slice(0, 6).map((s) => (
                        <tr key={s.id} className="hover:bg-stone-50">
                          <td className="px-5 py-3 font-medium tabular-nums">{s.id}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-7 w-7 place-items-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600">
                                {initials(s.customer)}
                              </span>
                              {s.customer}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-stone-600">{s.payment}</td>
                          <td className="px-5 py-3">
                            <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold tabular-nums">
                            {formatCurrency(s.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Low Stock List: Only visible if inventory:view or products:view */}
          {(canViewInventory || canViewProducts) && (
            <div
              className={`card p-5 transition-all duration-300 hover:shadow-md ${
                !canViewOrders ? "col-span-1" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Low stock</h2>
                <Link
                  href="/inventory"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Open inventory
                </Link>
              </div>
              {lowStock.length === 0 ? (
                <p className="mt-12 text-center text-xs text-stone-400">
                  All products are well-stocked
                </p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {lowStock.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-xl">
                        {p.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="shrink-0 text-xs font-semibold tabular-nums text-red-600">
                            {p.stock} left
                          </p>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{
                              width: `${Math.min(100, (p.stock / p.reorderLevel) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                          Reorder at {p.reorderLevel}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {/* Fallback state if user role has no analytics permissions at all */}
      {!hasAnyKpi && !hasChartsSection && !hasBottomSection && (
        <div className="card p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
            <Shield size={24} />
          </span>
          <h3 className="font-bold text-stone-900 text-base">Restricted Analytics View</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
            Your assigned role does not have permission to view store financial metrics or inventory analytics. Please use your permitted action modules above to proceed.
          </p>
        </div>
      )}
    </div>
  );
}
