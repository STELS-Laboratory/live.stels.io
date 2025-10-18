import type React from "react";
import { useCallback, useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
	Activity,
	AlertCircle,
	BarChart3,
	Calculator,
	Clock,
	DollarSign,
	Eye,
	Globe,
	Loader2,
	MapPin,
	RefreshCw,
	Shield,
	ShoppingCart,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import { cn, filterSession } from "@/lib/utils.ts";
import { Progress } from "@/components/ui/progress.tsx";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import Loader from "@/components/ui/loader.tsx";
import TestnetStatusAlert from "@/components/notifications/TestnetStatusAlert.tsx";

// Import Scanner components and utilities
import { AccountCard, ErrorState, MetricCard } from "./Scanner/components";
import {
	formatCurrency,
	formatCurrencyWithColor,
	ProfessionalCalculations,
	validateAddress,
} from "./Scanner/utils.ts";
import type {
	NetworkConnectionData,
	OrderInfo,
	WalletResponse,
	WelcomeSessionData,
} from "./Scanner/types.ts";
export default function WalletWidget(): React.ReactElement {
	const [address, setAddress] = useState("");
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<WalletResponse[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isResultsOpen, setIsResultsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("overview");
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();

		if (!address.trim()) {
			setError("Please enter a Wallet address");
			return;
		}

		if (!validateAddress(address.trim())) {
			setError(
				"Invalid Wallet address format. Please check your address and try again.",
			);
			return;
		}

		setLoading(true);
		setError(null);
		setResponse(null);
		setIsResultsOpen(false);

		try {
			const requestBody = {
				webfix: "1.0",
				method: "getWalletInfo",
				params: ["gliesereum"],
				body: {
					address: address.trim(),
				},
			};

			const res = await fetch("http://10.0.0.238:8088", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!res.ok) {
				if (res.status === 404) {
					throw new Error(
						"Wallet not found. Please verify the address and try again.",
					);
				} else if (res.status === 429) {
					throw new Error(
						"Too many requests. Please wait a moment and try again.",
					);
				} else if (res.status >= 500) {
					throw new Error("Server error. Please try again later.");
				}
				throw new Error(`Request failed with status ${res.status}`);
			}

			const data = await res.json();

			if (!data || data.length === 0) {
				setError(
					"This Wallet is not connected to the network or has not performed any actions yet. Please check the address or try again later.",
				);
				return;
			}

			setResponse(data);
			setIsResultsOpen(true);
		} catch (err) {
			const errorMessage = err instanceof Error
				? err.message
				: "An unexpected error occurred. Please try again.";
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [address]);

	const handleRetry = useCallback(() => {
		if (address.trim()) {
			const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
			handleSubmit(fakeEvent);
		}
	}, [address, handleSubmit]);

	const handleRefresh = useCallback(async () => {
		if (!response || response.length === 0) return;

		setIsRefreshing(true);
		try {
			const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
			await handleSubmit(fakeEvent);
		} finally {
			setIsRefreshing(false);
		}
	}, [response, handleSubmit]);

	// Calculate overall statistics for all accounts
	const totalStats = useMemo(() => {
		if (!response) return null;

		let totalEquity = 0;
		let totalWalletBalance = 0;
		let totalAvailableBalance = 0;
		let totalPerpUPL = 0;
		let totalPositions = 0;
		let totalOpenOrders = 0;

		response.forEach((account) => {
			totalEquity += Number.parseFloat(
				account.wallet.info.result.list[0].totalEquity,
			);
			totalWalletBalance += Number.parseFloat(
				account.wallet.info.result.list[0].totalWalletBalance,
			);
			totalAvailableBalance += Number.parseFloat(
				account.wallet.info.result.list[0].totalAvailableBalance || "0",
			);
			totalPerpUPL += Number.parseFloat(
				account.wallet.info.result.list[0].totalPerpUPL,
			);

			account.positions?.forEach((positionData) => {
				totalPositions += positionData.value.raw.positions.length;
			});

			account.orders?.spot?.forEach((spotData) => {
				Object.values(spotData.value.raw.orders).forEach((symbolOrders) => {
					const typedOrders = symbolOrders as {
						open: OrderInfo[];
						closed: OrderInfo[];
						canceled: OrderInfo[];
					};
					totalOpenOrders += typedOrders.open?.length || 0;
				});
			});
			account.orders?.futures?.forEach((futuresData) => {
				Object.values(futuresData.value.raw.orders).forEach((symbolOrders) => {
					const typedOrders = symbolOrders as {
						open: OrderInfo[];
						closed: OrderInfo[];
						canceled: OrderInfo[];
					};
					totalOpenOrders += typedOrders.open?.length || 0;
				});
			});
		});

		return {
			totalEquity,
			totalWalletBalance,
			totalAvailableBalance,
			totalPerpUPL,
			totalPositions,
			totalOpenOrders,
			accountsCount: response.length,
		};
	}, [response]);

	const session = useSessionStoreSync() as WelcomeSessionData | null;

	if (
		!session || !session["testnet.snapshot.sonar"] ||
		!session["testnet.runtime.sonar"]
	) {
		return <Loader>Scanning connection Testnet</Loader>;
	}

	const netMap = filterSession(session || {}, /\.heterogen\..*\.setting$/);
	const networkConnections =
		session["testnet.network.connections"] as unknown as
			| NetworkConnectionData
			| null;

	console.log(netMap);
	console.log("Network Connections:", networkConnections);

	const snapshot = session["testnet.snapshot.sonar"];
	const runtime = session["testnet.runtime.sonar"];
	const lastTransaction = session["testnet.runtime.transactions"];
	const timezone = session["testnet.runtime.timezone"];
	const news = session["testnet.runtime.news.finance"];

	console.log(snapshot);
	console.log(runtime);
	console.log(lastTransaction);
	console.log(timezone);
	console.log(news);

	const calc = ProfessionalCalculations;

	const liquidityPnL = calc.calculatePnL(
		runtime.raw.liquidity,
		snapshot.raw.liquidity,
	);
	const availablePnL = calc.calculatePnL(
		runtime.raw.available,
		snapshot.raw.available,
	);
	const marginPnL = calc.calculatePnL(
		runtime.raw.margin.balance,
		snapshot.raw.margin.balance,
	);
	const protectionPnL = calc.calculatePnL(
		runtime.raw.protection,
		snapshot.raw.protection,
	);

	const marginAnalysis = calc.calculateMarginRatio(
		runtime.raw.margin.balance,
		runtime.raw.margin.initial,
		runtime.raw.margin.maintenance,
	);
	const workerAnalysis = calc.calculateWorkerEfficiency(runtime.raw.workers);
	const networkAnalysis = calc.analyzeNetworkNodes(netMap);

	const totalROI = calc.calculatePnL(
		runtime.raw.liquidity,
		snapshot.raw.liquidity,
	);

	// Calculate asset values in USD using ticker data
	const getAssetValue = (coin: string, amount: number): number => {
		const tickerKey =
			`testnet.runtime.connector.exchange.crypto.bybit.spot.${coin}/USDT.ticker`;
		const tickerData = session[tickerKey] as
			| { raw?: { last?: number } }
			| undefined;

		if (tickerData && tickerData.raw && tickerData.raw.last) {
			return amount * tickerData.raw.last;
		}

		// Fallback: if no ticker data, assume 1:1 for USDT or return 0
		return coin === "USDT" ? amount : 0;
	};

	// Get portfolio assets with USD values (filter by $500+ threshold)
	const portfolioAssets = Object.entries(runtime.raw.coins)
		.filter(([, amount]) => Number(amount) > 0)
		.map(([coin, amount]) => {
			const usdValue = getAssetValue(coin, Number(amount));
			const snapshotAmount = snapshot.raw.coins[coin] || 0;
			const change = Number(amount) - Number(snapshotAmount);
			const changePercent = snapshotAmount > 0
				? (change / Number(snapshotAmount)) * 100
				: 0;

			return {
				coin,
				amount: Number(amount),
				usdValue,
				change,
				changePercent,
				price: (session[
					`testnet.runtime.connector.exchange.crypto.bybit.spot.${coin}/USDT.ticker`
				] as { raw?: { last?: number } } | undefined)?.raw?.last || 0,
			};
		})
		.filter((asset) => asset.usdValue >= 500) // Filter assets with $500+ value
		.sort((a, b) => b.usdValue - a.usdValue); // Sort by USD value descending

	const totalPortfolioValue = portfolioAssets.reduce(
		(sum, asset) => sum + asset.usdValue,
		0,
	);

	return (
		<div className="container m-auto">
			{/* Notify Users */}
			<TestnetStatusAlert variant="compact" className="mb-6" />

			{/* Navigation Tabs */}
			<Card className="p-0 bg-background border-0">
				<CardContent className="p-0">
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="w-full h-auto p-1 mb-2 bg-muted/50 border rounded-none grid grid-cols-5">
							<TabsTrigger
								value="overview"
								className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-background data-[state=active]:shadow-sm"
							>
								<BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">Overview</span>
								<span className="sm:hidden">Over</span>
							</TabsTrigger>
							<TabsTrigger
								value="network"
								className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-background data-[state=active]:shadow-sm"
							>
								<Globe className="h-3 w-3 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">Network</span>
								<span className="sm:hidden">Net</span>
							</TabsTrigger>
							<TabsTrigger
								value="portfolio"
								className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-background data-[state=active]:shadow-sm"
							>
								<Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">Portfolio</span>
								<span className="sm:hidden">Port</span>
							</TabsTrigger>
							<TabsTrigger
								value="news"
								className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-background data-[state=active]:shadow-sm"
							>
								<Activity className="h-3 w-3 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">Market News</span>
								<span className="sm:hidden">News</span>
							</TabsTrigger>
							<TabsTrigger
								value="scanner"
								className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-muted/70 data-[state=active]:bg-background data-[state=active]:shadow-sm"
							>
								<Target className="h-3 w-3 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">Scanner</span>
								<span className="sm:hidden">Scan</span>
							</TabsTrigger>
						</TabsList>

						{/* Overview Tab */}
						<TabsContent
							value="overview"
							className="p-0 space-y-3 sm:space-y-4"
						>
							{/* Key Performance Metrics */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 min-w-0">
								{/* Total Liquidity */}
								<Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
									<CardHeader className="pb-3">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
											<Wallet className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
											TOTAL LIQUIDITY
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
											${runtime.raw.liquidity.toLocaleString("en-US", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</div>
										<div
											className={cn(
												"flex items-center text-sm transition-colors",
												liquidityPnL.isProfit
													? "text-emerald-400"
													: "text-red-400",
											)}
										>
											{liquidityPnL.isProfit
												? <TrendingUp className="w-4 h-4 mr-1" />
												: <TrendingDown className="w-4 h-4 mr-1" />}
											${liquidityPnL.absolute.toLocaleString("en-US", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
											<span className="ml-1">
												({liquidityPnL.percentage.toLocaleString("en-US", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}%)
											</span>
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											vs previous snapshot
										</div>
									</CardContent>
								</Card>

								{/* Available Balance */}
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
											<DollarSign className="w-4 h-4 mr-2" />
											AVAILABLE BALANCE
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-foreground mb-2">
											${runtime.raw.available.toLocaleString("en-US", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</div>
										<div
											className={cn(
												"flex items-center text-sm",
												availablePnL.isProfit
													? "text-emerald-400"
													: "text-red-400",
											)}
										>
											{availablePnL.isProfit
												? <TrendingUp className="w-4 h-4 mr-1" />
												: <TrendingDown className="w-4 h-4 mr-1" />}
											${availablePnL.absolute.toLocaleString("en-US", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
											<span
												className={cn(
													"ml-1",
													availablePnL.isProfit
														? "text-emerald-400"
														: "text-red-400",
												)}
											>
												({availablePnL.percentage.toLocaleString("en-US", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}%)
											</span>
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											<span className="text-blue-400 font-medium">
												{((runtime.raw.available / runtime.raw.liquidity) * 100)
													.toLocaleString("en-US", {
														minimumFractionDigits: 1,
														maximumFractionDigits: 1,
													})}%
											</span>{" "}
											of total liquidity
										</div>
									</CardContent>
								</Card>

								{/* Portfolio ROI */}
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
											<Target className="w-4 h-4 mr-2" />
											PORTFOLIO NAV
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div
											className={cn(
												"text-2xl font-bold mb-2",
												totalROI.isProfit ? "text-emerald-400" : "text-red-400",
											)}
										>
											{totalROI.percentage.toLocaleString("en-US", {
												minimumFractionDigits: 3,
												maximumFractionDigits: 3,
											})}%
										</div>
										<div
											className={cn(
												"flex items-center text-sm",
												totalROI.isProfit ? "text-emerald-400" : "text-red-400",
											)}
										>
											{totalROI.isProfit
												? <TrendingUp className="w-4 h-4 mr-1" />
												: <TrendingDown className="w-4 h-4 mr-1" />}
											${totalROI.absolute.toLocaleString("en-US", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											growth NAV
										</div>
									</CardContent>
								</Card>

								{/* Performance Rate */}
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
											<Activity className="w-4 h-4 mr-2" />
											PERFORMANCE RATE
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-foreground mb-2">
											{(runtime.raw.rate * 100).toLocaleString("en-US", {
												minimumFractionDigits: 3,
												maximumFractionDigits: 3,
											})}%
										</div>
										<div
											className={cn(
												"flex items-center text-sm",
												runtime.raw.rate > snapshot.raw.rate
													? "text-emerald-400"
													: "text-red-400",
											)}
										>
											{runtime.raw.rate > snapshot.raw.rate
												? <TrendingUp className="w-4 h-4 mr-1" />
												: <TrendingDown className="w-4 h-4 mr-1" />}
											{(((runtime.raw.rate - snapshot.raw.rate) /
												snapshot.raw.rate) *
												100).toLocaleString("en-US", {
													minimumFractionDigits: 3,
													maximumFractionDigits: 3,
												})}%
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											vs previous rate
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Protection & Risk Management */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center text-foreground">
										<Shield className="w-5 h-5 mr-2" />
										PROTECTION & RISK MANAGEMENT
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
										<div className="text-center">
											<div className="text-xs text-muted-foreground mb-2">
												PROTECTION VALUE
											</div>
											<div
												className={cn(
													"text-2xl font-bold mb-1",
													runtime.raw.protection >= 0
														? "text-emerald-400"
														: "text-red-400",
												)}
											>
												{calc.formatCurrency(runtime.raw.protection)}
											</div>
											<div
												className={cn(
													"text-xs flex items-center justify-center",
													protectionPnL.isProfit
														? "text-emerald-400"
														: "text-red-400",
												)}
											>
												{protectionPnL.isProfit
													? <TrendingUp className="w-3 h-3 mr-1" />
													: <TrendingDown className="w-3 h-3 mr-1" />}
												{calc.formatCurrency(protectionPnL.absolute)}
											</div>
										</div>

										<div className="text-center">
											<div className="text-xs text-muted-foreground mb-2">
												RISK LEVEL
											</div>
											<Badge
												variant="outline"
												className={cn(
													"text-sm px-3 py-1",
													marginAnalysis.riskLevel === "LOW" &&
														"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
													marginAnalysis.riskLevel === "MEDIUM" &&
														"border-amber-500/30 bg-amber-500/10 text-amber-400",
													marginAnalysis.riskLevel === "HIGH" &&
														"border-orange-500/30 bg-orange-500/10 text-orange-400",
													marginAnalysis.riskLevel === "CRITICAL" &&
														"border-red-500/30 bg-red-500/10 text-red-400",
												)}
											>
												{marginAnalysis.riskLevel}
											</Badge>
											<div className="text-xs text-muted-foreground mt-1">
												based on margin
											</div>
										</div>

										<div className="text-center">
											<div className="text-xs text-muted-foreground mb-2">
												EXCHANGE
											</div>
											<div className="text-sm font-medium text-amber-400">
												{runtime.raw.exchanges.length > 0
													? runtime.raw.exchanges[0].toUpperCase()
													: "N/A"}
											</div>
											<div className="text-xs text-muted-foreground mt-1">
												primary exchange
											</div>
										</div>

										<div className="text-center">
											<div className="text-xs text-muted-foreground mb-2">
												ACCOUNTS
											</div>
											<div className="text-sm font-medium text-blue-400">
												{runtime.raw.accounts.length}
											</div>
											<div className="text-xs text-muted-foreground mt-1">
												active accounts
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Advanced Analytics Section */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
								{/* Margin Analysis */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center text-foreground">
											<Calculator className="w-5 h-5 mr-2" />
											MARGIN ANALYSIS
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<div className="text-xs text-muted-foreground mb-1">
													BALANCE
												</div>
												<div className="text-lg font-bold text-foreground">
													{calc.formatCurrency(runtime.raw.margin.balance)}
												</div>
												<div
													className={cn(
														"text-xs",
														marginPnL.isProfit
															? "text-emerald-400"
															: "text-red-400",
													)}
												>
													{calc.formatCurrency(marginPnL.absolute)}{" "}
													({calc.formatPercentage(marginPnL.percentage)})
												</div>
											</div>
											<div>
												<div className="text-xs text-muted-foreground mb-1">
													MARGIN LEVEL
												</div>
												<div className="text-lg font-bold text-foreground">
													{marginAnalysis.marginLevel.toFixed(2)}×
												</div>
												<Badge
													variant="outline"
													className={cn(
														"text-xs",
														marginAnalysis.riskLevel === "LOW" &&
															"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
														marginAnalysis.riskLevel === "MEDIUM" &&
															"border-amber-500/30 bg-amber-500/10 text-amber-400",
														marginAnalysis.riskLevel === "HIGH" &&
															"border-orange-500/30 bg-orange-500/10 text-orange-400",
														marginAnalysis.riskLevel === "CRITICAL" &&
															"border-red-500/30 bg-red-500/10 text-red-400",
													)}
												>
													{marginAnalysis.riskLevel}
												</Badge>
											</div>
										</div>

										<div>
											<div className="flex justify-between items-center mb-2">
												<span className="text-sm text-muted-foreground">
													UTILIZATION RATIO
												</span>
												<span
													className={cn(
														"text-sm font-mono",
														marginAnalysis.utilizationRatio > 80
															? "text-red-400"
															: marginAnalysis.utilizationRatio > 60
															? "text-amber-400"
															: "text-emerald-400",
													)}
												>
													{marginAnalysis.utilizationRatio.toFixed(2)}%
												</span>
											</div>
											<Progress
												value={marginAnalysis.utilizationRatio}
												className="h-2"
											/>
										</div>

										<div className="pt-2 space-y-2 text-xs">
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Initial Margin:
												</span>
												<span className="text-foreground font-mono">
													{calc.formatCurrency(runtime.raw.margin.initial)}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">
													Maintenance:
												</span>
												<span className="text-foreground font-mono">
													{calc.formatCurrency(runtime.raw.margin.maintenance)}
												</span>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Worker Optimization */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center text-foreground">
											<Users className="w-5 h-5 mr-2" />
											PROTOCOL OPTIMIZATION
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-3 gap-4 text-center">
											<div>
												<div className="text-xs text-muted-foreground mb-1">
													ACTIVE
												</div>
												<div className="text-2xl font-bold text-emerald-400">
													{runtime.raw.workers.active}
												</div>
											</div>
											<div>
												<div className="text-xs text-muted-foreground mb-1">
													STOPPED
												</div>
												<div className="text-2xl font-bold text-red-400">
													{runtime.raw.workers.stopped}
												</div>
											</div>
											<div>
												<div className="text-xs text-muted-foreground mb-1">
													TOTAL
												</div>
												<div className="text-2xl font-bold text-foreground">
													{runtime.raw.workers.total}
												</div>
											</div>
										</div>

										<div>
											<div className="flex justify-between items-center mb-2">
												<span className="text-sm text-muted-foreground">
													EFFICIENCY
												</span>
												<div className="flex items-center space-x-2">
													<span
														className={cn(
															"text-sm font-mono",
															workerAnalysis.efficiency >= 95
																? "text-emerald-400"
																: workerAnalysis.efficiency >= 80
																? "text-blue-400"
																: workerAnalysis.efficiency >= 60
																? "text-amber-400"
																: "text-red-400",
														)}
													>
														{workerAnalysis.efficiency.toFixed(1)}%
													</span>
													<Badge
														variant="outline"
														className={cn(
															"text-xs",
															workerAnalysis.status === "OPTIMAL" &&
																"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
															workerAnalysis.status === "GOOD" &&
																"border-blue-500/30 bg-blue-500/10 text-blue-400",
															workerAnalysis.status === "WARNING" &&
																"border-amber-500/30 bg-amber-500/10 text-amber-400",
															workerAnalysis.status === "CRITICAL" &&
																"border-red-500/30 bg-red-500/10 text-red-400",
														)}
													>
														{workerAnalysis.status}
													</Badge>
												</div>
											</div>
											<Progress
												value={workerAnalysis.efficiency}
												className="h-2 bg-muted"
											/>
										</div>

										<div className="pt-2">
											<div className="text-xs text-muted-foreground mb-2">
												PERFORMANCE INSIGHTS
											</div>
											<div className="space-y-1 text-xs">
												<div className="flex justify-between">
													<span className="text-muted-foreground">Uptime:</span>
													<span className="text-foreground">
														{workerAnalysis.efficiency.toFixed(1)}%
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">
														Avg. Load:
													</span>
													<span className="text-foreground">
														{((runtime.raw.workers.active /
															runtime.raw.workers.total) * 100).toFixed(1)}%
													</span>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						{/* Network Tab */}
						<TabsContent value="network" className="p-0 space-y-4">
							{/* Network Connections Status */}
							{networkConnections && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center text-foreground">
											<Globe className="w-5 h-5 mr-2" />
											NETWORK CONNECTIONS STATUS
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0 overflow-hidden">
											{/* Total Clients */}
											<div className="text-center">
												<div className="text-xs text-muted-foreground mb-2">
													TOTAL CLIENTS
												</div>
												<div className="text-2xl font-bold text-amber-400 mb-1">
													{networkConnections.raw.totalClients}
												</div>
												<div className="text-xs text-muted-foreground">
													active connections
												</div>
											</div>

											{/* Authenticated Clients */}
											<div className="text-center">
												<div className="text-xs text-muted-foreground mb-2">
													AUTHENTICATED CLIENTS
												</div>
												<div className="text-2xl font-bold text-amber-400 mb-1">
													{networkConnections.raw.authenticatedClients}
												</div>
												<div className="text-xs text-muted-foreground">
													verified credentials
												</div>
											</div>

											{/* Anonymous Clients */}
											<div className="text-center">
												<div className="text-xs text-muted-foreground mb-2">
													ANONYMOUS CLIENTS
												</div>
												<div className="text-2xl font-bold text-foreground mb-1">
													{networkConnections.raw.anonymousClients}
												</div>
												<div className="text-xs text-muted-foreground">
													unauthenticated access
												</div>
											</div>

											{/* Session Count */}
											<div className="text-center">
												<div className="text-xs text-muted-foreground mb-2">
													ACTIVE SESSIONS
												</div>
												<div className="text-2xl font-bold text-amber-400 mb-1">
													{networkConnections.raw.sessionCount}
												</div>
												<div className="text-xs text-muted-foreground">
													communication sessions
												</div>
											</div>

											{/* Max Connections Per Session */}
											<div className="text-center">
												<div className="text-xs text-muted-foreground mb-2">
													MAX CONNECTIONS/SESSION
												</div>
												<div className="text-2xl font-bold text-foreground mb-1">
													{networkConnections.raw.maxConnectionsPerSession}
												</div>
												<div className="text-xs text-muted-foreground">
													concurrent limit
												</div>
											</div>

											{/* Data Transmission Interval */}
											<div className="text-center">
												<div className="text-xs text-muted-foreground mb-2">
													DATA TRANSMISSION INTERVAL
												</div>
												<div className="text-2xl font-bold text-foreground mb-1">
													{networkConnections.raw.dataTransmissionInterval}ms
												</div>
												<div className="text-xs text-muted-foreground">
													transmission cycle
												</div>
											</div>
										</div>

										{/* Network Status Indicators */}
										<div className="mt-6 pt-4 border-t border-border">
											<div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-0 overflow-hidden">
												<div className="text-center">
													<div className="text-xs text-muted-foreground mb-2">
														STREAMING STATUS
													</div>
													<div className="text-2xl font-bold text-amber-400 mb-1">
														{networkConnections.raw.streamingActive
															? "ONLINE"
															: "OFFLINE"}
													</div>
													<div className="text-xs text-muted-foreground">
														data streaming
													</div>
												</div>

												<div className="text-center">
													<div className="text-xs text-muted-foreground mb-2">
														CLEANUP PROCESS
													</div>
													<div className="text-2xl font-bold text-amber-400 mb-1">
														{networkConnections.raw.cleanupRunning
															? "RUNNING"
															: "STOPPED"}
													</div>
													<div className="text-xs text-muted-foreground">
														background cleanup
													</div>
												</div>

												<div className="text-center">
													<div className="text-xs text-muted-foreground mb-2">
														HEARTBEAT INTERVAL
													</div>
													<div className="text-2xl font-bold text-foreground mb-1">
														{networkConnections.raw.heartbeatInterval}ms
													</div>
													<div className="text-xs text-muted-foreground">
														connection health
													</div>
												</div>

												<div className="text-center">
													<div className="text-xs text-muted-foreground mb-2">
														NETWORK ENVIRONMENT
													</div>
													<div className="text-2xl font-bold text-foreground mb-1">
														{networkConnections.raw.network.toUpperCase()}
													</div>
													<div className="text-xs text-muted-foreground">
														environment type
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Network Nodes Status */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center text-foreground">
										<Globe className="w-5 h-5 mr-2" />
										NETWORK NODES STATUS
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-0 overflow-hidden">
										<div className="text-center">
											<div className="text-xs text-muted-foreground mb-2">
												TOTAL HETEROGENS
											</div>
											<div className="text-2xl font-bold text-foreground mb-1">
												{networkAnalysis.totalNodes}
											</div>
											<div className="text-xs text-muted-foreground">
												distributed globally
											</div>
										</div>

										<div className="text-center">
											<div className="text-xs text-muted-foreground mb-2">
												ACTIVE NODES
											</div>
											<div className="text-2xl font-bold text-emerald-400 mb-1">
												{networkAnalysis.activeNodes}
											</div>
											<div className="text-xs text-emerald-400">
												{networkAnalysis.totalNodes > 0
													? ((networkAnalysis.activeNodes /
														networkAnalysis.totalNodes) * 100).toFixed(1)
													: 0}% online
											</div>
										</div>

										<div className="text-center">
											<div className="text-xs text-muted-foreground mb-2">
												NETWORK HEALTH
											</div>
											<Badge
												variant="outline"
												className={cn(
													"text-sm px-3 py-1",
													networkAnalysis.healthStatus === "EXCELLENT" &&
														"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
													networkAnalysis.healthStatus === "GOOD" &&
														"border-blue-500/30 bg-blue-500/10 text-blue-400",
													networkAnalysis.healthStatus === "STABLE" &&
														"border-amber-500/30 bg-amber-500/10 text-amber-400",
													networkAnalysis.healthStatus === "CRITICAL" &&
														"border-red-500/30 bg-red-500/10 text-red-400",
												)}
											>
												{networkAnalysis.healthStatus}
											</Badge>
											<div className="text-xs text-muted-foreground mt-1">
												overall status
											</div>
										</div>

										<div className="text-center">
											<div className="text-xs text-muted-foreground mb-2">
												REGIONS
											</div>
											<div className="text-sm font-medium text-blue-400">
												{Object.keys(networkAnalysis.regions).length}
											</div>
											<div className="text-xs text-muted-foreground mt-1">
												countries
											</div>
										</div>
									</div>

									{/* Regional Distribution */}
									<div className="mt-6 pt-4 border-t  min-w-0 overflow-hidden">
										<div className="text-xs text-muted-foreground mb-3">
											REGIONAL DISTRIBUTION
										</div>
										<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 min-w-0 overflow-hidden">
											{Object.entries(networkAnalysis.regions)
												.sort(([, a], [, b]) => b - a)
												.slice(0, 8)
												.map(([country, count]) => (
													<div
														key={country}
														className="flex items-center justify-between text-xs min-w-0"
													>
														<div className="flex items-center min-w-0 overflow-hidden">
															<MapPin className="w-3 h-3 mr-1 text-muted-foreground" />
															<span className="text-card-foreground truncate">
																{country}
															</span>
														</div>
														<Badge
															variant="outline"
															className="text-xs px-2 py-0.5 border-border text-card-foreground"
														>
															{count}
														</Badge>
													</div>
												))}
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Portfolio Tab */}
						<TabsContent value="portfolio" className="p-0 space-y-3">
							{/* Portfolio Overview with Enhanced Visualization */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
								{/* Enhanced Pie Chart with Visual Representation */}
								<Card className="lg:col-span-1">
									<CardHeader className="pb-2">
										<CardTitle className="text-xs flex items-center">
											<Wallet className="w-3 h-3 mr-1" />
											ASSET DISTRIBUTION ($500+)
										</CardTitle>
									</CardHeader>
									<CardContent>
										{/* Enhanced Pie Chart with Better Visualization */}
										<div className="mb-3">
											<div className="relative w-28 h-28 mx-auto">
												{(() => {
													const topAssets = portfolioAssets.slice(0, 6);

													// Professional color palette with better contrast
													const colors = [
														"#3b82f6", // Blue
														"#10b981", // Emerald
														"#8b5cf6", // Purple
														"#f59e0b", // Amber
														"#ef4444", // Red
														"#06b6d4", // Cyan
													];

													// Calculate total value for percentage calculation
													const totalValue = topAssets.reduce(
														(sum, asset) => sum + asset.usdValue,
														0,
													);

													let cumulativeAngle = 0;

													return (
														<svg
															className="w-28 h-28"
															viewBox="0 0 100 100"
														>
															{/* Background circle */}
															<circle
																cx="50"
																cy="50"
																r="45"
																fill="none"
																stroke="rgba(255,255,255,0.1)"
																strokeWidth="2"
															/>

															{topAssets.map((asset, index) => {
																const percentage =
																	(asset.usdValue / totalValue) * 100;
																const angle = (percentage / 100) * 360;

																// Calculate path for pie slice
																const startAngle = cumulativeAngle;
																const endAngle = cumulativeAngle + angle;

																const startAngleRad = (startAngle * Math.PI) /
																	180;
																const endAngleRad = (endAngle * Math.PI) / 180;

																const x1 = 50 + 40 * Math.cos(startAngleRad);
																const y1 = 50 + 40 * Math.sin(startAngleRad);
																const x2 = 50 + 40 * Math.cos(endAngleRad);
																const y2 = 50 + 40 * Math.sin(endAngleRad);

																const largeArcFlag = angle > 180 ? 1 : 0;

																const pathData = [
																	`M 50 50`,
																	`L ${x1} ${y1}`,
																	`A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
																	`Z`,
																].join(" ");

																cumulativeAngle += angle;

																return (
																	<g key={asset.coin}>
																		<path
																			d={pathData}
																			fill={colors[index % colors.length]}
																			stroke="rgba(0,0,0,0.1)"
																			strokeWidth="0.5"
																			className="transition-all duration-300 hover:opacity-80 cursor-pointer"
																			style={{
																				filter:
																					"drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
																			}}
																		/>
																		{/* Percentage labels for larger slices */}
																		{percentage > 8 && (
																			<text
																				x={50 +
																					25 *
																						Math.cos(
																							(startAngle + angle / 2) *
																								Math.PI / 180,
																						)}
																				y={50 +
																					25 *
																						Math.sin(
																							(startAngle + angle / 2) *
																								Math.PI / 180,
																						)}
																				textAnchor="middle"
																				dominantBaseline="middle"
																				fill="white"
																				fontSize="8"
																				fontWeight="bold"
																				className="pointer-events-none"
																			>
																				{percentage.toFixed(0)}%
																			</text>
																		)}
																	</g>
																);
															})}

															{/* Center circle */}
															<circle
																cx="50"
																cy="50"
																r="15"
																fill="rgba(0,0,0,0.1)"
																stroke="rgba(255,255,255,0.2)"
																strokeWidth="1"
															/>

															{/* Total value in center */}
															<text
																x="50"
																y="50"
																textAnchor="middle"
																dominantBaseline="middle"
																fill="white"
																fontSize="6"
																fontWeight="bold"
																className="pointer-events-none"
															>
																${totalValue.toLocaleString("en-US", {
																	minimumFractionDigits: 0,
																	maximumFractionDigits: 0,
																})}
															</text>
														</svg>
													);
												})()}
											</div>
										</div>

										{/* Enhanced Legend with Matching Colors */}
										<div className="space-y-1">
											{portfolioAssets.slice(0, 6).map((asset, index) => {
												const percentage =
													(asset.usdValue / totalPortfolioValue) * 100;

												// Use the same color palette as the pie chart
												const colors = [
													"#3b82f6", // Blue
													"#10b981", // Emerald
													"#8b5cf6", // Purple
													"#f59e0b", // Amber
													"#ef4444", // Red
													"#06b6d4", // Cyan
												];

												return (
													<div
														key={asset.coin}
														className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/30 transition-all duration-200 cursor-pointer group"
														style={{
															borderLeft: `3px solid ${
																colors[index % colors.length]
															}`,
														}}
													>
														<div className="flex items-center gap-1.5 min-w-0 flex-1">
															<div
																className="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-110"
																style={{
																	backgroundColor:
																		colors[index % colors.length],
																	boxShadow: `0 0 6px ${
																		colors[index % colors.length]
																	}40`,
																}}
															/>
															<span className="font-medium truncate">
																{asset.coin}
															</span>
														</div>
														<div className="text-right">
															<div className="font-mono font-semibold text-xs">
																{percentage.toLocaleString("en-US", {
																	minimumFractionDigits: 1,
																	maximumFractionDigits: 1,
																})}%
															</div>
															<div className="text-muted-foreground text-xs">
																${asset.usdValue.toLocaleString("en-US", {
																	minimumFractionDigits: 0,
																	maximumFractionDigits: 0,
																})}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</CardContent>
								</Card>

								{/* Enhanced Portfolio Metrics with Progress Bars */}
								<Card className="lg:col-span-2">
									<CardHeader className="pb-2">
										<CardTitle className="text-xs flex items-center">
											<BarChart3 className="w-3 h-3 mr-1" />
											PORTFOLIO PERFORMANCE ($500+)
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											{portfolioAssets.slice(0, 6).map((asset, index) => {
												const percentage =
													(asset.usdValue / totalPortfolioValue) * 100;
												// Use the same color palette as the pie chart
												const colors = [
													"#3b82f6", // Blue
													"#10b981", // Emerald
													"#8b5cf6", // Purple
													"#f59e0b", // Amber
													"#ef4444", // Red
													"#06b6d4", // Cyan
												];

												return (
													<div
														key={asset.coin}
														className="space-y-1.5 p-2 bg-muted/20 rounded"
													>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-1.5">
																<div
																	className="w-2.5 h-2.5 rounded-full"
																	style={{
																		backgroundColor:
																			colors[index % colors.length],
																	}}
																/>
																<span className="text-xs font-medium">
																	{asset.coin}
																</span>
															</div>
															<div className="flex items-center gap-1.5">
																<span className="text-xs text-muted-foreground">
																	{percentage.toLocaleString("en-US", {
																		minimumFractionDigits: 1,
																		maximumFractionDigits: 1,
																	})}%
																</span>
																<Badge
																	variant="outline"
																	className={cn(
																		"text-xs px-1.5 py-0",
																		asset.change >= 0
																			? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
																			: "border-red-500/30 bg-red-500/10 text-red-400",
																	)}
																>
																	{asset.change >= 0 ? "+" : ""}
																	{asset.changePercent.toLocaleString("en-US", {
																		minimumFractionDigits: 1,
																		maximumFractionDigits: 1,
																	})}%
																</Badge>
															</div>
														</div>

														{/* Progress Bar */}
														<div className="space-y-1">
															<div className="flex justify-between text-xs text-muted-foreground">
																<span>
																	${asset.usdValue.toLocaleString("en-US", {
																		minimumFractionDigits: 0,
																		maximumFractionDigits: 0,
																	})} @ ${asset.price.toLocaleString("en-US", {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	})}
																</span>
																<span>
																	{asset.change >= 0 ? "+" : ""}
																	{asset.change.toLocaleString("en-US", {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	})}
																</span>
															</div>
															<div className="w-full bg-muted rounded-full h-1.5">
																<div
																	className="h-1.5 rounded-full transition-all duration-500"
																	style={{
																		width: `${Math.min(percentage, 100)}%`,
																		backgroundColor:
																			colors[index % colors.length],
																	}}
																/>
															</div>
														</div>
													</div>
												);
											})}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Portfolio Summary */}
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-xs flex items-center">
										<BarChart3 className="w-3 h-3 mr-1" />
										PORTFOLIO SUMMARY ($500+)
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
										<div className="text-center p-3 bg-muted/20 rounded">
											<div className="text-lg font-bold text-primary">
												${totalPortfolioValue.toLocaleString("en-US", {
													minimumFractionDigits: 0,
													maximumFractionDigits: 0,
												})}
											</div>
											<div className="text-xs text-muted-foreground">
												Total Value
											</div>
										</div>
										<div className="text-center p-3 bg-muted/20 rounded">
											<div className="text-lg font-bold text-emerald-400">
												{portfolioAssets.length}
											</div>
											<div className="text-xs text-muted-foreground">
												Assets ($500+)
											</div>
										</div>
										<div className="text-center p-3 bg-muted/20 rounded">
											<div className="text-lg font-bold text-blue-400">
												{portfolioAssets.length > 0
													? (portfolioAssets[0].usdValue / totalPortfolioValue *
														100).toLocaleString("en-US", {
															minimumFractionDigits: 1,
															maximumFractionDigits: 1,
														})
													: 0}%
											</div>
											<div className="text-xs text-muted-foreground">
												Top Asset
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Account Details - Compact */}
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-xs flex items-center">
										<Users className="w-3 h-3 mr-1" />
										ACCOUNTS ({runtime.raw.accounts.length})
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
										{(runtime.raw.accounts as string[]).map((
											account: string,
											index: number,
										) => (
											<div
												key={index}
												className="flex items-center justify-between p-2 bg-muted/30 rounded"
											>
												<div className="flex items-center gap-1.5 min-w-0 flex-1">
													<div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
														<Wallet className="w-2.5 h-2.5 text-blue-400" />
													</div>
													<div className="min-w-0 flex-1">
														<div className="text-xs font-medium truncate">
															{account.split(".").slice(-1)[0].toUpperCase()}
														</div>
														<div className="text-xs text-muted-foreground font-mono truncate">
															{account.split(".").slice(2, 3)[0]}
														</div>
													</div>
												</div>
												<Badge variant="outline" className="text-xs px-1 py-0">
													BYBIT
												</Badge>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* News Tab */}
						{/*<TabsContent value="news" className="p-0 space-y-3">*/}
						{/*	/!* Top News - Enhanced *!/*/}
						{/*	{(news.raw as unknown as any[]).length > 0 && (*/}
						{/*		<Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">*/}
						{/*			/!* Background Pattern *!/*/}
						{/*			<div className="absolute inset-0 opacity-5">*/}
						{/*				<div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full -translate-y-16 translate-x-16">*/}
						{/*				</div>*/}
						{/*				<div className="absolute bottom-0 left-0 w-24 h-24 bg-primary rounded-full translate-y-12 -translate-x-12">*/}
						{/*				</div>*/}
						{/*			</div>*/}

						{/*			<CardHeader className="pb-3 relative">*/}
						{/*				<div className="flex items-center justify-between">*/}
						{/*					<div className="flex items-center gap-2">*/}
						{/*						<div className="p-2 bg-primary/20 rounded">*/}
						{/*							<Activity className="w-4 h-4 text-primary" />*/}
						{/*						</div>*/}
						{/*						<CardTitle className="text-sm flex items-center">*/}
						{/*							TOP MARKET NEWS*/}
						{/*						</CardTitle>*/}
						{/*					</div>*/}
						{/*					<div className="flex items-center gap-2">*/}
						{/*						<Badge*/}
						{/*							variant="outline"*/}
						{/*							className="text-xs border-primary/30 bg-primary/10 text-primary"*/}
						{/*						>*/}
						{/*							Score: {(news.raw as unknown as any[])[0].score}*/}
						{/*						</Badge>*/}
						{/*						<Badge*/}
						{/*							variant="outline"*/}
						{/*							className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-400"*/}
						{/*						>*/}
						{/*							TRENDING*/}
						{/*						</Badge>*/}
						{/*					</div>*/}
						{/*				</div>*/}
						{/*			</CardHeader>*/}
						{/*			<CardContent className="relative">*/}
						{/*				<div className="space-y-4">*/}
						{/*					<h3 className="font-semibold text-lg line-clamp-3 leading-relaxed">*/}
						{/*						{(news.raw as unknown as any[])[0].title}*/}
						{/*					</h3>*/}
						{/*					<div className="flex items-center justify-between">*/}
						{/*						<div className="flex items-center gap-3 text-xs text-muted-foreground">*/}
						{/*							<div className="flex items-center gap-1">*/}
						{/*								<div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse">*/}
						{/*								</div>*/}
						{/*								<span>*/}
						{/*									{calc.getTimeDifference(*/}
						{/*										Date.now(),*/}
						{/*										(news.raw as unknown as any[])[0].ts,*/}
						{/*									)}*/}
						{/*								</span>*/}
						{/*							</div>*/}
						{/*							<span>•</span>*/}
						{/*							<span className="flex items-center gap-1">*/}
						{/*								{(news.raw as unknown as any[])[0].source.includes(*/}
						{/*										"google.com",*/}
						{/*									)*/}
						{/*									? (*/}
						{/*										<>*/}
						{/*											<div className="w-3 h-3 bg-blue-500 rounded-sm">*/}
						{/*											</div>*/}
						{/*											Google News*/}
						{/*										</>*/}
						{/*									)*/}
						{/*									: (*/}
						{/*										<>*/}
						{/*											<div className="w-3 h-3 bg-muted rounded-sm">*/}
						{/*											</div>*/}
						{/*											External*/}
						{/*										</>*/}
						{/*									)}*/}
						{/*							</span>*/}
						{/*						</div>*/}
						{/*						{(news.raw as unknown as any[])[0].link && (*/}
						{/*							<a*/}
						{/*								href={(news.raw as unknown as any[])[0].link}*/}
						{/*								target="_blank"*/}
						{/*								rel="noopener noreferrer"*/}
						{/*								className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"*/}
						{/*							>*/}
						{/*								Read full article*/}
						{/*								<svg*/}
						{/*									className="w-3 h-3"*/}
						{/*									fill="none"*/}
						{/*									stroke="currentColor"*/}
						{/*									viewBox="0 0 24 24"*/}
						{/*								>*/}
						{/*									<path*/}
						{/*										strokeLinecap="round"*/}
						{/*										strokeLinejoin="round"*/}
						{/*										strokeWidth={2}*/}
						{/*										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"*/}
						{/*									/>*/}
						{/*								</svg>*/}
						{/*							</a>*/}
						{/*						)}*/}
						{/*					</div>*/}
						{/*				</div>*/}
						{/*			</CardContent>*/}
						{/*		</Card>*/}
						{/*	)}*/}

						{/*	/!* News Grid *!/*/}
						{/*	<Card>*/}
						{/*		<CardHeader className="pb-2">*/}
						{/*			<div className="flex items-center justify-between">*/}
						{/*				<CardTitle className="text-xs flex items-center">*/}
						{/*					<Activity className="w-3 h-3 mr-1" />*/}
						{/*					LATEST NEWS*/}
						{/*				</CardTitle>*/}
						{/*				<Badge variant="outline" className="text-xs">*/}
						{/*					{(news.raw as unknown as any[]).length} articles*/}
						{/*				</Badge>*/}
						{/*			</div>*/}
						{/*		</CardHeader>*/}
						{/*		<CardContent>*/}
						{/*			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">*/}
						{/*				{(news.raw as unknown as any[]).slice(1, 7).map((*/}
						{/*					article: any,*/}
						{/*					index: number,*/}
						{/*				) => (*/}
						{/*					<div*/}
						{/*						key={index}*/}
						{/*						className="group p-3 bg-muted/20 rounded hover:bg-muted/40 transition-all duration-200 border border-transparent hover:border-primary/20"*/}
						{/*					>*/}
						{/*						<div className="space-y-2">*/}
						{/*							<div className="flex items-start justify-between gap-2">*/}
						{/*								<h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">*/}
						{/*									{article.title}*/}
						{/*								</h4>*/}
						{/*								<div className="flex flex-col items-end gap-1">*/}
						{/*									<Badge*/}
						{/*										variant="outline"*/}
						{/*										className="text-xs px-1.5 py-0"*/}
						{/*									>*/}
						{/*										{article.source.includes("google.com")*/}
						{/*											? "Google"*/}
						{/*											: "External"}*/}
						{/*									</Badge>*/}
						{/*									<div className="text-xs text-muted-foreground">*/}
						{/*										Score: {article.score}*/}
						{/*									</div>*/}
						{/*								</div>*/}
						{/*							</div>*/}

						{/*							<div className="flex items-center justify-between">*/}
						{/*								<div className="flex items-center gap-2 text-xs text-muted-foreground">*/}
						{/*									<div className="flex items-center gap-1">*/}
						{/*										<div className="w-1.5 h-1.5 bg-blue-500 rounded-full">*/}
						{/*										</div>*/}
						{/*										<span>*/}
						{/*											{calc.getTimeDifference(*/}
						{/*												Date.now(),*/}
						{/*												article.ts,*/}
						{/*											)}*/}
						{/*										</span>*/}
						{/*									</div>*/}
						{/*								</div>*/}
						{/*								{article.link && (*/}
						{/*									<a*/}
						{/*										href={article.link}*/}
						{/*										target="_blank"*/}
						{/*										rel="noopener noreferrer"*/}
						{/*										className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors opacity-0 group-hover:opacity-100"*/}
						{/*									>*/}
						{/*										Read*/}
						{/*										<svg*/}
						{/*											className="w-3 h-3"*/}
						{/*											fill="none"*/}
						{/*											stroke="currentColor"*/}
						{/*											viewBox="0 0 24 24"*/}
						{/*										>*/}
						{/*											<path*/}
						{/*												strokeLinecap="round"*/}
						{/*												strokeLinejoin="round"*/}
						{/*												strokeWidth={2}*/}
						{/*												d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"*/}
						{/*											/>*/}
						{/*										</svg>*/}
						{/*									</a>*/}
						{/*								)}*/}
						{/*							</div>*/}
						{/*						</div>*/}
						{/*					</div>*/}
						{/*				))}*/}
						{/*			</div>*/}
						{/*		</CardContent>*/}
						{/*	</Card>*/}
						{/*</TabsContent>*/}

						{/* Scanner Tab */}
						<TabsContent value="scanner" className="p-0 space-y-4">
							<Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
								<CardHeader className="pb-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded">
												<Target className="h-5 w-5 text-amber-600" />
											</div>
											<div>
												<CardTitle className="text-lg flex items-center gap-2">
													Sonar Scanner
													<Badge
														variant="outline"
														className="text-xs font-mono bg-amber-50 text-amber-700 border-amber-200"
													>
														TestNet
													</Badge>
												</CardTitle>
												<CardDescription className="text-sm">
													Advanced wallet analysis and portfolio insights
												</CardDescription>
											</div>
										</div>
										{response && response.length > 0 && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setIsResultsOpen(true)}
												className="flex items-center gap-2"
											>
												<Eye className="w-4 h-4" />
												View Results
											</Button>
										)}
									</div>
								</CardHeader>
								<CardContent>
									<form onSubmit={handleSubmit} className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="address" className="text-sm font-medium">
												Wallet Address
											</Label>
											<div className="flex gap-3">
												<Input
													id="address"
													type="text"
													placeholder="Enter Gliesereum wallet address..."
													value={address}
													onChange={(e) => setAddress(e.target.value)}
													disabled={loading}
													className="flex-1 h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
												/>
												<Button
													type="submit"
													disabled={loading || !address.trim()}
													className="h-10 px-6 transition-all duration-200 hover:scale-105 active:scale-95"
												>
													{loading
														? (
															<>
																<Loader2 className="h-4 w-4 animate-spin mr-2" />
																<span className="hidden sm:inline">
																	Analyzing...
																</span>
																<span className="sm:hidden">Scan</span>
															</>
														)
														: (
															<>
																<BarChart3 className="h-4 w-4 mr-2" />
																<span className="hidden sm:inline">
																	Analyze
																</span>
																<span className="sm:hidden">Scan</span>
															</>
														)}
												</Button>
											</div>
											{address && !validateAddress(address) && (
												<p className="text-xs text-red-500 flex items-center gap-1">
													<AlertCircle className="w-3 h-3" />
													Invalid wallet address format
												</p>
											)}
										</div>

										{/* Quick Actions */}
										<div className="flex flex-wrap gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => setAddress("")}
												className="text-xs"
											>
												Clear
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() =>
													navigator.clipboard.readText().then(setAddress)}
												className="text-xs"
											>
												Paste
											</Button>
										</div>
									</form>
								</CardContent>
							</Card>

							{/* Recent Scans */}
							{response && response.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-sm flex items-center gap-2">
											<Clock className="w-4 h-4" />
											Recent Analysis
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<div className="flex items-center justify-between p-3 bg-muted/30 rounded">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
														<Wallet className="w-4 h-4 text-primary" />
													</div>
													<div>
														<p className="text-sm font-medium">
															{address.slice(0, 8)}...{address.slice(-8)}
														</p>
														<p className="text-xs text-muted-foreground">
															{response.length}{" "}
															account{response.length > 1 ? "s" : ""} found
														</p>
													</div>
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => setIsResultsOpen(true)}
												>
													View Details
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Error State */}
			{error && (
				<ErrorState
					error={error}
					onRetry={handleRetry}
					onDismiss={() => setError(null)}
				/>
			)}

			<Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
				<DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
					<DialogHeader className="p-6 pb-4 border-b">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								<DialogTitle className="flex items-center gap-3 text-xl font-semibold">
									<div className="p-2 bg-primary/10 rounded">
										<Wallet className="h-5 w-5 text-primary" />
									</div>
									<span>Wallet Analysis Results</span>
									<Badge variant="outline" className="ml-2">
										{response?.length}{" "}
										account{response?.length !== 1 ? "s" : ""}
									</Badge>
								</DialogTitle>
								<DialogDescription className="text-base mt-2">
									{response?.length === 1
										? "Comprehensive account analysis and trading insights"
										: `Portfolio analysis across ${response?.length} connected accounts`}
								</DialogDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleRefresh}
									disabled={isRefreshing}
									className="flex items-center gap-2"
								>
									<RefreshCw
										className={cn("w-4 h-4", isRefreshing && "animate-spin")}
									/>
									Refresh
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setIsResultsOpen(false)}
								>
									<XCircle className="w-4 h-4" />
								</Button>
							</div>
						</div>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto p-6">
						{response && response.length > 0 && (
							<div className="space-y-6">
								{/* Portfolio Overview */}
								{totalStats && totalStats.accountsCount > 1 && (
									<Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
										<CardHeader className="pb-4">
											<div className="flex items-center gap-3">
												<div className="p-2 bg-primary/20 rounded">
													<Users className="h-5 w-5 text-primary" />
												</div>
												<div>
													<CardTitle className="text-lg">
														Portfolio Overview
													</CardTitle>
													<CardDescription>
														Aggregated metrics across all connected accounts
													</CardDescription>
												</div>
											</div>
										</CardHeader>
										<CardContent className="space-y-6">
											<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
												<MetricCard
													label="Total Equity"
													value={formatCurrency(totalStats.totalEquity)}
													size="lg"
													icon={<BarChart3 className="h-4 w-4 text-primary" />}
												/>
												<MetricCard
													label="Total Balance"
													value={formatCurrency(totalStats.totalWalletBalance)}
													size="lg"
												/>
												<MetricCard
													label="Available"
													value={formatCurrency(
														totalStats.totalAvailableBalance,
													)}
													size="md"
												/>
												<div className="space-y-1">
													<div className="flex items-center gap-1">
														{totalStats.totalPerpUPL >= 0
															? (
																<TrendingUp className="h-4 w-4 text-emerald-600" />
															)
															: (
																<TrendingDown className="h-4 w-4 text-red-500" />
															)}
														<p className="text-xs text-muted-foreground font-medium">
															Total P&L
														</p>
													</div>
													{(() => {
														const pnlData = formatCurrencyWithColor(
															totalStats.totalPerpUPL,
														);
														return (
															<p
																className={`text-lg font-semibold font-mono ${pnlData.color}`}
															>
																{pnlData.value}
															</p>
														);
													})()}
												</div>
											</div>

											<Separator />

											<div className="flex justify-between text-sm">
												<div className="flex items-center gap-2">
													<Users className="h-4 w-4 text-muted-foreground" />
													<span className="text-muted-foreground">
														Accounts:
													</span>
													<span className="font-semibold text-primary">
														{totalStats.accountsCount}
													</span>
												</div>
												<div className="flex items-center gap-2">
													<Activity className="h-4 w-4 text-muted-foreground" />
													<span className="text-muted-foreground">
														Positions:
													</span>
													<span className="font-semibold">
														{totalStats.totalPositions}
													</span>
												</div>
												<div className="flex items-center gap-2">
													<ShoppingCart className="h-4 w-4 text-muted-foreground" />
													<span className="text-muted-foreground">
														Open Orders:
													</span>
													<span className="font-semibold">
														{totalStats.totalOpenOrders}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								)}

								{/* Account Tabs */}
								<Card>
									<CardHeader className="pb-4">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-500/10 rounded">
												<Activity className="h-5 w-5 text-blue-600" />
											</div>
											<div>
												<CardTitle className="text-lg">
													Account Details
												</CardTitle>
												<CardDescription>
													Individual account analysis and trading data
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<Tabs defaultValue={response[0].nid} className="w-full">
											<TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 h-auto p-1 bg-muted/50">
												{response.map((account) => (
													<TabsTrigger
														key={account.nid}
														value={account.nid}
														className="flex items-center gap-2 px-3 py-3 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
													>
														<Wallet className="h-4 w-4 flex-shrink-0" />
														<span className="truncate max-w-[120px]">
															{account.nid}
														</span>
														<Badge variant="outline" className="text-xs">
															{account.exchange.toUpperCase()}
														</Badge>
													</TabsTrigger>
												))}
											</TabsList>

											{response.map((account) => (
												<TabsContent
													key={account.nid}
													value={account.nid}
													className="mt-6"
												>
													<AccountCard walletData={account} />
												</TabsContent>
											))}
										</Tabs>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
