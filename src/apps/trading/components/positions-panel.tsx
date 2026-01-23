/**
 * Enhanced Positions Panel Component
 * Displays open positions with P&L and mini sparklines
 */

import { useEffect, useCallback, useMemo } from "react";
import { useTradingStore } from "../store";
import type { Position } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, TrendingUp, TrendingDown, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Mini PnL Sparkline Component
// ============================================
interface MiniPnLSparklineProps {
  value: number;
  percentage: number;
  width?: number;
  height?: number;
}

function MiniPnLSparkline({ value, percentage, width = 40, height = 16 }: MiniPnLSparklineProps) {
  const isPositive = value >= 0;
  const absPercentage = Math.min(Math.abs(percentage), 100);
  
  // Create a simple visual bar representation
  return (
    <div className="flex items-center gap-1">
      <div 
        className="h-1.5 rounded-full overflow-hidden bg-muted/50"
        style={{ width }}
      >
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isPositive 
              ? "bg-gradient-to-r from-trading-buy/50 to-trading-buy" 
              : "bg-gradient-to-r from-trading-sell/50 to-trading-sell"
          )}
          style={{ width: `${Math.max(absPercentage, 5)}%` }}
        />
      </div>
    </div>
  );
}

interface PositionsPanelProps {
  accountId: string;
  symbol?: string;
}

export function PositionsPanel({ accountId, symbol }: PositionsPanelProps) {
  const {
    positions,
    positionsLoading,
    positionsError,
    fetchPositions,
    setSelectedPosition,
  } = useTradingStore();

  // Fetch positions
  const handleFetch = useCallback(() => {
    fetchPositions({ accountId, symbol });
  }, [accountId, symbol, fetchPositions]);

  useEffect(() => {
    if (accountId) {
      handleFetch();
    }
  }, [accountId, handleFetch]);

  // Filter positions by symbol if specified
  const filteredPositions = symbol
    ? positions.filter((p) => p.symbol === symbol)
    : positions;

  // Calculate total unrealized P&L
  const totalPnl = filteredPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

  if (positionsLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positionsError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{positionsError}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleFetch}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Positions
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono">
              {filteredPositions.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3">
            {filteredPositions.length > 0 && (
              <Badge 
                variant="outline"
                className={cn(
                  "h-6 px-2 font-mono text-xs font-semibold border-0 rounded-md",
                  totalPnl >= 0 
                    ? "bg-trading-buy/15 text-trading-buy shadow-[0_0_10px_rgba(34,197,94,0.15)]" 
                    : "bg-trading-sell/15 text-trading-sell shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                )}
              >
                {totalPnl >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={handleFetch}
              disabled={positionsLoading}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", positionsLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredPositions.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
            No open positions
          </div>
        ) : (
          <div className="max-h-[300px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                <TableRow className="h-7 border-b-2">
                  <TableHead className="w-[100px] text-[10px] font-semibold">Symbol</TableHead>
                  <TableHead className="text-[10px] font-semibold">Side</TableHead>
                  <TableHead className="text-right text-[10px] font-semibold">Size</TableHead>
                  <TableHead className="text-right text-[10px] font-semibold">Entry</TableHead>
                  <TableHead className="text-right text-[10px] font-semibold">Mark</TableHead>
                  <TableHead className="text-right text-[10px] font-semibold">P&L</TableHead>
                  <TableHead className="text-right text-[10px] font-semibold">Lev.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((position, index) => (
                  <PositionRow
                    key={`${position.symbol}-${index}`}
                    position={position}
                    onClick={() => setSelectedPosition(position)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PositionRowProps {
  position: Position;
  onClick: () => void;
}

function PositionRow({ position, onClick }: PositionRowProps) {
  const isProfit = position.unrealizedPnl >= 0;

  return (
    <TableRow 
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors h-8",
        "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5",
        position.side === "long" ? "before:bg-trading-buy" : "before:bg-trading-sell"
      )} 
      onClick={onClick}
    >
      <TableCell className="font-mono text-[10px] font-medium">{position.symbol}</TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-semibold",
            position.side === "long"
              ? "bg-trading-buy/15 text-trading-buy"
              : "bg-trading-sell/15 text-trading-sell"
          )}
        >
          {position.side === "long" ? (
            <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
          )}
          {position.side.toUpperCase()}
        </span>
      </TableCell>
      <TableCell className="text-right font-mono text-[10px]">
        {position.amount.toFixed(4)}
      </TableCell>
      <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
        {position.entryPrice.toFixed(2)}
      </TableCell>
      <TableCell className="text-right font-mono text-[10px]">
        {position.markPrice.toFixed(2)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={cn(
              "font-mono text-[10px] font-semibold",
              isProfit ? "text-trading-buy" : "text-trading-sell"
            )}
          >
            {isProfit ? "+" : ""}{position.unrealizedPnl.toFixed(2)}
          </span>
          <div className="flex items-center gap-1">
            <MiniPnLSparkline 
              value={position.unrealizedPnl} 
              percentage={position.percentage} 
              width={30}
            />
            <span className={cn(
              "text-[9px] font-mono",
              isProfit ? "text-trading-buy" : "text-trading-sell"
            )}>
              {position.percentage >= 0 ? "+" : ""}{position.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className="h-5 px-1 text-[9px] font-mono border-muted">
          {position.leverage}x
        </Badge>
      </TableCell>
    </TableRow>
  );
}
