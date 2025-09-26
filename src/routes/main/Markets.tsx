import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import { filterSession } from "@/lib/utils";

import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import TickerTape from "@/components/widgets/TickerTape";

interface CandleData {
	timestamp: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

interface TickerData {
	key: string;
	value: {
		channel: string;
		module: string;
		widget: string;
		raw: {
			exchange: string;
			market: string;
			last: number;
			bid?: number;
			ask?: number;
			change?: number;
			percentage?: number;
			baseVolume?: number;
			quoteVolume?: number;
			timestamp: number;
			latency: number;
		};
		timestamp: number;
	};
}

interface CandleDataRaw {
	key: string;
	value: {
		channel: string;
		module: string;
		widget: string;
		raw: {
			exchange: string;
			market: string;
			timeframe: string;
			candles: number[][];
		};
	};
}

interface MiniCandlestickChartProps {
	candles: CandleData[];
	width?: number;
	height?: number;
}

/**
 * Mini candlestick chart component for market data visualization
 */
function MiniCandlestickChart(
	{ candles, width = 120, height = 40 }: MiniCandlestickChartProps,
): React.ReactElement {
	if (!candles || candles.length === 0) {
		return (
			<div
				className="flex items-center justify-center text-xs text-muted-foreground"
				style={{ width, height }}
			>
				No data
			</div>
		);
	}

	const recentCandles = candles;

	// Calculate price range
	const prices = recentCandles.flatMap((c) => [c.high, c.low]);
	const maxPrice = Math.max(...prices);
	const minPrice = Math.min(...prices);
	const priceRange = maxPrice - minPrice;

	if (priceRange === 0) {
		return (
			<div
				className="flex items-center justify-center text-xs text-muted-foreground"
				style={{ width, height }}
			>
				No range
			</div>
		);
	}

	const candleWidth = (width - 10) / recentCandles.length;

	return (
		<svg width={width} height={height} className="overflow-visible">
			{recentCandles.map((candle, index) => {
				const x = 5 + index * candleWidth + candleWidth / 2;
				const highY = 5 +
					((maxPrice - candle.high) / priceRange) * (height - 10);
				const lowY = 5 + ((maxPrice - candle.low) / priceRange) * (height - 10);
				const openY = 5 +
					((maxPrice - candle.open) / priceRange) * (height - 10);
				const closeY = 5 +
					((maxPrice - candle.close) / priceRange) * (height - 10);

				const isGreen = candle.close >= candle.open;
				const bodyTop = Math.min(openY, closeY);
				const bodyHeight = Math.abs(closeY - openY);

				return (
					<g key={index}>
						{/* Wick */}
						<line
							x1={x}
							y1={highY}
							x2={x}
							y2={lowY}
							stroke={isGreen ? "#16a34a" : "#dc2626"}
							strokeWidth="0.5"
						/>
						{/* Body */}
						<rect
							x={x - candleWidth / 4}
							y={bodyTop}
							width={candleWidth / 2}
							height={Math.max(bodyHeight, 1)}
							fill={isGreen ? "#16a34a" : "#dc2626"}
							opacity={isGreen ? 0.8 : 1}
						/>
					</g>
				);
			})}
		</svg>
	);
}

/**
 * Markets component displaying live cryptocurrency spot data
 */
function Markets(): React.ReactElement {
	const session = useSessionStoreSync() as Record<string, unknown> | null;
	const spotTickers = filterSession(
		session || {},
		/\.spot\..*\.ticker$/,
	) as TickerData[];
	const spotCandles = filterSession(
		session || {},
		/\.spot\..*\.candles$/,
	) as CandleDataRaw[];

	const formattedTickers = useMemo(() => {
		return spotTickers.map((tickerItem) => {
			const raw = tickerItem.value.raw;
			const symbol = raw.market.split("/")[0];
			const baseSymbol = raw.market.split("/")[1].split(":")[0];

			// Find corresponding candles for the same exchange and market
			const candleData = spotCandles.find((candleItem) => {
				return candleItem.value.raw.exchange === raw.exchange &&
					candleItem.value.raw.market === raw.market;
			});

			const candles: CandleData[] = candleData
				? candleData.value.raw.candles.map((c: number[]) => ({
					timestamp: c[0],
					open: c[1],
					high: c[2],
					low: c[3],
					close: c[4],
					volume: c[5],
				}))
				: [];

			return {
				exchange: raw.exchange,
				symbol,
				market: `${symbol}/${baseSymbol}`,
				price: raw.last,
				change: raw.change || 0,
				percentage: raw.percentage || 0,
				volume: raw.baseVolume || 0,
				quoteVolume: raw.quoteVolume || 0,
				bid: raw.bid || 0,
				ask: raw.ask || 0,
				latency: raw.latency,
				candles,
			};
		});
	}, [spotTickers, spotCandles]);

	const formatPrice = (price: number, symbol: string) => {
		if (symbol === "BTC" && price > 1000) {
			return `$${
				price.toLocaleString("en-US", {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
				})
			}`;
		}
		if (price < 1) {
			return `$${price.toFixed(6)}`;
		}
		if (price < 100) {
			return `$${price.toFixed(4)}`;
		}
		return `$${price.toFixed(2)}`;
	};

	const formatVolume = (volume: number) => {
		if (volume >= 1e9) {
			return `${(volume / 1e9).toFixed(2)}B`;
		}
		if (volume >= 1e6) {
			return `${(volume / 1e6).toFixed(2)}M`;
		}
		if (volume >= 1e3) {
			return `${(volume / 1e3).toFixed(2)}K`;
		}
		return volume.toFixed(2);
	};

	const formatPercentage = (percentage: number) => {
		const isPositive = percentage >= 0;
		return (
			<div
				className={`flex items-center gap-1 ${
					isPositive ? "text-green-600" : "text-red-600"
				}`}
			>
				{isPositive
					? <ArrowUp className="h-3 w-3" />
					: <ArrowDown className="h-3 w-3" />}
				{Math.abs(percentage).toFixed(2)}%
			</div>
		);
	};

	return (
		<div className="container m-auto">
			<TickerTape entries={spotTickers} />
			<Card>
				<CardHeader>
					<CardTitle>Spot Markets</CardTitle>
					<CardDescription>
						Real-time cryptocurrency spot prices and market data from multiple
						exchanges
					</CardDescription>
				</CardHeader>
				<CardContent className="min-w-0">
					<div className="rounded-md border overflow-x-auto">
						<Table className="min-w-[800px]">
							<TableHeader>
								<TableRow>
									<TableHead>Exchange & Market</TableHead>
									<TableHead>Chart</TableHead>
									<TableHead className="text-right">Price</TableHead>
									<TableHead className="text-right">24h Change</TableHead>
									<TableHead className="text-right">Volume</TableHead>
									<TableHead className="text-right">Bid/Ask</TableHead>
									<TableHead className="text-right">Latency</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{formattedTickers.map((ticker) => (
									<TableRow key={`${ticker.exchange}-${ticker.market}`}>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
													{ticker.symbol.slice(0, 2)}
												</div>
												<div>
													<div className="font-semibold">{ticker.symbol}</div>
													<div className="text-xs text-muted-foreground">
														{ticker.exchange} • {ticker.market}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell className="min-w-[130px]">
											<div className="flex items-center justify-center overflow-hidden">
												<MiniCandlestickChart
													candles={ticker.candles}
													width={120}
													height={40}
												/>
											</div>
										</TableCell>
										<TableCell className="text-right font-mono">
											{formatPrice(ticker.price, ticker.symbol)}
										</TableCell>
										<TableCell className="text-right">
											<div className="space-y-1">
												{formatPercentage(ticker.percentage)}
												<div
													className={`text-xs font-mono ${
														ticker.change >= 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{ticker.change >= 0 ? "+" : ""}
													{ticker.change.toFixed(4)}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="space-y-1">
												<div className="font-mono text-sm">
													{formatVolume(ticker.volume)}
												</div>
												<div className="text-xs text-muted-foreground">
													${formatVolume(ticker.quoteVolume)}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-right font-mono text-xs">
											<div className="space-y-1">
												<div className="text-green-600">
													{formatPrice(ticker.bid, ticker.symbol)}
												</div>
												<div className="text-red-600">
													{formatPrice(ticker.ask, ticker.symbol)}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-right text-xs text-muted-foreground">
											{ticker.latency}ms
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default Markets;
