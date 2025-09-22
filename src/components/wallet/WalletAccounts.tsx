import React, {useMemo, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {
	Activity,
	AlertCircle,
	BarChart3,
	Loader2,
	Shield,
	ShoppingCart,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import {useWalletStore} from "@/stores/modules/wallet.store";

// Types from Scanner.tsx
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

// Utility functions from Scanner.tsx
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
	if (isNaN(num)) return {value: "$0.00", color: "text-muted-foreground"};
	
	const formatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
	
	if (num > 0) return {value: formatted, color: "text-emerald-600"};
	if (num < 0) return {value: formatted, color: "text-red-500"};
	return {value: formatted, color: "text-muted-foreground"};
};

const formatNumber = (value: string | number, decimals = 4): string => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (isNaN(num)) return "0";
	
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals,
	}).format(num);
};

interface MetricCardProps {
	label: string;
	value: string;
	color?: string;
	icon?: React.ReactNode;
	size?: "sm" | "md" | "lg";
}

const MetricCard: React.FC<MetricCardProps> = ({
	                                               label,
	                                               value,
	                                               color = "text-foreground",
	                                               icon,
	                                               size = "md",
                                               }) => (
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

const AccountOverview: React.FC<AccountOverviewProps> = ({walletData}) => {
	const accountData = walletData.wallet.info.result.list[0];
	const pnlData = formatCurrencyWithColor(accountData.totalPerpUPL);
	const marginData = formatCurrencyWithColor(accountData.accountLTV || "0");
	
	return (
		<Card className="border-2">
			<CardHeader className="pb-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<div className="p-2 bg-primary/10 rounded-lg">
							<BarChart3 className="h-5 w-5 text-primary"/>
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
						icon={<BarChart3 className="h-3 w-3 text-primary"/>}
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
								? <TrendingUp className="h-3 w-3 text-emerald-600"/>
								: <TrendingDown className="h-3 w-3 text-red-500"/>}
							<p className="text-xs text-muted-foreground font-medium">
								Unrealized P&L
							</p>
						</div>
						<p className={`text-base font-semibold font-mono ${pnlData.color}`}>
							{pnlData.value}
						</p>
					</div>
				</div>
				
				<Separator/>
				
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
						icon={<Shield className="h-3 w-3 text-blue-600"/>}
					/>
					<MetricCard
						label="Maintenance Margin"
						value={formatCurrency(accountData.totalMaintenanceMargin || "0")}
						color="text-purple-600"
						icon={<Target className="h-3 w-3 text-purple-600"/>}
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

const AssetBalances: React.FC<AssetBalancesProps> = ({coins}) => (
	<Card>
		<CardHeader className="pb-4">
			<div className="flex items-center gap-3">
				<div className="p-2 bg-emerald-500/10 rounded-lg">
					<Wallet className="h-5 w-5 text-emerald-600"/>
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
function AccountCard(
	{walletData}: { walletData: WalletResponse },
): React.ReactElement {
	// Get positions for this account
	const positions = useMemo(() => {
		const allPositions: RawPosition[] = [];
		walletData.positions?.forEach((positionData) => {
			allPositions.push(...(positionData.value.raw.positions || []));
		});
		return allPositions;
	}, [walletData.positions]);
	
	return (
		<div className="space-y-6">
			{/* Account Overview */}
			<AccountOverview walletData={walletData}/>
			
			{/* Asset Balances */}
			<AssetBalances coins={walletData.wallet.info.result.list[0].coin}/>
			
			{/* Trading Positions */}
			{positions.length > 0 && (
				<Card>
					<CardHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-500/10 rounded-lg">
								<Activity className="h-5 w-5 text-blue-600"/>
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
								const roi =
									((position.markPrice - position.entryPrice) /
										position.entryPrice) *
									100 * (position.side.toLowerCase() === "sell" ? -1 : 1);
								const roiData = formatCurrencyWithColor(roi);
								
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
															<TrendingUp className="h-4 w-4 text-emerald-600"/>
														)
														: <TrendingDown className="h-4 w-4 text-red-500"/>}
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
		</div>
	);
}

/**
 * Wallet Accounts component that fetches and displays account information
 */
export function WalletAccounts() {
	const {currentWallet} = useWalletStore();
	const [loading, setLoading] = useState(false);
	const [accounts, setAccounts] = useState<WalletResponse[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	
	// Calculate overall statistics for all accounts
	const totalStats = useMemo(() => {
		if (!accounts) return null;
		
		let totalEquity = 0;
		let totalWalletBalance = 0;
		let totalAvailableBalance = 0;
		let totalPerpUPL = 0;
		let totalPositions = 0;
		let totalOpenOrders = 0;
		
		accounts.forEach((account) => {
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
			accountsCount: accounts.length,
		};
	}, [accounts]);
	
	const fetchAccounts = async () => {
		if (!currentWallet) {
			setError("No wallet available");
			return;
		}
		
		setLoading(true);
		setError(null);
		setAccounts(null);
		
		try {
			const requestBody = {
				webfix: "1.0",
				method: "getWalletInfo",
				params: ["gliesereum"],
				body: {
					address: currentWallet.address,
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
				setError("No accounts found for this wallet address");
				return;
			}
			
			setAccounts(data);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "An error occurred while fetching accounts",
			);
		} finally {
			setLoading(false);
		}
	};
	
	// Auto-fetch accounts when component mounts
	React.useEffect(() => {
		if (currentWallet) {
			fetchAccounts();
		}
	}, [currentWallet]);
	
	if (!currentWallet) {
		return (
			<Card className="bg-zinc-900/80 border-zinc-700/50">
				<CardContent className="p-6">
					<div className="text-center text-zinc-400">
						<div className="text-4xl mb-4">🔒</div>
						<h3 className="text-lg font-medium mb-2">No Wallet</h3>
						<p className="text-sm">
							Create or import a wallet to view accounts
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}
	
	return (
		<div className="space-y-6">
			{/* Header with refresh button */}
			<Card className="bg-zinc-900/80 border-zinc-700/50">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-500/10 rounded-lg">
								<Users className="h-5 w-5 text-blue-600"/>
							</div>
							<div>
								<CardTitle className="text-lg">Connected Accounts</CardTitle>
								<CardDescription>
									Account information and trading data
								</CardDescription>
							</div>
						</div>
						<Button
							onClick={fetchAccounts}
							disabled={loading}
							variant="outline"
							size="sm"
							className="bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50"
						>
							{loading
								? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2"/>
										Refreshing...
									</>
								)
								: (
									<>
										<Activity className="h-4 w-4 mr-2"/>
										Refresh
									</>
								)}
						</Button>
					</div>
				</CardHeader>
			</Card>
			
			{/* Error State */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4"/>
					<AlertDescription className="font-medium">{error}</AlertDescription>
				</Alert>
			)}
			
			{/* Loading State */}
			{loading && (
				<Card className="bg-zinc-900/80 border-zinc-700/50">
					<CardContent className="p-12">
						<div className="text-center">
							<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-500"/>
							<p className="text-zinc-400">Fetching account information...</p>
						</div>
					</CardContent>
				</Card>
			)}
			
			{/* Accounts Content */}
			{accounts && accounts.length > 0 && (
				<div className="space-y-6">
					{/* Portfolio Overview */}
					{totalStats && totalStats.accountsCount > 1 && (
						<Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
							<CardHeader className="pb-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-primary/20 rounded-lg">
										<Users className="h-5 w-5 text-primary"/>
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
										icon={<BarChart3 className="h-4 w-4 text-primary"/>}
									/>
									<MetricCard
										label="Total Balance"
										value={formatCurrency(totalStats.totalWalletBalance)}
										size="lg"
									/>
									<MetricCard
										label="Available"
										value={formatCurrency(totalStats.totalAvailableBalance)}
										size="md"
									/>
									<div className="space-y-1">
										<div className="flex items-center gap-1">
											{totalStats.totalPerpUPL >= 0
												? <TrendingUp className="h-4 w-4 text-emerald-600"/>
												: <TrendingDown className="h-4 w-4 text-red-500"/>}
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
								
								<Separator/>
								
								<div className="flex justify-between text-sm">
									<div className="flex items-center gap-2">
										<Users className="h-4 w-4 text-muted-foreground"/>
										<span className="text-muted-foreground">Accounts:</span>
										<span className="font-semibold text-primary">
                      {totalStats.accountsCount}
                    </span>
									</div>
									<div className="flex items-center gap-2">
										<Activity className="h-4 w-4 text-muted-foreground"/>
										<span className="text-muted-foreground">Positions:</span>
										<span className="font-semibold">
                      {totalStats.totalPositions}
                    </span>
									</div>
									<div className="flex items-center gap-2">
										<ShoppingCart className="h-4 w-4 text-muted-foreground"/>
										<span className="text-muted-foreground">Open Orders:</span>
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
									<Activity className="h-5 w-5 text-blue-600"/>
								</div>
								<div>
									<CardTitle className="text-lg">Account Details</CardTitle>
									<CardDescription>
										Individual account analysis and trading data
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue={accounts[0].nid} className="w-full">
								<TabsList
									className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 h-auto p-1 bg-muted/50">
									{accounts.map((account) => (
										<TabsTrigger
											key={account.nid}
											value={account.nid}
											className="flex items-center gap-2 px-3 py-3 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
										>
											<Wallet className="h-4 w-4 flex-shrink-0"/>
											<span className="truncate max-w-[120px]">
                        {account.nid}
                      </span>
											<Badge variant="outline" className="text-xs">
												{account.exchange.toUpperCase()}
											</Badge>
										</TabsTrigger>
									))}
								</TabsList>
								
								{accounts.map((account) => (
									<TabsContent
										key={account.nid}
										value={account.nid}
										className="mt-6"
									>
										<AccountCard walletData={account}/>
									</TabsContent>
								))}
							</Tabs>
						</CardContent>
					</Card>
				</div>
			)}
			
			{/* No Accounts State */}
			{accounts && accounts.length === 0 && !loading && (
				<Card className="bg-zinc-900/80 border-zinc-700/50">
					<CardContent className="p-12">
						<div className="text-center text-zinc-400">
							<div className="text-4xl mb-4">📭</div>
							<h3 className="text-lg font-medium mb-2">No Accounts Found</h3>
							<p className="text-sm">
								This wallet is not connected to any trading accounts
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
