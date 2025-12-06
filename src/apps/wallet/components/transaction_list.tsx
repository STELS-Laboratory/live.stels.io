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
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormattedNumber } from "@/components/ui/formatted-number";
import { cn } from "@/lib/utils";
import type { TransactionResult } from "@/hooks/use_asset_transactions";
import { useAssetList } from "@/hooks/use_asset_list";
import { TransactionDetailsDialog } from "./transaction_details_dialog";
import { TransactionListSkeleton } from "./wallet_skeletons";

interface TransactionListProps {
  transactions: TransactionResult[];
  loading: boolean;
  address: string;
  mobile?: boolean;
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
  const [selectedTransaction, setSelectedTransaction] = React.useState<
    TransactionResult | null
  >(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState<boolean>(false);

  // Get assets to map token_id to symbol
  const { assets } = useAssetList();

  // Create map of token_id -> symbol for quick lookup
  const tokenSymbolMap = useMemo(() => {
    const map = new Map<string, string>();
    if (assets && assets.length > 0) {
      assets.forEach((asset) => {
        // Skip genesis network documents
        const isGenesisDoc = asset.channel?.includes(".genesis:") ||
          (asset.raw?.genesis && !asset.raw.genesis.token &&
            asset.raw.genesis.genesis);

        if (isGenesisDoc) return;

        // Support both formats: legacy (token.raw.genesis.token) and new (metadata directly)
        const tokenId = asset.raw?.genesis?.token?.id ||
          asset.id ||
          asset.channel ||
          "";
        const symbol = asset.raw?.genesis?.token?.metadata?.symbol ||
          asset.metadata?.symbol ||
          "";

        if (tokenId && symbol) {
          map.set(tokenId.toLowerCase(), symbol);
        }
      });
    }
    return map;
  }, [assets]);

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
    } catch {
      // Error handled silently
    }
  };

  const getStatusIcon = (
    status: string,
    consensusStatus?: string,
    finalized?: boolean,
  ): React.ReactElement => {
    // Use consensus_status if available, otherwise fall back to pool status
    const displayStatus = consensusStatus || status;
    const isFinalized = finalized || false;

    switch (displayStatus) {
      case "confirmed":
        return (
          <CheckCircle2
            className={cn(
              "size-4",
              isFinalized ? "text-green-500" : "text-green-400",
            )}
          />
        );
      case "pending":
        return <Clock className="size-4 text-amber-500" />;
      case "failed":
        return <XCircle className="size-4 text-red-500" />;
      case "not_found":
        return <Clock className="size-4 text-muted-foreground" />;
      default:
        return <Clock className="size-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (
    status: string,
    consensusStatus?: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    // Use consensus_status if available, otherwise fall back to pool status
    const displayStatus = consensusStatus || status;

    switch (displayStatus) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      case "not_found":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <TransactionListSkeleton mobile={mobile} />;
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
          {sortedTransactions
            // Filter out transactions with missing or invalid transaction data
            .filter(
              (
                tx,
              ): tx is TransactionResult & {
                transaction: NonNullable<TransactionResult["transaction"]>;
              } => {
                return !!(
                  tx.transaction &&
                  typeof tx.transaction === "object" &&
                  typeof tx.transaction.from === "string" &&
                  typeof tx.transaction.to === "string" &&
                  tx.transaction.from.length > 0 &&
                  tx.transaction.to.length > 0
                );
              },
            )
            .map((tx, index) => {
              // After filtering, tx.transaction is guaranteed to exist
              // But add safety check with optional chaining for extra safety
              const transaction = tx.transaction;

              if (!transaction || !transaction.from || !transaction.to) {
                return null;
              }

              const isOutgoing = transaction.from === address;

              return (
                <motion.div
                  key={tx.tx_hash || `tx-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() => {
                    setSelectedTransaction(tx);
                    setIsDetailsOpen(true);
                  }}
                  className={cn(
                    "flex items-start rounded border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer",
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
                          "font-mono text-muted-foreground flex items-baseline gap-1",
                          mobile ? "text-xs" : "text-sm",
                        )}
                      >
                        <FormattedNumber
                          value={transaction.amount}
                          decimals={6}
                          useGrouping={true}
                        />{" "}
                        {tokenSymbolMap.get(
                          transaction.token_id.toLowerCase(),
                        ) ||
                          transaction.currency ||
                          "UNKNOWN"}
                      </span>
                      <Badge
                        variant={getStatusBadgeVariant(
                          tx.status,
                          tx.consensus_status,
                        )}
                        className={cn(
                          "text-xs flex items-center gap-1",
                          mobile && "text-[10px] px-1.5 py-0",
                        )}
                      >
                        {getStatusIcon(
                          tx.status,
                          tx.consensus_status,
                          tx.finalized,
                        )}
                        {tx.consensus_status || tx.status}
                        {tx.finalized && (
                          <span className="ml-1 text-[8px]">✓</span>
                        )}
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
                          ? `To: ${transaction.to.slice(0, 8)}...${
                            transaction.to.slice(-6)
                          }`
                          : `From: ${transaction.from.slice(0, 8)}...${
                            transaction.from.slice(-6)
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
                    {transaction.memo && (
                      <p
                        className={cn(
                          "text-xs text-muted-foreground line-clamp-1 mt-1",
                          mobile && "text-[10px]",
                        )}
                      >
                        {transaction.memo}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(tx.tx_hash, tx.tx_hash);
                        }}
                      >
                        {copiedHash === tx.tx_hash
                          ? <Check className="size-3" />
                          : <Copy className="size-3" />}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
            .filter((item): item is React.ReactElement => item !== null)}
        </div>
      </CardContent>

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        transaction={selectedTransaction}
        address={address}
        mobile={mobile}
      />
    </Card>
  );
}
