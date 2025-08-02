import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Activity,
	AlertCircle,
	CheckCircle,
	Clock,
	DollarSign,
	Loader2,
	ShoppingCart,
	TrendingDown,
	TrendingUp,
	Users,
	Wallet,
	X,
	XCircle,
} from "lucide-react";
import Screen from "@/routes/main/Screen";
import { validateAddress } from "@/lib/gliesereum";

// Data types
interface CoinInfo {
	coin: string;
	walletBalance: string;
	equity: string;
	usdValue: string;
	unrealisedPnl: string;
	locked: string;
	borrowAmount: string;
	accruedInterest: string;
	cumRealisedPnl: string;
}

interface RawPosition {
	info: {
		symbol: string;
		leverage: string;
		avgPrice: string;
		liqPrice: string;
		positionValue: string;
		unrealisedPnl: string;
		markPrice: string;
		side: string;
		size: string;
		cumRealisedPnl: string;
	};
	symbol: string;
	timestamp: number;
	datetime: string;
	entryPrice: number;
	notional: number;
	leverage: number;
	unrealizedPnl: number;
	contracts: number;
	liquidationPrice: number;
	markPrice: number;
	side: string;
}

interface PositionData {
	key: string[];
	value: {
		raw: {
			positions: RawPosition[];
			timestamp: number;
			datetime: string;
		};
		timestamp: number;
	};
}

interface OrderInfo {
	info: {
		symbol: string;
		leverage: string;
		markPrice: string;
		percentage: string;
		usdValue: string;
		unrealisedPnl: string;
		positionAmt: string;
		size: string;
		side: string;
		pnlPercentage: string;
		entryPrice: string;
		breakEvenPrice: string;
		marginType: string;
		isolatedMargin: string;
		positionInitialMargin: string;
		maintMarginPercentage: string;
		adlQuantile: number;
	};
	id: string;
	clientOrderId?: string;
	timestamp: number;
	datetime: string;
	symbol: string;
	type: string;
	side: string;
	price: number;
	amount: number;
	cost: number;
	filled: number;
	remaining: number;
	status: string;
	fee: {
		cost: number;
		currency: string;
	};
}

interface OrderData {
	key: string[];
	value: {
		raw: {
			orders: {
				[symbol: string]: {
					open: OrderInfo[];
					closed: OrderInfo[];
					canceled: OrderInfo[];
				};
			};
			timestamp: number;
			datetime: string;
		};
		timestamp: number;
	};
}

interface WalletData {
	info: {
		result: {
			list: Array<{
				totalEquity: string;
				totalWalletBalance: string;
				totalAvailableBalance: string;
				totalPerpUPL: string;
				totalMaintenanceMargin: string;
				totalInitialMargin: string;
				accountIMRate: string;
				accountMMRate: string;
				accountLTV: string;
				coin: CoinInfo[];
			}>;
		};
	};
}

interface Protocol {
	strategy: string;
	tradingStyle: string;
	maxRiskPerTrade: number;
	maxLeverage: number;
	maxDrawdown: number;
	stopLoss: number;
	takeProfit: number;
	riskRewardRatio: number;
	positionSizing: string;
	portfolioAllocation: number;
	slippageTolerance: number;
	markets: string[];
	orderTypes: string[];
	timeframes: string[];
	marketConditions: string[];
	hedgingEnabled: boolean;
	scalingEnabled: boolean;
	trailingStopEnabled: boolean;
	dynamicPositionSizing: boolean;
}

interface WalletResponse {
	nid: string;
	address: string;
	exchange: string;
	wallet: WalletData;
	positions?: PositionData[];
	orders?: {
		spot: OrderData[];
		futures: OrderData[];
	};
	protocol?: Protocol;
	connection: boolean;
	note?: string;
	viewers?: string[];
	workers?: string[];
}

// Formatting functions
const formatCurrency = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return "$0.00";

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
};

const formatCurrencyWithColor = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return { value: "$0.00", color: "text-zinc-400" };

	const formatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);

	// Color coding for currency values
	if (num > 0) return { value: formatted, color: "text-green-600" };
	if (num < 0) return { value: formatted, color: "text-red-600" };
	return { value: formatted, color: "text-zinc-400" };
};

const formatPercentageWithColor = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return { value: "0%", color: "text-zinc-400" };

	const formatted = `${(num * 100).toFixed(2)}%`;

	// Color coding for percentage values
	if (num > 0) return { value: formatted, color: "text-green-600" };
	if (num < 0) return { value: formatted, color: "text-red-600" };
	return { value: formatted, color: "text-zinc-400" };
};

const formatROIWithColor = (
	entryPrice: number,
	currentPrice: number,
	side: string,
) => {
	const roi = (currentPrice - entryPrice) / entryPrice * 100 *
		(side.toLowerCase() === "sell" ? -1 : 1);
	const formatted = `${roi.toFixed(2)}%`;

	if (roi > 0) return { value: formatted, color: "text-green-600" };
	if (roi < 0) return { value: formatted, color: "text-red-600" };
	return { value: formatted, color: "text-zinc-400" };
};

const formatNumber = (value: string | number, decimals = 4) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return "0";

	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals,
	}).format(num);
};

// const formatNumberWithColor = (
// 	value: string | number,
// 	decimals = 4,
// 	type: "balance" | "risk" = "balance",
// ) => {
// 	const num = typeof value === "string" ? Number.parseFloat(value) : value;
// 	if (isNaN(num)) return { value: "0", color: "text-zinc-400" };
//
// 	const formatted = new Intl.NumberFormat("en-US", {
// 		minimumFractionDigits: 2,
// 		maximumFractionDigits: decimals,
// 	}).format(num);
//
// 	if (type === "risk") {
// 		// Color coding for risk indicators (higher = more risk)
// 		if (num > 0.8) return { value: formatted, color: "text-red-600" };
// 		if (num > 0.5) return { value: formatted, color: "text-orange-600" };
// 		if (num > 0.2) return { value: formatted, color: "text-yellow-600" };
// 		return { value: formatted, color: "text-green-600" };
// 	}
//
// 	// Default balance coloring
// 	return { value: formatted, color: "text-zinc-300" };
// };

// const formatPercentage = (value: string | number) => {
// 	const num = typeof value === "string" ? Number.parseFloat(value) : value;
// 	if (isNaN(num)) return "0%";
//
// 	return `${(num * 100).toFixed(2)}%`;
// };

const formatDate = (timestamp: number | string) => {
	const date = new Date(
		typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp,
	);
	return date.toLocaleString("ru-RU", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
};

// Component for displaying a single account
/**
 * AccountCard component for displaying trading account information
 */
function AccountCard(
	{ walletData }: { walletData: WalletResponse },
): React.ReactElement {
	// Get positions for this account
	const positions = useMemo(() => {
		const allPositions: RawPosition[] = [];
		walletData.positions?.forEach((positionData) => {
			allPositions.push(...(positionData.value.raw.positions || []));
		});
		return allPositions;
	}, [walletData.positions]);

	// Get orders for this account
	const allOrders = useMemo(() => {
		const orders = {
			open: [] as OrderInfo[],
			closed: [] as OrderInfo[],
			canceled: [] as OrderInfo[],
		};

		const combineOrders = (
			orderData: Record<
				string,
				{ open: OrderInfo[]; closed: OrderInfo[]; canceled: OrderInfo[] }
			>,
		): void => {
			Object.values(orderData).forEach((symbolOrders) => {
				orders.open.push(...(symbolOrders.open || []));
				orders.closed.push(...(symbolOrders.closed || []));
				orders.canceled.push(...(symbolOrders.canceled || []));
			});
		};

		walletData.orders?.spot?.forEach((spotData) => {
			combineOrders(
				spotData.value.raw.orders as Record<
					string,
					{ open: OrderInfo[]; closed: OrderInfo[]; canceled: OrderInfo[] }
				>,
			);
		});

		walletData.orders?.futures?.forEach((futuresData) => {
			combineOrders(
				futuresData.value.raw.orders as Record<
					string,
					{ open: OrderInfo[]; closed: OrderInfo[]; canceled: OrderInfo[] }
				>,
			);
		});

		return orders;
	}, [walletData.orders]);

	return (
		<div className="space-y-4">
			{/* Account Overview */}
			<Card className="border">
				<CardHeader className="pb-3">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div className="flex items-center gap-2 min-w-0">
							<DollarSign className="h-4 w-4 flex-shrink-0" />
							<CardTitle className="text-base truncate">
								Account Overview
							</CardTitle>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<Badge
								variant={walletData.connection ? "default" : "destructive"}
								className="text-xs"
							>
								{walletData.connection ? "Connected" : "Disconnected"}
							</Badge>
							<Badge variant="outline" className="text-xs">
								{walletData.exchange.toUpperCase()}
							</Badge>
							<Badge variant="secondary" className="text-xs font-mono">
								{walletData.nid}
							</Badge>
						</div>
					</div>
					{walletData.note && (
						<CardDescription className="mt-1 text-xs">
							{walletData.note}
						</CardDescription>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Main Metrics */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-mono">
								Total Equity
							</p>
							<p className="text-base font-bold">
								{formatCurrency(
									walletData.wallet.info.result.list[0].totalEquity,
								)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-mono">
								Balance
							</p>
							<p className="text-sm font-semibold">
								{formatCurrency(
									walletData.wallet.info.result.list[0].totalWalletBalance,
								)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-mono">
								Available
							</p>
							<p className="text-sm font-semibold">
								{formatCurrency(
									walletData.wallet.info.result.list[0].totalAvailableBalance ||
										"0",
								)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground font-mono">
								P&L
							</p>
							{(() => {
								const pnlData = formatCurrencyWithColor(
									walletData.wallet.info.result.list[0].totalPerpUPL,
								);
								return (
									<div className="flex items-center gap-1">
										{Number.parseFloat(
												walletData.wallet.info.result.list[0].totalPerpUPL,
											) >= 0
											? (
												<TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
											)
											: (
												<TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
											)}
										<p className={`text-sm font-semibold ${pnlData.color}`}>
											{pnlData.value}
										</p>
									</div>
								);
							})()}
						</div>
					</div>

					<Separator />

					{/* Secondary Metrics */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground font-mono">
								Wallet Address
							</p>
							<code className="bg-muted px-2 py-1 rounded text-xs break-all font-mono">
								{walletData.address}
							</code>
						</div>
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground font-mono">
								Initial Margin
							</p>
							<p className="font-semibold text-blue-600">
								{formatCurrency(
									walletData.wallet.info.result.list[0].totalInitialMargin ||
										"0",
								)}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground font-mono">
								Maintenance Margin
							</p>
							<p className="font-semibold text-purple-600">
								{formatCurrency(
									walletData.wallet.info.result.list[0]
										.totalMaintenanceMargin || "0",
								)}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground font-mono">
								Margin Level
							</p>
							{(() => {
								const marginData = formatPercentageWithColor(
									walletData.wallet.info.result.list[0].accountLTV || "0",
								);
								return (
									<p className={`font-semibold ${marginData.color}`}>
										{marginData.value}
									</p>
								);
							})()}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Coin Balances */}
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2">
						<Wallet className="h-5 w-5" />
						Asset Balances
					</CardTitle>
					<CardDescription>
						Detailed information for each coin in the portfolio
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-0">
						{walletData.wallet.info.result.list[0].coin.map((
							coin: CoinInfo,
							index: number,
						) => (
							<Card
								key={index}
								className="relative hover:shadow-sm transition-shadow border-0"
							>
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-base sm:text-lg font-semibold truncate">
											{coin.coin}
										</h3>
										<div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
											{Number.parseFloat(coin.locked) > 0 && (
												<Badge variant="secondary" className="text-xs">
													Locked
												</Badge>
											)}
											<Badge
												variant={Number.parseFloat(coin.equity) > 0
													? "default"
													: "secondary"}
												className="text-xs"
											>
												{Number.parseFloat(coin.equity) > 0
													? "Active"
													: "Inactive"}
											</Badge>
										</div>
									</div>

									<div className="space-y-1">
										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">
												Balance
											</span>
											<span className="font-mono">
												{formatNumber(coin.walletBalance)} {coin.coin}
											</span>
										</div>

										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">
												Equity
											</span>
											<span className="font-mono">
												{formatNumber(coin.equity)} {coin.coin}
											</span>
										</div>

										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">
												USD Value
											</span>
											<span className="font-mono text-green-600 font-semibold">
												{formatCurrency(coin.usdValue)}
											</span>
										</div>

										{Number.parseFloat(coin.unrealisedPnl) !== 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">
													Unrealized P&L
												</span>
												{(() => {
													const pnlData = formatCurrencyWithColor(
														coin.unrealisedPnl,
													);
													return (
														<span className={`font-mono ${pnlData.color}`}>
															{pnlData.value}
														</span>
													);
												})()}
											</div>
										)}

										{Number.parseFloat(coin.borrowAmount) > 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">
													Borrowed
												</span>
												<span className="font-mono text-orange-600 font-semibold">
													{formatNumber(coin.borrowAmount)} {coin.coin}
												</span>
											</div>
										)}

										{Number.parseFloat(coin.cumRealisedPnl) !== 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">
													Realized P&L
												</span>
												{(() => {
													const pnlData = formatCurrencyWithColor(
														coin.cumRealisedPnl,
													);
													return (
														<span className={`font-mono ${pnlData.color}`}>
															{pnlData.value}
														</span>
													);
												})()}
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Trading Positions */}
			{positions.length > 0 && (
				<Card>
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Open Positions ({positions.length})
						</CardTitle>
						<CardDescription>
							Current trading positions and their performance
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{positions.map((position: RawPosition, index: number) => (
								<Card
									key={index}
									className="border-l-4 border-l-primary hover:shadow-sm transition-shadow"
								>
									<CardContent className="p-4">
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
											<div className="flex items-center gap-3 min-w-0">
												<h3 className="text-lg font-semibold truncate">
													{position.symbol}
												</h3>
												<div className="flex items-center gap-2 flex-shrink-0">
													<Badge
														variant={position.side.toLowerCase() === "sell"
															? "destructive"
															: "default"}
														className="text-xs"
													>
														{position.side.toLowerCase() === "sell"
															? "SHORT"
															: "LONG"}
													</Badge>
													<Badge
														variant="outline"
														className={`text-xs ${
															position.leverage >= 10
																? "border-red-500 text-red-500"
																: position.leverage >= 5
																? "border-orange-500 text-orange-500"
																: "border-green-500 text-green-500"
														}`}
													>
														x{position.leverage}
													</Badge>
												</div>
											</div>
											<div className="flex items-center gap-2 flex-shrink-0">
												{(() => {
													const pnlData = formatCurrencyWithColor(
														position.unrealizedPnl,
													);
													return (
														<>
															{Number.parseFloat(
																	position.unrealizedPnl.toString(),
																) >= 0
																? (
																	<TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
																)
																: (
																	<TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
																)}
															<span
																className={`text-lg font-semibold ${pnlData.color}`}
															>
																{pnlData.value}
															</span>
														</>
													);
												})()}
											</div>
										</div>

										<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs sm:text-sm">
											<div>
												<p className="text-muted-foreground">Size</p>
												<p className="font-mono">
													{formatNumber(position.contracts, 4)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Entry Price</p>
												<p className="font-mono">
													{formatCurrency(position.entryPrice)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Current Price</p>
												<p className="font-mono">
													{formatCurrency(position.markPrice)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Value</p>
												<p className="font-mono">
													{formatCurrency(position.notional)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Liquidation</p>
												<p className="font-mono text-red-600 font-semibold">
													{formatCurrency(position.liquidationPrice)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">ROI</p>
												{(() => {
													const roiData = formatROIWithColor(
														position.entryPrice,
														position.markPrice,
														position.side,
													);
													return (
														<p className={`font-mono ${roiData.color}`}>
															{roiData.value}
														</p>
													);
												})()}
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Orders */}
			{(allOrders.open.length > 0 || allOrders.closed.length > 0 ||
				allOrders.canceled.length > 0) && (
				<Card>
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2">
							<ShoppingCart className="h-5 w-5" />
							Orders
						</CardTitle>
						<CardDescription>Trading orders history</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<Tabs defaultValue="open" className="w-full">
							<TabsList className="w-full h-auto p-1 bg-transparent border-b">
								<TabsTrigger
									value="open"
									className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm"
								>
									<Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
									<span>Open</span>
									<Badge variant="secondary" className="text-xs">
										{allOrders.open.length}
									</Badge>
								</TabsTrigger>
								<TabsTrigger
									value="closed"
									className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm "
								>
									<CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
									<span>Executed</span>
									<Badge variant="secondary" className="text-xs">
										{allOrders.closed.length}
									</Badge>
								</TabsTrigger>
								<TabsTrigger
									value="canceled"
									className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm "
								>
									<XCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
									<span>Canceled</span>
									<Badge variant="secondary" className="text-xs">
										{allOrders.canceled.length}
									</Badge>
								</TabsTrigger>
							</TabsList>

							<TabsContent value="open" className="space-y-2 p-0 sm:p-0">
								{allOrders.open.length === 0
									? (
										<div className="text-center py-12">
											<Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
											<p className="text-muted-foreground">No open orders</p>
										</div>
									)
									: (
										allOrders.open.map((order: OrderInfo, index: number) => (
											<Card
												key={index}
												className="hover:shadow-sm transition-shadow"
											>
												<CardContent className="p-4">
													<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
														<div className="flex items-center gap-3 min-w-0">
															<h4 className="font-semibold truncate">
																{order.symbol}
															</h4>
															<div className="flex items-center gap-2 flex-shrink-0">
																<Badge
																	variant={order.side === "sell"
																		? "destructive"
																		: "default"}
																	className="text-xs"
																>
																	{order.side.toUpperCase()}
																</Badge>
																<Badge variant="outline" className="text-xs">
																	{order.type.toUpperCase()}
																</Badge>
															</div>
														</div>
														<Badge
															variant="secondary"
															className="text-xs flex-shrink-0"
														>
															{order.status}
														</Badge>
													</div>
													<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs sm:text-sm">
														<div>
															<p className="text-muted-foreground">Price</p>
															<p className="font-mono">
																{formatCurrency(order.price)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Quantity
															</p>
															<p className="font-mono">
																{formatNumber(order.amount, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Executed</p>
															<p className="font-mono">
																{formatNumber(order.filled, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Remaining</p>
															<p className="font-mono">
																{formatNumber(order.remaining, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Cost</p>
															<p className="font-mono">
																{formatCurrency(order.cost)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Time</p>
															<p className="font-mono">
																{formatDate(order.timestamp)}
															</p>
														</div>
													</div>
												</CardContent>
											</Card>
										))
									)}
							</TabsContent>

							<TabsContent value="closed" className="space-y-2 p-0 sm:p-0">
								{allOrders.closed.length === 0
									? (
										<div className="text-center py-12">
											<CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
											<p className="text-muted-foreground">
												No executed orders
											</p>
										</div>
									)
									: (
										allOrders.closed.map((order: OrderInfo, index: number) => (
											<Card
												key={index}
												className="hover:shadow-sm transition-shadow"
											>
												<CardContent className="p-4">
													<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
														<div className="flex items-center gap-3 min-w-0">
															<h4 className="font-semibold truncate">
																{order.symbol}
															</h4>
															<div className="flex items-center gap-2 flex-shrink-0">
																<Badge
																	variant={order.side === "sell"
																		? "destructive"
																		: "default"}
																	className="text-xs"
																>
																	{order.side.toUpperCase()}
																</Badge>
																<Badge variant="outline" className="text-xs">
																	{order.type.toUpperCase()}
																</Badge>
															</div>
														</div>
														<Badge
															variant="default"
															className="text-xs flex-shrink-0"
														>
															{order.status}
														</Badge>
													</div>
													<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs sm:text-sm">
														<div>
															<p className="text-muted-foreground">Price</p>
															<p className="font-mono">
																{formatCurrency(order.price)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Quantity
															</p>
															<p className="font-mono">
																{formatNumber(order.amount, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Executed</p>
															<p className="font-mono">
																{formatNumber(order.filled, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Cost</p>
															<p className="font-mono">
																{formatCurrency(order.cost)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Fee</p>
															<p className="font-mono">
																{formatCurrency(order.fee.cost)}{" "}
																{order.fee.currency}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Time</p>
															<p className="font-mono">
																{formatDate(order.timestamp)}
															</p>
														</div>
													</div>
												</CardContent>
											</Card>
										))
									)}
							</TabsContent>

							<TabsContent value="canceled" className="space-y-2 p-0 sm:p-0">
								{allOrders.canceled.length === 0
									? (
										<div className="text-center py-12">
											<XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
											<p className="text-muted-foreground">
												No canceled orders
											</p>
										</div>
									)
									: (
										allOrders.canceled.map((
											order: OrderInfo,
											index: number,
										) => (
											<Card
												key={index}
												className="hover:shadow-sm transition-shadow"
											>
												<CardContent className="p-4">
													<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
														<div className="flex items-center gap-3 min-w-0">
															<h4 className="font-semibold truncate">
																{order.symbol}
															</h4>
															<div className="flex items-center gap-2 flex-shrink-0">
																<Badge
																	variant={order.side === "sell"
																		? "destructive"
																		: "default"}
																	className="text-xs"
																>
																	{order.side.toUpperCase()}
																</Badge>
																<Badge variant="outline" className="text-xs">
																	{order.type.toUpperCase()}
																</Badge>
															</div>
														</div>
														<Badge
															variant="destructive"
															className="text-xs flex-shrink-0"
														>
															{order.status}
														</Badge>
													</div>
													<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
														<div>
															<p className="text-muted-foreground">Price</p>
															<p className="font-mono">
																{formatCurrency(order.price)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Quantity
															</p>
															<p className="font-mono">
																{formatNumber(order.amount, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Creation Time
															</p>
															<p className="font-mono">
																{formatDate(order.timestamp)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Order ID</p>
															<p className="font-mono text-xs break-all">
																{order.id}
															</p>
														</div>
													</div>
												</CardContent>
											</Card>
										))
									)}
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			)}

			{/* Trading Protocol */}
			{walletData.protocol && (
				<Card>
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Trading Protocol
						</CardTitle>
						<CardDescription>
							Strategy settings and risk management
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
							<div className="space-y-2">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Strategy
								</p>
								<p className="font-mono">{walletData.protocol.strategy}</p>
							</div>
							<div className="space-y-2">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Trading Style
								</p>
								<p className="font-mono">
									{walletData.protocol.tradingStyle}
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Max Risk Per Trade
								</p>
								<p
									className={`font-mono ${
										walletData.protocol.maxRiskPerTrade > 5
											? "text-red-600"
											: walletData.protocol.maxRiskPerTrade > 2
											? "text-orange-600"
											: "text-green-600"
									}`}
								>
									{walletData.protocol.maxRiskPerTrade}%
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Max Leverage
								</p>
								<p
									className={`font-mono ${
										walletData.protocol.maxLeverage >= 10
											? "text-red-600"
											: walletData.protocol.maxLeverage >= 5
											? "text-orange-600"
											: "text-green-600"
									}`}
								>
									x{walletData.protocol.maxLeverage}
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Max Drawdown
								</p>
								<p
									className={`font-mono ${
										walletData.protocol.maxDrawdown > 20
											? "text-red-600"
											: walletData.protocol.maxDrawdown > 10
											? "text-orange-600"
											: "text-green-600"
									}`}
								>
									{walletData.protocol.maxDrawdown}%
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Stop Loss
								</p>
								<p className="font-mono text-red-600">
									{walletData.protocol.stopLoss}%
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Take Profit
								</p>
								<p className="font-mono text-green-600">
									{walletData.protocol.takeProfit}%
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-xs sm:text-sm text-muted-foreground">
									Risk/Reward
								</p>
								<p
									className={`font-mono ${
										walletData.protocol.riskRewardRatio >= 3
											? "text-green-600"
											: walletData.protocol.riskRewardRatio >= 2
											? "text-yellow-600"
											: "text-red-600"
									}`}
								>
									1:{walletData.protocol.riskRewardRatio}
								</p>
							</div>
						</div>

						<Separator className="my-4 sm:my-6" />

						<Separator />

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground font-mono">
									Traded Markets
								</p>
								<div className="flex flex-wrap gap-2">
									{walletData.protocol.markets.map((market, index) => (
										<Badge key={index} variant="outline" className="text-xs">
											{market}
										</Badge>
									))}
								</div>
							</div>
							<div className="space-y-1">
								<p className="text-sm text-muted-foreground font-mono">
									Order Types
								</p>
								<div className="flex flex-wrap gap-2">
									{walletData.protocol.orderTypes.map((type, index) => (
										<Badge key={index} variant="outline" className="text-xs">
											{type}
										</Badge>
									))}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

/**
 * WalletWidget component for scanning and analyzing trading accounts
 */
export default function WalletWidget(): React.ReactElement {
	const [address, setAddress] = useState("");
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<WalletResponse[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isResultsOpen, setIsResultsOpen] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!address.trim()) {
			setError("Please enter a wallet address");
			return;
		}

		// Validate address using gliesereum library
		if (!validateAddress(address.trim())) {
			setError(
				"Invalid wallet address format. Please check your address and try again.",
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

			const res = await fetch("https://live.stels.dev", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const data = await res.json();

			// Check if the response is empty
			if (!data || data.length === 0) {
				setError(
					"This wallet is not connected to the network or has not performed any actions yet. Please check the address or try again later.",
				);
				return;
			}

			setResponse(data);
			setIsResultsOpen(true);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "An error occurred while executing the request",
			);
		} finally {
			setLoading(false);
		}
	};

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

			// Count positions
			account.positions?.forEach((positionData) => {
				totalPositions += positionData.value.raw.positions.length;
			});

			// Count open orders
			account.orders?.spot?.forEach((spotData) => {
				Object.values(spotData.value.raw.orders).forEach(
					(symbolOrders) => {
						const typedOrders = symbolOrders as {
							open: OrderInfo[];
							closed: OrderInfo[];
							canceled: OrderInfo[];
						};
						totalOpenOrders += typedOrders.open?.length || 0;
					},
				);
			});
			account.orders?.futures?.forEach((futuresData) => {
				Object.values(futuresData.value.raw.orders).forEach(
					(symbolOrders) => {
						const typedOrders = symbolOrders as {
							open: OrderInfo[];
							closed: OrderInfo[];
							canceled: OrderInfo[];
						};
						totalOpenOrders += typedOrders.open?.length || 0;
					},
				);
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

	return (
		<Screen>
			{/* Search Form */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Wallet className="h-5 w-5 text-amber-700" />
						Sonar Scanner :
						<span className="text-mono text-amber-700">TestNet</span>
					</CardTitle>
					<CardDescription>
						Enter a wallet address to get detailed account information
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="address">Wallet Address</Label>
							<div className="flex gap-2">
								<Input
									id="address"
									type="text"
									placeholder="Enter wallet address Gliesereum"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									disabled={loading}
									className="flex-1"
								/>
								<Button type="submit" disabled={loading || !address.trim()}>
									{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
										"Analyze"
									)}
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Error State */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Results Modal */}
			<Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
				<DialogContent
					showCloseButton={false}
					className="backdrop-blur-lg backdrop-opacity bg-zinc-700/10  max-w-6xl w-full max-h-[100%] overflow-y-auto sm:max-w-[95vw]"
				>
					<div className="flex flex-col h-full">
						{/* Modal Header - Fixed */}
						<DialogHeader className="mb-4">
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0 text-left">
									<DialogTitle className="flex items-center gap-2 text-base font-semibold">
										<Wallet className="h-4 w-4 flex-shrink-0" />
										<span className="truncate">Wallet Analysis</span>
									</DialogTitle>
									<DialogDescription className="text-xs mt-0.5">
										{response?.length === 1
											? "Account details and trading data"
											: `${response?.length} accounts found`}
									</DialogDescription>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsResultsOpen(false)}
									className="h-8 w-8 p-0 flex-shrink-0"
								>
									<X className="h-4 w-4" />
									<span className="sr-only">Close</span>
								</Button>
							</div>
						</DialogHeader>

						{/* Modal Content - Scrollable */}
						<div className="flex-1 space-y-2">
							{response && response.length > 0 && (
								<>
									{/* Total Statistics */}
									{totalStats && totalStats.accountsCount > 1 && (
										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="flex items-center gap-2 text-sm">
													<Users className="h-4 w-4" />
													Portfolio Overview
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4">
												{/* Main Metrics */}
												<div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground font-mono">
															Total Equity
														</p>
														<p className="text-xl font-bold">
															{formatCurrency(totalStats.totalEquity)}
														</p>
													</div>
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground font-mono">
															Balance
														</p>
														<p className="text-xl font-semibold">
															{formatCurrency(totalStats.totalWalletBalance)}
														</p>
													</div>
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground font-mono">
															Available
														</p>
														<p className="text-sm font-semibold">
															{formatCurrency(totalStats.totalAvailableBalance)}
														</p>
													</div>
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground font-mono">
															P&L
														</p>
														{(() => {
															const pnlData = formatCurrencyWithColor(
																totalStats.totalPerpUPL,
															);
															return (
																<div className="flex items-center gap-1">
																	{totalStats.totalPerpUPL >= 0
																		? (
																			<TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
																		)
																		: (
																			<TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
																		)}
																	<p
																		className={`text-sm font-semibold ${pnlData.color}`}
																	>
																		{pnlData.value}
																	</p>
																</div>
															);
														})()}
													</div>
												</div>

												{/* Secondary Metrics */}
												<div className="flex justify-between text-xs">
													<div className="flex items-center gap-1">
														<span className="text-muted-foreground">
															Accounts:
														</span>
														<span className="font-semibold text-primary">
															{totalStats.accountsCount}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<span className="text-muted-foreground">
															Positions:
														</span>
														<span className="font-semibold">
															{totalStats.totalPositions}
														</span>
													</div>
													<div className="flex items-center gap-1">
														<span className="text-muted-foreground">
															Orders:
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
										<CardHeader className="pb-3">
											<CardTitle className="flex items-center gap-2 text-sm">
												<Activity className="h-4 w-4" />
												Accounts
											</CardTitle>
										</CardHeader>
										<CardContent className="p-0">
											<Tabs defaultValue={response[0].nid} className="w-full">
												<TabsList className="w-full h-auto p-1 bg-transparent border-b">
													<div className="flex w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
														{response.map((account) => (
															<TabsTrigger
																key={account.nid}
																value={account.nid}
																className="bg-zinc-900 flex items-center gap-2 px-3 py-2 text-xs whitespace-nowrap flex-shrink-0 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-300"
															>
																<Wallet className="h-3 w-3 flex-shrink-0" />
																<span className="truncate max-w-[100px]">
																	{account.nid}
																</span>
																<Badge variant="outline" className="text-xs">
																	{account.exchange.toUpperCase()}
																</Badge>
															</TabsTrigger>
														))}
													</div>
												</TabsList>

												{response.map((account) => (
													<TabsContent
														key={account.nid}
														value={account.nid}
														className="mt-0 p-4"
													>
														<AccountCard walletData={account} />
													</TabsContent>
												))}
											</Tabs>
										</CardContent>
									</Card>
								</>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</Screen>
	);
}
