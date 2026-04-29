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
import type { Category } from "@/types/transaction";
import { loadCategories, saveCategories } from "@/lib/storage";
import { slugify } from "@/lib/categories";

interface CategoriesContextValue {
  categories: Category[];
  isLoaded: boolean;
  getById: (id: string) => Category | undefined;
  addCategory: (input: Omit<Category, "id">) => Category;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCategories(loadCategories());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) saveCategories(categories);
  }, [categories, isLoaded]);

  const getById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories],
  );

  const addCategory = useCallback<CategoriesContextValue["addCategory"]>((input) => {
    const baseId = slugify(input.name);
    let id = baseId;
    let i = 2;
    setCategories((prev) => {
      while (prev.some((c) => c.id === id)) {
        id = `${baseId}-${i++}`;
      }
      return [...prev, { ...input, id }];
    });
    return { ...input, id };
  }, []);

  const updateCategory = useCallback<CategoriesContextValue["updateCategory"]>(
    (id, patch) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  const deleteCategory = useCallback<CategoriesContextValue["deleteCategory"]>(
    (id) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    [],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({ categories, isLoaded, getById, addCategory, updateCategory, deleteCategory }),
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
