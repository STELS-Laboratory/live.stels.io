// --- Типы для протокола и аккаунта ---
export type ProtocolData = {
	maxRiskPerTrade: number
	strategy: string
	maxLeverage: number
	markets: string[]
	maxDrawdown: number
	stopLoss: number
	takeProfit: number
	riskRewardRatio: number
	tradingStyle: string
	positionSizing: string
	portfolioAllocation: number
	slippageTolerance: number
	orderTypes: string[]
	timeframes: string[]
	marketConditions: string[]
	hedgingEnabled: boolean
	scalingEnabled: boolean
	trailingStopEnabled: boolean
	dynamicPositionSizing: boolean
}

export interface AccountRequest {
	id?: string
	nid: string
	connection: boolean
	exchange: string
	note: string
	apiKey: string
	secret: string
	workers?: string[]
	status: "active" | "learn" | "stopped"
	password?: string
	protocol?: ProtocolData
	viewers?: string[]
}

/**
 * Новый тип запроса: подписанный пакет + открытый ключ и адрес
 */
export interface SignedAccountRequest {
	account: AccountRequest
	publicKey: string
	signature: string
	address: string
}
