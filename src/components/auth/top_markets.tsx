/**
 * Top Markets Component
 * Displays top markets by liquidity in a sortable table/grid format
 */

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { motion } from "framer-motion";
import {
	ArrowUpDown,
	LayoutGrid,
	Table2,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MarketCandleChart } from "./market_candle_chart";
import { useCandlesFromSession } from "@/apps/trading/hooks/use-candles-from-session";
import {
	getFirstLetter,
	importCoinIcon,
	importExchangeIcon,
} from "@/lib/icon-utils";
import { useMobile } from "@/hooks/use_mobile";

/**
 * Market ticker data structure with liquidity
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
	liquidity?: number;
}

type ViewMode = "grid" | "table";
type SortOption = "liquidity" | "volume" | "change" | "price" | "market";

interface TopMarketsProps {
	onMarketClick?: (market: string, exchange: string) => void;
}

/**
 * Top Markets Component
 */
export function TopMarkets({
	onMarketClick,
}: TopMarketsProps = {}): React.ReactElement {
	const [tickers, setTickers] = useState<MarketTickerData[]>([]);
	const [viewMode, setViewMode] = useState<ViewMode>("table");
	const [sortBy, setSortBy] = useState<SortOption>("liquidity");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const isMobile = useMobile(768);

	// Cache for tickers to avoid unnecessary recalculations
	const tickersCacheRef = useRef<Map<string, MarketTickerData>>(new Map());
	const lastUpdateRef = useRef<number>(0);

	// Get all tickers from sessionStorage with caching
	// CRITICAL: Optimized to prevent blocking UI thread
	const getTickers = useCallback((): MarketTickerData[] => {
		const tickerList: MarketTickerData[] = [];
		const now = Date.now();
		const cache = tickersCacheRef.current;
		const updatedKeys = new Set<string>();

		try {
			// Batch sessionStorage reads to prevent blocking
			const keys: string[] = [];
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (key && key.startsWith("testnet.runtime.ticker.")) {
					keys.push(key);
				}
			}

			// Process in chunks to prevent blocking
			for (const key of keys) {
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
							const marketKey = `${parsed.raw.market}-${
								parsed.raw.exchange || "unknown"
							}`;
							updatedKeys.add(marketKey);

							// Check cache first
							const cached = cache.get(marketKey);
							const timestamp = parsed.raw.timestamp || now;

							// Only recalculate if data changed
							if (
								cached && cached.timestamp === timestamp &&
								cached.last === parsed.raw.last
							) {
								tickerList.push(cached);
								continue;
							}

							const volume = parsed.raw.quoteVolume ||
								parsed.raw.baseVolume || 0;
							const bid = parsed.raw.bid;
							const ask = parsed.raw.ask;

							// Calculate liquidity: volume / spread (if available), otherwise just volume
							let liquidity = volume;
							if (bid && ask && parsed.raw.last > 0) {
								const spread = ((ask - bid) / parsed.raw.last) * 100;
								if (spread > 0) {
									// Higher volume and lower spread = higher liquidity
									liquidity = volume / (1 + spread);
								}
							}

							const ticker: MarketTickerData = {
								market: parsed.raw.market,
								exchange: parsed.raw.exchange || "unknown",
								last: parsed.raw.last,
								bid: parsed.raw.bid,
								ask: parsed.raw.ask,
								change: parsed.raw.change || 0,
								percentage: parsed.raw.percentage || 0,
								baseVolume: parsed.raw.baseVolume,
								quoteVolume: parsed.raw.quoteVolume,
								timestamp,
								liquidity,
							};

							// Update cache
							cache.set(marketKey, ticker);
							tickerList.push(ticker);
						}
					}
				} catch {
					// Error handled silently
				}
			}

			// Clean up cache - remove markets that no longer exist
			for (const [key] of cache) {
				if (!updatedKeys.has(key)) {
					cache.delete(key);
				}
			}
		} catch {
			// Error handled silently
		}

		lastUpdateRef.current = now;
		return tickerList;
	}, []);

	// Update tickers with debouncing and requestAnimationFrame
	// CRITICAL: Optimized to prevent UI blocking
	useEffect(() => {
		let rafId: number | null = null;
		let timeoutId: NodeJS.Timeout | null = null;
		let isUpdating = false;
		let lastUpdateTime = 0;
		const MIN_UPDATE_INTERVAL = 10000; // Increased to 10 seconds for better performance

		const updateTickers = (): void => {
			const now = Date.now();
			if (isUpdating || (now - lastUpdateTime < MIN_UPDATE_INTERVAL)) return;

			isUpdating = true;
			lastUpdateTime = now;

			// Use double RAF for better performance
			rafId = requestAnimationFrame(() => {
				rafId = requestAnimationFrame(() => {
					const newTickers = getTickers();
					setTickers((prevTickers) => {
						// Only update if data actually changed
						if (prevTickers.length !== newTickers.length) {
							isUpdating = false;
							return newTickers;
						}

						// Check if any ticker changed significantly (threshold for price changes)
						const hasChanges = newTickers.some((newTicker, index) => {
							const prevTicker = prevTickers[index];
							if (!prevTicker) return true;
							// Only update if price changed by more than 0.1% or percentage changed significantly
							const priceChange = Math.abs(
								(newTicker.last - prevTicker.last) / prevTicker.last,
							);
							const percentageChange = Math.abs(
								newTicker.percentage - prevTicker.percentage,
							);
							return (
								priceChange > 0.001 || // Increased threshold
								percentageChange > 0.1 || // Increased threshold
								newTicker.timestamp !== prevTicker.timestamp
							);
						});

						isUpdating = false;
						return hasChanges ? newTickers : prevTickers;
					});
				});
			});
		};

		// Initial load with delay to prevent blocking
		const initialTimeout = setTimeout(() => {
			updateTickers();
		}, 500);

		// Update every 10 seconds (reduced frequency for better performance)
		const interval = setInterval(() => {
			if (timeoutId) return;
			timeoutId = setTimeout(() => {
				updateTickers();
				timeoutId = null;
			}, 500); // Increased debounce
		}, 10000);

		// Listen for storage events with debounce (only for ticker updates)
		const handleStorageChange = (e: StorageEvent): void => {
			// Only process ticker-related storage events
			if (!e.key || !e.key.startsWith("testnet.runtime.ticker.")) return;
			if (timeoutId) return;
			timeoutId = setTimeout(() => {
				updateTickers();
				timeoutId = null;
			}, 1000); // Longer debounce for storage events
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			clearTimeout(initialTimeout);
			if (rafId !== null) cancelAnimationFrame(rafId);
			if (timeoutId) clearTimeout(timeoutId);
			clearInterval(interval);
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [getTickers]);

	// Liquidity already calculated in getTickers, so just use tickers directly
	const tickersWithLiquidity = tickers;

	// Sort and filter markets
	const sortedMarkets = useMemo(() => {
		const sorted = [...tickersWithLiquidity].sort((a, b) => {
			let aValue: number | string;
			let bValue: number | string;

			switch (sortBy) {
				case "liquidity":
					aValue = a.liquidity || 0;
					bValue = b.liquidity || 0;
					break;
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
					aValue = a.market;
					bValue = b.market;
					return sortDirection === "desc"
						? bValue.localeCompare(aValue as string)
						: (aValue as string).localeCompare(bValue as string);
				default:
					return 0;
			}

			if (typeof aValue === "string" || typeof bValue === "string") {
				return 0;
			}

			return sortDirection === "desc"
				? (bValue as number) - (aValue as number)
				: (aValue as number) - (bValue as number);
		});

		return sorted;
	}, [tickersWithLiquidity, sortBy, sortDirection]);

	// Get top markets (top 20 for table, top 10 for grid)
	const topMarkets = useMemo(() => {
		return sortedMarkets.slice(0, viewMode === "table" ? 20 : 10);
	}, [sortedMarkets, viewMode]);

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

	if (topMarkets.length === 0) {
		return (
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<TrendingUp className="h-5 w-5 text-primary" />
						<h3 className="text-xl font-bold text-foreground">
							Top Markets by Liquidity
						</h3>
					</div>
					<p className="text-sm text-muted-foreground max-w-2xl">
						Real-time market liquidity rankings based on live trading data
						aggregated from global exchanges.
					</p>
				</div>
				<Card>
					<CardContent className="p-8 text-center text-muted-foreground">
						<TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="text-base font-medium mb-2">
							No market data available
						</p>
						<p className="text-sm">
							Market data will appear here once the monitoring network begins
							aggregating trading information.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<TrendingUp className="h-5 w-5 text-primary" />
						<h3 className="text-xl font-bold text-foreground">
							Top Markets by Liquidity
						</h3>
						<Badge variant="outline" className="text-xs">
							{topMarkets.length} markets
						</Badge>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant={viewMode === "grid" ? "default" : "outline"}
							size="sm"
							onClick={() => setViewMode("grid")}
							className="h-8"
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "table" ? "default" : "outline"}
							size="sm"
							onClick={() => setViewMode("table")}
							className="h-8"
						>
							<Table2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<p className="text-sm text-muted-foreground max-w-2xl">
					Ranked by real-time liquidity calculated from live trading volumes and
					bid-ask spreads. Data continuously updated as STELS monitoring network
					processes market information from global exchanges.
				</p>
			</div>

			{viewMode === "table"
				? (
					<Card>
						<CardContent className="p-0">
							<ScrollArea className={isMobile ? "h-[500px]" : "h-[600px]"}>
								<div className="overflow-x-auto -mx-1 sm:mx-0">
									<Table className={isMobile ? "min-w-[600px]" : ""}>
										<TableHeader>
											<TableRow className="hover:bg-transparent">
												<TableHead
													className={cn(
														"text-center",
														isMobile ? "w-10 px-1" : "w-12 px-2",
													)}
												>
													<button
														onClick={() => handleSort("liquidity")}
														className={cn(
															"flex items-center justify-center gap-1 hover:text-foreground transition-colors",
															isMobile ? "text-[10px]" : "text-xs",
														)}
													>
														Rank
														{sortBy === "liquidity" && (
															<ArrowUpDown
																className={cn(
																	isMobile ? "h-2.5 w-2.5" : "h-3 w-3",
																)}
															/>
														)}
													</button>
												</TableHead>
												<TableHead
													className={isMobile ? "px-2 min-w-[100px]" : "px-4"}
												>
													<button
														onClick={() => handleSort("market")}
														className={cn(
															"flex items-center gap-1 hover:text-foreground transition-colors",
															isMobile ? "text-[10px]" : "text-xs",
														)}
													>
														Market
														{sortBy === "market" && (
															<ArrowUpDown
																className={cn(
																	isMobile ? "h-2.5 w-2.5" : "h-3 w-3",
																)}
															/>
														)}
													</button>
												</TableHead>
												<TableHead
													className={isMobile ? "px-2 min-w-[80px]" : "px-4"}
												>
													<button
														onClick={() => handleSort("price")}
														className={cn(
															"flex items-center gap-1 hover:text-foreground transition-colors",
															isMobile ? "text-[10px]" : "text-xs",
														)}
													>
														Price
														{sortBy === "price" && (
															<ArrowUpDown
																className={cn(
																	isMobile ? "h-2.5 w-2.5" : "h-3 w-3",
																)}
															/>
														)}
													</button>
												</TableHead>
												{!isMobile && (
													<TableHead className="w-24 px-2">
														<span className="text-xs">1h Chart</span>
													</TableHead>
												)}
												<TableHead
													className={isMobile ? "px-2 min-w-[70px]" : "px-4"}
												>
													<button
														onClick={() => handleSort("change")}
														className={cn(
															"flex items-center gap-1 hover:text-foreground transition-colors",
															isMobile ? "text-[10px]" : "text-xs",
														)}
													>
														{isMobile ? "24h" : "24h Change"}
														{sortBy === "change" && (
															<ArrowUpDown
																className={cn(
																	isMobile ? "h-2.5 w-2.5" : "h-3 w-3",
																)}
															/>
														)}
													</button>
												</TableHead>
												{!isMobile && (
													<TableHead className="px-4">
														<button
															onClick={() => handleSort("liquidity")}
															className="flex items-center gap-1 hover:text-foreground transition-colors text-xs"
														>
															Liquidity
															{sortBy === "liquidity" && (
																<ArrowUpDown className="h-3 w-3" />
															)}
														</button>
													</TableHead>
												)}
												<TableHead
													className={isMobile ? "px-2 min-w-[70px]" : "px-4"}
												>
													<button
														onClick={() => handleSort("volume")}
														className={cn(
															"flex items-center gap-1 hover:text-foreground transition-colors",
															isMobile ? "text-[10px]" : "text-xs",
														)}
													>
														{isMobile ? "Volume" : "24h Volume"}
														{sortBy === "volume" && (
															<ArrowUpDown
																className={cn(
																	isMobile ? "h-2.5 w-2.5" : "h-3 w-3",
																)}
															/>
														)}
													</button>
												</TableHead>
												<TableHead
													className={isMobile ? "px-2 min-w-[60px]" : "px-4"}
												>
													<span
														className={cn(
															isMobile ? "text-[10px]" : "text-xs",
														)}
													>
														Exchange
													</span>
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{topMarkets.map((market, index) => (
												<MarketTableRow
													key={`${market.market}-${market.exchange}`}
													market={market}
													index={index}
													isPositive={market.percentage >= 0}
													changeColor={market.percentage >= 0
														? "text-green-600 dark:text-green-400"
														: "text-red-600 dark:text-red-400"}
													volume={market.quoteVolume || market.baseVolume || 0}
													liquidity={market.liquidity || 0}
													formatPrice={formatPrice}
													formatNumber={formatNumber}
													onClick={onMarketClick}
													isMobile={isMobile}
												/>
											))}
										</TableBody>
									</Table>
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				)
				: (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
						{topMarkets.map((market, index) => {
							const isPositive = market.percentage >= 0;
							return (
								<MarketCardWithChart
									key={`${market.market}-${market.exchange}`}
									market={market}
									index={index}
									isPositive={isPositive}
									changeColor={isPositive
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400"}
									bgColor={isPositive
										? "bg-green-500/10 border-green-500/30"
										: "bg-red-500/10 border-red-500/30"}
									volume={market.quoteVolume || market.baseVolume || 0}
									liquidity={market.liquidity || 0}
									formatPrice={formatPrice}
									formatNumber={formatNumber}
									onClick={onMarketClick}
								/>
							);
						})}
					</div>
				)}
		</div>
	);
}

/**
 * Market Table Row Component - Memoized for performance
 */
const MarketTableRow = React.memo(function MarketTableRow({
	market,
	index,
	isPositive,
	changeColor,
	volume,
	liquidity,
	formatPrice,
	formatNumber,
	onClick,
	isMobile = false,
}: {
	market: MarketTickerData;
	index: number;
	isPositive: boolean;
	changeColor: string;
	volume: number;
	liquidity: number;
	formatPrice: (price: number) => string;
	formatNumber: (num: number) => string;
	onClick?: (market: string, exchange: string) => void;
	isMobile?: boolean;
}): React.ReactElement {
	const handleClick = React.useCallback((): void => {
		onClick?.(market.market, market.exchange);
	}, [onClick, market.market, market.exchange]);

	// Lazy load candles only when row is visible (IntersectionObserver)
	// CRITICAL: Fixed to prevent observer recreation on every render
	const [shouldLoadCandles, setShouldLoadCandles] = useState(false);
	const rowRef = useRef<HTMLTableRowElement>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const indexRef = useRef(index);
	const shouldLoadCandlesRef = useRef(shouldLoadCandles);

	// Keep refs in sync
	useEffect(() => {
		indexRef.current = index;
		shouldLoadCandlesRef.current = shouldLoadCandles;
	}, [index, shouldLoadCandles]);

	useEffect(() => {
		if (!rowRef.current || shouldLoadCandlesRef.current) return;

		// Create observer only once
		if (!observerRef.current) {
			observerRef.current = new IntersectionObserver(
				(entries) => {
					if (entries[0]?.isIntersecting && !shouldLoadCandlesRef.current) {
						// Delay loading to avoid loading all visible rows at once
						if (timerRef.current) clearTimeout(timerRef.current);
						timerRef.current = setTimeout(() => {
							setShouldLoadCandles(true);
						}, 1000 + indexRef.current * 100); // Stagger loading by index
					}
				},
				{ rootMargin: "50px" }, // Reduced margin for better performance
			);
		}

		observerRef.current.observe(rowRef.current);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
		};
	}, [index, shouldLoadCandles]); // Include deps but use refs in observer callback

	// Get hourly candles for this market (only if shouldLoadCandles is true)
	const candles = useCandlesFromSession(
		shouldLoadCandles ? market.market : null,
		market.exchange,
		"1h",
	);

	return (
		<TableRow
			ref={rowRef}
			className="cursor-pointer"
			onClick={handleClick}
		>
			<TableCell
				className={cn(
					"text-center",
					isMobile ? "px-1" : "px-2",
				)}
			>
				<Badge
					variant="outline"
					className={cn(
						"font-bold flex items-center justify-center p-0",
						isMobile ? "text-[9px] w-5 h-5" : "text-[10px] w-6 h-6",
					)}
				>
					{index + 1}
				</Badge>
			</TableCell>
			<TableCell className={isMobile ? "px-2" : "px-4"}>
				<div className="flex items-center gap-1.5 sm:gap-2">
					{(() => {
						const baseCurrency = market.market.split("/")[0] || "";
						const coinIcon = importCoinIcon(baseCurrency);
						const firstLetter = getFirstLetter(baseCurrency);
						return (
							<div
								className={cn(
									"relative flex-shrink-0",
									isMobile ? "w-4 h-4" : "w-5 h-5",
								)}
							>
								{coinIcon
									? (
										<img
											src={coinIcon}
											alt={baseCurrency}
											className={cn(
												"rounded-full object-cover",
												isMobile ? "w-4 h-4" : "w-5 h-5",
											)}
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.style.display = "none";
												const fallback = target
													.nextElementSibling as HTMLElement;
												if (fallback) fallback.style.display = "flex";
											}}
										/>
									)
									: null}
								<div
									className={cn(
										"rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground",
										isMobile ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[10px]",
										coinIcon ? "hidden" : "flex",
									)}
								>
									{firstLetter}
								</div>
							</div>
						);
					})()}
					<div
						className={cn(
							"font-semibold text-foreground truncate",
							isMobile ? "text-xs" : "text-sm",
						)}
					>
						{market.market}
					</div>
				</div>
			</TableCell>
			<TableCell className={isMobile ? "px-2" : "px-4"}>
				<div
					className={cn(
						"font-mono font-semibold text-foreground",
						isMobile ? "text-xs" : "text-sm",
					)}
				>
					{formatPrice(market.last)}
				</div>
			</TableCell>
			{!isMobile && (
				<TableCell className="px-2">
					<div className="h-10">
						{shouldLoadCandles
							? <MarketCandleChart candles={candles} height={40} />
							: (
								<div className="h-10 w-full bg-muted/10 rounded flex items-center justify-center">
									<div className="text-[8px] text-muted-foreground">
										Loading...
									</div>
								</div>
							)}
					</div>
				</TableCell>
			)}
			<TableCell className={isMobile ? "px-2" : "px-4"}>
				<div
					className={cn(
						"font-mono font-semibold flex items-center gap-1",
						changeColor,
						isMobile ? "text-xs" : "text-sm",
					)}
				>
					{isPositive
						? <TrendingUp className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />
						: <TrendingDown className={isMobile ? "h-2.5 w-2.5" : "h-3 w-3"} />}
					<span>
						{isPositive ? "+" : ""}
						{market.percentage.toFixed(2)}%
					</span>
				</div>
			</TableCell>
			{!isMobile && (
				<TableCell className="px-4">
					<div className="font-mono font-semibold text-sm text-foreground">
						{formatNumber(liquidity)}
					</div>
				</TableCell>
			)}
			<TableCell className={isMobile ? "px-2" : "px-4"}>
				<div
					className={cn(
						"font-mono text-foreground",
						isMobile ? "text-xs" : "text-sm",
					)}
				>
					{formatNumber(volume)}
				</div>
			</TableCell>
			<TableCell className={isMobile ? "px-2" : "px-4"}>
				<div className="flex items-center gap-1 sm:gap-1.5">
					{(() => {
						const exchangeIcon = importExchangeIcon(market.exchange);
						const firstLetter = getFirstLetter(market.exchange);
						return (
							<div
								className={cn(
									"relative flex-shrink-0",
									isMobile ? "w-3 h-3" : "w-3.5 h-3.5",
								)}
							>
								{exchangeIcon
									? (
										<img
											src={exchangeIcon}
											alt={market.exchange}
											className={cn(
												"rounded object-cover",
												isMobile ? "w-3 h-3" : "w-3.5 h-3.5",
											)}
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.style.display = "none";
												const fallback = target
													.nextElementSibling as HTMLElement;
												if (fallback) fallback.style.display = "flex";
											}}
										/>
									)
									: null}
								<div
									className={cn(
										"rounded bg-muted flex items-center justify-center font-semibold text-muted-foreground",
										isMobile ? "w-3 h-3 text-[7px]" : "w-3.5 h-3.5 text-[8px]",
										exchangeIcon ? "hidden" : "flex",
									)}
								>
									{firstLetter}
								</div>
							</div>
						);
					})()}
					<Badge
						variant="outline"
						className={cn(
							"font-mono",
							isMobile ? "text-[9px] px-1" : "text-[10px] px-1.5",
						)}
					>
						{isMobile
							? market.exchange.toUpperCase().slice(0, 3)
							: market.exchange.toUpperCase()}
					</Badge>
				</div>
			</TableCell>
		</TableRow>
	);
}, (prevProps, nextProps) => {
	// Custom comparison for better performance
	return (
		prevProps.market.market === nextProps.market.market &&
		prevProps.market.exchange === nextProps.market.exchange &&
		prevProps.market.last === nextProps.market.last &&
		prevProps.market.percentage === nextProps.market.percentage &&
		prevProps.market.liquidity === nextProps.market.liquidity &&
		prevProps.index === nextProps.index &&
		prevProps.isPositive === nextProps.isPositive &&
		prevProps.volume === nextProps.volume &&
		prevProps.liquidity === nextProps.liquidity &&
		prevProps.isMobile === nextProps.isMobile
	);
});

/**
 * Market Card with Chart Component - Memoized for performance
 */
const MarketCardWithChart = React.memo(function MarketCardWithChart({
	market,
	index,
	isPositive,
	changeColor,
	bgColor,
	volume,
	liquidity,
	formatPrice,
	formatNumber,
	onClick,
}: {
	market: MarketTickerData;
	index: number;
	isPositive: boolean;
	changeColor: string;
	bgColor: string;
	volume: number;
	liquidity: number;
	formatPrice: (price: number) => string;
	formatNumber: (num: number) => string;
	onClick?: (market: string, exchange: string) => void;
}): React.ReactElement {
	const handleClick = React.useCallback((): void => {
		onClick?.(market.market, market.exchange);
	}, [onClick, market.market, market.exchange]);

	// Lazy load candles only when card is visible (IntersectionObserver)
	// CRITICAL: Fixed to prevent observer recreation on every render
	const [shouldLoadCandles, setShouldLoadCandles] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const indexRef = useRef(index);
	const shouldLoadCandlesRef = useRef(shouldLoadCandles);

	// Keep refs in sync
	useEffect(() => {
		indexRef.current = index;
		shouldLoadCandlesRef.current = shouldLoadCandles;
	}, [index, shouldLoadCandles]);

	useEffect(() => {
		if (!cardRef.current || shouldLoadCandlesRef.current) return;

		// Create observer only once
		if (!observerRef.current) {
			observerRef.current = new IntersectionObserver(
				(entries) => {
					if (entries[0]?.isIntersecting && !shouldLoadCandlesRef.current) {
						// Delay loading to avoid loading all visible cards at once
						if (timerRef.current) clearTimeout(timerRef.current);
						timerRef.current = setTimeout(() => {
							setShouldLoadCandles(true);
						}, 1500 + indexRef.current * 150); // Stagger loading by index
					}
				},
				{ rootMargin: "100px" }, // Reduced margin for better performance
			);
		}

		observerRef.current.observe(cardRef.current);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
		};
	}, [index, shouldLoadCandles]); // Include deps but use refs in observer callback

	// Get hourly candles for this market (only if shouldLoadCandles is true)
	const candles = useCandlesFromSession(
		shouldLoadCandles ? market.market : null,
		market.exchange,
		"1h",
	);

	return (
		<motion.div
			ref={cardRef}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * 0.05 }}
		>
			<Card
				className={cn(
					"h-full hover:shadow-lg transition-all duration-200 border cursor-pointer",
					bgColor,
				)}
				onClick={handleClick}
			>
				<CardContent className="p-4">
					<div className="space-y-3">
						{/* Rank and Market */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Badge
									variant="outline"
									className="text-[10px] font-bold w-6 h-6 flex items-center justify-center p-0"
								>
									{index + 1}
								</Badge>
								{/* Coin Icon */}
								{(() => {
									const baseCurrency = market.market.split("/")[0] || "";
									const coinIcon = importCoinIcon(baseCurrency);
									const firstLetter = getFirstLetter(baseCurrency);
									return (
										<div className="relative w-5 h-5 flex-shrink-0">
											{coinIcon
												? (
													<img
														src={coinIcon}
														alt={baseCurrency}
														className="w-5 h-5 rounded-full object-cover"
														onError={(e) => {
															// Show fallback on error
															const target = e.target as HTMLImageElement;
															target.style.display = "none";
															const fallback = target
																.nextElementSibling as HTMLElement;
															if (fallback) fallback.style.display = "flex";
														}}
													/>
												)
												: null}
											<div
												className={cn(
													"w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground",
													coinIcon ? "hidden" : "flex",
												)}
											>
												{firstLetter}
											</div>
										</div>
									);
								})()}
								<div className="flex-1 min-w-0">
									<div className="font-semibold text-sm text-foreground truncate">
										{market.market}
									</div>
									<div className="flex items-center gap-1.5 mt-0.5">
										{/* Exchange Icon */}
										{(() => {
											const exchangeIcon = importExchangeIcon(market.exchange);
											const firstLetter = getFirstLetter(market.exchange);
											return (
												<div className="relative w-3.5 h-3.5 flex-shrink-0">
													{exchangeIcon
														? (
															<img
																src={exchangeIcon}
																alt={market.exchange}
																className="w-3.5 h-3.5 rounded object-cover"
																onError={(e) => {
																	// Show fallback on error
																	const target = e.target as HTMLImageElement;
																	target.style.display = "none";
																	const fallback = target
																		.nextElementSibling as HTMLElement;
																	if (fallback) {
																		fallback.style.display = "flex";
																	}
																}}
															/>
														)
														: null}
													<div
														className={cn(
															"w-3.5 h-3.5 rounded bg-muted flex items-center justify-center text-[8px] font-semibold text-muted-foreground",
															exchangeIcon ? "hidden" : "flex",
														)}
													>
														{firstLetter}
													</div>
												</div>
											);
										})()}
										<div className="text-[10px] text-muted-foreground uppercase truncate">
											{market.exchange}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Price */}
						<div className="space-y-1">
							<div className="text-xs text-muted-foreground">Price</div>
							<div className="font-mono font-bold text-base text-foreground">
								{formatPrice(market.last)}
							</div>
						</div>

						{/* Hourly Chart */}
						<div className="space-y-1">
							<div className="text-xs text-muted-foreground">1h Chart</div>
							{shouldLoadCandles
								? <MarketCandleChart candles={candles} height={48} />
								: (
									<div className="h-12 w-full bg-muted/10 rounded flex items-center justify-center">
										<div className="text-[8px] text-muted-foreground">
											Loading...
										</div>
									</div>
								)}
						</div>

						{/* Change */}
						<div className="space-y-1">
							<div className="text-xs text-muted-foreground">24h Change</div>
							<div
								className={cn(
									"font-mono font-semibold text-sm flex items-center gap-1",
									changeColor,
								)}
							>
								{isPositive
									? <TrendingUp className="h-3 w-3" />
									: <TrendingDown className="h-3 w-3" />}
								<span>
									{isPositive ? "+" : ""}
									{market.percentage.toFixed(2)}%
								</span>
							</div>
						</div>

						{/* Liquidity */}
						<div className="space-y-1 pt-2 border-t border-border/50">
							<div className="text-xs text-muted-foreground">Liquidity</div>
							<div className="font-mono font-semibold text-sm text-foreground">
								{formatNumber(liquidity)}
							</div>
						</div>

						{/* Volume */}
						<div className="space-y-1">
							<div className="text-xs text-muted-foreground">24h Volume</div>
							<div className="font-mono font-semibold text-sm text-foreground">
								{formatNumber(volume)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}, (prevProps, nextProps) => {
	// Custom comparison for better performance
	return (
		prevProps.market.market === nextProps.market.market &&
		prevProps.market.exchange === nextProps.market.exchange &&
		prevProps.market.last === nextProps.market.last &&
		prevProps.market.percentage === nextProps.market.percentage &&
		prevProps.market.liquidity === nextProps.market.liquidity &&
		prevProps.index === nextProps.index &&
		prevProps.isPositive === nextProps.isPositive &&
		prevProps.volume === nextProps.volume &&
		prevProps.liquidity === nextProps.liquidity
	);
});
