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
  isAfter,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/hooks/useTransactions";
import { formatVND, formatNumber } from "@/lib/format";

type Range = "day" | "week" | "month";

interface Bucket {
  key: string;
  label: string;
  total: number;
}

const WINDOW_SIZE: Record<Range, number> = { day: 14, week: 8, month: 6 };

function buildBuckets(range: Range, anchor: Date): Bucket[] {
  if (range === "day") {
    return Array.from({ length: WINDOW_SIZE.day }).map((_, i) => {
      const d = addDays(anchor, -(WINDOW_SIZE.day - 1 - i));
      return { key: format(d, "yyyy-MM-dd"), label: format(d, "dd/MM"), total: 0 };
    });
  }
  if (range === "week") {
    return Array.from({ length: WINDOW_SIZE.week }).map((_, i) => {
      const ws = startOfWeek(addWeeks(anchor, -(WINDOW_SIZE.week - 1 - i)), {
        weekStartsOn: 1,
      });
      return {
        key: format(ws, "yyyy-MM-dd"),
        label: `T${format(ws, "dd/MM")}`,
        total: 0,
      };
    });
  }
  return Array.from({ length: WINDOW_SIZE.month }).map((_, i) => {
    const ms = startOfMonth(addMonths(anchor, -(WINDOW_SIZE.month - 1 - i)));
    return { key: format(ms, "yyyy-MM"), label: format(ms, "MM/yyyy"), total: 0 };
  });
}

function bucketKeyFor(date: string, range: Range): string {
  const d = parseISO(date);
  if (range === "day") return format(d, "yyyy-MM-dd");
  if (range === "week") return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
  return format(d, "yyyy-MM");
}

function rangeBounds(range: Range, anchor: Date): { start: Date; end: Date } {
  if (range === "day") {
    return { start: addDays(anchor, -(WINDOW_SIZE.day - 1)), end: anchor };
  }
  if (range === "week") {
    return {
      start: startOfWeek(addWeeks(anchor, -(WINDOW_SIZE.week - 1)), { weekStartsOn: 1 }),
      end: endOfWeek(anchor, { weekStartsOn: 1 }),
    };
  }
  return {
    start: startOfMonth(addMonths(anchor, -(WINDOW_SIZE.month - 1))),
    end: endOfMonth(anchor),
  };
}

function shift(range: Range, anchor: Date, direction: -1 | 1): Date {
  if (range === "day") return addDays(anchor, WINDOW_SIZE.day * direction);
  if (range === "week") return addWeeks(anchor, WINDOW_SIZE.week * direction);
  return addMonths(anchor, WINDOW_SIZE.month * direction);
}

function rangeLabel(range: Range, anchor: Date): string {
  const { start, end } = rangeBounds(range, anchor);
  if (range === "day") {
    return `${format(start, "dd/MM/yyyy")} – ${format(end, "dd/MM/yyyy")}`;
  }
  if (range === "week") {
    return `Tuần ${format(start, "dd/MM/yyyy")} – ${format(end, "dd/MM/yyyy")}`;
  }
  return `${format(start, "MM/yyyy")} – ${format(end, "MM/yyyy")}`;
}

export function SpendingChart() {
  const { transactions } = useTransactions();
  const [range, setRange] = useState<Range>("day");
  const [anchor, setAnchor] = useState<Date>(new Date());

  const data = useMemo(() => {
    const buckets = buildBuckets(range, anchor);
    const map = new Map(buckets.map((b) => [b.key, b]));
    const { start, end } = rangeBounds(range, anchor);

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
  }, [transactions, range, anchor]);

  const total = data.reduce((s, b) => s + b.total, 0);
  const isPresent = isSameDay(anchor, new Date());
  const canGoForward = !isPresent && !isAfter(anchor, new Date());
  const anchorISO = format(anchor, "yyyy-MM-dd");
  const todayISO = format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Biểu đồ chi tiêu</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rangeLabel(range, anchor)} · Tổng {formatVND(total)}
            </p>
          </div>
          <Tabs value={range} onValueChange={(v) => setRange((v as Range) ?? "day")}>
            <TabsList>
              <TabsTrigger value="day">Ngày</TabsTrigger>
              <TabsTrigger value="week">Tuần</TabsTrigger>
              <TabsTrigger value="month">Tháng</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Lùi khoảng trước"
            onClick={() => setAnchor((a) => shift(range, a, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Input
            type="date"
            value={anchorISO}
            max={todayISO}
            onChange={(e) => {
              const v = e.target.value;
              if (v) setAnchor(parseISO(v));
            }}
            className="h-7 w-auto text-xs"
            aria-label="Chọn ngày kết thúc khoảng xem"
          />
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Tới khoảng sau"
            onClick={() => setAnchor((a) => shift(range, a, 1))}
            disabled={!canGoForward}
          >
            <ChevronRight className="size-4" />
          </Button>
          {!isPresent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnchor(new Date())}
              className="gap-1 h-7"
            >
              <RotateCcw className="size-3" />
              Hôm nay
            </Button>
          )}
        </div>
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
