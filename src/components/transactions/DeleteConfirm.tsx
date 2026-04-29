"use client";

import { toast } from "sonner";
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
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction } from "@/types/transaction";
import { formatVND } from "@/lib/format";

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

export function DeleteConfirm({ transaction, onClose }: Props) {
  const { deleteTransaction } = useTransactions();
  const open = Boolean(transaction);

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá giao dịch?</AlertDialogTitle>
          <AlertDialogDescription>
            {transaction
              ? `Bạn sắp xoá khoản chi ${formatVND(transaction.amount)}. Hành động này không thể hoàn tác.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huỷ</AlertDialogCancel>
          <AlertDialogAction
            className="bg-rose-600 text-white hover:bg-rose-700"
            onClick={async () => {
              if (transaction) {
                await deleteTransaction(transaction.id);
                toast.success("Đã xoá giao dịch");
              }
              onClose();
            }}
          >
            Xoá
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
