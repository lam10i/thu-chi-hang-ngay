import type { Category } from "@/types/transaction";

export const CATEGORY_ICONS = [
  "UtensilsCrossed",
  "Coffee",
  "Pizza",
  "ShoppingBag",
  "ShoppingCart",
  "Car",
  "Bus",
  "Plane",
  "Fuel",
  "Home",
  "Receipt",
  "Lightbulb",
  "Wifi",
  "Smartphone",
  "Gamepad2",
  "Music",
  "Film",
  "Book",
  "GraduationCap",
  "HeartPulse",
  "Pill",
  "Dumbbell",
  "Shirt",
  "Sparkles",
  "Gift",
  "PawPrint",
  "Baby",
  "PiggyBank",
  "CreditCard",
  "Tag",
] as const;

export const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
] as const;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "an-uong", name: "Ăn uống", icon: "UtensilsCrossed", color: "#f97316" },
  { id: "ca-phe", name: "Cà phê", icon: "Coffee", color: "#a16207" },
  { id: "di-lai", name: "Đi lại", icon: "Car", color: "#3b82f6" },
  { id: "mua-sam", name: "Mua sắm", icon: "ShoppingBag", color: "#ec4899" },
  { id: "hoa-don", name: "Hóa đơn", icon: "Receipt", color: "#6366f1" },
  { id: "giai-tri", name: "Giải trí", icon: "Gamepad2", color: "#8b5cf6" },
  { id: "suc-khoe", name: "Sức khỏe", icon: "HeartPulse", color: "#ef4444" },
  { id: "khac", name: "Khác", icon: "Tag", color: "#64748b" },
];

// Strip Vietnamese diacritics (combining marks U+0300..U+036F) then đ → d
const DIACRITIC_RE = /[̀-ͯ]/g;

export function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(DIACRITIC_RE, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

export function slugify(name: string): string {
  const slug = stripDiacritics(name.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || `cat-${Date.now()}`;
}
