/**
 * Market Data Panel Component
 * Displays ticker and order book data
 */

import { useEffect, useCallback } from "react";
import { useTradingStore } from "../store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, RefreshCw, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketDataPanelProps {
  nid: string;
  symbol: string;
}

export function MarketDataPanel({ nid, symbol }: MarketDataPanelProps) {
  const {
    ticker,
    orderBook,
    tickerLoading,
    orderBookLoading,
    tickerError,
    orderBookError,
    getTicker,
    getOrderBook,
  } = useTradingStore();

  // Fetch market data
  const fetchMarketData = useCallback(() => {
    if (!nid || !symbol) return;
    getTicker({ nid, symbol });
    getOrderBook({ nid, symbol, limit: 10 });
  }, [nid, symbol, getTicker, getOrderBook]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const isLoading = tickerLoading || orderBookLoading;

  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {symbol} Market
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMarketData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ticker */}
        {tickerLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : tickerError ? (
          <p className="text-sm text-destructive">{tickerError}</p>
        ) : ticker ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold font-mono">
                ${ticker.last?.toLocaleString() ?? "—"}
              </span>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm",
                  ticker.change >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {ticker.change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {ticker.changePercent?.toFixed(2)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span>24h High:</span>
                <span className="ml-1 font-mono">${ticker.high?.toLocaleString()}</span>
              </div>
              <div>
                <span>24h Low:</span>
                <span className="ml-1 font-mono">${ticker.low?.toLocaleString()}</span>
              </div>
              <div>
                <span>Volume:</span>
                <span className="ml-1 font-mono">{ticker.volume?.toLocaleString()}</span>
              </div>
              <div>
                <span>Bid/Ask:</span>
                <span className="ml-1 font-mono">
                  {ticker.bid?.toFixed(2)}/{ticker.ask?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No ticker data</p>
        )}

        {/* Order Book */}
        {orderBookLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : orderBookError ? (
          <p className="text-sm text-destructive">{orderBookError}</p>
        ) : orderBook ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Order Book</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Asks (sells) */}
              <div className="space-y-1">
                <div className="text-red-500 font-medium">Asks</div>
                {orderBook.asks?.slice(0, 5).reverse().map(([price, amount], i) => (
                  <div key={i} className="flex justify-between font-mono text-red-400/80">
                    <span>{price.toFixed(2)}</span>
                    <span>{amount.toFixed(4)}</span>
                  </div>
                ))}
              </div>
              {/* Bids (buys) */}
              <div className="space-y-1">
                <div className="text-green-500 font-medium">Bids</div>
                {orderBook.bids?.slice(0, 5).map(([price, amount], i) => (
                  <div key={i} className="flex justify-between font-mono text-green-400/80">
                    <span>{price.toFixed(2)}</span>
                    <span>{amount.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No order book data</p>
        )}
      </CardContent>
    </Card>
  );
}
