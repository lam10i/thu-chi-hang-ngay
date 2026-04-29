"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Transaction } from "@/types/transaction";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TransactionsContextValue {
  transactions: Transaction[];
  isLoaded: boolean;
  addTransaction: (input: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (
    id: string,
    patch: Partial<Omit<Transaction, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

interface DbRow {
  id: string;
  amount: number;
  category_id: string;
  note: string | null;
  date: string;
  created_at: string;
}

function rowToTransaction(r: DbRow): Transaction {
  return {
    id: r.id,
    amount: Number(r.amount),
    category: r.category_id,
    note: r.note ?? undefined,
    date: r.date,
    createdAt: r.created_at,
  };
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setIsLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, amount, category_id, note, date, created_at")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        toast.error("Không tải được danh sách chi tiêu");
      } else {
        setTransactions((data as DbRow[]).map(rowToTransaction));
      }
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const addTransaction = useCallback<TransactionsContextValue["addTransaction"]>(
    async (input) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: input.amount,
          category_id: input.category,
          note: input.note ?? null,
          date: input.date,
        })
        .select("id, amount, category_id, note, date, created_at")
        .single();
      if (error || !data) {
        toast.error("Không lưu được giao dịch");
        return;
      }
      setTransactions((prev) => [rowToTransaction(data as DbRow), ...prev]);
    },
    [supabase, user],
  );

  const updateTransaction = useCallback<TransactionsContextValue["updateTransaction"]>(
    async (id, patch) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.amount !== undefined) dbPatch.amount = patch.amount;
      if (patch.category !== undefined) dbPatch.category_id = patch.category;
      if (patch.note !== undefined) dbPatch.note = patch.note ?? null;
      if (patch.date !== undefined) dbPatch.date = patch.date;

      const { error } = await supabase.from("transactions").update(dbPatch).eq("id", id);
      if (error) {
        toast.error("Không cập nhật được giao dịch");
        return;
      }
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
    },
    [supabase],
  );

  const deleteTransaction = useCallback<TransactionsContextValue["deleteTransaction"]>(
    async (id) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) {
        toast.error("Không xoá được giao dịch");
        return;
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [supabase],
  );

  const value = useMemo<TransactionsContextValue>(
    () => ({ transactions, isLoaded, addTransaction, updateTransaction, deleteTransaction }),
    [transactions, isLoaded, addTransaction, updateTransaction, deleteTransaction],
  );

  return (
    <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
  );
}

export function useTransactions(): TransactionsContextValue {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error("useTransactions must be used within a TransactionsProvider");
  }
  return ctx;
}
