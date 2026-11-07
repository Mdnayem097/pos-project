"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  Download,
  Edit2,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Package,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import Badge from "@/components/Badge";
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  updateProduct,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import type { Category, CategoryItem, Product } from "@/lib/types";

type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type SortOption = "name" | "price-asc" | "price-desc" | "stock-asc" | "margin-desc";

const emojiOptions = ["🍚", "🛢️", "🫘", "🧂", "🥭", "💧", "🥤", "🍵", "🥔", "🍪", "🍜", "🥛", "🧈", "🧼", "🧴", "🫧", "🧺", "🧻", "🍎", "🍫", "🍞", "☕"];

const categoryColors: Record<string, "brand" | "green" | "amber" | "stone"> = {
  Grocery: "brand",
  Beverages: "green",
  Snacks: "amber",
  Dairy: "brand",
  "Personal Care": "stone",
  Household: "stone",
};

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Actions dropdown & Delete confirmation states
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    category: Category;
    cost: number;
    price: number;
    stock: number;
    reorderLevel: number;
    emoji: string;
  }>({
    name: "",
    sku: "",
    category: "Grocery",
    cost: 0,
    price: 0,
    stock: 0,
    reorderLevel: 10,
    emoji: "📦",
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
        if (isMounted) {
          if (prods && prods.length > 0) setProducts(prods);
          if (cats && cats.length > 0) setCategoriesList(cats);
        }
      } catch (err) {
        console.warn("Could not load products/categories from API:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate statistics
  const totalStockUnits = useMemo(() => products.reduce((acc, p) => acc + p.stock, 0), [products]);
  const totalStockValue = useMemo(() => products.reduce((acc, p) => acc + p.stock * p.cost, 0), [products]);
  const lowStockCount = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.stock === 0).length, [products]);

  // Filtering and Sorting
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== "All" && p.category !== selectedCategory) return false;

        // Query filter
        if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) {
          return false;
        }

        // Stock status filter
        if (stockFilter === "in-stock" && p.stock <= p.reorderLevel) return false;
        if (stockFilter === "low-stock" && (p.stock === 0 || p.stock > p.reorderLevel)) return false;
        if (stockFilter === "out-of-stock" && p.stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "stock-asc") return a.stock - b.stock;
        if (sortBy === "margin-desc") {
          const marginA = ((a.price - a.cost) / a.price) * 100;
          const marginB = ((b.price - b.cost) / b.price) * 100;
          return marginB - marginA;
        }
        return 0;
      });
  }, [products, query, selectedCategory, stockFilter, sortBy]);

  // Handle open add modal
  function handleOpenAdd() {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: `SKU-${1000 + products.length + 1}`,
      category: "Grocery",
      cost: 0,
      price: 0,
      stock: 20,
      reorderLevel: 10,
      emoji: "📦",
    });
    setIsModalOpen(true);
  }

  // Handle open edit modal
  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category as Category,
      cost: product.cost,
      price: product.price,
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      emoji: product.emoji,
    });
    setIsModalOpen(true);
  }

  // Save product
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const matchedCat = categoriesList.find((c) => c.name === formData.category);
    const categoryId = matchedCat?.id || 1;

    try {
      if (editingProduct) {
        // Update in backend
        await updateProduct(editingProduct.id, {
          name: formData.name,
          sku: formData.sku,
          price: Number(formData.price),
          cost: Number(formData.cost),
          stock: Number(formData.stock),
          reorderLevel: Number(formData.reorderLevel),
          emoji: formData.emoji,
          categoryId,
        });

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...formData,
                  categoryId,
                }
              : p
          )
        );
      } else {
        // Add new in backend
        const created = await createProduct({
          name: formData.name,
          sku: formData.sku,
          price: Number(formData.price),
          cost: Number(formData.cost),
          stock: Number(formData.stock),
          reorderLevel: Number(formData.reorderLevel),
          emoji: formData.emoji,
          categoryId,
        });

        setProducts((prev) => [created, ...prev]);
        toast.success("Product Created", `"${created.name}" added to catalog.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Backend save failed:", err);
      toast.error("Save Failed", err.message || "Failed to save product to database.");
    }
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClose = () => setOpenMenuId(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  // Confirm delete product
  async function handleConfirmDelete() {
    if (!deleteConfirmProduct) return;
    const name = deleteConfirmProduct.name;
    try {
      setIsDeleting(true);
      await deleteProduct(deleteConfirmProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteConfirmProduct.id));
      setDeleteConfirmProduct(null);
      toast.info("Product Deleted", `"${name}" removed from catalog.`);
    } catch (err: any) {
      console.error("Backend delete failed:", err);
      toast.error("Delete Failed", err.message || "Failed to delete product from database.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
              Products Catalog
            </h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
              {products.length} Items
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
            Manage your store inventory, retail pricing, margins, and stock alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                ["SKU,Name,Category,Cost,Price,Stock", ...products.map((p) => `${p.sku},"${p.name}",${p.category},${p.cost},${p.price},${p.stock}`)].join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "products.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="btn-ghost"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary shadow-sm hover:shadow"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Items */}
        <div className="card group relative overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-[4px] bg-transparent transition-all duration-200 group-hover:bg-brand-500 rounded-t-2xl" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 transition-colors group-hover:text-stone-800 dark:text-slate-200">
              Total Items
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100 dark:bg-[#162035] text-stone-700 dark:text-slate-300 transition-all duration-200 group-hover:bg-brand-50 group-hover:text-brand-600">
              <Package size={17} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-white transition-transform duration-200 group-hover:translate-x-0.5">
            {products.length}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">{totalStockUnits.toLocaleString()} units in stock</p>
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
            {formatCurrency(totalStockValue)}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">Total valuation at cost</p>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => setStockFilter(stockFilter === "low-stock" ? "all" : "low-stock")}
          className={`card group relative overflow-hidden cursor-pointer p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            stockFilter === "low-stock" ? "bg-amber-50/30 dark:bg-amber-950/20 shadow-sm" : ""
          }`}
        >
          <div
            className={`absolute inset-x-0 top-0 h-[4px] transition-all duration-200 rounded-t-2xl ${
              stockFilter === "low-stock"
                ? "bg-amber-500"
                : "bg-transparent group-hover:bg-amber-500"
            }`}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Low Stock Alert</p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 transition-all duration-200 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/25">
              <AlertTriangle size={17} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:translate-x-0.5">
            {lowStockCount}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">Items at or below reorder level</p>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setStockFilter(stockFilter === "out-of-stock" ? "all" : "out-of-stock")}
          className={`card group relative overflow-hidden cursor-pointer p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            stockFilter === "out-of-stock" ? "bg-red-50/30 dark:bg-rose-950/20 shadow-sm" : ""
          }`}
        >
          <div
            className={`absolute inset-x-0 top-0 h-[4px] transition-all duration-200 rounded-t-2xl ${
              stockFilter === "out-of-stock"
                ? "bg-red-500"
                : "bg-transparent group-hover:bg-red-500"
            }`}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-rose-400">Out of Stock</p>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 dark:bg-rose-500/15 text-red-600 dark:text-rose-400 transition-all duration-200 group-hover:bg-red-100 dark:group-hover:bg-rose-500/25">
              <X size={17} />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-red-600 dark:text-rose-400 transition-transform duration-200 group-hover:translate-x-0.5">
            {outOfStockCount}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">Requires immediate restock</p>
        </div>
      </section>

      {/* 3. Toolbar: Search, Filters, Sorting & View Toggle */}
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-md">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name, SKU..."
            className="input pl-10 pr-9 text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-slate-400"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category | "All")}
            className="input !w-auto text-xs font-medium"
            aria-label="Category filter"
          >
            <option value="All">All Categories</option>
            {categoriesList.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="input !w-auto text-xs font-medium"
            aria-label="Stock status filter"
          >
            <option value="all">All Stock Status</option>
            <option value="in-stock">In Stock Only</option>
            <option value="low-stock">Low Stock (≤ Reorder)</option>
            <option value="out-of-stock">Out of Stock (0)</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input !w-auto text-xs font-medium"
              aria-label="Sort by"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="price-asc">Sort: Price (Low → High)</option>
              <option value="price-desc">Sort: Price (High → Low)</option>
              <option value="stock-asc">Sort: Stock (Low → High)</option>
              <option value="margin-desc">Sort: Profit Margin %</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-100 dark:bg-[#111827] p-0.5">
            <button
              type="button"
              aria-label="Table View"
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-[#162035] text-stone-900 dark:text-white shadow-xs border border-transparent dark:border-[#1F293D]"
                  : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              aria-label="Grid View"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#162035] text-stone-900 dark:text-white shadow-xs border border-transparent dark:border-[#1F293D]"
                  : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Products Presentation (Table / Grid) */}
      {viewMode === "table" ? (
        <div className="card overflow-hidden">
          {/* Mobile View: Responsive Product Cards (Zero Horizontal Scroll) */}
          <div className="block sm:hidden divide-y divide-stone-100 dark:divide-[#1F293D]">
            {filteredProducts.map((p) => {
              const isOut = p.stock === 0;
              const isLow = p.stock > 0 && p.stock <= p.reorderLevel;

              return (
                <div key={p.id} className="p-4 space-y-3 bg-white dark:bg-[#111827]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl shadow-xs">
                        {p.emoji}
                      </span>
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-white text-sm leading-tight">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-stone-500 dark:text-slate-400 bg-stone-100 dark:bg-[#162035] px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                          <Badge tone={categoryColors[p.category] || "brand"}>
                            {p.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isOut
                          ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                          : isLow
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                      />
                      {isOut ? "Out of stock" : `${p.stock} units`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-stone-50 dark:bg-[#162035] p-2.5 text-xs border border-stone-100 dark:border-[#1F293D]">
                    <span className="text-stone-500 dark:text-slate-400">
                      Cost: <strong className="text-stone-700 dark:text-slate-300 tabular-nums">{formatCurrency(p.cost)}</strong>
                    </span>
                    <span className="text-stone-500 dark:text-slate-400">
                      Price: <strong className="text-brand-700 font-bold text-sm tabular-nums">{formatCurrency(p.price)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100 dark:border-[#1F293D]">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035] px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:bg-[#162035] transition"
                    >
                      <Edit2 size={13} className="text-stone-500 dark:text-slate-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmProduct(p)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035]/90 dark:bg-[#162035]/90 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">SKU</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-right">Cost Price</th>
                  <th className="px-5 py-3.5 text-right">Selling Price</th>
                  <th className="px-5 py-3.5 text-center">Stock Level</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-[#1F293D]">
                {filteredProducts.map((p) => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= p.reorderLevel;

                  return (
                    <tr
                      key={p.id}
                      className="group transition-colors duration-150 hover:bg-stone-50 dark:hover:bg-[#162035]/60"
                    >
                      {/* Product Name & Emoji */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl shadow-sm transition-transform duration-200 group-hover:scale-105">
                            {p.emoji}
                          </span>
                          <div>
                            <p className="font-semibold text-stone-900 dark:text-white leading-snug">{p.name}</p>
                            <p className="text-xs text-stone-400">Reorder at {p.reorderLevel} units</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-stone-600 dark:text-slate-400 bg-stone-100 dark:bg-[#162035] px-2 py-0.5 rounded-md">
                          {p.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <Badge tone={categoryColors[p.category] || "brand"}>
                          {p.category}
                        </Badge>
                      </td>

                      {/* Cost */}
                      <td className="px-5 py-3.5 text-right font-medium text-stone-500 dark:text-slate-400 tabular-nums">
                        {formatCurrency(p.cost)}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 text-right font-bold text-stone-900 dark:text-white tabular-nums">
                        {formatCurrency(p.price)}
                      </td>

                      {/* Stock Level */}
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isOut
                              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                              : isLow
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          {isOut ? "Out of stock" : `${p.stock} units`}
                        </span>
                      </td>

                      {/* Action buttons (Dropdown Menu) */}
                      <td className="px-5 py-3.5 text-right relative">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            aria-label={`Actions for ${p.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === p.id ? null : p.id);
                            }}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                              openMenuId === p.id
                                ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                                : "border-transparent text-stone-400 hover:border-stone-200 dark:border-[#1F293D] hover:bg-stone-100 dark:bg-[#162035] hover:text-stone-700 dark:text-slate-300"
                            }`}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openMenuId === p.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-stone-200 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 text-left"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenEdit(p);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-stone-700 dark:text-slate-300 transition hover:bg-stone-50 dark:bg-[#162035] hover:text-brand-700"
                              >
                                <Edit2 size={14} className="text-stone-400" />
                                <span>Edit Product</span>
                              </button>

                              <div className="my-1 border-t border-stone-100 dark:border-[#1F293D]" />

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeleteConfirmProduct(p);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 size={14} className="text-red-500" />
                                <span>Delete Product</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-[#162035] text-stone-400">
                        <Package size={26} />
                      </div>
                      <p className="mt-3 text-base font-semibold text-stone-800 dark:text-slate-200">No products found</p>
                      <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                        Try adjusting your search query or filter options.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setSelectedCategory("All");
                          setStockFilter("all");
                        }}
                        className="btn-ghost mt-4"
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035]/50 dark:bg-[#162035]/50 px-5 py-3.5 text-xs text-stone-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-stone-800 dark:text-slate-200">{filteredProducts.length}</strong> of{" "}
              <strong className="text-stone-800 dark:text-slate-200">{products.length}</strong> items
            </span>
            <span>Currency: BDT (৳)</span>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => {
            const marginPct = (((p.price - p.cost) / p.price) * 100).toFixed(0);
            const isOut = p.stock === 0;
            const isLow = p.stock > 0 && p.stock <= p.reorderLevel;

            return (
              <div
                key={p.id}
                className="card group flex flex-col justify-between p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-3xl transition-transform duration-200 group-hover:scale-105">
                      {p.emoji}
                    </span>
                    <Badge tone={categoryColors[p.category] || "brand"}>
                      {p.category}
                    </Badge>
                  </div>

                  <h3 className="mt-3.5 font-bold text-stone-900 dark:text-white leading-snug line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="font-mono text-xs text-stone-500 dark:text-slate-400">{p.sku}</p>

                  <div className="mt-4 flex items-baseline justify-between border-t border-stone-100 dark:border-[#1F293D] pt-3">
                    <div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">Selling Price</p>
                      <p className="text-lg font-bold text-stone-900 dark:text-white">{formatCurrency(p.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">Cost Price</p>
                      <p className="text-sm font-semibold text-stone-600 dark:text-slate-400">{formatCurrency(p.cost)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 border-t border-stone-100 dark:border-[#1F293D] pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-slate-400">Stock Status</span>
                    <span
                      className={`font-semibold ${
                        isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {isOut ? "Out of Stock" : `${p.stock} units`}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="btn-ghost !px-3 !py-1.5 text-xs"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmProduct(p)}
                      className="rounded-xl border border-stone-200 dark:border-[#1F293D] p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#1F293D] pb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  {editingProduct ? "Update catalog details" : "Create a new item in your store inventory"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:bg-[#162035] hover:text-stone-700 dark:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Miniket Rice 5kg"
                  className="input"
                />
              </div>

              {/* SKU & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. GRC-005"
                    className="input font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                    className="input"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing: Cost vs Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">Cost Price (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.cost || ""}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) || 0 })}
                    placeholder="330"
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">Selling Price (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                    placeholder="380"
                    className="input font-semibold"
                  />
                </div>
              </div>

              {/* Stock & Reorder Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock || ""}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) || 0 })}
                    placeholder="50"
                    className="input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-700 dark:text-slate-300">Reorder Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderLevel || ""}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) || 0 })}
                    placeholder="15"
                    className="input"
                  />
                </div>
              </div>

              {/* Emoji Icon Picker */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Select Icon / Emoji
                </label>
                <div className="flex flex-wrap gap-2 rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035] p-2.5">
                  {emojiOptions.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setFormData({ ...formData, emoji: em })}
                      className={`grid h-9 w-9 place-items-center rounded-lg text-lg transition ${
                        formData.emoji === em
                          ? "bg-brand-500 text-white shadow-sm scale-110"
                          : "hover:bg-white text-stone-700 dark:text-slate-300"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-[#1F293D] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <CheckCircle2 size={16} />
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-[#1F293D] bg-white dark:bg-[#111827] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 ring-8 ring-red-50">
                <Trash2 size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">Delete Product</h3>
                <p className="mt-1 text-sm text-stone-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="font-semibold text-stone-900 dark:text-white">
                    &ldquo;{deleteConfirmProduct.name}&rdquo;
                  </strong>
                  ? This product will be permanently removed from your catalog and inventory.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-stone-200 dark:border-[#1F293D] bg-stone-50 dark:bg-[#162035] p-2.5 text-xs text-stone-600 dark:text-slate-400 font-medium">
                  <span className="font-mono font-bold text-stone-800 dark:text-slate-200">{deleteConfirmProduct.sku}</span>
                  <span>•</span>
                  <span>{deleteConfirmProduct.category}</span>
                  <span>•</span>
                  <span>{deleteConfirmProduct.stock} in stock</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-[#1F293D] pt-4">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmProduct(null)}
                className="rounded-xl border border-stone-200 dark:border-[#1F293D] px-4 py-2.5 text-xs font-semibold text-stone-600 dark:text-slate-400 transition hover:bg-stone-50 dark:bg-[#162035] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
