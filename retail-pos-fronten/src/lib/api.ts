import type {
  Category,
  CategoryItem,
  Customer,
  Order,
  OrdersResponse,
  PaymentMethod,
  Product,
  Sale,
  SaleStatus,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3001/api";

function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    return `${year}-${month}-${day} ${hours}:${mins}`;
  } catch {
    return String(dateInput);
  }
}

function normalizeProduct(p: any): Product {
  const categoryName =
    typeof p.category === "object" && p.category?.name
      ? p.category.name
      : typeof p.category === "string"
      ? p.category
      : "General";

  const categoryId =
    typeof p.category === "object" && p.category?.id
      ? p.category.id
      : p.categoryId;

  return {
    id: p.id,
    sku: p.sku || "",
    name: p.name || "",
    category: categoryName as Category,
    categoryId: categoryId ? Number(categoryId) : undefined,
    price: Number(p.price || 0),
    cost: Number(p.cost || 0),
    stock: Number(p.stock || 0),
    reorderLevel: Number(p.reorderLevel ?? 10),
    emoji: p.emoji || "📦",
  };
}

function normalizeSale(s: any): Sale {
  const itemsArray = Array.isArray(s.items) ? s.items : [];
  const itemsCount = itemsArray.reduce(
    (sum: number, item: any) => sum + (Number(item.qty) || 1),
    0
  );
  const itemsDetail = itemsArray.map((item: any) => ({
    productName: item.product?.name || "Item",
    qty: Number(item.qty || 1),
    total: Number((item.unitPrice || 0) * (item.qty || 1)),
  }));

  return {
    id: s.invoiceNo || (s.id ? `INV-${s.id}` : "INV-0000"),
    date: formatDate(s.createdAt || s.date),
    customer: s.customer?.name || (typeof s.customer === "string" ? s.customer : "Walk-in"),
    customerId: s.customer?.id ?? s.customerId ?? null,
    items: itemsCount,
    itemsDetail,
    total: Number(s.total || 0),
    payment: (s.payment as PaymentMethod) || "Cash",
    status: (s.status as SaleStatus) || "Completed",
  };
}

function normalizeCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name || "",
    phone: c.phone || "",
    email: c.email || null,
    totalOrders: Number(c.totalOrders ?? 0),
    totalSpent: Number(c.totalSpent ?? 0),
    loyaltyPoints: Number(c.loyaltyPoints ?? 0),
    lastVisit: c.lastVisit ? formatDate(c.lastVisit).split(" ")[0] : "N/A",
  };
}

// ---------------- PRODUCTS ----------------

export async function fetchProducts(params?: {
  q?: string;
  category?: string;
}): Promise<Product[]> {
  try {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.category && params.category !== "All") query.set("category", params.category);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE}/products${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  } catch (err) {
    console.warn("Error fetching products from API:", err);
    return [];
  }
}

export async function createProduct(dto: {
  sku: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel?: number;
  emoji?: string;
  categoryId: number;
}): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create product (${res.status})`);
  }
  const created = await res.json();
  return normalizeProduct(created);
}

export async function updateProduct(
  id: number | string,
  dto: Partial<{
    sku: string;
    name: string;
    price: number;
    cost: number;
    stock: number;
    reorderLevel?: number;
    emoji?: string;
    categoryId?: number;
  }>
): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update product (${res.status})`);
  }
  const updated = await res.json();
  return normalizeProduct(updated);
}

export async function deleteProduct(id: number | string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete product (${res.status})`);
  }
  return res.json();
}

// ---------------- CATEGORIES ----------------

export async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn("Error fetching categories from API:", err);
  }
  return [];
}

// ---------------- CUSTOMERS ----------------

export async function fetchCustomers(q?: string): Promise<Customer[]> {
  try {
    const qs = q ? `?q=${encodeURIComponent(q)}` : "";
    const res = await fetch(`${API_BASE}/customers${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch customers: ${res.statusText}`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeCustomer) : [];
  } catch (err) {
    console.warn("Error fetching customers from API:", err);
    return [];
  }
}

export async function createCustomer(dto: {
  name: string;
  phone: string;
  email?: string;
}): Promise<Customer> {
  const res = await fetch(`${API_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create customer (${res.status})`);
  }
  const created = await res.json();
  return normalizeCustomer(created);
}

// ---------------- SALES ----------------

export async function fetchSales(): Promise<Sale[]> {
  try {
    const res = await fetch(`${API_BASE}/sales`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch sales: ${res.statusText}`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeSale) : [];
  } catch (err) {
    console.warn("Error fetching sales from API:", err);
    return [];
  }
}

export async function createSale(dto: {
  customerId?: number;
  payment: PaymentMethod | string;
  discountPercent?: number;
  items: { productId: number; qty: number }[];
}): Promise<Sale> {
  const res = await fetch(`${API_BASE}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create sale (${res.status})`);
  }
  const created = await res.json();
  return normalizeSale(created);
}

// ---------------- ORDERS ----------------

export async function fetchOrders(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  source?: string;
  sortOrder?: "ASC" | "DESC";
}): Promise<OrdersResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.q) query.set("q", params.q);
    if (params?.status && params.status !== "All") query.set("status", params.status);
    if (params?.source && params.source !== "All") query.set("source", params.source);
    if (params?.sortOrder) query.set("sortOrder", params.sortOrder);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE}/orders${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
    const result = await res.json();
    return {
      data: Array.isArray(result.data) ? result.data : [],
      total: Number(result.total || 0),
      page: Number(result.page || 1),
      limit: Number(result.limit || 10),
      totalPages: Number(result.totalPages || 1),
    };
  } catch (err) {
    console.warn("Error fetching orders from API:", err);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
  }
}

export async function fetchOrderById(id: number | string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}`, { cache: "no-store" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch order #${id}`);
  }
  return res.json();
}

export async function updateOrderStatus(id: number | string, status: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update order status`);
  }
  return res.json();
}

export async function deleteOrder(id: number | string): Promise<{ deleted: boolean; id: number }> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete order`);
  }
  return res.json();
}

export async function createOrder(dto: any): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create order`);
  }
  return res.json();
}
