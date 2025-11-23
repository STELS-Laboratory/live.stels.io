/**
 * Index Detail Component
 * Displays detailed information about a selected index
 */

import * as React from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  Info,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import type { IndexData, IndexCode, Timeframe } from "../types";
import { IndexChart } from "./index-chart";
import { useIndexStore } from "../store";

interface IndexDetailProps {
  indexCode: IndexCode;
  data: IndexData | null;
  onClose: () => void;
}

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h"];

/**
 * Index Detail Component
 */
export function IndexDetail({
  indexCode,
  data,
  onClose,
}: IndexDetailProps): React.ReactElement {
  const { selectedTimeframe, setSelectedTimeframe, getCandleData } =
    useIndexStore();

  const candleData = useMemo(() => {
    return getCandleData(indexCode, selectedTimeframe);
  }, [indexCode, selectedTimeframe, getCandleData]);

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Index Details</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="icon-sm" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {data.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {data.info}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 shrink-0"
            >
              <X className="icon-sm" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {data.index === "BDI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Bitcoin Dominance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Level
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { level: string }).level}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          BTC Market Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          $
                          {(
                            (data as { btcMarketValue: number })
                              .btcMarketValue / 1_000_000_000
                          ).toFixed(2)}
                          B
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Market Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          $
                          {(
                            (data as { totalMarketValue: number })
                              .totalMarketValue / 1_000_000_000
                          ).toFixed(2)}
                          B
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Altcoin Dominance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { altcoinDominance: number })
                            .altcoinDominance.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Assets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { assetCount: number }).assetCount}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "FGI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Sentiment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { sentiment: string }).sentiment.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Condition
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { condition: string }).condition}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Volatility
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(
                            (data as {
                              components: { volatility: number };
                            }).components.volatility
                          ).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Momentum
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(
                            (data as {
                              components: { momentum: number };
                            }).components.momentum
                          ).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Volume
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(
                            (data as {
                              components: { volume: number };
                            }).components.volume
                          ).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "CI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Overall Correlation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { overallCorrelation: number })
                            .overallCorrelation.toFixed(3)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Level
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { level: string }).level}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Avg BTC Correlation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { avgBTCorrelation: number })
                            .avgBTCorrelation.toFixed(3)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Assets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { assetCount: number }).assetCount}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "AOI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Avg Profit %
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { avgProfitPercent: number })
                            .avgProfitPercent.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { totalOpportunities: number })
                            .totalOpportunities}
                        </div>
                        {(data as { highOpportunities: number })
                          .highOpportunities > 0 && (
                          <div className="text-xs text-amber-500 mt-1">
                            {(data as { highOpportunities: number })
                              .highOpportunities} high
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Assets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { assetCount: number }).assetCount}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Exchanges
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { exchangeCount: number }).exchangeCount}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "ELI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Market Volume
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${(
                            (data as { totalMarketVolume: number })
                              .totalMarketVolume / 1_000_000_000
                          ).toFixed(2)}
                          B
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Most Liquid Exchange
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold capitalize">
                          {(data as { mostLiquidExchange: string })
                            .mostLiquidExchange}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          HHI Index
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { hhi: number }).hhi.toFixed(2)}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 capitalize"
                        >
                          {(data as { concentration: string }).concentration}{" "}
                          concentration
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Exchanges
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { exchangeCount: number }).exchangeCount}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "CEPI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Composite Index
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { compositeIndex: number })
                            .compositeIndex.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Volume
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          $
                          {(
                            (data as { totalVolume: number }).totalVolume /
                            1_000_000_000
                          ).toFixed(2)}
                          B
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Exchanges
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { exchangeCount: number }).exchangeCount}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Assets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { assetCount: number }).assetCount}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "EWI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Geometric Mean
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Arithmetic Mean
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { arithmeticMean: number })
                            .arithmeticMean.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { count: number }).count}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "LIQ" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Sum
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { count: number }).count}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "MBI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Condition
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { condition: string }).condition.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Breadth %
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { breadthPercentage: number })
                            .breadthPercentage.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Uptrend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                          {(data as { uptrendCount: number }).uptrendCount}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {(data as { bearishPercentage: number })
                            .bearishPercentage.toFixed(1)}% bearish
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Downtrend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                          {(data as { downtrendCount: number }).downtrendCount}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {(data as { neutralPercentage: number })
                            .neutralPercentage.toFixed(1)}% neutral
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Assets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { totalAssets: number }).totalAssets}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "MCWI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Weight
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {((data as { totalWeight: number }).totalWeight *
                            100).toFixed(2)}
                          %
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { count: number }).count}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "MI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Sentiment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { sentiment: string }).sentiment.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { count: number }).count}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "MECI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Momentum
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { momentum: number }).momentum.toFixed(2)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Sentiment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { sentiment: string }).sentiment.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Weight
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {((data as { totalWeight: number }).totalWeight *
                            100).toFixed(2)}
                          %
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { componentCount: number }).componentCount}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "PSI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Overall Spread
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {((data as { overallSpread: number }).overallSpread *
                            100).toFixed(6)}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Efficiency
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { efficiency: string }).efficiency}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Assets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { assetCount: number }).assetCount}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Exchanges
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { exchangeCount: number }).exchangeCount}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "PI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Arithmetic Mean
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { count: number }).count}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "TSI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Direction
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { direction: string }).direction.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Strength
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { strength: string }).strength.replace(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { componentCount: number }).componentCount}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "VI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toFixed(4)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Level
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs capitalize">
                          {(data as { level: string }).level}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { count: number }).count}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {data.index === "VWPI" && (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Total Volume
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          $
                          {(
                            (data as { totalVolume: number }).totalVolume /
                            1_000_000_000
                          ).toFixed(2)}
                          B
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { count: number }).count}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Default metrics */}
                {!["BDI", "FGI", "CI", "AOI", "ELI", "CEPI", "EWI", "LIQ", "MBI", "MCWI", "MI", "MECI", "PSI", "PI", "TSI", "VI", "VWPI"].includes(
                  data.index,
                ) &&
                  "value" in data && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">
                          Value
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(data as { value: number }).value.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>

              {/* BDI Assets List */}
              {data.index === "BDI" &&
                "assets" in data &&
                Object.keys(
                  (data as { assets: Record<string, unknown> }).assets,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Market Assets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            assets: Record<
                              string,
                              {
                                name: string;
                                price: number;
                                volume: number;
                                marketValue: number;
                              }
                            >;
                          }).assets,
                        )
                          .sort(
                            (a, b) => b[1].marketValue - a[1].marketValue,
                          )
                          .map(([asset, assetData]) => {
                            const bdiData = data as {
                              totalMarketValue: number;
                            };
                            const marketShare =
                              (assetData.marketValue /
                                bdiData.totalMarketValue) *
                              100;

                            return (
                              <div
                                key={asset}
                                className="border border-border rounded-lg p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-mono"
                                    >
                                      {asset}
                                    </Badge>
                                    <span className="text-sm font-medium text-foreground">
                                      {assetData.name}
                                    </span>
                                  </div>
                                  <div className="text-sm font-semibold text-amber-500">
                                    {marketShare.toFixed(2)}%
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="text-muted-foreground">
                                    <span>Price: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      ${assetData.price.toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-muted-foreground">
                                    <span>Volume: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      $
                                      {(assetData.volume / 1_000_000).toFixed(
                                        2,
                                      )}
                                      M
                                    </span>
                                  </div>
                                  <div className="text-muted-foreground">
                                    <span>Market Value: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      $
                                      {(assetData.marketValue / 1_000_000).toFixed(
                                        2,
                                      )}
                                      M
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* CI Correlation Matrix */}
              {data.index === "CI" &&
                "correlationMatrix" in data &&
                Object.keys(
                  (data as { correlationMatrix: Record<string, unknown> })
                    .correlationMatrix,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Correlation Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className="text-left p-2 border-b border-border font-semibold text-muted-foreground">
                                Asset
                              </th>
                              {Object.keys(
                                (data as {
                                  correlationMatrix: Record<
                                    string,
                                    Record<string, number>
                                  >;
                                }).correlationMatrix,
                              ).map((asset) => (
                                <th
                                  key={asset}
                                  className="text-center p-2 border-b border-border font-semibold text-muted-foreground font-mono"
                                >
                                  {asset}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(
                              (data as {
                                correlationMatrix: Record<
                                  string,
                                  Record<string, number>
                                >;
                              }).correlationMatrix,
                            ).map(([asset, correlations]) => (
                              <tr key={asset}>
                                <td className="p-2 border-b border-border font-mono font-semibold">
                                  {asset}
                                </td>
                                {Object.keys(
                                  (data as {
                                    correlationMatrix: Record<
                                      string,
                                      Record<string, number>
                                    >;
                                  }).correlationMatrix,
                                ).map((otherAsset) => {
                                  const value = correlations[otherAsset] || 0;
                                  const isPositive = value >= 0;
                                  const isHigh = Math.abs(value) >= 0.7;
                                  const isMedium =
                                    Math.abs(value) >= 0.4 &&
                                    Math.abs(value) < 0.7;

                                  return (
                                    <td
                                      key={otherAsset}
                                      className={cn(
                                        "text-center p-2 border-b border-border font-mono",
                                        isHigh
                                          ? isPositive
                                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                                          : isMedium
                                            ? isPositive
                                              ? "bg-green-500/5 text-green-500"
                                              : "bg-red-500/5 text-red-500"
                                            : "text-muted-foreground",
                                      )}
                                    >
                                      {value.toFixed(2)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* CI Asset Data */}
              {data.index === "CI" &&
                "assetData" in data &&
                Object.keys(
                  (data as { assetData: Record<string, unknown> }).assetData,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="icon-sm" />
                        Asset Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            assetData: Record<
                              string,
                              {
                                name: string;
                                price: number;
                                percentage: number;
                              }
                            >;
                          }).assetData,
                        ).map(([asset, assetData]) => {
                          const isPositive = assetData.percentage >= 0;

                          return (
                            <div
                              key={asset}
                              className="border border-border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {asset}
                                  </Badge>
                                  <span className="text-sm font-medium text-foreground">
                                    {assetData.name}
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    "text-sm font-semibold",
                                    isPositive
                                      ? "text-green-500"
                                      : "text-red-500",
                                  )}
                                >
                                  {isPositive ? "+" : ""}
                                  {assetData.percentage.toFixed(2)}%
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span>Price: </span>
                                <span className="font-mono font-semibold text-foreground">
                                  ${assetData.price.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* CEPI Component Weights */}
              {data.index === "CEPI" &&
                "componentWeights" in data &&
                Object.keys(
                  (data as { componentWeights: Record<string, unknown> })
                    .componentWeights,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Component Weights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(
                          (data as {
                            componentWeights: Record<string, number>;
                          }).componentWeights,
                        )
                          .sort((a, b) => b[1] - a[1])
                          .map(([asset, weight]) => (
                            <div
                              key={asset}
                              className="flex items-center justify-between p-2 border border-border rounded"
                            >
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {asset}
                              </Badge>
                              <div className="flex items-center gap-2 flex-1 mx-2">
                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full bg-amber-500 transition-all"
                                    style={{ width: `${weight}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-foreground min-w-[50px] text-right">
                                {weight.toFixed(2)}%
                              </span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* CEPI Assets */}
              {data.index === "CEPI" &&
                "assets" in data &&
                Object.keys(
                  (data as { assets: Record<string, unknown> }).assets,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="icon-sm" />
                        Asset Prices & Volumes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(
                          (data as {
                            assets: Record<
                              string,
                              {
                                prices: Record<string, number>;
                                volumes: Record<string, number>;
                                vwap: number;
                                avgPrice: number;
                                priceSpread: number;
                                minPrice: number;
                                maxPrice: number;
                                totalVolume: number;
                                exchangeCount: number;
                              }
                            >;
                          }).assets,
                        ).map(([asset, assetData]) => (
                          <div
                            key={asset}
                            className="border border-border rounded-lg p-3 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {asset}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {assetData.exchangeCount} exchanges
                              </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">
                                  VWAP:{" "}
                                </span>
                                <span className="font-mono font-semibold text-foreground">
                                  ${assetData.vwap.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Avg Price:{" "}
                                </span>
                                <span className="font-mono font-semibold text-foreground">
                                  ${assetData.avgPrice.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Spread:{" "}
                                </span>
                                <span className="font-mono font-semibold text-foreground">
                                  {assetData.priceSpread.toFixed(4)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Volume:{" "}
                                </span>
                                <span className="font-mono font-semibold text-foreground">
                                  $
                                  {(assetData.totalVolume / 1_000_000).toFixed(
                                    2,
                                  )}
                                  M
                                </span>
                              </div>
                            </div>

                            {/* Prices by Exchange */}
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-1">
                                Prices by Exchange:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(assetData.prices).map(
                                  ([exchange, price]) => (
                                    <div
                                      key={exchange}
                                      className="text-xs border border-border rounded px-2 py-1"
                                    >
                                      <span className="text-muted-foreground capitalize">
                                        {exchange}:
                                      </span>{" "}
                                      <span className="font-mono font-semibold text-foreground">
                                        ${price.toFixed(2)}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            {/* Price Range */}
                            <div className="text-xs text-muted-foreground">
                              <span>Range: </span>
                              <span className="font-mono">
                                ${assetData.minPrice.toFixed(2)} - $
                                {assetData.maxPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* LIQ Components */}
              {data.index === "LIQ" &&
                "components" in data &&
                Object.keys(
                  (data as { components: Record<string, unknown> }).components,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Component Prices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(
                          (data as {
                            components: Record<string, number>;
                          }).components,
                        )
                          .sort((a, b) => b[1] - a[1])
                          .map(([asset, price]) => (
                            <div
                              key={asset}
                              className="flex items-center justify-between p-2 border border-border rounded"
                            >
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {asset}
                              </Badge>
                              <span className="text-sm font-mono font-semibold text-foreground">
                                ${price.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* MCWI Components */}
              {data.index === "MCWI" &&
                "components" in data &&
                Object.keys(
                  (data as { components: Record<string, unknown> }).components,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Component Weights & Prices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            components: Record<
                              string,
                              {
                                price: number;
                                weight: number;
                                staticWeight: number;
                                volume: number;
                              }
                            >;
                            weights: Record<string, number>;
                          }).components,
                        )
                          .sort(
                            (a, b) =>
                              (data as { weights: Record<string, number> })
                                .weights[b[0]] -
                              (data as { weights: Record<string, number> })
                                .weights[a[0]],
                          )
                          .map(([asset, componentData]) => {
                            const mcwiData = data as {
                              weights: Record<string, number>;
                            };
                            const weightPercent = mcwiData.weights[asset] || 0;

                            return (
                              <div
                                key={asset}
                                className="border border-border rounded-lg p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {asset}
                                  </Badge>
                                  <div className="text-sm font-semibold text-amber-500">
                                    {weightPercent.toFixed(2)}%
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Price:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      $
                                      {componentData.price.toLocaleString(
                                        undefined,
                                        {
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Volume:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      $
                                      {(componentData.volume / 1_000_000).toFixed(
                                        2,
                                      )}
                                      M
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 transition-all"
                                      style={{ width: `${weightPercent}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  <div>
                                    <span>Weight: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {(componentData.weight * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span>Static: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {(componentData.staticWeight * 100).toFixed(
                                        2,
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* MECI Components */}
              {data.index === "MECI" &&
                "components" in data &&
                Object.keys(
                  (data as { components: Record<string, unknown> }).components,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Component Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(
                          (data as {
                            components: Record<
                              string,
                              {
                                symbol: string;
                                weight: number;
                                adjustedWeight: number;
                                price: number;
                                avgPrice: number;
                                momentum: number;
                                totalVolume: number;
                                exchangePrices: Record<string, number>;
                                exchangeVolumes: Record<string, number>;
                                exchangeCount: number;
                                weightedValue: number;
                              }
                            >;
                            weights: Record<string, number>;
                          }).components,
                        )
                          .sort(
                            (a, b) =>
                              (data as { weights: Record<string, number> })
                                .weights[b[0]] -
                              (data as { weights: Record<string, number> })
                                .weights[a[0]],
                          )
                          .map(([asset, componentData]) => {
                            const meciData = data as {
                              weights: Record<string, number>;
                            };
                            const weightPercent = meciData.weights[asset] || 0;
                            const isPositiveMomentum =
                              componentData.momentum >= 0;

                            return (
                              <div
                                key={asset}
                                className="border border-border rounded-lg p-3 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-mono"
                                    >
                                      {asset}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {componentData.symbol}
                                    </span>
                                  </div>
                                  <div className="text-sm font-semibold text-amber-500">
                                    {weightPercent.toFixed(2)}%
                                  </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Price:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      ${componentData.price.toLocaleString(
                                        undefined,
                                        {
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Avg Price:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      ${componentData.avgPrice.toLocaleString(
                                        undefined,
                                        {
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Momentum:{" "}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-mono font-semibold",
                                        isPositiveMomentum
                                          ? "text-green-500"
                                          : "text-red-500",
                                      )}
                                    >
                                      {isPositiveMomentum ? "+" : ""}
                                      {componentData.momentum.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Volume:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      $
                                      {(
                                        componentData.totalVolume / 1_000_000
                                      ).toFixed(2)}
                                      M
                                    </span>
                                  </div>
                                </div>

                                {/* Weights */}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 transition-all"
                                      style={{ width: `${weightPercent}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                  <div>
                                    <span>Weight: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {(componentData.weight * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span>Adjusted: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {(componentData.adjustedWeight * 100).toFixed(
                                        2,
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>

                                {/* Exchange Prices */}
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                                    Prices by Exchange:
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(
                                      componentData.exchangePrices,
                                    ).map(([exchange, price]) => (
                                      <div
                                        key={exchange}
                                        className="text-xs border border-border rounded px-2 py-1"
                                      >
                                        <span className="text-muted-foreground capitalize">
                                          {exchange}:
                                        </span>{" "}
                                        <span className="font-mono font-semibold text-foreground">
                                          ${price.toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Exchange Volumes */}
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                                    Volumes by Exchange:
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(
                                      componentData.exchangeVolumes,
                                    ).map(([exchange, volume]) => (
                                      <div
                                        key={exchange}
                                        className="text-xs border border-border rounded px-2 py-1"
                                      >
                                        <span className="text-muted-foreground capitalize">
                                          {exchange}:
                                        </span>{" "}
                                        <span className="font-mono font-semibold text-foreground">
                                          ${(volume / 1_000_000).toFixed(2)}M
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* MI Components */}
              {data.index === "MI" &&
                "components" in data &&
                Object.keys(
                  (data as { components: Record<string, unknown> }).components,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="icon-sm" />
                        Component Momentum
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            components: Record<
                              string,
                              {
                                momentum: number;
                                price: number;
                              }
                            >;
                          }).components,
                        )
                          .sort((a, b) => b[1].momentum - a[1].momentum)
                          .map(([asset, componentData]) => {
                            const isPositive = componentData.momentum >= 0;

                            return (
                              <div
                                key={asset}
                                className="border border-border rounded-lg p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {asset}
                                  </Badge>
                                  <div
                                    className={cn(
                                      "text-sm font-semibold",
                                      isPositive
                                        ? "text-green-500"
                                        : "text-red-500",
                                    )}
                                  >
                                    {isPositive ? "+" : ""}
                                    {componentData.momentum.toFixed(2)}%
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <span>Price: </span>
                                  <span className="font-mono font-semibold text-foreground">
                                    ${componentData.price.toLocaleString(
                                      undefined,
                                      {
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* PI Components */}
              {data.index === "PI" &&
                "components" in data &&
                Object.keys(
                  (data as { components: Record<string, unknown> }).components,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Component Prices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(
                          (data as {
                            components: Record<string, number>;
                          }).components,
                        )
                          .sort((a, b) => b[1] - a[1])
                          .map(([asset, price]) => (
                            <div
                              key={asset}
                              className="flex items-center justify-between p-2 border border-border rounded"
                            >
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {asset}
                              </Badge>
                              <span className="text-sm font-mono font-semibold text-foreground">
                                ${price.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* EWI Components */}
              {data.index === "EWI" &&
                "components" in data &&
                Object.keys(
                  (data as { components: Record<string, unknown> }).components,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Component Prices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(
                          (data as {
                            components: Record<string, number>;
                          }).components,
                        )
                          .sort((a, b) => b[1] - a[1])
                          .map(([asset, price]) => (
                            <div
                              key={asset}
                              className="flex items-center justify-between p-2 border border-border rounded"
                            >
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {asset}
                              </Badge>
                              <span className="text-sm font-mono font-semibold text-foreground">
                                ${price.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* FGI Component Data */}
              {data.index === "FGI" &&
                "componentData" in data &&
                Object.keys(
                  (data as { componentData: Record<string, unknown> })
                    .componentData,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="icon-sm" />
                        Asset Component Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(
                          (data as {
                            componentData: Record<
                              string,
                              {
                                price: number;
                                percentage: number;
                                volume: number;
                                change: number;
                                volatilityScore: number;
                                momentumScore: number;
                                volumeScore: number;
                                priceActionScore: number;
                              }
                            >;
                          }).componentData,
                        ).map(([asset, assetData]) => {
                          const isPositive = assetData.percentage >= 0;

                          return (
                            <div
                              key={asset}
                              className="border border-border rounded-lg p-3 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-mono"
                                >
                                  {asset}
                                </Badge>
                                <div
                                  className={cn(
                                    "text-sm font-semibold",
                                    isPositive
                                      ? "text-green-500"
                                      : "text-red-500",
                                  )}
                                >
                                  {isPositive ? "+" : ""}
                                  {assetData.percentage.toFixed(2)}%
                                </div>
                              </div>

                              {/* Price & Volume */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">
                                    Price:{" "}
                                  </span>
                                  <span className="font-mono font-semibold text-foreground">
                                    ${assetData.price.toLocaleString(undefined, {
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Change:{" "}
                                  </span>
                                  <span
                                    className={cn(
                                      "font-mono font-semibold",
                                      isPositive
                                        ? "text-green-500"
                                        : "text-red-500",
                                    )}
                                  >
                                    {isPositive ? "+" : ""}
                                    ${assetData.change.toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Volume:{" "}
                                  </span>
                                  <span className="font-mono font-semibold text-foreground">
                                    $
                                    {(assetData.volume / 1_000_000).toFixed(2)}
                                    M
                                  </span>
                                </div>
                              </div>

                              {/* Scores */}
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground mb-2">
                                  Component Scores:
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Volatility:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {assetData.volatilityScore.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Momentum:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {assetData.momentumScore.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Volume:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {assetData.volumeScore.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Price Action:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {assetData.priceActionScore.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* MBI Asset Trends */}
              {data.index === "MBI" &&
                "assetTrends" in data &&
                Object.keys(
                  (data as { assetTrends: Record<string, unknown> })
                    .assetTrends,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="icon-sm" />
                        Asset Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            assetTrends: Record<
                              string,
                              {
                                price: number;
                                percentage: number;
                                trend: string;
                              }
                            >;
                          }).assetTrends,
                        ).map(([asset, assetData]) => {
                          const isPositive = assetData.percentage >= 0;
                          const isStrongUptrend =
                            assetData.trend === "strong_uptrend";
                          const isUptrend = assetData.trend === "uptrend";
                          const isStrongDowntrend =
                            assetData.trend === "strong_downtrend";
                          const isDowntrend = assetData.trend === "downtrend";

                          return (
                            <div
                              key={asset}
                              className={cn(
                                "border rounded-lg p-3 space-y-2",
                                isStrongUptrend || isUptrend
                                  ? "border-green-500/50 bg-green-500/5"
                                  : isStrongDowntrend || isDowntrend
                                    ? "border-red-500/50 bg-red-500/5"
                                    : "border-border",
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-mono"
                                >
                                  {asset}
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs capitalize",
                                      isStrongUptrend || isUptrend
                                        ? "border-green-500/50 text-green-600 dark:text-green-400"
                                        : isStrongDowntrend || isDowntrend
                                          ? "border-red-500/50 text-red-600 dark:text-red-400"
                                          : "",
                                    )}
                                  >
                                    {assetData.trend.replace(/_/g, " ")}
                                  </Badge>
                                  <div
                                    className={cn(
                                      "text-sm font-semibold",
                                      isPositive
                                        ? "text-green-500"
                                        : "text-red-500",
                                    )}
                                  >
                                    {isPositive ? "+" : ""}
                                    {assetData.percentage.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span>Price: </span>
                                <span className="font-mono font-semibold text-foreground">
                                  ${assetData.price.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* PSI Spreads */}
              {data.index === "PSI" &&
                "spreads" in data &&
                Object.keys(
                  (data as { spreads: Record<string, unknown> }).spreads,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Asset Spreads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(
                          (data as {
                            spreads: Record<
                              string,
                              {
                                asset: string;
                                avgSpread: number;
                                tightestSpread: {
                                  exchange: string;
                                  spread: number;
                                };
                                widestSpread: {
                                  exchange: string;
                                  spread: number;
                                };
                                crossExchangeSpread: number;
                                exchangeSpreads: Record<
                                  string,
                                  {
                                    bid: number;
                                    ask: number;
                                    spread: number;
                                    spreadPercent: number;
                                    midPrice: number;
                                    last: number;
                                  }
                                >;
                                exchangeCount: number;
                              }
                            >;
                          }).spreads,
                        ).map(([asset, spreadData]) => (
                          <div
                            key={asset}
                            className="border border-border rounded-lg p-3 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {asset}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {spreadData.exchangeCount} exchanges
                              </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">
                                  Avg Spread:{" "}
                                </span>
                                <span className="font-mono font-semibold text-foreground">
                                  {(spreadData.avgSpread * 100).toFixed(6)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Cross Exchange:{" "}
                                </span>
                                <span className="font-mono font-semibold text-foreground">
                                  {(spreadData.crossExchangeSpread * 100).toFixed(
                                    4,
                                  )}
                                  %
                                </span>
                              </div>
                            </div>

                            {/* Tightest/Widest Spreads */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="border border-green-500/30 bg-green-500/5 rounded p-2">
                                <div className="text-muted-foreground">
                                  Tightest:
                                </div>
                                <div className="font-mono font-semibold text-green-600 dark:text-green-400">
                                  {spreadData.tightestSpread.exchange}:{" "}
                                  {(spreadData.tightestSpread.spread * 100).toFixed(
                                    6,
                                  )}
                                  %
                                </div>
                              </div>
                              <div className="border border-red-500/30 bg-red-500/5 rounded p-2">
                                <div className="text-muted-foreground">
                                  Widest:
                                </div>
                                <div className="font-mono font-semibold text-red-600 dark:text-red-400">
                                  {spreadData.widestSpread.exchange}:{" "}
                                  {(spreadData.widestSpread.spread * 100).toFixed(
                                    6,
                                  )}
                                  %
                                </div>
                              </div>
                            </div>

                            {/* Exchange Spreads */}
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-2">
                                Spreads by Exchange:
                              </div>
                              <div className="space-y-2">
                                {Object.entries(
                                  spreadData.exchangeSpreads,
                                ).map(([exchange, exchangeData]) => (
                                  <div
                                    key={exchange}
                                    className="border border-border rounded p-2 text-xs"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold capitalize text-foreground">
                                        {exchange}
                                      </span>
                                      <span className="font-mono text-amber-500">
                                        {(exchangeData.spreadPercent * 100).toFixed(
                                          6,
                                        )}
                                        %
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                      <div>
                                        <span>Bid: </span>
                                        <span className="font-mono font-semibold text-foreground">
                                          ${exchangeData.bid.toFixed(2)}
                                        </span>
                                      </div>
                                      <div>
                                        <span>Ask: </span>
                                        <span className="font-mono font-semibold text-foreground">
                                          ${exchangeData.ask.toFixed(2)}
                                        </span>
                                      </div>
                                      <div>
                                        <span>Mid: </span>
                                        <span className="font-mono font-semibold text-foreground">
                                          ${exchangeData.midPrice.toFixed(2)}
                                        </span>
                                      </div>
                                      <div>
                                        <span>Last: </span>
                                        <span className="font-mono font-semibold text-foreground">
                                          ${exchangeData.last.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* TSI Asset Strengths */}
              {data.index === "TSI" &&
                "assetStrengths" in data &&
                Object.keys(
                  (data as { assetStrengths: Record<string, unknown> })
                    .assetStrengths,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="icon-sm" />
                        Asset Trend Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(
                          (data as {
                            assetStrengths: Record<
                              string,
                              {
                                price: number;
                                percentage: number;
                                volume: number;
                                change: number;
                                trendStrength: number;
                                momentumStrength: number;
                                volumeStrength: number;
                                direction: string;
                              }
                            >;
                          }).assetStrengths,
                        )
                          .sort(
                            (a, b) =>
                              b[1].trendStrength - a[1].trendStrength,
                          )
                          .map(([asset, assetData]) => {
                            const isUp = assetData.direction === "up";
                            const isPositive = assetData.percentage >= 0;

                            return (
                              <div
                                key={asset}
                                className={cn(
                                  "border rounded-lg p-3 space-y-3",
                                  isUp
                                    ? "border-green-500/50 bg-green-500/5"
                                    : "border-red-500/50 bg-red-500/5",
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {asset}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs capitalize",
                                        isUp
                                          ? "border-green-500/50 text-green-600 dark:text-green-400"
                                          : "border-red-500/50 text-red-600 dark:text-red-400",
                                      )}
                                    >
                                      {assetData.direction}
                                    </Badge>
                                    <div
                                      className={cn(
                                        "text-sm font-semibold",
                                        isPositive
                                          ? "text-green-500"
                                          : "text-red-500",
                                      )}
                                    >
                                      {isPositive ? "+" : ""}
                                      {assetData.percentage.toFixed(2)}%
                                    </div>
                                  </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Price:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      ${assetData.price.toLocaleString(
                                        undefined,
                                        {
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Change:{" "}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-mono font-semibold",
                                        isPositive
                                          ? "text-green-500"
                                          : "text-red-500",
                                      )}
                                    >
                                      {isPositive ? "+" : ""}
                                      ${assetData.change.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Volume:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      $
                                      {(assetData.volume / 1_000_000).toFixed(
                                        2,
                                      )}
                                      M
                                    </span>
                                  </div>
                                </div>

                                {/* Strength Scores */}
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                                    Strength Scores:
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">
                                        Trend:{" "}
                                      </span>
                                      <span className="font-mono font-semibold text-foreground">
                                        {assetData.trendStrength.toFixed(3)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Momentum:{" "}
                                      </span>
                                      <span className="font-mono font-semibold text-foreground">
                                        {assetData.momentumStrength.toFixed(3)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">
                                        Volume:{" "}
                                      </span>
                                      <span className="font-mono font-semibold text-foreground">
                                        {assetData.volumeStrength.toFixed(3)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* VI Components */}
              {data.index === "VI" &&
                "components" in data &&
                Object.keys(
                  (data as { components: Record<string, unknown> }).components,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="icon-sm" />
                        Component Volatility
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            components: Record<
                              string,
                              {
                                volatility: number;
                                price: number;
                                change: number;
                                percentage: number;
                              }
                            >;
                          }).components,
                        )
                          .sort((a, b) => b[1].volatility - a[1].volatility)
                          .map(([asset, componentData]) => {
                            const isPositive = componentData.percentage >= 0;
                            const isHighVolatility = componentData.volatility >= 5;
                            const isMediumVolatility =
                              componentData.volatility >= 2 &&
                              componentData.volatility < 5;

                            return (
                              <div
                                key={asset}
                                className={cn(
                                  "border rounded-lg p-3 space-y-2",
                                  isHighVolatility
                                    ? "border-red-500/50 bg-red-500/5"
                                    : isMediumVolatility
                                      ? "border-amber-500/50 bg-amber-500/5"
                                      : "border-border",
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {asset}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    {isHighVolatility && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-red-500/50 text-red-600 dark:text-red-400"
                                      >
                                        High Vol
                                      </Badge>
                                    )}
                                    {isMediumVolatility && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400"
                                      >
                                        Medium Vol
                                      </Badge>
                                    )}
                                    <div className="text-sm font-semibold text-foreground">
                                      {componentData.volatility.toFixed(3)}%
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Price:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      ${componentData.price.toLocaleString(
                                        undefined,
                                        {
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Change:{" "}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-mono font-semibold",
                                        isPositive
                                          ? "text-green-500"
                                          : "text-red-500",
                                      )}
                                    >
                                      {isPositive ? "+" : ""}
                                      ${componentData.change.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Percentage:{" "}
                                    </span>
                                    <span
                                      className={cn(
                                        "font-mono font-semibold",
                                        isPositive
                                          ? "text-green-500"
                                          : "text-red-500",
                                      )}
                                    >
                                      {isPositive ? "+" : ""}
                                      {componentData.percentage.toFixed(3)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* VWPI Components */}
              {data.index === "VWPI" &&
                "components" in data &&
                Object.keys(
                  (data as { components: Record<string, unknown> }).components,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Component Weights & Prices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            components: Record<
                              string,
                              {
                                price: number;
                                volume: number;
                                weight: number;
                              }
                            >;
                            weights: Record<string, number>;
                          }).components,
                        )
                          .sort(
                            (a, b) =>
                              (data as { weights: Record<string, number> })
                                .weights[b[0]] -
                              (data as { weights: Record<string, number> })
                                .weights[a[0]],
                          )
                          .map(([asset, componentData]) => {
                            const vwpiData = data as {
                              weights: Record<string, number>;
                            };
                            const weightPercent = vwpiData.weights[asset] || 0;

                            return (
                              <div
                                key={asset}
                                className="border border-border rounded-lg p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {asset}
                                  </Badge>
                                  <div className="text-sm font-semibold text-amber-500">
                                    {weightPercent.toFixed(2)}%
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Price:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      ${componentData.price.toLocaleString(
                                        undefined,
                                        {
                                          maximumFractionDigits: 2,
                                        },
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Volume:{" "}
                                    </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      $
                                      {(componentData.volume / 1_000_000).toFixed(
                                        2,
                                      )}
                                      M
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 transition-all"
                                      style={{ width: `${weightPercent}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  <span>Weight: </span>
                                  <span className="font-mono font-semibold text-foreground">
                                    $
                                    {(componentData.weight / 1_000_000).toFixed(
                                      2,
                                    )}
                                    M
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* AOI Opportunities List */}
              {data.index === "AOI" &&
                "opportunities" in data &&
                Object.keys((data as { opportunities: Record<string, unknown> })
                  .opportunities).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="icon-sm" />
                        Arbitrage Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.values(
                          (data as {
                            opportunities: Record<
                              string,
                              {
                                asset: string;
                                priceSpread: number;
                                minPrice: number;
                                maxPrice: number;
                                minExchange: string;
                                maxExchange: string;
                                opportunity: string;
                              }
                            >;
                          }).opportunities,
                        ).map((opp) => {
                          const profitPercent =
                            opp.minPrice != null &&
                            opp.maxPrice != null &&
                            opp.minPrice > 0
                              ? ((opp.maxPrice - opp.minPrice) / opp.minPrice) * 100
                              : 0;
                          const isHigh = opp.opportunity === "high";
                          const isMedium = opp.opportunity === "medium";
                          const isLow = opp.opportunity === "low";

                          return (
                            <div
                              key={opp.asset}
                              className={cn(
                                "border rounded-lg p-3 space-y-2",
                                isHigh
                                  ? "border-amber-500/50 bg-amber-500/5"
                                  : isMedium
                                    ? "border-amber-500/30 bg-amber-500/3"
                                    : "border-border",
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >
                                    {opp.asset}
                                  </Badge>
                                  {isHigh && (
                                    <Badge
                                      variant="default"
                                      className="text-xs bg-amber-500"
                                    >
                                      High
                                    </Badge>
                                  )}
                                  {isMedium && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400"
                                    >
                                      Medium
                                    </Badge>
                                  )}
                                  {isLow && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Low
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm font-semibold text-amber-500">
                                  {profitPercent.toFixed(3)}%
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <ArrowDownRight className="icon-xs text-green-500" />
                                  <span>Buy:</span>
                                  <span className="font-mono font-semibold text-foreground">
                                    {opp.minExchange || "N/A"}
                                  </span>
                                  <span className="font-mono">
                                    {opp.minPrice != null
                                      ? `$${opp.minPrice.toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}`
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <ArrowUpRight className="icon-xs text-red-500" />
                                  <span>Sell:</span>
                                  <span className="font-mono font-semibold text-foreground">
                                    {opp.maxExchange || "N/A"}
                                  </span>
                                  <span className="font-mono">
                                    {opp.maxPrice != null
                                      ? `$${opp.maxPrice.toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}`
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Spread: {opp.priceSpread.toFixed(4)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* ELI Exchange Liquidity */}
              {data.index === "ELI" &&
                "exchangeLiquidity" in data &&
                Object.keys(
                  (data as { exchangeLiquidity: Record<string, unknown> })
                    .exchangeLiquidity,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="icon-sm" />
                        Exchange Liquidity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            exchangeLiquidity: Record<
                              string,
                              {
                                totalVolume: number;
                                assetCount: number;
                                marketShare: number;
                              }
                            >;
                            mostLiquidExchange: string;
                          }).exchangeLiquidity,
                        )
                          .sort(
                            (a, b) => b[1].marketShare - a[1].marketShare,
                          )
                          .map(([exchange, exchangeData]) => {
                            const eliData = data as {
                              mostLiquidExchange: string;
                            };
                            const isMostLiquid =
                              exchange === eliData.mostLiquidExchange;

                            return (
                              <div
                                key={exchange}
                                className={cn(
                                  "border rounded-lg p-3 space-y-2",
                                  isMostLiquid
                                    ? "border-amber-500/50 bg-amber-500/5"
                                    : "border-border",
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-mono capitalize"
                                    >
                                      {exchange}
                                    </Badge>
                                    {isMostLiquid && (
                                      <Badge
                                        variant="default"
                                        className="text-xs bg-amber-500"
                                      >
                                        Most Liquid
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm font-semibold text-amber-500">
                                    {exchangeData.marketShare.toFixed(2)}%
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="text-muted-foreground">
                                    <span>Volume: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      $
                                      {(
                                        exchangeData.totalVolume /
                                        1_000_000_000
                                      ).toFixed(2)}
                                      B
                                    </span>
                                  </div>
                                  <div className="text-muted-foreground">
                                    <span>Assets: </span>
                                    <span className="font-mono font-semibold text-foreground">
                                      {exchangeData.assetCount}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* ELI Asset Liquidity */}
              {data.index === "ELI" &&
                "assetLiquidity" in data &&
                Object.keys(
                  (data as { assetLiquidity: Record<string, unknown> })
                    .assetLiquidity,
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm" />
                        Asset Liquidity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(
                          (data as {
                            assetLiquidity: Record<
                              string,
                              {
                                totalVolume: number;
                                exchangeCount: number;
                              }
                            >;
                          }).assetLiquidity,
                        )
                          .sort((a, b) => b[1].totalVolume - a[1].totalVolume)
                          .map(([asset, assetData]) => (
                            <div
                              key={asset}
                              className="border border-border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-mono"
                                >
                                  {asset}
                                </Badge>
                                <div className="text-sm font-semibold text-foreground">
                                  $
                                  {(assetData.totalVolume / 1_000_000_000).toFixed(
                                    2,
                                  )}
                                  B
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span>Exchanges: </span>
                                <span className="font-semibold text-foreground">
                                  {assetData.exchangeCount}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="icon-sm" />
                    Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Index Code:</span>
                    <span className="font-mono font-semibold">{data.index}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">
                      {data.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update:</span>
                    <span className="flex items-center gap-1">
                      <Clock className="icon-xs" />
                      {new Date(data.timestamp).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chart" className="space-y-4">
              {/* Timeframe Selector */}
              <div className="flex items-center gap-2">
                {TIMEFRAMES.map((tf) => (
                  <Button
                    key={tf}
                    variant={selectedTimeframe === tf ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(tf)}
                    className="text-xs"
                  >
                    {tf}
                  </Button>
                ))}
              </div>

              {/* Chart */}
              <Card>
                <CardContent className="p-4">
                  <IndexChart
                    candleData={candleData}
                    timeframe={selectedTimeframe}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Raw Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono bg-muted/20 p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

