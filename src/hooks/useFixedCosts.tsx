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
import type { FixedCost } from "@/types/transaction";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FixedCostsContextValue {
  fixedCosts: FixedCost[];
  isLoaded: boolean;
  total: number;
  addFixedCost: (input: Omit<FixedCost, "id" | "createdAt">) => Promise<void>;
  updateFixedCost: (
    id: string,
    patch: Partial<Omit<FixedCost, "id" | "createdAt">>,
  ) => Promise<void>;
  deleteFixedCost: (id: string) => Promise<void>;
}

const FixedCostsContext = createContext<FixedCostsContextValue | null>(null);

interface DbRow {
  id: string;
  name: string;
  amount: number;
  category_id: string | null;
  note: string | null;
  created_at: string;
}

function rowToFixedCost(r: DbRow): FixedCost {
  return {
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    category: r.category_id ?? undefined,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  };
}

export function FixedCostsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setFixedCosts([]);
      setIsLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("fixed_costs")
        .select("id, name, amount, category_id, note, created_at")
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error("Không tải được chi phí cố định");
      } else {
        setFixedCosts((data as DbRow[]).map(rowToFixedCost));
      }
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const addFixedCost = useCallback<FixedCostsContextValue["addFixedCost"]>(
    async (input) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("fixed_costs")
        .insert({
          user_id: user.id,
          name: input.name,
          amount: input.amount,
          category_id: input.category ?? null,
          note: input.note ?? null,
        })
        .select("id, name, amount, category_id, note, created_at")
        .single();
      if (error || !data) {
        toast.error("Không thêm được");
        return;
      }
      setFixedCosts((prev) => [...prev, rowToFixedCost(data as DbRow)]);
    },
    [supabase, user],
  );

  const updateFixedCost = useCallback<FixedCostsContextValue["updateFixedCost"]>(
    async (id, patch) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.amount !== undefined) dbPatch.amount = patch.amount;
      if (patch.category !== undefined) dbPatch.category_id = patch.category ?? null;
      if (patch.note !== undefined) dbPatch.note = patch.note ?? null;

      const { error } = await supabase.from("fixed_costs").update(dbPatch).eq("id", id);
      if (error) {
        toast.error("Không cập nhật được");
        return;
      }
      setFixedCosts((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    },
    [supabase],
  );

  const deleteFixedCost = useCallback<FixedCostsContextValue["deleteFixedCost"]>(
    async (id) => {
      const { error } = await supabase.from("fixed_costs").delete().eq("id", id);
      if (error) {
        toast.error("Không xoá được");
        return;
      }
      setFixedCosts((prev) => prev.filter((f) => f.id !== id));
    },
    [supabase],
  );

  const total = useMemo(
    () => fixedCosts.reduce((s, f) => s + f.amount, 0),
    [fixedCosts],
  );

  const value = useMemo<FixedCostsContextValue>(
    () => ({
      fixedCosts,
      isLoaded,
      total,
      addFixedCost,
      updateFixedCost,
      deleteFixedCost,
    }),
    [fixedCosts, isLoaded, total, addFixedCost, updateFixedCost, deleteFixedCost],
  );

  return (
    <FixedCostsContext.Provider value={value}>{children}</FixedCostsContext.Provider>
  );
}

export function useFixedCosts(): FixedCostsContextValue {
  const ctx = useContext(FixedCostsContext);
  if (!ctx) {
    throw new Error("useFixedCosts must be used within a FixedCostsProvider");
  }
  return ctx;
}
