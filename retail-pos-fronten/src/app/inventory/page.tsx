"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, Package, X } from "lucide-react";
import Badge from "@/components/Badge";
import { fetchProducts } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

function stockState(stock: number, reorder: number) {
  if (stock === 0) return { label: "Out of stock", tone: "red" as const, bar: "bg-red-500" };
  if (stock <= reorder)
    return { label: "Low stock", tone: "amber" as const, bar: "bg-brand-500" };
  return { label: "In stock", tone: "green" as const, bar: "bg-emerald-500" };
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  useEffect(() => {
    let isMounted = true;
    fetchProducts().then((data) => {
      if (isMounted) {
        setProducts(data || []);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const totalUnits = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products]);
  const stockValue = useMemo(() => products.reduce((s, p) => s + p.stock * p.cost, 0), [products]);
  const low = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length,
    [products]
  );
  const out = useMemo(() => products.filter((p) => p.stock === 0).length, [products]);

  const filteredProducts = useMemo(() => {
    if (filter === "low") return products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel);
    if (filter === "out") return products.filter((p) => p.stock === 0);
    return products;
  }, [products, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title text-2xl font-bold tracking-tight text-stone-900">Inventory</h1>
          <p className="mt-1 text-sm text-stone-500">Track stock levels and reorder points</p>
        </div>
        {filter !== "all" && (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="btn-ghost !py-1.5 !px-3 text-xs"
          >
            Clear Filter ({filter === "low" ? "Low Stock" : "Out of Stock"})
          </button>
        )}
      </div>

      {/* 4 KPI Cards - Identical to Products Page */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Items */}
        <div className="card group relative overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-brand-500 rounded-t-2xl" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 transition-colors group-hover:text-stone-800 dark:group-hover:text-slate-200">
              Total Items
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100 dark:bg-[#162035] text-stone-700 dark:text-slate-200 transition-all duration-200 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/20 group-hover:text-brand-600 dark:group-hover:text-brand-400">
              <Package size={17} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-white transition-transform duration-200 group-hover:translate-x-0.5">
            {products.length}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">{totalUnits.toLocaleString()} units in stock</p>
        </div>

        {/* Inventory Cost */}
        <div className="card group relative overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-brand-600 rounded-t-2xl" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 transition-colors group-hover:text-stone-800 dark:group-hover:text-slate-200">
              Inventory Cost
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 transition-all duration-200 group-hover:bg-brand-100 dark:group-hover:bg-brand-500/25">
              <Boxes size={17} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-brand-600 dark:text-brand-400 transition-transform duration-200 group-hover:translate-x-0.5">
            {formatCurrency(stockValue)}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">Total valuation at cost</p>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => setFilter(filter === "low" ? "all" : "low")}
          className={`card group relative overflow-hidden cursor-pointer p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            filter === "low" ? "bg-amber-50/30 dark:bg-amber-950/20 shadow-sm" : ""
          }`}
        >
          <div
            className={`absolute inset-x-0 top-0 h-[4px] transition-all duration-200 rounded-t-2xl ${
              filter === "low" ? "bg-amber-500" : "bg-transparent group-hover:bg-amber-500"
            }`}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Low Stock Alert</p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 transition-all duration-200 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/25">
              <AlertTriangle size={17} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:translate-x-0.5">
            {low}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">Items at or below reorder level</p>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setFilter(filter === "out" ? "all" : "out")}
          className={`card group relative overflow-hidden cursor-pointer p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            filter === "out" ? "bg-red-50/30 dark:bg-rose-950/20 shadow-sm" : ""
          }`}
        >
          <div
            className={`absolute inset-x-0 top-0 h-[4px] transition-all duration-200 rounded-t-2xl ${
              filter === "out" ? "bg-red-500" : "bg-transparent group-hover:bg-red-500"
            }`}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-rose-400">Out of Stock</p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 dark:bg-rose-500/15 text-red-600 dark:text-rose-400 transition-all duration-200 group-hover:bg-red-100 dark:group-hover:bg-rose-500/25">
              <X size={17} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-red-600 dark:text-rose-400 transition-transform duration-200 group-hover:translate-x-0.5">
            {out}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">Requires immediate restock</p>
        </div>
      </section>

      {/* Inventory Presentation */}
      <div className="card overflow-hidden">
        {/* Mobile View: Responsive Stock Cards (Zero Horizontal Scroll) */}
        <div className="block sm:hidden divide-y divide-stone-100 dark:divide-[#1F293D]">
          {filteredProducts.map((p) => {
            const state = stockState(p.stock, p.reorderLevel);
            const pct = Math.min(100, (p.stock / (p.reorderLevel * 3)) * 100);
            return (
              <div key={p.id} className="p-4 space-y-3 bg-white dark:bg-[#111827]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 dark:bg-[#162035] text-xl shadow-xs">
                      {p.emoji}
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900 dark:text-white text-sm leading-tight">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-stone-500 dark:text-slate-400">{p.sku}</span>
                        <span className="text-[10px] bg-stone-100 dark:bg-[#162035] text-stone-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                          {p.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge tone={state.tone}>{state.label}</Badge>
                </div>

                {/* Stock progress */}
                <div className="rounded-lg bg-stone-50 dark:bg-[#162035]/80 p-2.5 space-y-1.5 border border-stone-100 dark:border-[#1F293D]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-slate-400">Current Stock:</span>
                    <span className="font-bold text-stone-900 dark:text-white tabular-nums">{p.stock} units</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200/70 dark:bg-[#1E293B]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${state.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-slate-500">
                    <span>Reorder threshold</span>
                    <span className="font-medium text-stone-600 dark:text-slate-300 tabular-nums">{p.reorderLevel} units</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-sm text-stone-500 dark:text-stone-400">
              No products match the selected filter.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035]/80 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="w-56 px-5 py-3">Stock level</th>
                <th className="px-5 py-3 text-right">Reorder at</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-[#1F293D]">
              {filteredProducts.map((p) => {
                const state = stockState(p.stock, p.reorderLevel);
                const pct = Math.min(100, (p.stock / (p.reorderLevel * 3)) * 100);
                return (
                  <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-[#162035]/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 dark:bg-[#162035] text-xl shadow-sm">
                          {p.emoji}
                        </span>
                        <div>
                          <p className="font-semibold text-stone-900 dark:text-white">{p.name}</p>
                          <p className="font-mono text-xs text-stone-500 dark:text-slate-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-stone-600 dark:text-slate-300">{p.category}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-[#1E293B]">
                          <div
                            className={`h-full rounded-full ${state.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-semibold tabular-nums text-stone-900 dark:text-white">
                          {p.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-stone-600 dark:text-slate-400">{p.reorderLevel}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={state.tone}>{state.label}</Badge>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-stone-500 dark:text-slate-400">
                    No products match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
