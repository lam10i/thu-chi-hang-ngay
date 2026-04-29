"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { formatDate, formatVND } from "@/lib/format";
import { CategoryIcon } from "@/components/category-icon";

export function RecentTransactions() {
  const { transactions, isLoaded } = useTransactions();
  const { getById } = useCategories();

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) =>
          a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1,
        )
        .slice(0, 6),
    [transactions],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Chi tiêu gần đây</CardTitle>
        <Link
          href="/transactions"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Xem tất cả →
        </Link>
      </CardHeader>
      <CardContent>
        {!isLoaded ? (
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        ) : recent.length === 0 ? (
          <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
            Chưa ghi khoản chi nào. Bấm “Ghi chi tiêu” để bắt đầu.
          </div>
        ) : (
          <ul className="divide-y">
            {recent.map((t) => {
              const cat = getById(t.category);
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <div
                    className="flex size-9 items-center justify-center rounded-full text-white shrink-0"
                    style={{ backgroundColor: cat?.color ?? "#64748b" }}
                  >
                    <CategoryIcon name={cat?.icon ?? "Tag"} className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{cat?.name ?? "Khác"}</div>
                    {t.note && (
                      <div className="text-xs text-muted-foreground truncate">{t.note}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatVND(t.amount)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(t.date)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
