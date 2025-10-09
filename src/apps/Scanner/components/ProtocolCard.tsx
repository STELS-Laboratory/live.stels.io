import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Shield } from "lucide-react";
import { MetricCard } from "./MetricCard.tsx";
import type { Protocol } from "../types.ts";

interface ProtocolCardProps {
  protocol: Protocol;
}

/**
 * Trading protocol configuration display component
 */
export const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Shield className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Trading Protocol</CardTitle>
            <CardDescription>
              Risk management and strategy configuration
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard label="Strategy" value={protocol.strategy} size="sm" />
          <MetricCard
            label="Trading Style"
            value={protocol.tradingStyle}
            size="sm"
          />
          <MetricCard
            label="Max Risk Per Trade"
            value={`${protocol.maxRiskPerTrade}%`}
            color={protocol.maxRiskPerTrade > 5
              ? "text-red-500"
              : protocol.maxRiskPerTrade > 2
              ? "text-orange-500"
              : "text-emerald-600"}
            size="sm"
          />
          <MetricCard
            label="Max Leverage"
            value={`${protocol.maxLeverage}x`}
            color={protocol.maxLeverage >= 10
              ? "text-red-500"
              : protocol.maxLeverage >= 5
              ? "text-orange-500"
              : "text-emerald-600"}
            size="sm"
          />
          <MetricCard
            label="Max Drawdown"
            value={`${protocol.maxDrawdown}%`}
            color={protocol.maxDrawdown > 20
              ? "text-red-500"
              : protocol.maxDrawdown > 10
              ? "text-orange-500"
              : "text-emerald-600"}
            size="sm"
          />
          <MetricCard
            label="Stop Loss"
            value={`${protocol.stopLoss}%`}
            color="text-red-500"
            size="sm"
          />
          <MetricCard
            label="Take Profit"
            value={`${protocol.takeProfit}%`}
            color="text-emerald-600"
            size="sm"
          />
          <MetricCard
            label="Risk/Reward Ratio"
            value={`1:${protocol.riskRewardRatio}`}
            color={protocol.riskRewardRatio >= 3
              ? "text-emerald-600"
              : protocol.riskRewardRatio >= 2
              ? "text-yellow-600"
              : "text-red-500"}
            size="sm"
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Traded Markets
            </p>
            <div className="flex flex-wrap gap-2">
              {protocol.markets.map((market, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {market}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Order Types
            </p>
            <div className="flex flex-wrap gap-2">
              {protocol.orderTypes.map((type, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
