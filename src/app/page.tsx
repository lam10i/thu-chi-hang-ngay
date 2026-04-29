"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TransactionForm } from "@/components/transactions/TransactionForm";

const SpendingChart = dynamic(
  () => import("@/components/dashboard/SpendingChart").then((m) => m.SpendingChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-md border bg-card animate-pulse" />
    ),
  },
);

const CategoryPieChart = dynamic(
  () => import("@/components/dashboard/CategoryPieChart").then((m) => m.CategoryPieChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-md border bg-card animate-pulse" />
    ),
  },
);

export default function DashboardPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tổng quan</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi tiền bạn đã chi hôm nay, tuần này và tháng này.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1">
          <Plus className="size-4" />
          Ghi chi tiêu
        </Button>
      </div>

      <SummaryCards />
      <SpendingChart />
      <CategoryPieChart />
      <RecentTransactions />

      <TransactionForm open={open} onOpenChange={setOpen} />
    </div>
  );
}
