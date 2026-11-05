import type { Category, Customer, Product, Sale } from "./types";

export const categories: Category[] = [];
export const products: Product[] = [];
export const customers: Customer[] = [];
export const sales: Sale[] = [];
export const weeklySales: { day: string; amount: number }[] = [];
export const topProducts: { name: string; sold: number; revenue: number }[] = [];
