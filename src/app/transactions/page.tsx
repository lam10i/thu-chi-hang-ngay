"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TransactionList,
  type ListFilters,
} from "@/components/transactions/TransactionList";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { DeleteConfirm } from "@/components/transactions/DeleteConfirm";
import type { Transaction } from "@/types/transaction";

const INITIAL_FILTERS: ListFilters = {
  category: "all",
  search: "",
  from: "",
  to: "",
};

export default function TransactionsPage() {
  const [filters, setFilters] = useState<ListFilters>(INITIAL_FILTERS);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chi tiêu</h1>
          <p className="text-sm text-muted-foreground">
            Toàn bộ lịch sử khoản chi của bạn.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="gap-1"
        >
          <Plus className="size-4" />
          Ghi chi tiêu
        </Button>
      </div>

      <TransactionFilters filters={filters} onChange={setFilters} />

      <TransactionList
        filters={filters}
        onEdit={(t) => {
          setEditing(t);
          setFormOpen(true);
        }}
        onDelete={(t) => setDeleting(t)}
      />

      <TransactionForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
      />
      <DeleteConfirm transaction={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
