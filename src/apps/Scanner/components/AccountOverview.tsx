/**
 * Account overview component
 * Displays comprehensive account metrics for a Wallet
 */

import type React from "react";
import {
  BarChart3,
  DollarSign,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { MetricCard } from "./MetricCard.tsx";
import {
  formatCurrency,
  formatCurrencyWithColor,
  formatPercentageWithColor,
} from "../utils.ts";
import type { AccountOverviewProps } from "../types.ts";

/**
 * Account overview display component
 */
export const AccountOverview: React.FC<AccountOverviewProps> = ({
  walletData,
}): React.ReactElement => {
  const accountData = walletData.wallet.info.result.list[0];
  const pnlData = formatCurrencyWithColor(accountData.totalPerpUPL);
  const marginData = formatPercentageWithColor(accountData.accountLTV || "0");

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Account Overview</CardTitle>
              <CardDescription className="text-sm">
                {walletData.exchange.toUpperCase()} • {walletData.nid}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={walletData.connection ? "default" : "destructive"}
              className="text-xs font-medium"
            >
              {walletData.connection ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>
        {walletData.note && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{walletData.note}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Equity"
            value={formatCurrency(accountData.totalEquity)}
            size="lg"
            icon={<BarChart3 className="h-3 w-3 text-primary" />}
          />
          <MetricCard
            label="Wallet Balance"
            value={formatCurrency(accountData.totalWalletBalance)}
            size="md"
          />
          <MetricCard
            label="Available Balance"
            value={formatCurrency(accountData.totalAvailableBalance || "0")}
            size="md"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {Number.parseFloat(accountData.totalPerpUPL) >= 0
                ? <TrendingUp className="h-3 w-3 text-emerald-600" />
                : <TrendingDown className="h-3 w-3 text-red-500" />}
              <p className="text-xs text-muted-foreground font-medium">
                Unrealized P&L
              </p>
            </div>
            <p className={`text-base font-semibold font-mono ${pnlData.color}`}>
              {pnlData.value}
            </p>
          </div>
        </div>

        <Separator />

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Wallet Address
            </p>
            <div className="p-2 bg-muted rounded-lg">
              <code className="text-xs break-all font-mono text-muted-foreground">
                {walletData.address}
              </code>
            </div>
          </div>
          <MetricCard
            label="Initial Margin"
            value={formatCurrency(accountData.totalInitialMargin || "0")}
            color="text-blue-600"
            icon={<Shield className="h-3 w-3 text-blue-600" />}
          />
          <MetricCard
            label="Maintenance Margin"
            value={formatCurrency(accountData.totalMaintenanceMargin || "0")}
            color="text-purple-600"
            icon={<Target className="h-3 w-3 text-purple-600" />}
          />
          <MetricCard
            label="Margin Level"
            value={marginData.value}
            color={marginData.color}
          />
        </div>
      </CardContent>
    </Card>
  );
};
