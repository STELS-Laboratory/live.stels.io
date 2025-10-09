import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { MetricCard } from "./MetricCard";
import {
  formatCurrency,
  formatCurrencyWithColor,
  formatNumber,
  formatROIWithColor,
} from "../utils";
import type { RawPosition } from "../types";

interface PositionsCardProps {
  positions: RawPosition[];
}

/**
 * Trading positions display component
 */
export const PositionsCard: React.FC<PositionsCardProps> = ({ positions }) => {
  if (positions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Open Positions</CardTitle>
            <CardDescription>
              {positions.length} active positions • Current performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position: RawPosition, index: number) => {
            const pnlData = formatCurrencyWithColor(position.unrealizedPnl);
            const roiData = formatROIWithColor(
              position.entryPrice,
              position.markPrice,
              position.side,
            );

            return (
              <Card
                key={index}
                className="border-l-4 border-l-primary hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="text-lg font-semibold truncate">
                        {position.symbol}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={position.side.toLowerCase() === "sell"
                            ? "destructive"
                            : "default"}
                          className="text-xs font-medium"
                        >
                          {position.side.toLowerCase() === "sell"
                            ? "SHORT"
                            : "LONG"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs font-medium ${
                            position.leverage >= 10
                              ? "border-red-500 text-red-500"
                              : position.leverage >= 5
                              ? "border-orange-500 text-orange-500"
                              : "border-emerald-500 text-emerald-500"
                          }`}
                        >
                          {position.leverage}x
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {Number.parseFloat(position.unrealizedPnl.toString()) >= 0
                        ? <TrendingUp className="h-4 w-4 text-emerald-600" />
                        : <TrendingDown className="h-4 w-4 text-red-500" />}
                      <span
                        className={`text-lg font-semibold ${pnlData.color}`}
                      >
                        {pnlData.value}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                    <MetricCard
                      label="Size"
                      value={formatNumber(position.contracts, 4)}
                      size="sm"
                    />
                    <MetricCard
                      label="Entry Price"
                      value={formatCurrency(position.entryPrice)}
                      size="sm"
                    />
                    <MetricCard
                      label="Current Price"
                      value={formatCurrency(position.markPrice)}
                      size="sm"
                    />
                    <MetricCard
                      label="Notional Value"
                      value={formatCurrency(position.notional)}
                      size="sm"
                    />
                    <MetricCard
                      label="Liquidation"
                      value={formatCurrency(position.liquidationPrice)}
                      color="text-red-500"
                      size="sm"
                    />
                    <MetricCard
                      label="ROI"
                      value={roiData.value}
                      color={roiData.color}
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
