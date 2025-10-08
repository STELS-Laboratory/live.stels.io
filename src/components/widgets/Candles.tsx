import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
	CandlestickData,
	HistogramData,
	IChartApi,
	ISeriesApi,
	UTCTimestamp,
} from "lightweight-charts";
import {
	CandlestickSeries,
	ColorType,
	createChart,
	CrosshairMode,
	HistogramSeries,
} from "lightweight-charts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useChartColors } from "@/hooks/useChartColors";

interface RawCandles {
	exchange: string;
	market: string;
	timeframe: string;
	candles: number[][];
	timestamp: number;
	latency: number;
}

interface CandlesWidgetProps {
	raw: unknown;
	height?: number;
}

type CandleBar = CandlestickData & { volume: number };

/**
 * Candlestick chart widget using lightweight-charts.
 * Renders OHLC candles with synced volume histogram.
 */
function Candles({ raw, height = 220 }: CandlesWidgetProps): ReactElement {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
	const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
	const chartColors = useChartColors();

	const [crosshair, setCrosshair] = useState<{
		price: number | null;
		volume: number | null;
		time: number | null;
	}>({ price: null, volume: null, time: null });

	const parsed: RawCandles | null = useMemo((): RawCandles | null => {
		if (!raw || typeof raw !== "object") return null;
		const r = raw as Record<string, unknown>;
		const exchange = typeof r.exchange === "string" ? r.exchange : "";
		const market = typeof r.market === "string" ? r.market : "";
		const timeframe = typeof r.timeframe === "string" ? r.timeframe : "";
		const candles = Array.isArray(r.candles) ? (r.candles as unknown[]) : [];
		const timestamp = typeof r.timestamp === "number"
			? r.timestamp
			: Date.now();
		const latency = typeof r.latency === "number" ? r.latency : 0;
		return {
			exchange,
			market,
			timeframe,
			candles: candles.filter((c) => Array.isArray(c)).map((c) =>
				c as number[]
			),
			timestamp,
			latency,
		};
	}, [raw]);

	const bars: CandleBar[] = useMemo((): CandleBar[] => {
		if (!parsed) return [];
		return parsed.candles
			.filter((c) => c.length >= 6)
			.map((c) => {
				const t = Math.floor(c[0] / 1000) as UTCTimestamp; // ms -> s
				return {
					time: t,
					open: c[1],
					high: c[2],
					low: c[3],
					close: c[4],
					volume: c[5],
				} satisfies CandleBar;
			});
	}, [parsed]);

	const last = bars.length > 0 ? bars[bars.length - 1] : null;
	const firstClose = bars.length > 0 ? bars[0].close : null;
	const changePct = useMemo(() => {
		if (!last || firstClose === null || firstClose === 0) return 0;
		return ((last.close - firstClose) / firstClose) * 100;
	}, [last, firstClose]);

	// Create chart once
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

		const candleSeries = chart.addSeries(CandlestickSeries, {
			upColor: chartColors.upColor,
			downColor: chartColors.downColor,
			wickUpColor: chartColors.upColor,
			wickDownColor: chartColors.downColor,
			borderVisible: false,
		});

		const volumeSeries = chart.addSeries(HistogramSeries, {
			priceFormat: { type: "volume" },
			priceScaleId: "left",
			base: 0,
			color: chartColors.volumeColor,
		});

		chartRef.current = chart;
		candleSeriesRef.current = candleSeries;
		volumeSeriesRef.current = volumeSeries;

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

	// Update series data when bars change
	useEffect(() => {
		if (
			!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current
		) return;
		if (bars.length === 0) {
			candleSeriesRef.current.setData([]);
			volumeSeriesRef.current.setData([]);
			return;
		}

		candleSeriesRef.current.setData(
			bars.map((b) => ({
				time: b.time,
				open: b.open,
				high: b.high,
				low: b.low,
				close: b.close,
			})),
		);

		const volumeData: HistogramData[] = bars.map((b) => ({
			time: b.time,
			value: b.volume,
			color: b.close >= b.open
				? "rgba(22,163,74,0.35)"
				: "rgba(220,38,38,0.35)",
		}));
		volumeSeriesRef.current.setData(volumeData);
		chartRef.current.timeScale().fitContent();
	}, [bars]);

	const title = parsed?.market ?? "";
	const ex = parsed?.exchange ?? "";
	const tf = parsed?.timeframe ?? "";
	const latency = parsed?.latency ?? 0;

	return (
		<Card className="w-[520px] h-[330px] border-0">
			<CardHeader>
				<div className="flex items-center justify-between gap-3">
					<div>
						<CardTitle className="text-sm flex items-center gap-2">
							<div className="h-4 w-1 bg-amber-500 rounded" />
							<span className="text-amber-500 font-medium tracking-widest uppercase">
								{title}
							</span>
						</CardTitle>
						<CardDescription className="mt-1 text-[11px]">
							<span className="capitalize">{ex}</span>
							<span className="mx-2 text-muted-foreground">|</span>
							<span className="uppercase">{tf}</span>
							<span className="mx-2 text-muted-foreground">|</span>
							<span className="text-muted-foreground">{latency}ms</span>
						</CardDescription>
					</div>
					<div className="text-right">
						<div
							className={`font-mono text-sm ${
								changePct >= 0 ? "text-green-500" : "text-red-500"
							}`}
						>
							{last ? last.close.toFixed(2) : "-"}
						</div>
						<div className="text-[11px] text-muted-foreground">
							{changePct >= 0 ? "+" : ""}
							{changePct.toFixed(2)}%
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{bars.length === 0
					? (
						<div className="flex h-[330px] items-center justify-center text-sm text-muted-foreground">
							No candlestick data
						</div>
					)
					: (
						<div className="relative pl-2 pr-2">
							<div
								ref={containerRef}
								className="w-full border-0"
								style={{ height }}
								aria-label="Candlestick chart"
								role="img"
							/>
							<div className="w-full">
								<span className="mr-2 text-muted-foreground">O</span>
								{last?.open.toFixed(2) ?? "-"}
								<span className="mx-2 text-border">|</span>
								<span className="mr-2 text-muted-foreground">H</span>
								{last?.high.toFixed(2) ?? "-"}
								<span className="mx-2 text-border">|</span>
								<span className="mr-2 text-muted-foreground">L</span>
								{last?.low.toFixed(2) ?? "-"}
								<span className="mx-2 text-border">|</span>
								<span className="mr-2 text-muted-foreground">C</span>
								{last?.close.toFixed(2) ?? "-"}
								{crosshair.volume !== null && (
									<>
										<span className="mx-2 text-border">|</span>
										<span className="mr-2 text-muted-foreground">V</span>
										{crosshair.volume.toFixed(2)}
									</>
								)}
							</div>
						</div>
					)}
			</CardContent>
		</Card>
	);
}

export default Candles;
