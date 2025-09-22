import {useEffect, useMemo, useRef, useState} from "react"
import {ArrowDownUp, BarChart3, Clock, RefreshCcw, Scale, TrendingDown, TrendingUp, Zap} from "lucide-react"
import {Badge} from "@/components/ui/badge.tsx"
import {AnimatePresence, motion} from "framer-motion"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {parseTradingPair} from "@/lib/utils.ts";

interface OrderBookData {
	exchange: string
	market: string
	bids: [number, number][]
	asks: [number, number][]
	volume: number[]
	timestamp: number
	latency: number
}

interface BookMetrics {
	imbalance: number
	depthRatio: number
	vwap: number
	priceVelocity: number
	volatility: number
	largeOrders: number
}

interface LargeOrder {
	price: number
	volume: number
	value: number
	index: number
}

interface CumulativeVolume {
	bids: { price: number; volume: number; cumulative: number }[]
	asks: { price: number; volume: number; cumulative: number }[]
	maxCumulative: number
}

interface AnimatedRow {
	id: string
	price: number
	volume: number
	side: "bid" | "ask"
	isNew: boolean
	isUpdated: boolean
}

export default function OrderBook({book}: { book: OrderBookData }) {
	const [prevBook, setPrevBook] = useState<OrderBookData | null>(null)
	const [metrics, setMetrics] = useState<BookMetrics>({
		imbalance: 0,
		depthRatio: 0,
		vwap: 0,
		priceVelocity: 0,
		volatility: 0,
		largeOrders: 0,
	})
	const [largeBids, setLargeBids] = useState<LargeOrder[]>([])
	const [largeAsks, setLargeAsks] = useState<LargeOrder[]>([])
	const [cumulativeVolume] = useState<CumulativeVolume>({
		bids: [],
		asks: [],
		maxCumulative: 0,
	})
	const [showScales, setShowScales] = useState(true)
	const [currentTime, setCurrentTime] = useState(new Date().getTime())
	
	// Add new states for enhanced UX
	const [viewMode, setViewMode] = useState<"standard" | "depth">("standard")
	const [animatedRows, setAnimatedRows] = useState<AnimatedRow[]>([])
	const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
	const bookRef = useRef<HTMLDivElement>(null)
	
	// Add effect for data update animation
	useEffect(() => {
		if (!prevBook) {
			setPrevBook(book)
			return
		}
		
		// Update last update timestamp
		setLastUpdate(Date.now())
		
		// Create animated rows for new or updated data
		const newAnimatedRows: AnimatedRow[] = []
		
		// Process bids
		book.bids.forEach((bid, index) => {
			const prevBid = prevBook.bids[index]
			const isNew = !prevBid
			const isUpdated = prevBid && (prevBid[0] !== bid[0] || prevBid[1] !== bid[1])
			
			if (isNew || isUpdated) {
				newAnimatedRows.push({
					id: `bid-${index}-${bid[0]}-${Date.now()}`,
					price: bid[0],
					volume: bid[1],
					side: "bid",
					isNew,
					isUpdated,
				})
			}
		})
		
		// Process asks
		book.asks.forEach((ask, index) => {
			const prevAsk = prevBook.asks[index]
			const isNew = !prevAsk
			const isUpdated = prevAsk && (prevAsk[0] !== ask[0] || prevAsk[1] !== ask[1])
			
			if (isNew || isUpdated) {
				newAnimatedRows.push({
					id: `ask-${index}-${ask[0]}-${Date.now()}`,
					price: ask[0],
					volume: ask[1],
					side: "ask",
					isNew,
					isUpdated,
				})
			}
		})
		
		setAnimatedRows(newAnimatedRows)
		
		// Clear animated rows after 1 second
		const timer = setTimeout(() => {
			setAnimatedRows([])
		}, 1000)
		
		return () => clearTimeout(timer)
	}, [book])
	
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date().getTime())
		}, 1000)
		
		return () => clearInterval(timer)
	}, [])
	
	// Calculate max volumes for depth visualization
	const maxBidVolume = Math.max(...book.bids.map((bid) => bid[1]))
	const maxAskVolume = Math.max(...book.asks.map((ask) => ask[1]))
	
	// Calculate spread
	const highestBid = book.bids.length > 9 ? book.bids[9][0] : 0
	const lowestAsk = book.asks.length > 9 ? book.asks[9][0] : 0
	const spread = lowestAsk - highestBid
	const spreadPercentage = (spread / highestBid) * 100
	
	// Format timestamp
	const formattedTime = new Date(book.timestamp).toLocaleTimeString()
	
	// Calculate time since last update
	const timeSinceUpdate = useMemo(() => {
		const seconds = Math.floor((Date.now() - lastUpdate) / 1000)
		return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`
	}, [currentTime, lastUpdate])
	
	const {base, quote} = parseTradingPair(book.market) as any
	
	const largeOrderThreshold = maxBidVolume * 0.4
	
	// Find large orders and calculate their values
	useEffect(() => {
		// Find large bids
		const newLargeBids = book.bids
			.map((bid, index) => ({
				price: bid[0],
				volume: bid[1],
				value: bid[0] * bid[1],
				index,
			}))
			.filter((order) => order.volume > largeOrderThreshold)
		
		// Find large asks
		const newLargeAsks = book.asks
			.map((ask, index) => ({
				price: ask[0],
				volume: ask[1],
				value: ask[0] * ask[1],
				index,
			}))
			.filter((order) => order.volume > largeOrderThreshold)
		
		setLargeBids(newLargeBids)
		setLargeAsks(newLargeAsks)
	}, [book, largeOrderThreshold])
	
	// Calculate metrics when book changes
	useEffect(() => {
		if (!prevBook) {
			setPrevBook(book)
			return
		}
		
		// Calculate total volumes
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const bidVolume = book.bids.reduce((sum, [_, vol]) => sum + vol, 0)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const askVolume = book.asks.reduce((sum, [_, vol]) => sum + vol, 0)
		
		// Volume imbalance (positive = more bids, negative = more asks)
		const imbalance = (bidVolume - askVolume) / (bidVolume + askVolume)
		
		// Depth ratio (liquidity comparison)
		const depthRatio = bidVolume / askVolume
		
		// VWAP calculation
		const bidVwap = book.bids.reduce((sum, [price, vol]) => sum + price * vol, 0) / bidVolume
		const askVwap = book.asks.reduce((sum, [price, vol]) => sum + price * vol, 0) / askVolume
		const vwap = (bidVwap + askVwap) / 2
		
		// Ensure current bids and asks have at least 9 elements before accessing [8][0]
		const currentBidPrice = book.bids.length > 9 ? book.bids[9][0] : 0
		const currentAskPrice = book.asks.length > 9 ? book.asks[9][0] : 0
		const midPrice = (currentBidPrice + currentAskPrice) / 2
		const prevBidPrice = prevBook.bids.length > 9 ? prevBook.bids[9][0] : 0
		const prevAskPrice = prevBook.asks.length > 9 ? (prevBook.asks.length > 9 ? prevBook.asks[9][0] : 0) : 0
		const prevMidPrice = (prevBidPrice + prevAskPrice) / 2
		const timeDiff = (book.timestamp - prevBook.timestamp) / 1000 // in seconds
		const priceVelocity = timeDiff > 0 ? (midPrice - prevMidPrice) / timeDiff : 0
		
		// Volatility (standard deviation of recent prices)
		const volatility = (Math.abs(midPrice - prevMidPrice) / prevMidPrice) * 100
		
		// Large orders detection (count orders above threshold)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const largeOrders = [...book.bids, ...book.asks].filter(([_, vol]) => vol > largeOrderThreshold).length
		
		setMetrics({
			imbalance,
			depthRatio,
			vwap,
			priceVelocity,
			volatility,
			largeOrders,
		})
		
		setPrevBook(book)
	}, [book])
	
	// Format currency value with K/M/B suffixes
	const formatCurrency = (value: number): string => {
		if (value >= 1000000000) {
			return `${(value / 1000000000).toFixed(1)}B`
		} else if (value >= 1000000) {
			return `${(value / 1000000).toFixed(1)}M`
		} else if (value >= 1000) {
			return `${(value / 1000).toFixed(1)}K`
		} else {
			return `${value.toFixed(0)}`
		}
	}
	
	// Format volume with K/M/B suffixes
	const formatVolume = (value: number): string => {
		if (value >= 1000000000) {
			return `${(value / 1000000000).toFixed(1)}B`
		} else if (value >= 1000000) {
			return `${(value / 1000000).toFixed(1)}M`
		} else if (value >= 1000) {
			return `${(value / 1000).toFixed(1)}K`
		} else {
			return `${value.toFixed(1)}`
		}
	}
	
	// Calculate spread between this large order and the next closest one
	const getSpreadInfo = (orders: LargeOrder[], currentIndex: number): string | null => {
		if (orders.length < 2) return null
		
		// Sort by price
		const sortedOrders = [...orders].sort((a, b) => a.price - b.price)
		const currentOrderIndex = sortedOrders.findIndex((order) => order.index === currentIndex)
		
		if (currentOrderIndex === -1) return null
		
		// Check if there's a next order
		if (currentOrderIndex < sortedOrders.length - 1) {
			const nextOrder = sortedOrders[currentOrderIndex + 1]
			const spreadValue = nextOrder.price - sortedOrders[currentOrderIndex].price
			return `${spreadValue.toFixed(1)}`
		}
		
		// Check if there's a previous order
		if (currentOrderIndex > 0) {
			const prevOrder = sortedOrders[currentOrderIndex - 1]
			const spreadValue = sortedOrders[currentOrderIndex].price - prevOrder.price
			return `${spreadValue.toFixed(1)}`
		}
		
		return null
	}
	
	// Calculate market dominance percentages for the balance indicator
	const getMarketDominance = () => {
		// Convert imbalance (-1 to 1) to buyer/seller percentages
		// When imbalance is 0 (balanced), both should be 50%
		// When imbalance is 1 (full buyer dominance), buyers=100%, sellers=0%
		// When imbalance is -1 (full seller dominance), buyers=0%, sellers=100%
		const buyerPercentage = ((metrics.imbalance + 1) / 2) * 100
		const sellerPercentage = 100 - buyerPercentage
		
		return {
			buyers: buyerPercentage,
			sellers: sellerPercentage,
		}
	}
	
	// Function to scroll to the center of the order book
	const scrollToCenter = () => {
		if (bookRef.current) {
			const container = bookRef.current
			container.scrollTo({
				top: container.scrollHeight / 2 - container.clientHeight / 2,
				behavior: "smooth",
			})
		}
	}
	
	// Function to determine animation color
	const getAnimationColor = (side: "bid" | "ask", isNew: any) => {
		if (side === "bid") {
			return isNew ? "bg-green-400/30" : "bg-green-300/20"
		} else {
			return isNew ? "bg-red-400/30" : "bg-red-300/20"
		}
	}
	
	const dominance = getMarketDominance()
	
	return (
		<motion.div
			initial={{opacity: 0.9, y: 10}}
			animate={{opacity: 1, y: 0}}
			transition={{duration: 0.2}}
			className="w-[520px] bg-gradient-to-b from-zinc-900 to-black rounded-xl border border-zinc-800/50 shadow-xl overflow-hidden backdrop-blur-sm"
		>
			<header className="border-b border-zinc-800/50 p-4 bg-black/40">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-sm flex items-center gap-2">
							<div className="h-4 w-1 bg-amber-500 rounded-full"></div>
							<span className="text-amber-500 font-medium tracking-widest uppercase">{book.market}</span>
							<Badge variant="outline" className="text-[10px] font-normal h-5 px-2 bg-zinc-900/80 border-zinc-800">
								{book.exchange}
							</Badge>
						</h2>
						<div className="flex items-center gap-2 text-[10px] text-zinc-600 mt-1">
							<Clock className="h-3 w-3"/>
							<span>{formattedTime}</span>
							<span>|</span>
							<span className="flex items-center">
                <Zap className="h-3 w-3 mr-1 text-amber-500"/>
								{book.latency}ms
              </span>
							<span>|</span>
							<span className="text-zinc-500">{timeSinceUpdate}</span>
						</div>
					</div>
					<div className="text-right text-[10px]">
						<div className="text-zinc-600 uppercase tracking-wider">VOLUME</div>
						<div className="font-mono text-zinc-300 mt-1">
							{book.volume[0].toFixed(2)} {base} / {book.volume[1].toFixed(2)} {base}
						</div>
					</div>
				</div>
			</header>
			
			{/* Technical Metrics */}
			<div className="grid grid-cols-3 gap-2 border-b border-zinc-800/50 p-4 bg-zinc-900/30">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.div
								whileHover={{scale: 1.01}}
								className="bg-black/30 p-2 rounded-lg border border-zinc-800/50 cursor-help"
							>
								<div className="text-[10px] text-zinc-600 uppercase tracking-wider">IMBALANCE</div>
								<div className="font-mono flex items-center mt-1">
									{metrics.imbalance > 0 ? (
										<TrendingUp className="h-3 w-3 text-green-500 mr-1"/>
									) : (
										<TrendingDown className="h-3 w-3 text-red-500 mr-1"/>
									)}
									<span className={metrics.imbalance > 0 ? "text-green-500" : "text-red-500"}>
                    {Math.abs(metrics.imbalance * 100).toFixed(2)}%
                  </span>
								</div>
							</motion.div>
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-xs">Difference between buy and sell volume</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.div
								whileHover={{scale: 1.01}}
								className="bg-black/30 p-2 rounded-lg border border-zinc-800/50 cursor-help"
							>
								<div className="text-[10px] text-zinc-600 uppercase tracking-wider">DEPTH RATIO</div>
								<div className="font-mono text-zinc-300 mt-1">{metrics.depthRatio.toFixed(2)}</div>
							</motion.div>
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-xs">Ratio of buy volume to sell volume</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.div
								whileHover={{scale: 1.01}}
								className="bg-black/30 p-2 rounded-lg border border-zinc-800/50 cursor-help"
							>
								<div className="text-[10px] text-zinc-600 uppercase tracking-wider">VWAP</div>
								<div className="font-mono text-zinc-300 mt-1">{metrics.vwap.toFixed(2)}</div>
							</motion.div>
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-xs">Volume-weighted average price</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.div
								whileHover={{scale: 1.01}}
								className="bg-black/30 p-2 rounded-lg border border-zinc-800/50 cursor-help"
							>
								<div className="text-[10px] text-zinc-600 uppercase tracking-wider">VELOCITY</div>
								<div className="font-mono flex items-center mt-1">
									{metrics.priceVelocity > 0 ? (
										<TrendingUp className="h-3 w-3 text-green-500 mr-1"/>
									) : (
										<TrendingDown className="h-3 w-3 text-red-500 mr-1"/>
									)}
									<span className={metrics.priceVelocity > 0 ? "text-green-500" : "text-red-500"}>
                    {Math.abs(metrics.priceVelocity).toFixed(4)}
                  </span>
								</div>
							</motion.div>
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-xs">Rate of price change</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<motion.div
								whileHover={{scale: 1.01}}
								className="bg-black/30 p-2 rounded-lg border border-zinc-800/50 cursor-help"
							>
								<div className="text-[10px] text-zinc-600 uppercase tracking-wider">VOLATILITY</div>
								<div className="font-mono text-zinc-300 mt-1">{metrics.volatility.toFixed(2)}%</div>
							</motion.div>
						</TooltipTrigger>
						<TooltipContent>
							<p className="text-xs">Price volatility</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				
				<div className="bg-black/30 p-2 rounded-lg border border-zinc-800/50 flex flex-col justify-between">
					<div className="text-[10px] text-zinc-600 uppercase tracking-wider">CONTROLS</div>
					<div className="flex items-center justify-between gap-2">
						<button
							onClick={() => setViewMode(viewMode === "standard" ? "depth" : "standard")}
							className="text-zinc-500 hover:text-amber-500 transition-colors"
							title={viewMode === "standard" ? "Switch to depth view" : "Switch to standard view"}
						>
							<BarChart3 className="h-4 w-4"/>
						</button>
						<button
							onClick={scrollToCenter}
							className="text-zinc-500 hover:text-amber-500 transition-colors"
							title="Center view"
						>
							<RefreshCcw className="h-4 w-4"/>
						</button>
						<button
							onClick={() => setShowScales(!showScales)}
							className="text-zinc-500 hover:text-amber-500 transition-colors"
							title={showScales ? "Hide scales" : "Show scales"}
						>
							<Scale className="h-4 w-4"/>
						</button>
					</div>
				</div>
			</div>
			
			{/* Spread Information */}
			<motion.div
				className="flex items-center justify-center gap-2 py-3 border-b border-zinc-800/50 bg-black/40"
				whileHover={{backgroundColor: "rgba(0,0,0,0.6)"}}
			>
				<ArrowDownUp className="h-4 w-4 text-zinc-500"/>
				<span className="text-xs text-zinc-500 uppercase tracking-wider">SPREAD:</span>
				<span className="font-mono font-medium text-amber-500">
          {spread.toFixed(2)} {quote}
        </span>
				<span className="text-zinc-500">|</span>
				<span className="font-mono font-medium text-amber-500">{spreadPercentage.toFixed(4)}%</span>
			</motion.div>
			
			{/* Column Headers */}
			<div className="grid grid-cols-6 text-[10px] text-zinc-600 uppercase tracking-wider py-2 px-4 bg-zinc-900/30">
				<div className="text-left">AMOUNT</div>
				<div className="text-right col-span-2">PRICE</div>
				<div className="text-left col-span-2">PRICE</div>
				<div className="text-right">AMOUNT</div>
			</div>
			
			{/* Combined Bids and Asks */}
			<div
				ref={bookRef}
				className="px-2 py-1 bg-black/20 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
			>
				{Array.from({length: Math.max(book.bids.length, book.asks.length)}).map((_, index) => {
					// Find if this bid is a large order
					const isLargeBid = index < book.bids.length && book.bids[index][1] > largeOrderThreshold
					const bidValue = index < book.bids.length ? book.bids[index][0] * book.bids[index][1] : 0
					const bidSpread = isLargeBid ? getSpreadInfo(largeBids, index) : null
					
					// Find if this ask is a large order
					const isLargeAsk = index < book.asks.length && book.asks[index][1] > largeOrderThreshold
					const askValue = index < book.asks.length ? book.asks[index][0] * book.asks[index][1] : 0
					const askSpread = isLargeAsk ? getSpreadInfo(largeAsks, index) : null
					
					// Get cumulative volumes for scales
					const bidCumulative = index < cumulativeVolume.bids.length ? cumulativeVolume.bids[index].cumulative : 0
					const askCumulative = index < cumulativeVolume.asks.length ? cumulativeVolume.asks[index].cumulative : 0
					
					// Check if there's animation for this row
					const bidAnimation = animatedRows.find(
						(row) =>
							row.side === "bid" &&
							index < book.bids.length &&
							row.price === book.bids[index][0] &&
							row.volume === book.bids[index][1],
					) as any
					
					const askAnimation = animatedRows.find(
						(row) =>
							row.side === "ask" &&
							index < book.asks.length &&
							row.price === book.asks[index][0] &&
							row.volume === book.asks[index][1],
					) as any
					
					return (
						<motion.div
							key={`row-${index}`}
							className="grid grid-cols-6 h-6 items-center relative my-0.5"
							initial={{opacity: 0.8}}
							animate={{opacity: 1}}
							transition={{duration: 0.2}}
						>
							{/* Bid side */}
							{index < book.bids.length && (
								<>
									<div className="relative font-mono text-zinc-500 text-[9px] text-left pl-2 flex items-center z-10">
										{book.bids[index][1].toFixed(3)}
										{showScales && (
											<span className="ml-1 text-[7px] text-green-700">Σ{formatVolume(bidCumulative)}</span>
										)}
									</div>
									{isLargeBid ? (
										<div className="col-span-2 flex items-center justify-end z-10">
											<motion.div
												className="bg-zinc-900/80 border border-green-800/50 rounded-md px-2 mr-2 h-5 flex items-center"
												whileHover={{scale: 1.05}}
											>
												<span className="text-[7px] font-semibold text-pink-600 mr-1">W</span>
												<span className="text-[7px] text-green-400">{formatCurrency(bidValue)}</span>
												{bidSpread && <span className="text-[7px] text-green-500 ml-1">Δ{bidSpread}</span>}
											</motion.div>
											<div className="font-mono text-[11px] text-green-500 text-right">
												{book.bids[index][0].toFixed(2)}
											</div>
										</div>
									) : (
										<div className="col-span-2 font-mono text-[11px] text-green-500 text-right pr-2 z-10">
											{book.bids[index][0].toFixed(2)}
										</div>
									)}
									<motion.div
										className="absolute left-0 h-6 bg-green-500/10 rounded-r-sm"
										style={{
											width: `${(book.bids[index][1] / maxBidVolume) * 50}%`,
										}}
										initial={{width: 0}}
										animate={{width: `${(book.bids[index][1] / maxBidVolume) * 50}%`}}
										transition={{duration: 0.3}}
									/>
									{showScales && (
										<motion.div
											className="absolute left-0 h-1 bottom-0 bg-green-700/20 rounded"
											style={{
												width: `${(bidCumulative / cumulativeVolume.maxCumulative) * 50}%`,
											}}
											initial={{width: 0}}
											animate={{width: `${(bidCumulative / cumulativeVolume.maxCumulative) * 50}%`}}
											transition={{duration: 0.3}}
										/>
									)}
									
									{/* Animation for new or updated bids */}
									<AnimatePresence>
										{bidAnimation && (
											<motion.div
												key={bidAnimation.id}
												className={`absolute left-0 h-6 ${getAnimationColor("bid", bidAnimation.isNew)} rounded-r-sm opacity-10`}
												initial={{width: 0, opacity: 0.2}}
												animate={{width: "100%", opacity: 0}}
												exit={{opacity: 0}}
												transition={{duration: 0.6}}
											/>
										)}
									</AnimatePresence>
								</>
							)}
							{index >= book.bids.length && (
								<>
									<div></div>
									<div className="col-span-2"></div>
								</>
							)}
							
							{/* Ask side */}
							{index < book.asks.length && (
								<>
									{isLargeAsk ? (
										<div className="col-span-2 flex items-center z-10">
											<div className="font-mono text-[11px] text-red-500 text-left pl-2">
												{book.asks[index][0].toFixed(2)}
											</div>
											<motion.div
												className="bg-zinc-900/80 border border-red-800/50 rounded-md px-2 ml-2 h-5 flex items-center"
												whileHover={{scale: 1.05}}
											>
												<span className="text-[7px] font-semibold text-lime-600 mr-1">W</span>
												<span className="text-[7px] text-red-400">{formatCurrency(askValue)}</span>
												{askSpread && <span className="text-[7px] text-red-500 ml-1">Δ{askSpread}</span>}
											</motion.div>
										</div>
									) : (
										<div className="col-span-2 font-mono text-[11px] text-red-500 text-left pl-2 z-10">
											{book.asks[index][0].toFixed(2)}
										</div>
									)}
									<div
										className="relative font-mono text-zinc-500 text-[9px] text-right pr-2 flex items-center justify-end z-10">
										{showScales && <span className="mr-1 text-[7px] text-red-700">Σ{formatVolume(askCumulative)}</span>}
										{book.asks[index][1].toFixed(3)}
									</div>
									<motion.div
										className="absolute right-0 h-6 bg-red-500/10 rounded-l-sm"
										style={{
											width: `${(book.asks[index][1] / maxAskVolume) * 50}%`,
										}}
										initial={{width: 0}}
										animate={{width: `${(book.asks[index][1] / maxAskVolume) * 50}%`}}
										transition={{duration: 0.3}}
									/>
									{showScales && (
										<motion.div
											className="absolute right-0 h-1 bottom-0 bg-red-700/20 rounded"
											style={{
												width: `${(askCumulative / cumulativeVolume.maxCumulative) * 50}%`,
											}}
											initial={{width: 0}}
											animate={{width: `${(askCumulative / cumulativeVolume.maxCumulative) * 50}%`}}
											transition={{duration: 0.3}}
										/>
									)}
									
									{/* Animation for new or updated asks */}
									<AnimatePresence>
										{askAnimation && (
											<motion.div
												key={askAnimation.id}
												className={`absolute right-0 h-6 ${getAnimationColor("ask", askAnimation.isNew)} rounded-l-sm opacity-10`}
												initial={{width: 0, opacity: 0.2}}
												animate={{width: "100%", opacity: 0}}
												exit={{opacity: 0}}
												transition={{duration: 0.6}}
											/>
										)}
									</AnimatePresence>
								</>
							)}
							{index >= book.asks.length && (
								<>
									<div className="col-span-2"></div>
									<div></div>
								</>
							)}
						</motion.div>
					)
				})}
			</div>
			
			{/* Market Dominance Scale in Footer */}
			<div className="border-t border-zinc-800/50 p-4 bg-black/40">
				<div className="flex flex-col items-center">
					<div className="text-xs text-zinc-600 uppercase tracking-wider mb-2">MARKET DOMINANCE</div>
					<div className="w-full flex items-center justify-between mb-2">
						<div className="text-[10px] text-red-500 font-semibold">SELLERS {dominance.sellers.toFixed(1)}%</div>
						<div className="text-[10px] text-green-500 font-semibold">{dominance.buyers.toFixed(1)}% BUYERS</div>
					</div>
					<div className="w-full h-6 bg-zinc-900/80 rounded-full overflow-hidden relative border border-zinc-800/50">
						{/* Balance indicator */}
						<div className="absolute inset-0 flex">
							<motion.div
								className="h-full bg-gradient-to-r from-red-900/40 to-red-600/20 flex items-center justify-center"
								style={{width: `${dominance.sellers}%`}}
								initial={{width: "50%"}}
								animate={{width: `${dominance.sellers}%`}}
								transition={{duration: 0.5}}
							>
								{dominance.sellers >= 15 && (
									<span className="text-[10px] font-mono text-white px-1">{dominance.sellers.toFixed(1)}%</span>
								)}
							</motion.div>
							<motion.div
								className="h-full w-[2px] bg-white/70 z-10"
								animate={{
									boxShadow: [
										"0 0 3px rgba(255, 255, 255, 0.4)",
										"0 0 5px rgba(255, 255, 255, 0.2)",
										"0 0 3px rgba(255, 255, 255, 0.4)",
									],
								}}
								transition={{duration: 1.5, repeat: Number.POSITIVE_INFINITY}}
							/>
							<motion.div
								className="h-full bg-gradient-to-l from-green-900/40 to-green-600/20 flex items-center justify-center"
								style={{width: `${dominance.buyers}%`}}
								initial={{width: "50%"}}
								animate={{width: `${dominance.buyers}%`}}
								transition={{duration: 0.5}}
							>
								{dominance.buyers >= 15 && (
									<span className="text-[10px] font-mono text-white px-1">{dominance.buyers.toFixed(1)}%</span>
								)}
							</motion.div>
						</div>
					</div>
					
					{/* Update indicator */}
					<div className="w-full flex justify-center mt-2">
						<div className="flex items-center gap-1 text-[10px] text-zinc-500">
							<span>LAST UPDATE:</span>
							<span className="font-mono">{timeSinceUpdate}</span>
							<motion.div
								className="w-2 h-2 rounded-full bg-amber-500/70"
								initial={{opacity: 0.3}}
								animate={{opacity: 0.7}}
								transition={{duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse"}}
							/>
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	)
}
