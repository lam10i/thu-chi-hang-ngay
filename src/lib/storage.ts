import type { Transaction, Category } from "@/types/transaction";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

const TX_KEY = "thuchi.transactions.v2";
const CAT_KEY = "thuchi.categories.v1";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled */
  }
}

export function loadTransactions(): Transaction[] {
  const data = readJSON<Transaction[]>(TX_KEY, []);
  return Array.isArray(data) ? data : [];
}

export function saveTransactions(transactions: Transaction[]): void {
  writeJSON(TX_KEY, transactions);
}

export function loadCategories(): Category[] {
  const data = readJSON<Category[] | null>(CAT_KEY, null);
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [...DEFAULT_CATEGORIES];
  }
  return data;
}

export function saveCategories(categories: Category[]): void {
  writeJSON(CAT_KEY, categories);
}
