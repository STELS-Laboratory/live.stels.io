/**
 * Candlestick Chart Component
 * Professional trading chart with classic colors, price line, and enhanced toolbar
 */

import { useMemo, useState, useCallback, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartLine,
  RotateCcw,
  Camera,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeCandles, useRealtimeTicker, AVAILABLE_TIMEFRAMES } from "../hooks";
import type { CandleData } from "../types";

interface CandlestickChartProps {
  symbol: string;
  exchange: string;
  market: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

// ============================================
// Crosshair Info Panel Component
// ============================================
interface CrosshairInfoProps {
  data: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
  } | null;
  colors: {
    upColor: string;
    downColor: string;
    text: string;
  };
}

function CrosshairInfo({ data, colors }: CrosshairInfoProps) {
  if (!data) return null;
  
  const isUp = data.close >= data.open;
  const color = isUp ? colors.upColor : colors.downColor;
  
  return (
    <div className="absolute top-10 left-2 z-10 flex items-center gap-3 px-2 py-1 rounded-md bg-background/90 backdrop-blur-sm border shadow-sm text-[10px]">
      <span className="text-muted-foreground">{data.date}</span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">O</span>
        <span className="font-mono" style={{ color }}>{data.open.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">H</span>
        <span className="font-mono text-trading-buy">{data.high.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">L</span>
        <span className="font-mono text-trading-sell">{data.low.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">C</span>
        <span className="font-mono" style={{ color }}>{data.close.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1">
        {isUp ? <TrendingUp className="h-3 w-3" style={{ color }} /> : <TrendingDown className="h-3 w-3" style={{ color }} />}
        <span className="font-mono" style={{ color }}>
          {data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Vol</span>
        <span className="font-mono">{formatVolume(data.volume)}</span>
      </div>
    </div>
  );
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(2) + "B";
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + "M";
  if (vol >= 1_000) return (vol / 1_000).toFixed(2) + "K";
  return vol.toFixed(2);
}

// ============================================
// Timeframe Pills Component
// ============================================
interface TimeframePillsProps {
  value: string;
  onChange: (value: string) => void;
}

function TimeframePills({ value, onChange }: TimeframePillsProps) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50">
      {AVAILABLE_TIMEFRAMES.map((tf) => (
        <button
          key={tf.value}
          onClick={() => onChange(tf.value)}
          className={cn(
            "h-6 px-2.5 text-[10px] font-medium rounded-md",
            "hover:bg-muted",
            value === tf.value
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}

// Calculate moving average
function calculateMA(candles: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j][4]; // close price
    }
    result.push(sum / period);
  }
  return result;
}

export function CandlestickChart({
  symbol,
  exchange,
  market,
  timeframe,
  onTimeframeChange,
}: CandlestickChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chartRef = useRef<ReactECharts>(null);

  // Indicator visibility state
  const [showMA7, setShowMA7] = useState(true);
  const [showMA25, setShowMA25] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  
  // Crosshair data state
  const [crosshairData, setCrosshairData] = useState<CrosshairInfoProps["data"]>(null);

  // Realtime data hooks
  const { raw: candlesData, loading: candlesLoading } = useRealtimeCandles(
    symbol,
    exchange,
    market,
    timeframe,
    { interval: 2000 }
  );

  // Get current ticker for price line
  const { raw: tickerData } = useRealtimeTicker(symbol, exchange, market, { interval: 1000 });

  // Reset zoom handler
  const handleResetZoom = useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) {
      chart.dispatchAction({
        type: "dataZoom",
        start: 50,
        end: 100,
      });
    }
  }, []);

  // Screenshot handler
  const handleScreenshot = useCallback(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) {
      const url = chart.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${symbol.replace("/", "-")}_${timeframe}_${Date.now()}.png`;
      link.href = url;
      link.click();
    }
  }, [symbol, timeframe, isDark]);

  // Process candle data for ECharts
  const chartData = useMemo(() => {
    if (!candlesData?.candles?.length) {
      return { dates: [], ohlc: [], volumes: [], ma7: [], ma25: [], lastClose: 0 };
    }

    const candles = candlesData.candles;
    const dates: string[] = [];
    const ohlc: number[][] = [];
    const volumes: number[] = [];

    for (const candle of candles) {
      const [timestamp, open, high, low, close, volume] = candle;
      const date = new Date(timestamp);
      dates.push(
        date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      // ECharts candlestick: [open, close, low, high]
      ohlc.push([open, close, low, high]);
      volumes.push(volume);
    }

    // Calculate MAs
    const ma7 = calculateMA(candles, 7);
    const ma25 = calculateMA(candles, 25);

    // Get last close price
    const lastCandle = candles[candles.length - 1];
    const lastClose = lastCandle ? lastCandle[4] : 0;

    return { dates, ohlc, volumes, ma7, ma25, lastClose };
  }, [candlesData]);

  // Current price (prefer ticker, fallback to last candle close)
  const currentPrice = tickerData?.last ?? chartData.lastClose;

  // Classic trading colors
  const colors = useMemo(
    () => ({
      background: "transparent",
      text: isDark ? "#9CA3AF" : "#6B7280",
      grid: isDark ? "#374151" : "#E5E7EB",
      // Classic green/red colors
      upColor: "#26A69A",      // Teal green (TradingView style)
      upBorder: "#26A69A",
      downColor: "#EF5350",    // Red
      downBorder: "#EF5350",
      // MA lines
      ma7: "#F59E0B",          // Amber
      ma25: "#3B82F6",         // Blue
      // Price line
      priceLine: "#FFD700",    // Gold
    }),
    [isDark]
  );

  // ECharts options
  const chartOptions = useMemo(() => {
    if (!chartData.dates.length) return {};

    return {
      backgroundColor: "transparent",
      animation: false,
      tooltip: {
        trigger: "axis",
        confine: true,
        axisPointer: {
          type: "cross",
          crossStyle: { color: colors.text },
          link: [{ xAxisIndex: "all" }],
          label: {
            backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
            color: colors.text,
          },
        },
        backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
        borderColor: colors.grid,
        borderWidth: 1,
        textStyle: { color: colors.text, fontSize: 11 },
        padding: [6, 10],
        formatter: (params: Array<{ seriesName: string; value: number | number[] | undefined; color: string; marker: string }>) => {
          if (!params || !Array.isArray(params) || params.length === 0) return "";
          
          let result = "";
          for (const param of params) {
            if (!param || param.value === undefined || param.value === null) continue;
            
            if (param.seriesName === "Candles" && Array.isArray(param.value) && param.value.length >= 4) {
              const [open, close, low, high] = param.value;
              if (typeof open !== "number" || typeof close !== "number") continue;
              const change = close - open;
              const changePercent = open !== 0 ? ((change / open) * 100).toFixed(2) : "0.00";
              const isUp = close >= open;
              result += `<div style="margin-bottom: 4px;">`;
              result += `<span style="color: ${colors.text}">O:</span> <span style="color: ${isUp ? colors.upColor : colors.downColor}">${open.toLocaleString()}</span><br/>`;
              result += `<span style="color: ${colors.text}">H:</span> <span style="color: ${colors.upColor}">${high.toLocaleString()}</span><br/>`;
              result += `<span style="color: ${colors.text}">L:</span> <span style="color: ${colors.downColor}">${low.toLocaleString()}</span><br/>`;
              result += `<span style="color: ${colors.text}">C:</span> <span style="color: ${isUp ? colors.upColor : colors.downColor}">${close.toLocaleString()}</span><br/>`;
              result += `<span style="color: ${colors.text}">Chg:</span> <span style="color: ${isUp ? colors.upColor : colors.downColor}">${isUp ? "+" : ""}${changePercent}%</span>`;
              result += `</div>`;
            } else if (param.seriesName === "Volume" && typeof param.value === "number") {
              result += `<div style="color: ${colors.text}">Vol: ${param.value.toLocaleString()}</div>`;
            } else if (typeof param.value === "number" && param.seriesName !== "Price") {
              result += `<div>${param.marker} ${param.seriesName}: ${param.value.toFixed(2)}</div>`;
            }
          }
          return result;
        },
      },
      legend: {
        data: [
          ...(showMA7 ? ["MA7"] : []),
          ...(showMA25 ? ["MA25"] : []),
        ],
        top: 4,
        right: 60,
        itemWidth: 14,
        itemHeight: 2,
        textStyle: { color: colors.text, fontSize: 10 },
      },
      grid: [
        {
          left: 8,
          right: 60,
          top: 24,
          bottom: 56,
        },
        {
          left: 8,
          right: 60,
          height: 28,
          bottom: 26,
        },
      ],
      xAxis: [
        {
          type: "category",
          data: chartData.dates,
          boundaryGap: true,
          axisLine: { lineStyle: { color: colors.grid } },
          axisLabel: { color: colors.text, fontSize: 9, margin: 8 },
          splitLine: { show: false },
          axisTick: { show: false },
        },
        {
          type: "category",
          gridIndex: 1,
          data: chartData.dates,
          boundaryGap: true,
          axisLine: { lineStyle: { color: colors.grid } },
          axisLabel: { show: false },
          splitLine: { show: false },
          axisTick: { show: false },
        },
      ],
      yAxis: [
        {
          scale: true,
          splitArea: { show: false },
          position: "right",
          axisLine: { show: false },
          axisLabel: { 
            color: colors.text, 
            fontSize: 9,
            formatter: (value: number) => value.toLocaleString(),
          },
          splitLine: { 
            lineStyle: { color: colors.grid, type: "dashed", opacity: 0.3 } 
          },
          axisTick: { show: false },
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          position: "right",
          axisLine: { show: false },
          axisLabel: {
            color: colors.text,
            fontSize: 9,
            formatter: (value: number) => {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
              if (value >= 1000) return (value / 1000).toFixed(1) + "K";
              return value.toFixed(0);
            },
          },
          splitLine: { show: false },
          axisTick: { show: false },
        },
      ],
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: [0, 1],
          start: 50,
          end: 100,
        },
      ],
      series: [
        {
          name: "Candles",
          type: "candlestick",
          data: chartData.ohlc,
          itemStyle: {
            color: colors.upColor,
            color0: colors.downColor,
            borderColor: colors.upBorder,
            borderColor0: colors.downBorder,
            borderWidth: 1,
          },
          // Current price line
          markLine: currentPrice > 0 ? {
            symbol: "none",
            animation: false,
            silent: true,
            lineStyle: {
              color: colors.priceLine,
              width: 1,
              type: "solid",
            },
            label: {
              show: true,
              position: "end",
              formatter: () => currentPrice.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              }),
              backgroundColor: colors.priceLine,
              color: "#000000",
              fontSize: 10,
              fontWeight: "bold",
              padding: [2, 6],
              borderRadius: 2,
            },
            data: [
              {
                yAxis: currentPrice,
              },
            ],
          } : undefined,
        },
        ...(showMA7 ? [{
          name: "MA7",
          type: "line",
          data: chartData.ma7,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: colors.ma7 },
        }] : []),
        ...(showMA25 ? [{
          name: "MA25",
          type: "line",
          data: chartData.ma25,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: colors.ma25 },
        }] : []),
        ...(showVolume ? [{
          name: "Volume",
          type: "bar",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: chartData.volumes.map((vol, idx) => ({
            value: vol,
            itemStyle: {
              color: chartData.ohlc[idx][1] >= chartData.ohlc[idx][0] 
                ? colors.upColor 
                : colors.downColor,
              opacity: 0.5,
            },
          })),
        }] : []),
      ],
    };
  }, [chartData, colors, isDark, currentPrice, showMA7, showMA25, showVolume]);

  // Handle chart events for crosshair - use updateAxisPointer instead of mousemove
  const onChartEvents = useMemo(() => ({
    updateAxisPointer: (params: { dataIndex?: number; axesInfo?: Array<{ axisDim: string; value: number }> }) => {
      const dataIndex = params.dataIndex;
      if (
        dataIndex !== undefined && 
        dataIndex >= 0 && 
        dataIndex < chartData.ohlc.length &&
        chartData.ohlc[dataIndex]
      ) {
        const ohlc = chartData.ohlc[dataIndex];
        if (ohlc && ohlc.length >= 4) {
          const [open, close, low, high] = ohlc;
          const volume = chartData.volumes[dataIndex] ?? 0;
          const change = close - open;
          const changePercent = open !== 0 ? (change / open) * 100 : 0;
          
          setCrosshairData({
            date: chartData.dates[dataIndex] ?? "",
            open,
            high,
            low,
            close,
            volume,
            change,
            changePercent,
          });
        }
      }
    },
    globalout: () => {
      setCrosshairData(null);
    },
  }), [chartData]);

  if (candlesLoading && !candlesData) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-9 border-b px-3 flex items-center">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex-1">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Enhanced Toolbar */}
      <div className="h-9 border-b px-2 flex items-center gap-2 shrink-0 bg-muted/30">
        {/* Timeframe Pills */}
        <TimeframePills value={timeframe} onChange={onTimeframeChange} />
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Current Price Badge */}
        {currentPrice > 0 && (
          <Badge 
            variant="outline"
            className={cn(
              "h-6 px-2.5 font-mono font-bold text-xs border-0 rounded-md",
              "shadow-sm",
              (tickerData?.percentage ?? 0) >= 0 
                ? "bg-trading-buy/20 text-trading-buy"
                : "bg-trading-sell/20 text-trading-sell"
            )}
          >
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Badge>
        )}

        {/* Indicators Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5 rounded-md">
              <ChartLine className="h-3.5 w-3.5" />
              <span className="text-xs">Indicators</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">Moving Averages</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={showMA7}
              onCheckedChange={setShowMA7}
              className="text-xs"
            >
              <span className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma7 }} />
                MA 7
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showMA25}
              onCheckedChange={setShowMA25}
              className="text-xs"
            >
              <span className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.ma25 }} />
                MA 25
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Overlays</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={showVolume}
              onCheckedChange={setShowVolume}
              className="text-xs"
            >
              Volume Bars
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Chart Controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={handleResetZoom}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset Zoom</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={handleScreenshot}
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save Screenshot</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Crosshair Info Panel */}
      <CrosshairInfo data={crosshairData} colors={colors} />

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {chartData.dates.length > 0 ? (
          <ReactECharts
            ref={chartRef}
            option={chartOptions}
            style={{ height: "100%", width: "100%" }}
            notMerge={true}
            lazyUpdate={true}
            onEvents={onChartEvents}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            No data for {symbol}
          </div>
        )}
      </div>
    </div>
  );
}
