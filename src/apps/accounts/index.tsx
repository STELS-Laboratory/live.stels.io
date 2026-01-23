import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  RefreshCw,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAccountsApi } from "./hooks/use-accounts-api";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import type { SetAccountPayload } from "@/lib/api-types";
import type { StoredAccount, WalletAccountSummary } from "@/types/stores/types";
import { AccountList } from "./account-list";
import { AccountFormDialog } from "./account-form-dialog";

function formatUSD(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPrecise(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AccountsApp() {
  const { listAccounts, setAccount, loading } = useAccountsApi();
  const accounts = useAccountsStore((s) => s.accounts);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<StoredAccount | null>(null);

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
              <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Portfolio
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatPrecise(summary.totalEquity)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Total PnL */}
              <Card
                className={
                  summary.totalPnL >= 0
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      summary.totalPnL >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {summary.totalPnL >= 0 ? (
                      <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-6 w-6 text-red-600 dark:text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Unrealized PnL
                    </p>
                    <p
                      className={`text-2xl font-bold tracking-tight ${
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Connected Accounts
                    </p>
                    <p className="text-2xl font-bold tracking-tight">
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
      </div>

      {/* Account List */}
      <div className="flex-1 overflow-auto p-6">
        <AccountList onEdit={handleEdit} loading={loading} />
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
