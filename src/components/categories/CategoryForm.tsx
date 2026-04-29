"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check } from "lucide-react";
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
import { CategoryIcon } from "@/components/category-icon";
import { useCategories } from "@/hooks/useCategories";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/transaction";

const schema = z.object({
  name: z.string().trim().min(1, "Nhập tên danh mục").max(40, "Tối đa 40 ký tự"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Category | null;
  onCreated?: (cat: Category) => void;
}

export function CategoryForm({ open, onOpenChange, editing, onCreated }: Props) {
  const { addCategory, updateCategory } = useCategories();
  const isEdit = Boolean(editing);

  const [icon, setIcon] = useState<string>(editing?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState<string>(editing?.color ?? CATEGORY_COLORS[0]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: editing?.name ?? "" },
  });

  useEffect(() => {
    if (open) {
      reset({ name: editing?.name ?? "" });
      setIcon(editing?.icon ?? CATEGORY_ICONS[0]);
      setColor(editing?.color ?? CATEGORY_COLORS[0]);
    }
  }, [open, editing, reset]);

  const onSubmit = handleSubmit((values) => {
    if (isEdit && editing) {
      updateCategory(editing.id, { name: values.name, icon, color });
      toast.success("Đã cập nhật danh mục");
    } else {
      const created = addCategory({ name: values.name, icon, color });
      toast.success("Đã thêm danh mục");
      onCreated?.(created);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
          <DialogDescription>
            Chọn tên, icon và màu cho danh mục chi tiêu của bạn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-full text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              <CategoryIcon name={icon} className="size-6" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="cat-name">Tên danh mục</Label>
              <Input id="cat-name" placeholder="Vd: Cà phê" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-rose-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Màu</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Chọn màu ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition",
                    color === c ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="size-4 text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto rounded-md border p-2">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  aria-label={ic}
                  onClick={() => setIcon(ic)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md transition",
                    icon === ic
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground",
                  )}
                >
                  <CategoryIcon name={ic} className="size-4" />
                </button>
              ))}
            </div>
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
