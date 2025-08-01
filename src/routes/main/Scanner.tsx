import type React from "react"
import {useState, useMemo} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Alert, AlertDescription} from "@/components/ui/alert"
import {Badge} from "@/components/ui/badge"
import {Separator} from "@/components/ui/separator"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {
	Loader2,
	Wallet,
	DollarSign,
	Activity,
	TrendingUp,
	TrendingDown,
	AlertCircle,
	Clock,
	CheckCircle,
	XCircle,
	ShoppingCart,
	Users
} from "lucide-react"
import Screen from "@/routes/main/Screen"
import Header from "@/components/main/Header"

// Типы для данных
interface CoinInfo {
	coin: string
	walletBalance: string
	equity: string
	usdValue: string
	unrealisedPnl: string
	locked: string
	borrowAmount: string
	accruedInterest: string
	cumRealisedPnl: string
}

interface RawPosition {
	info: {
		symbol: string
		leverage: string
		avgPrice: string
		liqPrice: string
		positionValue: string
		unrealisedPnl: string
		markPrice: string
		side: string
		size: string
		cumRealisedPnl: string
	}
	symbol: string
	timestamp: number
	datetime: string
	entryPrice: number
	notional: number
	leverage: number
	unrealizedPnl: number
	contracts: number
	liquidationPrice: number
	markPrice: number
	side: string
}

interface PositionData {
	key: string[]
	value: {
		raw: {
			positions: RawPosition[]
			timestamp: number
			datetime: string
		}
		timestamp: number
	}
}

interface OrderInfo {
	info: any
	id: string
	clientOrderId?: string
	timestamp: number
	datetime: string
	symbol: string
	type: string
	side: string
	price: number
	amount: number
	cost: number
	filled: number
	remaining: number
	status: string
	fee: {
		cost: number
		currency: string
	}
}

interface OrderData {
	key: string[]
	value: {
		raw: {
			orders: {
				[symbol: string]: {
					open: OrderInfo[]
					closed: OrderInfo[]
					canceled: OrderInfo[]
				}
			}
			timestamp: number
			datetime: string
		}
		timestamp: number
	}
}

interface WalletData {
	info: {
		result: {
			list: Array<{
				totalEquity: string
				totalWalletBalance: string
				totalAvailableBalance: string
				totalPerpUPL: string
				totalMaintenanceMargin: string
				totalInitialMargin: string
				accountIMRate: string
				accountMMRate: string
				accountLTV: string
				coin: CoinInfo[]
			}>
		}
	}
}

interface Protocol {
	strategy: string
	tradingStyle: string
	maxRiskPerTrade: number
	maxLeverage: number
	maxDrawdown: number
	stopLoss: number
	takeProfit: number
	riskRewardRatio: number
	positionSizing: string
	portfolioAllocation: number
	slippageTolerance: number
	markets: string[]
	orderTypes: string[]
	timeframes: string[]
	marketConditions: string[]
	hedgingEnabled: boolean
	scalingEnabled: boolean
	trailingStopEnabled: boolean
	dynamicPositionSizing: boolean
}

interface WalletResponse {
	nid: string
	address: string
	exchange: string
	wallet: WalletData
	positions?: PositionData[]
	orders?: {
		spot: OrderData[]
		futures: OrderData[]
	}
	protocol?: Protocol
	connection: boolean
	note?: string
	viewers?: string[]
	workers?: string[]
}

// Функции форматирования
const formatCurrency = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value
	if (isNaN(num)) return "$0.00"
	
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	}).format(num)
}

const formatNumber = (value: string | number, decimals = 8) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value
	if (isNaN(num)) return "0"
	
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: decimals,
	}).format(num)
}

const formatPercentage = (value: string | number) => {
	const num = typeof value === "string" ? Number.parseFloat(value) : value
	if (isNaN(num)) return "0%"
	
	return `${(num * 100).toFixed(2)}%`
}

const formatDate = (timestamp: number | string) => {
	const date = new Date(typeof timestamp === "string" ? Number.parseInt(timestamp) : timestamp)
	return date.toLocaleString("ru-RU", {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	})
}

// Компонент для отображения одного аккаунта
function AccountCard({walletData}: { walletData: WalletResponse }) {
	// Получаем позиции для данного аккаунта
	const positions = useMemo(() => {
		const allPositions: RawPosition[] = []
		walletData.positions?.forEach(positionData => {
			allPositions.push(...(positionData.value.raw.positions || []))
		})
		return allPositions
	}, [walletData.positions])
	
	// Получаем ордера для данного аккаунта
	const allOrders = useMemo(() => {
		const orders = {
			open: [] as OrderInfo[],
			closed: [] as OrderInfo[],
			canceled: [] as OrderInfo[]
		}
		
		const combineOrders = (orderData: any) => {
			Object.values(orderData).forEach((symbolOrders: any) => {
				orders.open.push(...(symbolOrders.open || []))
				orders.closed.push(...(symbolOrders.closed || []))
				orders.canceled.push(...(symbolOrders.canceled || []))
			})
		}
		
		walletData.orders?.spot?.forEach(spotData => {
			combineOrders(spotData.value.raw.orders)
		})
		
		walletData.orders?.futures?.forEach(futuresData => {
			combineOrders(futuresData.value.raw.orders)
		})
		
		return orders
	}, [walletData.orders])
	
	return (
		<div className="space-y-6">
			{/* Account Overview */}
			<Card className="border-2">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<DollarSign className="h-5 w-5"/>
							<CardTitle>Обзор аккаунта {walletData.nid}</CardTitle>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant={walletData.connection ? "default" : "destructive"}>
								{walletData.connection ? "Подключен" : "Отключен"}
							</Badge>
							<Badge variant="outline">{walletData.exchange.toUpperCase()}</Badge>
						</div>
					</div>
					{walletData.note && (
						<CardDescription>{walletData.note}</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Общий капитал</p>
							<p className="text-3xl">
								{formatCurrency(walletData.wallet.info.result.list[0].totalEquity)}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Баланс кошелька</p>
							<p className="text-2xl">
								{formatCurrency(walletData.wallet.info.result.list[0].totalWalletBalance)}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Доступно</p>
							<p className="text-2xl">
								{formatCurrency(walletData.wallet.info.result.list[0].totalAvailableBalance || "0")}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Нереализованная P&L</p>
							<div className="flex items-center gap-2">
								{Number.parseFloat(walletData.wallet.info.result.list[0].totalPerpUPL) >= 0 ? (
									<TrendingUp className="h-4 w-4 text-green-600"/>
								) : (
									<TrendingDown className="h-4 w-4 text-red-600"/>
								)}
								<p className={`text-2xl ${
									Number.parseFloat(walletData.wallet.info.result.list[0].totalPerpUPL) >= 0
										? "text-green-600"
										: "text-red-600"
								}`}>
									{formatCurrency(walletData.wallet.info.result.list[0].totalPerpUPL)}
								</p>
							</div>
						</div>
					</div>
					
					<Separator className="my-6"/>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
						<div className="space-y-1">
							<p className="text-muted-foreground">Адрес кошелька</p>
							<code className="bg-muted px-3 py-1 rounded text-xs break-all">
								{walletData.address}
							</code>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Начальная маржа</p>
							<p className="font-medium">
								{formatCurrency(walletData.wallet.info.result.list[0].totalInitialMargin || "0")}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Поддерживающая маржа</p>
							<p className="font-medium">
								{formatCurrency(walletData.wallet.info.result.list[0].totalMaintenanceMargin || "0")}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground">Уровень маржи</p>
							<p className="font-medium">
								{formatPercentage(walletData.wallet.info.result.list[0].accountLTV || "0")}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
			
			{/* Coin Balances */}
			<Card>
				<CardHeader>
					<CardTitle>Балансы по активам</CardTitle>
					<CardDescription>Детальная информация по каждой монете в портфеле</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{walletData.wallet.info.result.list[0].coin.map((coin: CoinInfo, index: number) => (
							<Card key={index} className="relative">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-3">
										<h3 className="text-lg font-semibold">{coin.coin}</h3>
										<div className="flex items-center gap-2">
											{Number.parseFloat(coin.locked) > 0 && (
												<Badge variant="secondary" className="text-xs">
													Заблокировано
												</Badge>
											)}
											<Badge variant={Number.parseFloat(coin.equity) > 0 ? "default" : "secondary"}>
												{Number.parseFloat(coin.equity) > 0 ? "Активен" : "Неактивен"}
											</Badge>
										</div>
									</div>
									
									<div className="space-y-3">
										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">Баланс</span>
											<span className="font-medium">
												{formatNumber(coin.walletBalance)} {coin.coin}
											</span>
										</div>
										
										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">Капитал</span>
											<span className="font-medium">
												{formatNumber(coin.equity)} {coin.coin}
											</span>
										</div>
										
										<div className="flex justify-between">
											<span className="text-sm text-muted-foreground">USD стоимость</span>
											<span className="font-medium text-green-600">
												{formatCurrency(coin.usdValue)}
											</span>
										</div>
										
										{Number.parseFloat(coin.unrealisedPnl) !== 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">Нереализ. P&L</span>
												<span className={`font-medium ${
													Number.parseFloat(coin.unrealisedPnl) >= 0 ? "text-green-600" : "text-red-600"
												}`}>
													{formatCurrency(coin.unrealisedPnl)}
												</span>
											</div>
										)}
										
										{Number.parseFloat(coin.borrowAmount) > 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">Заем</span>
												<span className="font-medium text-orange-600">
													{formatNumber(coin.borrowAmount)} {coin.coin}
												</span>
											</div>
										)}
										
										{Number.parseFloat(coin.cumRealisedPnl) !== 0 && (
											<div className="flex justify-between">
												<span className="text-sm text-muted-foreground">Реализованная P&L</span>
												<span className={`font-medium ${
													Number.parseFloat(coin.cumRealisedPnl) >= 0 ? "text-green-600" : "text-red-600"
												}`}>
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
							<Activity className="h-5 w-5"/>
							Открытые позиции
						</CardTitle>
						<CardDescription>Текущие торговые позиции и их результативность</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{positions.map((position: RawPosition, index: number) => (
								<Card key={index} className="border-l-4 border-l-primary">
									<CardContent className="p-4">
										<div className="flex items-center justify-between mb-4">
											<div className="flex items-center gap-3">
												<h3 className="text-lg font-semibold">{position.symbol}</h3>
												<Badge variant={position.side.toLowerCase() === "sell" ? "destructive" : "default"}>
													{position.side.toLowerCase() === "sell" ? "SHORT" : "LONG"}
												</Badge>
												<Badge variant="outline">
													x{position.leverage}
												</Badge>
											</div>
											<div className="flex items-center gap-2">
												{Number.parseFloat(position.unrealizedPnl.toString()) >= 0 ? (
													<TrendingUp className="h-4 w-4 text-green-600"/>
												) : (
													<TrendingDown className="h-4 w-4 text-red-600"/>
												)}
												<span className={`text-lg font-semibold ${
													Number.parseFloat(position.unrealizedPnl.toString()) >= 0 ? "text-green-600" : "text-red-600"
												}`}>
													{formatCurrency(position.unrealizedPnl)}
												</span>
											</div>
										</div>
										
										<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
											<div>
												<p className="text-muted-foreground">Размер</p>
												<p className="font-medium">{formatNumber(position.contracts, 4)}</p>
											</div>
											<div>
												<p className="text-muted-foreground">Цена входа</p>
												<p className="font-medium">{formatCurrency(position.entryPrice)}</p>
											</div>
											<div>
												<p className="text-muted-foreground">Текущая цена</p>
												<p className="font-medium">{formatCurrency(position.markPrice)}</p>
											</div>
											<div>
												<p className="text-muted-foreground">Стоимость</p>
												<p className="font-medium">{formatCurrency(position.notional)}</p>
											</div>
											<div>
												<p className="text-muted-foreground">Ликвидация</p>
												<p className="font-medium text-red-600">{formatCurrency(position.liquidationPrice)}</p>
											</div>
											<div>
												<p className="text-muted-foreground">ROI</p>
												<p className={`font-medium ${
													((position.markPrice - position.entryPrice) / position.entryPrice * 100 * (position.side.toLowerCase() === "sell" ? -1 : 1)) >= 0
														? "text-green-600"
														: "text-red-600"
												}`}>
													{((position.markPrice - position.entryPrice) / position.entryPrice * 100 * (position.side.toLowerCase() === "sell" ? -1 : 1)).toFixed(2)}%
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
			{(allOrders.open.length > 0 || allOrders.closed.length > 0 || allOrders.canceled.length > 0) && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ShoppingCart className="h-5 w-5"/>
							Ордера
						</CardTitle>
						<CardDescription>История торговых ордеров</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="open" className="w-full">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="open" className="flex items-center gap-2">
									<Clock className="h-4 w-4"/>
									Открытые ({allOrders.open.length})
								</TabsTrigger>
								<TabsTrigger value="closed" className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4"/>
									Исполненные ({allOrders.closed.length})
								</TabsTrigger>
								<TabsTrigger value="canceled" className="flex items-center gap-2">
									<XCircle className="h-4 w-4"/>
									Отмененные ({allOrders.canceled.length})
								</TabsTrigger>
							</TabsList>
							
							<TabsContent value="open" className="space-y-4">
								{allOrders.open.length === 0 ? (
									<p className="text-center text-muted-foreground py-8">Нет открытых ордеров</p>
								) : (
									allOrders.open.map((order: OrderInfo, index: number) => (
										<Card key={index}>
											<CardContent className="p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-3">
														<h4 className="font-semibold">{order.symbol}</h4>
														<Badge variant={order.side === "sell" ? "destructive" : "default"}>
															{order.side.toUpperCase()}
														</Badge>
														<Badge variant="outline">{order.type.toUpperCase()}</Badge>
													</div>
													<Badge variant="secondary">
														{order.status}
													</Badge>
												</div>
												<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
													<div>
														<p className="text-muted-foreground">Цена</p>
														<p className="font-medium">{formatCurrency(order.price)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Количество</p>
														<p className="font-medium">{formatNumber(order.amount, 4)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Исполнено</p>
														<p className="font-medium">{formatNumber(order.filled, 4)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Остаток</p>
														<p className="font-medium">{formatNumber(order.remaining, 4)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Стоимость</p>
														<p className="font-medium">{formatCurrency(order.cost)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Время</p>
														<p className="font-medium">{formatDate(order.timestamp)}</p>
													</div>
												</div>
											</CardContent>
										</Card>
									))
								)}
							</TabsContent>
							
							<TabsContent value="closed" className="space-y-4">
								{allOrders.closed.length === 0 ? (
									<p className="text-center text-muted-foreground py-8">Нет исполненных ордеров</p>
								) : (
									allOrders.closed.map((order: OrderInfo, index: number) => (
										<Card key={index}>
											<CardContent className="p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-3">
														<h4 className="font-semibold">{order.symbol}</h4>
														<Badge variant={order.side === "sell" ? "destructive" : "default"}>
															{order.side.toUpperCase()}
														</Badge>
														<Badge variant="outline">{order.type.toUpperCase()}</Badge>
													</div>
													<Badge variant="default">
														{order.status}
													</Badge>
												</div>
												<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
													<div>
														<p className="text-muted-foreground">Цена</p>
														<p className="font-medium">{formatCurrency(order.price)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Количество</p>
														<p className="font-medium">{formatNumber(order.amount, 4)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Исполнено</p>
														<p className="font-medium">{formatNumber(order.filled, 4)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Стоимость</p>
														<p className="font-medium">{formatCurrency(order.cost)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Комиссия</p>
														<p className="font-medium">{formatCurrency(order.fee.cost)} {order.fee.currency}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Время</p>
														<p className="font-medium">{formatDate(order.timestamp)}</p>
													</div>
												</div>
											</CardContent>
										</Card>
									))
								)}
							</TabsContent>
							
							<TabsContent value="canceled" className="space-y-4">
								{allOrders.canceled.length === 0 ? (
									<p className="text-center text-muted-foreground py-8">Нет отмененных ордеров</p>
								) : (
									allOrders.canceled.map((order: OrderInfo, index: number) => (
										<Card key={index}>
											<CardContent className="p-4">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center gap-3">
														<h4 className="font-semibold">{order.symbol}</h4>
														<Badge variant={order.side === "sell" ? "destructive" : "default"}>
															{order.side.toUpperCase()}
														</Badge>
														<Badge variant="outline">{order.type.toUpperCase()}</Badge>
													</div>
													<Badge variant="destructive">
														{order.status}
													</Badge>
												</div>
												<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
													<div>
														<p className="text-muted-foreground">Цена</p>
														<p className="font-medium">{formatCurrency(order.price)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Количество</p>
														<p className="font-medium">{formatNumber(order.amount, 4)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">Время создания</p>
														<p className="font-medium">{formatDate(order.timestamp)}</p>
													</div>
													<div>
														<p className="text-muted-foreground">ID ордера</p>
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
						<CardTitle>Торговый протокол</CardTitle>
						<CardDescription>Настройки стратегии и управления рисками</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Стратегия</p>
								<p className="font-medium">{walletData.protocol.strategy}</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Стиль торговли</p>
								<p className="font-medium">{walletData.protocol.tradingStyle}</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Макс. риск на сделку</p>
								<p className="font-medium text-orange-600">{walletData.protocol.maxRiskPerTrade}%</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Макс. плечо</p>
								<p className="font-medium">x{walletData.protocol.maxLeverage}</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Макс. просадка</p>
								<p className="font-medium text-red-600">{walletData.protocol.maxDrawdown}%</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Стоп-лосс</p>
								<p className="font-medium">{walletData.protocol.stopLoss}%</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Тейк-профит</p>
								<p className="font-medium">{walletData.protocol.takeProfit}%</p>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Риск/Прибыль</p>
								<p className="font-medium">1:{walletData.protocol.riskRewardRatio}</p>
							</div>
						</div>
						
						<Separator className="my-6"/>
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Торгуемые рынки</p>
								<div className="flex flex-wrap gap-2">
									{walletData.protocol.markets.map((market, index) => (
										<Badge key={index} variant="outline">{market}</Badge>
									))}
								</div>
							</div>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">Типы ордеров</p>
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
	)
}

export default function WalletWidget() {
	const [address, setAddress] = useState("ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv")
	const [loading, setLoading] = useState(false)
	const [response, setResponse] = useState<WalletResponse[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!address.trim()) {
			setError("Пожалуйста, введите адрес кошелька")
			return
		}
		
		setLoading(true)
		setError(null)
		setResponse(null)
		
		try {
			const requestBody = {
				webfix: "1.0",
				method: "getWalletInfo",
				params: ["gliesereum"],
				body: {
					address: address.trim(),
				},
			}
			
			const res = await fetch("http://10.0.0.238:8088", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			})
			
			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`)
			}
			
			const data = await res.json()
			setResponse(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Произошла ошибка при выполнении запроса")
		} finally {
			setLoading(false)
		}
	}
	
	// Вычисляем общую статистику по всем аккаунтам
	const totalStats = useMemo(() => {
		if (!response) return null
		
		let totalEquity = 0
		let totalWalletBalance = 0
		let totalAvailableBalance = 0
		let totalPerpUPL = 0
		let totalPositions = 0
		let totalOpenOrders = 0
		
		response.forEach(account => {
			totalEquity += Number.parseFloat(account.wallet.info.result.list[0].totalEquity)
			totalWalletBalance += Number.parseFloat(account.wallet.info.result.list[0].totalWalletBalance)
			totalAvailableBalance += Number.parseFloat(account.wallet.info.result.list[0].totalAvailableBalance || "0")
			totalPerpUPL += Number.parseFloat(account.wallet.info.result.list[0].totalPerpUPL)
			
			// Подсчитываем позиции
			account.positions?.forEach(positionData => {
				totalPositions += positionData.value.raw.positions.length
			})
			
			// Подсчитываем открытые ордера
			account.orders?.spot?.forEach(spotData => {
				Object.values(spotData.value.raw.orders).forEach((symbolOrders: any) => {
					totalOpenOrders += symbolOrders.open?.length || 0
				})
			})
			account.orders?.futures?.forEach(futuresData => {
				Object.values(futuresData.value.raw.orders).forEach((symbolOrders: any) => {
					totalOpenOrders += symbolOrders.open?.length || 0
				})
			})
		})
		
		return {
			totalEquity,
			totalWalletBalance,
			totalAvailableBalance,
			totalPerpUPL,
			totalPositions,
			totalOpenOrders,
			accountsCount: response.length
		}
	}, [response])
	
	return (
		<Screen>
			<Header title="Анализатор кошелька" description="Получите полную информацию о торговых аккаунтах и позициях"/>
			
			{/* Search Form */}
			<Card className="border-2">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Wallet className="h-5 w-5"/>
						Проверка кошелька
					</CardTitle>
					<CardDescription>
						Введите адрес кошелька для получения детальной информации об аккаунте
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="address">Адрес кошелька</Label>
							<div className="flex gap-2">
								<Input
									id="address"
									type="text"
									placeholder="Введите адрес кошелька (например: gqPWhyKqd7GGozJUvZupc82Eoi9AJGvy4V)"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									disabled={loading}
									className="flex-1"
								/>
								<Button type="submit" disabled={loading || !address.trim()}>
									{loading ? (
										<Loader2 className="h-4 w-4 animate-spin"/>
									) : (
										"Анализировать"
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
					<AlertCircle className="h-4 w-4"/>
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
									<Users className="h-5 w-5"/>
									Общая статистика ({totalStats.accountsCount} аккаунтов)
								</CardTitle>
								<CardDescription>Суммарная информация по всем аккаунтам</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">Общий капитал</p>
										<p className="text-3xl">
											{formatCurrency(totalStats.totalEquity)}
										</p>
									</div>
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">Общий баланс</p>
										<p className="text-2xl">
											{formatCurrency(totalStats.totalWalletBalance)}
										</p>
									</div>
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">Доступно</p>
										<p className="text-2xl">
											{formatCurrency(totalStats.totalAvailableBalance)}
										</p>
									</div>
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">Общая нереализ. P&L</p>
										<div className="flex items-center gap-2">
											{totalStats.totalPerpUPL >= 0 ? (
												<TrendingUp className="h-4 w-4 text-green-600"/>
											) : (
												<TrendingDown className="h-4 w-4 text-red-600"/>
											)}
											<p className={`text-2xl ${
												totalStats.totalPerpUPL >= 0 ? "text-green-600" : "text-red-600"
											}`}>
												{formatCurrency(totalStats.totalPerpUPL)}
											</p>
										</div>
									</div>
								</div>
								
								<Separator className="my-6"/>
								
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
									<div className="space-y-1">
										<p className="text-muted-foreground">Количество аккаунтов</p>
										<p className="font-medium">{totalStats.accountsCount}</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground">Общее количество позиций</p>
										<p className="font-medium">{totalStats.totalPositions}</p>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground">Открытых ордеров</p>
										<p className="font-medium">{totalStats.totalOpenOrders}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
					
					{/* Account Tabs */}
					<Card>
						<CardHeader>
							<CardTitle>Аккаунты</CardTitle>
							<CardDescription>Детальная информация по каждому аккаунту</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue={response[0].nid} className="w-full">
								<TabsList className="grid w-full grid-cols-2">
									{response.map((account) => (
										<TabsTrigger key={account.nid} value={account.nid} className="flex items-center gap-2">
											<Wallet className="h-4 w-4"/>
											{account.nid} ({account.exchange.toUpperCase()})
										</TabsTrigger>
									))}
								</TabsList>
								
								{response.map((account) => (
									<TabsContent key={account.nid} value={account.nid}>
										<AccountCard walletData={account}/>
									</TabsContent>
								))}
							</Tabs>
						</CardContent>
					</Card>
				</div>
			)}
		</Screen>
	)
}