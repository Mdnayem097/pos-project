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
  const hasAnyQuickAction =
    canAccessPos ||
    canViewProducts ||
    canViewInventory ||
    canViewOrders ||
    canViewCounters ||
    canViewReturns ||
    canViewCustomers;
  const hasChartsSection = canViewOrders || canViewProducts;
  const hasBottomSection = canViewOrders || canViewInventory || canViewProducts;

  const kpiCount =
    (canViewOrders ? 2 : 0) +
    (canViewCustomers ? 1 : 0) +
    (canViewInventory || canViewProducts ? 1 : 0) +
    (canViewCounters ? 1 : 0);

  let kpiGridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  if (kpiCount === 5) {
    kpiGridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
  } else if (kpiCount === 4) {
    kpiGridCols = "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4";
  } else if (kpiCount === 3) {
    kpiGridCols = "grid-cols-1 sm:grid-cols-3 lg:grid-cols-3";
  } else if (kpiCount === 2) {
    kpiGridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2";
  }

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
              <span className="rounded-full bg-brand-50 border border-brand-200/80 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-700 shadow-2xs dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400">
                {user.role}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
            Store overview tailored specifically to your role permissions.
          </p>
        </div>

        {canViewOrders && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-stone-300 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-0.5 text-sm font-medium shadow-2xs">
              <button
                type="button"
                aria-pressed="true"
                className="rounded-md bg-stone-900 dark:bg-brand-500 px-3 py-1.5 text-white shadow-xs transition"
              >
                Today
              </button>
              <button
                type="button"
                aria-pressed="false"
                className="rounded-md px-3 py-1.5 text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white transition"
              >
                7 days
              </button>
              <button
                type="button"
                aria-pressed="false"
                className="rounded-md px-3 py-1.5 text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white transition"
              >
                30 days
              </button>
            </div>
            <button
              type="button"
              onClick={exportCSV}
              className="btn-ghost shadow-2xs bg-white dark:bg-[#111827] border border-stone-200 dark:border-[#1F293D] dark:text-slate-200 dark:hover:bg-[#162035]"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Authorized Quick Action Modules Hub */}
      {hasAnyQuickAction && (
        <section aria-label="Permitted Store Modules">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {canAccessPos && (
              <Link
                href="/pos"
                className="group flex flex-col justify-between rounded-xl border border-stone-200/80 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-3.5 shadow-2xs transition hover:border-brand-500/50 hover:shadow-md dark:hover:border-brand-500/50 dark:hover:bg-[#162035]/60"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 transition group-hover:bg-brand-500 group-hover:text-white dark:group-hover:text-white">
                    <ShoppingCart size={18} />
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-stone-300 dark:text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">POS Sale</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">Billing terminal</p>
                </div>
              </Link>
            )}

            {canViewProducts && (
              <Link
                href="/products"
                className="group flex flex-col justify-between rounded-xl border border-stone-200/80 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-3.5 shadow-2xs transition hover:border-blue-500/50 hover:shadow-md dark:hover:border-blue-500/50 dark:hover:bg-[#162035]/60"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition group-hover:bg-blue-600 group-hover:text-white dark:group-hover:text-white">
                    <Package size={18} />
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-stone-300 dark:text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">Products</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">Catalog & items</p>
                </div>
              </Link>
            )}

            {canViewInventory && (
              <Link
                href="/inventory"
                className="group flex flex-col justify-between rounded-xl border border-stone-200/80 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-3.5 shadow-2xs transition hover:border-amber-500/50 hover:shadow-md dark:hover:border-amber-500/50 dark:hover:bg-[#162035]/60"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition group-hover:bg-amber-600 group-hover:text-white dark:group-hover:text-white">
                    <Boxes size={18} />
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-stone-300 dark:text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600 dark:group-hover:text-amber-400"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">Inventory</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">Stock & reorders</p>
                </div>
              </Link>
            )}

            {canViewOrders && (
              <Link
                href="/orders"
                className="group flex flex-col justify-between rounded-xl border border-stone-200/80 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-3.5 shadow-2xs transition hover:border-emerald-500/50 hover:shadow-md dark:hover:border-emerald-500/50 dark:hover:bg-[#162035]/60"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:text-white">
                    <ShoppingCart size={18} />
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-stone-300 dark:text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">Orders</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">Sales invoices</p>
                </div>
              </Link>
            )}

            {canViewCounters && (
              <Link
                href="/counters"
                className="group flex flex-col justify-between rounded-xl border border-stone-200/80 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-3.5 shadow-2xs transition hover:border-purple-500/50 hover:shadow-md dark:hover:border-purple-500/50 dark:hover:bg-[#162035]/60"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 transition group-hover:bg-purple-600 group-hover:text-white dark:group-hover:text-white">
                    <Store size={18} />
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-stone-300 dark:text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">POS Counters</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">Shifts & cash drawer</p>
                </div>
              </Link>
            )}

            {canViewReturns && (
              <Link
                href="/returns"
                className="group flex flex-col justify-between rounded-xl border border-stone-200/80 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-3.5 shadow-2xs transition hover:border-rose-500/50 hover:shadow-md dark:hover:border-rose-500/50 dark:hover:bg-[#162035]/60"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition group-hover:bg-rose-600 group-hover:text-white dark:group-hover:text-white">
                    <RotateCcw size={18} />
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-stone-300 dark:text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600 dark:group-hover:text-rose-400"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">Returns</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">Refund vouchers</p>
                </div>
              </Link>
            )}

            {canViewCustomers && (
              <Link
                href="/customers"
                className="group flex flex-col justify-between rounded-xl border border-stone-200/80 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-3.5 shadow-2xs transition hover:border-teal-500/50 hover:shadow-md dark:hover:border-teal-500/50 dark:hover:bg-[#162035]/60"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 transition group-hover:bg-teal-600 group-hover:text-white dark:group-hover:text-white">
                    <Users size={18} />
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-stone-300 dark:text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600 dark:group-hover:text-teal-400"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-stone-900 dark:text-white">Customers</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">Buyer directory</p>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* KPI Numbers Row: Filtered dynamically based on Role Permissions */}
      {hasAnyKpi && (
        <section
          className={`card grid ${kpiGridCols} divide-y sm:divide-y-0 divide-stone-200 dark:divide-[#1F293D] sm:divide-x overflow-hidden transition-shadow duration-300 hover:shadow-md`}
        >
          {/* Sales Today: Only visible if orders:view */}
          {canViewOrders && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80 dark:hover:bg-[#162035]">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-brand-500" />
              <p className="text-sm font-medium text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-800 dark:group-hover:text-slate-200">
                Sales today
              </p>
              <p className="mt-2 font-display text-4xl sm:text-5xl font-semibold tabular-nums tracking-tight text-stone-900 dark:text-white transition-transform duration-200 group-hover:translate-x-0.5">
                {formatCurrency(todaySales)}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
                Live store revenue
              </p>

              <div
                className="mt-4 flex h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-[#1E293B] transition-all duration-200 group-hover:ring-1 group-hover:ring-brand-500/40"
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
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600 dark:text-slate-400">
                {paymentSplit.map((p) => (
                  <li
                    key={p.method}
                    className="flex items-center gap-1.5 transition-colors duration-200 group-hover:text-stone-900 dark:group-hover:text-white"
                  >
                    <span
                      className={`h-2 w-2 rounded-sm transition-transform duration-200 group-hover:scale-110 ${paymentColor[p.method]}`}
                    />
                    <span className="text-stone-500 dark:text-slate-400">{p.method}</span>
                    <span className="font-semibold tabular-nums text-stone-900 dark:text-slate-200">
                      {formatCurrency(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Orders: Only visible if orders:view */}
          {canViewOrders && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80 dark:hover:bg-[#162035]">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-emerald-500" />
              <p className="text-sm font-medium text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-800 dark:group-hover:text-slate-200">
                Orders
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-stone-900 dark:text-white transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-500 dark:group-hover:text-emerald-400">
                {salesList.length}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-700 dark:group-hover:text-slate-300">
                {pendingCount} pending, {refundedCount} refunded
              </p>
            </div>
          )}

          {/* Customers: Only visible if customers:view */}
          {canViewCustomers && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80 dark:hover:bg-[#162035]">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-brand-500" />
              <p className="text-sm font-medium text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-800 dark:group-hover:text-slate-200">
                Customers
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-stone-900 dark:text-white transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-500 dark:group-hover:text-brand-400">
                {customersList.length}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-700 dark:group-hover:text-slate-300">
                Registered members
              </p>
            </div>
          )}

          {/* Low Stock: Only visible if inventory:view or products:view */}
          {(canViewInventory || canViewProducts) && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80 dark:hover:bg-[#162035]">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-rose-500" />
              <p className="text-sm font-medium text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-800 dark:group-hover:text-slate-200">
                Low stock
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-rose-600 dark:text-rose-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-rose-500 dark:group-hover:text-rose-300">
                {lowStock.length}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-700 dark:group-hover:text-slate-300">
                Items below reorder level
              </p>
            </div>
          )}

          {/* Active Shifts: Only visible if counters:view */}
          {canViewCounters && (
            <div className="group relative p-5 transition-all duration-200 hover:bg-stone-50/80 dark:hover:bg-[#162035]">
              <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-purple-500" />
              <p className="text-sm font-medium text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-800 dark:group-hover:text-slate-200">
                Active Shifts
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-purple-600 dark:text-purple-400 transition-all duration-200 group-hover:translate-x-0.5">
                {openCountersCount}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-slate-400 transition-colors duration-200 group-hover:text-stone-700 dark:group-hover:text-slate-300">
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
                  <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Sales, last 7 days</h2>
                  <p className="mt-0.5 text-sm text-stone-500 dark:text-slate-400">
                    {formatCurrency(weeklyTotal)} in total
                  </p>
                </div>
                <span className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand-500 shadow-[0_0_8px_rgba(255,107,10,0.5)]" />
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
                          isToday ? "font-semibold text-brand-600 dark:text-brand-400" : "text-stone-500 dark:text-slate-400"
                        }`}
                      >
                        {d.amount > 0 ? `${(d.amount / 1000).toFixed(1)}k` : "0"}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isToday
                            ? "bg-gradient-to-t from-brand-600 to-brand-400 shadow-[0_0_12px_rgba(255,107,10,0.35)]"
                            : "bg-stone-200 dark:bg-[#1E293B] hover:bg-stone-300 dark:hover:bg-[#2A374F]"
                        }`}
                        style={{ height: `${height}px` }}
                      />
                      <span
                        className={`text-xs ${
                          isToday ? "font-semibold text-stone-900 dark:text-white" : "text-stone-500 dark:text-slate-400"
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
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Best sellers</h2>
              <p className="mt-0.5 text-sm text-stone-500 dark:text-slate-400">By revenue this week</p>
              {topProducts.length === 0 ? (
                <p className="mt-12 text-center text-xs text-stone-400 dark:text-slate-500">No sales recorded yet</p>
              ) : (
                <ol className="mt-5 space-y-4">
                  {topProducts.map((p, i) => (
                    <li key={p.name}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-stone-900 dark:text-slate-200">
                          <span className="mr-2 tabular-nums text-stone-400 dark:text-slate-500">{i + 1}</span>
                          {p.name}
                        </span>
                        <span className="font-semibold tabular-nums text-stone-900 dark:text-white">{formatCurrency(p.revenue)}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-[#1E293B]">
                        <div
                          className={`h-full rounded-full ${
                            i === 0
                              ? "bg-brand-500 shadow-[0_0_8px_rgba(255,107,10,0.4)]"
                              : "bg-stone-800 dark:bg-slate-600"
                          }`}
                          style={{ width: `${(p.revenue / maxTop) * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">{p.sold} sold</p>
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
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Recent orders</h2>
                <Link
                  href="/orders"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  View all sales
                </Link>
              </div>
              {/* Mobile View: Clean List (Zero Horizontal Scroll) */}
              <div className="block sm:hidden divide-y divide-stone-100 dark:divide-[#1F293D] border-t border-stone-200 dark:border-[#1F293D]">
                {salesList.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-stone-400 dark:text-slate-500">
                    No orders recorded yet
                  </div>
                ) : (
                  salesList.slice(0, 6).map((s) => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-[#111827]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone-100 dark:bg-[#1F293D] text-xs font-semibold text-stone-600 dark:text-slate-200">
                          {initials(s.customer)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-stone-900 dark:text-white">{s.customer}</p>
                          <p className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">#{s.id} · {s.payment}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-white tabular-nums">{formatCurrency(s.total)}</p>
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
                  <thead className="border-y border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035]/80 text-xs font-medium text-stone-500 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Invoice</th>
                      <th className="px-5 py-2.5 font-medium">Customer</th>
                      <th className="px-5 py-2.5 font-medium">Payment</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                      <th className="px-5 py-2.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-[#1F293D]">
                    {salesList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-stone-400 dark:text-slate-500">
                          No orders recorded yet
                        </td>
                      </tr>
                    ) : (
                      salesList.slice(0, 6).map((s) => (
                        <tr key={s.id} className="hover:bg-stone-50 dark:hover:bg-[#162035]/60 transition-colors">
                          <td className="px-5 py-3 font-medium tabular-nums text-brand-700 dark:text-brand-400">{s.id}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-7 w-7 place-items-center rounded-full bg-stone-100 dark:bg-[#1F293D] text-xs font-semibold text-stone-600 dark:text-slate-200">
                                {initials(s.customer)}
                              </span>
                              <span className="font-medium text-stone-900 dark:text-white">{s.customer}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-stone-600 dark:text-slate-400">{s.payment}</td>
                          <td className="px-5 py-3">
                            <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold tabular-nums text-stone-900 dark:text-white">
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
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Low stock</h2>
                <Link
                  href="/inventory"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Open inventory
                </Link>
              </div>
              {lowStock.length === 0 ? (
                <p className="mt-12 text-center text-xs text-stone-400 dark:text-slate-500">
                  All products are well-stocked
                </p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {lowStock.slice(0, 5).map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 dark:bg-[#1E293B] text-xl border border-transparent dark:border-[#2D3B55]">
                        {p.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-medium text-stone-900 dark:text-slate-200">{p.name}</p>
                          <p className="shrink-0 text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                            {p.stock} left
                          </p>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-[#1E293B]">
                          <div
                            className="h-full rounded-full bg-rose-500"
                            style={{
                              width: `${Math.min(100, (p.stock / p.reorderLevel) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
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
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mb-3 border border-transparent dark:border-amber-800/40">
            <Shield size={24} />
          </span>
          <h3 className="font-bold text-stone-900 dark:text-white text-base">Restricted Analytics View</h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            Your assigned role does not have permission to view store financial metrics or inventory analytics. Please use your navigation menu to access permitted modules.
          </p>
        </div>
      )}
    </div>
  );
}
