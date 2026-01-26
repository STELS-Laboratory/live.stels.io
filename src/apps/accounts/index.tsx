import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ArrowUpDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccountsApi } from "./hooks/use-accounts-api";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import type { SetAccountPayload } from "@/lib/api-types";
import type { StoredAccount, WalletAccountSummary } from "@/types/stores/types";
import { AccountList } from "./account-list";
import { AccountFormDialog } from "./account-form-dialog";
import { EXCHANGE_OPTIONS, getExchangeIconPath } from "./types";

export type SortOption = "equity-desc" | "equity-asc" | "pnl-desc" | "pnl-asc" | "name-asc" | "name-desc" | "updated-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "equity-desc", label: "Equity: High to Low" },
  { value: "equity-asc", label: "Equity: Low to High" },
  { value: "pnl-desc", label: "PnL: Best first" },
  { value: "pnl-asc", label: "PnL: Worst first" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
  { value: "updated-desc", label: "Recently updated" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "stopped", label: "Stopped" },
  { value: "error", label: "Error" },
];

function formatPrecise(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AccountsApp() {
  const { listAccounts, setAccount, disconnectAccount, loading } = useAccountsApi();
  const accounts = useAccountsStore((s) => s.accounts);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<StoredAccount | null>(null);

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("equity-desc");

  useEffect(() => {
    listAccounts();
  }, [listAccounts]);

  const handleAdd = useCallback(() => {
    setEditAccount(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((account: StoredAccount) => {
    setEditAccount(account);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditAccount(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (payload: SetAccountPayload, omitSecrets?: boolean) =>
      setAccount(payload, omitSecrets),
    [setAccount],
  );

  // Calculate portfolio summary
  const summary = useMemo(() => {
    let totalEquity = 0;
    let totalPnL = 0;
    let accountsWithData = 0;

    for (const stored of accounts) {
      const list0 = stored.rawData?.wallet?.info?.result?.list?.[0] as
        | WalletAccountSummary
        | undefined;
      if (list0?.totalEquity != null) {
        totalEquity += parseFloat(String(list0.totalEquity));
        accountsWithData++;
      }
      if (list0?.totalPerpUPL != null) {
        totalPnL += parseFloat(String(list0.totalPerpUPL));
      }
    }

    return {
      totalEquity,
      totalPnL,
      accountCount: accounts.length,
      accountsWithData,
    };
  }, [accounts]);

  const hasSummaryData = summary.accountsWithData > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
              <p className="text-sm text-muted-foreground">
                Manage your exchange accounts and track portfolio performance
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => listAccounts()}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button size="sm" onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        {hasSummaryData && (
          <div className="border-t px-6 py-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Total Equity */}
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Portfolio
                    </p>
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatPrecise(summary.totalEquity)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Total PnL */}
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  {summary.totalPnL >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-500" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Unrealized PnL
                    </p>
                    <p
                      className={`text-2xl font-semibold tracking-tight ${
                        summary.totalPnL >= 0
                          ? "text-green-600 dark:text-green-500"
                          : "text-red-600 dark:text-red-500"
                      }`}
                    >
                      {summary.totalPnL >= 0 ? "+" : ""}
                      {formatPrecise(summary.totalPnL)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Count */}
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Connected Accounts
                    </p>
                    <p className="text-2xl font-semibold tracking-tight">
                      {summary.accountCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {summary.accountsWithData} with data
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Toolbar: Search, Filter, Sort */}
        {accounts.length > 0 && (
          <div className="border-t px-6 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by NID or note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Exchange Filter */}
                <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Exchanges" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exchanges</SelectItem>
                    {EXCHANGE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <div className="flex items-center gap-2">
                          <img
                            src={getExchangeIconPath(o.value)}
                            alt={o.label}
                            className="h-4 w-4 rounded object-contain"
                          />
                          <span>{o.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[170px]">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear filters button */}
                {(searchQuery || exchangeFilter !== "all" || statusFilter !== "all" || sortBy !== "equity-desc") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setExchangeFilter("all");
                      setStatusFilter("all");
                      setSortBy("equity-desc");
                    }}
                    className="text-muted-foreground"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account List */}
      <div className="flex-1 overflow-auto p-6">
        <AccountList
          onEdit={handleEdit}
          onDelete={disconnectAccount}
          loading={loading}
          searchQuery={searchQuery}
          exchangeFilter={exchangeFilter}
          statusFilter={statusFilter}
          sortBy={sortBy}
        />
      </div>

      {/* Form Dialog */}
      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editAccount={editAccount}
        onSubmit={handleFormSubmit}
        loading={loading}
      />
    </div>
  );
}
