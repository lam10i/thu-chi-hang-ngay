"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/category-icon";
import { useCategories } from "@/hooks/useCategories";
import { todayISO } from "@/lib/format";
import type { ListFilters } from "./TransactionList";

interface Props {
  filters: ListFilters;
  onChange: (next: ListFilters) => void;
}

type Preset = "all" | "today" | "7d" | "30d" | "this-week" | "this-month" | "last-month" | "custom";

const PRESET_OPTIONS: { value: Preset; label: string }[] = [
  { value: "all", label: "Tất cả thời gian" },
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "this-week", label: "Tuần này" },
  { value: "this-month", label: "Tháng này" },
  { value: "last-month", label: "Tháng trước" },
  { value: "custom", label: "Tự chọn" },
];

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function presetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const today = todayISO();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: fmt(addDays(now, -6)), to: today };
    case "30d":
      return { from: fmt(addDays(now, -29)), to: today };
    case "this-week":
      return { from: fmt(startOfWeek(now, { weekStartsOn: 1 })), to: fmt(endOfWeek(now, { weekStartsOn: 1 })) };
    case "this-month":
      return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
    case "last-month": {
      const lm = subMonths(now, 1);
      return { from: fmt(startOfMonth(lm)), to: fmt(endOfMonth(lm)) };
    }
    case "all":
    case "custom":
    default:
      return { from: "", to: "" };
  }
}

export function TransactionFilters({ filters, onChange }: Props) {
  const { categories } = useCategories();
  const [preset, setPreset] = useState<Preset>("all");

  // Sync preset → range. Custom/All do not auto-update from/to.
  useEffect(() => {
    if (preset === "custom") return;
    const { from, to } = presetRange(preset);
    if (from !== filters.from || to !== filters.to) {
      onChange({ ...filters, from, to });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const hasActiveFilter =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.from !== "" ||
    filters.to !== "";

  const clearAll = () => {
    setPreset("all");
    onChange({ category: "all", search: "", from: "", to: "" });
  };

  return (
    <div className="space-y-3 rounded-md border bg-card p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Tìm theo ghi chú hoặc tên danh mục..."
          className="pl-9 pr-9"
        />
        {filters.search && (
          <button
            type="button"
            aria-label="Xoá tìm kiếm"
            onClick={() => onChange({ ...filters, search: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Danh mục</Label>
          <Select
            value={filters.category}
            onValueChange={(v) => onChange({ ...filters, category: v ?? "all" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-5 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: c.color ?? "#64748b" }}
                    >
                      <CategoryIcon name={c.icon} className="size-3" />
                    </span>
                    {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Khoảng thời gian</Label>
          <Select value={preset} onValueChange={(v) => setPreset((v as Preset) ?? "all")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="filter-from">Từ ngày</Label>
          <Input
            id="filter-from"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => {
              setPreset("custom");
              onChange({ ...filters, from: e.target.value });
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="filter-to">Đến ngày</Label>
          <Input
            id="filter-to"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => {
              setPreset("custom");
              onChange({ ...filters, to: e.target.value });
            }}
          />
        </div>
      </div>

      {hasActiveFilter && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
            <X className="size-3.5" />
            Xoá bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
}
