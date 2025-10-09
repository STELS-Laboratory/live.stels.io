import React from "react";
import { TableCell, TableRow } from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { MiniCandlestickChart } from "./MiniCandlestickChart.tsx";
import { PercentageDisplay } from "./PercentageDisplay.tsx";
import { formatPrice, formatVolume, getCurrencyIcon } from "../utils.ts";
import type { FormattedTicker } from "../types.ts";

interface MarketRowProps {
  ticker: FormattedTicker;
  isLast: boolean;
}

/**
 * Market row component for displaying ticker data
 */
export function MarketRow({
  ticker,
  isLast,
}: MarketRowProps): React.ReactElement {
  return (
    <TableRow
      className={`hover:bg-muted/10 transition-colors ${isLast ? "" : ""}`}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          {getCurrencyIcon(ticker.symbol)
            ? (
              <img
                src={getCurrencyIcon(ticker.symbol)!}
                alt={ticker.symbol}
                className="w-8 h-8 rounded-full"
              />
            )
            : (
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {ticker.symbol.slice(0, 2)}
              </div>
            )}
          <div>
            <div className="font-semibold">{ticker.symbol}</div>
            <div className="text-sm text-muted-foreground">
              {ticker.market}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center">
          <MiniCandlestickChart
            candles={ticker.candles}
            width={100}
            height={30}
          />
        </div>
      </TableCell>
      <TableCell className="text-right text-card-foreground font-mono">
        <div>{formatPrice(ticker.price, ticker.symbol)}</div>
      </TableCell>
      <TableCell className="text-right">
        <div className="space-y-1 flex flex-col text-right">
          <div className="flex w-auto ml-auto">
            <PercentageDisplay percentage={ticker.percentage} />
          </div>
          <div
            className={`text-sm font-mono ${
              ticker.change >= 0 ? "text-green-600/80" : "text-red-600/80"
            }`}
          >
            {ticker.change >= 0 ? "+" : ""}
            {ticker.change.toFixed(4)}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="space-y-1">
          <div className="font-mono text-sm text-amber-700">
            {formatVolume(ticker.volume)}
          </div>
          <div className="text-xs text-muted-foreground">
            ${formatVolume(ticker.quoteVolume)}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">
        {ticker.bid > 0 && ticker.ask > 0
          ? (
            <div className="space-y-1">
              <div className="text-green-600/70">
                {formatPrice(ticker.bid, ticker.symbol)}
              </div>
              <div className="text-red-600/70">
                {formatPrice(ticker.ask, ticker.symbol)}
              </div>
            </div>
          )
          : <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell className="text-right">
        <Badge
          variant={ticker.latency < 1000
            ? "default"
            : ticker.latency < 3000
            ? "secondary"
            : "destructive"}
          className={`text-xs w-[16px] h-[16px] rounded-full ${
            ticker.latency < 1000
              ? "bg-green-600/80"
              : ticker.latency < 2000
              ? "bg-green-600/30"
              : "bg-amber-600/40"
          }`}
        >
        </Badge>
      </TableCell>
    </TableRow>
  );
}
