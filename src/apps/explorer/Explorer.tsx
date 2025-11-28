/**
 * Data & Blockchain Explorer Component
 * Professional document-oriented design for exploring market data and blockchain
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
	AlertCircle,
	ArrowDownLeft,
	ArrowUpRight,
	BarChart3,
	Check,
	Copy,
	FileText,
	Filter,
	Hash,
	Loader2,
	Search,
	TrendingUp,
	Wallet,
	X,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePublicTransaction } from "@/hooks/use_public_transaction";
import { usePublicTransactions } from "@/hooks/use_public_transactions";
import { usePublicAssetList } from "@/hooks/use_public_asset_list";
import { useMobile } from "@/hooks/use_mobile";
import { toast } from "@/stores";
import { PublicTransactionDetailsDialog } from "./components/public_transaction_details_dialog";
import type { PublicTransactionResult } from "@/hooks/use_public_transactions";
import { formatPrice } from "@/apps/trading/lib/formatting";
import {
	getFirstLetter,
	importCoinIcon,
	importExchangeIcon,
} from "@/lib/icon-utils";
import { INDEXES_METADATA, useIndexStore } from "@/apps/indexes/store";
import type { IndexMetadata } from "@/apps/indexes/types";

/**
 * Format transaction amount
 */
function formatAmount(amount: string, decimals: number = 6): string {
	const num = Number.parseFloat(amount);
	return num.toFixed(decimals);
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Market data structure
 */
interface MarketData {
	market: string;
	exchange: string;
	last: number;
	change: number;
	percentage: number;
	volume?: number;
}

/**
 * Data Explorer Component
 */
function DataExplorer({
	onMarketClick,
	onIndexClick,
}: {
	onMarketClick?: (market: string, exchange: string) => void;
	onIndexClick?: (indexCode: string) => void;
}): React.ReactElement {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedExchange, setSelectedExchange] = useState<string>("all");
	const [selectedType, setSelectedType] = useState<"markets" | "indexes">(
		"markets",
	);
	const [markets, setMarkets] = useState<MarketData[]>([]);

	// Get indexes data
	const indexesKeysString = useIndexStore((state) => state._indexesKeysCache);

	// Load markets from sessionStorage
	const loadMarkets = useCallback((): void => {
		const marketMap = new Map<string, MarketData>();

		try {
			// Pattern: testnet.runtime.ticker.{symbol}.{exchange}.spot
			for (let i = 0; i < sessionStorage.length; i++) {
				const key = sessionStorage.key(i);
				if (!key || !key.startsWith("testnet.runtime.ticker.")) continue;

				const match = key.match(
					/^testnet\.runtime\.ticker\.([^/]+)\/([^.]+)\.([^.]+)\.spot$/i,
				);

				if (match) {
					const [, base, quote, exchange] = match;
					const market = `${base}/${quote}`;
					const marketKey = `${market}.${exchange}`;

					if (!marketMap.has(marketKey)) {
						try {
							const dataStr = sessionStorage.getItem(key);
							if (dataStr) {
								const parsed = JSON.parse(dataStr) as {
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
									const volume = parsed.raw.quoteVolume ||
										parsed.raw.baseVolume || 0;

									marketMap.set(marketKey, {
										market: parsed.raw.market,
										exchange: (parsed.raw.exchange || exchange).toLowerCase(),
										last: parsed.raw.last,
										change: parsed.raw.change || 0,
										percentage: parsed.raw.percentage || 0,
										volume,
									});
								}
							}
						} catch {
							// Error handled silently
						}
					}
				}
			}
		} catch {
			// Error handled silently
		}

		setMarkets(Array.from(marketMap.values()));
	}, []);

	// Load markets on mount and listen to storage changes
	useEffect(() => {
		// Initial load
		loadMarkets();

		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key && e.key.startsWith("testnet.runtime.ticker.")) {
				loadMarkets();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Polling fallback for same-tab updates
		// Use requestAnimationFrame to avoid blocking
		let lastPollTime = 0;
		const pollInterval = setInterval(() => {
			const now = Date.now();
			if (now - lastPollTime < 5000) return; // Throttle to 5 seconds
			lastPollTime = now;
			requestAnimationFrame(() => {
				loadMarkets();
			});
		}, 2000); // Check every 2 seconds

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [loadMarkets]);

	// Get available markets
	const availableMarkets = useMemo(() => markets, [markets]);

	// Get available indexes
	const availableIndexes = useMemo(() => {
		const availableKeys = indexesKeysString ? indexesKeysString.split(",") : [];
		return Object.values(INDEXES_METADATA).filter((metadata) =>
			availableKeys.includes(metadata.code)
		);
	}, [indexesKeysString]);

	// Get unique exchanges
	const exchanges = useMemo(() => {
		const exchangeSet = new Set<string>();
		availableMarkets.forEach((m) => exchangeSet.add(m.exchange));
		return Array.from(exchangeSet).sort();
	}, [availableMarkets]);

	// Filter markets
	const filteredMarkets = useMemo(() => {
		let filtered = availableMarkets;

		// Filter by exchange
		if (selectedExchange !== "all") {
			filtered = filtered.filter((m) => m.exchange === selectedExchange);
		}

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(m) =>
					m.market.toLowerCase().includes(query) ||
					m.exchange.toLowerCase().includes(query),
			);
		}

		return filtered.sort((a, b) => {
			// Sort by volume if available, otherwise by market name
			if (a.volume && b.volume) {
				return b.volume - a.volume;
			}
			return a.market.localeCompare(b.market);
		});
	}, [availableMarkets, selectedExchange, searchQuery]);

	// Filter indexes
	const filteredIndexes = useMemo(() => {
		let filtered = availableIndexes;

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(metadata) =>
					metadata.name.toLowerCase().includes(query) ||
					metadata.code.toLowerCase().includes(query) ||
					metadata.description.toLowerCase().includes(query),
			);
		}

		return filtered;
	}, [availableIndexes, searchQuery]);

	return (
		<div className="space-y-6">
			{/* Search and Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Search className="size-5" />
						Search Market Data
					</CardTitle>
					<CardDescription>
						Search and explore real-time market data from global exchanges
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Search Input */}
					<div className="flex gap-2">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search markets, symbols, or indexes..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									<X className="size-4" />
								</button>
							)}
						</div>
					</div>

					{/* Filters */}
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<Filter className="size-4 text-muted-foreground" />
							<Label className="text-sm">Type:</Label>
							<Tabs
								value={selectedType}
								onValueChange={(value) =>
									setSelectedType(value as typeof selectedType)}
								className="w-auto"
							>
								<TabsList className="h-9">
									<TabsTrigger value="markets" className="text-xs sm:text-sm">
										<TrendingUp className="size-3.5 mr-1.5" />
										Markets
									</TabsTrigger>
									<TabsTrigger value="indexes" className="text-xs sm:text-sm">
										<BarChart3 className="size-3.5 mr-1.5" />
										Indexes
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						{selectedType === "markets" && (
							<div className="flex items-center gap-2">
								<Label className="text-sm">Exchange:</Label>
								<Select
									value={selectedExchange}
									onValueChange={setSelectedExchange}
								>
									<SelectTrigger className="w-[140px] h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Exchanges</SelectItem>
										{exchanges.map((ex) => (
											<SelectItem key={ex} value={ex}>
												{ex.toUpperCase()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Results */}
			{selectedType === "markets"
				? (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">
								Found {filteredMarkets.length}{" "}
								market{filteredMarkets.length !== 1 ? "s" : ""}
							</p>
						</div>

						{filteredMarkets.length === 0
							? (
								<Card>
									<CardContent className="p-8 text-center">
										<Search className="size-12 mx-auto mb-4 text-muted-foreground/50" />
										<p className="text-sm font-medium text-foreground mb-1">
											No markets found
										</p>
										<p className="text-xs text-muted-foreground">
											Try adjusting your search or filters
										</p>
									</CardContent>
								</Card>
							)
							: (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
									{filteredMarkets.map((market, index) => (
										<MarketCard
											key={`${market.market}.${market.exchange}`}
											market={market}
											index={index}
											onClick={() =>
												onMarketClick?.(market.market, market.exchange)}
										/>
									))}
								</div>
							)}
					</div>
				)
				: (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">
								Found {filteredIndexes.length}{" "}
								index{filteredIndexes.length !== 1 ? "es" : ""}
							</p>
						</div>

						{filteredIndexes.length === 0
							? (
								<Card>
									<CardContent className="p-8 text-center">
										<BarChart3 className="size-12 mx-auto mb-4 text-muted-foreground/50" />
										<p className="text-sm font-medium text-foreground mb-1">
											No indexes found
										</p>
										<p className="text-xs text-muted-foreground">
											Try adjusting your search
										</p>
									</CardContent>
								</Card>
							)
							: (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
									{filteredIndexes.map((metadata, index) => (
										<IndexCard
											key={metadata.code}
											metadata={metadata}
											index={index}
											onClick={() => onIndexClick?.(metadata.code)}
										/>
									))}
								</div>
							)}
					</div>
				)}
		</div>
	);
}

/**
 * Market Card Component
 */
function MarketCard({
	market,
	index,
	onClick,
}: {
	market: MarketData;
	index: number;
	onClick?: () => void;
}): React.ReactElement {
	const baseCurrency = market.market.split("/")[0] || "";
	const coinIcon = importCoinIcon(baseCurrency);
	const firstLetter = getFirstLetter(baseCurrency);
	const exchangeIcon = importExchangeIcon(market.exchange);
	const exchangeFirstLetter = getFirstLetter(market.exchange);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * 0.03 }}
		>
			<Card
				className={cn(
					"hover:bg-muted/50 transition-colors cursor-pointer",
					onClick && "hover:border-primary/50",
				)}
				onClick={onClick}
			>
				<CardContent className="p-4">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-3 min-w-0 flex-1">
							{/* Coin Icon */}
							<div className="relative flex-shrink-0">
								{coinIcon
									? (
										<img
											src={coinIcon}
											alt={baseCurrency}
											className="size-10 rounded-full object-cover"
										/>
									)
									: (
										<div className="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
											{firstLetter}
										</div>
									)}
							</div>

							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2 mb-1">
									<h3 className="font-semibold text-foreground truncate">
										{market.market}
									</h3>
									{exchangeIcon
										? (
											<img
												src={exchangeIcon}
												alt={market.exchange}
												className="size-4 rounded object-cover"
											/>
										)
										: (
											<Badge
												variant="outline"
												className="text-[10px] px-1.5 py-0 h-4"
											>
												{exchangeFirstLetter}
											</Badge>
										)}
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<span
										className={cn(
											"text-sm font-bold font-mono",
											market.change >= 0
												? "text-green-600 dark:text-green-400"
												: "text-red-600 dark:text-red-400",
										)}
									>
										{formatPrice(market.last)}
									</span>
									<Badge
										variant={market.change >= 0 ? "default" : "destructive"}
										className="text-[10px] px-1.5 py-0 h-4"
									>
										{market.change >= 0 ? "+" : ""}
										{market.percentage.toFixed(2)}%
									</Badge>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

/**
 * Index Card Component
 */
function IndexCard({
	metadata,
	index,
	onClick,
}: {
	metadata: IndexMetadata;
	index: number;
	onClick?: () => void;
}): React.ReactElement {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: index * 0.03 }}
		>
			<Card
				className={cn(
					"hover:bg-muted/50 transition-colors",
					onClick && "cursor-pointer hover:border-primary/50",
				)}
				onClick={onClick}
			>
				<CardContent className="p-4">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-3 min-w-0 flex-1">
							<div className="p-2 rounded bg-primary/10 flex-shrink-0">
								<BarChart3 className="size-5 text-primary" />
							</div>
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-foreground mb-1">
									{metadata.name}
								</h3>
								<p className="text-xs text-muted-foreground line-clamp-2">
									{metadata.description}
								</p>
								<Badge variant="outline" className="mt-2 text-[10px]">
									{metadata.code}
								</Badge>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

/**
 * Blockchain Explorer Component
 */
function BlockchainExplorer(): React.ReactElement {
	const mobile = useMobile();
	const [activeTab, setActiveTab] = useState<"transaction" | "address">(
		"transaction",
	);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Search states
	const [txHash, setTxHash] = useState<string>("");
	const [address, setAddress] = useState<string>("");

	// Network/Node selection
	const [nodeType, setNodeType] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("explorer_node") || "testnet";
		}
		return "testnet";
	});

	const network = "testnet";

	const handleNodeTypeChange = (value: string): void => {
		setNodeType(value);
		if (typeof window !== "undefined") {
			localStorage.setItem("explorer_node", value);
		}
	};

	const [selectedTransaction, setSelectedTransaction] = useState<
		PublicTransactionResult | null
	>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

	const { assets } = usePublicAssetList({
		network,
		nodeType,
	});

	const tokenMap = useMemo(() => {
		const map = new Map<
			string,
			{ symbol: string; name: string; decimals: number }
		>();
		if (assets && assets.length > 0) {
			assets.forEach((asset) => {
				let tokenId: string | undefined;
				let symbol: string | undefined;
				let name: string | undefined;
				let decimals: number = 6;

				if (asset.raw?.genesis?.token) {
					tokenId = asset.raw.genesis.token.id;
					symbol = asset.raw.genesis.token.metadata.symbol;
					name = asset.raw.genesis.token.metadata.name;
					decimals = asset.raw.genesis.token.metadata.decimals || 6;
				} else if (asset.id && asset.metadata) {
					tokenId = asset.id;
					symbol = asset.metadata.symbol;
					name = asset.metadata.name;
					decimals = asset.metadata.decimals || 6;
				}

				if (tokenId && symbol) {
					map.set(tokenId.toLowerCase(), {
						symbol,
						name: name || symbol,
						decimals,
					});
				}
			});
		}
		return map;
	}, [assets]);

	const {
		transaction: txResult,
		loading: txLoading,
		error: txError,
		hasSearched: txHasSearched,
		refetch: refetchTransaction,
	} = usePublicTransaction({
		tx_hash: txHash,
		network,
		nodeType,
	});

	const {
		transactions: addressTransactions,
		loading: transactionsLoading,
		error: transactionsError,
		total: transactionsTotal,
		hasSearched: transactionsHasSearched,
		refetch: refetchTransactions,
	} = usePublicTransactions({
		address: address,
		network,
		nodeType,
	});

	const handleCopy = async (text: string, field: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
			toast.success("Copied!", `${field} copied to clipboard`);
		} catch {
			toast.error("Copy failed", "Failed to copy to clipboard");
		}
	};

	const handleSearchTransaction = (): void => {
		if (txHash.trim().length === 0) {
			toast.error("Invalid input", "Please enter a transaction hash");
			return;
		}
		refetchTransaction();
	};

	const handleSearchAddress = (): void => {
		if (address.trim().length === 0) {
			toast.error("Invalid input", "Please enter an address");
			return;
		}
		refetchTransactions();
	};

	const getStatusIcon = (status: string): React.ReactElement => {
		switch (status) {
			case "confirmed":
				return <Check className="size-4 text-green-500" />;
			case "pending":
				return <Loader2 className="size-4 text-amber-500 animate-spin" />;
			case "failed":
				return <AlertCircle className="size-4 text-red-500" />;
			default:
				return <AlertCircle className="size-4 text-muted-foreground" />;
		}
	};

	const getStatusBadgeVariant = (
		status: string,
	): "default" | "secondary" | "destructive" | "outline" => {
		switch (status) {
			case "confirmed":
				return "default";
			case "pending":
				return "secondary";
			case "failed":
				return "destructive";
			default:
				return "outline";
		}
	};

	return (
		<div className="space-y-6">
			{/* Network selector */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Hash className="size-5" />
						Blockchain Explorer
					</CardTitle>
					<CardDescription>
						Search transactions, addresses, and balances on the Gliesereum
						network
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						<Label htmlFor="network" className="text-sm text-muted-foreground">
							Network:
						</Label>
						<select
							id="network"
							value={nodeType}
							onChange={(e) => handleNodeTypeChange(e.target.value)}
							className="px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="testnet">Testnet</option>
							<option value="local">Local</option>
						</select>
						{nodeType === "local" && (
							<span className="text-xs text-amber-500">(10.0.0.238:8088)</span>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Search Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as typeof activeTab)}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-2 mb-6">
					<TabsTrigger value="transaction" className="flex items-center gap-2">
						<Hash className="size-4" />
						Transaction
					</TabsTrigger>
					<TabsTrigger value="address" className="flex items-center gap-2">
						<Wallet className="size-4" />
						Address
					</TabsTrigger>
				</TabsList>

				{/* Transaction Search Tab */}
				<TabsContent value="transaction" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Hash className="size-5" />
								Search Transaction by Hash
							</CardTitle>
							<CardDescription>
								Enter a transaction hash to view detailed information
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex gap-2">
								<Input
									placeholder="Enter transaction hash..."
									value={txHash}
									onChange={(e) => setTxHash(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleSearchTransaction();
										}
									}}
									className="font-mono text-sm"
								/>
								<Button
									onClick={handleSearchTransaction}
									disabled={txLoading || txHash.trim().length === 0}
								>
									{txLoading
										? <Loader2 className="size-4 animate-spin" />
										: <Search className="size-4" />}
								</Button>
							</div>

							{txError && (
								<Alert variant="destructive">
									<AlertCircle className="size-4" />
									<AlertDescription>{txError}</AlertDescription>
								</Alert>
							)}

							{!txLoading && !txError && txHasSearched && !txResult && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
									className="text-center py-8"
								>
									<div className="flex flex-col items-center gap-3">
										<Hash className="size-12 text-muted-foreground/50" />
										<div>
											<p className="text-sm font-medium text-foreground">
												Transaction not found
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												No transaction found with this hash
											</p>
										</div>
									</div>
								</motion.div>
							)}

							{txResult && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
									className="space-y-4"
								>
									<Card className="bg-muted/50">
										<CardHeader>
											<div className="flex items-center justify-between">
												<CardTitle className="text-lg">
													Transaction Details
												</CardTitle>
												<Badge
													variant={getStatusBadgeVariant(txResult.status)}
													className="flex items-center gap-1"
												>
													{getStatusIcon(txResult.status)}
													{txResult.status}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="space-y-2">
												<Label className="text-sm text-muted-foreground">
													Transaction Hash
												</Label>
												<div className="flex items-center gap-2">
													<code className="flex-1 font-mono text-sm bg-background px-3 py-2 rounded border border-border break-all">
														{txResult.tx_hash}
													</code>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handleCopy(txResult.tx_hash, "tx_hash")}
													>
														{copiedField === "tx_hash"
															? <Check className="size-4" />
															: <Copy className="size-4" />}
													</Button>
												</div>
											</div>

											<div className="space-y-2">
												<Label className="text-sm text-muted-foreground">
													Amount
												</Label>
												<div className="text-2xl font-bold text-foreground">
													{formatAmount(txResult.transaction.amount, 6)}{" "}
													{tokenMap.get(
														txResult.transaction.token_id.toLowerCase(),
													)
														?.symbol ||
														txResult.transaction.currency ||
														"UNKNOWN"}
												</div>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">
														From
													</Label>
													<div className="flex items-center gap-2">
														<code className="flex-1 font-mono text-xs bg-background px-2 py-1.5 rounded border border-border break-all">
															{txResult.transaction.from}
														</code>
														<Button
															variant="ghost"
															size="sm"
															className="h-8 w-8 p-0"
															onClick={() =>
																handleCopy(txResult.transaction.from, "from")}
														>
															{copiedField === "from"
																? <Check className="size-3" />
																: <Copy className="size-3" />}
														</Button>
													</div>
												</div>
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">
														To
													</Label>
													<div className="flex items-center gap-2">
														<code className="flex-1 font-mono text-xs bg-background px-2 py-1.5 rounded border border-border break-all">
															{txResult.transaction.to}
														</code>
														<Button
															variant="ghost"
															size="sm"
															className="h-8 w-8 p-0"
															onClick={() =>
																handleCopy(txResult.transaction.to, "to")}
														>
															{copiedField === "to"
																? <Check className="size-3" />
																: <Copy className="size-3" />}
														</Button>
													</div>
												</div>
											</div>

											<div className="space-y-2">
												<Label className="text-sm text-muted-foreground">
													Submitted
												</Label>
												<div className="text-sm text-foreground">
													{formatTimestamp(txResult.submitted_at)}
												</div>
											</div>

											<Button
												variant="outline"
												className="w-full"
												onClick={() => {
													setSelectedTransaction(txResult);
													setIsDetailsOpen(true);
												}}
											>
												<FileText className="size-4 mr-2" />
												View Full Details
											</Button>
										</CardContent>
									</Card>
								</motion.div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Address Search Tab */}
				<TabsContent value="address" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Wallet className="size-5" />
								Search Transactions by Address
							</CardTitle>
							<CardDescription>
								Enter an address to view all transactions
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex gap-2">
								<Input
									placeholder="Enter address..."
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleSearchAddress();
										}
									}}
									className="font-mono text-sm"
								/>
								<Button
									onClick={handleSearchAddress}
									disabled={transactionsLoading || address.trim().length === 0}
								>
									{transactionsLoading
										? <Loader2 className="size-4 animate-spin" />
										: <Search className="size-4" />}
								</Button>
							</div>

							{transactionsError && (
								<Alert variant="destructive">
									<AlertCircle className="size-4" />
									<AlertDescription>{transactionsError}</AlertDescription>
								</Alert>
							)}

							{!transactionsLoading &&
								!transactionsError &&
								transactionsHasSearched &&
								addressTransactions.length === 0 && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
									className="text-center py-8"
								>
									<div className="flex flex-col items-center gap-3">
										<Wallet className="size-12 text-muted-foreground/50" />
										<div>
											<p className="text-sm font-medium text-foreground">
												No transactions found
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												This address has no transaction history
											</p>
										</div>
									</div>
								</motion.div>
							)}

							{addressTransactions.length > 0 && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3 }}
									className="space-y-3"
								>
									<div className="flex items-center justify-between">
										<p className="text-sm text-muted-foreground">
											Found {transactionsTotal} transaction
											{transactionsTotal !== 1 ? "s" : ""}
										</p>
									</div>

									{addressTransactions.map((tx, index) => {
										const isOutgoing = tx.transaction.from === address;
										const tokenInfo = tokenMap.get(
											tx.transaction.token_id.toLowerCase(),
										);

										return (
											<motion.div
												key={tx.tx_hash}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.3, delay: index * 0.05 }}
												onClick={() => {
													setSelectedTransaction(tx);
													setIsDetailsOpen(true);
												}}
												className="p-4 rounded border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
											>
												<div className="flex items-start gap-4">
													<div
														className={cn(
															"rounded-full p-2 flex-shrink-0",
															isOutgoing
																? "bg-red-500/10 text-red-500"
																: "bg-green-500/10 text-green-500",
														)}
													>
														{isOutgoing
															? <ArrowUpRight className="size-5" />
															: <ArrowDownLeft className="size-5" />}
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-2 flex-wrap">
															<span className="font-semibold text-foreground">
																{isOutgoing ? "Sent" : "Received"}
															</span>
															<span className="font-mono text-sm text-muted-foreground">
																{formatAmount(tx.transaction.amount, 6)}{" "}
																{tokenInfo?.symbol || tx.transaction.currency ||
																	"UNKNOWN"}
															</span>
															<Badge
																variant={getStatusBadgeVariant(tx.status)}
																className="text-xs"
															>
																{tx.status}
															</Badge>
														</div>
														<div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
															<span className="font-mono">
																{isOutgoing
																	? `To: ${tx.transaction.to.slice(0, 8)}...${
																		tx.transaction.to.slice(-6)
																	}`
																	: `From: ${
																		tx.transaction.from.slice(0, 8)
																	}...${tx.transaction.from.slice(-6)}`}
															</span>
															<span>•</span>
															<span>{formatTimestamp(tx.submitted_at)}</span>
														</div>
														<div className="mt-2">
															<code className="text-xs font-mono text-muted-foreground">
																{tx.tx_hash.slice(0, 16)}...{tx.tx_hash.slice(
																	-8,
																)}
															</code>
														</div>
													</div>
												</div>
											</motion.div>
										);
									})}
								</motion.div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Transaction Details Dialog */}
			{selectedTransaction && (
				<PublicTransactionDetailsDialog
					open={isDetailsOpen}
					onOpenChange={setIsDetailsOpen}
					transaction={selectedTransaction}
					address={address}
					mobile={mobile}
					tokenMap={tokenMap}
				/>
			)}
		</div>
	);
}

/**
 * Main Explorer Component
 */
export default function Explorer({
	onMarketClick,
	onIndexClick,
}: {
	onMarketClick?: (market: string, exchange: string) => void;
	onIndexClick?: (indexCode: string) => void;
}): React.ReactElement {
	const [explorerType, setExplorerType] = useState<"data" | "blockchain">(
		"data",
	);

	return (
		<div className="h-full w-full overflow-y-auto bg-background">
			<div className="py-4 sm:py-4">
				{/* Main Tabs */}
				<Tabs
					value={explorerType}
					onValueChange={(value) =>
						setExplorerType(value as typeof explorerType)}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2 mb-6">
						<TabsTrigger value="data" className="flex items-center gap-2">
							<TrendingUp className="size-4" />
							Data Explorer
						</TabsTrigger>
						<TabsTrigger value="blockchain" className="flex items-center gap-2">
							<Hash className="size-4" />
							Blockchain Explorer
						</TabsTrigger>
					</TabsList>

					<TabsContent value="data" className="mt-0">
						<DataExplorer
							onMarketClick={onMarketClick}
							onIndexClick={onIndexClick}
						/>
					</TabsContent>

					<TabsContent value="blockchain" className="mt-0">
						<BlockchainExplorer />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
