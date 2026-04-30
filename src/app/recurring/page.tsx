"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Repeat, Trash2 } from "lucide-react";
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
import { FixedCostForm } from "@/components/recurring/FixedCostForm";
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { useCategories } from "@/hooks/useCategories";
import { formatVND } from "@/lib/format";
import type { FixedCost } from "@/types/transaction";

export default function RecurringPage() {
  const { fixedCosts, isLoaded, total, deleteFixedCost } = useFixedCosts();
  const { getById } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FixedCost | null>(null);
  const [deleting, setDeleting] = useState<FixedCost | null>(null);

  const sorted = useMemo(
    () => [...fixedCosts].sort((a, b) => b.amount - a.amount),
    [fixedCosts],
  );

  const yearly = total * 12;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chi phí cố định</h1>
          <p className="text-sm text-muted-foreground">
            Các khoản phải trả đều đặn hằng tháng (tiền nhà, internet, gym...).
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
          Thêm khoản
        </Button>
      </div>

      {isLoaded && fixedCosts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40">
                <Repeat className="size-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tổng/tháng</div>
                <div className="text-2xl font-semibold">{formatVND(total)}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
                <Repeat className="size-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tổng/năm (×12)</div>
                <div className="text-2xl font-semibold">{formatVND(yearly)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoaded ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Đang tải...</p>
      ) : fixedCosts.length === 0 ? (
        <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
          Chưa có khoản nào. Bấm <strong>Thêm khoản</strong> để bắt đầu.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((f) => {
            const cat = f.category ? getById(f.category) : undefined;
            return (
              <Card key={f.id}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className="flex size-11 items-center justify-center rounded-full text-white shrink-0"
                    style={{ backgroundColor: cat?.color ?? "#64748b" }}
                  >
                    <CategoryIcon name={cat?.icon ?? "Repeat"} className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{f.name}</div>
                    <div className="text-sm font-semibold">{formatVND(f.amount)}</div>
                    {(cat || f.note) && (
                      <div className="text-xs text-muted-foreground truncate">
                        {cat ? cat.name : ""}
                        {cat && f.note ? " · " : ""}
                        {f.note ?? ""}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Sửa"
                      onClick={() => {
                        setEditing(f);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Xoá"
                      onClick={() => setDeleting(f)}
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

      <FixedCostForm
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
            <AlertDialogTitle>Xoá khoản này?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `Bạn sắp xoá "${deleting.name}" (${formatVND(deleting.amount)}/tháng). Không thể hoàn tác.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={async () => {
                if (deleting) {
                  await deleteFixedCost(deleting.id);
                  toast.success("Đã xoá");
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
