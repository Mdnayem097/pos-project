"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  PackageCheck,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  Store,
  Undo2,
  User,
  X,
} from "lucide-react";
import {
  createReturn,
  fetchOrders,
  fetchReturnableItems,
  fetchReturns,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  Order,
  OrderReturnableInfo,
  ReturnOrder,
} from "@/lib/types";

const RETURN_REASONS = [
  "Customer Changed Mind",
  "Defective / Damaged",
  "Expired Product",
  "Wrong Item Purchased",
  "Quality Dissatisfaction",
  "Other",
] as const;

export default function ReturnsPage() {
  const [returnsList, setReturnsList] = useState<ReturnOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");

  // New Return Modal State
  const [showNewReturnModal, setShowNewReturnModal] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderReturnableInfo, setOrderReturnableInfo] = useState<OrderReturnableInfo | null>(null);
  const [isLoadingReturnable, setIsLoadingReturnable] = useState(false);

  // Return items selection state: map of orderItemId -> { qty: number, reason: string }
  const [returnDraft, setReturnDraft] = useState<Record<number, { qty: number; reason: string }>>({});
  const [refundMethod, setRefundMethod] = useState("Cash");
  const [generalReason, setGeneralReason] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Return Details / Receipt Modal State
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null);

  async function loadReturns() {
    setIsLoading(true);
    try {
      const data = await fetchReturns({
        q: searchQuery.trim() || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        orderId: orderIdFilter ? Number(orderIdFilter) : undefined,
      });
      setReturnsList(data || []);
    } catch (err) {
      console.error("Failed to load returns:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReturns();
  }, [searchQuery, fromDate, toDate, orderIdFilter]);

  // Load recent orders when opening New Return modal
  async function handleOpenNewReturn() {
    setShowNewReturnModal(true);
    setSelectedOrderId(null);
    setOrderReturnableInfo(null);
    setReturnDraft({});
    setGeneralReason("");
    setRefundMethod("Cash");
    setIsLoadingOrders(true);
    try {
      const ordersRes = await fetchOrders({ limit: 15 });
      setRecentOrders(ordersRes.data || []);
    } catch (err) {
      console.error("Failed to fetch recent orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  }

  // When cashier selects an order to return
  async function handleSelectOrder(orderId: number) {
    setSelectedOrderId(orderId);
    setIsLoadingReturnable(true);
    try {
      const info = await fetchReturnableItems(orderId);
      setOrderReturnableInfo(info);
      setRefundMethod(info.paymentMethod || "Cash");
      // Initialize draft with 0 qty for each returnable item
      const initialDraft: Record<number, { qty: number; reason: string }> = {};
      for (const item of info.items) {
        if (item.returnableQty > 0) {
          initialDraft[item.orderItemId] = {
            qty: 0,
            reason: RETURN_REASONS[0],
          };
        }
      }
      setReturnDraft(initialDraft);
    } catch (err: any) {
      alert(err.message || "Failed to load order returnable items");
      setSelectedOrderId(null);
    } finally {
      setIsLoadingReturnable(false);
    }
  }

  // Update return quantity for a line item
  function handleQtyChange(orderItemId: number, qty: number, maxQty: number) {
    const validQty = Math.max(0, Math.min(qty, maxQty));
    setReturnDraft((prev) => ({
      ...prev,
      [orderItemId]: {
        qty: validQty,
        reason: prev[orderItemId]?.reason || RETURN_REASONS[0],
      },
    }));
  }

  // Update return reason for a line item
  function handleReasonChange(orderItemId: number, reason: string) {
    setReturnDraft((prev) => ({
      ...prev,
      [orderItemId]: {
        qty: prev[orderItemId]?.qty || 0,
        reason,
      },
    }));
  }

  // Compute live estimated refund total
  const estimatedRefund = useMemo(() => {
    if (!orderReturnableInfo) return 0;
    let total = 0;
    for (const item of orderReturnableInfo.items) {
      const draft = returnDraft[item.orderItemId];
      if (draft && draft.qty > 0) {
        total += draft.qty * item.unitPrice;
      }
    }
    return Math.round(total * 100) / 100;
  }, [orderReturnableInfo, returnDraft]);

  const totalItemsToReturn = useMemo(() => {
    return Object.values(returnDraft).reduce((sum, d) => sum + (d.qty || 0), 0);
  }, [returnDraft]);

  // Submit Return
  async function handleSubmitReturn(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrderId || totalItemsToReturn === 0 || isSubmittingReturn) return;

    const itemsPayload = Object.entries(returnDraft)
      .filter(([_, d]) => d.qty > 0)
      .map(([orderItemId, d]) => ({
        orderItemId: Number(orderItemId),
        qty: d.qty,
        reason: d.reason,
      }));

    if (itemsPayload.length === 0) {
      alert("Please select at least 1 item to return.");
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const created = await createReturn({
        orderId: selectedOrderId,
        items: itemsPayload,
        refundMethod,
        reason: generalReason.trim() || undefined,
      });

      setShowNewReturnModal(false);
      setSelectedReturn(created);
      await loadReturns();
    } catch (err: any) {
      alert(err.message || "Failed to process return");
    } finally {
      setIsSubmittingReturn(false);
    }
  }

  // High-level statistics
  const totalReturnsCount = returnsList.length;
  const totalRefundAmount = returnsList.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);
  const totalRestockedItems = returnsList.reduce(
    (sum, r) => sum + (r.items?.reduce((s, i) => s + i.qty, 0) || 0),
    0
  );
  const todayStr = new Date().toISOString().split("T")[0];
  const returnsToday = returnsList.filter((r) => r.createdAt?.startsWith(todayStr)).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">Return Orders</h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200/60">
              {totalReturnsCount} {totalReturnsCount === 1 ? "Return" : "Returns"}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Process customer product returns, track restocking inventory, and manage refunds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadReturns}
            className="btn-ghost"
            title="Refresh returns"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenNewReturn}
            className="btn-primary"
          >
            <RotateCcw size={17} />
            New Return
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Total Returns</span>
            <RotateCcw size={17} className="text-stone-400" />
          </div>
          <p className="font-display text-2xl font-bold text-stone-900">{totalReturnsCount}</p>
          <p className="text-xs text-stone-500">Processed refund orders</p>
        </div>

        <div className="card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Total Refunded</span>
            <Receipt size={17} className="text-emerald-600" />
          </div>
          <p className="font-display text-2xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(totalRefundAmount)}
          </p>
          <p className="text-xs text-stone-500">Returned to customers</p>
        </div>

        <div className="card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Items Restocked</span>
            <PackageCheck size={17} className="text-blue-600" />
          </div>
          <p className="font-display text-2xl font-bold text-stone-900">{totalRestockedItems}</p>
          <p className="text-xs text-stone-500">Returned back to stock</p>
        </div>

        <div className="card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Returns Today</span>
            <Clock size={17} className="text-brand-500" />
          </div>
          <p className="font-display text-2xl font-bold text-brand-600">{returnsToday}</p>
          <p className="text-xs text-stone-500">Logged today</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              placeholder="Search return #, invoice #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 text-xs"
            />
          </div>

          <div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title="From date"
              className="input text-xs"
            />
          </div>

          <div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title="To date"
              className="input text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Order ID #"
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              className="input text-xs w-full"
            />
            {(searchQuery || fromDate || toDate || orderIdFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFromDate("");
                  setToDate("");
                  setOrderIdFilter("");
                }}
                className="btn-ghost py-2 text-xs shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Original Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Returned Items</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {returnsList.map((ret) => {
                const itemsCount = ret.items?.reduce((s, i) => s + i.qty, 0) || 0;
                const itemsSummary = ret.items
                  ?.map((i) => `${i.qty}× ${i.product?.name || "Item"}`)
                  .join(", ");

                return (
                  <tr key={ret.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {ret.returnNo}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-medium text-stone-900">
                        {new Date(ret.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {new Date(ret.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/orders`}
                        className="font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        #{ret.orderId}
                        {ret.order?.invoiceNo && (
                          <span className="text-stone-400 font-mono text-[11px]">
                            ({ret.order.invoiceNo})
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-900">
                      {ret.order?.customerName || ret.order?.customer?.name || "Walk in customer"}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate" title={itemsSummary}>
                      <span className="font-semibold text-stone-900">{itemsCount} items</span>
                      <span className="text-stone-500 text-[11px] ml-1.5 truncate">
                        ({itemsSummary})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-display font-bold text-stone-900 tabular-nums">
                      {formatCurrency(ret.refundAmount)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-stone-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        {ret.refundMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {ret.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedReturn(ret)}
                        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 transition"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {returnsList.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <RotateCcw size={32} className="mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-700">No Return Orders Found</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Customer returns will appear here once processed.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. New Return Modal */}
      {showNewReturnModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <RotateCcw size={18} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
                    Process Return Order
                  </h3>
                  <p className="text-xs text-stone-500">
                    {selectedOrderId
                      ? `Select items to return from Order #${selectedOrderId}`
                      : "Step 1: Select an order to return items from"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewReturnModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {!selectedOrderId ? (
                /* Step 1: Pick Order */
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Select Recent Order:
                  </p>

                  {isLoadingOrders ? (
                    <div className="py-12 text-center text-xs text-stone-400">Loading orders...</div>
                  ) : (
                    <div className="divide-y divide-stone-100 border rounded-xl overflow-hidden text-xs">
                      {recentOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="flex items-center justify-between p-3 hover:bg-stone-50 transition"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900">#{ord.id}</span>
                              <span className="font-mono text-stone-500">({ord.invoiceNo})</span>
                              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                                {ord.method}
                              </span>
                            </div>
                            <p className="text-stone-500 text-[11px] mt-0.5">
                              {ord.name} • {ord.itemsCount} items •{" "}
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-display text-sm font-bold text-stone-900 tabular-nums">
                              {formatCurrency(ord.total)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelectOrder(ord.id)}
                              className="btn-primary py-1.5 px-3 text-xs"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Step 2: Select Returnable Items */
                <form onSubmit={handleSubmitReturn} className="space-y-4">
                  {/* Back to Order Selection */}
                  <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs">
                    <div>
                      <span className="font-semibold text-stone-900">
                        Order #{orderReturnableInfo?.orderId} ({orderReturnableInfo?.invoiceNo})
                      </span>
                      <p className="text-stone-500 text-[11px]">
                        Customer: {orderReturnableInfo?.customerName} • Total:{" "}
                        {formatCurrency(orderReturnableInfo?.total || 0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrderId(null);
                        setOrderReturnableInfo(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                    >
                      <ArrowLeft size={13} />
                      Change Order
                    </button>
                  </div>

                  {/* Returnable Items Table */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Purchased Items Eligible For Return:
                    </p>

                    {isLoadingReturnable ? (
                      <div className="py-8 text-center text-xs text-stone-400">Loading items...</div>
                    ) : (
                      <div className="divide-y divide-stone-100 border rounded-xl overflow-hidden text-xs">
                        {orderReturnableInfo?.items.map((item) => {
                          const draft = returnDraft[item.orderItemId] || {
                            qty: 0,
                            reason: RETURN_REASONS[0],
                          };
                          const isEligible = item.returnableQty > 0;

                          return (
                            <div
                              key={item.orderItemId}
                              className={`p-3 space-y-2.5 ${!isEligible ? "bg-stone-50/60 opacity-60" : ""}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-xl">{item.emoji || "📦"}</span>
                                  <div>
                                    <p className="font-semibold text-stone-900 leading-snug">
                                      {item.productName}
                                    </p>
                                    <p className="text-[11px] text-stone-400 font-mono">
                                      SKU: {item.sku} • Unit: {formatCurrency(item.unitPrice)}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right text-[11px] text-stone-500 shrink-0">
                                  <span>Purchased: {item.originalQty}</span>
                                  {item.alreadyReturnedQty > 0 && (
                                    <span className="text-amber-600 block">
                                      Already Returned: {item.alreadyReturnedQty}
                                    </span>
                                  )}
                                  <span className="font-bold text-stone-900 block mt-0.5">
                                    Returnable: {item.returnableQty}
                                  </span>
                                </div>
                              </div>

                              {isEligible && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-dashed border-stone-200">
                                  <div className="flex items-center gap-2">
                                    <label className="text-[11px] font-semibold text-stone-600">
                                      Return Qty:
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={item.returnableQty}
                                      value={draft.qty}
                                      onChange={(e) =>
                                        handleQtyChange(
                                          item.orderItemId,
                                          Number(e.target.value) || 0,
                                          item.returnableQty
                                        )
                                      }
                                      className="w-16 rounded-md border border-stone-300 py-1 px-2 text-right text-xs font-bold tabular-nums"
                                    />
                                    {draft.qty > 0 && (
                                      <span className="text-[11px] font-semibold text-emerald-600">
                                        = {formatCurrency(draft.qty * item.unitPrice)}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <select
                                      disabled={draft.qty === 0}
                                      value={draft.reason}
                                      onChange={(e) =>
                                        handleReasonChange(item.orderItemId, e.target.value)
                                      }
                                      className="w-full rounded-md border border-stone-300 py-1 px-2 text-xs"
                                    >
                                      {RETURN_REASONS.map((r) => (
                                        <option key={r} value={r}>
                                          {r}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Refund Method & Note */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Refund Method
                      </label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                        className="input text-xs py-2"
                      >
                        <option value="Cash">Cash Refund</option>
                        <option value="Card">Card Reversal</option>
                        <option value="bKash">bKash Refund</option>
                        <option value="Store Credit">Store Credit / Voucher</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        General Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Approved by store manager"
                        value={generalReason}
                        onChange={(e) => setGeneralReason(e.target.value)}
                        className="input text-xs py-2"
                      />
                    </div>
                  </div>

                  {/* Restocking notice & Total Refund banner */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-800">
                      <PackageCheck size={18} className="text-emerald-600" />
                      <span>
                        <strong>{totalItemsToReturn} items</strong> will be automatically restocked into inventory.
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 uppercase tracking-wider block font-semibold">
                        Total Refund
                      </span>
                      <span className="font-display text-xl font-bold text-stone-900 tabular-nums">
                        {formatCurrency(estimatedRefund)}
                      </span>
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setShowNewReturnModal(false)}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={totalItemsToReturn === 0 || isSubmittingReturn}
                      className="btn-primary"
                    >
                      {isSubmittingReturn
                        ? "Processing Return..."
                        : `Confirm Return (${formatCurrency(estimatedRefund)})`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Return Details & Voucher Modal */}
      {selectedReturn && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="card w-full max-w-md max-h-[90vh] flex flex-col p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-600" />
                <h3 className="font-display text-base font-bold text-stone-900">
                  Return Receipt Voucher
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Voucher Paper */}
            <div className="flex-1 overflow-y-auto py-4">
              <div
                id="printable-receipt"
                className="rounded-xl border border-stone-200 bg-white p-5 font-sans text-stone-900 shadow-sm space-y-4"
              >
                {/* Store Header */}
                <div className="text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-sm mx-auto">
                    <Store size={20} strokeWidth={2.4} />
                  </span>
                  <h2 className="mt-2 font-display text-lg font-bold text-stone-900">Retail POS</h2>
                  <p className="text-xs text-stone-500">Main Branch • Counter 1</p>
                  <span className="inline-block mt-1 rounded-full bg-emerald-50 px-3 py-0.5 text-[11px] font-semibold text-emerald-700 uppercase tracking-wider border border-emerald-200">
                    Credit Note / Return Voucher
                  </span>
                </div>

                {/* Meta details */}
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Return Voucher:</span>
                    <span className="font-mono font-bold text-stone-900">{selectedReturn.returnNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Original Invoice:</span>
                    <span className="font-semibold text-brand-600">
                      {selectedReturn.order?.invoiceNo || `#${selectedReturn.orderId}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Date & Time:</span>
                    <span className="font-medium text-stone-800">
                      {new Date(selectedReturn.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Customer:</span>
                    <span className="font-medium text-stone-800">
                      {selectedReturn.order?.customerName ||
                        selectedReturn.order?.customer?.name ||
                        "Walk in customer"}
                    </span>
                  </div>
                </div>

                {/* Returned Items */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-stone-800 border-b pb-1">
                    <span>Returned Items</span>
                    <span>Refund</span>
                  </div>
                  <div className="divide-y divide-stone-100 text-xs">
                    {selectedReturn.items?.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-stone-900">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {item.qty} × {formatCurrency(item.unitPrice)}
                            {item.reason && ` • (${item.reason})`}
                          </p>
                        </div>
                        <p className="font-bold text-stone-900 tabular-nums">
                          {formatCurrency(item.refundAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refund Total */}
                <div className="rounded-lg bg-stone-900 p-3 text-white flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-stone-300">
                    Total Refunded
                  </span>
                  <span className="font-display text-lg font-bold tabular-nums">
                    {formatCurrency(selectedReturn.refundAmount)}
                  </span>
                </div>

                {/* Method & Restock info */}
                <div className="text-xs space-y-1 text-stone-600 pt-1">
                  <div className="flex justify-between">
                    <span>Refund Method:</span>
                    <span className="font-semibold text-stone-900">{selectedReturn.refundMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restock Status:</span>
                    <span className="font-semibold text-emerald-600">✓ Returned to Inventory</span>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="pt-2 border-t text-center text-[11px] text-stone-500">
                  <p>Authorized Return Voucher</p>
                  <p className="font-mono mt-1 text-[10px] text-stone-400">
                    *{selectedReturn.returnNo}*
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="btn-ghost flex-1 text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary flex-1 text-xs inline-flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
