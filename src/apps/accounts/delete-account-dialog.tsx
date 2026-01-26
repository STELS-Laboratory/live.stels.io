import { Loader2 } from "lucide-react";
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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StoredAccount } from "@/types/stores/types";
import { getExchangeIconPath } from "./types";

interface DeleteAccountDialogProps {
  account: StoredAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteAccountDialog({
  account,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: DeleteAccountDialogProps) {
  if (!account) return null;

  const a = account.account;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete this account? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <img
                  src={getExchangeIconPath(a.exchange)}
                  alt={a.exchange}
                  className="h-8 w-8 rounded object-contain ring-1 ring-border"
                />
                <div>
                  <p className="font-mono font-semibold text-foreground">{a.nid}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.exchange.charAt(0).toUpperCase() + a.exchange.slice(1)}
                    {a.note ? ` · ${a.note}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
