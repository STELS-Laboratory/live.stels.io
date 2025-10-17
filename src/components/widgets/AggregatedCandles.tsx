import React, { useEffect, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useChartColors } from "@/hooks/useChartColors";
import type {
  AggregatedCandlesProps,
  ExchangeData,
} from "./AggregatedCandles/types";
import {
  calculateExchangeLiquidity,
  calculateFairValue,
  calculateMarketEfficiency,
  createAggregatedCandlesWithConfig,
  createVolumeData,
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
import { MetricsPanel } from "./AggregatedCandles/MetricsPanel";
import { ExchangeDominanceLegend } from "./AggregatedCandles/ExchangeDominanceLegend";
import { convertVolumeToECharts } from "./AggregatedCandles/echarts-utils";
import {
  getNormalizedPriceRange,
  normalizeExchangePrices,
} from "./AggregatedCandles/normalization";

const AggregatedCandles: React.FC<AggregatedCandlesProps> = ({
  candlesData,
  orderBookData,
  selectedMarket,
  height = 400,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const chartColors = useChartColors();

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

  // Create volume data
  const volumeData = useMemo(() => {
    const volume = createVolumeData(exchangeData);
    return volume.slice(-MAX_CANDLES_TO_DISPLAY);
  }, [exchangeData]);

  // Create normalized exchange line data (centered at 0%)
  const normalizedExchangeData = useMemo(() => {
    const normalized = normalizeExchangePrices(exchangeData, "first");

    // Limit to last MAX_CANDLES_TO_DISPLAY points
    const limited: typeof normalized = {};
    Object.entries(normalized).forEach(([exchange, data]) => {
      limited[exchange] = data.slice(-MAX_CANDLES_TO_DISPLAY);
    });

    console.log("Normalized exchange data (% change from start):", {
      exchanges: Object.keys(limited),
      dataCounts: Object.entries(limited).map(([ex, data]) => ({
        exchange: ex,
        points: data.length,
        range: data.length > 0
          ? `${data[0].value.toFixed(2)}% to ${
            data[data.length - 1].value.toFixed(2)
          }%`
          : "N/A",
      })),
    });
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

  // Prepare volume data for ECharts
  const volumeECharts = useMemo(
    () => convertVolumeToECharts(volumeData),
    [volumeData],
  );

  // Get price range for y-axis
  const priceRange = useMemo(
    () => getNormalizedPriceRange(normalizedExchangeData),
    [normalizedExchangeData],
  );

  // ECharts configuration
  const option: EChartsOption = useMemo(() => {
    const isDark = chartColors.background === "transparent" ||
      chartColors.background === "#09090b";

    // Create exchange line series with normalized data
    const exchangeLineSeries = exchangeData
      .filter(({ exchange }) => normalizedExchangeData[exchange]?.length > 0)
      .map(({ exchange, color, dominance, marketShare }, index) => {
        const data = normalizedExchangeData[exchange];
        const maxDominance = Math.max(
          ...exchangeData.map((e) => e.dominance || 0),
        );
        const dominanceRatio = (dominance || 0) / maxDominance;
        const lineWidth = Math.max(2, Math.min(6, 2 + dominanceRatio * 4));
        const opacity = Math.max(
          0.8,
          Math.min(1, 0.8 + (marketShare || 0) / 100 * 0.2),
        );

        // Get last value for end label
        const lastValue = data.length > 0 ? data[data.length - 1].value : 0;
        // Theme-aware colors for positive/negative
        const labelColor = lastValue >= 0 
          ? (isDark ? "#22c55e" : "#15803d")  // green-500 : green-700
          : (isDark ? "#ef4444" : "#b91c1c"); // red-500 : red-700

        return {
          name: exchange,
          type: "line",
          data: data.map((d) => [d.time * 1000, d.value]),
          smooth: true,
          smoothMonotone: "x",
          showSymbol: false,
          lineStyle: {
            width: Math.round(lineWidth),
            color: color,
            opacity: opacity,
          },
          endLabel: {
            show: true,
            formatter: (params: any) => {
              const value = params.value[1];
              return `{name|${params.seriesName}} {value|${
                value >= 0 ? "+" : ""
              }${value.toFixed(2)}%}`;
            },
            rich: {
              name: {
                color: color,
                fontSize: 11,
                fontWeight: "bold",
                textTransform: "capitalize",
                backgroundColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.8)",
                borderRadius: 3,
                padding: [2, 4, 2, 4],
              },
              value: {
                color: labelColor,
                fontSize: 12,
                fontFamily: "monospace",
                fontWeight: "bold",
                backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.95)",
                borderRadius: 3,
                padding: [2, 6, 2, 6],
                borderWidth: 1,
                borderColor: labelColor,
              },
            },
          },
          labelLayout: {
            moveOverlap: "shiftY",
            hideOverlap: false,
          },
          emphasis: {
            focus: "series",
            lineStyle: {
              width: Math.round(lineWidth) + 2,
            },
          },
          markLine: index === 0
            ? {
              silent: true,
              symbol: "none",
              lineStyle: {
                type: "dashed",
                color: isDark ? "#52525b" : "#a1a1aa", // zinc-600 : zinc-400
                width: 2,
                opacity: 0.6,
              },
              data: [{ yAxis: 0 }],
              label: {
                show: true,
                position: "insideEndTop",
                formatter: "Center (0%)",
                color: chartColors.textColor,
                fontSize: 11,
                fontWeight: "bold",
                backgroundColor: isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.7)",
                borderRadius: 4,
                padding: [4, 8, 4, 8],
              },
            }
            : undefined,
        };
      });

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 300,
      animationEasing: "cubicOut",
      grid: [
        {
          left: "2%",
          right: "140px", // Space for end labels
          top: "5%",
          height: "65%",
          containLabel: true,
          backgroundColor: isDark ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.01)",
          borderWidth: 1,
          borderColor: isDark ? "#27272a" : "#e4e4e7",
        },
        {
          left: "2%",
          right: "140px",
          top: "75%",
          height: "15%",
          containLabel: true,
          backgroundColor: isDark ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.01)",
          borderWidth: 1,
          borderColor: isDark ? "#27272a" : "#e4e4e7",
        },
      ],
      xAxis: [
        {
          type: "time",
          gridIndex: 0,
          axisLine: {
            show: true,
            lineStyle: { 
              color: isDark ? "#3f3f46" : "#d4d4d8",
              width: 1,
            },
          },
          axisLabel: {
            color: chartColors.textColor,
            fontSize: 10,
            formatter: (value: number) => {
              const date = new Date(value);
              return `${date.getHours().toString().padStart(2, "0")}:${
                date.getMinutes().toString().padStart(2, "0")
              }`;
            },
          },
          splitLine: {
            show: true,
            lineStyle: { 
              color: isDark ? "#27272a" : "#e4e4e7",
              type: "dashed",
              opacity: 0.5,
            },
          },
        },
        {
          type: "time",
          gridIndex: 1,
          axisLine: {
            show: true,
            lineStyle: { 
              color: isDark ? "#3f3f46" : "#d4d4d8",
              width: 1,
            },
          },
          axisLabel: {
            color: chartColors.textColor,
            fontSize: 10,
            formatter: (value: number) => {
              const date = new Date(value);
              return `${date.getHours().toString().padStart(2, "0")}:${
                date.getMinutes().toString().padStart(2, "0")
              }`;
            },
          },
          splitLine: {
            show: true,
            lineStyle: { 
              color: isDark ? "#27272a" : "#e4e4e7",
              type: "dashed",
              opacity: 0.5,
            },
          },
        },
      ],
      yAxis: [
        {
          scale: true,
          gridIndex: 0,
          splitLine: {
            show: true,
            lineStyle: { 
              color: isDark ? "#27272a" : "#e4e4e7",
              type: "solid",
              opacity: 0.4,
            },
          },
          axisLabel: {
            color: chartColors.textColor,
            fontSize: 11,
            fontWeight: "bold",
            formatter: (value: number) => {
              const formatted = `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
              return formatted;
            },
          },
          axisLine: {
            show: true,
            lineStyle: { 
              color: isDark ? "#3f3f46" : "#d4d4d8",
              width: 1,
            },
          },
          min: priceRange.min,
          max: priceRange.max,
        },
        {
          scale: true,
          gridIndex: 1,
          splitLine: {
            show: false,
          },
          axisLabel: {
            color: chartColors.textColor,
            fontSize: 10,
          },
          axisLine: {
            show: true,
            lineStyle: { 
              color: isDark ? "#3f3f46" : "#d4d4d8",
              width: 1,
            },
          },
        },
      ],
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: [0, 1],
          start: 0,
          end: 100,
          minValueSpan: 10,
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: "slider",
          bottom: "2%",
          start: 0,
          end: 100,
        borderColor: isDark ? "#3f3f46" : "#d4d4d8",
          backgroundColor: isDark ? "#18181b" : "#fafafa",
          fillerColor: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.25)",
          handleStyle: {
            color: "#f59e0b",
            borderColor: isDark ? "#d97706" : "#f59e0b",
            borderWidth: 2,
          },
          textStyle: {
            color: chartColors.textColor,
            fontSize: 10,
          },
          dataBackground: {
            lineStyle: {
              color: isDark ? "#52525b" : "#a1a1aa",
              opacity: 0.5,
            },
            areaStyle: {
              color: isDark ? "#27272a" : "#e4e4e7",
              opacity: 0.3,
            },
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          crossStyle: {
            color: chartColors.textColor,
          },
        },
        backgroundColor: isDark
          ? "rgba(0, 0, 0, 0.9)"
          : "rgba(255, 255, 255, 0.9)",
        borderColor: chartColors.borderColor,
        textStyle: {
          color: chartColors.textColor,
          fontSize: 11,
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return "";

          const lines: string[] = [];
          const time = params[0]?.axisValue;
          if (time) {
            const date = new Date(time);
            lines.push(
              `<div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">${date.toLocaleString()}</div>`,
            );
          }

          // Group by series type
          const lineData: any[] = [];
          let volumeData: any = null;

          params.forEach((param: any) => {
            if (param.componentSubType === "bar") {
              volumeData = param;
            } else if (param.componentSubType === "line") {
              lineData.push(param);
            }
          });

          // Sort lines by absolute value (biggest movers first)
          lineData.sort((a, b) => Math.abs(b.data[1]) - Math.abs(a.data[1]));

          // Show exchange lines
          lineData.forEach((param) => {
            const percentChange = param.data[1];
            const changeColor = percentChange >= 0 
              ? (isDark ? "#22c55e" : "#15803d")  // green-500 : green-700
              : (isDark ? "#ef4444" : "#b91c1c"); // red-500 : red-700
            lines.push(
              `<div style="display: flex; justify-content: space-between; gap: 16px; margin: 3px 0; padding: 2px 0;">`,
            );
            lines.push(`<span style="color: ${param.color}; font-size: 14px;">●</span>`);
            lines.push(
              `<span style="text-transform: capitalize; font-weight: 600;">${param.seriesName}:</span>`,
            );
            lines.push(
              `<span style="font-family: monospace; color: ${changeColor}; font-weight: bold; font-size: 12px;">${
                percentChange >= 0 ? "+" : ""
              }${percentChange.toFixed(3)}%</span>`,
            );
            lines.push(`</div>`);
          });

          // Show volume
          if (volumeData) {
            lines.push(
              `<div style="border-top: 1px solid ${chartColors.borderColor}; margin-top: 6px; padding-top: 4px; display: flex; justify-content: space-between; gap: 16px;">`,
            );
            lines.push(`<span>Volume:</span>`);
            lines.push(
              `<span style="font-family: monospace;">${
                volumeData.data.toFixed(2)
              }</span>`,
            );
            lines.push(`</div>`);
          }

          return lines.join("");
        },
      },
      series: [
        // Exchange lines with normalized data (centered at 0%)
        ...(exchangeLineSeries as any[]),
        // Volume series
        {
          name: "Volume",
          type: "bar",
          data: volumeECharts.values.map((value, index) => ({
            value,
            itemStyle: {
              color: volumeECharts.colors[index],
            },
          })),
          xAxisIndex: 1,
          yAxisIndex: 1,
        },
      ] as any[],
    };
  }, [
    chartColors,
    volumeECharts,
    exchangeData,
    normalizedExchangeData,
    priceRange,
  ]);

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
              <ReactECharts
                ref={chartRef}
                option={option}
                style={{ height: `${height}px`, width: "100%" }}
                opts={{ renderer: "canvas" }}
              />
              <MetricsPanel
                lastCandle={lastCandle}
                fairValuePrice={fairValuePrice}
                priceDeviation={priceDeviation}
                volumeValue={null}
              />

              <ChartLegend />

              <ExchangeDominanceLegend exchangeData={exchangeData} />
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default AggregatedCandles;
