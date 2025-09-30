import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import { filterSession } from "@/lib/utils";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Filter, Search, X } from "lucide-react";

// Import currency icons
import BTCIcon from "@/assets/icons/coins/BTC.png";
import ETHIcon from "@/assets/icons/coins/ETH.png";
import SOLIcon from "@/assets/icons/coins/SOL.png";
import TRXIcon from "@/assets/icons/coins/TRX.png";
import XRPIcon from "@/assets/icons/coins/XRP.png";
import BNBIcon from "@/assets/icons/coins/BNB.png";
import JASMYIcon from "@/assets/icons/coins/JASMY.png";

// Import exchange icons
import BinanceIcon from "@/assets/icons/exchanges/BINANCE.png";
import BybitIcon from "@/assets/icons/exchanges/BYBIT.png";
import OkxIcon from "@/assets/icons/exchanges/OKX.png";
import CoinbaseIcon from "@/assets/icons/exchanges/COINBASE.png";
import HtxIcon from "@/assets/icons/exchanges/HTX.png";
import KucoinIcon from "@/assets/icons/exchanges/KUCOIN.png";
import GateIcon from "@/assets/icons/exchanges/GATE.png";
import BitgetIcon from "@/assets/icons/exchanges/BITGET.png";
import UpbitIcon from "@/assets/icons/exchanges/UPBIT.png";
import BitstampIcon from "@/assets/icons/exchanges/BITSTAMP.png";

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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import TickerTape from "@/components/widgets/TickerTape";
import OrderBook from "./OrderBook";

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

interface FormattedTicker {
	exchange: string;
	symbol: string;
	market: string;
	price: number;
	change: number;
	percentage: number;
	volume: number;
	quoteVolume: number;
	bid: number;
	ask: number;
	latency: number;
	candles: CandleData[];
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
	const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
	const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
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

	// const spotBooks = filterSession(
	// 	session || {},
	// 	/\.spot\..*\.book$/,
	// ) as CandleDataRaw[];

	//console.log(spotBooks);

	// Filter states
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
	const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

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

	// Get unique exchanges and symbols for filters
	const availableExchanges = useMemo(() => {
		return Array.from(new Set(formattedTickers.map((t) => t.exchange))).sort();
	}, [formattedTickers]);

	const availableSymbols = useMemo(() => {
		return Array.from(new Set(formattedTickers.map((t) => t.symbol))).sort();
	}, [formattedTickers]);

	// Filtered tickers
	const filteredTickers = useMemo(() => {
		return formattedTickers.filter((ticker) => {
			// Search filter
			if (
				searchTerm &&
				!ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) &&
				!ticker.market.toLowerCase().includes(searchTerm.toLowerCase())
			) {
				return false;
			}

			// Exchange filter
			if (
				selectedExchanges.length > 0 &&
				!selectedExchanges.includes(ticker.exchange)
			) {
				return false;
			}

			// Symbol filter
			if (
				selectedSymbols.length > 0 && !selectedSymbols.includes(ticker.symbol)
			) {
				return false;
			}

			return true;
		});
	}, [formattedTickers, searchTerm, selectedExchanges, selectedSymbols]);

	const exchangeGroups = useMemo(() => {
		const groups = new Map<string, FormattedTicker[]>();

		filteredTickers.forEach((ticker) => {
			if (!groups.has(ticker.exchange)) {
				groups.set(ticker.exchange, []);
			}
			groups.get(ticker.exchange)!.push(ticker);
		});

		return Array.from(groups.entries()).map(([exchange, markets]) => ({
			exchange,
			markets: markets.sort((a, b) => b.price - a.price), // Sort by price descending
			totalMarkets: markets.length,
			avgLatency: markets.length > 0
				? markets.reduce((sum, m) => sum + m.latency, 0) / markets.length
				: 0,
		}));
	}, [filteredTickers]);

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
					isPositive ? "text-amber-500" : "text-zinc-400"
				}`}
			>
				{isPositive
					? <ArrowUp className="h-3 w-3" />
					: <ArrowDown className="h-3 w-3" />}
				{Math.abs(percentage).toFixed(2)}%
			</div>
		);
	};

	const getExchangeColor = (_exchange: string): string => {
		// Используем единую цветовую схему приложения - zinc/amber
		return "from-amber-400 to-amber-600";
	};

	const getExchangeIcon = (exchange: string): string | null => {
		const exchangeIconMap: Record<string, string> = {
			binance: BinanceIcon,
			bybit: BybitIcon,
			okx: OkxIcon,
			coinbase: CoinbaseIcon,
			htx: HtxIcon,
			kucoin: KucoinIcon,
			gate: GateIcon,
			bitget: BitgetIcon,
			upbit: UpbitIcon,
			bitstamp: BitstampIcon,
		};
		return exchangeIconMap[exchange] || null;
	};

	const getCurrencyIcon = (symbol: string): string | null => {
		const iconMap: Record<string, string> = {
			BTC: BTCIcon,
			ETH: ETHIcon,
			SOL: SOLIcon,
			TRX: TRXIcon,
			XRP: XRPIcon,
			BNB: BNBIcon,
			JASMY: JASMYIcon,
		};
		return iconMap[symbol] || null;
	};

	// Filter functions
	const toggleExchange = (exchange: string) => {
		setSelectedExchanges((prev) =>
			prev.includes(exchange)
				? prev.filter((e) => e !== exchange)
				: [...prev, exchange]
		);
	};

	const toggleSymbol = (symbol: string) => {
		setSelectedSymbols((prev) =>
			prev.includes(symbol)
				? prev.filter((s) => s !== symbol)
				: [...prev, symbol]
		);
	};

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedExchanges([]);
		setSelectedSymbols([]);
	};

	return (
		<div className="container m-auto space-y-6">
			{/* Order Book Analysis - First Block */}
			<OrderBook />

			<TickerTape entries={spotTickers} />

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Spot Markets</span>
						<div className="text-sm font-normal text-muted-foreground">
							{exchangeGroups.length} exchanges • {filteredTickers.length}{" "}
							markets
						</div>
					</CardTitle>
					<CardDescription>
						Real-time cryptocurrency spot prices and market data from multiple
						exchanges
					</CardDescription>
				</CardHeader>

				{/* Filters */}
				<CardContent className="pt-0">
					<div className="space-y-4">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search by symbol or market..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>

						{/* Exchange Filters */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Filter className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Exchanges</span>
							</div>
							<div className="flex flex-wrap gap-2">
								{availableExchanges.map((exchange) => (
									<Button
										key={exchange}
										variant={selectedExchanges.includes(exchange)
											? "default"
											: "outline"}
										size="sm"
										onClick={() => toggleExchange(exchange)}
										className="h-8"
									>
										{getExchangeIcon(exchange)
											? (
												<img
													src={getExchangeIcon(exchange)!}
													alt={exchange}
													className="w-4 h-4 rounded-full mr-2"
												/>
											)
											: (
												<div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">
													{exchange.charAt(0).toUpperCase()}
												</div>
											)}
										{exchange}
									</Button>
								))}
							</div>
						</div>

						{/* Symbol Filters */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Filter className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm font-medium">Symbols</span>
							</div>
							<div className="flex flex-wrap gap-2">
								{availableSymbols.map((symbol) => (
									<Button
										key={symbol}
										variant={selectedSymbols.includes(symbol)
											? "default"
											: "outline"}
										size="sm"
										onClick={() => toggleSymbol(symbol)}
										className="h-8"
									>
										{getCurrencyIcon(symbol)
											? (
												<img
													src={getCurrencyIcon(symbol)!}
													alt={symbol}
													className="w-4 h-4 rounded-full mr-2"
												/>
											)
											: (
												<div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">
													{symbol.slice(0, 2)}
												</div>
											)}
										{symbol}
									</Button>
								))}
							</div>
						</div>

						{/* Clear Filters */}
						{(searchTerm || selectedExchanges.length > 0 ||
							selectedSymbols.length > 0) && (
							<div className="flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFilters}
									className="text-muted-foreground hover:text-foreground"
								>
									<X className="h-4 w-4 mr-2" />
									Clear Filters
								</Button>
							</div>
						)}
					</div>
				</CardContent>
				<CardContent className="p-0">
					<div className="rounded-md border overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50">
									<TableHead className="w-[200px]">Exchange & Market</TableHead>
									<TableHead className="w-[120px]">Chart</TableHead>
									<TableHead className="text-right w-[120px]">Price</TableHead>
									<TableHead className="text-right w-[120px]">
										24h Change
									</TableHead>
									<TableHead className="text-right w-[100px]">Volume</TableHead>
									<TableHead className="text-right w-[120px]">
										Bid/Ask
									</TableHead>
									<TableHead className="text-right w-[80px]">Latency</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{exchangeGroups.map((group) => (
									<React.Fragment key={group.exchange}>
										{/* Exchange Header Row */}
										<TableRow>
											<TableCell colSpan={7} className="py-4 px-6 bg-muted/50">
												<div className="flex items-center gap-3">
													{getExchangeIcon(group.exchange)
														? (
															<img
																src={getExchangeIcon(group.exchange)!}
																alt={group.exchange}
																className="w-12 h-12 p-1 rounded-full"
															/>
														)
														: (
															<div
																className={`w-12 h-12 bg-gradient-to-br ${
																	getExchangeColor(group.exchange)
																} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md`}
															>
																{group.exchange.charAt(0).toUpperCase()}
															</div>
														)}
													<div>
														<div className="font-semibold text-lg capitalize">
															{group.exchange}
														</div>
														<div className="text-sm text-muted-foreground">
															{group.totalMarkets} markets •{" "}
															{Math.round(group.avgLatency)}ms avg latency
														</div>
													</div>
													<Badge
														variant="secondary"
														className="ml-auto bg-amber-400/20 text-amber-600 border-amber-400/30"
													>
														{group.totalMarkets} Active
													</Badge>
												</div>
											</TableCell>
										</TableRow>

										{/* Market Rows */}
										{group.markets.map((ticker, tickerIndex) => (
											<TableRow
												key={`${ticker.exchange}-${ticker.market}`}
												className={`hover:bg-muted/10 transition-colors ${
													tickerIndex === group.markets.length - 1 ? "" : ""
												}`}
											>
												<TableCell className="font-medium">
													<div className="flex items-center gap-3">
														{getCurrencyIcon(ticker.symbol)
															? (
																<img
																	src={getCurrencyIcon(ticker.symbol)!}
																	alt={ticker.symbol}
																	className="w-8 h-8 rounded-full"
																/>
															)
															: (
																<div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
																	{ticker.symbol.slice(0, 2)}
																</div>
															)}
														<div>
															<div className="font-semibold">
																{ticker.symbol}
															</div>
															<div className="text-sm text-muted-foreground">
																{ticker.market}
															</div>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center justify-center">
														<MiniCandlestickChart
															candles={ticker.candles}
															width={100}
															height={40}
														/>
													</div>
												</TableCell>
												<TableCell className="text-right font-mono text-lg">
													{formatPrice(ticker.price, ticker.symbol)}
												</TableCell>
												<TableCell className="text-right">
													<div className="space-y-1">
														{formatPercentage(ticker.percentage)}
														<div
															className={`text-sm font-mono ${
																ticker.change >= 0
																	? "text-amber-500"
																	: "text-zinc-400"
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
												<TableCell className="text-right font-mono text-sm">
													{ticker.bid > 0 && ticker.ask > 0
														? (
															<div className="space-y-1">
																<div className="text-amber-500">
																	{formatPrice(ticker.bid, ticker.symbol)}
																</div>
																<div className="text-zinc-400">
																	{formatPrice(ticker.ask, ticker.symbol)}
																</div>
															</div>
														)
														: <span className="text-muted-foreground">-</span>}
												</TableCell>
												<TableCell className="text-right">
													<Badge
														variant={ticker.latency < 1000
															? "default"
															: ticker.latency < 2000
															? "secondary"
															: "destructive"}
														className={`text-xs ${
															ticker.latency < 1000
																? "bg-amber-500/20 text-amber-600 border-amber-400/30"
																: ticker.latency < 2000
																? "bg-zinc-500/20 text-zinc-400 border-zinc-400/30"
																: "bg-red-500/20 text-red-400 border-red-400/30"
														}`}
													>
														{ticker.latency}ms
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</React.Fragment>
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
