/**
 * Type definitions for Scanner component
 */

export interface CoinInfo {
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

export interface RawPosition {
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

export interface PositionData {
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

export interface OrderInfo {
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

export interface OrderData {
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

export interface WalletData {
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

export interface Protocol {
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

export interface WalletResponse {
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

export interface NetworkConnectionData {
	channel: string;
	module: string;
	widget: string;
	raw: {
		network: string;
		totalClients: number;
		anonymousClients: number;
		authenticatedClients: number;
		sessionCount: number;
		maxConnectionsPerSession: number;
		streamingActive: boolean;
		dataTransmissionInterval: number;
		heartbeatInterval: number;
		cleanupRunning: boolean;
		timestamp: number;
	};
	timestamp: number;
}

export interface WelcomeSessionData {
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

/**
 * Component props
 */
export interface AccountOverviewProps {
	walletData: WalletResponse;
}

export interface AssetBalancesProps {
	coins: CoinInfo[];
}

export interface AccountCardProps {
	walletData: WalletResponse;
}
