"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, Plus, Star, X } from "lucide-react";
import { createCustomer, fetchCustomers } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import type { Customer } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CustomersPage() {
  const toast = useToast();
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchCustomers().then((data) => {
      if (isMounted) {
        setCustomerList(data || []);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
      });
      setCustomerList((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setFormData({ name: "", phone: "", email: "" });
      toast.success("Customer Saved", `"${created.name}" added to customer records.`);
    } catch (err: any) {
      console.error("Backend add customer failed:", err);
      toast.error("Save Failed", err.message || "Failed to save customer in database.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-sm text-stone-500">{customerList.length} registered members</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {customerList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-stone-400 dark:text-slate-500">
            No registered customers yet
          </div>
        ) : (
          customerList.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/15 font-bold text-brand-700 dark:text-brand-300">
                {initials(c.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-900 dark:text-white">{c.name}</p>
                <p className="text-xs text-stone-500 dark:text-slate-400">Last visit {c.lastVisit}</p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-stone-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Phone size={15} className="text-stone-400 dark:text-slate-500" /> {c.phone}
              </p>
              <p className="flex items-center gap-2">
                <Mail size={15} className="text-stone-400 dark:text-slate-500" /> {c.email || "No email"}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-stone-100 dark:border-[#1F293D] pt-4 text-center">
              <div>
                <p className="text-lg font-bold text-stone-900 dark:text-white">{c.totalOrders}</p>
                <p className="text-xs text-stone-500 dark:text-slate-400">Orders</p>
              </div>
              <div>
                <p className="text-lg font-bold text-stone-900 dark:text-white">{formatCurrency(c.totalSpent)}</p>
                <p className="text-xs text-stone-500 dark:text-slate-400">Spent</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-lg font-bold text-brand-600 dark:text-brand-400">
                  <Star size={14} className="fill-brand-500 text-brand-500" />
                  {c.loyaltyPoints}
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400">Points</p>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm"
        >
          <div className="card w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#1F293D] pb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">Add New Customer</h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">Register a new customer for loyalty rewards</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-[#162035] hover:text-stone-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahim Uddin"
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 01711-000111"
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. rahim@example.com"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-stone-100 dark:border-[#1F293D] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
