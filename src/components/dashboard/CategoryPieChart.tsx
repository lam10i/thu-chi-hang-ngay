"use client";

import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { addDays, format, parseISO, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/category-icon";
import { formatVND } from "@/lib/format";

type Range = "week" | "month" | "all";

interface Slice {
  id: string;
  name: string;
  icon: string;
  color: string;
  value: number;
}

const FALLBACK_COLOR = "#64748b";

function inRange(dateISO: string, range: Range): boolean {
  if (range === "all") return true;
  try {
    const d = parseISO(dateISO);
    if (range === "week") return d >= addDays(new Date(), -6);
    return d >= startOfMonth(new Date());
  } catch {
    return false;
  }
}

export function CategoryPieChart() {
  const { transactions } = useTransactions();
  const { categories, getById } = useCategories();
  const [range, setRange] = useState<Range>("month");

  const slices = useMemo<Slice[]>(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      if (!inRange(t.date, range)) continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    const result: Slice[] = [];
    for (const [catId, value] of totals) {
      const cat = getById(catId);
      result.push({
        id: catId,
        name: cat?.name ?? "Khác",
        icon: cat?.icon ?? "Tag",
        color: cat?.color ?? FALLBACK_COLOR,
        value,
      });
    }
    return result.sort((a, b) => b.value - a.value);
    // categories used so dependency array picks up renames/colors
  }, [transactions, range, getById, categories]);

  const total = slices.reduce((s, x) => s + x.value, 0);
  const rangeLabel =
    range === "week" ? "7 ngày qua" : range === "month" ? format(new Date(), "MM/yyyy") : "Tất cả";

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
        <div>
          <CardTitle>Chi tiêu theo danh mục</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rangeLabel} · Tổng {formatVND(total)}
          </p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange((v as Range) ?? "month")}>
          <TabsList>
            <TabsTrigger value="week">Tuần</TabsTrigger>
            <TabsTrigger value="month">Tháng</TabsTrigger>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {slices.length === 0 ? (
          <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
            Chưa có chi tiêu trong khoảng này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {slices.map((s) => (
                      <Cell key={s.id} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const v = Number(value) || 0;
                      const pct = total ? ((v / total) * 100).toFixed(1) : "0";
                      const label =
                        (item as { payload?: { name?: string } })?.payload?.name ?? "";
                      return [`${formatVND(v)} (${pct}%)`, label];
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid rgba(127,127,127,0.2)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs text-muted-foreground">Tổng</div>
                <div className="text-lg font-semibold">{formatVND(total)}</div>
              </div>
            </div>

            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {slices.map((s) => {
                const pct = total ? (s.value / total) * 100 : 0;
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <span
                      className="flex size-8 items-center justify-center rounded-full text-white shrink-0"
                      style={{ backgroundColor: s.color }}
                    >
                      <CategoryIcon name={s.icon} className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium truncate">{s.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: s.color }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatVND(s.value)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
