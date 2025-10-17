import React, { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AggregatedCandlesProps,
  ExchangeData,
} from "./AggregatedCandles/types";
import {
  calculateExchangeLiquidity,
  calculateFairValue,
  calculateMarketEfficiency,
  createAggregatedCandlesWithConfig,
} from "./AggregatedCandles/calculations";
import {
  AggregationMethod,
  AggregationTimeframe,
} from "./AggregatedCandles/aggregation-types";
import { STANDARD_PRESET } from "./AggregatedCandles/aggregation-presets";
import { generateLiquidityColors } from "./AggregatedCandles/utils";
import {
  DEFAULT_EXCHANGE_COLOR,
  MAX_CANDLES_PER_EXCHANGE,
  MAX_CANDLES_TO_DISPLAY,
} from "./AggregatedCandles/constants";
import { ChartLegend } from "./AggregatedCandles/ChartLegend";
import { MarketEfficiencyIndicator } from "./AggregatedCandles/MarketEfficiencyIndicator";
import { ExchangeDominanceLegend } from "./AggregatedCandles/ExchangeDominanceLegend";

const AggregatedCandles: React.FC<AggregatedCandlesProps> = ({
  candlesData,
  orderBookData,
  selectedMarket,
}) => {
  const chartRef = useRef<ReactECharts>(null);

  // Group candles by exchange with regulatory focus on dominance
  const exchangeData: ExchangeData[] = useMemo(() => {
    const liquidityData = calculateExchangeLiquidity(
      orderBookData,
      selectedMarket,
    );
    const liquidityColors = generateLiquidityColors(liquidityData);

    console.log(
      "Liquidity data for market",
      selectedMarket,
      ":",
      liquidityData,
    );

    const marketExchanges = orderBookData
      .filter((item) => item.market === selectedMarket)
      .map((item) => item.exchange);

    const marketCandles = candlesData.filter((candle) =>
      candle.market === selectedMarket
    );

    return marketExchanges.map((exchange) => {
      const exchangeMetrics = liquidityData.find((l) =>
        l.exchange === exchange
      );

      if (!exchangeMetrics) {
        return {
          exchange,
          candles: [],
          liquidity: 0,
          color: DEFAULT_EXCHANGE_COLOR,
        };
      }

      const { liquidity, dominance, marketShare } = exchangeMetrics;
      const color = liquidityColors[exchange] || DEFAULT_EXCHANGE_COLOR;

      const exchangeSpecificCandles = marketCandles.filter((candle) =>
        candle.exchange === exchange
      );

      const baseCandles = exchangeSpecificCandles.slice(
        0,
        Math.min(MAX_CANDLES_PER_EXCHANGE, exchangeSpecificCandles.length),
      );

      const exchangeCandles = baseCandles.map((candle) => ({
        ...candle,
        exchange,
        market: selectedMarket,
      }));

      return {
        exchange,
        candles: exchangeCandles,
        liquidity,
        color,
        dominance,
        marketShare,
      };
    }).sort((a, b) => (b.dominance || 0) - (a.dominance || 0));
  }, [candlesData, orderBookData, selectedMarket]);

  // Log exchange data for debugging
  useEffect(() => {
    console.log("Exchange data summary:", {
      totalExchanges: exchangeData.length,
      exchanges: exchangeData.map((ex) => ({
        name: ex.exchange,
        candles: ex.candles.length,
        color: ex.color,
        marketShare: ex.marketShare?.toFixed(2),
        dominance: ex.dominance?.toFixed(2),
      })),
    });
  }, [exchangeData]);

  // Create aggregated candles using PROFESSIONAL AGGREGATION
  const aggregatedCandles = useMemo(() => {
    // Use VWAP method (industry standard) with professional aggregation
    const candles = createAggregatedCandlesWithConfig(exchangeData, {
      ...STANDARD_PRESET,
      method: AggregationMethod.VWAP, // VWAP - industry standard
      timeframe: AggregationTimeframe.MINUTE_1,
      useRealHighLow: true, // ✅ Real max/min for high/low
      outlierDetection: {
        enabled: true,
        method: "iqr",
        threshold: 1.5,
      },
    });
    const limited = candles.slice(-MAX_CANDLES_TO_DISPLAY);
    console.log(
      `Professional aggregation (VWAP): ${candles.length} total → ${limited.length} displayed (last ${MAX_CANDLES_TO_DISPLAY})`,
    );
    return limited;
  }, [exchangeData]);

  const lastCandle = aggregatedCandles.length > 0
    ? aggregatedCandles[aggregatedCandles.length - 1]
    : null;
  const firstCandle = aggregatedCandles.length > 0
    ? aggregatedCandles[0]
    : null;
  const changePct = useMemo(() => {
    if (!lastCandle || !firstCandle || firstCandle.close === 0) return 0;
    return ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100;
  }, [lastCandle, firstCandle]);

  // Calculate fair value price
  const fairValuePrice = useMemo(
    () => calculateFairValue(exchangeData, lastCandle, selectedMarket),
    [exchangeData, lastCandle, selectedMarket],
  );

  // Calculate price deviation
  const priceDeviation = useMemo(() => {
    if (!lastCandle || !fairValuePrice || fairValuePrice === 0) return 0;
    return ((lastCandle.close - fairValuePrice) / fairValuePrice) * 100;
  }, [lastCandle, fairValuePrice]);

  // Calculate market efficiency
  const marketEfficiency = useMemo(
    () =>
      calculateMarketEfficiency(exchangeData, fairValuePrice, selectedMarket),
    [exchangeData, fairValuePrice, selectedMarket],
  );

  // Auto-scroll to latest data on update
  useEffect(() => {
    if (chartRef.current && aggregatedCandles.length > 0) {
      const chart = chartRef.current.getEchartsInstance();
      chart.dispatchAction({
        type: "dataZoom",
        start: 0,
        end: 100,
      });
    }
  }, [aggregatedCandles]);

  return (
    <Card className="w-full border-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="h-4 w-1 bg-amber-500 rounded" />
              <span className="text-amber-500 font-medium tracking-widest uppercase">
                {selectedMarket} Aggregated
              </span>
            </CardTitle>
            <CardDescription className="mt-1 text-[11px]">
              <span className="text-amber-500">
                {exchangeData.length} Exchanges
              </span>
              <span className="mx-2 text-muted-foreground">|</span>
              <span className="text-green-500">Relative Performance View</span>
              <span className="mx-2 text-muted-foreground">|</span>
              <span className="text-blue-500">
                Centered at Start
              </span>
              {exchangeData.length > 0 && (
                <>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <span className="text-green-500">
                    Leader: {exchangeData[0].exchange}
                  </span>
                  <span className="mx-1 text-muted-foreground">
                    ({exchangeData[0].marketShare?.toFixed(1)}%)
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="grid grid-cols-2 gap-4 text-right">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  CURRENT
                </div>
                <div
                  className={`font-mono text-sm ${
                    changePct >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {lastCandle ? lastCandle.close.toFixed(2) : "-"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {changePct >= 0 ? "+" : ""}
                  {changePct.toFixed(2)}%
                </div>
              </div>

              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  FAIR VALUE
                </div>
                <div className="font-mono text-sm text-amber-500">
                  {fairValuePrice ? fairValuePrice.toFixed(2) : "-"}
                </div>
                <div
                  className={`text-[11px] ${
                    Math.abs(priceDeviation) < 1
                      ? "text-green-500"
                      : Math.abs(priceDeviation) < 3
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {priceDeviation >= 0 ? "+" : ""}
                  {priceDeviation.toFixed(2)}%
                </div>
              </div>
            </div>

            <MarketEfficiencyIndicator efficiency={marketEfficiency} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {aggregatedCandles.length === 0
          ? (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
              No aggregated candlestick data
            </div>
          )
          : (
            <div className="relative pl-2 pr-2">
              <ChartLegend />
              <ExchangeDominanceLegend exchangeData={exchangeData} />
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default AggregatedCandles;
