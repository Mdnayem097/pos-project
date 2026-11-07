"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  Search,
  X,
} from "lucide-react";
import {
  deleteOrder,
  fetchOrders,
  updateOrderStatus,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { printReceiptElement } from "@/lib/printReceipt";
import { useToast } from "@/context/ToastContext";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    function handleClickOutside() {
      setOpenDropdownId(null);
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetchOrders({
        page,
        limit,
        q: search.trim() || undefined,
        sortOrder,
      });
      setOrders(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [page, limit, search, sortOrder]);

  async function handleMarkDelivered(order: Order) {
    if (order.status === "Delivered") return;
    setActionLoading(order.id);
    try {
      const updated = await updateOrderStatus(order.id, "Delivered");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      toast.success("Order Updated", `Order ${order.orderId} marked as Delivered.`);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error("Update Failed", err.message || "Failed to mark order as Delivered");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteOrCancel(order: Order) {
    const confirmMsg =
      order.status === "Cancelled"
        ? `Are you sure you want to permanently delete order ${order.orderId}?`
        : `Are you sure you want to cancel order ${order.orderId}?`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(order.id);
    try {
      if (order.status !== "Cancelled") {
        const updated = await updateOrderStatus(order.id, "Cancelled");
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
        toast.info("Order Cancelled", `Order ${order.orderId} status changed to Cancelled.`);
      } else {
        await deleteOrder(order.id);
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        setTotal((prev) => Math.max(0, prev - 1));
        toast.info("Order Deleted", `Order ${order.orderId} permanently removed.`);
      }
    } catch (err: any) {
      console.error("Failed to update/delete order:", err);
      toast.error("Operation Failed", err.message || "Operation failed");
    } finally {
      setActionLoading(null);
    }
  }

  // Calculate showing range text: e.g. "1 to 10 of 31"
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Title */}
      <div>
        <p className="text-xs font-medium text-stone-500">Orders</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Orders</h1>
      </div>

      {/* Main Table Card */}
      <div className="card overflow-hidden bg-white p-5 shadow-sm">
        {/* Controls: Show Entries & Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-sm font-medium text-stone-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-stone-600 w-full sm:w-auto">
            <span className="font-medium shrink-0">Search:</span>
            <div className="relative flex-1 sm:w-60">
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search orders..."
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Mobile View: Clean Responsive Cards (Zero Horizontal Scroll) */}
        <div className="block sm:hidden divide-y divide-stone-100 border-t border-stone-200">
          {loading ? (
            <div className="py-12 text-center text-sm text-stone-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-500">No orders found</div>
          ) : (
            orders.map((o) => {
              const isDelivered = o.status === "Delivered";
              const isNew = o.status === "New";
              const isPending = o.status === "Pending";
              const isCancelled = o.status === "Cancelled" || o.status === "Refunded";

              return (
                <div key={o.id} className="p-4 space-y-3 bg-white hover:bg-stone-50/70 transition">
                  {/* Top: Order #, Source & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm tabular-nums">
                        #{o.orderId}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          o.source === "Website"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {o.source}
                      </span>
                    </div>

                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isDelivered
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isNew
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : isPending
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : isCancelled
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>

                  {/* Customer info & Method */}
                  <div className="text-xs space-y-0.5 text-stone-600">
                    <p className="font-semibold text-stone-900">{o.name}</p>
                    <p className="text-stone-500 text-[11px] truncate">{o.email}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-stone-500">Payment: <strong className="text-stone-700">{o.method}</strong></span>
                      <span className="text-sm font-bold text-stone-900 tabular-nums">
                        {formatCurrency(o.total)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons row */}
                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                    >
                      <FileText size={13} className="text-brand-600" />
                      <span>Invoice</span>
                    </button>

                    {!isDelivered && (
                      <button
                        type="button"
                        disabled={actionLoading === o.id}
                        onClick={() => handleMarkDelivered(o)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                      >
                        <Check size={13} />
                        <span>Deliver</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={actionLoading === o.id}
                      onClick={() => handleDeleteOrCancel(o)}
                      className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                      title={isCancelled ? "Delete" : "Cancel"}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto border-t border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f0f9f4] text-xs font-semibold text-stone-700">
              <tr>
                <th
                  onClick={() => setSortOrder((prev) => (prev === "DESC" ? "ASC" : "DESC"))}
                  className="px-4 py-3.5 text-center font-bold cursor-pointer select-none"
                  title="Click to toggle sort"
                >
                  <div className="inline-flex items-center gap-1">
                    Order ID
                    <ArrowUpDown
                      size={12}
                      className={sortOrder === "ASC" ? "text-emerald-700" : "text-stone-400"}
                    />
                  </div>
                </th>
                <th className="px-4 py-3.5 font-bold">Name</th>
                <th className="px-4 py-3.5 font-bold">Email</th>
                <th className="px-4 py-3.5 text-center font-bold">Source</th>
                <th className="px-4 py-3.5 font-bold">Method</th>
                <th className="px-4 py-3.5 text-right font-bold">Total</th>
                <th className="px-4 py-3.5 text-center font-bold">Status</th>
                <th className="px-4 py-3.5 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-stone-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-stone-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((o, idx) => {
                  const isDelivered = o.status === "Delivered";
                  const isNew = o.status === "New";
                  const isPending = o.status === "Pending";
                  const isCancelled = o.status === "Cancelled" || o.status === "Refunded";

                  return (
                    <tr key={o.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Order ID */}
                      <td className="px-4 py-3.5 text-center font-semibold text-stone-700 tabular-nums">
                        {o.orderId}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5 font-medium text-stone-800">
                        {o.name}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-stone-600">
                        {o.email}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                            o.source === "Website"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {o.source}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3.5 font-medium text-stone-700">
                        {o.method}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 text-right font-semibold text-stone-900 tabular-nums">
                        {o.total.toLocaleString("en-US")}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block text-xs font-medium ${
                            isDelivered
                              ? "text-emerald-700"
                              : isNew
                              ? "text-sky-600 font-semibold"
                              : isPending
                              ? "text-amber-600 font-semibold"
                              : isCancelled
                              ? "text-rose-600"
                              : "text-stone-700"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>

                      {/* Action Dropdown */}
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId((prev) => (prev === o.id ? null : o.id));
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 hover:text-stone-900 focus:outline-none"
                          >
                            <span>Action</span>
                            <ChevronDown
                              size={13}
                              className={`text-stone-400 transition-transform duration-150 ${
                                openDropdownId === o.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {openDropdownId === o.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute right-0 z-30 w-44 rounded-lg border border-stone-200 bg-white py-1 shadow-xl ring-1 ring-black/5 divide-y divide-stone-100 ${
                                idx >= orders.length - 2 && orders.length > 2
                                  ? "bottom-full mb-1"
                                  : "top-full mt-1"
                              }`}
                            >
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrder(o);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50 hover:text-amber-900 transition text-left"
                                >
                                  <span className="grid h-5 w-5 place-items-center rounded bg-amber-100 text-amber-700">
                                    <FileText size={12} />
                                  </span>
                                  <span>View Invoice</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isDelivered || actionLoading === o.id}
                                  onClick={() => {
                                    handleMarkDelivered(o);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 transition disabled:opacity-40 disabled:pointer-events-none text-left"
                                >
                                  <span className="grid h-5 w-5 place-items-center rounded bg-emerald-100 text-emerald-700">
                                    <Check size={12} strokeWidth={2.5} />
                                  </span>
                                  <span>Mark as Delivered</span>
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  type="button"
                                  disabled={actionLoading === o.id}
                                  onClick={() => {
                                    handleDeleteOrCancel(o);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition disabled:opacity-40 text-left"
                                >
                                  <span className="grid h-5 w-5 place-items-center rounded bg-rose-100 text-rose-700">
                                    <X size={12} strokeWidth={2.4} />
                                  </span>
                                  <span>{isCancelled ? "Delete Order" : "Cancel Order"}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-stone-200 p-4">
          <p className="text-xs text-stone-500 text-center sm:text-left">
            {total > 0
              ? `${startItem} to ${endItem} of ${total}`
              : "0 to 0 of 0"}
          </p>

          <div className="flex items-center justify-center gap-1 flex-wrap">
            {/* Previous */}
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="grid h-8 w-8 place-items-center rounded border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const active = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`grid h-8 w-8 place-items-center rounded text-xs font-semibold transition ${
                    active
                      ? "bg-[#10b981] text-white shadow-sm"
                      : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {/* Next */}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="grid h-8 w-8 place-items-center rounded border border-stone-300 bg-white text-stone-600 transition hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm print:static print:inset-auto print:z-auto print:block print:bg-transparent print:p-0 print:m-0 print:backdrop-filter-none print:transform-none"
        >
          <div
            id="printable-order-invoice"
            className="card w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto print:static print:max-h-none print:w-full print:max-w-[120mm] print:mx-auto print:overflow-visible print:border-none print:shadow-none print:p-2 print:bg-white"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Order Details
                </span>
                <h3 className="text-xl font-bold text-stone-900 mt-0.5">
                  Invoice {selectedOrder.invoiceNo} ({selectedOrder.orderId})
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Placed on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 print:hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer & Order Metadata */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-lg border border-stone-200/60">
              <div>
                <p className="text-stone-500">Customer</p>
                <p className="font-semibold text-stone-900 mt-0.5">{selectedOrder.name}</p>
                <p className="text-stone-600 truncate">{selectedOrder.email}</p>
              </div>
              <div>
                <p className="text-stone-500">Payment & Source</p>
                <p className="font-semibold text-stone-900 mt-0.5">
                  {selectedOrder.method} · {selectedOrder.source}
                </p>
                <p className="mt-0.5">
                  Status:{" "}
                  <span className="font-semibold text-emerald-700">{selectedOrder.status}</span>
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Order Items ({selectedOrder.items?.length || 0})
              </p>
              <div className="rounded-lg border border-stone-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="px-3 py-2">
                            <span className="mr-1.5">{item.emoji || "📦"}</span>
                            <span className="font-medium text-stone-800">{item.name}</span>
                          </td>
                          <td className="px-3 py-2 text-center font-semibold tabular-nums">
                            {item.qty}
                          </td>
                          <td className="px-3 py-2 text-right text-stone-600 tabular-nums">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-stone-900 tabular-nums">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-stone-400">
                          Item details not available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="mt-4 space-y-1.5 border-t border-stone-100 pt-3 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold tabular-nums">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Discount</span>
                  <span className="font-semibold text-rose-600 tabular-nums">
                    -{formatCurrency(selectedOrder.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>VAT (5%)</span>
                <span className="font-semibold tabular-nums">{formatCurrency(selectedOrder.vat)}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-900">
                <span>Total Amount</span>
                <span className="text-base text-emerald-700 tabular-nums">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => {
                  printReceiptElement("printable-order-invoice", `Invoice-${selectedOrder.invoiceNo}`);
                }}
                className="btn-ghost text-xs flex items-center gap-1.5"
              >
                <Printer size={15} />
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-primary text-xs !bg-[#10b981] hover:!bg-[#059669]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
