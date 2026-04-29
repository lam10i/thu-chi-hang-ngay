"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/category-icon";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { todayISO, formatNumber } from "@/lib/format";
import type { Transaction } from "@/types/transaction";

const schema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  category: z.string().min(1, "Chọn danh mục"),
  date: z
    .string()
    .min(1, "Chọn ngày")
    .refine((v) => v <= todayISO(), "Ngày không thể ở tương lai"),
  note: z.string().max(200, "Tối đa 200 ký tự").optional(),
});

type FormValues = z.infer<typeof schema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Transaction | null;
}

export function TransactionForm({ open, onOpenChange, editing }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useTransactions();
  const { categories } = useCategories();
  const isEdit = Boolean(editing);
  const [catFormOpen, setCatFormOpen] = useState(false);

  const defaults = useMemo<FormValues>(
    () =>
      editing
        ? {
            amount: editing.amount,
            category: editing.category,
            date: editing.date,
            note: editing.note ?? "",
          }
        : {
            amount: 0,
            category: "",
            date: todayISO(),
            note: "",
          },
    [editing],
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const [amountDisplay, setAmountDisplay] = useState(
    defaults.amount > 0 ? formatNumber(defaults.amount) : "",
  );

  useEffect(() => {
    setAmountDisplay(defaults.amount > 0 ? formatNumber(defaults.amount) : "");
  }, [defaults]);

  const onSubmit = handleSubmit((values) => {
    if (isEdit && editing) {
      updateTransaction(editing.id, {
        amount: values.amount,
        category: values.category,
        date: values.date,
        note: values.note?.trim() || undefined,
      });
      toast.success("Đã cập nhật giao dịch");
    } else {
      addTransaction({
        amount: values.amount,
        category: values.category,
        date: values.date,
        note: values.note?.trim() || undefined,
      });
      toast.success("Đã ghi khoản chi");
    }
    onOpenChange(false);
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Sửa khoản chi" : "Ghi khoản chi"}
            </DialogTitle>
            <DialogDescription>
              Nhập số tiền, chọn danh mục và ngày bạn đã chi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền (VND)</Label>
              <Input
                id="amount"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={amountDisplay}
                className="text-lg font-semibold"
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const num = digits ? Number(digits) : 0;
                  setAmountDisplay(digits ? formatNumber(num) : "");
                  setValue("amount", num, { shouldValidate: true });
                }}
              />
              {errors.amount && (
                <p className="text-xs text-rose-600">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Danh mục</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setCatFormOpen(true)}
                >
                  <Plus className="size-3" />
                  Thêm danh mục
                </Button>
              </div>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="flex size-5 items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: c.color ?? "#64748b" }}
                            >
                              <CategoryIcon name={c.icon} className="size-3" />
                            </span>
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-rose-600">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Ngày</Label>
              <Input id="date" type="date" max={todayISO()} {...register("date")} />
              {errors.date && (
                <p className="text-xs text-rose-600">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú (tuỳ chọn)</Label>
              <Textarea
                id="note"
                rows={2}
                maxLength={200}
                placeholder="Vd: Cơm trưa với đồng nghiệp"
                {...register("note")}
              />
              {errors.note && (
                <p className="text-xs text-rose-600">{errors.note.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? "Lưu" : "Ghi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CategoryForm
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        onCreated={(c) => setValue("category", c.id, { shouldValidate: true })}
      />
    </>
  );
}
