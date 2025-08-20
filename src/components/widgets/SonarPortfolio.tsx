import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import Loader from "@/components/ui/loader.tsx";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import { useMemo, useState } from "react";

interface AssetData {
	symbol: string;
	amount: number;
	value: number;
	change?: number;
	changePercent?: number;
	price?: number;
	priceSource?: "realtime" | "fallback";
	changeValue?: number;
}

interface PortfolioMetrics {
	totalLiquidity: number;
	available: number;
	protection: number;
	rate: number;
	activeWorkers: number;
	totalWorkers: number;
	totalPortfolioValue: number;
	totalChange: number;
	totalChangePercent: number;
	priceStatus: {
		realtimeCount: number;
		totalCount: number;
	};
}

function SonarPortfolio() {
	const session = useSessionStoreSync() as any;
	const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

	if (
		!session || !session["testnet.snapshot.sonar"] ||
		!session["testnet.runtime.sonar"]
	) {
		return <Loader>Scanning connection Testnet</Loader>;
	}

	const ASSET_PRICES: Record<string, number> = useMemo(() => {
		const prices: Record<string, number> = {
			USDT: 1, // Stablecoin always 1:1
		};

		// Major cryptocurrencies with real-time prices
		const majorPairs = [
			{ symbol: "BTC", pair: "BTC/USDT:USDT" },
			{ symbol: "ETH", pair: "ETH/USDT:USDT" },
			{ symbol: "SOL", pair: "SOL/USDT:USDT" },
			{ symbol: "BNB", pair: "BNB/USDT:USDT" },
			{ symbol: "TRX", pair: "TRX/USDT:USDT" },
			{ symbol: "JASMY", pair: "JASMY/USDT:USDT" },
		];

		majorPairs.forEach(({ symbol, pair }) => {
			try {
				const tickerKey =
					`testnet.runtime.connector.exchange.crypto.bybit.futures.${pair}.ticker`;
				const tickerData = session[tickerKey];

				if (tickerData?.raw?.last) {
					prices[symbol] = tickerData.raw.last;
				} else {
					// Fallback prices for missing data
					const fallbackPrices: Record<string, number> = {};
					prices[symbol] = fallbackPrices[symbol] || 1;
				}
			} catch (error) {
				console.warn(`Failed to fetch price for ${symbol}:`, error);
				// Use fallback prices
				const fallbackPrices: Record<string, number> = {};
				prices[symbol] = fallbackPrices[symbol] || 1;
			}
		});

		// Minor tokens with estimated prices (could be fetched from other sources)
		const minorTokens: Record<string, number> = {};

		// Add minor tokens, using fallback if not in session
		Object.entries(minorTokens).forEach(([symbol, fallbackPrice]) => {
			prices[symbol] = fallbackPrice;
		});

		return prices;
	}, [session]);

	const snapshot = session["testnet.snapshot.sonar"];
	const runtime = session["testnet.runtime.sonar"];

	// Process assets with accurate value calculations
	const assets: AssetData[] = useMemo(() => {
		const snapshotCoins = snapshot.raw.coins;
		const runtimeCoins = runtime.raw.coins;

		return Object.keys(runtimeCoins).map((symbol) => {
			const currentAmount = runtimeCoins[symbol];
			const previousAmount = snapshotCoins[symbol] || 0;
			const change = currentAmount - previousAmount;
			const changePercent = previousAmount > 0
				? (change / previousAmount) * 100
				: 0;

			// Get asset price and determine source
			const price = ASSET_PRICES[symbol] || 1;
			const majorPairs = ["BTC", "ETH", "SOL", "BNB", "TON", "GRT"];
			const priceSource: "realtime" | "fallback" =
				majorPairs.includes(symbol) &&
					session[
						`testnet.runtime.connector.exchange.crypto.bybit.futures.${symbol}/USDT:USDT.ticker`
					]?.raw?.last
					? "realtime"
					: "fallback";

			const value = currentAmount * price;
			const changeValue = change * price;

			return {
				symbol,
				amount: currentAmount,
				value,
				price,
				priceSource,
				change,
				changePercent,
				changeValue,
			};
		}).filter((asset) => asset.amount > 0).sort((a, b) => b.value - a.value);
	}, [snapshot, runtime, ASSET_PRICES, session]);

	// Calculate portfolio metrics with accurate totals
	const metrics: PortfolioMetrics = useMemo(() => {
		const totalPortfolioValue = assets.reduce(
			(sum, asset) => sum + asset.value,
			0,
		);
		const totalChange = assets.reduce(
			(sum, asset) => sum + (asset.changeValue || 0),
			0,
		);
		const totalChangePercent = totalPortfolioValue > 0
			? (totalChange / (totalPortfolioValue - totalChange)) * 100
			: 0;

		const realtimeCount = assets.filter((asset) =>
			asset.priceSource === "realtime"
		).length;
		const totalCount = assets.length;

		return {
			totalLiquidity: runtime.raw.liquidity,
			available: runtime.raw.available,
			protection: runtime.raw.protection,
			rate: runtime.raw.rate,
			activeWorkers: runtime.raw.workers.active,
			totalWorkers: runtime.raw.workers.total,
			totalPortfolioValue,
			totalChange,
			totalChangePercent,
			priceStatus: {
				realtimeCount,
				totalCount,
			},
		};
	}, [assets, runtime]);

	// Generate pie chart data
	const pieData = useMemo(() =>
		assets.map((asset) => ({
			symbol: asset.symbol,
			value: asset.value,
			percentage: (asset.value / metrics.totalPortfolioValue) * 100,
		})), [assets, metrics.totalPortfolioValue]);

	const formatNumber = (num: number, decimals: number = 2): string => {
		if (num === 0) return "0";
		if (Math.abs(num) < 0.000001) return num.toExponential(2);
		return num.toFixed(decimals);
	};

	const formatCurrency = (num: number): string => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(num);
	};

	const formatAssetAmount = (symbol: string, amount: number): string => {
		// Different formatting for different asset types
		if (symbol === "USDT") {
			return formatCurrency(amount);
		}
		if (["BTC", "ETH", "SOL", "BNB"].includes(symbol)) {
			return `${formatNumber(amount, 8)} ${symbol}`;
		}
		if (amount >= 1000) {
			return `${formatNumber(amount, 2)} ${symbol}`;
		}
		return `${formatNumber(amount, 6)} ${symbol}`;
	};

	const getChangeIcon = (change: number) => {
		if (change > 0) return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
		if (change < 0) return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
		return <MinusIcon className="w-4 h-4 text-gray-500" />;
	};

	const getChangeColor = (change: number) => {
		if (change > 0) return "text-green-500";
		if (change < 0) return "text-red-500";
		return "text-gray-500";
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-zinc-100">
						Portfolio Overview
					</h2>
					<p className="text-zinc-400">
						Real-time portfolio performance and asset allocation
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Badge
						variant="outline"
						className="bg-amber-500/10 text-amber-500 border-amber-500/20"
					>
						{metrics.activeWorkers}/{metrics.totalWorkers} Workers Active
					</Badge>
					<Badge
						variant="outline"
						className={`${
							metrics.priceStatus.realtimeCount ===
									metrics.priceStatus.totalCount
								? "bg-green-500/10 text-green-500 border-green-500/20"
								: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
						}`}
					>
						{metrics.priceStatus.realtimeCount}/{metrics.priceStatus.totalCount}
						{" "}
						Real-time Prices
					</Badge>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="bg-zinc-900/50 border-zinc-800">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-zinc-400">Portfolio Value</p>
								<p className="text-xl font-semibold text-zinc-100">
									{formatCurrency(metrics.totalPortfolioValue)}
								</p>
								{metrics.totalChange !== 0 && (
									<div className="flex items-center space-x-1 mt-1">
										{getChangeIcon(metrics.totalChange)}
										<span
											className={`text-sm ${
												getChangeColor(metrics.totalChange)
											}`}
										>
											{metrics.totalChange > 0 ? "+" : ""}
											{formatCurrency(metrics.totalChange)}
										</span>
										<span
											className={`text-xs ${
												getChangeColor(metrics.totalChange)
											}`}
										>
											({metrics.totalChangePercent > 0 ? "+" : ""}
											{metrics.totalChangePercent.toFixed(2)}%)
										</span>
									</div>
								)}
							</div>
							<div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
								<span className="text-amber-500 text-sm font-medium">$</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-zinc-900/50 border-zinc-800">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-zinc-400">Total Liquidity</p>
								<p className="text-xl font-semibold text-zinc-100">
									{formatCurrency(metrics.totalLiquidity)}
								</p>
							</div>
							<div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
								<span className="text-blue-500 text-sm font-medium">💧</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-zinc-900/50 border-zinc-800">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-zinc-400">Available</p>
								<p className="text-xl font-semibold text-zinc-100">
									{formatCurrency(metrics.available)}
								</p>
							</div>
							<div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
								<span className="text-green-500 text-sm font-medium">✓</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-zinc-900/50 border-zinc-800">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-zinc-400">Rate</p>
								<p className="text-xl font-semibold text-zinc-100">
									{(metrics.rate * 100).toFixed(2)}%
								</p>
							</div>
							<div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
								<span className="text-purple-500 text-sm font-medium">%</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Pie Chart */}
				<Card className="lg:col-span-1 bg-zinc-900/50 border-zinc-800">
					<CardHeader>
						<CardTitle className="text-zinc-100">Asset Allocation</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{pieData.slice(0, 8).map((item, index) => (
								<div key={item.symbol} className="flex items-center space-x-3">
									<div
										className="w-4 h-4 rounded-full"
										style={{
											backgroundColor: `hsl(${index * 45}, 70%, 60%)`,
										}}
									/>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-zinc-100 truncate">
												{item.symbol}
											</span>
											<span className="text-sm text-zinc-400">
												{item.percentage.toFixed(1)}%
											</span>
										</div>
										<div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
											<div
												className="h-1.5 rounded-full"
												style={{
													width: `${item.percentage}%`,
													backgroundColor: `hsl(${index * 45}, 70%, 60%)`,
												}}
											/>
										</div>
									</div>
								</div>
							))}
							{pieData.length > 8 && (
								<div className="pt-2">
									<Separator className="bg-zinc-800" />
									<p className="text-xs text-zinc-500 mt-2">
										+{pieData.length - 8} more assets
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Asset List */}
				<Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800">
					<CardHeader>
						<CardTitle className="text-zinc-100">Asset Performance</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{assets.map((asset) => (
								<div
									key={asset.symbol}
									className={`p-3 rounded-lg border transition-colors cursor-pointer ${
										selectedAsset === asset.symbol
											? "bg-amber-500/10 border-amber-500/30"
											: "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70"
									}`}
									onClick={() =>
										setSelectedAsset(
											selectedAsset === asset.symbol ? null : asset.symbol,
										)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
												<span className="text-amber-500 text-sm font-bold">
													{asset.symbol.slice(0, 2)}
												</span>
											</div>
											<div>
												<p className="font-medium text-zinc-100">
													{asset.symbol}
												</p>
												<p className="text-sm text-zinc-400">
													{formatAssetAmount(asset.symbol, asset.amount)}
												</p>
												{asset.price && asset.price !== 1 && (
													<div className="flex items-center space-x-1">
														<p className="text-xs text-zinc-500">
															Price: {formatCurrency(asset.price)}
														</p>
														<div
															className={`w-1.5 h-1.5 rounded-full ${
																asset.priceSource === "realtime"
																	? "bg-green-500"
																	: "bg-yellow-500"
															}`}
															title={asset.priceSource === "realtime"
																? "Real-time price"
																: "Estimated price"}
														/>
													</div>
												)}
											</div>
										</div>

										<div className="text-right">
											<p className="font-medium text-zinc-100">
												{formatCurrency(asset.value)}
											</p>
											{asset.change !== undefined && asset.change !== 0 && (
												<div className="flex items-center space-x-1">
													{getChangeIcon(asset.change)}
													<span
														className={`text-sm ${
															getChangeColor(asset.change)
														}`}
													>
														{asset.change > 0 ? "+" : ""}
														{formatAssetAmount(asset.symbol, asset.change)}
													</span>
													{asset.changePercent !== undefined && (
														<span
															className={`text-xs ${
																getChangeColor(asset.change)
															}`}
														>
															({asset.changePercent > 0 ? "+" : ""}
															{asset.changePercent.toFixed(2)}%)
														</span>
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Summary */}
			<Card className="bg-zinc-900/50 border-zinc-800">
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-zinc-400">Portfolio Summary</p>
							<p className="text-2xl font-bold text-zinc-100">
								{formatCurrency(metrics.totalPortfolioValue)}
							</p>
							{metrics.totalChange !== 0 && (
								<p className={`text-sm ${getChangeColor(metrics.totalChange)}`}>
									{metrics.totalChange > 0 ? "+" : ""}
									{formatCurrency(metrics.totalChange)}
									({metrics.totalChangePercent > 0 ? "+" : ""}
									{metrics.totalChangePercent.toFixed(2)}%)
								</p>
							)}
						</div>
						<div className="text-right">
							<p className="text-sm text-zinc-400">Total Assets</p>
							<p className="text-lg font-semibold text-zinc-100">
								{assets.length}
							</p>
							<p className="text-xs text-zinc-500">
								{assets.filter((a) => a.change && a.change > 0).length} gaining
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default SonarPortfolio;
