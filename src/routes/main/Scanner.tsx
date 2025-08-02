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
	XCircle,
} from "lucide-react";
import Screen from "@/routes/main/Screen";

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
		maximumFractionDigits: 6,
	}).format(num);
};

const formatNumber = (value: string | number, decimals = 8) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return "0";

	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals,
	}).format(num);
};

const formatPercentage = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return "0%";

	return `${(num * 100).toFixed(2)}%`;
};

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

		const combineOrders = (orderData: Record<string, unknown[]>): void => {
			Object.values(orderData).forEach((symbolOrders: unknown[]) => {
				orders.open.push(...(symbolOrders.open || []));
				orders.closed.push(...(symbolOrders.closed || []));
				orders.canceled.push(...(symbolOrders.canceled || []));
			});
		};

		walletData.orders?.spot?.forEach((spotData) => {
			combineOrders(spotData.value.raw.orders);
		});

		walletData.orders?.futures?.forEach((futuresData) => {
			combineOrders(futuresData.value.raw.orders);
		});

		return orders;
	}, [walletData.orders]);

	return (
		<div className="space-y-6">
			{/* Account Overview */}
			<Card className="border-2">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<DollarSign className="h-5 w-5" />
							<CardTitle>Account Overview {walletData.nid}</CardTitle>
						</div>
						<div className="flex items-center gap-2">
							<Badge
								variant={walletData.connection ? "default" : "destructive"}
							>
								{walletData.connection ? "Connected" : "Disconnected"}
							</Badge>
							<Badge variant="outline">
								{walletData.exchange.toUpperCase()}
							</Badge>
						</div>
					</div>
					{walletData.note && (
						<CardDescription>{walletData.note}</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Total Equity</p>
							<p className="text-3xl">
								{formatCurrency(
									walletData.wallet.info.result.list[0].totalEquity,
								)}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Wallet Balance</p>
							<p className="text-2xl">
								{formatCurrency(
									walletData.wallet.info.result.list[0].totalWalletBalance,
								)}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Available</p>
							<p className="text-2xl">
								{formatCurrency(
									walletData.wallet.info.result.list[0].totalAvailableBalance ||
										"0",
								)}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								Unrealized P&L
							</p>
							<div className="flex items-center gap-2">
								{Number.parseFloat(
										walletData.wallet.info.result.list[0].totalPerpUPL,
									) >= 0
									? <TrendingUp className="h-4 w-4 text-green-600" />
									: <TrendingDown className="h-4 w-4 text-red-600" />}
								<p
									className={`text-2xl ${
										Number.parseFloat(
												walletData.wallet.info.result.list[0].totalPerpUPL,
											) >= 0
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{formatCurrency(
										walletData.wallet.info.result.list[0].totalPerpUPL,
									)}
								</p>
							</div>
						</div>
					</div>

					<Separator className="my-6" />

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
						<div className="space-y-1">
							<p className="text-muted-foreground">Wallet Address</p>
							<code className="bg-muted px-3 py-1 rounded text-xs break-all">
								{walletData.address}
							</code>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Initial Margin</p>
							<p className="font-medium">
								{formatCurrency(
									walletData.wallet.info.result.list[0].totalInitialMargin ||
										"0",
								)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Maintenance Margin</p>
							<p className="font-medium">
								{formatCurrency(
									walletData.wallet.info.result.list[0]
										.totalMaintenanceMargin || "0",
								)}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Margin Level</p>
							<p className="font-medium">
								{formatPercentage(
									walletData.wallet.info.result.list[0].accountLTV || "0",
								)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Coin Balances */}
			<Card>
				<CardHeader>
					<CardTitle>Asset Balances</CardTitle>
					<CardDescription>
						Detailed information for each coin in the portfolio
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{walletData.wallet.info.result.list[0].coin.map((
							coin: CoinInfo,
							index: number,
						) => (
							<Card key={index} className="relative">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-3">
										<h3 className="text-lg font-semibold">{coin.coin}</h3>
										<div className="flex items-center gap-2">
											{Number.parseFloat(coin.locked) > 0 && (
												<Badge variant="secondary" className="text-xs">
													Locked
												</Badge>
											)}
											<Badge
												variant={Number.parseFloat(coin.equity) > 0
													? "default"
													: "secondary"}
											>
												{Number.parseFloat(coin.equity) > 0
													? "Active"
													: "Inactive"}
											</Badge>
										</div>
									</div>

									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">
												Balance
											</span>
											<span className="font-medium">
												{formatNumber(coin.walletBalance)} {coin.coin}
											</span>
										</div>

										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">
												Equity
											</span>
											<span className="font-medium">
												{formatNumber(coin.equity)} {coin.coin}
											</span>
										</div>

										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">
												USD Value
											</span>
											<span className="font-medium text-green-600">
												{formatCurrency(coin.usdValue)}
											</span>
										</div>

										{Number.parseFloat(coin.unrealisedPnl) !== 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">
													Unrealized P&L
												</span>
												<span
													className={`font-medium ${
														Number.parseFloat(coin.unrealisedPnl) >= 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{formatCurrency(coin.unrealisedPnl)}
												</span>
											</div>
										)}

										{Number.parseFloat(coin.borrowAmount) > 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">
													Borrowed
												</span>
												<span className="font-medium text-orange-600">
													{formatNumber(coin.borrowAmount)} {coin.coin}
												</span>
											</div>
										)}

										{Number.parseFloat(coin.cumRealisedPnl) !== 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">
													Realized P&L
												</span>
												<span
													className={`font-medium ${
														Number.parseFloat(coin.cumRealisedPnl) >= 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{formatCurrency(coin.cumRealisedPnl)}
												</span>
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
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Open Positions
						</CardTitle>
						<CardDescription>
							Current trading positions and their performance
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{positions.map((position: RawPosition, index: number) => (
								<Card key={index} className="border-l-4 border-l-primary">
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-4">
											<div className="flex items-center gap-3">
												<h3 className="text-lg font-semibold">
													{position.symbol}
												</h3>
												<Badge
													variant={position.side.toLowerCase() === "sell"
														? "destructive"
														: "default"}
												>
													{position.side.toLowerCase() === "sell"
														? "SHORT"
														: "LONG"}
												</Badge>
												<Badge variant="outline">
													x{position.leverage}
												</Badge>
											</div>
											<div className="flex items-center gap-2">
												{Number.parseFloat(position.unrealizedPnl.toString()) >=
														0
													? <TrendingUp className="h-4 w-4 text-green-600" />
													: <TrendingDown className="h-4 w-4 text-red-600" />}
												<span
													className={`text-lg font-semibold ${
														Number.parseFloat(
																position.unrealizedPnl.toString(),
															) >= 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{formatCurrency(position.unrealizedPnl)}
												</span>
											</div>
										</div>

										<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
											<div>
												<p className="text-muted-foreground">Size</p>
												<p className="font-medium">
													{formatNumber(position.contracts, 4)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Entry Price</p>
												<p className="font-medium">
													{formatCurrency(position.entryPrice)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Current Price</p>
												<p className="font-medium">
													{formatCurrency(position.markPrice)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Value</p>
												<p className="font-medium">
													{formatCurrency(position.notional)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Liquidation</p>
												<p className="font-medium text-red-600">
													{formatCurrency(position.liquidationPrice)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">ROI</p>
												<p
													className={`font-medium ${
														((position.markPrice - position.entryPrice) /
																position.entryPrice * 100 *
																(position.side.toLowerCase() === "sell"
																	? -1
																	: 1)) >= 0
															? "text-green-600"
															: "text-red-600"
													}`}
												>
													{((position.markPrice - position.entryPrice) /
														position.entryPrice * 100 *
														(position.side.toLowerCase() === "sell" ? -1 : 1))
														.toFixed(2)}%
												</p>
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
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ShoppingCart className="h-5 w-5" />
							Orders
						</CardTitle>
						<CardDescription>Trading orders history</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="open" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="open" className="flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Open ({allOrders.open.length})
								</TabsTrigger>
								<TabsTrigger value="closed" className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4" />
									Executed ({allOrders.closed.length})
								</TabsTrigger>
								<TabsTrigger
									value="canceled"
									className="flex items-center gap-2"
								>
									<XCircle className="h-4 w-4" />
									Canceled ({allOrders.canceled.length})
								</TabsTrigger>
							</TabsList>

							<TabsContent value="open" className="space-y-4">
								{allOrders.open.length === 0
									? (
										<p className="text-center text-muted-foreground py-8">
											No open orders
										</p>
									)
									: (
										allOrders.open.map((order: OrderInfo, index: number) => (
											<Card key={index}>
												<CardContent className="p-4">
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-3">
															<h4 className="font-semibold">{order.symbol}</h4>
															<Badge
																variant={order.side === "sell"
																	? "destructive"
																	: "default"}
															>
																{order.side.toUpperCase()}
															</Badge>
															<Badge variant="outline">
																{order.type.toUpperCase()}
															</Badge>
														</div>
														<Badge variant="secondary">
															{order.status}
														</Badge>
													</div>
													<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
														<div>
															<p className="text-muted-foreground">Price</p>
															<p className="font-medium">
																{formatCurrency(order.price)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Quantity
															</p>
															<p className="font-medium">
																{formatNumber(order.amount, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Executed</p>
															<p className="font-medium">
																{formatNumber(order.filled, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Remaining</p>
															<p className="font-medium">
																{formatNumber(order.remaining, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Cost</p>
															<p className="font-medium">
																{formatCurrency(order.cost)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Time</p>
															<p className="font-medium">
																{formatDate(order.timestamp)}
															</p>
														</div>
													</div>
												</CardContent>
											</Card>
										))
									)}
							</TabsContent>

							<TabsContent value="closed" className="space-y-4">
								{allOrders.closed.length === 0
									? (
										<p className="text-center text-muted-foreground py-8">
											No executed orders
										</p>
									)
									: (
										allOrders.closed.map((order: OrderInfo, index: number) => (
											<Card key={index}>
												<CardContent className="p-4">
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-3">
															<h4 className="font-semibold">{order.symbol}</h4>
															<Badge
																variant={order.side === "sell"
																	? "destructive"
																	: "default"}
															>
																{order.side.toUpperCase()}
															</Badge>
															<Badge variant="outline">
																{order.type.toUpperCase()}
															</Badge>
														</div>
														<Badge variant="default">
															{order.status}
														</Badge>
													</div>
													<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
														<div>
															<p className="text-muted-foreground">Price</p>
															<p className="font-medium">
																{formatCurrency(order.price)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Quantity
															</p>
															<p className="font-medium">
																{formatNumber(order.amount, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Executed</p>
															<p className="font-medium">
																{formatNumber(order.filled, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Cost</p>
															<p className="font-medium">
																{formatCurrency(order.cost)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Fee</p>
															<p className="font-medium">
																{formatCurrency(order.fee.cost)}{" "}
																{order.fee.currency}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Time</p>
															<p className="font-medium">
																{formatDate(order.timestamp)}
															</p>
														</div>
													</div>
												</CardContent>
											</Card>
										))
									)}
							</TabsContent>

							<TabsContent value="canceled" className="space-y-4">
								{allOrders.canceled.length === 0
									? (
										<p className="text-center text-muted-foreground py-8">
											No canceled orders
										</p>
									)
									: (
										allOrders.canceled.map((
											order: OrderInfo,
											index: number,
										) => (
											<Card key={index}>
												<CardContent className="p-4">
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-3">
															<h4 className="font-semibold">{order.symbol}</h4>
															<Badge
																variant={order.side === "sell"
																	? "destructive"
																	: "default"}
															>
																{order.side.toUpperCase()}
															</Badge>
															<Badge variant="outline">
																{order.type.toUpperCase()}
															</Badge>
														</div>
														<Badge variant="destructive">
															{order.status}
														</Badge>
													</div>
													<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
														<div>
															<p className="text-muted-foreground">Price</p>
															<p className="font-medium">
																{formatCurrency(order.price)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Quantity
															</p>
															<p className="font-medium">
																{formatNumber(order.amount, 4)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">
																Creation Time
															</p>
															<p className="font-medium">
																{formatDate(order.timestamp)}
															</p>
														</div>
														<div>
															<p className="text-muted-foreground">Order ID</p>
															<p className="font-medium text-xs">{order.id}</p>
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
					<CardHeader>
						<CardTitle>Trading Protocol</CardTitle>
						<CardDescription>
							Strategy settings and risk management
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Strategy</p>
								<p className="font-medium">{walletData.protocol.strategy}</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Trading Style</p>
								<p className="font-medium">
									{walletData.protocol.tradingStyle}
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									Max Risk Per Trade
								</p>
								<p className="font-medium text-orange-600">
									{walletData.protocol.maxRiskPerTrade}%
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Max Leverage</p>
								<p className="font-medium">
									x{walletData.protocol.maxLeverage}
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Max Drawdown</p>
								<p className="font-medium text-red-600">
									{walletData.protocol.maxDrawdown}%
								</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Stop Loss</p>
								<p className="font-medium">{walletData.protocol.stopLoss}%</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Take Profit</p>
								<p className="font-medium">{walletData.protocol.takeProfit}%</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Risk/Reward</p>
								<p className="font-medium">
									1:{walletData.protocol.riskRewardRatio}
								</p>
							</div>
						</div>

						<Separator className="my-6" />

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Traded Markets</p>
								<div className="flex flex-wrap gap-2">
									{walletData.protocol.markets.map((market, index) => (
										<Badge key={index} variant="outline">{market}</Badge>
									))}
								</div>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Order Types</p>
								<div className="flex flex-wrap gap-2">
									{walletData.protocol.orderTypes.map((type, index) => (
										<Badge key={index} variant="outline">{type}</Badge>
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
	const [address, setAddress] = useState("ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv");
	const [loading, setLoading] = useState(false);
	const [response, setResponse] = useState<WalletResponse[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!address.trim()) {
			setError("Please enter a wallet address");
			return;
		}

		setLoading(true);
		setError(null);
		setResponse(null);

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
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const data = await res.json();
			setResponse(data);
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
					(symbolOrders: unknown[]) => {
						totalOpenOrders += symbolOrders.open?.length || 0;
					},
				);
			});
			account.orders?.futures?.forEach((futuresData) => {
				Object.values(futuresData.value.raw.orders).forEach(
					(symbolOrders: unknown[]) => {
						totalOpenOrders += symbolOrders.open?.length || 0;
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
			<Card className="border-2">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Wallet className="h-5 w-5" />
						Wallet Verification
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
									placeholder="Enter wallet address (e.g., gqPWhyKqd7GGozJUvZupc82Eoi9AJGvy4V)"
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

			{/* Results */}
			{response && response.length > 0 && (
				<div className="space-y-6">
					{/* Total Statistics */}
					{totalStats && totalStats.accountsCount > 1 && (
						<Card className="border-2 bg-gradient-to-r from-primary/5 to-secondary/5">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Overall Statistics ({totalStats.accountsCount} accounts)
								</CardTitle>
								<CardDescription>
									Summary information for all accounts
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">
											Total Equity
										</p>
										<p className="text-3xl">
											{formatCurrency(totalStats.totalEquity)}
										</p>
									</div>
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">
											Total Balance
										</p>
										<p className="text-2xl">
											{formatCurrency(totalStats.totalWalletBalance)}
										</p>
									</div>
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">Available</p>
										<p className="text-2xl">
											{formatCurrency(totalStats.totalAvailableBalance)}
										</p>
									</div>
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">
											Total Unrealized P&L
										</p>
										<div className="flex items-center gap-2">
											{totalStats.totalPerpUPL >= 0
												? <TrendingUp className="h-4 w-4 text-green-600" />
												: <TrendingDown className="h-4 w-4 text-red-600" />}
											<p
												className={`text-2xl ${
													totalStats.totalPerpUPL >= 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{formatCurrency(totalStats.totalPerpUPL)}
											</p>
										</div>
									</div>
								</div>

								<Separator className="my-6" />

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
									<div className="space-y-1">
										<p className="text-muted-foreground">
											Number of Accounts
										</p>
										<p className="font-medium">{totalStats.accountsCount}</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground">
											Total Number of Positions
										</p>
										<p className="font-medium">{totalStats.totalPositions}</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground">Open Orders</p>
										<p className="font-medium">{totalStats.totalOpenOrders}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Account Tabs */}
					<Card>
						<CardHeader>
							<CardTitle>Accounts</CardTitle>
							<CardDescription>
								Detailed information for each account
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue={response[0].nid} className="w-full">
								<TabsList className="grid w-full grid-cols-2">
									{response.map((account) => (
										<TabsTrigger
											key={account.nid}
											value={account.nid}
											className="flex items-center gap-2"
										>
											<Wallet className="h-4 w-4" />
											{account.nid} ({account.exchange.toUpperCase()})
										</TabsTrigger>
									))}
								</TabsList>

								{response.map((account) => (
									<TabsContent key={account.nid} value={account.nid}>
										<AccountCard walletData={account} />
									</TabsContent>
								))}
							</Tabs>
						</CardContent>
					</Card>
				</div>
			)}
		</Screen>
	);
}
