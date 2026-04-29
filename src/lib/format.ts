import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function formatVND(amount: number): string {
  return vndFormatter.format(amount);
}

export function formatNumber(amount: number): string {
  return numberFormatter.format(amount);
}

export function formatDate(iso: string, pattern = "dd/MM/yyyy"): string {
  try {
    return format(parseISO(iso), pattern, { locale: vi });
  } catch {
    return iso;
  }
}

export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

