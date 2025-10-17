import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CandlestickData,
  DeepPartial,
  HistogramData,
  IChartApi,
  ISeriesApi,
  LineData,
  LineWidth,
  UTCTimestamp,
} from "lightweight-charts";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
} from "lightweight-charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useChartColors } from "@/hooks/useChartColors";

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  exchange: string;
  market: string;
}

interface ExchangeData {
  exchange: string;
  candles: CandleData[];
  liquidity: number;
  color: string;
  dominance?: number;
  marketShare?: number;
}

interface AggregatedCandlesProps {
  candlesData: CandleData[];
  orderBookData: Array<{
    exchange: string;
    market: string;
    bids: [number, number][];
    asks: [number, number][];
    volume: [number, number];
    timestamp: number;
    latency: number;
  }>;
  selectedMarket: string;
  height?: number;
}

// Generate colors based on liquidity ranking
const generateLiquidityColors = (
  exchanges: Array<{ exchange: string; liquidity: number }>,
): { [exchange: string]: string } => {
  const sortedExchanges = [...exchanges].sort((a, b) =>
    b.liquidity - a.liquidity
  );
  const colors: { [exchange: string]: string } = {};

  // Professional trading colors based on liquidity ranking
  // Using different shades to clearly distinguish exchanges
  const colorPalette = [
    "#f59e0b", // amber-500 - highest liquidity (brightest)
    "#eab308", // amber-400
    "#fbbf24", // amber-300
    "#fcd34d", // amber-200
    "#fde68a", // amber-100
    "#84cc16", // lime-500 - medium liquidity
    "#22c55e", // green-500
    "#10b981", // emerald-500
    "#06b6d4", // cyan-500
    "#3b82f6", // blue-500
    "#6366f1", // indigo-500
    "#8b5cf6", // violet-500
    "#a855f7", // purple-500
    "#d946ef", // fuchsia-500
    "#ec4899", // pink-500
    "#f43f5e", // rose-500
    "#ef4444", // red-500
    "#f97316", // orange-500
    "#a3a3a3", // zinc-400 - lowest liquidity
    "#737373", // zinc-500
  ];

  sortedExchanges.forEach((ex, index) => {
    colors[ex.exchange] = colorPalette[index] || "#6b7280"; // fallback to zinc-500
  });

  return colors;
};

// Calculate comprehensive liquidity metrics for regulatory analysis
const calculateExchangeLiquidity = (
  orderBookData: AggregatedCandlesProps["orderBookData"],
  selectedMarket: string,
): Array<{
  exchange: string;
  liquidity: number;
  marketShare: number;
  dominance: number;
  depth: number;
  spread: number;
}> => {
  const marketData = orderBookData.filter((item) =>
    item.market === selectedMarket
  );

  const exchangeMetrics = marketData.map((item) => {
    const bidLiquidity = item.bids.reduce(
      (sum, [price, volume]) => sum + (price * volume),
      0,
    );
    const askLiquidity = item.asks.reduce(
      (sum, [price, volume]) => sum + (price * volume),
      0,
    );

    // Calculate order book depth (number of levels)
    const depth = item.bids.length + item.asks.length;

    // Calculate spread
    const bestBid = item.bids.length > 0 ? item.bids[0][0] : 0;
    const bestAsk = item.asks.length > 0 ? item.asks[0][0] : 0;
    const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;

    return {
      exchange: item.exchange,
      liquidity: bidLiquidity + askLiquidity,
      depth,
      spread,
      marketShare: 0, // Will be calculated below
      dominance: 0, // Will be calculated below
    };
  });

  // Calculate total market liquidity
  const totalLiquidity = exchangeMetrics.reduce(
    (sum, ex) => sum + ex.liquidity,
    0,
  );

  // Calculate market share and dominance
  return exchangeMetrics.map((ex) => {
    const marketShare = totalLiquidity > 0
      ? (ex.liquidity / totalLiquidity) * 100
      : 0;

    // Dominance calculation: based on market share and liquidity depth
    const depthFactor = Math.min(ex.depth / 20, 1); // Normalize depth to 20 levels
    // Simplified dominance calculation without arbitrary weights
    const dominance = marketShare * (1 + depthFactor * 0.1);

    return {
      ...ex,
      marketShare,
      dominance,
    };
  }).sort((a, b) => b.dominance - a.dominance);
};

const AggregatedCandles: React.FC<AggregatedCandlesProps> = ({
  candlesData,
  orderBookData,
  selectedMarket,
  height = 400,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lineSeriesRefs = useRef<{ [exchange: string]: ISeriesApi<"Line"> }>({});
  const fairValueLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const chartColors = useChartColors();

  const [crosshair, setCrosshair] = useState<{
    price: number | null;
    volume: number | null;
    time: number | null;
  }>({ price: null, volume: null, time: null });

  // Group candles by exchange with regulatory focus on dominance
  const exchangeData: ExchangeData[] = useMemo(() => {
    const liquidityData = calculateExchangeLiquidity(
      orderBookData,
      selectedMarket,
    );
    const liquidityColors = generateLiquidityColors(liquidityData);

    // Get exchanges from order book data for the selected market
    const marketExchanges = orderBookData
      .filter((item) => item.market === selectedMarket)
      .map((item) => item.exchange);

    // Filter candles data by selected market first
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
          color: "#6b7280",
        };
      }

      const { liquidity, dominance, marketShare } = exchangeMetrics;
      const color = liquidityColors[exchange] || "#6b7280";

      // Filter candles for this specific market and exchange
      const exchangeSpecificCandles = marketCandles.filter((candle) =>
        candle.exchange === exchange
      );

      // Use filtered candles for this specific exchange
      const baseCandles = exchangeSpecificCandles.slice(
        0,
        Math.min(100, exchangeSpecificCandles.length),
      );

      // Use actual candle data without artificial variations
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

  // Create liquidity-weighted aggregated candles for regulatory analysis
  const aggregatedCandles: CandlestickData[] = useMemo(() => {
    if (exchangeData.length === 0) return [];

    // Group candles by timestamp with dominance weighting
    const timeGroups: {
      [timestamp: number]: { candle: CandleData; weight: number }[];
    } = {};

    exchangeData.forEach(({ candles, marketShare }) => {
      // Use market share as the primary weight (more reliable than dominance)
      const weight = (marketShare || 0) / 100;

      candles.forEach((candle) => {
        const timestamp = Math.floor(candle.timestamp / 60000) * 60000; // Round to minute
        if (!timeGroups[timestamp]) {
          timeGroups[timestamp] = [];
        }
        timeGroups[timestamp].push({ candle, weight });
      });
    });

    return Object.entries(timeGroups)
      .map(([timestamp, weightedCandles]) => {
        // Sort by timestamp first
        const sortedCandles = weightedCandles.sort((a, b) =>
          a.candle.timestamp - b.candle.timestamp
        );

        // Calculate weighted averages for OHLC
        const totalWeight = weightedCandles.reduce(
          (sum, wc) => sum + wc.weight,
          0,
        );

        if (totalWeight === 0) {
          // Fallback to simple average if no weights
          const open = sortedCandles[0].candle.open;
          const close = sortedCandles[sortedCandles.length - 1].candle.close;
          const high = Math.max(...sortedCandles.map((wc) => wc.candle.high));
          const low = Math.min(...sortedCandles.map((wc) => wc.candle.low));

          return {
            time: Math.floor(parseInt(timestamp) / 1000) as UTCTimestamp,
            open,
            high,
            low,
            close,
          };
        }

        // Weighted aggregation - dominant exchanges have more influence
        const weightedOpen = sortedCandles.reduce((sum, wc) =>
          sum + wc.candle.open * wc.weight, 0) / totalWeight;
        const weightedClose = sortedCandles.reduce((sum, wc) =>
          sum + wc.candle.close * wc.weight, 0) / totalWeight;
        const weightedHigh = sortedCandles.reduce((sum, wc) =>
          sum + wc.candle.high * wc.weight, 0) / totalWeight;
        const weightedLow = sortedCandles.reduce((sum, wc) =>
          sum + wc.candle.low * wc.weight, 0) / totalWeight;

        return {
          time: Math.floor(parseInt(timestamp) / 1000) as UTCTimestamp,
          open: weightedOpen,
          high: weightedHigh,
          low: weightedLow,
          close: weightedClose,
        };
      })
      .sort((a, b) => a.time - b.time);
  }, [exchangeData]);

  // Create dominance-weighted volume data for regulatory analysis
  const volumeData: HistogramData[] = useMemo(() => {
    if (exchangeData.length === 0) return [];

    const timeGroups: {
      [timestamp: number]: { candle: CandleData; weight: number }[];
    } = {};

    exchangeData.forEach(({ candles, marketShare }) => {
      // Use market share as the primary weight for volume calculation
      const weight = (marketShare || 0) / 100;

      candles.forEach((candle) => {
        const timestamp = Math.floor(candle.timestamp / 60000) * 60000;
        if (!timeGroups[timestamp]) {
          timeGroups[timestamp] = [];
        }
        timeGroups[timestamp].push({ candle, weight });
      });
    });

    return Object.entries(timeGroups)
      .map(([timestamp, weightedCandles]) => {
        const totalWeight = weightedCandles.reduce(
          (sum, wc) => sum + wc.weight,
          0,
        );
        const weightedVolume = totalWeight > 0
          ? weightedCandles.reduce(
            (sum, wc) => sum + wc.candle.volume * wc.weight,
            0,
          ) / totalWeight
          : weightedCandles.reduce((sum, wc) => sum + wc.candle.volume, 0);

        const weightedClose = totalWeight > 0
          ? weightedCandles.reduce(
            (sum, wc) => sum + wc.candle.close * wc.weight,
            0,
          ) / totalWeight
          : weightedCandles.reduce((sum, wc) => sum + wc.candle.close, 0) /
            weightedCandles.length;

        const weightedOpen = totalWeight > 0
          ? weightedCandles.reduce(
            (sum, wc) => sum + wc.candle.open * wc.weight,
            0,
          ) / totalWeight
          : weightedCandles.reduce((sum, wc) => sum + wc.candle.open, 0) /
            weightedCandles.length;

        return {
          time: Math.floor(parseInt(timestamp) / 1000) as UTCTimestamp,
          value: weightedVolume,
          color: weightedClose >= weightedOpen
            ? "rgba(22,163,74,0.35)"
            : "rgba(220,38,38,0.35)",
        };
      })
      .sort((a, b) => a.time - b.time);
  }, [exchangeData]);

  // Create exchange line data
  const exchangeLineData: { [exchange: string]: LineData[] } = useMemo(() => {
    const result: { [exchange: string]: LineData[] } = {};

    exchangeData.forEach(({ exchange, candles }) => {
      result[exchange] = candles.map((candle) => ({
        time: Math.floor(candle.timestamp / 1000) as UTCTimestamp,
        value: candle.close,
      }));
    });

    return result;
  }, [exchangeData]);

  // Create chart
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        textColor: chartColors.textColor,
        background: { type: ColorType.Solid, color: chartColors.background },
      },
      grid: {
        vertLines: { color: chartColors.gridColor, style: 0 },
        horzLines: { color: chartColors.gridColor, style: 0 },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        borderColor: chartColors.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: chartColors.borderColor,
      },
    });

    // Add candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartColors.upColor,
      downColor: chartColors.downColor,
      wickUpColor: chartColors.upColor,
      wickDownColor: chartColors.downColor,
      borderVisible: false,
    });

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "left",
      base: 0,
      color: chartColors.volumeColor,
    });

    // Add fair value line series
    const fairValueLine = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      lineStyle: 2, // Dashed line
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      priceLineColor: "#f59e0b",
      priceLineWidth: 1,
      priceLineStyle: 2,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    fairValueLineRef.current = fairValueLine;

    // Crosshair legend
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setCrosshair({ price: null, volume: null, time: null });
        return;
      }

      const t = typeof param.time === "number" ? param.time : null;
      const cs = candleSeriesRef.current
        ? (param.seriesData.get(candleSeriesRef.current) as unknown)
        : null;
      const hs = volumeSeriesRef.current
        ? (param.seriesData.get(volumeSeriesRef.current) as unknown)
        : null;

      const price = cs && typeof (cs as { close: number }).close === "number"
        ? (cs as { close: number }).close
        : null;
      const volume = hs && typeof (hs as { value: number }).value === "number"
        ? (hs as { value: number }).value
        : null;

      setCrosshair({ price, volume, time: t });
    });

    // Resize handling
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const cr = entry.contentRect;
          chart.applyOptions({ width: cr.width, height });
        }
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      fairValueLineRef.current = null;
      lineSeriesRefs.current = {};
    };
  }, [height, chartColors]);

  // Update chart colors when theme changes
  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      layout: {
        textColor: chartColors.textColor,
        background: { type: ColorType.Solid, color: chartColors.background },
      },
      grid: {
        vertLines: { color: chartColors.gridColor, style: 0 },
        horzLines: { color: chartColors.gridColor, style: 0 },
      },
      timeScale: {
        borderColor: chartColors.borderColor,
      },
      rightPriceScale: {
        borderColor: chartColors.borderColor,
      },
    });
  }, [chartColors]);

  // Update series data
  useEffect(() => {
    if (
      !chartRef.current || !candleSeriesRef.current ||
      !volumeSeriesRef.current || !fairValueLineRef.current
    ) return;

    // Update candlestick data
    candleSeriesRef.current.setData(aggregatedCandles);

    // Update volume data
    volumeSeriesRef.current.setData(volumeData);

    // Update exchange line series
    Object.keys(lineSeriesRefs.current).forEach((exchange) => {
      if (!exchangeLineData[exchange]) {
        chartRef.current?.removeSeries(lineSeriesRefs.current[exchange]);
        delete lineSeriesRefs.current[exchange];
      }
    });

    exchangeData.forEach(({ exchange, color, dominance, marketShare }) => {
      if (!lineSeriesRefs.current[exchange] && exchangeLineData[exchange]) {
        // Calculate line width based on dominance (higher dominance = thicker line)
        const maxDominance = Math.max(
          ...exchangeData.map((e) => e.dominance || 0),
        );
        const dominanceRatio = (dominance || 0) / maxDominance;
        const lineWidth = Math.max(1, Math.min(5, 1 + dominanceRatio * 4));

        // Calculate opacity based on market share
        const opacity = Math.max(
          0.3,
          Math.min(1, 0.3 + (marketShare || 0) / 100 * 0.7),
        );
        const colorWithOpacity = color +
          Math.floor(opacity * 255).toString(16).padStart(2, "0");

        const clampedLineWidth = Math.max(
          1,
          Math.min(5, Math.round(lineWidth)),
        );
        const lineSeries = chartRef.current!.addSeries(LineSeries, {
          color: colorWithOpacity,
          lineWidth: clampedLineWidth as unknown as DeepPartial<LineWidth>,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: Math.max(
            2,
            Math.min(6, 2 + dominanceRatio * 4),
          ),
        });
        lineSeriesRefs.current[exchange] = lineSeries;
      }

      if (lineSeriesRefs.current[exchange] && exchangeLineData[exchange]) {
        lineSeriesRefs.current[exchange].setData(exchangeLineData[exchange]);
      }
    });

    chartRef.current.timeScale().fitContent();
  }, [aggregatedCandles, volumeData, exchangeLineData, exchangeData]);

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

  // Calculate fair value price based on liquidity-weighted analysis
  const fairValuePrice = useMemo(() => {
    if (exchangeData.length === 0 || !lastCandle) return null;

    // Only calculate fair value for the selected market
    const marketExchangeData = exchangeData.filter((ex) =>
      ex.candles.length > 0 &&
      ex.candles.some((candle) => candle.market === selectedMarket)
    );

    if (marketExchangeData.length === 0) return lastCandle.close;

    // Calculate liquidity-weighted average price from exchanges for this market
    const totalLiquidity = marketExchangeData.reduce(
      (sum, ex) => sum + ex.liquidity,
      0,
    );
    if (totalLiquidity === 0) return lastCandle.close;

    // Weight by liquidity only (more reliable than dominance)
    const weightedPrice = marketExchangeData.reduce((sum, ex) => {
      const weight = ex.liquidity / totalLiquidity;
      const exchangePrice = ex.candles.length > 0
        ? ex.candles[ex.candles.length - 1].close
        : lastCandle.close;
      return sum + (exchangePrice * weight);
    }, 0);

    const totalWeight = marketExchangeData.reduce((sum, ex) => {
      return sum + (ex.liquidity / totalLiquidity);
    }, 0);

    return totalWeight > 0 ? weightedPrice / totalWeight : lastCandle.close;
  }, [exchangeData, lastCandle, selectedMarket]);

  // Calculate price deviation from fair value
  const priceDeviation = useMemo(() => {
    if (!lastCandle || !fairValuePrice || fairValuePrice === 0) return 0;
    return ((lastCandle.close - fairValuePrice) / fairValuePrice) * 100;
  }, [lastCandle, fairValuePrice]);

  // Helper function to calculate Gini coefficient (corrected formula)
  const calculateGiniCoefficient = useCallback((values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0;

    // Correct Gini coefficient formula: G = (2 * Σ(i * x_i)) / (n * Σ(x_i)) - (n + 1) / n
    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (i + 1) * sorted[i];
    }
    return (2 * gini) / (n * sum) - (n + 1) / n;
  }, []);

  // Calculate market efficiency score (0-100)
  const marketEfficiency = useMemo(() => {
    if (exchangeData.length === 0) return 0;

    // Filter exchange data for the selected market only
    const marketExchangeData = exchangeData.filter((ex) =>
      ex.candles.length > 0 &&
      ex.candles.some((candle) => candle.market === selectedMarket)
    );

    if (marketExchangeData.length === 0) return 0;

    // Calculate total liquidity for weighting
    const totalLiquidity = marketExchangeData.reduce(
      (sum, ex) => sum + ex.liquidity,
      0,
    );

    // Calculate price convergence efficiency
    const priceVariance = marketExchangeData.reduce((sum, ex) => {
      if (ex.candles.length === 0) return sum;
      const exchangePrice = ex.candles[ex.candles.length - 1].close;
      const deviation = Math.abs(exchangePrice - (fairValuePrice || 0));
      return sum + deviation * (ex.liquidity / totalLiquidity); // Weight by relative liquidity
    }, 0);

    const avgPrice = fairValuePrice || 0;
    const priceEfficiency = avgPrice > 0
      ? Math.max(0, 100 - (priceVariance / avgPrice) * 1000)
      : 0;

    // Liquidity distribution efficiency
    const liquidityGini = calculateGiniCoefficient(
      marketExchangeData.map((ex) => ex.liquidity),
    );
    const liquidityEfficiency = (1 - liquidityGini) * 100;

    // Market concentration efficiency (prefer more balanced markets)
    const marketShareVariance = marketExchangeData.reduce((sum, ex) => {
      const marketShare = ex.marketShare || 0;
      const avgMarketShare = marketExchangeData.reduce((s, e) =>
        s + (e.marketShare || 0), 0) / marketExchangeData.length;
      return sum + Math.pow(marketShare - avgMarketShare, 2);
    }, 0);
    const concentrationEfficiency = Math.max(
      0,
      100 - Math.sqrt(marketShareVariance) * 2,
    );

    return (priceEfficiency * 0.5 + liquidityEfficiency * 0.3 +
      concentrationEfficiency * 0.2);
  }, [exchangeData, fairValuePrice, calculateGiniCoefficient, selectedMarket]);

  // Update fair value line separately
  useEffect(() => {
    if (
      fairValueLineRef.current && fairValuePrice && aggregatedCandles.length > 0
    ) {
      const fairValueData = aggregatedCandles.map((candle) => ({
        time: candle.time,
        value: fairValuePrice,
      }));
      fairValueLineRef.current.setData(fairValueData);
    }
  }, [fairValuePrice, aggregatedCandles]);

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
              <span className="text-muted-foreground">Dominance-weighted</span>
              <span className="mx-2 text-muted-foreground">|</span>
              <span className="text-blue-500">
                Filtered: {selectedMarket}
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
              {/* Current Price */}
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

              {/* Fair Value Price */}
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

            {/* Market Efficiency Score */}
            <div className="mt-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  MARKET EFFICIENCY
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        marketEfficiency >= 80
                          ? "bg-green-500"
                          : marketEfficiency >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${
                          Math.min(100, Math.max(0, marketEfficiency))
                        }%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono ${
                      marketEfficiency >= 80
                        ? "text-green-500"
                        : marketEfficiency >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {marketEfficiency.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
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
              <div
                ref={containerRef}
                className="w-full border-0"
                style={{ height }}
                aria-label="Aggregated candlestick chart"
                role="img"
              />
              <div className="w-full bg-card/50 p-3 rounded border">
                <div className="grid grid-cols-2 gap-4">
                  {/* OHLC Data */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                      OHLC DATA
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">O:</span>
                        <span className="font-mono text-card-foreground">
                          {lastCandle?.open.toFixed(2) ?? "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">H:</span>
                        <span className="font-mono text-green-400">
                          {lastCandle?.high.toFixed(2) ?? "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">L:</span>
                        <span className="font-mono text-red-400">
                          {lastCandle?.low.toFixed(2) ?? "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">C:</span>
                        <span className="font-mono text-amber-500">
                          {lastCandle?.close.toFixed(2) ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fair Value & Deviation */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                      FAIR VALUE ANALYSIS
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Fair Value:
                        </span>
                        <span className="font-mono text-amber-500">
                          {fairValuePrice?.toFixed(2) ?? "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Deviation:
                        </span>
                        <span
                          className={`font-mono ${
                            Math.abs(priceDeviation) < 1
                              ? "text-green-500"
                              : Math.abs(priceDeviation) < 3
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        >
                          {priceDeviation >= 0 ? "+" : ""}
                          {priceDeviation.toFixed(2)}%
                        </span>
                      </div>
                      {crosshair.volume !== null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="font-mono text-card-foreground">
                            {crosshair.volume.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="w-full mt-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Chart Legend
                  </div>
                  <div className="flex items-center gap-4 text-[10px]">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-0.5 bg-amber-500"
                        style={{ borderStyle: "dashed" }}
                      />
                      <span className="text-amber-500">Fair Value</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-green-500" />
                      <span className="text-green-500">Candles</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-0.5 bg-muted" />
                      <span className="text-muted-foreground">Volume</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regulatory Exchange Dominance Legend */}
              <div className="w-full mt-2 pt-2 border-t border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Exchange Dominance Analysis (Regulatory View)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {exchangeData.slice(0, 6).map((
                    { exchange, color, dominance, marketShare },
                    index,
                  ) => {
                    const maxDominance = Math.max(
                      ...exchangeData.map((e) => e.dominance || 0),
                    );
                    const dominanceRatio = (dominance || 0) / maxDominance;
                    const lineWidth = Math.max(
                      1,
                      Math.min(5, 1 + dominanceRatio * 4),
                    );

                    const isDominant = index === 0;
                    const isSignificant = (marketShare || 0) > 15;

                    return (
                      <div
                        key={exchange}
                        className={`flex items-center gap-2 p-2 rounded border ${
                          isDominant
                            ? "bg-amber-500/10 border-amber-500/30"
                            : isSignificant
                            ? "bg-muted/50 border-border"
                            : "bg-card/50 border-border"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className="rounded"
                            style={{
                              backgroundColor: color,
                              width: `${lineWidth * 3}px`,
                              height: `${lineWidth}px`,
                            }}
                          />
                          {isDominant && (
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[9px] capitalize font-medium ${
                                isDominant
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {exchange}
                            </span>
                            {isDominant && (
                              <span className="text-[7px] bg-amber-500 text-black dark:text-black px-1 rounded font-bold">
                                LEADER
                              </span>
                            )}
                          </div>
                          <div className="text-[8px] text-muted-foreground">
                            {marketShare?.toFixed(1)}% | Dom:{" "}
                            {dominance?.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Market Concentration Warning */}
                {exchangeData.length > 0 &&
                  (exchangeData[0].marketShare || 0) > 40 && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                    <div className="text-[9px] text-red-400 font-semibold uppercase tracking-wider">
                      ⚠️ High Market Concentration
                    </div>
                    <div className="text-[8px] text-red-300 mt-1">
                      {exchangeData[0].exchange} controls{" "}
                      {exchangeData[0].marketShare?.toFixed(1)}% of market
                      liquidity
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default AggregatedCandles;
