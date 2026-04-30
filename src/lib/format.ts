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

/**
 * Parse số tiền nhập tự do của người dùng VN.
 * - Có suffix k/tr/m: "50k" → 50.000, "1.5tr" → 1.500.000, "1,5m" → 1.500.000
 * - Không suffix: chỉ giữ chữ số ("1.500" / "1,500" / "1500" → 1500)
 * - Trả về 0 nếu rỗng / không parse được.
 */
export function parseAmount(input: string): number {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return 0;

  const suffixMatch = trimmed.match(/^([\d.,]+)\s*(k|tr|m)$/);
  if (suffixMatch) {
    const numStr = suffixMatch[1].replace(",", ".");
    const num = Number(numStr);
    if (!isFinite(num)) return 0;
    const multiplier = suffixMatch[2] === "k" ? 1_000 : 1_000_000;
    return Math.max(0, Math.round(num * multiplier));
  }

  const digits = trimmed.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

