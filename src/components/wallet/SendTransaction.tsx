import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWalletStore } from "@/stores/modules/wallet.store";
import {
  deterministicStringify,
  sign,
  type Transaction,
} from "@/lib/gliesereum";

interface SendTransactionProps {
  onTransactionSent?: (transaction: Transaction) => void;
}

/**
 * Send transaction component for creating and signing transactions
 */
export function SendTransaction({ onTransactionSent }: SendTransactionProps) {
  const { currentWallet, isUnlocked, validateWalletAddress, addTransaction } =
    useWalletStore();

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("0.001");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!currentWallet || !isUnlocked) {
      setError("Wallet is locked or not available");
      return;
    }

    if (!toAddress.trim()) {
      setError("Recipient address is required");
      return;
    }

    if (!validateWalletAddress(toAddress.trim())) {
      setError("Invalid recipient address");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid amount");
      return;
    }

    const feeNum = parseFloat(fee);
    if (isNaN(feeNum) || feeNum < 0) {
      setError("Invalid fee");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Create transaction object
      const transaction: Omit<Transaction, "hash" | "signature"> = {
        from: {
          address: currentWallet.address,
          publicKey: currentWallet.publicKey,
          number: currentWallet.number,
        },
        to: toAddress.trim(),
        amount: amountNum,
        fee: feeNum,
        timestamp: Date.now(),
        status: "pending",
        validators: [],
        data: "",
      };

      // Create deterministic string for signing
      const transactionString = deterministicStringify(transaction);

      // Sign the transaction
      const signature = sign(transactionString, currentWallet.privateKey);

      // Create final transaction with hash and signature
      const finalTransaction: Transaction = {
        ...transaction,
        hash: signature.slice(0, 64), // Use first 64 chars of signature as hash
        signature,
        verified: false,
      };

      // Add to transaction list
      addTransaction(finalTransaction);

      // Reset form
      setToAddress("");
      setAmount("");
      setFee("0.001");

      // Notify parent component
      onTransactionSent?.(finalTransaction);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to send transaction",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleAddressValidation = (address: string) => {
    setToAddress(address);
    if (address && !validateWalletAddress(address)) {
      setError("Invalid address format");
    } else {
      setError(null);
    }
  };

  if (!currentWallet) {
    return (
      <Card className="bg-zinc-900/80 border-zinc-700/50">
        <CardContent className="p-6">
          <div className="text-center text-zinc-400">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-medium mb-2">No Wallet</h3>
            <p className="text-sm">
              Create or import a wallet to send transactions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-700/50">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          Send Transaction
          <Badge
            variant="secondary"
            className="bg-amber-500/20 text-amber-300 border-amber-500/30"
          >
            {isUnlocked ? "Unlocked" : "Locked"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipient Address */}
        <div className="space-y-2">
          <Label htmlFor="to-address" className="text-zinc-300">
            Recipient Address
          </Label>
          <Input
            id="to-address"
            type="text"
            placeholder="Enter Gliesereum address"
            value={toAddress}
            onChange={(e) => handleAddressValidation(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500"
            disabled={!isUnlocked || isSending}
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-zinc-300">
            Amount (TST)
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            placeholder="0.00000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500"
            disabled={!isUnlocked || isSending}
          />
        </div>

        {/* Fee */}
        <div className="space-y-2">
          <Label htmlFor="fee" className="text-zinc-300">
            Transaction Fee (TST)
          </Label>
          <Input
            id="fee"
            type="number"
            step="0.00000001"
            placeholder="0.001"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500"
            disabled={!isUnlocked || isSending}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!isUnlocked || isSending || !toAddress.trim() ||
            !amount.trim()}
          className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-medium"
        >
          {isSending ? "Sending..." : "Send Transaction"}
        </Button>

        {/* Transaction Info */}
        <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
          <div className="text-xs text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span>From:</span>
              <span className="font-mono">
                {currentWallet.address.slice(0, 12)}...{currentWallet.address
                  .slice(-8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Available:</span>
              <span>∞ TST (TestNet)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
