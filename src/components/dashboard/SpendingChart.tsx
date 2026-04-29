"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/useTransactions";
import { formatVND, formatNumber } from "@/lib/format";

type Range = "day" | "week" | "month";

interface Bucket {
  key: string;
  label: string;
  total: number;
}

function buildBuckets(range: Range): Bucket[] {
  const now = new Date();
  if (range === "day") {
    // 14 ngày gần nhất
    return Array.from({ length: 14 }).map((_, i) => {
      const d = addDays(now, -(13 - i));
      return {
        key: format(d, "yyyy-MM-dd"),
        label: format(d, "dd/MM"),
        total: 0,
      };
    });
  }
  if (range === "week") {
    // 8 tuần gần nhất
    return Array.from({ length: 8 }).map((_, i) => {
      const ws = startOfWeek(addWeeks(now, -(7 - i)), { weekStartsOn: 1 });
      return {
        key: format(ws, "yyyy-MM-dd"),
        label: `T${format(ws, "dd/MM")}`,
        total: 0,
      };
    });
  }
  // month: 6 tháng gần nhất
  return Array.from({ length: 6 }).map((_, i) => {
    const ms = startOfMonth(addMonths(now, -(5 - i)));
    return {
      key: format(ms, "yyyy-MM"),
      label: format(ms, "MM/yyyy"),
      total: 0,
    };
  });
}

function bucketKeyFor(date: string, range: Range): string {
  const d = parseISO(date);
  if (range === "day") return format(d, "yyyy-MM-dd");
  if (range === "week") return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
  return format(d, "yyyy-MM");
}

function rangeBounds(range: Range): { start: Date; end: Date } {
  const now = new Date();
  if (range === "day") return { start: addDays(now, -13), end: now };
  if (range === "week") {
    return {
      start: startOfWeek(addWeeks(now, -7), { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }
  return { start: startOfMonth(addMonths(now, -5)), end: endOfMonth(now) };
}

export function SpendingChart() {
  const { transactions } = useTransactions();
  const [range, setRange] = useState<Range>("day");

  const data = useMemo(() => {
    const buckets = buildBuckets(range);
    const map = new Map(buckets.map((b) => [b.key, b]));
    const { start, end } = rangeBounds(range);

    for (const t of transactions) {
      try {
        const d = parseISO(t.date);
        if (d < start || d > end) continue;
        const key = bucketKeyFor(t.date, range);
        const bucket = map.get(key);
        if (bucket) bucket.total += t.amount;
      } catch {
        /* skip */
      }
    }
    return buckets;
  }, [transactions, range]);

  const total = data.reduce((s, b) => s + b.total, 0);
  const rangeLabel =
    range === "day" ? "14 ngày qua" : range === "week" ? "8 tuần qua" : "6 tháng qua";

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
        <div>
          <CardTitle>Biểu đồ chi tiêu</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rangeLabel} · Tổng {formatVND(total)}
          </p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="day">Ngày</TabsTrigger>
            <TabsTrigger value="week">Tuần</TabsTrigger>
            <TabsTrigger value="month">Tháng</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
                  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
                  return formatNumber(v);
                }}
                width={48}
              />
              <Tooltip
                cursor={{ fill: "rgba(127,127,127,0.08)" }}
                formatter={(value) => [formatVND(Number(value) || 0), "Chi tiêu"]}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload as Bucket | undefined;
                  if (!item) return label;
                  if (range === "day") {
                    return format(parseISO(item.key), "EEEE, dd/MM/yyyy", { locale: vi });
                  }
                  if (range === "week") {
                    const ws = parseISO(item.key);
                    const we = endOfWeek(ws, { weekStartsOn: 1 });
                    return `Tuần ${format(ws, "dd/MM")} – ${format(we, "dd/MM/yyyy")}`;
                  }
                  return format(parseISO(`${item.key}-01`), "MMMM yyyy", { locale: vi });
                }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid rgba(127,127,127,0.2)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                }}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
