import type {
  AdminUser,
  AuthMeResponse,
  AuthUser,
  Category,
  CategoryItem,
  CloseShiftResult,
  Counter,
  CounterSession,
  CreateReturnPayload,
  CreateRolePayload,
  CreateUserPayload,
  CurrentCounterStatus,
  Customer,
  LoginResponse,
  ModuleDefinition,
  Order,
  OrderReturnableInfo,
  OrdersResponse,
  PaymentMethod,
  Product,
  RefreshResponse,
  Role,
  ReturnOrder,
  Sale,
  SaleStatus,
  UpdateRolePayload,
  UpdateUserPayload,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3001/api";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pos_access_token");
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pos_refresh_token");
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("pos_access_token", accessToken);
  localStorage.setItem("pos_refresh_token", refreshToken);
}

export function clearStoredTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pos_access_token");
  localStorage.removeItem("pos_refresh_token");
  localStorage.removeItem("pos_user");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function authFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
  });
}

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
    const res = await authFetch(`${API_BASE}/products${qs}`, { cache: "no-store" });
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
  const res = await authFetch(`${API_BASE}/products`, {
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
  const res = await authFetch(`${API_BASE}/products/${id}`, {
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
  const res = await authFetch(`${API_BASE}/products/${id}`, {
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
    const res = await authFetch(`${API_BASE}/categories`, { cache: "no-store" });
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
    const res = await authFetch(`${API_BASE}/customers${qs}`, { cache: "no-store" });
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
  const res = await authFetch(`${API_BASE}/customers`, {
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
    const res = await authFetch(`${API_BASE}/sales`, { cache: "no-store" });
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
  const res = await authFetch(`${API_BASE}/sales`, {
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
    const res = await authFetch(`${API_BASE}/orders${qs}`, { cache: "no-store" });
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
  const res = await authFetch(`${API_BASE}/orders/${id}`, { cache: "no-store" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch order #${id}`);
  }
  return res.json();
}

export async function updateOrderStatus(id: number | string, status: string): Promise<Order> {
  const res = await authFetch(`${API_BASE}/orders/${id}/status`, {
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
  const res = await authFetch(`${API_BASE}/orders/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete order`);
  }
  return res.json();
}

export async function createOrder(dto: any): Promise<Order> {
  const res = await authFetch(`${API_BASE}/orders`, {
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

// ---------------- COUNTERS ----------------

export async function fetchCounters(): Promise<Counter[]> {
  try {
    const res = await authFetch(`${API_BASE}/counters`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch counters`);
    return res.json();
  } catch (err) {
    console.warn("Error fetching counters:", err);
    return [];
  }
}

export async function createCounter(dto: { name: string }): Promise<Counter> {
  const res = await authFetch(`${API_BASE}/counters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create counter`);
  }
  return res.json();
}

export async function updateCounter(
  id: number | string,
  dto: { name?: string; isActive?: boolean }
): Promise<Counter> {
  const res = await authFetch(`${API_BASE}/counters/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update counter`);
  }
  return res.json();
}

export async function deleteCounter(
  id: number | string
): Promise<{ id: number; deactivated?: boolean; deleted?: boolean; message: string }> {
  const res = await authFetch(`${API_BASE}/counters/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete counter`);
  }
  return res.json();
}

export async function fetchCurrentSession(): Promise<CurrentCounterStatus> {
  try {
    const res = await authFetch(`${API_BASE}/counters/current`, { cache: "no-store" });
    if (!res.ok) return { session: null, isOpen: false };
    return res.json();
  } catch {
    return { session: null, isOpen: false };
  }
}

export async function openCounterSession(
  id: number | string,
  dto: { openingCash: number; cashierName?: string }
): Promise<CounterSession> {
  const res = await authFetch(`${API_BASE}/counters/${id}/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to open counter register`);
  }
  return res.json();
}

export async function closeCounterSession(
  id: number | string,
  dto: { closingCash: number; note?: string }
): Promise<CloseShiftResult> {
  const res = await authFetch(`${API_BASE}/counters/${id}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to close counter register`);
  }
  return res.json();
}

export async function fetchCounterSessions(id: number | string): Promise<CounterSession[]> {
  try {
    const res = await authFetch(`${API_BASE}/counters/${id}/sessions`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ---------------- RETURNS ----------------

export async function fetchReturns(params?: {
  from?: string;
  to?: string;
  orderId?: number | string;
  q?: string;
}): Promise<ReturnOrder[]> {
  try {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.orderId) query.set("orderId", String(params.orderId));
    if (params?.q) query.set("q", params.q);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await authFetch(`${API_BASE}/returns${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch returns");
    return res.json();
  } catch (err) {
    console.warn("Error fetching returns:", err);
    return [];
  }
}

export async function fetchReturnById(id: number | string): Promise<ReturnOrder> {
  const res = await authFetch(`${API_BASE}/returns/${id}`, { cache: "no-store" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch return #${id}`);
  }
  return res.json();
}

export async function fetchReturnableItems(orderId: number | string): Promise<OrderReturnableInfo> {
  const res = await authFetch(`${API_BASE}/orders/${orderId}/returnable-items`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch returnable items for order #${orderId}`);
  }
  return res.json();
}

export async function createReturn(dto: CreateReturnPayload): Promise<ReturnOrder> {
  const res = await authFetch(`${API_BASE}/returns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to process return`);
  }
  return res.json();
}

// ---------------- AUTH API ----------------

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await authFetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to log in. Please check your credentials.");
  }

  const data: LoginResponse = await res.json();
  setStoredTokens(data.accessToken, data.refreshToken);
  if (typeof window !== "undefined") {
    localStorage.setItem("pos_user", JSON.stringify(data.user));
  }
  return data;
}

export async function apiLogout(): Promise<{ success: boolean; message: string }> {
  const refreshToken = getStoredRefreshToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  try {
    await authFetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    console.warn("Logout request failed:", err);
  } finally {
    clearStoredTokens();
  }

  return { success: true, message: "Logged out" };
}

export async function apiGetMe(): Promise<AuthMeResponse> {
  const token = getStoredAccessToken();
  if (!token) {
    throw new Error("No active session");
  }

  const res = await authFetch(`${API_BASE}/auth/me`, {
    headers: {
      ...getAuthHeaders(),
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    // Attempt refresh if refresh token is present
    try {
      const refreshed = await apiRefreshToken();
      if (refreshed.accessToken) {
        const retryRes = await authFetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${refreshed.accessToken}`,
          },
          cache: "no-store",
        });
        if (retryRes.ok) {
          return retryRes.json();
        }
      }
    } catch {
      clearStoredTokens();
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch user profile");
  }

  return res.json();
}

export async function apiRefreshToken(): Promise<RefreshResponse> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await authFetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearStoredTokens();
    throw new Error("Failed to refresh session");
  }

  const data: RefreshResponse = await res.json();
  setStoredTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const res = await authFetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to change password");
  }

  return res.json();
}

// ---------------- ROLES & PERMISSIONS API ----------------

export async function fetchRoles(): Promise<Role[]> {
  const res = await authFetch(`${API_BASE}/roles`, {
    headers: { ...getAuthHeaders() },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to load roles");
  }
  return res.json();
}

export async function fetchRoleModules(): Promise<ModuleDefinition[]> {
  const res = await authFetch(`${API_BASE}/roles/modules`, {
    headers: { ...getAuthHeaders() },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to load system modules");
  }
  return res.json();
}

export async function createRole(dto: CreateRolePayload): Promise<Role> {
  const res = await authFetch(`${API_BASE}/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create role");
  }
  return res.json();
}

export async function updateRole(
  id: number | string,
  dto: UpdateRolePayload
): Promise<Role> {
  const res = await authFetch(`${API_BASE}/roles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update role");
  }
  return res.json();
}

export async function deleteRole(
  id: number | string
): Promise<{ success: boolean; message: string }> {
  const res = await authFetch(`${API_BASE}/roles/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete role");
  }
  return res.json();
}

// ---------------- USERS MANAGEMENT API ----------------

export async function fetchUsers(): Promise<AdminUser[]> {
  const res = await authFetch(`${API_BASE}/users`, {
    headers: { ...getAuthHeaders() },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to load users");
  }
  return res.json();
}

export async function createUser(dto: CreateUserPayload): Promise<AdminUser> {
  const res = await authFetch(`${API_BASE}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create user");
  }
  return res.json();
}

export async function updateUser(
  id: number | string,
  dto: UpdateUserPayload
): Promise<AdminUser> {
  const res = await authFetch(`${API_BASE}/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update user");
  }
  return res.json();
}

export async function deleteUser(
  id: number | string
): Promise<{ success: boolean; message: string }> {
  const res = await authFetch(`${API_BASE}/users/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete user");
  }
  return res.json();
}




