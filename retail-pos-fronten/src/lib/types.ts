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

export interface CounterSession {
  id: number;
  counterId: number;
  counter?: Counter;
  cashierName: string;
  openingCash: number;
  openedAt: string;
  closingCash: number | null;
  closedAt: string | null;
  expectedCash: number | null;
  difference: number | null;
  totalSales: number;
  totalOrders: number;
  note: string | null;
  status: 'Open' | 'Closed';
}

export interface Counter {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isOpen: boolean;
  currentSession: CounterSession | null;
  totalSessions: number;
}

export interface CurrentCounterStatus {
  session: CounterSession | null;
  isOpen: boolean;
  currentCashSales?: number;
  currentTotalSales?: number;
  totalOrders?: number;
  expectedCash?: number;
}

export interface CloseShiftResult {
  session: CounterSession;
  counter: Counter;
  openingCash: number;
  closingCash: number;
  cashSales: number;
  totalSales: number;
  totalOrders: number;
  expectedCash: number;
  difference: number;
  isBalanced: boolean;
  isOver: boolean;
  isShort: boolean;
}

