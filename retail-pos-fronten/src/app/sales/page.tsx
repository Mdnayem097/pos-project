"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Badge from "@/components/Badge";
import { fetchSales } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Sale } from "@/lib/types";

const statusTone: Record<string, "green" | "amber" | "red" | "stone" | "brand"> = {
  Delivered: "green",
  Completed: "green",
  New: "brand",
  Pending: "amber",
  Refunded: "red",
  Cancelled: "red",
};

export default function SalesPage() {
  const [salesList, setSalesList] = useState<Sale[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchSales().then((data) => {
      if (isMounted) {
        setSalesList(data || []);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const revenue = salesList
    .filter((s) => s.status === "Completed")
    .reduce((sum, s) => sum + s.total, 0);

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
    link.setAttribute("download", "sales-orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            {salesList.length} orders today · Revenue{" "}
            <span className="font-semibold text-brand-600 dark:text-brand-400">{formatCurrency(revenue)}</span>
          </p>
        </div>
        <button type="button" onClick={exportCSV} className="btn-ghost">
          <Download size={18} />
          Export
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile View: Responsive Sales Cards (Zero Horizontal Scroll) */}
        <div className="block sm:hidden divide-y divide-stone-100 dark:divide-[#1F293D]">
          {salesList.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-stone-400 dark:text-slate-500">
              No sales recorded yet
            </div>
          ) : (
            salesList.map((s) => (
              <div key={s.id} className="p-4 space-y-2 bg-white dark:bg-[#111827]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-700 dark:text-brand-400 text-sm">{s.id}</span>
                  <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600 dark:text-slate-400">
                  <span className="font-medium text-stone-900 dark:text-white">{s.customer}</span>
                  <span>{s.date}</span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-100 dark:border-[#1F293D] pt-2 text-xs">
                  <span className="text-stone-500 dark:text-slate-400">{s.items} items · {s.payment}</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm tabular-nums">
                    {formatCurrency(s.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035]/80 text-xs text-stone-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 text-right font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-[#1F293D]">
              {salesList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-stone-400 dark:text-slate-500">
                    No sales recorded yet
                  </td>
                </tr>
              ) : (
                salesList.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50 dark:hover:bg-[#162035]/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-brand-700 dark:text-brand-400">{s.id}</td>
                    <td className="px-5 py-3 text-stone-600 dark:text-slate-400">{s.date}</td>
                    <td className="px-5 py-3 font-medium text-stone-900 dark:text-white">{s.customer}</td>
                    <td className="px-5 py-3 text-right text-stone-600 dark:text-slate-300">{s.items}</td>
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
    </div>
  );
}
