import React, {
	lazy,
	startTransition,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
	Activity,
	ArrowRight,
	BarChart3,
	Coins,
	Container,
	DollarSign,
	Github,
	Info,
	Lock,
	Network,
	Newspaper,
	Search,
	Send,
	TrendingUp,
	Wallet,
	X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfessionalConnectionFlow } from "./professional_connection_flow";
import { TickerMarquee } from "@/components/main/ticker_marquee";
import { IndexCard } from "@/apps/indexes/components/index-card";
import { MarketDetailModal } from "./market_detail_modal";
import { INDEXES_METADATA, useIndexStore } from "@/apps/indexes/store";
import { useIndexesSync } from "@/apps/indexes/hooks/use-indexes-sync";
import { LOTTIE_ANIMATIONS } from "./lottie_config";
import { usePublicWebSocket } from "@/hooks/use_public_web_socket";
import { useAuthStore } from "@/stores/modules/auth.store";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IndexDetail } from "@/apps/indexes/components/index-detail";
import type { IndexCode } from "@/apps/indexes/types";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/hooks/use_theme";
import { TokenListItem } from "./token-list-item";
import { TokenDetailModal } from "./token-detail-modal";
import { usePublicAssetList } from "@/hooks/use_public_asset_list";
import { useAllTokenPrices } from "@/hooks/use_token_price";

// Lazy load heavy components for better performance
const NetworkStats = lazy(() =>
	import("./network_stats").then((m) => ({ default: m.NetworkStats }))
);
const NewsFeed = lazy(() =>
	import("@/apps/trading/components/news-feed").then((m) => ({
		default: m.NewsFeed,
	}))
);
const MarketTable = lazy(() =>
	import("./market_table").then((m) => ({ default: m.MarketTable }))
);
const TopMarkets = lazy(() =>
	import("./top_markets").then((m) => ({ default: m.TopMarkets }))
);
const Explorer = lazy(() => import("@/apps/explorer"));

/**
 * Default public WebSocket server (testnet)
 */
const DEFAULT_PUBLIC_SOCKET = "wss://beta.stels.dev";

/**
 * Welcome Analytics Dashboard
 * Professional CoinMarketCap/Bloomberg-style analytics dashboard
 *
 * Features:
 * - Connects to public WebSocket server on mount
 * - Displays real-time market data: tickers, indexes, network stats, news
 * - Saves all data to sessionStorage (same as authenticated connection)
 * - Closes public WebSocket when user authenticates
 * - Opens authentication form in modal dialog for private access
 */

export function WelcomeAuthPage(): React.ReactElement {
	const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<string>("tokens");
	const {
		isConnected: isAuthenticated,
		connectionSession,
		_hasHydrated,
		isConnecting,
	} = useAuthStore();
	const publicWsCloseRef = useRef<(() => void) | null>(null);
	const { resolvedTheme } = useTheme();

	// Check if we're still loading initial data
	const isLoading = !_hasHydrated || isConnecting;

	// Get current network name
	const currentNetwork = useMemo(() => {
		// If authenticated, use network from connection session
		if (isAuthenticated && connectionSession?.network) {
			// Capitalize first letter
			return connectionSession.network.charAt(0).toUpperCase() +
				connectionSession.network.slice(1);
		}
		// For public connection, determine from socket URL
		if (DEFAULT_PUBLIC_SOCKET.includes("beta.stels.dev")) {
			return "Testnet";
		}
		if (DEFAULT_PUBLIC_SOCKET.includes("mainnet.stels.io")) {
			return "Mainnet";
		}
		if (
			DEFAULT_PUBLIC_SOCKET.includes("10.0.0.238") ||
			DEFAULT_PUBLIC_SOCKET.includes("localhost")
		) {
			return "Localnet";
		}
		return "Public";
	}, [isAuthenticated, connectionSession?.network]);

	// Apply resolved theme to document (will update automatically when system theme changes)
	useEffect(() => {
		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
		root.setAttribute("data-theme", resolvedTheme);
	}, [resolvedTheme]);

	// Public WebSocket connection configuration - memoized to prevent re-creation
	const publicWebSocketConfig = useMemo(
		() => ({
			socket: DEFAULT_PUBLIC_SOCKET,
			protocols: ["webfix"] as string[],
		}),
		[], // Never changes
	);

	/**
	 * Public WebSocket connection
	 * - Connects automatically when component mounts (if not authenticated)
	 * - Saves all received data to sessionStorage (same format as authenticated)
	 * - Automatically closes when user authenticates (enabled = !isAuthenticated)
	 * - After authentication, SessionProvider will connect to authenticated WebSocket
	 */
	const { close: closePublicWs } = usePublicWebSocket(
		publicWebSocketConfig,
		!isAuthenticated, // Only connect if not authenticated, auto-closes when authenticated
	);

	// Store close function for manual cleanup if needed
	useEffect(() => {
		publicWsCloseRef.current = closePublicWs;
	}, [closePublicWs]);

	const handleOpenAuth = useCallback((): void => {
		setIsAuthDialogOpen(true);
	}, []);

	const handleAuthSuccess = useCallback((): void => {
		// Close dialog on successful authentication
		setIsAuthDialogOpen(false);
		// Public WebSocket will be closed automatically by useEffect
	}, []);

	// Get indexes data - use separate selectors to avoid object recreation
	const indexes = useIndexStore((state) => state.indexes);
	const indexesKeysString = useIndexStore((state) => state._indexesKeysCache);
	const setSelectedIndex = useIndexStore((state) => state.setSelectedIndex);
	const selectedIndex = useIndexStore((state) => state.selectedIndex);

	// Get available indexes with data
	const availableIndexes = useMemo(() => {
		const availableKeys = indexesKeysString ? indexesKeysString.split(",") : [];
		return Object.values(INDEXES_METADATA).filter((metadata) =>
			availableKeys.includes(metadata.code)
		);
	}, [indexesKeysString]);

	// Index detail modal state
	const [selectedIndexForModal, setSelectedIndexForModal] = useState<
		IndexCode | null
	>(
		null,
	);

	// Handle index card click - open modal
	const handleIndexClick = useCallback(
		(indexCode: string): void => {
			// Use startTransition for non-critical UI updates
			startTransition(() => {
				setSelectedIndex(indexCode as never);
				setSelectedIndexForModal(indexCode as IndexCode);
			});
		},
		[setSelectedIndex],
	);

	const handleCloseIndexModal = useCallback((): void => {
		setSelectedIndexForModal(null);
	}, []);

	// Memoize index cards to prevent unnecessary re-renders
	const indexCards = useMemo(
		() =>
			availableIndexes.map((metadata) => {
				const indexData = indexes[metadata.code] || null;
				return (
					<IndexCard
						key={metadata.code}
						metadata={metadata}
						data={indexData}
						isSelected={selectedIndex === metadata.code}
						onClick={() => handleIndexClick(metadata.code)}
					/>
				);
			}),
		[availableIndexes, indexes, selectedIndex, handleIndexClick],
	);

	// Market detail modal state
	const [selectedMarket, setSelectedMarket] = useState<
		{
			market: string;
			exchange: string;
		} | null
	>(null);

	const handleMarketClick = useCallback(
		(market: string, exchange: string): void => {
			// Use startTransition for non-critical UI updates
			startTransition(() => {
				setSelectedMarket({ market, exchange });
			});
		},
		[],
	);

	const handleCloseMarketModal = useCallback((): void => {
		setSelectedMarket(null);
	}, []);

	// Token data and state
	// Determine network ID for API call (lowercase)
	const networkId = useMemo(() => {
		if (isAuthenticated && connectionSession?.network) {
			return connectionSession.network;
		}
		// For public connection, determine from socket URL
		if (DEFAULT_PUBLIC_SOCKET.includes("beta.stels.dev")) {
			return "testnet";
		}
		if (DEFAULT_PUBLIC_SOCKET.includes("mainnet.stels.io")) {
			return "mainnet";
		}
		if (
			DEFAULT_PUBLIC_SOCKET.includes("10.0.0.238") ||
			DEFAULT_PUBLIC_SOCKET.includes("localhost")
		) {
			return "localnet";
		}
		return "testnet";
	}, [isAuthenticated, connectionSession?.network]);

	const { assets: tokens, loading: tokensLoading, error: tokensError } =
		usePublicAssetList({
			network: networkId,
		});

	// Get token prices from session - base prices
	const baseTokenPrices = useAllTokenPrices(networkId);

	// Get prices for all tokens dynamically
	// Optimized: use ref to cache token symbols and prevent unnecessary recalculations
	const tokenSymbolsRef = useRef<Set<string>>(new Set());
	const tokenPrices = useMemo(() => {
		const pricesMap = new Map<string, number>(baseTokenPrices);

		// Build set of current token symbols
		const currentSymbols = new Set<string>();
		tokens.forEach((token) => {
			const symbol = token.raw?.genesis?.token?.metadata?.symbol?.toUpperCase();
			if (symbol) {
				currentSymbols.add(symbol);
			}
		});

		// Only recalculate if token symbols changed
		const symbolsChanged =
			tokenSymbolsRef.current.size !== currentSymbols.size ||
			Array.from(currentSymbols).some((s) => !tokenSymbolsRef.current.has(s));

		if (!symbolsChanged && tokenSymbolsRef.current.size > 0) {
			// Symbols haven't changed, just update prices for existing symbols
			Array.from(currentSymbols).forEach((symbol) => {
				if (pricesMap.has(symbol)) return;

				// For USDT, use fixed price of 1
				if (symbol === "USDT") {
					pricesMap.set(symbol, 1);
					return;
				}

				// Try to get price from sessionStorage (only if not in baseTokenPrices)
				const channelKey =
					`${networkId}.runtime.ticker.${symbol}/USDT.bybit.spot`;
				try {
					const stored = sessionStorage.getItem(channelKey) ||
						sessionStorage.getItem(channelKey.toLowerCase());

					if (stored) {
						const tickerData = JSON.parse(stored) as {
							raw?: {
								last?: number;
							};
						};

						if (tickerData?.raw?.last !== undefined) {
							pricesMap.set(symbol, tickerData.raw.last);
						}
					}
				} catch {
					// Error handled silently
				}
			});
		} else {
			// Symbols changed, recalculate all
			tokenSymbolsRef.current = currentSymbols;

			// Get prices for all token symbols from the tokens list
			tokens.forEach((token) => {
				const symbol = token.raw?.genesis?.token?.metadata?.symbol
					?.toUpperCase();
				if (!symbol || pricesMap.has(symbol)) return;

				// For USDT, use fixed price of 1
				if (symbol === "USDT") {
					pricesMap.set(symbol, 1);
					return;
				}

				// Try to get price from sessionStorage
				const channelKey =
					`${networkId}.runtime.ticker.${symbol}/USDT.bybit.spot`;
				try {
					const stored = sessionStorage.getItem(channelKey) ||
						sessionStorage.getItem(channelKey.toLowerCase());

					if (stored) {
						const tickerData = JSON.parse(stored) as {
							raw?: {
								last?: number;
							};
						};

						if (tickerData?.raw?.last !== undefined) {
							pricesMap.set(symbol, tickerData.raw.last);
						}
					}
				} catch {
					// Error handled silently
				}
			});
		}

		return pricesMap;
	}, [tokens, baseTokenPrices, networkId]);

	const [selectedToken, setSelectedToken] = useState<typeof tokens[0] | null>(
		null,
	);
	const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(
		null,
	);

	const handleTokenClick = useCallback(
		(token: typeof tokens[0], index: number): void => {
			// Use startTransition for non-critical UI updates
			startTransition(() => {
				setSelectedToken(token);
				setSelectedTokenIndex(index);
			});
		},
		[],
	);

	const handleCloseTokenModal = useCallback((): void => {
		setSelectedToken(null);
		setSelectedTokenIndex(null);
	}, []);

	// Calculate network statistics - optimized with early returns and caching
	const networkStats = useMemo(() => {
		const validTokens = tokens.filter((token) => token.raw?.genesis?.token);

		// Early return if no tokens
		if (validTokens.length === 0) {
			return {
				totalMarketCap: 0,
				totalTokens: 0,
				tokensWithPrice: 0,
				totalSupply: 0,
				totalMaxSupply: 0,
				averagePrice: null,
			};
		}

		let totalMarketCap = 0;
		let tokensWithPrice = 0;
		let totalSupply = 0;
		let totalMaxSupply = 0;
		let totalSupplyWithPrice = 0; // For average price calculation

		// Optimized loop with cached values
		for (let i = 0; i < validTokens.length; i++) {
			const token = validTokens[i];
			const tokenData = token.raw?.genesis?.token;
			if (!tokenData) continue;

			const symbol = tokenData.metadata?.symbol?.toUpperCase() || "";
			const price = symbol === "USDT" ? 1 : (tokenPrices.get(symbol) || null);
			const initialSupply = parseFloat(
				tokenData.economics?.supply?.initial || "0",
			);
			const maxSupply = parseFloat(
				tokenData.economics?.supply?.max || "0",
			);

			if (price !== null && price > 0 && initialSupply > 0) {
				const marketCap = initialSupply * price;
				totalMarketCap += marketCap;
				tokensWithPrice++;
				totalSupplyWithPrice += initialSupply;
			}

			totalSupply += initialSupply;
			totalMaxSupply += maxSupply;
		}

		const averagePrice = tokensWithPrice > 0 && totalSupplyWithPrice > 0
			? totalMarketCap / totalSupplyWithPrice
			: null;

		return {
			totalMarketCap,
			totalTokens: validTokens.length,
			tokensWithPrice,
			totalSupply,
			totalMaxSupply,
			averagePrice,
		};
	}, [tokens, tokenPrices]);

	// Memoize token list items with sorting by price (descending)
	// Optimized: separate sorting from rendering, cache price lookups
	const tokenListItems = useMemo(() => {
		const validTokens = tokens.filter((token) => token.raw?.genesis?.token);

		if (validTokens.length === 0) {
			return [];
		}

		// Pre-compute prices for all tokens to avoid repeated map lookups
		const tokensWithPrices = validTokens.map((token, index) => {
			const symbol =
				token.raw?.genesis?.token?.metadata?.symbol?.toUpperCase() || "";
			const price = symbol === "USDT" ? 1 : (tokenPrices.get(symbol) || 0);
			return {
				token,
				originalIndex: index,
				symbol,
				price,
			};
		});

		// Sort tokens by price (descending), then by symbol
		tokensWithPrices.sort((a, b) => {
			if (a.price !== b.price) {
				return b.price - a.price;
			}
			return a.symbol.localeCompare(b.symbol);
		});

		return tokensWithPrices.map(({ token, originalIndex, symbol, price }) => {
			const displayPrice = symbol === "USDT" ? 1 : (price > 0 ? price : null);
			return (
				<TokenListItem
					key={token.raw?.genesis?.token?.id || originalIndex}
					token={token as never}
					price={displayPrice}
					isSelected={selectedTokenIndex === originalIndex}
					onClick={() => handleTokenClick(token, originalIndex)}
				/>
			);
		});
	}, [tokens, tokenPrices, selectedTokenIndex, handleTokenClick]);

	// Sync indexes data from sessionStorage
	useIndexesSync();

	// Migration banner state
	const [isMigrationBannerVisible, setIsMigrationBannerVisible] = useState(
		true,
	);

	return (
		<div
			className="h-screen w-full bg-background flex flex-col overflow-hidden"
			style={{ height: "100vh", maxHeight: "100vh" }}
		>
			{/* Migration Banner */}
			{isMigrationBannerVisible && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.3 }}
					className="relative flex-shrink-0 bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20 border-b border-primary/30 backdrop-blur-sm z-[60]"
				>
					<div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 gap-3">
						<div className="flex items-start gap-3 flex-1 min-w-0">
							<div className="flex-shrink-0 mt-0.5">
								<div className="relative">
									<Info className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
									<div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
								</div>
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 flex-wrap">
									<h3 className="text-sm sm:text-base font-bold text-foreground">
										Network Migration in Progress
									</h3>
									<Badge
										variant="outline"
										className="text-[10px] sm:text-xs px-2 py-0.5 border-primary/40 bg-primary/10 text-primary font-semibold"
									>
										Beta Mainnet
									</Badge>
								</div>
								<p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
									We are currently migrating and configuring the Beta Mainnet
									network. The migration process will continue until{" "}
									<span className="font-semibold text-foreground">
										December 3, 2025
									</span>
									. During this period, you may experience temporary service
									interruptions. We appreciate your patience.
								</p>
							</div>
						</div>
						<button
							onClick={() => setIsMigrationBannerVisible(false)}
							className="flex-shrink-0 p-1.5 hover:bg-primary/10 rounded transition-colors group"
							aria-label="Dismiss migration notice"
						>
							<X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
						</button>
					</div>
					{/* Animated gradient line */}
					<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent">
						<motion.div
							className="h-full bg-primary"
							initial={{ width: "0%" }}
							animate={{ width: "100%" }}
							transition={{
								duration: 3,
								repeat: Infinity,
								repeatType: "reverse",
								ease: "easeInOut",
							}}
						/>
					</div>
				</motion.div>
			)}

			{/* Fixed Header with Ticker and Navigation Tabs */}
			<div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border z-50">
				{/* Ticker Marquee */}
				<div className="h-10 border-b border-border flex-shrink-0">
					{isLoading
						? (
							<div className="h-full flex items-center px-4 gap-4 overflow-hidden">
								{Array.from({ length: 8 }).map((_, i) => (
									<Skeleton key={i} className="h-4 w-20 flex-shrink-0" />
								))}
							</div>
						)
						: <TickerMarquee className="h-full" />}
				</div>

				{/* Header Bar with Logo, Tabs, and Auth Button */}
				<div className="flex items-center justify-between px-2 sm:px-4 md:px-6 h-16 border-b border-border flex-shrink-0 gap-2">
					{/* Logo and Network */}
					<motion.div
						initial={false}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0"
					>
						{isLoading
							? <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
							: (
								<div className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center flex-shrink-0">
									<DotLottieReact
										src={LOTTIE_ANIMATIONS.walletMain}
										loop
										speed={0.5}
										autoplay
										style={{ width: "28px", height: "28px" }}
										className="sm:w-8 sm:h-8"
									/>
								</div>
							)}
						<div className="min-w-0">
							{isLoading
								? (
									<div className="space-y-1.5">
										<Skeleton className="h-5 w-20" />
										<div className="flex items-center gap-2">
											<Skeleton className="h-3 w-24 hidden xs:block" />
											<Skeleton className="h-3.5 w-16 rounded-full" />
										</div>
									</div>
								)
								: (
									<>
										<h1 className="text-base sm:text-lg font-bold text-foreground truncate">
											<span className="bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
												STELS
											</span>
										</h1>
										<div className="flex items-center gap-1.5 sm:gap-2">
											<p className="text-[9px] sm:text-[10px] text-muted-foreground hidden xs:block">
												Analytics Dashboard
											</p>
											<Badge
												variant="outline"
												className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 flex items-center gap-0.5 sm:gap-1 border-primary/30 bg-primary/5 flex-shrink-0"
											>
												<Network className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-primary" />
												<span className="text-primary font-medium">
													{currentNetwork}
												</span>
											</Badge>
										</div>
									</>
								)}
						</div>
					</motion.div>

					{/* Navigation Tabs - Document-oriented style */}
					<div className="flex-1 flex items-center justify-center px-1 sm:px-2 md:px-4 min-w-0">
						{isLoading
							? (
								<div className="w-full max-w-4xl">
									<Skeleton className="h-9 sm:h-10 w-full rounded-md" />
								</div>
							)
							: (
								<Tabs
									value={activeTab}
									onValueChange={setActiveTab}
									className="w-full max-w-4xl"
								>
									<TabsList className="w-full justify-start bg-muted/30 h-9 sm:h-10 overflow-x-auto">
										<TabsTrigger
											value="tokens"
											className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 flex-shrink-0"
										>
											<Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
											<span className="hidden sm:inline">Tokens</span>
										</TabsTrigger>
										<TabsTrigger
											value="indexes"
											className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 flex-shrink-0"
										>
											<BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
											<span className="hidden sm:inline">Indexes</span>
										</TabsTrigger>
										<TabsTrigger
											value="markets"
											className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 flex-shrink-0"
										>
											<TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
											<span className="hidden sm:inline">Markets</span>
										</TabsTrigger>
										<TabsTrigger
											value="analytics"
											className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 flex-shrink-0"
										>
											<Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
											<span className="hidden sm:inline">Analytics</span>
										</TabsTrigger>
										<TabsTrigger
											value="explorer"
											className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 flex-shrink-0"
										>
											<Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
											<span className="hidden sm:inline">Explorer</span>
										</TabsTrigger>
										<TabsTrigger
											value="news"
											className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 flex-shrink-0"
										>
											<Newspaper className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
											<span className="hidden sm:inline">News</span>
										</TabsTrigger>
									</TabsList>
								</Tabs>
							)}
					</div>

					{/* Auth Button */}
					<motion.div
						initial={false}
						animate={{ opacity: 1, x: 0 }}
						className="flex-shrink-0"
					>
						{isLoading
							? <Skeleton className="h-9 sm:h-10 w-24 sm:w-32 rounded-md" />
							: (
								<Button
									onClick={handleOpenAuth}
									size="sm"
									className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 sm:h-10 px-2 sm:px-4"
									aria-label="Private Access"
								>
									<Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
									<span className="hidden sm:inline">Private Access</span>
									<ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-2 hidden sm:inline" />
								</Button>
							)}
					</motion.div>
				</div>
			</div>

			{/* Scrollable Content Area */}
			<div className="flex-1 overflow-y-auto min-h-0">
				<Tabs
					value={activeTab}
					onValueChange={(value) => {
						// Use startTransition for tab switching to keep UI responsive
						startTransition(() => {
							setActiveTab(value);
						});
					}}
					className="h-full"
				>
					<div className="w-full max-w-[1920px] mx-auto p-4 sm:p-6">
						{/* Indexes Tab - Only render when active */}
						{activeTab === "indexes" && (
							<TabsContent
								value="indexes"
								className="mt-0 space-y-6"
							>
								<motion.section
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="space-y-6"
								>
									{/* Header with description */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												{isLoading
													? <Skeleton className="h-6 w-6 rounded" />
													: <BarChart3 className="h-6 w-6 text-primary" />}
												{isLoading
													? <Skeleton className="h-8 w-48" />
													: (
														<h2 className="text-2xl font-bold text-foreground">
															Market Indexes
														</h2>
													)}
											</div>
											{isLoading
												? <Skeleton className="h-5 w-20 rounded-full" />
												: (
													availableIndexes.length > 0 && (
														<Badge variant="outline" className="text-xs">
															{availableIndexes.length} active
														</Badge>
													)
												)}
										</div>
										{isLoading
											? (
												<div className="space-y-2">
													<Skeleton className="h-4 w-full max-w-3xl" />
													<Skeleton className="h-4 w-full max-w-2xl" />
												</div>
											)
											: (
												<p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
													Real-time aggregated market indexes powered by STELS
													global monitoring network. All data is continuously
													collected and processed from public sources worldwide,
													ensuring up-to-the-moment accuracy across multiple
													exchanges and markets.
												</p>
											)}
									</div>

									{isLoading
										? (
											<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
												{Array.from({ length: 8 }).map((_, i) => (
													<Card key={i}>
														<CardContent className="p-6 space-y-4">
															<div className="flex items-center justify-between">
																<Skeleton className="h-5 w-24" />
																<Skeleton className="h-4 w-16 rounded-full" />
															</div>
															<Skeleton className="h-8 w-32" />
															<div className="space-y-2">
																<Skeleton className="h-3 w-full" />
																<Skeleton className="h-3 w-3/4" />
															</div>
														</CardContent>
													</Card>
												))}
											</div>
										)
										: availableIndexes.length > 0
										? (
											<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
												{indexCards}
											</div>
										)
										: (
											<Card>
												<CardContent className="p-8 text-center text-muted-foreground">
													<BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
													<p className="text-base font-medium mb-2">
														No indexes available
													</p>
													<p className="text-sm">
														Index data will appear here once the monitoring
														network begins aggregating market information.
													</p>
												</CardContent>
											</Card>
										)}
								</motion.section>
							</TabsContent>
						)}

						{/* Markets Tab */}
						{activeTab === "markets" && (
							<TabsContent
								value="markets"
								className="mt-0 space-y-6"
							>
								<motion.section
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="space-y-6"
								>
									{/* Header with description */}
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											{isLoading
												? <Skeleton className="h-6 w-6 rounded" />
												: <TrendingUp className="h-6 w-6 text-primary" />}
											{isLoading
												? <Skeleton className="h-8 w-40" />
												: (
													<h2 className="text-2xl font-bold text-foreground">
														Live Markets
													</h2>
												)}
										</div>
										{isLoading
											? (
												<div className="space-y-2">
													<Skeleton className="h-4 w-full max-w-3xl" />
													<Skeleton className="h-4 w-full max-w-2xl" />
												</div>
											)
											: (
												<p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
													Comprehensive real-time market data aggregated from
													global exchanges. STELS continuously monitors and
													processes public trading data worldwide, delivering
													live prices, volumes, and liquidity metrics updated in
													real-time.
												</p>
											)}
									</div>

									{/* Top Markets Cards */}
									{isLoading
										? (
											<div className="space-y-4">
												<Card>
													<CardContent className="p-6">
														<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
															{Array.from({ length: 6 }).map((_, i) => (
																<div key={i} className="space-y-3">
																	<Skeleton className="h-4 w-24" />
																	<Skeleton className="h-8 w-32" />
																	<Skeleton className="h-3 w-20" />
																</div>
															))}
														</div>
													</CardContent>
												</Card>
												<Card>
													<CardContent className="p-6">
														<div className="space-y-4">
															{Array.from({ length: 5 }).map((_, i) => (
																<div
																	key={i}
																	className="flex items-center justify-between"
																>
																	<div className="flex items-center gap-3">
																		<Skeleton className="h-10 w-10 rounded-full" />
																		<div className="space-y-2">
																			<Skeleton className="h-4 w-24" />
																			<Skeleton className="h-3 w-16" />
																		</div>
																	</div>
																	<div className="space-y-2 text-right">
																		<Skeleton className="h-4 w-20 ml-auto" />
																		<Skeleton className="h-3 w-16 ml-auto" />
																	</div>
																</div>
															))}
														</div>
													</CardContent>
												</Card>
											</div>
										)
										: (
											<>
												<Suspense
													fallback={
														<Card>
															<CardContent className="p-8 text-center text-muted-foreground">
																<Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
																<p>Loading markets...</p>
															</CardContent>
														</Card>
													}
												>
													<TopMarkets onMarketClick={handleMarketClick} />
												</Suspense>

												{/* Market Data Table */}
												<Suspense
													fallback={
														<Card>
															<CardContent className="p-8 text-center text-muted-foreground">
																<Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
																<p>Loading market table...</p>
															</CardContent>
														</Card>
													}
												>
													<MarketTable onMarketClick={handleMarketClick} />
												</Suspense>
											</>
										)}
								</motion.section>
							</TabsContent>
						)}

						{/* Analytics Tab - Only render when active */}
						{activeTab === "analytics" && (
							<TabsContent
								value="analytics"
								className="mt-0 space-y-6"
							>
								<motion.section
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="space-y-6"
								>
									{/* Header with description */}
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											{isLoading
												? <Skeleton className="h-6 w-6 rounded" />
												: <Activity className="h-6 w-6 text-primary" />}
											{isLoading
												? <Skeleton className="h-8 w-48" />
												: (
													<h2 className="text-2xl font-bold text-foreground">
														Network Analytics
													</h2>
												)}
										</div>
										{isLoading
											? (
												<div className="space-y-2">
													<Skeleton className="h-4 w-full max-w-3xl" />
													<Skeleton className="h-4 w-full max-w-2xl" />
												</div>
											)
											: (
												<p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
													Real-time network performance metrics from STELS
													distributed monitoring infrastructure. Live statistics
													on node operations, worker activity, and system
													health, continuously updated as the network processes
													and aggregates global market data.
												</p>
											)}
									</div>

									<Card className="h-full">
										<CardContent className="p-6">
											{isLoading
												? (
													<div className="space-y-6">
														<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
															{Array.from({ length: 3 }).map((_, i) => (
																<div key={i} className="space-y-2">
																	<Skeleton className="h-4 w-24" />
																	<Skeleton className="h-8 w-32" />
																</div>
															))}
														</div>
														<div className="space-y-4">
															{Array.from({ length: 4 }).map((_, i) => (
																<Skeleton key={i} className="h-16 w-full" />
															))}
														</div>
													</div>
												)
												: (
													<Suspense
														fallback={
															<div className="p-8 text-center text-muted-foreground">
																<Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
																<p>Loading network statistics...</p>
															</div>
														}
													>
														<NetworkStats />
													</Suspense>
												)}
										</CardContent>
									</Card>
								</motion.section>
							</TabsContent>
						)}

						{/* Explorer Tab - Only render when active */}
						{activeTab === "explorer" && (
							<TabsContent
								value="explorer"
								className="mt-0 space-y-6"
							>
								<motion.section
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="space-y-6"
								>
									{/* Header with description */}
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											{isLoading
												? <Skeleton className="h-6 w-6 rounded" />
												: <Search className="h-6 w-6 text-primary" />}
											{isLoading
												? <Skeleton className="h-8 w-40" />
												: (
													<h2 className="text-2xl font-bold text-foreground">
														Data Explorer
													</h2>
												)}
										</div>
										{isLoading
											? (
												<div className="space-y-2">
													<Skeleton className="h-4 w-full max-w-3xl" />
													<Skeleton className="h-4 w-full max-w-2xl" />
												</div>
											)
											: (
												<p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
													Explore real-time market data streams aggregated by
													STELS monitoring network. Search and analyze live
													trading information collected from public sources
													worldwide, with data continuously updated as new
													information becomes available.
												</p>
											)}
									</div>

									{isLoading
										? (
											<Card>
												<CardContent className="p-6 space-y-4">
													<Skeleton className="h-10 w-full" />
													<div className="space-y-3">
														{Array.from({ length: 6 }).map((_, i) => (
															<Skeleton key={i} className="h-16 w-full" />
														))}
													</div>
												</CardContent>
											</Card>
										)
										: (
											<Suspense
												fallback={
													<Card>
														<CardContent className="p-8 text-center text-muted-foreground">
															<Search className="h-8 w-8 mx-auto mb-2 animate-pulse" />
															<p>Loading explorer...</p>
														</CardContent>
													</Card>
												}
											>
												<Explorer
													onMarketClick={handleMarketClick}
													onIndexClick={handleIndexClick}
												/>
											</Suspense>
										)}
								</motion.section>
							</TabsContent>
						)}

						{/* Tokens Tab - Only render when active */}
						{activeTab === "tokens" && (
							<TabsContent
								value="tokens"
								className="mt-0 space-y-6"
							>
								<motion.section
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="space-y-6"
								>
									{/* Header with description */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												{isLoading || tokensLoading
													? <Skeleton className="h-6 w-6 rounded" />
													: <Coins className="h-6 w-6 text-primary" />}
												{isLoading || tokensLoading
													? <Skeleton className="h-8 w-40" />
													: (
														<h2 className="text-2xl font-bold text-foreground">
															Tokens
														</h2>
													)}
											</div>
											{isLoading || tokensLoading
												? <Skeleton className="h-5 w-20 rounded-full" />
												: (
													tokenListItems.length > 0 && (
														<Badge variant="outline" className="text-xs">
															{tokenListItems.length} active
														</Badge>
													)
												)}
										</div>
										{isLoading || tokensLoading
											? (
												<div className="space-y-2">
													<Skeleton className="h-4 w-full max-w-3xl" />
													<Skeleton className="h-4 w-full max-w-2xl" />
												</div>
											)
											: (
												<p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
													Real-time token information from STELS network. Browse
													all available tokens with detailed economics,
													distribution, and technical parameters. All data is
													continuously updated as new tokens are registered on
													the network.
												</p>
											)}
									</div>

									{/* Network Assets Overview */}
									{!isLoading && !tokensLoading && !tokensError &&
										networkStats.totalTokens > 0 && (
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.5, delay: 0.1 }}
											className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
										>
											<Card className="bg-card/80 border-border">
												<CardContent className="p-4">
													<div className="flex items-center gap-3 mb-2">
														<div className="p-2 bg-primary/10 rounded">
															<DollarSign className="h-5 w-5 text-primary" />
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-xs text-muted-foreground uppercase tracking-wide">
																Total Market Cap
															</p>
															<p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
																{networkStats.totalMarketCap > 0
																	? new Intl.NumberFormat("en-US", {
																		style: "currency",
																		currency: "USD",
																		minimumFractionDigits: 0,
																		maximumFractionDigits: 0,
																	}).format(networkStats.totalMarketCap)
																	: "N/A"}
															</p>
														</div>
													</div>
													<p className="text-xs text-muted-foreground mt-2">
														{networkStats.tokensWithPrice}{" "}
														token{networkStats.tokensWithPrice === 1 ? "" : "s"}
														{" "}
														with price data
													</p>
												</CardContent>
											</Card>

											<Card className="bg-card/80 border-border">
												<CardContent className="p-4">
													<div className="flex items-center gap-3 mb-2">
														<div className="p-2 bg-amber-500/10 rounded">
															<Coins className="h-5 w-5 text-amber-500" />
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-xs text-muted-foreground uppercase tracking-wide">
																Total Tokens
															</p>
															<p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
																{networkStats.totalTokens}
															</p>
														</div>
													</div>
													<p className="text-xs text-muted-foreground mt-2">
														Active tokens on network
													</p>
												</CardContent>
											</Card>

											<Card className="bg-card/80 border-border">
												<CardContent className="p-4">
													<div className="flex items-center gap-3 mb-2">
														<div className="p-2 bg-blue-500/10 rounded">
															<Wallet className="h-5 w-5 text-blue-500" />
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-xs text-muted-foreground uppercase tracking-wide">
																Total Supply
															</p>
															<p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
																{networkStats.totalSupply >= 1_000_000_000
																	? `${
																		(networkStats.totalSupply / 1_000_000_000)
																			.toFixed(2)
																	}B`
																	: networkStats.totalSupply >= 1_000_000
																	? `${
																		(networkStats.totalSupply / 1_000_000)
																			.toFixed(2)
																	}M`
																	: networkStats.totalSupply >= 1_000
																	? `${
																		(networkStats.totalSupply / 1_000).toFixed(
																			2,
																		)
																	}K`
																	: networkStats.totalSupply.toLocaleString()}
															</p>
														</div>
													</div>
													<p className="text-xs text-muted-foreground mt-2">
														Initial supply across all tokens
													</p>
												</CardContent>
											</Card>

											<Card className="bg-card/80 border-border">
												<CardContent className="p-4">
													<div className="flex items-center gap-3 mb-2">
														<div className="p-2 bg-green-500/10 rounded">
															<TrendingUp className="h-5 w-5 text-green-500" />
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-xs text-muted-foreground uppercase tracking-wide">
																Max Supply
															</p>
															<p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
																{networkStats.totalMaxSupply >= 1_000_000_000
																	? `${
																		(networkStats.totalMaxSupply /
																			1_000_000_000).toFixed(2)
																	}B`
																	: networkStats.totalMaxSupply >= 1_000_000
																	? `${
																		(networkStats.totalMaxSupply / 1_000_000)
																			.toFixed(2)
																	}M`
																	: networkStats.totalMaxSupply >= 1_000
																	? `${
																		(networkStats.totalMaxSupply / 1_000)
																			.toFixed(2)
																	}K`
																	: networkStats.totalMaxSupply
																		.toLocaleString()}
															</p>
														</div>
													</div>
													<p className="text-xs text-muted-foreground mt-2">
														Maximum supply capacity
													</p>
												</CardContent>
											</Card>
										</motion.div>
									)}

									{isLoading || tokensLoading
										? (
											<Card>
												<CardContent className="p-6 space-y-3">
													{Array.from({ length: 6 }).map((_, i) => (
														<Skeleton
															key={i}
															className="h-20 w-full rounded border border-border"
														/>
													))}
												</CardContent>
											</Card>
										)
										: tokensError
										? (
											<Card>
												<CardContent className="p-8 text-center text-muted-foreground">
													<Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
													<p className="text-base font-medium mb-2">
														Error loading tokens
													</p>
													<p className="text-sm">{tokensError}</p>
												</CardContent>
											</Card>
										)
										: tokenListItems.length > 0
										? (
											<Card>
												<CardContent className="p-0">
													<div className="space-y-2 p-4">
														{tokenListItems}
													</div>
												</CardContent>
											</Card>
										)
										: (
											<Card>
												<CardContent className="p-8 text-center text-muted-foreground">
													<Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
													<p className="text-base font-medium mb-2">
														No tokens available
													</p>
													<p className="text-sm">
														Token data will appear here once tokens are
														registered on the network.
													</p>
												</CardContent>
											</Card>
										)}
								</motion.section>
							</TabsContent>
						)}

						{/* News Tab - Only render when active */}
						{activeTab === "news" && (
							<TabsContent
								value="news"
								className="mt-0 space-y-6"
							>
								<motion.section
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="space-y-6"
								>
									{/* Header with description */}
									<div className="space-y-2">
										<div className="flex items-center gap-3">
											{isLoading
												? <Skeleton className="h-6 w-6 rounded" />
												: <Newspaper className="h-6 w-6 text-primary" />}
											{isLoading
												? <Skeleton className="h-8 w-36" />
												: (
													<h2 className="text-2xl font-bold text-foreground">
														Market News
													</h2>
												)}
										</div>
										{isLoading
											? (
												<div className="space-y-2">
													<Skeleton className="h-4 w-full max-w-3xl" />
													<Skeleton className="h-4 w-full max-w-2xl" />
												</div>
											)
											: (
												<p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
													Real-time financial news and market updates aggregated
													from global sources. STELS monitoring network
													continuously collects and processes public news feeds,
													delivering the latest information as it becomes
													available worldwide.
												</p>
											)}
									</div>

									<Card className="h-full flex flex-col">
										<CardContent className="flex-1 overflow-hidden p-0">
											{isLoading
												? (
													<div className="p-6 space-y-4">
														{Array.from({ length: 5 }).map((_, i) => (
															<div key={i} className="space-y-3">
																<Skeleton className="h-4 w-3/4" />
																<Skeleton className="h-20 w-full" />
																<Skeleton className="h-3 w-24" />
															</div>
														))}
													</div>
												)
												: (
													<ScrollArea className="h-full">
														<div className="p-6">
															<Suspense
																fallback={
																	<div className="p-8 text-center text-muted-foreground">
																		<Newspaper className="h-8 w-8 mx-auto mb-2 animate-pulse" />
																		<p>Loading news feed...</p>
																	</div>
																}
															>
																<NewsFeed />
															</Suspense>
														</div>
													</ScrollArea>
												)}
										</CardContent>
									</Card>
								</motion.section>
							</TabsContent>
						)}
					</div>
				</Tabs>
			</div>

			{/* Fixed Footer */}
			<div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur-sm z-40">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-2">
					<div className="text-center sm:text-left">
						<p className="text-xs text-muted-foreground/60 mt-1">
							© 2025 Gliesereum Ukraine. Licensed under MIT.
						</p>
					</div>

					{/* Theme Toggle and Social Links */}
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<a
							href="https://github.com/STELS-Laboratory"
							target="_blank"
							rel="noopener noreferrer"
							className="group flex items-center gap-2 px-3 py-2 bg-card/80 border border-border hover:border-primary/50 hover:bg-primary/5 rounded transition-all duration-300"
							aria-label="Visit STELS Laboratory on GitHub"
						>
							<Github className="h-4 w-4 text-foreground group-hover:text-primary transition-colors" />
							<span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
								GitHub
							</span>
						</a>

						<a
							href="https://hub.docker.com/u/gliesereum"
							target="_blank"
							rel="noopener noreferrer"
							className="group flex items-center gap-2 px-3 py-2 bg-card/80 border border-border hover:border-blue-500/50 hover:bg-blue-500/5 rounded transition-all duration-300"
							aria-label="View Gliesereum on Docker Hub"
						>
							<Container className="h-4 w-4 text-foreground group-hover:text-blue-500 transition-colors" />
							<span className="text-xs font-medium text-foreground group-hover:text-blue-500 transition-colors">
								Docker
							</span>
						</a>

						<a
							href="https://t.me/c/2328305982/8"
							target="_blank"
							rel="noopener noreferrer"
							className="group flex items-center gap-2 px-3 py-2 bg-card/80 border border-border hover:border-blue-400/50 hover:bg-blue-400/5 rounded transition-all duration-300"
							aria-label="Join STELS community on Telegram"
						>
							<Send className="h-4 w-4 text-foreground group-hover:text-blue-400 transition-colors" />
							<span className="text-xs font-medium text-foreground group-hover:text-blue-400 transition-colors">
								Telegram
							</span>
						</a>
					</div>
				</div>
			</div>

			{/* Market Detail Modal */}
			{selectedMarket && (
				<MarketDetailModal
					market={selectedMarket.market}
					exchange={selectedMarket.exchange}
					open={!!selectedMarket}
					onOpenChange={(open) => {
						if (!open) {
							handleCloseMarketModal();
						}
					}}
				/>
			)}

			{/* Index Detail Modal */}
			{selectedIndexForModal && (
				<Dialog
					open={!!selectedIndexForModal}
					onOpenChange={(open) => {
						if (!open) {
							handleCloseIndexModal();
						}
					}}
				>
					<DialogContent
						className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 gap-0"
						showCloseButton={false}
					>
						<DialogHeader className="sr-only">
							<DialogTitle>Index Details</DialogTitle>
							<DialogDescription>
								Detailed information about {selectedIndexForModal} index
							</DialogDescription>
						</DialogHeader>
						<div className="p-4 sm:p-6">
							<IndexDetail
								indexCode={selectedIndexForModal}
								data={indexes[selectedIndexForModal] || null}
								onClose={handleCloseIndexModal}
							/>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* Token Detail Modal */}
			{selectedToken && (
				<TokenDetailModal
					token={selectedToken as never}
					price={(() => {
						const symbol = selectedToken.raw?.genesis?.token?.metadata?.symbol
							?.toUpperCase() || "";
						return symbol === "USDT" ? 1 : (tokenPrices.get(symbol) || null);
					})()}
					open={!!selectedToken}
					onOpenChange={(open) => {
						if (!open) {
							handleCloseTokenModal();
						}
					}}
				/>
			)}

			{/* Authentication Dialog */}
			<Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
				<DialogContent
					className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0"
					showCloseButton={true}
				>
					<DialogHeader className="sr-only">
						<DialogTitle>Authentication</DialogTitle>
						<DialogDescription>
							Complete the authentication process to access STELS Web 5
						</DialogDescription>
					</DialogHeader>
					<div className="p-4 sm:p-6 md:p-8">
						<ProfessionalConnectionFlow onSuccess={handleAuthSuccess} />
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
