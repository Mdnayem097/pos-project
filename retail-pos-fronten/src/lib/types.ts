export type Category =
  | "Grocery"
  | "Beverages"
  | "Snacks"
  | "Dairy"
  | "Personal Care"
  | "Household";

export interface CategoryItem {
  id: number;
  name: string;
}

export interface Product {
  id: string | number;
  sku: string;
  name: string;
  category: Category | string;
  categoryId?: number;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  emoji: string;
}

export interface Customer {
  id: string | number;
  name: string;
  phone: string;
  email: string | null;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastVisit: string;
}

export type PaymentMethod = "Cash" | "Card" | "bKash" | "Nagad" | "COD";
export type SaleStatus =
  | "Delivered"
  | "Completed"
  | "New"
  | "Pending"
  | "Refunded"
  | "Cancelled";

export interface SaleItemDetail {
  productName: string;
  qty: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  customer: string;
  customerId?: number | null;
  items: number;
  itemsDetail?: SaleItemDetail[];
  total: number;
  payment: PaymentMethod;
  status: SaleStatus;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface OrderItem {
  id: number;
  productId?: number;
  name: string;
  sku: string;
  emoji: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: number;
  orderId: string;
  invoiceNo: string;
  name: string;
  email: string;
  phone?: string | null;
  source: "POS" | "Website" | string;
  method: "Cash" | "Card" | "bKash" | "COD" | string;
  total: number;
  subtotal: number;
  vat: number;
  discount: number;
  status: "Delivered" | "New" | "Pending" | "Cancelled" | "Refunded" | string;
  createdAt: string;
  itemsCount: number;
  items: OrderItem[];
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
