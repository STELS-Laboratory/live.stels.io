"use client";

import type React from "react";
import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Activity,
	AlertCircle,
	BarChart3,
	Calculator,
	CheckCircle,
	Clock,
	DollarSign,
	Globe,
	Loader2,
	MapPin,
	Shield,
	ShoppingCart,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	Wallet,
	XCircle,
} from "lucide-react";
import { cn, filterSession } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import Markets from "@/routes/main/Markets";
import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import Loader from "@/components/ui/loader";

const validateAddress = (address: string): boolean => {
	if (!address || typeof address !== "string") return false;
	const trimmedAddress = address.trim();
	return trimmedAddress.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmedAddress);
};

interface CoinInfo {
	coin: string;
	equity: string;
	usdValue: string;
	walletBalance: string;
	unrealisedPnl: string;
	borrowAmount: string;
	availableToWithdraw: string;
	availableToBorrow: string;
	bonus: string;
	accruedInterest: string;
	totalOrderIM: string;
	totalPositionIM: string;
	totalPositionMM: string;
	unrealisedPnl2: string;
	totalWalletBalance: string;
	marginCollateral: boolean;
	locked: string;
	spotHedgingQty: string;
	cumRealisedPnl: string;
}

interface RawPosition {
	symbol: string;
	contracts: number;
	contractSize: number;
	unrealizedPnl: number;
	leverage: number;
	liquidationPrice: number;
	collateral: number;
	notional: number;
	markPrice: number;
	entryPrice: number;
	timestamp: number;
	initialMargin: number;
	initialMarginPercentage: number;
	maintenanceMargin: number;
	maintenanceMarginPercentage: number;
	marginRatio: number;
	datetime: string;
	marginMode: string;
	marginType: string;
	side: string;
	hedged: boolean;
	percentage: number;
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

const formatCurrency = (value: string | number): string => {
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
	if (isNaN(num)) return { value: "$0.00", color: "text-muted-foreground" };

	const formatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);

	if (num > 0) return { value: formatted, color: "text-emerald-600" };
	if (num < 0) return { value: formatted, color: "text-red-500" };
	return { value: formatted, color: "text-muted-foreground" };
};

const formatPercentageWithColor = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return { value: "0%", color: "text-muted-foreground" };

	const formatted = `${(num * 100).toFixed(2)}%`;

	if (num > 0) return { value: formatted, color: "text-emerald-600" };
	if (num < 0) return { value: formatted, color: "text-red-500" };
	return { value: formatted, color: "text-muted-foreground" };
};

const formatROIWithColor = (
	entryPrice: number,
	currentPrice: number,
	side: string,
) => {
	const roi = ((currentPrice - entryPrice) / entryPrice) * 100 *
		(side.toLowerCase() === "sell" ? -1 : 1);
	const formatted = `${roi.toFixed(2)}%`;

	if (roi > 0) return { value: formatted, color: "text-emerald-600" };
	if (roi < 0) return { value: formatted, color: "text-red-500" };
	return { value: formatted, color: "text-muted-foreground" };
};

const formatNumber = (value: string | number, decimals = 4): string => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return "0";

	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals,
	}).format(num);
};

const formatDate = (timestamp: number | string): string => {
	const date = new Date(
		typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp,
	);
	return date.toLocaleString("en-US", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
};

interface MetricCardProps {
	label: string;
	value: string;
	color?: string;
	icon?: React.ReactNode;
	size?: "sm" | "md" | "lg";
}

const MetricCard: React.FC<MetricCardProps> = (
	{ label, value, color = "text-foreground", icon, size = "md" },
) => (
	<div className="space-y-1">
		<div className="flex items-center gap-1">
			{icon}
			<p className="text-xs text-muted-foreground font-medium">{label}</p>
		</div>
		<p
			className={`font-semibold ${
				size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm"
			} ${color} font-mono`}
		>
			{value}
		</p>
	</div>
);

interface AccountOverviewProps {
	walletData: WalletResponse;
}

const AccountOverview: React.FC<AccountOverviewProps> = ({ walletData }) => {
	const accountData = walletData.wallet.info.result.list[0];
	const pnlData = formatCurrencyWithColor(accountData.totalPerpUPL);
	const marginData = formatPercentageWithColor(accountData.accountLTV || "0");

	return (
		<Card className="border-2">
			<CardHeader className="pb-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<div className="p-2 bg-primary/10 rounded-lg">
							<DollarSign className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-lg">Account Overview</CardTitle>
							<CardDescription className="text-sm">
								{walletData.exchange.toUpperCase()} • {walletData.nid}
							</CardDescription>
						</div>
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<Badge
							variant={walletData.connection ? "default" : "destructive"}
							className="text-xs font-medium"
						>
							{walletData.connection ? "Connected" : "Disconnected"}
						</Badge>
					</div>
				</div>
				{walletData.note && (
					<div className="mt-3 p-3 bg-muted/50 rounded-lg">
						<p className="text-sm text-muted-foreground">{walletData.note}</p>
					</div>
				)}
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Primary Metrics */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					<MetricCard
						label="Total Equity"
						value={formatCurrency(accountData.totalEquity)}
						size="lg"
						icon={<BarChart3 className="h-3 w-3 text-primary" />}
					/>
					<MetricCard
						label="Wallet Balance"
						value={formatCurrency(accountData.totalWalletBalance)}
						size="md"
					/>
					<MetricCard
						label="Available Balance"
						value={formatCurrency(accountData.totalAvailableBalance || "0")}
						size="md"
					/>
					<div className="space-y-1">
						<div className="flex items-center gap-1">
							{Number.parseFloat(accountData.totalPerpUPL) >= 0
								? <TrendingUp className="h-3 w-3 text-emerald-600" />
								: <TrendingDown className="h-3 w-3 text-red-500" />}
							<p className="text-xs text-muted-foreground font-medium">
								Unrealized P&L
							</p>
						</div>
						<p className={`text-base font-semibold font-mono ${pnlData.color}`}>
							{pnlData.value}
						</p>
					</div>
				</div>

				<Separator />

				{/* Secondary Metrics */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="space-y-2">
						<p className="text-xs text-muted-foreground font-medium">
							Wallet Address
						</p>
						<div className="p-2 bg-muted rounded-lg">
							<code className="text-xs break-all font-mono text-muted-foreground">
								{walletData.address}
							</code>
						</div>
					</div>
					<MetricCard
						label="Initial Margin"
						value={formatCurrency(accountData.totalInitialMargin || "0")}
						color="text-blue-600"
						icon={<Shield className="h-3 w-3 text-blue-600" />}
					/>
					<MetricCard
						label="Maintenance Margin"
						value={formatCurrency(accountData.totalMaintenanceMargin || "0")}
						color="text-purple-600"
						icon={<Target className="h-3 w-3 text-purple-600" />}
					/>
					<MetricCard
						label="Margin Level"
						value={marginData.value}
						color={marginData.color}
					/>
				</div>
			</CardContent>
		</Card>
	);
};

interface AssetBalancesProps {
	coins: CoinInfo[];
}

const AssetBalances: React.FC<AssetBalancesProps> = ({ coins }) => (
	<Card>
		<CardHeader className="pb-4">
			<div className="flex items-center gap-3">
				<div className="p-2 bg-emerald-500/10 rounded-lg">
					<Wallet className="h-5 w-5 text-emerald-600" />
				</div>
				<div>
					<CardTitle className="text-lg">Asset Portfolio</CardTitle>
					<CardDescription>
						{coins.length} assets • Detailed balance information
					</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent className="p-0">
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0">
				{coins.map((coin: CoinInfo, index: number) => {
					const isActive = Number.parseFloat(coin.equity) > 0;
					const hasLocked = Number.parseFloat(coin.locked) > 0;
					const unrealizedPnl = formatCurrencyWithColor(coin.unrealisedPnl);
					const realizedPnl = formatCurrencyWithColor(coin.cumRealisedPnl);

					return (
						<Card
							key={index}
							className={`border-0 border-b border-r last:border-r-0 rounded-none hover:bg-muted/30 transition-colors ${
								isActive ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""
							}`}
						>
							<CardContent className="p-4">
								<div className="flex items-center justify-between mb-4">
									<div className="flex items-center gap-2">
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
												isActive
													? "bg-emerald-500 text-white"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{coin.coin.slice(0, 2)}
										</div>
										<h3 className="text-base font-semibold">{coin.coin}</h3>
									</div>
									<div className="flex items-center gap-1">
										{hasLocked && (
											<Badge variant="outline" className="text-xs">
												Locked
											</Badge>
										)}
										<Badge
											variant={isActive ? "default" : "secondary"}
											className="text-xs"
										>
											{isActive ? "Active" : "Inactive"}
										</Badge>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Balance
										</span>
										<span className="font-mono text-sm">
											{formatNumber(coin.walletBalance)} {coin.coin}
										</span>
									</div>

									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Equity
										</span>
										<span className="font-mono text-sm">
											{formatNumber(coin.equity)} {coin.coin}
										</span>
									</div>

									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											USD Value
										</span>
										<span className="font-mono text-sm font-semibold text-emerald-600">
											{formatCurrency(coin.usdValue)}
										</span>
									</div>

									{Number.parseFloat(coin.unrealisedPnl) !== 0 && (
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">
												Unrealized P&L
											</span>
											<span
												className={`font-mono text-sm ${unrealizedPnl.color}`}
											>
												{unrealizedPnl.value}
											</span>
										</div>
									)}

									{Number.parseFloat(coin.borrowAmount) > 0 && (
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">
												Borrowed
											</span>
											<span className="font-mono text-sm font-semibold text-orange-600">
												{formatNumber(coin.borrowAmount)} {coin.coin}
											</span>
										</div>
									)}

									{Number.parseFloat(coin.cumRealisedPnl) !== 0 && (
										<div className="flex justify-between items-center">
											<span className="text-sm text-muted-foreground">
												Realized P&L
											</span>
											<span
												className={`font-mono text-sm ${realizedPnl.color}`}
											>
												{realizedPnl.value}
											</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</CardContent>
	</Card>
);

// Component for displaying a single account
/**
 * Enhanced AccountCard component with improved organization and styling
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
		<div className="space-y-6">
			{/* Account Overview */}
			<AccountOverview walletData={walletData} />

			{/* Asset Balances */}
			<AssetBalances coins={walletData.wallet.info.result.list[0].coin} />

			{/* Trading Positions */}
			{positions.length > 0 && (
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-500/10 rounded-lg">
								<Activity className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<CardTitle className="text-lg">Open Positions</CardTitle>
								<CardDescription>
									{positions.length} active positions • Current performance
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{positions.map((position: RawPosition, index: number) => {
								const pnlData = formatCurrencyWithColor(position.unrealizedPnl);
								const roiData = formatROIWithColor(
									position.entryPrice,
									position.markPrice,
									position.side,
								);

								return (
									<Card
										key={index}
										className="border-l-4 border-l-primary hover:shadow-md transition-all duration-200"
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
															className="text-xs font-medium"
														>
															{position.side.toLowerCase() === "sell"
																? "SHORT"
																: "LONG"}
														</Badge>
														<Badge
															variant="outline"
															className={`text-xs font-medium ${
																position.leverage >= 10
																	? "border-red-500 text-red-500"
																	: position.leverage >= 5
																	? "border-orange-500 text-orange-500"
																	: "border-emerald-500 text-emerald-500"
															}`}
														>
															{position.leverage}x
														</Badge>
													</div>
												</div>
												<div className="flex items-center gap-2 flex-shrink-0">
													{Number.parseFloat(
															position.unrealizedPnl.toString(),
														) >= 0
														? (
															<TrendingUp className="h-4 w-4 text-emerald-600" />
														)
														: <TrendingDown className="h-4 w-4 text-red-500" />}
													<span
														className={`text-lg font-semibold ${pnlData.color}`}
													>
														{pnlData.value}
													</span>
												</div>
											</div>

											<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
												<MetricCard
													label="Size"
													value={formatNumber(position.contracts, 4)}
													size="sm"
												/>
												<MetricCard
													label="Entry Price"
													value={formatCurrency(position.entryPrice)}
													size="sm"
												/>
												<MetricCard
													label="Current Price"
													value={formatCurrency(position.markPrice)}
													size="sm"
												/>
												<MetricCard
													label="Notional Value"
													value={formatCurrency(position.notional)}
													size="sm"
												/>
												<MetricCard
													label="Liquidation"
													value={formatCurrency(position.liquidationPrice)}
													color="text-red-500"
													size="sm"
												/>
												<MetricCard
													label="ROI"
													value={roiData.value}
													color={roiData.color}
													size="sm"
												/>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Orders */}
			{(allOrders.open.length > 0 || allOrders.closed.length > 0 ||
				allOrders.canceled.length > 0) && (
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-purple-500/10 rounded-lg">
								<ShoppingCart className="h-5 w-5 text-purple-600" />
							</div>
							<div>
								<CardTitle className="text-lg">Order Management</CardTitle>
								<CardDescription>
									Trading orders and execution history
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<Tabs defaultValue="open" className="w-full">
							<TabsList className="w-full h-auto p-1 bg-muted/50 border-b rounded-none">
								<TabsTrigger
									value="open"
									className="flex items-center gap-2 px-4 py-3 text-sm font-medium"
								>
									<Clock className="h-4 w-4" />
									<span>Open Orders</span>
									<Badge variant="secondary" className="text-xs">
										{allOrders.open.length}
									</Badge>
								</TabsTrigger>
								<TabsTrigger
									value="closed"
									className="flex items-center gap-2 px-4 py-3 text-sm font-medium"
								>
									<CheckCircle className="h-4 w-4" />
									<span>Executed</span>
									<Badge variant="secondary" className="text-xs">
										{allOrders.closed.length}
									</Badge>
								</TabsTrigger>
								<TabsTrigger
									value="canceled"
									className="flex items-center gap-2 px-4 py-3 text-sm font-medium"
								>
									<XCircle className="h-4 w-4" />
									<span>Canceled</span>
									<Badge variant="secondary" className="text-xs">
										{allOrders.canceled.length}
									</Badge>
								</TabsTrigger>
							</TabsList>

							<TabsContent value="open" className="space-y-3 p-4">
								{allOrders.open.length === 0
									? (
										<div className="text-center py-12">
											<div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
												<Clock className="h-8 w-8 text-muted-foreground" />
											</div>
											<p className="text-muted-foreground font-medium">
												No open orders
											</p>
											<p className="text-sm text-muted-foreground mt-1">
												Your pending orders will appear here
											</p>
										</div>
									)
									: (
										allOrders.open.map((order: OrderInfo, index: number) => (
											<Card
												key={index}
												className="hover:shadow-md transition-shadow"
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
													<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
														<MetricCard
															label="Price"
															value={formatCurrency(order.price)}
															size="sm"
														/>
														<MetricCard
															label="Quantity"
															value={formatNumber(order.amount, 4)}
															size="sm"
														/>
														<MetricCard
															label="Executed"
															value={formatNumber(order.filled, 4)}
															size="sm"
														/>
														<MetricCard
															label="Remaining"
															value={formatNumber(order.remaining, 4)}
															size="sm"
														/>
														<MetricCard
															label="Cost"
															value={formatCurrency(order.cost)}
															size="sm"
														/>
														<MetricCard
															label="Time"
															value={formatDate(order.timestamp)}
															size="sm"
														/>
													</div>
												</CardContent>
											</Card>
										))
									)}
							</TabsContent>

							<TabsContent value="closed" className="space-y-3 p-4">
								{allOrders.closed.length === 0
									? (
										<div className="text-center py-12">
											<div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
												<CheckCircle className="h-8 w-8 text-muted-foreground" />
											</div>
											<p className="text-muted-foreground font-medium">
												No executed orders
											</p>
											<p className="text-sm text-muted-foreground mt-1">
												Your completed orders will appear here
											</p>
										</div>
									)
									: (
										allOrders.closed.map((order: OrderInfo, index: number) => (
											<Card
												key={index}
												className="hover:shadow-md transition-shadow"
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
													<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
														<MetricCard
															label="Price"
															value={formatCurrency(order.price)}
															size="sm"
														/>
														<MetricCard
															label="Quantity"
															value={formatNumber(order.amount, 4)}
															size="sm"
														/>
														<MetricCard
															label="Executed"
															value={formatNumber(order.filled, 4)}
															size="sm"
														/>
														<MetricCard
															label="Cost"
															value={formatCurrency(order.cost)}
															size="sm"
														/>
														<MetricCard
															label="Fee"
															value={`${
																formatCurrency(order.fee.cost)
															} ${order.fee.currency}`}
															size="sm"
														/>
														<MetricCard
															label="Time"
															value={formatDate(order.timestamp)}
															size="sm"
														/>
													</div>
												</CardContent>
											</Card>
										))
									)}
							</TabsContent>

							<TabsContent value="canceled" className="space-y-3 p-4">
								{allOrders.canceled.length === 0
									? (
										<div className="text-center py-12">
											<div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
												<XCircle className="h-8 w-8 text-muted-foreground" />
											</div>
											<p className="text-muted-foreground font-medium">
												No canceled orders
											</p>
											<p className="text-sm text-muted-foreground mt-1">
												Your canceled orders will appear here
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
												className="hover:shadow-md transition-shadow"
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
													<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
														<MetricCard
															label="Price"
															value={formatCurrency(order.price)}
															size="sm"
														/>
														<MetricCard
															label="Quantity"
															value={formatNumber(order.amount, 4)}
															size="sm"
														/>
														<MetricCard
															label="Creation Time"
															value={formatDate(order.timestamp)}
															size="sm"
														/>
														<div className="space-y-1">
															<p className="text-xs text-muted-foreground font-medium">
																Order ID
															</p>
															<p className="font-mono text-xs break-all text-muted-foreground">
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
						<div className="flex items-center gap-3">
							<div className="p-2 bg-orange-500/10 rounded-lg">
								<Shield className="h-5 w-5 text-orange-600" />
							</div>
							<div>
								<CardTitle className="text-lg">Trading Protocol</CardTitle>
								<CardDescription>
									Risk management and strategy configuration
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
							<MetricCard
								label="Strategy"
								value={walletData.protocol.strategy}
								size="sm"
							/>
							<MetricCard
								label="Trading Style"
								value={walletData.protocol.tradingStyle}
								size="sm"
							/>
							<MetricCard
								label="Max Risk Per Trade"
								value={`${walletData.protocol.maxRiskPerTrade}%`}
								color={walletData.protocol.maxRiskPerTrade > 5
									? "text-red-500"
									: walletData.protocol.maxRiskPerTrade > 2
									? "text-orange-500"
									: "text-emerald-600"}
								size="sm"
							/>
							<MetricCard
								label="Max Leverage"
								value={`${walletData.protocol.maxLeverage}x`}
								color={walletData.protocol.maxLeverage >= 10
									? "text-red-500"
									: walletData.protocol.maxLeverage >= 5
									? "text-orange-500"
									: "text-emerald-600"}
								size="sm"
							/>
							<MetricCard
								label="Max Drawdown"
								value={`${walletData.protocol.maxDrawdown}%`}
								color={walletData.protocol.maxDrawdown > 20
									? "text-red-500"
									: walletData.protocol.maxDrawdown > 10
									? "text-orange-500"
									: "text-emerald-600"}
								size="sm"
							/>
							<MetricCard
								label="Stop Loss"
								value={`${walletData.protocol.stopLoss}%`}
								color="text-red-500"
								size="sm"
							/>
							<MetricCard
								label="Take Profit"
								value={`${walletData.protocol.takeProfit}%`}
								color="text-emerald-600"
								size="sm"
							/>
							<MetricCard
								label="Risk/Reward Ratio"
								value={`1:${walletData.protocol.riskRewardRatio}`}
								color={walletData.protocol.riskRewardRatio >= 3
									? "text-emerald-600"
									: walletData.protocol.riskRewardRatio >= 2
									? "text-yellow-600"
									: "text-red-500"}
								size="sm"
							/>
						</div>

						<Separator />

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							<div className="space-y-3">
								<p className="text-sm font-medium text-muted-foreground">
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
							<div className="space-y-3">
								<p className="text-sm font-medium text-muted-foreground">
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
 * Enhanced WalletWidget main component with improved UX and error handling
 */

class ProfessionalCalculations {
	static formatCurrency(value: number, precision = 2): string {
		const isNegative = value < 0;
		const absValue = Math.abs(value);
		const formatted = new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: precision,
			maximumFractionDigits: precision,
		}).format(absValue);
		return isNegative ? `-${formatted}` : formatted;
	}

	static formatNumber(value: number, precision = 8): string {
		return new Intl.NumberFormat("en-US", {
			minimumFractionDigits: Math.min(2, precision),
			maximumFractionDigits: precision,
		}).format(value);
	}

	static formatPercentage(value: number, precision = 2): string {
		return `${value >= 0 ? "+" : ""}${value.toFixed(precision)}%`;
	}

	static calculatePnL(
		current: number,
		previous: number,
	): {
		absolute: number;
		percentage: number;
		isProfit: boolean;
	} {
		const absolute = current - previous;
		const percentage = previous !== 0
			? (absolute / Math.abs(previous)) * 100
			: 0;
		return {
			absolute,
			percentage,
			isProfit: absolute >= 0,
		};
	}

	static calculateMarginRatio(
		balance: number,
		initial: number,
		maintenance: number,
	): {
		utilizationRatio: number;
		marginLevel: number;
		riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	} {
		const utilizationRatio = (initial / balance) * 100;
		const marginLevel = balance / maintenance;

		let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
		if (marginLevel < 1.5) riskLevel = "CRITICAL";
		else if (marginLevel < 2.5) riskLevel = "HIGH";
		else if (marginLevel < 5) riskLevel = "MEDIUM";

		return { utilizationRatio, marginLevel, riskLevel };
	}

	static calculateWorkerEfficiency(
		workers: { active: number; stopped: number; total: number },
	): {
		efficiency: number;
		status: "OPTIMAL" | "GOOD" | "WARNING" | "CRITICAL";
	} {
		const efficiency = workers.total > 0
			? (workers.active / workers.total) * 100
			: 0;

		let status: "OPTIMAL" | "GOOD" | "WARNING" | "CRITICAL" = "CRITICAL";
		if (efficiency >= 95) status = "OPTIMAL";
		else if (efficiency >= 80) status = "GOOD";
		else if (efficiency >= 60) status = "WARNING";

		return { efficiency, status };
	}

	static formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleString("en-US", {
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	}

	static getTimeDifference(timestamp1: number, timestamp2: number): string {
		const diff = Math.abs(timestamp1 - timestamp2);
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
		if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
		return `${seconds}s ago`;
	}

	static analyzeNetworkNodes(nodeMap: Record<string, any>): {
		totalNodes: number;
		activeNodes: number;
		regions: Record<string, number>;
		avgCpuUsage: number;
		avgMemoryUsage: number;
		healthStatus: "EXCELLENT" | "GOOD" | "STABLE" | "CRITICAL";
		lastUpdate: number;
	} {
		const nodes = Object.values(nodeMap);
		const totalNodes = nodes.length;

		const currentTime = Date.now();
		const activeNodes = nodes.filter((node) => {
			const nodeTime = node.value?.timestamp || 0;
			return (currentTime - nodeTime) < 300000; // 5 minutes threshold
		}).length;

		const regions = nodes.reduce((acc, node) => {
			const location = node.value?.raw?.location;
			if (location?.country_name) {
				acc[location.country_name] = (acc[location.country_name] || 0) + 1;
			}
			return acc;
		}, {} as Record<string, number>);

		const cpuUsages = nodes.map((node) => {
			const cpu = node.value?.raw?.cpu || [0, 0, 0];
			return cpu.reduce((sum: number, val: number) => sum + val, 0) /
				cpu.length;
		}).filter((usage) => usage > 0);

		const memoryUsages = nodes.map((node) => {
			const memory = node.value?.raw?.memory;
			if (!memory) return 0;
			return (memory.heapUsed / memory.heapTotal) * 100;
		}).filter((usage) => usage > 0);

		const avgCpuUsage = cpuUsages.length > 0
			? cpuUsages.reduce((sum, val) => sum + val, 0) / cpuUsages.length
			: 0;

		const avgMemoryUsage = memoryUsages.length > 0
			? memoryUsages.reduce((sum, val) => sum + val, 0) / memoryUsages.length
			: 0;

		const healthPercentage = totalNodes > 0
			? (activeNodes / totalNodes) * 100
			: 0;
		let healthStatus: "EXCELLENT" | "GOOD" | "STABLE" | "CRITICAL" = "CRITICAL";
		if (healthPercentage >= 95) healthStatus = "EXCELLENT";
		else if (healthPercentage >= 40) healthStatus = "GOOD";
		else if (healthPercentage >= 10) healthStatus = "STABLE";

		const lastUpdate = Math.max(
			...nodes.map((node) => node.value?.timestamp || 0),
		);

		return {
			totalNodes,
			activeNodes,
			regions,
			avgCpuUsage,
			avgMemoryUsage,
			healthStatus,
			lastUpdate,
		};
	}
}

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

	interface WelcomeSessionData {
		[key: string]: {
			raw: {
				liquidity: number;
				available: number;
				margin: {
					balance: number;
					initial: number;
					maintenance: number;
				};
				protection: number;
				coins: Record<string, number>;
				rate: number;
				timestamp: number;
				exchanges: string[];
				accounts: unknown[];
				workers: {
					active: number;
					stopped: number;
					total: number;
				};
			};
		};
	}

	const session = useSessionStoreSync() as WelcomeSessionData | null;

	if (
		!session || !session["testnet.snapshot.sonar"] ||
		!session["testnet.runtime.sonar"]
	) {
		return <Loader>Scanning connection Testnet</Loader>;
	}

	const netMap = filterSession(session || {}, /\.heterogen\..*\.setting$/);

	const snapshot = session["testnet.snapshot.sonar"];
	const runtime = session["testnet.runtime.sonar"];

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

	return (
		<div className="container m-auto gap-6 space-y-8">
			<Card className="mb-6">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
							<Wallet className="h-6 w-6 text-amber-600" />
						</div>
						<div>
							<CardTitle className="text-xl flex items-center gap-2">
								Sonar Scanner
								<Badge
									variant="outline"
									className="text-xs font-mono bg-amber-50 text-amber-700 border-amber-200"
								>
									TestNet
								</Badge>
							</CardTitle>
							<CardDescription className="text-base">
								Advanced wallet analysis and portfolio insights for Gliesereum
								network
							</CardDescription>
						</div>
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
									className="flex-1 h-11"
								/>
								<Button
									type="submit"
									disabled={loading || !address.trim()}
									className="h-11 px-6"
								>
									{loading
										? (
											<>
												<Loader2 className="h-4 w-4 animate-spin mr-2" />
												Analyzing...
											</>
										)
										: (
											<>
												<BarChart3 className="h-4 w-4 mr-2" />
												Analyze
											</>
										)}
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center text-white">
						<Globe className="w-5 h-5 mr-2" />
						NETWORK NODES STATUS
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-w-0 overflow-hidden">
						<div className="text-center">
							<div className="text-xs text-gray-400 mb-2">
								TOTAL HETEROGENS
							</div>
							<div className="text-2xl font-bold text-white mb-1">
								{networkAnalysis.totalNodes}
							</div>
							<div className="text-xs text-gray-400">
								distributed globally
							</div>
						</div>

						<div className="text-center">
							<div className="text-xs text-gray-400 mb-2">ACTIVE NODES</div>
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
							<div className="text-xs text-gray-400 mb-2">NETWORK HEALTH</div>
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
							<div className="text-xs text-gray-400 mt-1">
								overall status
							</div>
						</div>

						<div className="text-center">
							<div className="text-xs text-gray-400 mb-2">REGIONS</div>
							<div className="text-sm font-medium text-blue-400">
								{Object.keys(networkAnalysis.regions).length}
							</div>
							<div className="text-xs text-gray-400 mt-1">
								countries
							</div>
						</div>
					</div>

					{/* Regional Distribution */}
					<div className="mt-6 pt-4 border-t  min-w-0 overflow-hidden">
						<div className="text-xs text-gray-400 mb-3">
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
											<MapPin className="w-3 h-3 mr-1 text-gray-400" />
											<span className="text-gray-300 truncate">
												{country}
											</span>
										</div>
										<Badge
											variant="outline"
											className="text-xs px-2 py-0.5 border-gray-600 text-gray-300"
										>
											{count}
										</Badge>
									</div>
								))}
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="container m-auto gap-6 space-y-8">
				{/* Key Performance Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
					{/* Total Liquidity */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-gray-400 flex items-center">
								<Wallet className="w-4 h-4 mr-2" />
								TOTAL LIQUIDITY
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white mb-2">
								{calc.formatCurrency(runtime.raw.liquidity)}
							</div>
							<div
								className={cn(
									"flex items-center text-sm",
									liquidityPnL.isProfit ? "text-emerald-400" : "text-red-400",
								)}
							>
								{liquidityPnL.isProfit
									? <TrendingUp className="w-4 h-4 mr-1" />
									: <TrendingDown className="w-4 h-4 mr-1" />}
								{calc.formatCurrency(liquidityPnL.absolute)}
								<span className="ml-1">
									({calc.formatPercentage(liquidityPnL.percentage)})
								</span>
							</div>
							<div className="text-xs text-gray-500 mt-1">
								vs previous snapshot
							</div>
						</CardContent>
					</Card>

					{/* Available Balance */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-gray-400 flex items-center">
								<DollarSign className="w-4 h-4 mr-2" />
								AVAILABLE BALANCE
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white mb-2">
								{calc.formatCurrency(runtime.raw.available)}
							</div>
							<div
								className={cn(
									"flex items-center text-sm",
									availablePnL.isProfit ? "text-emerald-400" : "text-red-400",
								)}
							>
								{availablePnL.isProfit
									? <TrendingUp className="w-4 h-4 mr-1" />
									: <TrendingDown className="w-4 h-4 mr-1" />}
								{calc.formatCurrency(availablePnL.absolute)}
								<span
									className={cn(
										"ml-1",
										availablePnL.isProfit ? "text-emerald-400" : "text-red-400",
									)}
								>
									({calc.formatPercentage(availablePnL.percentage)})
								</span>
							</div>
							<div className="text-xs text-gray-500 mt-1">
								<span className="text-blue-400 font-medium">
									{((runtime.raw.available / runtime.raw.liquidity) * 100)
										.toFixed(1)}%
								</span>{" "}
								of total liquidity
							</div>
						</CardContent>
					</Card>

					{/* Portfolio ROI */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-gray-400 flex items-center">
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
								{calc.formatPercentage(totalROI.percentage, 3)}
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
								{calc.formatCurrency(totalROI.absolute)}
							</div>
							<div className="text-xs text-gray-500 mt-1">growth NAV</div>
						</CardContent>
					</Card>

					{/* Performance Rate */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm font-medium text-gray-400 flex items-center">
								<Activity className="w-4 h-4 mr-2" />
								PERFORMANCE RATE
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white mb-2">
								{(runtime.raw.rate * 100).toFixed(3)}%
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
								{calc.formatPercentage(
									((runtime.raw.rate - snapshot.raw.rate) / snapshot.raw.rate) *
										100,
									3,
								)}
							</div>
							<div className="text-xs text-gray-500 mt-1">vs previous rate</div>
						</CardContent>
					</Card>
				</div>

				{/* Protection & Risk Management */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center text-white">
							<Shield className="w-5 h-5 mr-2" />
							PROTECTION & RISK MANAGEMENT
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">
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
								<div className="text-xs text-gray-400 mb-2">RISK LEVEL</div>
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
								<div className="text-xs text-gray-400 mt-1">
									based on margin
								</div>
							</div>

							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">EXCHANGE</div>
								<div className="text-sm font-medium text-amber-400">
									{runtime.raw.exchanges[0].toUpperCase()}
								</div>
								<div className="text-xs text-gray-400 mt-1">
									primary exchange
								</div>
							</div>

							<div className="text-center">
								<div className="text-xs text-gray-400 mb-2">ACCOUNTS</div>
								<div className="text-sm font-medium text-blue-400">
									{runtime.raw.accounts.length}
								</div>
								<div className="text-xs text-gray-400 mt-1">
									active accounts
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Advanced Analytics Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
					{/* Margin Analysis */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center text-white">
								<Calculator className="w-5 h-5 mr-2" />
								MARGIN ANALYSIS
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-xs text-gray-400 mb-1">BALANCE</div>
									<div className="text-lg font-bold text-white">
										{calc.formatCurrency(runtime.raw.margin.balance)}
									</div>
									<div
										className={cn(
											"text-xs",
											marginPnL.isProfit ? "text-emerald-400" : "text-red-400",
										)}
									>
										{calc.formatCurrency(marginPnL.absolute)}{" "}
										({calc.formatPercentage(marginPnL.percentage)})
									</div>
								</div>
								<div>
									<div className="text-xs text-gray-400 mb-1">MARGIN LEVEL</div>
									<div className="text-lg font-bold text-white">
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
									<span className="text-sm text-gray-400">
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
									<span className="text-gray-400">Initial Margin:</span>
									<span className="text-white font-mono">
										{calc.formatCurrency(runtime.raw.margin.initial)}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Maintenance:</span>
									<span className="text-white font-mono">
										{calc.formatCurrency(runtime.raw.margin.maintenance)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Worker Optimization */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center text-white">
								<Users className="w-5 h-5 mr-2" />
								PROTOCOL OPTIMIZATION
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-3 gap-4 text-center">
								<div>
									<div className="text-xs text-gray-400 mb-1">ACTIVE</div>
									<div className="text-2xl font-bold text-emerald-400">
										{runtime.raw.workers.active}
									</div>
								</div>
								<div>
									<div className="text-xs text-gray-400 mb-1">STOPPED</div>
									<div className="text-2xl font-bold text-red-400">
										{runtime.raw.workers.stopped}
									</div>
								</div>
								<div>
									<div className="text-xs text-gray-400 mb-1">TOTAL</div>
									<div className="text-2xl font-bold text-white">
										{runtime.raw.workers.total}
									</div>
								</div>
							</div>

							<div>
								<div className="flex justify-between items-center mb-2">
									<span className="text-sm text-gray-400">EFFICIENCY</span>
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
									className="h-2 bg-gray-800"
								/>
							</div>

							<div className="pt-2">
								<div className="text-xs text-gray-400 mb-2">
									PERFORMANCE INSIGHTS
								</div>
								<div className="space-y-1 text-xs">
									<div className="flex justify-between">
										<span className="text-gray-400">Uptime:</span>
										<span className="text-white">
											{workerAnalysis.efficiency.toFixed(1)}%
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-gray-400">Avg. Load:</span>
										<span className="text-white">
											{((runtime.raw.workers.active /
												runtime.raw.workers.total) * 100).toFixed(1)}%
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<Markets />
			</div>

			{/* Error State */}
			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="font-medium">{error}</AlertDescription>
				</Alert>
			)}

			<Dialog open={isResultsOpen} onOpenChange={setIsResultsOpen}>
				<DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
					<DialogHeader className="p-6 pb-4 border-b">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								<DialogTitle className="flex items-center gap-3 text-xl font-semibold">
									<div className="p-2 bg-primary/10 rounded-lg">
										<Wallet className="h-5 w-5 text-primary" />
									</div>
									<span>Wallet Analysis Results</span>
								</DialogTitle>
								<DialogDescription className="text-base mt-2">
									{response?.length === 1
										? "Comprehensive account analysis and trading insights"
										: `Portfolio analysis across ${response?.length} connected accounts`}
								</DialogDescription>
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
												<div className="p-2 bg-primary/20 rounded-lg">
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
											<div className="p-2 bg-blue-500/10 rounded-lg">
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
