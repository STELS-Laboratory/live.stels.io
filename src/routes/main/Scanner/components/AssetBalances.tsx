/**
 * Asset balances component
 * Displays detailed portfolio breakdown by coin
 */

import type React from "react";
import { Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatCurrencyWithColor,
  formatNumber,
} from "../utils";
import type { AssetBalancesProps, CoinInfo } from "../types";

/**
 * Asset portfolio display component
 */
export const AssetBalances: React.FC<AssetBalancesProps> = ({
  coins,
}): React.ReactElement => (
  <Card>
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Wallet className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <CardTitle className="text-lg">Asset Portfolio</CardTitle>
          <CardDescription>
            {coins.length} assets • Detailed balance information
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0">
        {coins.map((coin: CoinInfo, index: number) => {
          const isActive = Number.parseFloat(coin.equity) > 0;
          const hasLocked = Number.parseFloat(coin.locked) > 0;
          const unrealizedPnl = formatCurrencyWithColor(coin.unrealisedPnl);
          const realizedPnl = formatCurrencyWithColor(coin.cumRealisedPnl);

          return (
            <Card
              key={index}
              className={`border-0 border-b border-r last:border-r-0 rounded-none hover:bg-muted/30 transition-colors ${
                isActive ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? "bg-emerald-500 text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {coin.coin.slice(0, 2)}
                    </div>
                    <h3 className="text-base font-semibold">{coin.coin}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasLocked && (
                      <Badge variant="outline" className="text-xs">
                        Locked
                      </Badge>
                    )}
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Balance
                    </span>
                    <span className="font-mono text-sm">
                      {formatNumber(coin.walletBalance)} {coin.coin}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Equity
                    </span>
                    <span className="font-mono text-sm">
                      {formatNumber(coin.equity)} {coin.coin}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      USD Value
                    </span>
                    <span className="font-mono text-sm font-semibold text-emerald-600">
                      {formatCurrency(coin.usdValue)}
                    </span>
                  </div>

                  {Number.parseFloat(coin.unrealisedPnl) !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Unrealized P&L
                      </span>
                      <span
                        className={`font-mono text-sm ${unrealizedPnl.color}`}
                      >
                        {unrealizedPnl.value}
                      </span>
                    </div>
                  )}

                  {Number.parseFloat(coin.borrowAmount) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Borrowed
                      </span>
                      <span className="font-mono text-sm font-semibold text-orange-600">
                        {formatNumber(coin.borrowAmount)} {coin.coin}
                      </span>
                    </div>
                  )}

                  {Number.parseFloat(coin.cumRealisedPnl) !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Realized P&L
                      </span>
                      <span
                        className={`font-mono text-sm ${realizedPnl.color}`}
                      >
                        {realizedPnl.value}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </CardContent>
  </Card>
);
