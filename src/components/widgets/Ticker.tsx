"use client"

import type {ReactElement} from "react"
import {memo, useMemo} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Separator} from "@/components/ui/separator"
import {Badge} from "@/components/ui/badge"
import {TrendingDown, TrendingUp} from "lucide-react"
import {cn, parseTradingPair} from "@/lib/utils"

interface RawTicker {
	exchange: string
	market: string
	last: number
	bid: number
	ask: number
	change: number // absolute change from previous close
	percentage: number // change percent
	baseVolume: number // in base currency
	quoteVolume: number // in quote currency
	timestamp: number // ms
	latency: number // ms
}

interface TickerProps {
	raw: unknown
	compact?: boolean
	className?: string
}

function formatCompactNumber(value: number): string {
	const abs = Math.abs(value)
	if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
	if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
	if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`
	return value.toFixed(2)
}

function formatPrice(value: number, quoteSymbol: string): string {
	const isUsdQuote = ["USD", "USDT", "USDC"].includes(quoteSymbol.toUpperCase())
	return isUsdQuote ? value.toFixed(2) : value.toFixed(8).replace(/0+$/u, "").replace(/\.$/u, ".0")
}

function toTime(valueMs: number): string {
	try {
		const d = new Date(valueMs)
		return d.toLocaleTimeString([], {hour12: false})
	} catch {
		return "-"
	}
}

/**
 * Bloomberg-style market ticker tile.
 * Displays instrument, last price, change, bid/ask, volumes, and timing.
 */
function TickerComponent({raw, compact = false, className}: TickerProps): ReactElement {
	const parsed: RawTicker | null = useMemo((): RawTicker | null => {
		if (!raw || typeof raw !== "object") return null
		const r = raw as Record<string, unknown>
		const getNum = (k: string): number => (typeof r[k] === "number" ? (r[k] as number) : 0)
		return {
			exchange: typeof r.exchange === "string" ? r.exchange : "",
			market: typeof r.market === "string" ? r.market : "",
			last: getNum("last"),
			bid: getNum("bid"),
			ask: getNum("ask"),
			change: getNum("change"),
			percentage: getNum("percentage"),
			baseVolume: getNum("baseVolume"),
			quoteVolume: getNum("quoteVolume"),
			timestamp: typeof r.timestamp === "number" ? (r.timestamp as number) : Date.now(),
			latency: typeof r.latency === "number" ? (r.latency as number) : 0,
		} satisfies RawTicker
	}, [raw])
	
	const pair = useMemo(() => (parsed?.market ? parseTradingPair(parsed.market.replace(":", "/")) : null), [parsed])
	const base = pair?.base ?? ""
	const quote = pair?.quote ?? ""
	
	const spread = useMemo(() => {
		if (!parsed) return 0
		const s = parsed.ask - parsed.bid
		return s > 0 ? s : 0
	}, [parsed])
	
	const spreadPct = useMemo(() => {
		if (!parsed || parsed.last === 0) return 0
		return (spread / parsed.last) * 100
	}, [parsed, spread])
	
	const isUp = (parsed?.percentage ?? 0) >= 0
	const baseBg = isUp
		? "bg-gradient-to-br from-green-950/90 via-green-900/80 to-green-950/90 border-green-500/30"
		: "bg-gradient-to-br from-red-950/90 via-red-900/80 to-red-950/90 border-red-500/30"
	
	const frameBorder = isUp ? "border-green-500/40" : "border-red-500/40"
	const headerBorderAccent = isUp ? "border-green-500/30" : "border-red-500/30"
	
	const priceSize = compact ? "text-4xl" : "text-5xl"
	const priceColor = isUp ? "text-green-100" : "text-red-100"
	
	const pillClass = isUp
		? "bg-green-500/25 text-green-200 border-green-400/50 shadow-green-500/20 shadow-sm"
		: "bg-red-500/25 text-red-200 border-red-400/50 shadow-red-500/20 shadow-sm"
	
	return (
		<Card
			className={cn(
				"w-[520px] rounded-xl shadow-2xl border-2 transition-all duration-300",
				baseBg,
				frameBorder,
				isUp ? "shadow-green-500/10" : "shadow-red-500/10",
				className,
			)}
		>
			<CardHeader className={cn("border-b pb-3", headerBorderAccent)}>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<CardTitle className="text-sm flex items-center gap-2">
							<div className={cn("h-4 w-1 rounded", isUp ? "bg-green-400" : "bg-red-400")}/>
							<span className="inline-flex items-center gap-2">
                <span
	                className={cn(
		                "rounded-sm border px-2 py-[1px] font-semibold tracking-wider uppercase transition-colors",
		                isUp
			                ? "border-green-400/50 bg-green-400/15 text-green-200"
			                : "border-red-400/50 bg-red-400/15 text-red-200",
	                )}
                >
                  {base}
	                {quote ? `/${quote}` : ""}
                </span>
								{parsed?.exchange && (
									<span
										className="rounded-sm border border-muted/60 bg-muted/60 px-2 py-[1px] text-[10px] uppercase text-card-foreground">
                    {parsed.exchange}
                  </span>
								)}
								<span
									className="rounded-sm border border-green-500/50 bg-green-500/20 px-1.5 py-[1px] text-[10px] font-medium text-green-300">
                  RT
                </span>
              </span>
						</CardTitle>
						<CardDescription className="mt-1 text-[11px]">
							<span className="capitalize text-card-foreground">{parsed?.exchange ?? ""}</span>
							<span className="mx-2 text-muted-foreground">|</span>
							<span className="text-muted-foreground">{parsed?.latency ?? 0}ms</span>
							<span className="mx-2 text-muted-foreground">|</span>
							<span className="text-muted-foreground">{toTime(parsed?.timestamp ?? 0)}</span>
						</CardDescription>
					</div>
					
					<div className="text-right">
						<div
							className={cn("font-mono font-bold leading-none tracking-tight drop-shadow-sm", priceSize, priceColor)}
							aria-live="polite"
							aria-label={parsed ? `Last price ${formatPrice(parsed.last, quote || "USD")}` : "No price"}
						>
							{parsed ? formatPrice(parsed.last, quote || "USD") : "-"}
						</div>
						<div className="mt-1 flex items-center justify-end gap-1">
              <span
	              className={cn(
		              "inline-flex items-center gap-1 rounded-md border px-2 py-[2px] text-[11px] font-semibold backdrop-blur-sm",
		              pillClass,
	              )}
	              aria-label={parsed ? `Change ${parsed.percentage.toFixed(2)} percent` : "No change"}
              >
                {isUp ? (
	                <TrendingUp className="h-3 w-3" aria-hidden/>
                ) : (
	                <TrendingDown className="h-3 w-3" aria-hidden/>
                )}
	              <span>{parsed ? `${parsed.percentage >= 0 ? "+" : ""}${parsed.percentage.toFixed(2)}%` : "-"}</span>
                <span className="text-muted-foreground">/</span>
                <span>
                  {parsed ? `${parsed.change >= 0 ? "+" : ""}${formatPrice(parsed.change, quote || "USD")}` : "-"}
                </span>
              </span>
						</div>
					</div>
				</div>
			</CardHeader>
			
			<CardContent className={cn("pt-3", compact ? "py-2" : "")}>
				<div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-3")}>
					<div className="flex items-baseline justify-between">
						<span className="text-[11px] text-muted-foreground">Bid</span>
						<span className="font-mono text-sm text-foreground font-medium">
              {parsed ? formatPrice(parsed.bid, quote || "USD") : "-"}
            </span>
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-[11px] text-muted-foreground">Ask</span>
						<span className="font-mono text-sm text-foreground font-medium">
              {parsed ? formatPrice(parsed.ask, quote || "USD") : "-"}
            </span>
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-[11px] text-muted-foreground">Spread</span>
						<span className="font-mono text-sm text-foreground font-medium">
              {parsed ? `${formatPrice(spread, quote || "USD")} (${spreadPct.toFixed(3)}%)` : "-"}
            </span>
					</div>
				</div>
				
				<Separator className={cn("my-3", isUp ? "bg-green-500/30" : "bg-red-500/30")}/>
				
				<div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-3")}>
					<div className="flex items-center justify-between">
						<span className="text-[11px] text-muted-foreground">Base Vol</span>
						<span className="font-mono text-sm text-card-foreground font-medium">
              {parsed ? formatCompactNumber(parsed.baseVolume) : "-"}
            </span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-[11px] text-muted-foreground">Quote Vol</span>
						<span className="font-mono text-sm text-card-foreground font-medium">
              {parsed ? formatCompactNumber(parsed.quoteVolume) : "-"}
            </span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-[11px] text-muted-foreground">Status</span>
						<Badge variant="secondary" className="bg-muted/60 text-card-foreground border-muted/60 font-medium">
							Live
						</Badge>
					</div>
				</div>
				
				<div
					className={cn(
						"mt-3 h-[4px] w-full rounded-sm transition-all duration-300",
						isUp
							? "bg-gradient-to-r from-green-600/80 via-green-500/90 to-green-600/80 shadow-green-500/30 shadow-sm"
							: "bg-gradient-to-r from-red-600/80 via-red-500/90 to-red-600/80 shadow-red-500/30 shadow-sm",
					)}
					aria-hidden
				/>
			</CardContent>
		</Card>
	)
}

const Ticker = memo(TickerComponent)
export default Ticker
