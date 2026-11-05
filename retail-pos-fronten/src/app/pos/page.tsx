"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  Printer,
  Search,
  Smartphone,
  Store,
  Trash2,
  X,
} from "lucide-react";
import {
  createSale,
  fetchCategories,
  fetchCustomers,
  fetchProducts,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { CartItem, Category, Customer, PaymentMethod, Product } from "@/lib/types";

const VAT_RATE = 0.05;

interface CompletedReceiptItem {
  id: string | number;
  name: string;
  sku: string;
  price: number;
  qty: number;
  total: number;
}

interface CompletedReceipt {
  id: string;
  date: string;
  time: string;
  counter: string;
  outletName: string;
  storeName: string;
  customerName: string;
  items: CompletedReceiptItem[];
  itemsTotal: number;
  itemsDiscount: number;
  itemsVat: number;
  subtotal: number;
  discountValue: number;
  vat: number;
  serviceCharge: number;
  deliveryCharge: number;
  previousDue: number;
  netTotal: number;
  paymentMethod: PaymentMethod;
  customerPaid: number;
  currentDue: number;
  change: number;
  billBy: string;
}

function formatReceiptNumber(num: number): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatReceiptCurrency(num: number): string {
  return `৳ ${formatReceiptNumber(num)}`;
}

const paymentMethods: { id: PaymentMethod; icon: typeof Banknote }[] = [
  { id: "Cash", icon: Banknote },
  { id: "Card", icon: CreditCard },
  { id: "bKash", icon: Smartphone },
  { id: "Nagad", icon: Smartphone },
];

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | string | "All">("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("walk-in");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("Cash");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [receipt, setReceipt] = useState<CompletedReceipt | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [prodData, catData, custData] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchCustomers(),
        ]);
        if (isMounted) {
          if (prodData && prodData.length > 0) setProducts(prodData);
          if (catData && catData.length > 0) setCategoriesList(catData.map((c) => c.name));
          if (custData && custData.length > 0) setCustomersList(custData);
        }
      } catch (err) {
        console.warn("Could not load fresh data from API, using cached data:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );
  }, [products, query, category]);

  const qtyInCart = (id: string | number) =>
    cart.find((i) => String(i.product.id) === String(id))?.qty ?? 0;

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const discountAmount = (subtotal * discount) / 100;
  const vat = (subtotal - discountAmount) * VAT_RATE;
  const total = subtotal - discountAmount + vat;
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const effectivePaid = paidAmount === "" ? total : Math.max(0, Number(paidAmount) || 0);
  const changeAmount = Math.max(0, effectivePaid - total);
  const dueAmount = Math.max(0, total - effectivePaid);

  const suggestedNotes = useMemo(() => {
    if (total <= 0) return [];
    const baseNotes = [50, 100, 200, 500, 1000];
    const higher = baseNotes.filter((n) => n >= total);
    if (higher.length > 0) return higher.slice(0, 3);
    const next500 = Math.ceil(total / 500) * 500;
    const next1000 = Math.ceil(total / 1000) * 1000;
    return Array.from(new Set([next500, next1000]));
  }, [total]);

  function addToCart(product: Product) {
    if (product.stock === 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => String(i.product.id) === String(product.id));
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) =>
          String(i.product.id) === String(product.id) ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(productId: string | number, delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          String(i.product.id) === String(productId)
            ? { ...i, qty: Math.min(i.qty + delta, i.product.stock) }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(productId: string | number) {
    setCart((prev) => prev.filter((i) => String(i.product.id) !== String(productId)));
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
    setCustomerId("walk-in");
    setPaidAmount("");
  }

  async function checkout() {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Build items payload
      const itemsPayload = cart.map((i) => ({
        productId: Number(i.product.id),
        qty: i.qty,
      }));

      // Find selected customer name
      const selectedCustomer = customersList.find((c) => String(c.id) === String(customerId));
      const customerName = selectedCustomer ? selectedCustomer.name : "Walk in customer";

      // Snapshot receipt items before clearing cart
      const receiptItems: CompletedReceiptItem[] = cart.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        sku: i.product.sku,
        price: i.product.price,
        qty: i.qty,
        total: i.product.price * i.qty,
      }));

      const finalSubtotal = subtotal;
      const finalDiscountAmount = discountAmount;
      const finalVat = vat;
      const finalTotal = total;
      const finalPayment = payment;

      const createdSale = await createSale({
        customerId: customerId === "walk-in" ? undefined : Number(customerId),
        payment,
        discountPercent: discount > 0 ? discount : undefined,
        items: itemsPayload,
      });

      // Format date and time
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Format invoice number, e.g. SIN-34
      const rawSaleId = createdSale.id ? String(createdSale.id).replace(/\D+/g, "") : "";
      const displayId =
        Number(rawSaleId) > 1000 ? String(Number(rawSaleId) - 1000) : rawSaleId || "34";
      const invoiceNo = `SIN-${displayId}`;

      setReceipt({
        id: invoiceNo,
        date: dateStr,
        time: timeStr,
        counter: "Counter 1",
        outletName: "Main Branch",
        storeName: "Retail POS",
        customerName,
        items: receiptItems,
        itemsTotal: finalSubtotal,
        itemsDiscount: 0,
        itemsVat: 0,
        subtotal: finalSubtotal,
        discountValue: finalDiscountAmount,
        vat: finalVat,
        serviceCharge: 0,
        deliveryCharge: 0,
        previousDue: 0,
        netTotal: finalTotal,
        paymentMethod: finalPayment,
        customerPaid: effectivePaid,
        currentDue: dueAmount,
        change: changeAmount,
        billBy: "Admin",
      });

      setShowConfirmModal(false);

      // Update in-memory product stocks immediately
      setProducts((prev) =>
        prev.map((p) => {
          const cartItem = cart.find((i) => String(i.product.id) === String(p.id));
          if (!cartItem) return p;
          return {
            ...p,
            stock: Math.max(0, p.stock - cartItem.qty),
          };
        })
      );

      // Re-fetch products in background to synchronize with DB
      fetchProducts().then((latest) => {
        if (latest && latest.length > 0) setProducts(latest);
      });

      clearCart();
    } catch (err: any) {
      console.error("Sale checkout error:", err);
      alert(err.message || "Failed to process sale. Please verify backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[1fr_390px]">
      {/* Product catalog */}
      <section className="min-w-0 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">Point of sale</h1>
            <p className="mt-1 text-sm text-stone-500">Tap a product to add it to the order.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
              placeholder="Search name or SKU"
              className="input pl-10"
            />
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto border-b border-stone-200" role="tablist">
          {(["All", ...categoriesList] as const).map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(c)}
                className={`relative shrink-0 pb-3 text-sm font-medium transition ${
                  active ? "text-stone-950" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {c}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((p) => {
            const out = p.stock === 0;
            const low = p.stock <= p.reorderLevel;
            const inCart = qtyInCart(p.id);
            return (
              <button
                key={p.id}
                type="button"
                disabled={out}
                onClick={() => addToCart(p)}
                className="group flex flex-col rounded-xl border border-stone-200 bg-white p-3 text-left transition hover:border-brand-500 active:scale-[0.99] disabled:opacity-50"
              >
                <div className="relative grid h-24 place-items-center rounded-lg bg-brand-50 text-4xl">
                  {p.emoji}
                  {inCart > 0 && (
                    <span className="absolute right-2 top-2 rounded-md bg-stone-950 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white">
                      {inCart} in order
                    </span>
                  )}
                </div>
                <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">
                  {p.name}
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="font-display text-xl font-semibold tabular-nums">
                      {formatCurrency(p.price)}
                    </p>
                    <p className={`text-xs ${low ? "text-red-600" : "text-stone-500"}`}>
                      {out ? "Out of stock" : `${p.stock} in stock`}
                    </p>
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100 text-stone-700 transition group-hover:bg-brand-500 group-hover:text-white">
                    <Plus size={16} />
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-16 text-center text-sm text-stone-500">
              No products match. Try another name or category.
            </p>
          )}
        </div>
      </section>

      {/* Receipt: the one bold element on this screen */}
      <aside className="xl:sticky xl:top-20" aria-label="Current order">
        <div className="drop-shadow-[0_10px_20px_rgba(12,10,9,0.08)]">
          <div className="receipt-edge border-t-4 border-brand-500 bg-white pb-7">
            <div className="px-5 pb-4 pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-xl font-semibold leading-none">Retail POS</p>
                  <p className="mt-1.5 text-xs text-stone-500">Main Branch, Counter 1</p>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="text-sm font-medium text-stone-500 transition hover:text-red-600 disabled:opacity-40"
                >
                  Clear order
                </button>
              </div>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input mt-4"
                aria-label="Customer"
              >
                <option value="walk-in">Walk-in customer</option>
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-dashed border-stone-300 px-5">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-stone-700">No items yet</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Products you add will be listed here.
                  </p>
                </div>
              ) : (
                <ul className="max-h-[300px] divide-y divide-stone-100 overflow-y-auto">
                  {cart.map(({ product, qty }) => (
                    <li key={product.id} className="py-3">
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="font-medium">{product.name}</span>
                        <span
                          aria-hidden
                          className="min-w-4 flex-1 border-b border-dotted border-stone-300"
                        />
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(product.price * qty)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                        <span className="tabular-nums">
                          {qty} × {formatCurrency(product.price)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Decrease ${product.name}`}
                            onClick={() => changeQty(product.id, -1)}
                            className="grid h-6 w-6 place-items-center rounded-md border border-stone-300 text-stone-700 hover:bg-stone-100"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums text-stone-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${product.name}`}
                            onClick={() => changeQty(product.id, 1)}
                            className="grid h-6 w-6 place-items-center rounded-md border border-stone-300 text-stone-700 hover:bg-stone-100"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${product.name}`}
                            onClick={() => removeItem(product.id)}
                            className="ml-1 text-stone-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2 border-t border-dashed border-stone-300 px-5 py-4 text-sm">
              <Line label={`Subtotal (${itemCount} items)`} value={formatCurrency(subtotal)} />
              <div className="flex items-center justify-between text-stone-600">
                <label htmlFor="discount" className="flex items-center gap-2">
                  Discount
                  <input
                    id="discount"
                    type="number"
                    min={0}
                    max={100}
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                    }
                    className="w-14 rounded-md border border-stone-300 px-2 py-1 text-right text-sm tabular-nums text-stone-900"
                  />
                  <span>%</span>
                </label>
                <span className="font-medium tabular-nums text-stone-900">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
              <Line label="VAT 5%" value={formatCurrency(vat)} />
              <div className="flex items-end justify-between border-t border-stone-900 pt-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display text-3xl font-semibold tabular-nums tracking-tight">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="space-y-3 px-5">
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Payment method">
                {paymentMethods.map(({ id, icon: Icon }) => {
                  const active = payment === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPayment(id)}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2.5 text-xs font-medium transition ${
                        active
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-stone-300 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      <Icon size={17} />
                      {id}
                    </button>
                  );
                })}
              </div>

              {/* Customer Paid & Change Calculation Box */}
              <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="customer-paid" className="font-semibold text-stone-700">
                    Customer Paid:
                  </label>
                  <div className="relative w-32">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-stone-400">
                      ৳
                    </span>
                    <input
                      id="customer-paid"
                      type="number"
                      min={0}
                      step="any"
                      placeholder={total > 0 ? String(Math.ceil(total)) : "0"}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white py-1.5 pl-6 pr-2.5 text-right font-bold tabular-nums text-stone-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Quick note buttons */}
                {total > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(String(total))}
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                        paidAmount === String(total) || (paidAmount === "" && effectivePaid === total)
                          ? "border-brand-500 bg-brand-50 text-brand-700 font-bold"
                          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      Exact
                    </button>
                    {suggestedNotes.map((note) => (
                      <button
                        key={note}
                        type="button"
                        onClick={() => setPaidAmount(String(note))}
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
                          paidAmount === String(note)
                            ? "border-brand-500 bg-brand-50 text-brand-700 font-bold"
                            : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        ৳{note}
                      </button>
                    ))}
                  </div>
                )}

                {/* Change amount line */}
                <div className="flex items-center justify-between border-t border-stone-200/90 pt-2 font-medium">
                  <span className="font-semibold text-stone-700">Change (ফেরত):</span>
                  <span
                    className={`font-display text-base font-bold tabular-nums ${
                      changeAmount > 0 ? "text-emerald-600" : "text-stone-900"
                    }`}
                  >
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={cart.length === 0 || isSubmitting}
                className="btn-primary w-full py-3.5 text-base"
              >
                {isSubmitting ? "Processing..." : `Charge ${formatCurrency(total)}`}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Confirm Sale Modal (Alert) */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Sale"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <button
              type="button"
              aria-label="Close"
              disabled={isSubmitting}
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border border-stone-200 text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition"
            >
              <X size={16} />
            </button>

            {/* Icon & Title */}
            <div className="flex items-center gap-3.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 shadow-sm border border-brand-100">
                <Store size={22} strokeWidth={2.4} />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-stone-900 leading-tight">
                  Confirm Sale
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Confirm order details before charging.
                </p>
              </div>
            </div>

            {/* Order Overview Summary */}
            <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Customer</span>
                <span className="font-semibold text-stone-900">
                  {customersList.find((c) => String(c.id) === String(customerId))?.name || "Walk-in customer"}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Total Items</span>
                <span className="font-semibold tabular-nums text-stone-900">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Payment Method</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-stone-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {payment}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex items-baseline justify-between">
                <span className="font-semibold text-stone-900">Total Payable</span>
                <span className="font-display text-xl font-bold text-brand-600 tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
              {effectivePaid > total && (
                <div className="flex items-center justify-between text-stone-600">
                  <span>Customer Paid</span>
                  <span className="font-semibold tabular-nums text-stone-900">
                    {formatCurrency(effectivePaid)}
                  </span>
                </div>
              )}
              {changeAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-medium">
                  <span>Change to Return</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-lg border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition active:translate-y-px disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={checkout}
                className="btn-primary flex-1 py-2.5 text-sm font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  "Confirm & Pay"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Completed - Receipt preview modal */}
      {receipt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sale Completed - Receipt preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative flex max-h-[92vh] w-full max-w-[420px] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 p-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Check className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-stone-900 leading-tight">Sale Completed</h3>
                  <p className="text-xs text-stone-400 font-medium">Receipt preview & print</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setReceipt(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-stone-100/60">
              <div
                id="printable-receipt"
                className="rounded-xl border border-stone-200 bg-white p-5 font-sans text-stone-900 shadow-sm"
              >
                {/* Project Branding Header */}
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-white shadow-sm">
                    <Store size={24} strokeWidth={2.4} />
                  </span>
                  <h2 className="mt-2.5 font-display text-xl font-bold tracking-tight text-stone-900">
                    Retail POS
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-stone-500">
                    Main Branch • Counter 1
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 border border-brand-200/60">
                    Sales Receipt
                  </span>
                </div>

                {/* Meta Grid */}
                <div className="mt-4 rounded-lg border border-stone-200/90 bg-stone-50/80 p-3 text-xs">
                  <div className="grid grid-cols-2 gap-y-1.5">
                    <div>
                      <span className="text-stone-400">Invoice: </span>
                      <span className="font-bold text-stone-900 font-mono">{receipt.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-400">Date: </span>
                      <span className="font-semibold text-stone-800">{receipt.date}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Counter: </span>
                      <span className="font-semibold text-stone-800">{receipt.counter}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-400">Time: </span>
                      <span className="font-semibold text-stone-800">{receipt.time}</span>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="mt-4">
                  <div className="flex justify-between border-b border-stone-200 pb-1.5 text-xs font-bold text-stone-800 uppercase tracking-wider">
                    <span>Item Details</span>
                    <span>Amount</span>
                  </div>

                  <div className="divide-y divide-dashed divide-stone-200 py-1">
                    {receipt.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 text-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-stone-900 leading-snug">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-stone-400 font-mono">
                              SKU: {item.sku}
                            </p>
                          </div>
                          <div className="text-right whitespace-nowrap shrink-0">
                            <p className="text-stone-500 text-[11px]">
                              {formatReceiptNumber(item.price)} × {item.qty}
                            </p>
                            <p className="mt-0.5 font-bold text-stone-900 tabular-nums">
                              {formatReceiptCurrency(item.total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="mt-2 space-y-1.5 border-t border-stone-200 pt-3 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal ({receipt.items.reduce((s, i) => s + i.qty, 0)} items)</span>
                    <span className="font-semibold text-stone-800 tabular-nums">
                      {formatReceiptCurrency(receipt.subtotal)}
                    </span>
                  </div>

                  {receipt.discountValue > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span className="tabular-nums">-{formatReceiptCurrency(receipt.discountValue)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>VAT (5%)</span>
                    <span className="font-semibold text-stone-800 tabular-nums">
                      {formatReceiptCurrency(receipt.vat)}
                    </span>
                  </div>

                  {/* Net Total Card */}
                  <div className="mt-2.5 flex items-center justify-between rounded-lg bg-stone-900 px-3.5 py-2.5 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                      Net Total
                    </span>
                    <span className="font-display text-xl font-bold tabular-nums text-white">
                      {formatReceiptCurrency(receipt.netTotal)}
                    </span>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50/70 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Payment Method:</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-stone-900">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      {receipt.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Customer Paid:</span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      {formatReceiptCurrency(receipt.customerPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Change:</span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      {formatReceiptCurrency(receipt.change)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-stone-200">
                    <span className="text-stone-500">Payment Status:</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      PAID
                    </span>
                  </div>
                </div>

                {/* Customer & Cashier */}
                <div className="mt-3 flex justify-between border-b border-stone-200 pb-2.5 text-xs">
                  <div>
                    <span className="text-stone-400">Bill To: </span>
                    <span className="font-semibold text-stone-800">{receipt.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400">Billed By: </span>
                    <span className="font-semibold text-stone-800">{receipt.billBy}</span>
                  </div>
                </div>

                {/* Vector Barcode */}
                <div className="mt-4 flex flex-col items-center justify-center">
                  <svg
                    viewBox="0 0 260 44"
                    className="h-10 w-48 text-stone-800"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="0" y="0" width="3" height="44" />
                    <rect x="5" y="0" width="2" height="44" />
                    <rect x="10" y="0" width="4" height="44" />
                    <rect x="17" y="0" width="2" height="44" />
                    <rect x="22" y="0" width="5" height="44" />
                    <rect x="30" y="0" width="2" height="44" />
                    <rect x="34" y="0" width="3" height="44" />
                    <rect x="40" y="0" width="1" height="44" />
                    <rect x="44" y="0" width="6" height="44" />
                    <rect x="53" y="0" width="2" height="44" />
                    <rect x="58" y="0" width="4" height="44" />
                    <rect x="65" y="0" width="2" height="44" />
                    <rect x="70" y="0" width="5" height="44" />
                    <rect x="78" y="0" width="3" height="44" />
                    <rect x="84" y="0" width="2" height="44" />
                    <rect x="89" y="0" width="6" height="44" />
                    <rect x="98" y="0" width="2" height="44" />
                    <rect x="103" y="0" width="4" height="44" />
                    <rect x="110" y="0" width="2" height="44" />
                    <rect x="115" y="0" width="5" height="44" />
                    <rect x="123" y="0" width="3" height="44" />
                    <rect x="129" y="0" width="2" height="44" />
                    <rect x="134" y="0" width="6" height="44" />
                    <rect x="143" y="0" width="2" height="44" />
                    <rect x="148" y="0" width="4" height="44" />
                    <rect x="155" y="0" width="2" height="44" />
                    <rect x="160" y="0" width="5" height="44" />
                    <rect x="168" y="0" width="3" height="44" />
                    <rect x="174" y="0" width="2" height="44" />
                    <rect x="179" y="0" width="6" height="44" />
                    <rect x="188" y="0" width="3" height="44" />
                    <rect x="194" y="0" width="2" height="44" />
                    <rect x="199" y="0" width="5" height="44" />
                    <rect x="207" y="0" width="2" height="44" />
                    <rect x="212" y="0" width="4" height="44" />
                    <rect x="219" y="0" width="2" height="44" />
                    <rect x="224" y="0" width="5" height="44" />
                    <rect x="232" y="0" width="3" height="44" />
                    <rect x="238" y="0" width="2" height="44" />
                    <rect x="243" y="0" width="5" height="44" />
                    <rect x="251" y="0" width="3" height="44" />
                    <rect x="257" y="0" width="3" height="44" />
                  </svg>
                  <p className="mt-1 text-[11px] font-mono tracking-widest text-stone-400">
                    *{receipt.id}*
                  </p>
                </div>

                {/* Footer Notes */}
                <div className="mt-3.5 text-center space-y-1">
                  <p className="font-semibold text-xs text-stone-900">
                    Thank You For Shopping with Us!
                  </p>
                  <p className="text-[11px] text-stone-500 leading-tight">
                    Exchange or refund within 14 days with original receipt.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 border-t border-stone-100 bg-white p-4">
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="btn-ghost flex-1 py-2.5 text-sm font-semibold"
              >
                Start New Sale
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="btn-primary flex-1 py-2.5 text-sm font-semibold shadow-sm inline-flex items-center justify-center gap-2"
              >
                <Printer size={17} />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-stone-600">
      <span>{label}</span>
      <span className="font-medium tabular-nums text-stone-900">{value}</span>
    </div>
  );
}
