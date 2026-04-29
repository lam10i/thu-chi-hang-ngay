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
import type { Transaction } from "@/types/transaction";
import { loadTransactions, saveTransactions } from "@/lib/storage";

interface TransactionsContextValue {
  transactions: Transaction[];
  isLoaded: boolean;
  addTransaction: (input: Omit<Transaction, "id" | "createdAt">) => Transaction;
  updateTransaction: (
    id: string,
    patch: Partial<Omit<Transaction, "id" | "createdAt">>,
  ) => void;
  deleteTransaction: (id: string) => void;
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTransactions(loadTransactions());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) saveTransactions(transactions);
  }, [transactions, isLoaded]);

  const addTransaction = useCallback<TransactionsContextValue["addTransaction"]>(
    (input) => {
      const newTx: Transaction = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
      return newTx;
    },
    [],
  );

  const updateTransaction = useCallback<TransactionsContextValue["updateTransaction"]>(
    (id, patch) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
    },
    [],
  );

  const deleteTransaction = useCallback<TransactionsContextValue["deleteTransaction"]>(
    (id) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [],
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
