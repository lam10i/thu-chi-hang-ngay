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
import type { Category } from "@/types/transaction";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/categories";

interface CategoriesContextValue {
  categories: Category[];
  isLoaded: boolean;
  getById: (id: string) => Category | undefined;
  addCategory: (input: Omit<Category, "id">) => Promise<Category | null>;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

interface DbRow {
  id: string;
  name: string;
  icon: string;
  color: string | null;
}

function rowToCategory(r: DbRow): Category {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color ?? undefined,
  };
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setIsLoaded(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon, color")
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error("Không tải được danh mục");
      } else {
        setCategories((data as DbRow[]).map(rowToCategory));
      }
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const getById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories],
  );

  const addCategory = useCallback<CategoriesContextValue["addCategory"]>(
    async (input) => {
      if (!user) return null;
      const baseId = slugify(input.name);
      let id = baseId;
      let i = 2;
      while (categories.some((c) => c.id === id)) id = `${baseId}-${i++}`;

      const { data, error } = await supabase
        .from("categories")
        .insert({
          id,
          user_id: user.id,
          name: input.name,
          icon: input.icon,
          color: input.color ?? null,
        })
        .select("id, name, icon, color")
        .single();
      if (error || !data) {
        toast.error("Không thêm được danh mục");
        return null;
      }
      const cat = rowToCategory(data as DbRow);
      setCategories((prev) => [...prev, cat]);
      return cat;
    },
    [supabase, user, categories],
  );

  const updateCategory = useCallback<CategoriesContextValue["updateCategory"]>(
    async (id, patch) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.icon !== undefined) dbPatch.icon = patch.icon;
      if (patch.color !== undefined) dbPatch.color = patch.color ?? null;

      const { error } = await supabase.from("categories").update(dbPatch).eq("id", id);
      if (error) {
        toast.error("Không cập nhật được danh mục");
        return;
      }
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [supabase],
  );

  const deleteCategory = useCallback<CategoriesContextValue["deleteCategory"]>(
    async (id) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        toast.error("Không xoá được danh mục");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    [supabase],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories,
      isLoaded,
      getById,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [categories, isLoaded, getById, addCategory, updateCategory, deleteCategory],
  );

  return (
    <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
  );
}

export function useCategories(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return ctx;
}
