"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { useCategories } from "@/hooks/useCategories";
import { formatNumber, parseAmount, formatVND } from "@/lib/format";
import type { FixedCost } from "@/types/transaction";

const NO_CATEGORY = "__none__";

const schema = z.object({
  name: z.string().trim().min(1, "Nhập tên").max(60, "Tối đa 60 ký tự"),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  category: z.string().optional(),
  note: z.string().max(200, "Tối đa 200 ký tự").optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: FixedCost | null;
}

export function FixedCostForm({ open, onOpenChange, editing }: Props) {
  const { addFixedCost, updateFixedCost } = useFixedCosts();
  const { categories } = useCategories();
  const isEdit = Boolean(editing);

  const defaults = useMemo<FormValues>(
    () =>
      editing
        ? {
            name: editing.name,
            amount: editing.amount,
            category: editing.category ?? NO_CATEGORY,
            note: editing.note ?? "",
          }
        : {
            name: "",
            amount: 0,
            category: NO_CATEGORY,
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
  const [amountValue, setAmountValue] = useState(defaults.amount);

  useEffect(() => {
    setAmountDisplay(defaults.amount > 0 ? formatNumber(defaults.amount) : "");
    setAmountValue(defaults.amount);
  }, [defaults]);

  const hasShorthand = /[a-z]/i.test(amountDisplay);

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      amount: values.amount,
      category: values.category === NO_CATEGORY ? undefined : values.category,
      note: values.note?.trim() || undefined,
    };
    if (isEdit && editing) {
      await updateFixedCost(editing.id, payload);
      toast.success("Đã cập nhật");
    } else {
      await addFixedCost(payload);
      toast.success("Đã thêm chi phí cố định");
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa chi phí cố định" : "Thêm chi phí cố định"}
          </DialogTitle>
          <DialogDescription>
            Các khoản phải trả đều đặn hằng tháng (tiền nhà, internet, gym...).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fc-name">Tên</Label>
            <Input id="fc-name" placeholder="Vd: Tiền nhà" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-amount">Số tiền/tháng (VND)</Label>
            <Input
              id="fc-amount"
              inputMode="text"
              autoComplete="off"
              placeholder="Vd: 5tr = 5.000.000"
              value={amountDisplay}
              className="text-lg font-semibold"
              onChange={(e) => {
                const raw = e.target.value;
                const num = parseAmount(raw);
                setAmountValue(num);
                setValue("amount", num, { shouldValidate: true });
                if (/[a-z]/i.test(raw)) {
                  setAmountDisplay(raw);
                } else {
                  const digits = raw.replace(/\D/g, "");
                  setAmountDisplay(digits ? formatNumber(Number(digits)) : "");
                }
              }}
              onBlur={() => {
                if (amountValue > 0) setAmountDisplay(formatNumber(amountValue));
              }}
            />
            {hasShorthand && amountValue > 0 && (
              <p className="text-xs text-muted-foreground">
                = {formatVND(amountValue)}
              </p>
            )}
            {errors.amount && (
              <p className="text-xs text-rose-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Danh mục (tuỳ chọn)</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value || NO_CATEGORY}
                  onValueChange={(v) => field.onChange(v ?? NO_CATEGORY)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Không phân loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>Không phân loại</SelectItem>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-note">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              id="fc-note"
              rows={2}
              maxLength={200}
              placeholder="Vd: Trả đầu tháng, chuyển khoản"
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
              {isEdit ? "Lưu" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
