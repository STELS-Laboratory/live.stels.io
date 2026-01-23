import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Info,
  Pencil,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { StoredAccount, WalletAccountSummary } from "@/types/stores/types";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { getExchangeIconPath } from "./types";
import { AccountDetailsSheet } from "./account-details-sheet";

interface AccountListProps {
  onEdit: (account: StoredAccount) => void;
  loading?: boolean;
}

function formatUSD(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPrecise(value: string | number | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getPnlColor(value: string | number | null | undefined): string {
  if (value == null) return "text-muted-foreground";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n) || n === 0) return "text-muted-foreground";
  return n > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500";
}

export function AccountList({ onEdit, loading }: AccountListProps) {
  const accounts = useAccountsStore((s) => s.accounts);
  const [detailsAccount, setDetailsAccount] = useState<StoredAccount | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p>Loading accounts...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium">No accounts yet</p>
          <p className="text-sm text-muted-foreground">
            Add an exchange account to start tracking your portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {accounts.map((stored) => {
          const a = stored.account;
          const r = stored.rawData;
          const status = r?.status ?? a.status ?? "active";
          const list0 = r?.wallet?.info?.result?.list?.[0] as WalletAccountSummary | undefined;
          
          const totalEquity = list0?.totalEquity;
          const totalWalletBalance = list0?.totalWalletBalance;
          const totalAvailableBalance = list0?.totalAvailableBalance;
          const totalPerpUPL = list0?.totalPerpUPL;
          const accountType = list0?.accountType;
          const coins = list0?.coin;
          const coinCount = Array.isArray(coins) ? coins.length : 0;

          const primaryBalance = totalEquity ?? totalWalletBalance;
          const hasWallet = primaryBalance != null;

          return (
            <Card
              key={stored.id}
              className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10"
            >
              <CardContent className="p-0">
                {/* Header */}
                <div className="flex items-start justify-between border-b p-4">
                  <button
                    type="button"
                    onClick={() => setDetailsAccount(stored)}
                    className="flex flex-1 cursor-pointer items-start gap-3 text-left outline-none"
                  >
                    <div className="relative">
                      <img
                        src={getExchangeIconPath(a.exchange)}
                        alt={a.exchange}
                        className="h-12 w-12 rounded-lg object-contain shadow-sm ring-1 ring-border"
                      />
                      {/* Connection indicator */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                          a.connection ? "bg-green-500" : "bg-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-mono font-semibold text-lg">
                          {a.nid}
                        </h3>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {a.exchange.charAt(0).toUpperCase() + a.exchange.slice(1)}
                        {a.note ? ` · ${a.note}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={status === "active" ? "default" : "secondary"}
                          className={`text-[10px] px-1.5 py-0 ${
                            status === "active"
                              ? "bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30"
                              : status === "stopped"
                                ? "bg-muted text-muted-foreground"
                                : "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                            status === "active" ? "bg-green-500" : status === "stopped" ? "bg-muted-foreground" : "bg-amber-500"
                          }`} />
                          {status}
                        </Badge>
                        {accountType && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {accountType}
                          </Badge>
                        )}
                        {coinCount > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {coinCount} coins
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDetailsAccount(stored)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Details</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(stored)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete (not supported)</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Balance section */}
                {hasWallet ? (
                  <button
                    type="button"
                    onClick={() => setDetailsAccount(stored)}
                    className="w-full cursor-pointer p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* Primary balance */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Total Equity
                        </p>
                        <p className="text-xl font-bold tracking-tight">
                          {formatPrecise(primaryBalance)}
                        </p>
                        {totalAvailableBalance != null && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatUSD(totalAvailableBalance)} available
                          </p>
                        )}
                      </div>

                      {/* PnL or secondary metric */}
                      {totalPerpUPL != null ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Unrealized PnL
                          </p>
                          <div className={`flex items-center gap-1 ${getPnlColor(totalPerpUPL)}`}>
                            {parseFloat(String(totalPerpUPL)) > 0 ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : parseFloat(String(totalPerpUPL)) < 0 ? (
                              <ArrowDownRight className="h-5 w-5" />
                            ) : null}
                            <p className="text-xl font-bold tracking-tight">
                              {formatPrecise(totalPerpUPL)}
                            </p>
                          </div>
                        </div>
                      ) : totalWalletBalance != null && totalEquity != null ? (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Wallet Balance
                          </p>
                          <p className="text-xl font-bold tracking-tight">
                            {formatPrecise(totalWalletBalance)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDetailsAccount(stored)}
                    className="w-full cursor-pointer p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <p className="text-sm">Click to view account details</p>
                    </div>
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AccountDetailsSheet
        account={detailsAccount}
        open={detailsAccount != null}
        onOpenChange={(open) => !open && setDetailsAccount(null)}
        onEdit={(acc) => {
          onEdit(acc);
          setDetailsAccount(null);
        }}
      />
    </TooltipProvider>
  );
}
