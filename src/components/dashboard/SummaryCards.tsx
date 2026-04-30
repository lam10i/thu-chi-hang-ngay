"use client";

import { useMemo } from "react";
import {
  CalendarDays,
  CalendarRange,
  Minus,
  Sun,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { formatVND, todayISO } from "@/lib/format";
import {
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
import { cn } from "@/lib/utils";

interface DiffProps {
  current: number;
  previous: number;
  label: string;
}

function ComparisonBadge({ current, previous, label }: DiffProps) {
  if (previous === 0) {
    if (current === 0) return null;
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <Minus className="size-3" />
        Chưa có dữ liệu {label}
      </div>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct);
  if (Math.abs(rounded) < 1) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <Minus className="size-3" />
        Không đổi vs {label}
      </div>
    );
  }
  const isUp = rounded > 0;
  // Tiêu nhiều hơn = xấu (đỏ), tiêu ít hơn = tốt (xanh)
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs mt-1",
        isUp ? "text-rose-600" : "text-emerald-600",
      )}
    >
      {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      <span>
        {isUp ? "+" : ""}
        {rounded}% vs {label}
      </span>
    </div>
  );
}

export function SummaryCards() {
  const { transactions, isLoaded } = useTransactions();

  const totals = useMemo(() => {
    const t0 = todayISO();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const prevWeekStart = startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });
    const prevWeekEnd = endOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(addMonths(now, -1));
    const prevMonthEnd = endOfMonth(addMonths(now, -1));

    let day = 0;
    let week = 0;
    let prevWeek = 0;
    let month = 0;
    let prevMonth = 0;

    for (const t of transactions) {
      if (t.date === t0) day += t.amount;
      try {
        const d = parseISO(t.date);
        if (d >= weekStart && d <= weekEnd) week += t.amount;
        else if (d >= prevWeekStart && d <= prevWeekEnd) prevWeek += t.amount;
        if (d >= monthStart && d <= monthEnd) month += t.amount;
        else if (d >= prevMonthStart && d <= prevMonthEnd) prevMonth += t.amount;
      } catch {
        /* skip */
      }
    }

    return { day, week, prevWeek, month, prevMonth };
  }, [transactions]);

  const display = (n: number) => (isLoaded ? formatVND(n) : "—");
  const monthLabel = isLoaded ? format(new Date(), "MMMM yyyy", { locale: vi }) : "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Hôm nay
          </CardTitle>
          <Sun className="size-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{display(totals.day)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tuần này
          </CardTitle>
          <CalendarRange className="size-4 text-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{display(totals.week)}</div>
          {isLoaded && (
            <ComparisonBadge
              current={totals.week}
              previous={totals.prevWeek}
              label="tuần trước"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tháng này{monthLabel && ` — ${monthLabel}`}
          </CardTitle>
          <CalendarDays className="size-4 text-violet-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{display(totals.month)}</div>
          {isLoaded && (
            <ComparisonBadge
              current={totals.month}
              previous={totals.prevMonth}
              label="tháng trước"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
