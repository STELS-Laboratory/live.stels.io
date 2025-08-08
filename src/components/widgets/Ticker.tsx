import { memo, useMemo } from "react";
import type { ReactElement } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn, parseTradingPair } from "@/lib/utils";

interface RawTicker {
	exchange: string;
	market: string;
	last: number;
	bid: number;
	ask: number;
	change: number; // absolute change from previous close
	percentage: number; // change percent
	baseVolume: number; // in base currency
	quoteVolume: number; // in quote currency
	timestamp: number; // ms
	latency: number; // ms
}

interface TickerProps {
	raw: unknown;
	compact?: boolean;
	className?: string;
}

function formatCompactNumber(value: number): string {
	const abs = Math.abs(value);
	if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
	if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
	if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
	return value.toFixed(2);
}

function formatPrice(value: number, quoteSymbol: string): string {
	const isUsdQuote = ["USD", "USDT", "USDC"].includes(
		quoteSymbol.toUpperCase(),
	);
	return isUsdQuote
		? value.toFixed(2)
		: value.toFixed(8).replace(/0+$/u, "").replace(/\.$/u, ".0");
}

function toTime(valueMs: number): string {
	try {
		const d = new Date(valueMs);
		return d.toLocaleTimeString([], { hour12: false });
	} catch {
		return "-";
	}
}

/**
 * Bloomberg-style market ticker tile.
 * Displays instrument, last price, change, bid/ask, volumes, and timing.
 */
function TickerComponent(
	{ raw, compact = false, className }: TickerProps,
): ReactElement {
	const parsed: RawTicker | null = useMemo((): RawTicker | null => {
		if (!raw || typeof raw !== "object") return null;
		const r = raw as Record<string, unknown>;
		const getNum = (
			k: string,
		): number => (typeof r[k] === "number" ? (r[k] as number) : 0);
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
			timestamp: typeof r.timestamp === "number"
				? (r.timestamp as number)
				: Date.now(),
			latency: typeof r.latency === "number" ? (r.latency as number) : 0,
		} satisfies RawTicker;
	}, [raw]);

	const pair = useMemo(
		() => (parsed?.market
			? parseTradingPair(parsed.market.replace(":", "/"))
			: null),
		[parsed],
	);
	const base = pair?.base ?? "";
	const quote = pair?.quote ?? "";

	const spread = useMemo(() => {
		if (!parsed) return 0;
		const s = parsed.ask - parsed.bid;
		return s > 0 ? s : 0;
	}, [parsed]);

	const spreadPct = useMemo(() => {
		if (!parsed || parsed.last === 0) return 0;
		return (spread / parsed.last) * 100;
	}, [parsed, spread]);

	const isUp = (parsed?.percentage ?? 0) >= 0;
	const baseBg = "bg-[#0b0b0c]";
	const frameBorder = "border-zinc-800/60";
	const headerBorderAccent = "border-zinc-800/60";
	const priceSize = compact ? "text-4xl" : "text-5xl";
	const pillClass = isUp
		? "bg-green-600/20 text-green-400 border-green-600/40"
		: "bg-red-600/20 text-red-400 border-red-600/40";

	return (
		<Card
			className={cn(
				"w-[520px] rounded-xl shadow-xl border",
				baseBg,
				frameBorder,
				className,
			)}
		>
			<CardHeader className={cn("border-b pb-3", headerBorderAccent)}>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<CardTitle className="text-sm flex items-center gap-2">
							<div className="h-4 w-1 bg-amber-500 rounded" />
							<span className="inline-flex items-center gap-2">
								<span className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-[1px] font-semibold tracking-wider text-amber-400 uppercase">
									{base}
									{quote ? `/${quote}` : ""}
								</span>
								{parsed?.exchange && (
									<span className="rounded-sm border border-zinc-700 bg-zinc-900 px-2 py-[1px] text-[10px] uppercase text-zinc-400">
										{parsed.exchange}
									</span>
								)}
								<span className="rounded-sm border border-green-600/40 bg-green-600/20 px-1.5 py-[1px] text-[10px] font-medium text-green-400">
									RT
								</span>
							</span>
						</CardTitle>
						<CardDescription className="mt-1 text-[11px]">
							<span className="capitalize">{parsed?.exchange ?? ""}</span>
							<span className="mx-2 text-zinc-600">|</span>
							<span className="text-zinc-500">{parsed?.latency ?? 0}ms</span>
							<span className="mx-2 text-zinc-600">|</span>
							<span className="text-zinc-500">
								{toTime(parsed?.timestamp ?? 0)}
							</span>
						</CardDescription>
					</div>

					<div className="text-right">
						<div
							className={cn(
								"font-mono font-semibold leading-none tracking-tight text-zinc-100",
								priceSize,
							)}
							aria-live="polite"
							aria-label={parsed
								? `Last price ${formatPrice(parsed.last, quote || "USD")}`
								: "No price"}
						>
							{parsed ? formatPrice(parsed.last, quote || "USD") : "-"}
						</div>
						<div className="mt-1 flex items-center justify-end gap-1">
							<span
								className={cn(
									"inline-flex items-center gap-1 rounded-md border px-2 py-[2px] text-[11px] font-medium",
									pillClass,
								)}
								aria-label={parsed
									? `Change ${parsed.percentage.toFixed(2)} percent`
									: "No change"}
							>
								{isUp
									? <TrendingUp className="h-3 w-3" aria-hidden />
									: <TrendingDown className="h-3 w-3" aria-hidden />}
								<span>
									{parsed
										? `${parsed.percentage >= 0 ? "+" : ""}${
											parsed.percentage.toFixed(2)
										}%`
										: "-"}
								</span>
								<span className="text-zinc-600">/</span>
								<span>
									{parsed
										? `${parsed.change >= 0 ? "+" : ""}${
											formatPrice(parsed.change, quote || "USD")
										}`
										: "-"}
								</span>
							</span>
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className={cn("pt-3", compact ? "py-2" : "")}>
				<div
					className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-3")}
				>
					<div className="flex items-baseline justify-between">
						<span className="text-[11px] text-zinc-500">Bid</span>
						<span className="font-mono text-sm text-zinc-200">
							{parsed ? formatPrice(parsed.bid, quote || "USD") : "-"}
						</span>
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-[11px] text-zinc-500">Ask</span>
						<span className="font-mono text-sm text-zinc-200">
							{parsed ? formatPrice(parsed.ask, quote || "USD") : "-"}
						</span>
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-[11px] text-zinc-500">Spread</span>
						<span className="font-mono text-sm text-zinc-200">
							{parsed
								? `${formatPrice(spread, quote || "USD")} (${
									spreadPct.toFixed(3)
								}%)`
								: "-"}
						</span>
					</div>
				</div>

				<Separator className="my-3 bg-zinc-800/60" />

				<div
					className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-3")}
				>
					<div className="flex items-center justify-between">
						<span className="text-[11px] text-zinc-500">Base Vol</span>
						<span className="font-mono text-sm text-zinc-300">
							{parsed ? formatCompactNumber(parsed.baseVolume) : "-"}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-[11px] text-zinc-500">Quote Vol</span>
						<span className="font-mono text-sm text-zinc-300">
							{parsed ? formatCompactNumber(parsed.quoteVolume) : "-"}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-[11px] text-zinc-500">Status</span>
						<Badge
							variant="secondary"
							className="bg-zinc-900/60 text-zinc-300 border-zinc-800"
						>
							Live
						</Badge>
					</div>
				</div>

				<div
					className={cn(
						"mt-3 h-[3px] w-full rounded-sm",
						isUp ? "bg-green-600/60" : "bg-red-600/60",
					)}
					aria-hidden
				/>
			</CardContent>
		</Card>
	);
}

const Ticker = memo(TickerComponent);
export default Ticker;
