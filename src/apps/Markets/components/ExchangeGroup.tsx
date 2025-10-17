import React from "react";
import { TableCell, TableRow } from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { MarketRow } from "./MarketRow.tsx";
import { getExchangeColor, getExchangeIcon } from "../utils.ts";
import type { ExchangeGroupData } from "../types.ts";

interface ExchangeGroupProps {
  group: ExchangeGroupData;
}

/**
 * Exchange group component displaying all markets for an exchange
 */
export function ExchangeGroup({
  group,
}: ExchangeGroupProps): React.ReactElement {
  return (
    <>
      {/* Exchange Header Row */}
      <TableRow>
        <TableCell colSpan={7} className="py-4 px-6 bg-muted/50">
          <div className="flex items-center gap-3">
            {getExchangeIcon(group.exchange)
              ? (
                <img
                  src={getExchangeIcon(group.exchange)!}
                  alt={group.exchange}
                  className="w-12 h-12 p-1 rounded-full"
                />
              )
              : (
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${getExchangeColor()} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md`}
                >
                  {group.exchange.charAt(0).toUpperCase()}
                </div>
              )}
            <div>
              <div className="font-semibold text-lg capitalize">
                {group.exchange}
              </div>
              <div className="text-sm text-muted-foreground">
                {group.totalMarkets} markets •{" "}
                {Math.round(group.avgLatency)}ms avg latency
              </div>
            </div>
            <Badge
              variant="secondary"
              className="ml-auto bg-amber-400/20 text-amber-600 border-amber-400/30"
            >
              {group.totalMarkets} Active
            </Badge>
          </div>
        </TableCell>
      </TableRow>

      {/* Market Rows */}
      {group.markets.map((ticker, tickerIndex) => (
        <MarketRow
          key={`${ticker.exchange}-${ticker.market}`}
          ticker={ticker}
          isLast={tickerIndex === group.markets.length - 1}
        />
      ))}
    </>
  );
}
