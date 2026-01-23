/**
 * Transfer Dialog Component
 * Dialog for transferring funds between accounts
 */

import { useState, useCallback } from "react";
import { useTradingStore } from "../store";
import type { AccountType } from "../types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowRightLeft } from "lucide-react";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "spot", label: "Spot" },
  { value: "margin", label: "Margin" },
  { value: "futures", label: "Futures" },
  { value: "funding", label: "Funding" },
];

const COMMON_CURRENCIES = ["USDT", "USDC", "BTC", "ETH", "BNB"];

export function TransferDialog({
  open,
  onOpenChange,
  accountId,
}: TransferDialogProps) {
  const { transferFunds, transferring, balances } = useTradingStore();

  const [fromAccount, setFromAccount] = useState<AccountType>("spot");
  const [toAccount, setToAccount] = useState<AccountType>("futures");
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const success = await transferFunds({
      accountId,
      currency,
      amount: parseFloat(amount),
      fromAccount,
      toAccount,
    });

    if (success) {
      setAmount("");
      onOpenChange(false);
    }
  }, [accountId, currency, amount, fromAccount, toAccount, transferFunds, onOpenChange]);

  const handleSwap = useCallback(() => {
    const temp = fromAccount;
    setFromAccount(toAccount);
    setToAccount(temp);
  }, [fromAccount, toAccount]);

  // Get available balance for selected currency
  const availableBalance = balances[currency]?.free || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
          <DialogDescription>
            Transfer funds between your account wallets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_CURRENCIES.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From/To Selection */}
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-2">
              <Label>From</Label>
              <Select value={fromAccount} onValueChange={(v) => setFromAccount(v as AccountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.filter((t) => t.value !== toAccount).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="mt-6"
              onClick={handleSwap}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 space-y-2">
              <Label>To</Label>
              <Select value={toAccount} onValueChange={(v) => setToAccount(v as AccountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.filter((t) => t.value !== fromAccount).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Amount</Label>
              <span className="text-xs text-muted-foreground">
                Available: {availableBalance.toFixed(4)} {currency}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.0001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount(availableBalance.toString())}
              >
                MAX
              </Button>
            </div>
          </div>

          {/* Transfer Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div className="flex items-center justify-center gap-3 py-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">{fromAccount}</div>
                <div className="font-mono font-medium">
                  -{parseFloat(amount).toFixed(4)}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground">{toAccount}</div>
                <div className="font-mono font-medium text-green-500">
                  +{parseFloat(amount).toFixed(4)}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={transferring || !amount || parseFloat(amount) <= 0}
          >
            {transferring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              "Transfer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
