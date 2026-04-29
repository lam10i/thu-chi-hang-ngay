"use client";

import { useMemo } from "react";
import { CalendarDays, CalendarRange, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { formatVND, todayISO } from "@/lib/format";
import { startOfWeek, parseISO, format } from "date-fns";
import { vi } from "date-fns/locale";

export function SummaryCards() {
  const { transactions, isLoaded } = useTransactions();

  const { today, week, month } = useMemo(() => {
    const t0 = todayISO();
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const ym = format(now, "yyyy-MM");

    let dayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    for (const t of transactions) {
      if (t.date === t0) dayTotal += t.amount;
      try {
        if (parseISO(t.date) >= weekStart) weekTotal += t.amount;
      } catch {
        /* ignore bad date */
      }
      if (t.date.startsWith(ym)) monthTotal += t.amount;
    }
    return { today: dayTotal, week: weekTotal, month: monthTotal };
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
          <div className="text-2xl font-semibold">{display(today)}</div>
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
          <div className="text-2xl font-semibold">{display(week)}</div>
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
          <div className="text-2xl font-semibold">{display(month)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
