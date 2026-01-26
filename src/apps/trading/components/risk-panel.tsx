/**
 * Risk Management Panel Component (v2.15.0)
 * Displays leverage tiers, funding rates, liquidation history, and option Greeks
 */

import { useState, useEffect, useCallback } from "react";
import { useTradingStore } from "../store";
// Types imported from ../types as needed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Percent,
  Timer,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface RiskPanelProps {
  accountId: string;
  symbol: string;
  /** Enable options features (Greeks) */
  enableOptions?: boolean;
}

// ============================================
// Funding Rate Countdown
// ============================================

function FundingCountdown({ nextFundingTimestamp }: { nextFundingTimestamp?: number }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!nextFundingTimestamp) return;

    const updateCountdown = () => {
      const now = Date.now();
      const diff = nextFundingTimestamp - now;

      if (diff <= 0) {
        setTimeLeft("Now");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextFundingTimestamp]);

  return (
    <span className="font-mono text-xs">{timeLeft || "--:--:--"}</span>
  );
}

// ============================================
// Main Component
// ============================================

export function RiskPanel({ accountId, symbol, enableOptions = false }: RiskPanelProps) {
  const {
    leverageTiers,
    leverageTiersLoading,
    leverageTiersError,
    fetchLeverageTiers,
    fundingRate,
    fundingRateLoading,
    fundingRateError,
    fetchFundingRate,
    liquidations,
    liquidationsLoading,
    liquidationsError,
    fetchMyLiquidations,
    greeks,
    greeksLoading,
    greeksError,
    fetchGreeks,
  } = useTradingStore();

  const [activeTab, setActiveTab] = useState("funding");

  // Fetch data
  const handleFetchFunding = useCallback(() => {
    fetchFundingRate({ accountId, symbol });
  }, [accountId, symbol, fetchFundingRate]);

  const handleFetchTiers = useCallback(() => {
    fetchLeverageTiers({ accountId, symbol });
  }, [accountId, symbol, fetchLeverageTiers]);

  const handleFetchLiquidations = useCallback(() => {
    fetchMyLiquidations({ accountId, symbol });
  }, [accountId, symbol, fetchMyLiquidations]);

  const handleFetchGreeks = useCallback(() => {
    if (enableOptions) {
      fetchGreeks({ accountId, symbol });
    }
  }, [accountId, symbol, enableOptions, fetchGreeks]);

  // Fetch on mount
  useEffect(() => {
    if (accountId && symbol) {
      handleFetchFunding();
      handleFetchTiers();
    }
  }, [accountId, symbol, handleFetchFunding, handleFetchTiers]);

  // Fetch tab-specific data
  useEffect(() => {
    if (activeTab === "liquidations") {
      handleFetchLiquidations();
    } else if (activeTab === "greeks" && enableOptions) {
      handleFetchGreeks();
    }
  }, [activeTab, handleFetchLiquidations, handleFetchGreeks, enableOptions]);

  // Get tiers for current symbol
  const symbolTiers = leverageTiers[symbol] || [];

  // Format funding rate
  const formatFundingRate = (rate: number) => {
    const percentage = rate * 100;
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(4)}%`;
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risk Management
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-8 rounded-none border-b bg-transparent">
            <TabsTrigger value="funding" className="text-[10px] h-7 flex-1">
              <Percent className="h-3 w-3 mr-1" />
              Funding
            </TabsTrigger>
            <TabsTrigger value="leverage" className="text-[10px] h-7 flex-1">
              <Gauge className="h-3 w-3 mr-1" />
              Leverage
            </TabsTrigger>
            <TabsTrigger value="liquidations" className="text-[10px] h-7 flex-1">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Liquidations
            </TabsTrigger>
            {enableOptions && (
              <TabsTrigger value="greeks" className="text-[10px] h-7 flex-1">
                <Activity className="h-3 w-3 mr-1" />
                Greeks
              </TabsTrigger>
            )}
          </TabsList>

          {/* Funding Rate Tab */}
          <TabsContent value="funding" className="p-3 space-y-3">
            {fundingRateLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : fundingRateError ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                <p className="text-destructive text-xs">{fundingRateError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleFetchFunding}>
                  Retry
                </Button>
              </div>
            ) : fundingRate ? (
              <>
                {/* Current Funding Rate Card */}
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Current Rate</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-xs",
                        fundingRate.fundingRate >= 0
                          ? "text-trading-buy border-trading-buy/30"
                          : "text-trading-sell border-trading-sell/30"
                      )}
                    >
                      {fundingRate.fundingRate >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {formatFundingRate(fundingRate.fundingRate)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      Next Funding
                    </span>
                    <FundingCountdown nextFundingTimestamp={fundingRate.nextFundingTimestamp} />
                  </div>

                  {fundingRate.nextFundingRate !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Predicted Rate</span>
                      <span className={cn(
                        "font-mono text-xs",
                        fundingRate.nextFundingRate >= 0 ? "text-trading-buy" : "text-trading-sell"
                      )}>
                        {formatFundingRate(fundingRate.nextFundingRate)}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Mark Price</p>
                      <p className="font-mono text-xs font-medium">
                        ${fundingRate.markPrice?.toFixed(2) || "N/A"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Index Price</p>
                      <p className="font-mono text-xs font-medium">
                        ${fundingRate.indexPrice?.toFixed(2) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-[10px]"
                  onClick={handleFetchFunding}
                  disabled={fundingRateLoading}
                >
                  <RefreshCw className={cn("h-3 w-3 mr-1", fundingRateLoading && "animate-spin")} />
                  Refresh
                </Button>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No funding rate data available
              </div>
            )}
          </TabsContent>

          {/* Leverage Tiers Tab */}
          <TabsContent value="leverage" className="p-0">
            {leverageTiersLoading ? (
              <div className="p-3">
                <Skeleton className="h-32 w-full" />
              </div>
            ) : leverageTiersError ? (
              <div className="text-center text-sm text-muted-foreground p-4">
                <p className="text-destructive text-xs">{leverageTiersError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleFetchTiers}>
                  Retry
                </Button>
              </div>
            ) : symbolTiers.length > 0 ? (
              <div className="max-h-[200px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                    <TableRow className="h-7">
                      <TableHead className="text-[10px] font-semibold">Tier</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold">Max Notional</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold">Max Lev.</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold">MMR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {symbolTiers.map((tier, index) => (
                      <TableRow key={index} className="h-7">
                        <TableCell className="font-mono text-[10px]">{tier.tier}</TableCell>
                        <TableCell className="text-right font-mono text-[10px]">
                          ${tier.maxNotional.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-mono">
                            {tier.maxLeverage}x
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                          {(tier.maintenanceMarginRate * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4">
                No leverage tier data available
              </div>
            )}
          </TabsContent>

          {/* Liquidations Tab */}
          <TabsContent value="liquidations" className="p-0">
            {liquidationsLoading ? (
              <div className="p-3">
                <Skeleton className="h-32 w-full" />
              </div>
            ) : liquidationsError ? (
              <div className="text-center text-sm text-muted-foreground p-4">
                <p className="text-destructive text-xs">{liquidationsError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleFetchLiquidations}>
                  Retry
                </Button>
              </div>
            ) : liquidations.length > 0 ? (
              <div className="max-h-[200px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm">
                    <TableRow className="h-7">
                      <TableHead className="text-[10px] font-semibold">Symbol</TableHead>
                      <TableHead className="text-[10px] font-semibold">Side</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold">Price</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold">Size</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liquidations.map((liq, index) => (
                      <TableRow key={liq.id || index} className="h-7">
                        <TableCell className="font-mono text-[10px]">{liq.symbol}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-4 px-1 text-[9px]",
                              liq.side === "long"
                                ? "text-trading-buy border-trading-buy/30"
                                : "text-trading-sell border-trading-sell/30"
                            )}
                          >
                            {liq.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[10px]">
                          ${liq.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-[10px]">
                          {liq.contracts?.toFixed(4) || "N/A"}
                        </TableCell>
                        <TableCell className="text-right text-[10px] text-muted-foreground">
                          {new Date(liq.timestamp).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-30" />
                No liquidation history
              </div>
            )}
          </TabsContent>

          {/* Greeks Tab (Options) */}
          {enableOptions && (
            <TabsContent value="greeks" className="p-3">
              {greeksLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : greeksError ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  <p className="text-destructive text-xs">{greeksError}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleFetchGreeks}>
                    Retry
                  </Button>
                </div>
              ) : greeks && !Array.isArray(greeks) ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 rounded border bg-muted/30 text-center cursor-help">
                          <p className="text-[10px] text-muted-foreground">Delta (Δ)</p>
                          <p className={cn(
                            "font-mono text-sm font-semibold",
                            greeks.delta >= 0 ? "text-trading-buy" : "text-trading-sell"
                          )}>
                            {greeks.delta.toFixed(4)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Rate of change of option price with underlying</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 rounded border bg-muted/30 text-center cursor-help">
                          <p className="text-[10px] text-muted-foreground">Gamma (Γ)</p>
                          <p className="font-mono text-sm font-semibold">
                            {greeks.gamma.toFixed(6)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Rate of change of delta</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 rounded border bg-muted/30 text-center cursor-help">
                          <p className="text-[10px] text-muted-foreground">Theta (Θ)</p>
                          <p className={cn(
                            "font-mono text-sm font-semibold",
                            greeks.theta >= 0 ? "text-trading-buy" : "text-trading-sell"
                          )}>
                            {greeks.theta.toFixed(4)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Time decay per day</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 rounded border bg-muted/30 text-center cursor-help">
                          <p className="text-[10px] text-muted-foreground">Vega (ν)</p>
                          <p className="font-mono text-sm font-semibold">
                            {greeks.vega.toFixed(4)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Sensitivity to volatility changes</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {greeks.markIv !== undefined && (
                    <div className="p-2 rounded border bg-muted/30 text-center">
                      <p className="text-[10px] text-muted-foreground">Implied Volatility</p>
                      <p className="font-mono text-sm font-semibold">
                        {(greeks.markIv * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-[10px]"
                    onClick={handleFetchGreeks}
                    disabled={greeksLoading}
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1", greeksLoading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  <Activity className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  No Greeks data available
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
