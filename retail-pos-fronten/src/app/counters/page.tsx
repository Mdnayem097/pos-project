"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Lock,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  ShoppingBag,
  Store,
  Trash2,
  Unlock,
  User,
  X,
} from "lucide-react";
import {
  closeCounterSession,
  createCounter,
  deleteCounter,
  fetchCounters,
  fetchCounterSessions,
  fetchCurrentSession,
  openCounterSession,
  updateCounter,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  CloseShiftResult,
  Counter,
  CounterSession,
  CurrentCounterStatus,
} from "@/lib/types";

export default function CountersPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [currentStatus, setCurrentStatus] = useState<CurrentCounterStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Counter Modal
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Open Shift Modal
  const [openingCounter, setOpeningCounter] = useState<Counter | null>(null);
  const [openingCashInput, setOpeningCashInput] = useState("500");
  const [cashierNameInput, setCashierNameInput] = useState("Demo Admin");
  const [isOpeningShift, setIsOpeningShift] = useState(false);

  // Close Shift Modal
  const [closingCounter, setClosingCounter] = useState<Counter | null>(null);
  const [closingCashInput, setClosingCashInput] = useState("");
  const [closingNoteInput, setClosingNoteInput] = useState("");
  const [isClosingShift, setIsClosingShift] = useState(false);

  // Shift Close Result Summary Modal
  const [shiftCloseResult, setShiftCloseResult] = useState<CloseShiftResult | null>(null);

  // Session History Modal
  const [historyCounter, setHistoryCounter] = useState<Counter | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<CounterSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  async function loadData() {
    setIsLoading(true);
    try {
      const [countersData, currentData] = await Promise.all([
        fetchCounters(),
        fetchCurrentSession(),
      ]);
      setCounters(countersData || []);
      setCurrentStatus(currentData);
    } catch (err) {
      console.error("Failed to load counters data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Counter
  async function handleCreateCounter(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await createCounter({ name: createName.trim() });
      setCreateName("");
      setShowCreateModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create counter");
    } finally {
      setIsCreating(false);
    }
  }

  // Handle Update Counter
  async function handleUpdateCounter(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCounter || !editName.trim() || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateCounter(editingCounter.id, {
        name: editName.trim(),
        isActive: editIsActive,
      });
      setEditingCounter(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update counter");
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle Delete Counter
  async function handleDeleteCounter(counter: Counter) {
    const confirmMsg = counter.totalSessions > 0
      ? `Counter "${counter.name}" has previous session history. Deleting it will mark it inactive. Continue?`
      : `Are you sure you want to permanently delete "${counter.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await deleteCounter(counter.id);
      alert(res.message);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete counter");
    }
  }

  // Handle Open Shift
  async function handleOpenShift(e: React.FormEvent) {
    e.preventDefault();
    if (!openingCounter || isOpeningShift) return;
    const cash = Math.max(0, Number(openingCashInput) || 0);

    setIsOpeningShift(true);
    try {
      await openCounterSession(openingCounter.id, {
        openingCash: cash,
        cashierName: cashierNameInput.trim() || "Demo Admin",
      });
      setOpeningCounter(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to open register");
    } finally {
      setIsOpeningShift(false);
    }
  }

  // Handle Close Shift
  async function handleCloseShift(e: React.FormEvent) {
    e.preventDefault();
    if (!closingCounter || isClosingShift) return;
    const closingCash = Math.max(0, Number(closingCashInput) || 0);

    setIsClosingShift(true);
    try {
      const result = await closeCounterSession(closingCounter.id, {
        closingCash,
        note: closingNoteInput.trim() || undefined,
      });
      setClosingCounter(null);
      setShiftCloseResult(result);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to close register shift");
    } finally {
      setIsClosingShift(false);
    }
  }

  // Open History Drawer
  async function handleViewHistory(counter: Counter) {
    setHistoryCounter(counter);
    setIsLoadingHistory(true);
    try {
      const history = await fetchCounterSessions(counter.id);
      setSessionsHistory(history || []);
    } catch (err) {
      console.error("Failed to load history:", err);
      setSessionsHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  // Calculate high-level stats
  const totalCounters = counters.length;
  const openCounters = counters.filter((c) => c.isOpen).length;
  const activeSession = currentStatus?.session;
  const currentTotalSales = currentStatus?.currentTotalSales || 0;
  const currentOpeningCash = activeSession ? Number(activeSession.openingCash) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">POS Counters</h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200/60">
              {totalCounters} {totalCounters === 1 ? "Register" : "Registers"}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Manage store counters, opening float cash, active shifts & daily closing balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="btn-ghost"
            title="Refresh counters"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus size={17} />
            Add Counter
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Total Counters</span>
            <Store size={17} className="text-stone-400" />
          </div>
          <p className="font-display text-2xl font-bold text-stone-900">{totalCounters}</p>
          <p className="text-xs text-stone-500">Configured in store</p>
        </div>

        <div className="card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Active Shifts</span>
            <span className="relative flex h-2 w-2">
              {openCounters > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  openCounters > 0 ? "bg-emerald-500" : "bg-stone-300"
                }`}
              />
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-stone-900">{openCounters}</p>
          <p className="text-xs text-stone-500">Currently open registers</p>
        </div>

        <div className="card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Shift Float Cash</span>
            <Banknote size={17} className="text-emerald-600" />
          </div>
          <p className="font-display text-2xl font-bold text-stone-900 tabular-nums">
            {formatCurrency(currentOpeningCash)}
          </p>
          <p className="text-xs text-stone-500">Drawer starting amount</p>
        </div>

        <div className="card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Current Shift Sales</span>
            <ShoppingBag size={17} className="text-brand-500" />
          </div>
          <p className="font-display text-2xl font-bold text-brand-600 tabular-nums">
            {formatCurrency(currentTotalSales)}
          </p>
          <p className="text-xs text-stone-500">{currentStatus?.totalOrders || 0} orders processed</p>
        </div>
      </div>

      {/* Active Shift Hero Banner (If any counter is open) */}
      {currentStatus?.isOpen && activeSession && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-500/10 via-emerald-50/50 to-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Active POS Shift Open
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs font-semibold text-stone-800">
                  {activeSession.counter?.name || "Counter 1"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-stone-600">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-stone-400" />
                  Cashier: <strong className="text-stone-900">{activeSession.cashierName}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-stone-400" />
                  Opened:{" "}
                  <strong className="text-stone-900">
                    {new Date(activeSession.openedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Banknote size={13} className="text-emerald-600" />
                  Opening Cash:{" "}
                  <strong className="text-stone-900">{formatCurrency(activeSession.openingCash)}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShoppingBag size={13} className="text-brand-600" />
                  Cash Sales:{" "}
                  <strong className="text-brand-700">
                    {formatCurrency(currentStatus.currentCashSales || 0)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link href="/pos" className="btn-ghost text-xs py-2">
                <ExternalLink size={14} />
                Open POS Sale
              </Link>
              <button
                type="button"
                onClick={() => {
                  const target = counters.find((c) => c.id === activeSession.counterId);
                  if (target) {
                    setClosingCounter(target);
                    setClosingCashInput(String(currentStatus.expectedCash || ""));
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
              >
                <Lock size={14} />
                Close Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counters List Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {counters.map((c) => {
          const session = c.currentSession;
          return (
            <div
              key={c.id}
              className={`card flex flex-col justify-between p-5 transition hover:shadow-md ${
                c.isOpen ? "border-emerald-300 ring-1 ring-emerald-500/20" : ""
              } ${!c.isActive ? "opacity-60 bg-stone-50" : ""}`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl shadow-sm ${
                        c.isOpen
                          ? "bg-emerald-500 text-white"
                          : c.isActive
                          ? "bg-brand-500 text-white"
                          : "bg-stone-200 text-stone-500"
                      }`}
                    >
                      <Store size={20} strokeWidth={2.2} />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
                        {c.name}
                      </h3>
                      <p className="text-xs text-stone-500">ID #{c.id}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {c.isOpen ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Open Shift
                      </span>
                    ) : c.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600">
                        <span className="h-2 w-2 rounded-full bg-stone-400" />
                        Closed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Counter Details Box */}
                <div className="mt-4 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Active Cashier:</span>
                    <span className="font-semibold text-stone-900">
                      {session?.cashierName || (c.isOpen ? "Admin" : "None")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Opening Float:</span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      {session ? formatCurrency(session.openingCash) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Shift Started:</span>
                    <span className="font-medium text-stone-800">
                      {session
                        ? new Date(session.openedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "No active shift"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600 border-t border-stone-200/80 pt-1.5">
                    <span>Total Shifts Completed:</span>
                    <span className="font-bold text-stone-900 tabular-nums">
                      {c.totalSessions} {c.totalSessions === 1 ? "shift" : "shifts"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="mt-5 space-y-2 border-t border-stone-100 pt-4">
                <div className="flex items-center gap-2">
                  {c.isOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setClosingCounter(c);
                        setClosingCashInput("");
                      }}
                      className="btn-primary flex-1 py-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Lock size={14} />
                      Close Shift
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!c.isActive}
                      onClick={() => {
                        setOpeningCounter(c);
                        setOpeningCashInput("500");
                        setCashierNameInput("Demo Admin");
                      }}
                      className="btn-primary flex-1 py-2 text-xs"
                    >
                      <Unlock size={14} />
                      Open Register
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleViewHistory(c)}
                    className="btn-ghost py-2 px-2.5 text-xs"
                    title="View Shift History"
                  >
                    <History size={14} />
                    <span className="hidden sm:inline">History</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCounter(c);
                      setEditName(c.name);
                      setEditIsActive(c.isActive);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCounter(c)}
                    className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {counters.length === 0 && !isLoading && (
          <div className="col-span-full card p-12 text-center space-y-3">
            <Store size={36} className="mx-auto text-stone-300" />
            <h3 className="font-semibold text-stone-800">No Counters Configured</h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto">
              Add your first store counter register to start opening shifts and tracking drawer cash.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus size={16} />
              Add Counter
            </button>
          </div>
        )}
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Add Counter Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-display text-lg font-bold text-stone-900">Add New POS Counter</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCounter} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Counter Name / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter 2, Express Checkout"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="input"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="btn-primary">
                  {isCreating ? "Adding..." : "Create Counter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Counter Modal */}
      {editingCounter && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-display text-lg font-bold text-stone-900">Edit Counter</h3>
              <button
                type="button"
                onClick={() => setEditingCounter(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCounter} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Counter Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="active-checkbox"
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="active-checkbox" className="text-xs font-medium text-stone-700">
                  Active (Allow opening shifts on this register)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingCounter(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isUpdating} className="btn-primary">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Open Register Shift Modal */}
      {openingCounter && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <Unlock size={18} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
                    Open Register Shift
                  </h3>
                  <p className="text-xs text-stone-500">{openingCounter.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpeningCounter(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cashier Name
                </label>
                <input
                  type="text"
                  required
                  value={cashierNameInput}
                  onChange={(e) => setCashierNameInput(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Opening Cash Float in Drawer (শুরুর ক্যাশ)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    className="input pl-8 font-bold text-stone-900 text-base tabular-nums"
                  />
                </div>

                {/* Quick Float Shortcuts */}
                <div className="mt-2 flex items-center gap-2">
                  {[0, 500, 1000, 2000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setOpeningCashInput(String(val))}
                      className="rounded border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 transition"
                    >
                      ৳{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Opening the register will start tracking cash sales, orders, and expected drawer total for this shift.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setOpeningCounter(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOpeningShift}
                  className="btn-primary"
                >
                  {isOpeningShift ? "Opening..." : "Confirm & Open Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Close Register Shift Modal */}
      {closingCounter && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Lock size={18} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
                    Close Register Shift
                  </h3>
                  <p className="text-xs text-stone-500">{closingCounter.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClosingCounter(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="mt-4 space-y-4">
              {/* Shift Sales Live Summary */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Opening Float:</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {formatCurrency(currentStatus?.session?.openingCash || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Shift Cash Sales:</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {formatCurrency(currentStatus?.currentCashSales || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-2 font-bold text-stone-900 text-sm">
                  <span>Expected in Drawer:</span>
                  <span className="text-brand-600 tabular-nums">
                    {formatCurrency(currentStatus?.expectedCash || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Actual Counted Cash in Drawer (গণনাকৃত সমাপনী ক্যাশ)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Enter physical cash amount"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    className="input pl-8 font-bold text-stone-900 text-base tabular-nums"
                  />
                </div>

                {/* Quick fill with expected amount */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setClosingCashInput(String(currentStatus?.expectedCash || 0))
                    }
                    className="rounded border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 transition"
                  >
                    Match Expected ({formatCurrency(currentStatus?.expectedCash || 0)})
                  </button>
                </div>
              </div>

              {/* Real-time difference calculation */}
              {closingCashInput !== "" && (
                <div
                  className={`rounded-xl border p-3 text-xs flex items-center justify-between ${
                    Number(closingCashInput) - (currentStatus?.expectedCash || 0) === 0
                      ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                      : Number(closingCashInput) - (currentStatus?.expectedCash || 0) > 0
                      ? "border-blue-200 bg-blue-50/80 text-blue-800"
                      : "border-red-200 bg-red-50/80 text-red-800"
                  }`}
                >
                  <span className="font-semibold">Cash Difference:</span>
                  <span className="font-display text-base font-bold tabular-nums">
                    {Number(closingCashInput) - (currentStatus?.expectedCash || 0) > 0 && "+"}
                    {formatCurrency(
                      Number(closingCashInput) - (currentStatus?.expectedCash || 0)
                    )}
                    {Number(closingCashInput) - (currentStatus?.expectedCash || 0) === 0 && " (Balanced)"}
                    {Number(closingCashInput) - (currentStatus?.expectedCash || 0) > 0 && " (Over)"}
                    {Number(closingCashInput) - (currentStatus?.expectedCash || 0) < 0 && " (Short)"}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Closing Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cash drawer handed over to manager safe"
                  value={closingNoteInput}
                  onChange={(e) => setClosingNoteInput(e.target.value)}
                  className="input py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setClosingCounter(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClosingShift}
                  className="btn-primary bg-emerald-700 hover:bg-emerald-800"
                >
                  {isClosingShift ? "Closing Shift..." : "Confirm & Close Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Shift Closed Summary / Difference Report Modal */}
      {shiftCloseResult && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="card w-full max-w-md p-6">
            <div className="text-center space-y-1">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto border border-emerald-100">
                <CheckCircle2 size={28} />
              </span>
              <h3 className="font-display text-xl font-bold text-stone-900 mt-3">
                Shift Closed Successfully
              </h3>
              <p className="text-xs text-stone-500">
                {shiftCloseResult.counter.name} • {shiftCloseResult.session.cashierName}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Opening Cash Float:</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatCurrency(shiftCloseResult.openingCash)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shift Cash Sales:</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatCurrency(shiftCloseResult.cashSales)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Total Shift Revenue:</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatCurrency(shiftCloseResult.totalSales)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Total Orders Handled:</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {shiftCloseResult.totalOrders}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-semibold text-stone-800">
                <span>Expected Drawer Total:</span>
                <span className="tabular-nums">{formatCurrency(shiftCloseResult.expectedCash)}</span>
              </div>
              <div className="flex justify-between font-semibold text-stone-800">
                <span>Physical Cash Counted:</span>
                <span className="tabular-nums">{formatCurrency(shiftCloseResult.closingCash)}</span>
              </div>
              <div className="border-t border-stone-300 pt-2 flex justify-between items-center text-sm font-bold">
                <span>Discrepancy (পার্থক্য):</span>
                <span
                  className={`tabular-nums font-display ${
                    shiftCloseResult.isBalanced
                      ? "text-emerald-600"
                      : shiftCloseResult.isOver
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {shiftCloseResult.difference > 0 && "+"}
                  {formatCurrency(shiftCloseResult.difference)}
                  {shiftCloseResult.isBalanced && " (Balanced)"}
                  {shiftCloseResult.isOver && " (Over)"}
                  {shiftCloseResult.isShort && " (Short)"}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShiftCloseResult(null)}
                className="btn-primary flex-1"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Shift History Modal */}
      {historyCounter && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="card w-full max-w-3xl max-h-[85vh] flex flex-col p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <History size={18} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900 leading-tight">
                    Shift History & Register Reports
                  </h3>
                  <p className="text-xs text-stone-500">{historyCounter.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryCounter(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-xs text-stone-400">Loading history...</div>
              ) : sessionsHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  No shift history found for this counter yet.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-6 gap-2 bg-stone-50 p-3 font-semibold text-stone-700">
                    <span>Opened</span>
                    <span>Closed</span>
                    <span>Cashier</span>
                    <span className="text-right">Opening Float</span>
                    <span className="text-right">Closing Cash</span>
                    <span className="text-right">Difference</span>
                  </div>
                  {sessionsHistory.map((s) => {
                    const diff = Number(s.difference) || 0;
                    return (
                      <div
                        key={s.id}
                        className="grid grid-cols-6 gap-2 p-3 items-center hover:bg-stone-50/50"
                      >
                        <div>
                          <p className="font-semibold text-stone-900">
                            {new Date(s.openedAt).toLocaleDateString()}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {new Date(s.openedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div>
                          {s.closedAt ? (
                            <>
                              <p className="font-semibold text-stone-900">
                                {new Date(s.closedAt).toLocaleDateString()}
                              </p>
                              <p className="text-[11px] text-stone-400">
                                {new Date(s.closedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </>
                          ) : (
                            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              Open Now
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-stone-800">{s.cashierName}</div>
                        <div className="text-right font-medium tabular-nums text-stone-800">
                          {formatCurrency(s.openingCash)}
                        </div>
                        <div className="text-right font-medium tabular-nums text-stone-800">
                          {s.closingCash !== null ? formatCurrency(s.closingCash) : "—"}
                        </div>
                        <div className="text-right font-bold tabular-nums">
                          {s.status === "Closed" ? (
                            <span
                              className={
                                diff === 0
                                  ? "text-emerald-600"
                                  : diff > 0
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }
                            >
                              {diff > 0 && "+"}
                              {formatCurrency(diff)}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryCounter(null)}
                className="btn-ghost"
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
