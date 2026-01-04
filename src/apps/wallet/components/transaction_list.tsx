/**
 * Transaction List Component
 * Displays list of asset transactions with status and details
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useTimerManager } from "@/lib/timer-manager";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  XCircle,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormattedNumber } from "@/components/ui/formatted-number";
import { cn } from "@/lib/utils";
import { toast } from "@/stores";
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
export const TransactionList = React.memo(function TransactionList({
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
  const { setTimeout, clear } = useTimerManager();
  const timeoutIdRef = React.useRef<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

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

  // Filter and search transactions
  const filteredAndSortedTransactions = useMemo((): TransactionResult[] => {
    let filtered = [...transactions];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((tx) => {
        const displayStatus = tx.consensus_status || tx.status || "pending";
        return displayStatus === statusFilter;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tx) => {
        // Search in transaction hash
        if (tx.tx_hash.toLowerCase().includes(query)) {
          return true;
        }
        // Search in addresses
        if (tx.transaction?.from?.toLowerCase().includes(query) ||
            tx.transaction?.to?.toLowerCase().includes(query)) {
          return true;
        }
        // Search in amount
        if (tx.transaction?.amount?.toString().includes(query)) {
          return true;
        }
        // Search in memo
        if (tx.transaction?.memo?.toLowerCase().includes(query)) {
          return true;
        }
        // Search in token symbol
        const symbol = tokenSymbolMap.get(
          tx.transaction?.token_id?.toLowerCase() || "",
        );
        if (symbol?.toLowerCase().includes(query)) {
          return true;
        }
        return false;
      });
    }

    // Sort by timestamp (newest first)
    // Transactions without submitted_at go to the end
    return filtered.sort((a, b) => {
      const aTime = a.submitted_at || 0;
      const bTime = b.submitted_at || 0;
      return bTime - aTime;
    });
  }, [transactions, statusFilter, searchQuery, tokenSymbolMap]);

  const handleCopy = async (text: string, hash: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(hash);
      toast.success("Copied!", "Transaction hash copied to clipboard");
      // Clear previous timeout if exists
      if (timeoutIdRef.current) {
        clear(timeoutIdRef.current);
      }
      // Set new timeout using TimerManager
      timeoutIdRef.current = setTimeout(() => {
        setCopiedHash(null);
        timeoutIdRef.current = null;
      }, 2000, "TransactionList copy feedback");
    } catch (err) {
      toast.error(
        "Failed to copy",
        err instanceof Error ? err.message : "Could not copy to clipboard",
      );
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

  // Show empty state only if there are no transactions at all (not filtered out)
  if (transactions.length === 0) {
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
          Transactions ({filteredAndSortedTransactions.length}
          {transactions.length !== filteredAndSortedTransactions.length &&
            ` of ${transactions.length}`})
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(mobile && "px-4 pt-0 pb-4")}>
        {/* Search and Filter */}
        <div className={cn("space-y-3 mb-4", mobile && "space-y-2")}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by hash, address, amount, memo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-9", mobile && "text-sm")}
              aria-label="Search transactions"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("w-full", mobile && "h-9 text-sm")}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="not_found">Not Found</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={cn(mobile ? "space-y-2" : "space-y-3")}>
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {searchQuery || statusFilter !== "all"
                  ? "No transactions match your filters"
                  : "No transactions found"}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            filteredAndSortedTransactions
            .map((tx, index) => {
              const transaction = tx.transaction;
              const hasFullData = !!(
                transaction &&
                typeof transaction === "object" &&
                typeof transaction.from === "string" &&
                typeof transaction.to === "string" &&
                transaction.from.length > 0 &&
                transaction.to.length > 0
              );

              // For incomplete transactions (only hash), show a simplified view
              if (!hasFullData) {
                const displayStatus = tx.consensus_status || tx.status || "pending";
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedTransaction(tx);
                        setIsDetailsOpen(true);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Transaction ${tx.tx_hash.slice(0, 8)}... loading`}
                    className={cn(
                      "flex items-start rounded border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      mobile ? "gap-2 p-3" : "gap-4 p-4",
                    )}
                  >
                    {/* Loading/Pending Icon */}
                    <div
                      className={cn(
                        "rounded-full flex items-center justify-center flex-shrink-0",
                        mobile ? "w-10 h-10" : "w-12 h-12",
                        "bg-muted text-muted-foreground",
                      )}
                    >
                      <Clock className={cn(mobile ? "w-5 h-5" : "w-6 h-6")} />
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
                          Loading transaction...
                        </span>
                        <Badge
                          variant={getStatusBadgeVariant(
                            tx.status || "pending",
                            tx.consensus_status,
                          )}
                          className={cn(
                            "text-xs flex items-center gap-1",
                            mobile && "text-[10px] px-1.5 py-0",
                          )}
                        >
                          {getStatusIcon(
                            tx.status || "pending",
                            tx.consensus_status,
                            tx.finalized,
                          )}
                          {displayStatus}
                        </Badge>
                      </div>
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
                          aria-label={
                            copiedHash === tx.tx_hash
                              ? "Transaction hash copied"
                              : "Copy transaction hash"
                          }
                          title="Copy transaction hash"
                        >
                          {copiedHash === tx.tx_hash
                            ? <Check className="size-3" aria-hidden="true" />
                            : <Copy className="size-3" aria-hidden="true" />}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTransaction(tx);
                      setIsDetailsOpen(true);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Transaction ${isOutgoing ? "sent" : "received"} ${transaction.amount} ${tokenSymbolMap.get(transaction.token_id.toLowerCase()) || "tokens"}`}
                  className={cn(
                    "flex items-start rounded border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
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
                      {tx.submitted_at && (
                        <span
                          className={cn(
                            "text-xs text-muted-foreground",
                            mobile && "text-[10px]",
                          )}
                        >
                          {formatTimestamp(tx.submitted_at)}
                        </span>
                      )}
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
                        aria-label={
                          copiedHash === tx.tx_hash
                            ? "Transaction hash copied"
                            : "Copy transaction hash"
                        }
                        title="Copy transaction hash"
                      >
                        {copiedHash === tx.tx_hash
                          ? <Check className="size-3" aria-hidden="true" />
                          : <Copy className="size-3" aria-hidden="true" />}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
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
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if props actually changed
  return (
    prevProps.transactions === nextProps.transactions &&
    prevProps.loading === nextProps.loading &&
    prevProps.address === nextProps.address &&
    prevProps.mobile === nextProps.mobile
  );
});
