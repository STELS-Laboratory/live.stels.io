import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Copy } from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import {
  type SignedTransaction,
  type TransactionRequest,
  useAccountsStore,
} from "@/stores/modules/accounts.store";

interface SignTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for signing transactions
 */
export default function SignTransactionDialog({
  open,
  onOpenChange,
}: SignTransactionDialogProps): React.ReactElement {
  const [transactionData, setTransactionData] = useState<TransactionRequest>({
    to: "",
    amount: 0,
    fee: 1,
    data: "",
  });
  const [signedTransaction, setSignedTransaction] = useState<
    SignedTransaction | null
  >(null);
  const [copied, setCopied] = useState(false);

  const { wallet } = useAuthStore();
  const { signTransaction } = useAccountsStore();

  const handleReset = (): void => {
    setTransactionData({
      to: "",
      amount: 0,
      fee: 1,
      data: "",
    });
    setSignedTransaction(null);
    setCopied(false);
  };

  const handleClose = (): void => {
    handleReset();
    onOpenChange(false);
  };

  const handleSign = (): void => {
    if (!wallet) {
      console.error("[SignTransaction] No wallet available");
      return;
    }

    const signed = signTransaction(transactionData, wallet);
    setSignedTransaction(signed);
  };

  const handleCopy = (): void => {
    if (signedTransaction) {
      navigator.clipboard.writeText(JSON.stringify(signedTransaction, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isFormValid = transactionData.to.length > 0 &&
    transactionData.amount >= 0 && transactionData.fee > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {signedTransaction ? "Transaction Signed" : "Sign Transaction"}
          </DialogTitle>
          <DialogDescription>
            {signedTransaction
              ? "Your transaction has been successfully signed."
              : "Enter transaction details to sign with your wallet."}
          </DialogDescription>
        </DialogHeader>

        {!signedTransaction
          ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="to">Recipient Address</Label>
                <Input
                  id="to"
                  placeholder="g..."
                  value={transactionData.to}
                  onChange={(e) =>
                    setTransactionData((p) => ({ ...p, to: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.00000001"
                    value={transactionData.amount}
                    onChange={(e) =>
                      setTransactionData((p) => ({
                        ...p,
                        amount: Number.parseFloat(e.target.value) || 0,
                      }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee">Transaction Fee</Label>
                  <Input
                    id="fee"
                    type="number"
                    min="0"
                    step="0.00000001"
                    value={transactionData.fee}
                    onChange={(e) =>
                      setTransactionData((p) => ({
                        ...p,
                        fee: Number.parseFloat(e.target.value) || 1,
                      }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data">Transaction Data (Optional)</Label>
                <Textarea
                  id="data"
                  placeholder="Enter any additional transaction data or metadata"
                  value={transactionData.data || ""}
                  onChange={(e) =>
                    setTransactionData((p) => ({ ...p, data: e.target.value }))}
                  rows={4}
                />
              </div>

              <Alert>
                <AlertDescription>
                  This transaction will be signed with your wallet's private
                  key. The signature proves that you authorize this transaction.
                </AlertDescription>
              </Alert>
            </div>
          )
          : (
            <div className="space-y-4 py-4">
              <Alert
                variant="default"
                className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-300">
                  Transaction Signed Successfully
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  Your transaction has been cryptographically signed and is
                  ready to be broadcast to the network.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Signed Transaction</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8"
                  >
                    {copied
                      ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      )
                      : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy JSON
                        </>
                      )}
                  </Button>
                </div>
                <pre className="w-full bg-muted p-4 rounded-md text-xs overflow-x-auto border border-border/50">
								{JSON.stringify(signedTransaction, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <div className="font-mono text-xs text-card-foreground bg-muted/50 rounded p-2 border border-border/50 truncate">
                    {signedTransaction.from}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <div className="font-mono text-xs text-card-foreground bg-muted/50 rounded p-2 border border-border/50 truncate">
                    {signedTransaction.to}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Amount
                  </Label>
                  <div className="font-mono text-xs text-card-foreground bg-muted/50 rounded p-2 border border-border/50">
                    {signedTransaction.amount}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fee</Label>
                  <div className="font-mono text-xs text-card-foreground bg-muted/50 rounded p-2 border border-border/50">
                    {signedTransaction.fee}
                  </div>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    Timestamp
                  </Label>
                  <div className="font-mono text-xs text-card-foreground bg-muted/50 rounded p-2 border border-border/50">
                    {new Date(signedTransaction.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-muted-foreground">
                    Signature
                  </Label>
                  <div className="font-mono text-xs text-card-foreground bg-muted/50 rounded p-2 border border-border/50 break-all">
                    {signedTransaction.signature}
                  </div>
                </div>
              </div>
            </div>
          )}

        <DialogFooter className="flex justify-between">
          {!signedTransaction
            ? (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={!isFormValid}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-900 disabled:opacity-50"
                >
                  Sign Transaction
                </Button>
              </>
            )
            : (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Sign Another
                </Button>
                <Button
                  onClick={handleClose}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
                >
                  Close
                </Button>
              </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
