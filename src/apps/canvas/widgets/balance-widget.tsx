/**
 * Balance Widget - Account balance visualization
 * Uses normalizedWallet (Bybit-like format) from backend
 */
import React, { memo, useMemo } from "react";
import {
  formatNumber,
  formatRelativeTime,
  type AccountBalanceRaw,
} from "@/lib/airnet-types";
import type { NormalizedWallet, NormalizedCoin } from "@/lib/account-normalizer";
import { getExchangeIconPath } from "@/apps/accounts/types";
import {
  Wallet,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
} from "lucide-react";

interface BalanceWidgetProps {
  data: {
    raw: AccountBalanceRaw & {
      normalizedWallet?: NormalizedWallet;
    };
    timestamp: number;
  };
  /** Container width for responsive layout */
  containerWidth?: number;
  /** Container height for responsive layout */
  containerHeight?: number;
}

/**
 * Major coins that should be displayed first
 */
const MAJOR_COINS = ["BTC", "ETH", "SOL", "USDT", "USDC", "USD"];

/**
 * Minimum USD value to display a coin (filter dust)
 */
const MIN_USD_VALUE = 0.01;

/**
 * Get coin icon path
 */
function getCoinIcon(coin: string): string {
  return `/assets/icons/coins/${coin}.png`;
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Parse numeric value from string or number
 */
function parseNum(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Coin balance row component
 */
const CoinRow = memo(
  ({
    coin,
    balance,
    usdValue,
    pnl,
  }: {
    coin: string;
    balance: number;
    usdValue?: number;
    pnl?: number;
  }): React.ReactElement | null => {
    // Skip tiny balances
    if (balance === 0 || (usdValue !== undefined && Math.abs(usdValue) < MIN_USD_VALUE)) {
      return null;
    }

    const hasPnl = pnl !== undefined && pnl !== 0;
    const pnlColor = hasPnl ? (pnl > 0 ? "text-emerald-500" : "text-red-500") : "";

    return (
      <div className="flex items-center justify-between py-1.5 px-2 hover:bg-muted/30 rounded text-xs">
        <div className="flex items-center gap-2">
          <img
            src={getCoinIcon(coin)}
            alt={coin}
            className="w-4 h-4 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          <span className="font-medium">{coin}</span>
        </div>
        <div className="text-right">
          <div className="font-mono">
            {Math.abs(balance) < 0.0001
              ? balance.toExponential(2)
              : formatNumber(balance, Math.abs(balance) < 1 ? 6 : 4)}
          </div>
          <div className="flex items-center justify-end gap-1.5">
            {usdValue !== undefined && Math.abs(usdValue) > 0.01 && (
              <span className="text-[10px] text-muted-foreground">
                {formatCurrency(usdValue)}
              </span>
            )}
            {hasPnl && (
              <span className={`text-[10px] ${pnlColor}`}>
                {pnl > 0 ? "+" : ""}{formatNumber(pnl, 2)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CoinRow.displayName = "CoinRow";

const BalanceWidget = memo(
  ({ data, containerWidth, containerHeight }: BalanceWidgetProps): React.ReactElement => {
    const { raw, timestamp } = data;

    // Use normalizedWallet if available, fallback to wallet
    const wallet = raw.normalizedWallet ?? raw.wallet;
    
    // Get account summary from unified format: info.result.list[0]
    const summary = useMemo(() => {
      const list0 = wallet?.info?.result?.list?.[0];
      
      return {
        totalEquity: parseNum(list0?.totalEquity),
        totalPnL: parseNum(list0?.totalPerpUPL),
        accountType: list0?.accountType,
        coins: (list0?.coin || []) as NormalizedCoin[],
      };
    }, [wallet]);

    // Build coin balances from normalized coin array
    const coinBalances = useMemo(() => {
      const balances: Array<{
        coin: string;
        balance: number;
        usdValue?: number;
        pnl?: number;
      }> = [];

      // Use normalized coins directly
      summary.coins.forEach((c) => {
        const balance = parseNum(c.walletBalance || c.equity);
        const usdValue = parseNum(c.usdValue);
        
        if (balance === 0 && usdValue < MIN_USD_VALUE) return;

        balances.push({
          coin: c.coin,
          balance,
          usdValue,
          pnl: parseNum(c.cumRealisedPnl),
        });
      });

      // Sort: major coins first, then by USD value
      balances.sort((a, b) => {
        const aIsMajor = MAJOR_COINS.includes(a.coin);
        const bIsMajor = MAJOR_COINS.includes(b.coin);

        if (aIsMajor && !bIsMajor) return -1;
        if (!aIsMajor && bIsMajor) return 1;

        // Then by USD value (highest first)
        const aUsd = Math.abs(a.usdValue ?? 0);
        const bUsd = Math.abs(b.usdValue ?? 0);
        return bUsd - aUsd;
      });

      return balances;
    }, [summary.coins]);

    // Count significant balances (> $1)
    const significantCount = useMemo(() => {
      return coinBalances.filter((b) => Math.abs(b.usdValue ?? 0) >= 1).length;
    }, [coinBalances]);

    // Destructure summary values for easy access
    const { totalEquity, totalPnL, accountType } = summary;

    const hasPnL = totalPnL !== 0;
    const pnlColor = totalPnL > 0 ? "text-emerald-500" : totalPnL < 0 ? "text-red-500" : "";
    const PnlIcon = totalPnL >= 0 ? ArrowUpRight : ArrowDownRight;

    // Calculate content height for coin list
    const coinListHeight = containerHeight 
      ? containerHeight - 140 // header(40) + equity(72) + footer(28)
      : 180;

    return (
      <div 
        className="bg-card flex flex-col h-full"
        style={{ 
          width: containerWidth ?? "auto",
          minWidth: 280,
          maxWidth: containerWidth ?? 400,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <img
                src={getExchangeIconPath(raw.exchange)}
                alt={raw.exchange}
                className="w-6 h-6 rounded object-contain ring-1 ring-border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              {/* Connection indicator */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                  raw.connection ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold uppercase truncate">
                {raw.exchange}
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                <span className="truncate">{raw.address}</span>
                {accountType && (
                  <span className="px-1 py-0.5 bg-muted rounded text-[9px] shrink-0">
                    {accountType}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {raw.connection ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Total Equity & PnL */}
        <div className="p-3 border-b border-border/50 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Equity</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {significantCount} assets
            </span>
          </div>
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalEquity)}
            </div>
            {hasPnL && (
              <div className={`flex items-center gap-0.5 ${pnlColor}`}>
                <PnlIcon className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {totalPnL > 0 ? "+" : ""}{formatCurrency(totalPnL)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Coin Balances - flexible height */}
        <div 
          className="overflow-y-auto flex-1"
          style={{ maxHeight: coinListHeight > 0 ? coinListHeight : 180 }}
        >
          {coinBalances.length > 0 ? (
            coinBalances.map((item) => (
              <CoinRow
                key={item.coin}
                coin={item.coin}
                balance={item.balance}
                usdValue={item.usdValue}
                pnl={item.pnl}
              />
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground text-xs">
              No balances
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 p-2 border-t border-border/50 shrink-0">
          <span className="flex items-center gap-1 truncate">
            <Coins className="h-3 w-3 shrink-0" />
            <span className="truncate">{raw.nid}</span>
          </span>
          <span className="shrink-0">
            Synced {formatRelativeTime(raw.lastBalanceSync || timestamp)}
          </span>
        </div>
      </div>
    );
  }
);

BalanceWidget.displayName = "BalanceWidget";

export default BalanceWidget;
