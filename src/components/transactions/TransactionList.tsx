"use client";

import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { formatDate, formatVND } from "@/lib/format";
import { CategoryIcon } from "@/components/category-icon";
import { stripDiacritics } from "@/lib/categories";
import type { Transaction } from "@/types/transaction";

export interface ListFilters {
  category: string | "all";
  search: string;
  from: string; // "YYYY-MM-DD" or ""
  to: string;   // "YYYY-MM-DD" or ""
}

interface Props {
  filters: ListFilters;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

const normalize = (s: string) => stripDiacritics(s.toLowerCase());

export function TransactionList({ filters, onEdit, onDelete }: Props) {
  const { transactions, isLoaded } = useTransactions();
  const { getById } = useCategories();

  const rows = useMemo(() => {
    const q = normalize(filters.search.trim());
    const list = transactions.filter((t) => {
      if (filters.category !== "all" && t.category !== filters.category) return false;
      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;
      if (q) {
        const cat = getById(t.category);
        const haystack = normalize(`${t.note ?? ""} ${cat?.name ?? ""}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return list.sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1,
    );
  }, [transactions, filters, getById]);

  const total = useMemo(() => rows.reduce((s, t) => s + t.amount, 0), [rows]);

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Đang tải...</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
        Không có giao dịch nào khớp bộ lọc.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Tìm thấy <span className="font-medium text-foreground">{rows.length}</span> giao dịch ·
        Tổng <span className="font-medium text-foreground">{formatVND(total)}</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Ngày</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="w-[90px] text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const cat = getById(t.category);
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(t.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-6 items-center justify-center rounded-full text-white shrink-0"
                        style={{ backgroundColor: cat?.color ?? "#64748b" }}
                      >
                        <CategoryIcon name={cat?.icon ?? "Tag"} className="size-3.5" />
                      </span>
                      <span>{cat?.name ?? "Khác"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">
                    {t.note ?? ""}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatVND(t.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Sửa"
                        onClick={() => onEdit(t)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Xoá"
                        onClick={() => onDelete(t)}
                      >
                        <Trash2 className="size-4 text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
