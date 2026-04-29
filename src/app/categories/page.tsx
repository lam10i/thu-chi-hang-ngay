"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryIcon } from "@/components/category-icon";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import type { Category } from "@/types/transaction";

export default function CategoriesPage() {
  const { categories, isLoaded, deleteCategory } = useCategories();
  const { transactions } = useTransactions();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const usageCount = (id: string) =>
    transactions.filter((t) => t.category === id).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Danh mục</h1>
          <p className="text-sm text-muted-foreground">
            Tự tạo danh mục chi tiêu, chọn icon và màu yêu thích.
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
          Thêm danh mục
        </Button>
      </div>

      {!isLoaded ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Đang tải...</p>
      ) : categories.length === 0 ? (
        <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
          Chưa có danh mục nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => {
            const count = usageCount(c.id);
            return (
              <Card key={c.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className="flex size-11 items-center justify-center rounded-full text-white shrink-0"
                    style={{ backgroundColor: c.color ?? "#64748b" }}
                  >
                    <CategoryIcon name={c.icon} className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {count} giao dịch
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Sửa"
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Xoá"
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="size-4 text-rose-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CategoryForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && usageCount(deleting.id) > 0
                ? `Danh mục "${deleting.name}" đang được dùng cho ${usageCount(deleting.id)} giao dịch. Các giao dịch đó sẽ hiển thị là "Khác".`
                : `Bạn sắp xoá danh mục "${deleting?.name ?? ""}". Hành động này không thể hoàn tác.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={async () => {
                if (deleting) {
                  await deleteCategory(deleting.id);
                  toast.success("Đã xoá danh mục");
                }
                setDeleting(null);
              }}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
