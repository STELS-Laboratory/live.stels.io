/**
 * P&L Analytics Panel Component
 * Displays profit/loss statistics and analytics
 */

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "../store";
import type { Trade, Position, PnLStats } from "../types";

interface PnLPanelProps {
  trades?: Trade[];
  positions?: Position[];
  showChart?: boolean;
}

// Calculate P&L statistics from trades
function calculatePnLStats(trades: Trade[], positions: Position[]): PnLStats {
  if (trades.length === 0 && positions.length === 0) {
    return {
      totalPnl: 0,
      unrealizedPnl: 0,
      realizedPnl: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      tradesCount: 0,
      winCount: 0,
      lossCount: 0,
    };
  }

  // Calculate unrealized P&L from positions
  const unrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);

  // Calculate realized P&L from trades
  // Note: This is a simplified calculation - real P&L calculation would need entry/exit matching
  let realizedPnl = 0;
  let winCount = 0;
  let lossCount = 0;
  let totalWin = 0;
  let totalLoss = 0;

  // Group trades by orderId to calculate P&L
  const tradeGroups = new Map<string, Trade[]>();
  for (const trade of trades) {
    const group = tradeGroups.get(trade.orderId) || [];
    group.push(trade);
    tradeGroups.set(trade.orderId, group);
  }

  // Simple P&L estimation based on trade side
  // Buy trades are negative (cost), Sell trades are positive (revenue)
  for (const trade of trades) {
    const pnl = trade.side === "sell" ? trade.cost : -trade.cost;
    realizedPnl += pnl;

    if (pnl > 0) {
      winCount++;
      totalWin += pnl;
    } else if (pnl < 0) {
      lossCount++;
      totalLoss += Math.abs(pnl);
    }
  }

  const tradesCount = winCount + lossCount;
  const winRate = tradesCount > 0 ? (winCount / tradesCount) * 100 : 0;
  const avgWin = winCount > 0 ? totalWin / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;

  return {
    totalPnl: unrealizedPnl + realizedPnl,
    unrealizedPnl,
    realizedPnl,
    winRate,
    avgWin,
    avgLoss,
    tradesCount,
    winCount,
    lossCount,
  };
}

export function PnLPanel({ showChart = true }: PnLPanelProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { trades, positions, tradesLoading, positionsLoading } = useTradingStore();

  // Calculate stats
  const stats = useMemo(() => {
    return calculatePnLStats(trades, positions);
  }, [trades, positions]);

  // Chart data: P&L over time (simplified - shows cumulative P&L)
  const chartData = useMemo(() => {
    if (trades.length === 0) return { dates: [], values: [] };

    const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);
    const dates: string[] = [];
    const values: number[] = [];
    let cumulative = 0;

    for (const trade of sortedTrades) {
      const date = new Date(trade.timestamp);
      dates.push(
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      );
      const pnl = trade.side === "sell" ? trade.cost : -trade.cost;
      cumulative += pnl;
      values.push(cumulative);
    }

    return { dates, values };
  }, [trades]);

  // Chart colors
  const colors = useMemo(
    () => ({
      line: stats.totalPnl >= 0 ? "#22c55e" : "#ef4444",
      area: stats.totalPnl >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
      text: isDark ? "#a1a1aa" : "#71717a",
      grid: isDark ? "#27272a" : "#e4e4e7",
    }),
    [isDark, stats.totalPnl]
  );

  // Chart options
  const chartOptions = useMemo(() => {
    if (chartData.dates.length === 0) return {};

    return {
      backgroundColor: "transparent",
      animation: false,
      tooltip: {
        trigger: "axis",
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        borderColor: colors.grid,
        textStyle: { color: colors.text },
        formatter: (params: { value: number; axisValue: string }[]) => {
          const value = params[0]?.value || 0;
          const isPositive = value >= 0;
          return `
            <div style="font-size: 12px;">
              <div style="color: ${colors.text}">${params[0]?.axisValue}</div>
              <div style="color: ${isPositive ? "#22c55e" : "#ef4444"}; font-weight: 600;">
                ${isPositive ? "+" : ""}$${value.toFixed(2)}
              </div>
            </div>
          `;
        },
      },
      grid: {
        left: 50,
        right: 20,
        top: 20,
        bottom: 30,
      },
      xAxis: {
        type: "category",
        data: chartData.dates,
        axisLine: { lineStyle: { color: colors.grid } },
        axisLabel: { color: colors.text, fontSize: 10 },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: colors.grid } },
        axisLabel: {
          color: colors.text,
          fontSize: 10,
          formatter: (value: number) => `$${value.toFixed(0)}`,
        },
        splitLine: { lineStyle: { color: colors.grid, type: "dashed" } },
      },
      series: [
        {
          type: "line",
          data: chartData.values,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: colors.line, width: 2 },
          areaStyle: { color: colors.area },
        },
      ],
    };
  }, [chartData, colors, isDark]);

  const isLoading = tradesLoading || positionsLoading;

  if (isLoading && trades.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            P&L Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = stats.totalPnl >= 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            P&L Analytics
          </CardTitle>
          <Badge
            variant={isPositive ? "default" : "destructive"}
            className={cn(
              "text-xs",
              isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? "+" : ""}${stats.totalPnl.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Unrealized P&L */}
          <StatCard
            icon={<Target className="h-3.5 w-3.5" />}
            label="Unrealized"
            value={stats.unrealizedPnl}
            isPrice
          />

          {/* Realized P&L */}
          <StatCard
            icon={<DollarSign className="h-3.5 w-3.5" />}
            label="Realized"
            value={stats.realizedPnl}
            isPrice
          />

          {/* Win Rate */}
          <StatCard
            icon={<Percent className="h-3.5 w-3.5" />}
            label="Win Rate"
            value={stats.winRate}
            suffix="%"
            isPositive={stats.winRate >= 50}
          />

          {/* Total Trades */}
          <StatCard
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            label="Trades"
            value={stats.tradesCount}
            subtext={`${stats.winCount}W / ${stats.lossCount}L`}
          />
        </div>

        {/* Avg Win/Loss */}
        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Avg Win:</span>
            <span className="text-green-500 font-mono">+${stats.avgWin.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Avg Loss:</span>
            <span className="text-red-500 font-mono">-${stats.avgLoss.toFixed(2)}</span>
          </div>
        </div>

        {/* P&L Chart */}
        {showChart && chartData.dates.length > 0 && (
          <div className="h-32">
            <ReactECharts
              option={chartOptions}
              style={{ height: "100%", width: "100%" }}
              notMerge={true}
              lazyUpdate={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  subtext?: string;
  isPrice?: boolean;
  isPositive?: boolean;
}

function StatCard({ icon, label, value, suffix = "", subtext, isPrice, isPositive }: StatCardProps) {
  const positive = isPositive !== undefined ? isPositive : value >= 0;

  return (
    <div className="p-2 rounded-lg bg-muted/30">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div
        className={cn(
          "font-mono font-medium text-sm",
          isPrice && (positive ? "text-green-500" : "text-red-500")
        )}
      >
        {isPrice && (positive ? "+" : "")}
        {isPrice && "$"}
        {value.toFixed(isPrice ? 2 : 0)}
        {suffix}
      </div>
      {subtext && <div className="text-[10px] text-muted-foreground mt-0.5">{subtext}</div>}
    </div>
  );
}
