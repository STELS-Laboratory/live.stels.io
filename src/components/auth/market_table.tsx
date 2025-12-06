/**
 * Market Table Component
 * Displays detailed market information in a professional table format
 * Shows top markets by volume with price, change, volume, and spread data
 */

import React, { useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
	TrendingUp,
	TrendingDown,
	ArrowUpDown,
	Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNetworkStore } from "@/stores/modules/network.store";
import { MarketCandleChart } from "./market_candle_chart";
import { useCandlesFromSession } from "@/apps/trading/hooks/use-candles-from-session";
import { importCoinIcon, importExchangeIcon, getFirstLetter } from "@/lib/icon-utils";

/**
 * Market ticker data structure
 */
interface MarketTickerData {
	market: string;
	exchange: string;
	last: number;
	change: number;
	percentage: number;
	baseVolume?: number;
	quoteVolume?: number;
	bid?: number;
	ask?: number;
	timestamp: number;
}

/**
 * Sort options
 */
type SortOption = "volume" | "change" | "price" | "market";

interface MarketTableProps {
	onMarketClick?: (market: string, exchange: string) => void;
}

/**
 * Market Table Component
 */
export function MarketTable({
	onMarketClick,
}: MarketTableProps = {}): React.ReactElement {
	const [tickers, setTickers] = useState<MarketTickerData[]>([]);
	const [sortBy, setSortBy] = useState<SortOption>("volume");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const [exchangeFilter, setExchangeFilter] = useState<string>("all");
	const { currentNetworkId } = useNetworkStore();

	// Get all tickers from sessionStorage
	const getTickers = useCallback((): MarketTickerData[] => {
		const tickerList: MarketTickerData[] = [];
		const tickerPrefix = `${currentNetworkId}.runtime.ticker.`;

		try {
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key && key.startsWith(tickerPrefix)) {
					try {
						const data = sessionStorage.getItem(key);
						if (data) {
							const parsed = JSON.parse(data) as {
								raw?: {
									exchange?: string;
									market?: string;
									last?: number;
									bid?: number;
									ask?: number;
									change?: number;
									percentage?: number;
									baseVolume?: number;
									quoteVolume?: number;
									timestamp?: number;
								};
							};

							if (parsed.raw?.market && parsed.raw?.last !== undefined) {
								tickerList.push({
									market: parsed.raw.market,
									exchange: parsed.raw.exchange || "unknown",
									last: parsed.raw.last,
									bid: parsed.raw.bid,
									ask: parsed.raw.ask,
									change: parsed.raw.change || 0,
									percentage: parsed.raw.percentage || 0,
									baseVolume: parsed.raw.baseVolume,
									quoteVolume: parsed.raw.quoteVolume,
									timestamp: parsed.raw.timestamp || Date.now(),
								});
							}
						}
					} catch {
						// Error handled silently
					}
				}
			}
		} catch {
			// Error handled silently
		}

		return tickerList;
	}, [currentNetworkId]);

	// Update tickers periodically - optimized with debouncing
	React.useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;
		let lastUpdateTime = 0;
		const MIN_UPDATE_INTERVAL = 5000; // Minimum 5 seconds between updates

		const updateTickers = (): void => {
			const now = Date.now();
			if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) return;
			lastUpdateTime = now;

			requestAnimationFrame(() => {
				setTickers(getTickers());
			});
		};

		// Initial load
		updateTickers();

		// Update every 5 seconds (reduced frequency)
		const interval = setInterval(() => {
			if (timeoutId) return;
			timeoutId = setTimeout(() => {
				updateTickers();
				timeoutId = null;
			}, 300);
		}, 5000);

		// Listen for storage events (only ticker-related)
		const handleStorageChange = (e: StorageEvent): void => {
			const tickerPrefix = `${currentNetworkId}.runtime.ticker.`;
			if (!e.key || !e.key.startsWith(tickerPrefix)) return;
			if (timeoutId) return;
			timeoutId = setTimeout(() => {
				updateTickers();
				timeoutId = null;
			}, 500);
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
			clearInterval(interval);
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [getTickers, currentNetworkId]);

	// Get unique exchanges
	const exchanges = useMemo(() => {
		const uniqueExchanges = new Set<string>();
		tickers.forEach((ticker) => {
			if (ticker.exchange) {
				uniqueExchanges.add(ticker.exchange);
			}
		});
		return Array.from(uniqueExchanges).sort();
	}, [tickers]);

	// Filter and sort tickers
	const filteredAndSortedTickers = useMemo(() => {
		let filtered = tickers;

		// Filter by exchange
		if (exchangeFilter !== "all") {
			filtered = filtered.filter(
				(ticker) => ticker.exchange === exchangeFilter,
			);
		}

		// Sort
		const sorted = [...filtered].sort((a, b) => {
			let aValue: number;
			let bValue: number;

			switch (sortBy) {
				case "volume":
					aValue = a.quoteVolume || a.baseVolume || 0;
					bValue = b.quoteVolume || b.baseVolume || 0;
					break;
				case "change":
					aValue = a.percentage || 0;
					bValue = b.percentage || 0;
					break;
				case "price":
					aValue = a.last;
					bValue = b.last;
					break;
				case "market":
					return a.market.localeCompare(b.market);
				default:
					return 0;
			}

			if (sortDirection === "desc") {
				return bValue - aValue;
			}
			return aValue - bValue;
		});

		// Return top 50
		return sorted.slice(0, 50);
	}, [tickers, sortBy, sortDirection, exchangeFilter]);

	// Handle sort
	const handleSort = useCallback((newSortBy: SortOption): void => {
		if (sortBy === newSortBy) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortBy(newSortBy);
			setSortDirection("desc");
		}
	}, [sortBy, sortDirection]);

	// Format number
	const formatNumber = useCallback((num: number): string => {
		if (num >= 1_000_000_000) {
			return `$${(num / 1_000_000_000).toFixed(2)}B`;
		}
		if (num >= 1_000_000) {
			return `$${(num / 1_000_000).toFixed(2)}M`;
		}
		if (num >= 1_000) {
			return `$${(num / 1_000).toFixed(2)}K`;
		}
		return `$${num.toFixed(2)}`;
	}, []);

	// Format price
	const formatPrice = useCallback((price: number): string => {
		if (price >= 1000) {
			return price.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			});
		}
		if (price >= 1) {
			return price.toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 4,
			});
		}
		return price.toLocaleString(undefined, {
			minimumFractionDigits: 4,
			maximumFractionDigits: 8,
		});
	}, []);

	// Calculate spread
	const calculateSpread = useCallback((bid: number | undefined, ask: number | undefined, last: number): number => {
		if (bid && ask) {
			return ((ask - bid) / last) * 100;
		}
		return 0;
	}, []);

	if (tickers.length === 0) {
		return (
			<Card>
				<CardHeader>
					<div className="space-y-2">
						<CardTitle className="flex items-center gap-2">
							<Filter className="h-5 w-5 text-primary" />
							Market Data
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							Comprehensive real-time market information aggregated from global exchanges.
						</p>
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="text-base font-medium mb-2">No market data available</p>
						<p className="text-sm">Market data will appear here once the monitoring network begins aggregating trading information.</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-full flex flex-col">
			<CardHeader>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Filter className="h-5 w-5 text-primary" />
							Market Data
						</CardTitle>
						<div className="flex items-center gap-2">
						<Select value={exchangeFilter} onValueChange={setExchangeFilter}>
							<SelectTrigger className="w-[140px] h-8 text-xs">
								<SelectValue placeholder="All Exchanges" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Exchanges</SelectItem>
								{exchanges.map((exchange) => (
									<SelectItem key={exchange} value={exchange}>
										{exchange.toUpperCase()}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
							<Badge variant="outline" className="text-xs">
								{filteredAndSortedTickers.length} markets
							</Badge>
						</div>
					</div>
					<p className="text-sm text-muted-foreground">
						Live trading data with prices, volumes, and spreads. All information is continuously 
						collected and processed in real-time from public exchange sources worldwide.
					</p>
				</div>
			</CardHeader>
			<CardContent className="flex-1 overflow-hidden p-0">
				<ScrollArea className="h-full">
					<div className="p-4">
						{/* Table Header */}
						<div className="grid grid-cols-12 gap-2 px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20 sticky top-0">
							<button
								onClick={() => handleSort("market")}
								className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors text-left"
							>
								Market
								{sortBy === "market" && (
									<ArrowUpDown className="h-3 w-3" />
								)}
							</button>
							<button
								onClick={() => handleSort("price")}
								className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors text-left"
							>
								Price
								{sortBy === "price" && (
									<ArrowUpDown className="h-3 w-3" />
								)}
							</button>
							<div className="col-span-2 text-left">1h Chart</div>
							<button
								onClick={() => handleSort("change")}
								className="col-span-1 flex items-center gap-1 hover:text-foreground transition-colors text-left"
							>
								24h Change
								{sortBy === "change" && (
									<ArrowUpDown className="h-3 w-3" />
								)}
							</button>
							<div className="col-span-1 text-left">Spread</div>
							<button
								onClick={() => handleSort("volume")}
								className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors text-left"
							>
								24h Volume
								{sortBy === "volume" && (
									<ArrowUpDown className="h-3 w-3" />
								)}
							</button>
							<div className="col-span-1 text-left">Exchange</div>
						</div>

						{/* Table Rows */}
						<div className="divide-y divide-border/50">
							{filteredAndSortedTickers.map((ticker) => {
								const isPositive = ticker.percentage >= 0;
								const changeColor = isPositive
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400";
								const spread = calculateSpread(ticker.bid, ticker.ask, ticker.last);
								const volume = ticker.quoteVolume || ticker.baseVolume || 0;

								return (
									<MarketTableRow
										key={`${ticker.market}-${ticker.exchange}`}
										ticker={ticker}
										isPositive={isPositive}
										changeColor={changeColor}
										spread={spread}
										volume={volume}
										formatPrice={formatPrice}
										formatNumber={formatNumber}
										onClick={onMarketClick}
									/>
								);
							})}
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}

/**
 * Market Table Row Component with Chart
 */
function MarketTableRow({
	ticker,
	isPositive,
	changeColor,
	spread,
	volume,
	formatPrice,
	formatNumber,
	onClick,
}: {
	ticker: MarketTickerData;
	isPositive: boolean;
	changeColor: string;
	spread: number;
	volume: number;
	formatPrice: (price: number) => string;
	formatNumber: (num: number) => string;
	onClick?: (market: string, exchange: string) => void;
}): React.ReactElement {
	const handleClick = React.useCallback((): void => {
		onClick?.(ticker.market, ticker.exchange);
	}, [onClick, ticker.market, ticker.exchange]);

	// Lazy load candles only when row is visible (IntersectionObserver)
	const [shouldLoadCandles, setShouldLoadCandles] = React.useState(false);
	const rowRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (!rowRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && !shouldLoadCandles) {
					const timer = setTimeout(() => {
						setShouldLoadCandles(true);
					}, 200);
					return () => clearTimeout(timer);
				}
			},
			{ rootMargin: "100px" },
		);

		observer.observe(rowRef.current);

		return () => {
			observer.disconnect();
		};
	}, [shouldLoadCandles]);

	// Get hourly candles for this market (only if visible)
	const candles = useCandlesFromSession(
		shouldLoadCandles ? ticker.market : null,
		ticker.exchange,
		"1h",
	);

	return (
		<motion.div
			ref={rowRef}
			initial={{ opacity: 0, y: 5 }}
			animate={{ opacity: 1, y: 0 }}
			onClick={handleClick}
			className="grid grid-cols-12 gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors text-xs items-center cursor-pointer"
		>
			{/* Market */}
			<div className="col-span-2 flex items-center gap-2">
				{/* Coin Icon */}
				{(() => {
					const baseCurrency = ticker.market.split("/")[0] || "";
					const coinIcon = importCoinIcon(baseCurrency);
					const firstLetter = getFirstLetter(baseCurrency);
					return (
						<div className="relative w-4 h-4 flex-shrink-0">
							{coinIcon ? (
								<img
									src={coinIcon}
									alt={baseCurrency}
									className="w-4 h-4 rounded-full object-cover"
									onError={(e) => {
										// Show fallback on error
										const target = e.target as HTMLImageElement;
										target.style.display = "none";
										const fallback = target.nextElementSibling as HTMLElement;
										if (fallback) fallback.style.display = "flex";
									}}
								/>
							) : null}
							<div
								className={cn(
									"w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-semibold text-muted-foreground",
									coinIcon ? "hidden" : "flex"
								)}
							>
								{firstLetter}
							</div>
						</div>
					);
				})()}
				<div className="font-semibold text-foreground truncate">
					{ticker.market}
				</div>
			</div>

			{/* Price */}
			<div className="col-span-2 font-mono font-semibold text-foreground">
				{formatPrice(ticker.last)}
			</div>

			{/* 1h Chart */}
			<div className="col-span-2 h-10">
				<MarketCandleChart candles={candles} height={40} />
			</div>

			{/* Change */}
			<div className={cn("col-span-1 font-mono font-semibold flex items-center gap-1", changeColor)}>
				{isPositive
					? <TrendingUp className="h-3 w-3" />
					: <TrendingDown className="h-3 w-3" />}
				<span>
					{isPositive ? "+" : ""}
					{ticker.percentage.toFixed(2)}%
				</span>
			</div>

			{/* Spread */}
			<div className="col-span-1 font-mono text-muted-foreground text-[10px]">
				{spread > 0 ? `${spread.toFixed(4)}%` : "—"}
			</div>

			{/* Volume */}
			<div className="col-span-2 font-mono text-foreground">
				{formatNumber(volume)}
			</div>

			{/* Exchange */}
			<div className="col-span-1 flex items-center gap-1.5">
				{/* Exchange Icon */}
				{(() => {
					const exchangeIcon = importExchangeIcon(ticker.exchange);
					const firstLetter = getFirstLetter(ticker.exchange);
					return (
						<div className="relative w-3.5 h-3.5 flex-shrink-0">
							{exchangeIcon ? (
								<img
									src={exchangeIcon}
									alt={ticker.exchange}
									className="w-3.5 h-3.5 rounded object-cover"
									onError={(e) => {
										// Show fallback on error
										const target = e.target as HTMLImageElement;
										target.style.display = "none";
										const fallback = target.nextElementSibling as HTMLElement;
										if (fallback) fallback.style.display = "flex";
									}}
								/>
							) : null}
							<div
								className={cn(
									"w-3.5 h-3.5 rounded bg-muted flex items-center justify-center text-[8px] font-semibold text-muted-foreground",
									exchangeIcon ? "hidden" : "flex"
								)}
							>
								{firstLetter}
							</div>
						</div>
					);
				})()}
				<Badge variant="outline" className="text-[10px] font-mono">
					{ticker.exchange.toUpperCase()}
				</Badge>
			</div>
		</motion.div>
	);
}

