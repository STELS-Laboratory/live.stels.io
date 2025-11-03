/**
 * Transaction List Component
 * Displays list of asset transactions with status and details
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TransactionResult } from "@/hooks/use_asset_transactions";

interface TransactionListProps {
  transactions: TransactionResult[];
  loading: boolean;
  address: string;
  mobile?: boolean;
}

/**
 * Format transaction amount with decimals
 */
function formatAmount(amount: string, decimals: number = 6): string {
  const num = Number.parseFloat(amount);
  return num.toFixed(decimals);
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Transaction List Component
 */
export function TransactionList({
  transactions,
  loading,
  address,
  mobile = false,
}: TransactionListProps): React.ReactElement {
  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  const sortedTransactions = useMemo((): TransactionResult[] => {
    return [...transactions].sort((a, b) => {
      // Sort by timestamp (newest first)
      return b.submitted_at - a.submitted_at;
    });
  }, [transactions]);

  const handleCopy = async (text: string, hash: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getStatusIcon = (
    status: string,
  ): React.ReactElement => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="size-4 text-green-500" />;
      case "pending":
        return <Clock className="size-4 text-amber-500" />;
      case "failed":
        return <XCircle className="size-4 text-red-500" />;
      default:
        return <Clock className="size-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ArrowUpRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No transactions found</p>
            <p className="text-xs mt-1">
              Your transaction history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(mobile && "p-2")}>
      <CardHeader className={cn(mobile && "px-4 py-4")}>
        <CardTitle
          className={cn(
            "flex items-center gap-2",
            mobile && "text-base",
          )}
        >
          <ArrowUpRight className={cn(mobile ? "w-4 h-4" : "w-5 h-5")} />
          Transactions ({sortedTransactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(mobile && "px-4 pt-0 pb-4")}>
        <div className={cn(mobile ? "space-y-2" : "space-y-3")}>
          {sortedTransactions.map((tx, index) => {
            const isOutgoing = tx.transaction.from === address;
            const isIncoming = tx.transaction.to === address;

            return (
              <motion.div
                key={tx.tx_hash}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "flex items-start rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors",
                  mobile ? "gap-2 p-3" : "gap-4 p-4",
                )}
              >
                {/* Direction Icon */}
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center flex-shrink-0",
                    mobile ? "w-10 h-10" : "w-12 h-12",
                    isOutgoing
                      ? "bg-red-500/10 text-red-500"
                      : "bg-green-500/10 text-green-500",
                  )}
                >
                  {isOutgoing
                    ? (
                      <ArrowUpRight
                        className={cn(
                          mobile ? "w-5 h-5" : "w-6 h-6",
                        )}
                      />
                    )
                    : (
                      <ArrowDownLeft
                        className={cn(
                          mobile ? "w-5 h-5" : "w-6 h-6",
                        )}
                      />
                    )}
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "flex items-center mb-1 gap-2 flex-wrap",
                      mobile && "gap-1.5",
                    )}
                  >
                    <span
                      className={cn(
                        "font-semibold text-foreground",
                        mobile ? "text-sm" : "text-base",
                      )}
                    >
                      {isOutgoing ? "Sent" : "Received"}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-muted-foreground",
                        mobile ? "text-xs" : "text-sm",
                      )}
                    >
                      {formatAmount(tx.transaction.amount, 6)}{" "}
                      {tx.transaction.currency}
                    </span>
                    <Badge
                      variant={getStatusBadgeVariant(tx.status)}
                      className={cn(
                        "text-xs flex items-center gap-1",
                        mobile && "text-[10px] px-1.5 py-0",
                      )}
                    >
                      {getStatusIcon(tx.status)}
                      {tx.status}
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2 flex-wrap",
                      mobile && "gap-1.5",
                    )}
                  >
                    <span
                      className={cn(
                        "text-muted-foreground font-mono",
                        mobile ? "text-xs" : "text-sm",
                      )}
                    >
                      {isOutgoing
                        ? `To: ${tx.transaction.to.slice(0, 8)}...${
                          tx.transaction.to.slice(-6)
                        }`
                        : `From: ${tx.transaction.from.slice(0, 8)}...${
                          tx.transaction.from.slice(-6)
                        }`}
                    </span>
                    <span
                      className={cn(
                        "text-xs text-muted-foreground",
                        mobile && "text-[10px]",
                      )}
                    >
                      {formatTimestamp(tx.submitted_at)}
                    </span>
                  </div>
                  {tx.transaction.memo && (
                    <p
                      className={cn(
                        "text-xs text-muted-foreground line-clamp-1 mt-1",
                        mobile && "text-[10px]",
                      )}
                    >
                      {tx.transaction.memo}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={cn(
                        "text-xs text-muted-foreground font-mono",
                        mobile && "text-[10px]",
                      )}
                    >
                      Hash: {tx.tx_hash.slice(0, 12)}...{tx.tx_hash.slice(-8)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(tx.tx_hash, tx.tx_hash)}
                    >
                      {copiedHash === tx.tx_hash
                        ? <Check className="size-3" />
                        : <Copy className="size-3" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
