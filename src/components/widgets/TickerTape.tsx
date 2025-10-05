// Types for safely parsing ticker data from session entries
import type {ReactElement} from "react";
import {ArrowDownRight, ArrowUpRight} from "lucide-react";

export interface SessionEntry {
	key: string;
	value: unknown;
}

interface TickerRaw {
	exchange: string;
	market: string;
	last: number;
	bid: number;
	ask: number;
	change: number;
	percentage: number;
	baseVolume: number;
	quoteVolume: number;
	timestamp: number;
	latency: number;
}

interface TickerValue {
	channel: string;
	module: string;
	widget: string;
	raw: TickerRaw;
	timestamp: number;
}

interface MappedTicker {
	id: string;
	exchange: string;
	symbol: string;
	last: number;
	bid: number;
	ask: number;
	change: number;
	percentage: number;
}

function isTickerValue(v: unknown): v is TickerValue {
	if (typeof v !== "object" || v === null) return false;
	const tv = v as Record<string, unknown>;
	const raw = tv.raw as Record<string, unknown> | undefined;
	return typeof tv.channel === "string" &&
		typeof tv.module === "string" &&
		typeof tv.widget === "string" &&
		typeof tv.timestamp === "number" &&
		!!raw &&
		typeof raw.exchange === "string" &&
		typeof raw.market === "string" &&
		typeof raw.last === "number" &&
		typeof raw.bid === "number" &&
		typeof raw.ask === "number" &&
		typeof raw.change === "number" &&
		typeof raw.percentage === "number";
}

function formatPrice(value: number): string {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value);
}

function formatPercent(value: number, precision = 2): string {
	return `${value >= 0 ? "+" : ""}${value.toFixed(precision)}%`;
}

function formatChangeAbs(value: number): string {
	const abs = Math.abs(value);
	const sign = value >= 0 ? "+" : "-";
	return `${sign}${
		new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(abs)
	}`;
}

function mapTickers(entries: SessionEntry[]): MappedTicker[] {
	const result: MappedTicker[] = [];
	for (const {key, value} of entries) {
		if (!isTickerValue(value)) continue;
		const raw = value.raw;
		result.push({
			id: key,
			exchange: raw.exchange,
			symbol: raw.market,
			last: raw.last,
			bid: raw.bid,
			ask: raw.ask,
			change: raw.change,
			percentage: raw.percentage,
		});
	}
	return result;
}

function TickerTape(
	{entries}: { entries: SessionEntry[] },
): ReactElement | null {
	const items = mapTickers(entries);
	if (items.length === 0) return null;
	
	return (
		<div
			aria-label="Live market ticker"
			className="w-full overflow-hidden bg-zinc-900/40"
		>
			<div className="flex border items-stretch gap-2 overflow-x-auto px-1 py-1 mb-2">
				{items.map((t) => {
					const positive = t.percentage > 0 ||
						(t.percentage === 0 && t.change > 0);
					const negative = t.percentage < 0 ||
						(t.percentage === 0 && t.change < 0);
					const priceColor = positive
						? "text-emerald-400"
						: negative
							? "text-red-400"
							: "text-zinc-200";
					const badgeBase = positive
						? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
						: negative
							? "border-red-500/30 bg-red-500/10 text-red-400"
							: "border-zinc-700 bg-zinc-800 text-zinc-300";
					
					return (
						<div
							key={t.id}
							className="bg-zinc-900 min-w-[240px] px-2 py-1 border border-dashed"
						>
							<div className="flex items-center justify-between">
								<div>
									<div className="text-xs text-amber-600">
										{t.exchange.toUpperCase()}
									</div>
									<div className="text-lg font-medium text-zinc-400">
										{t.symbol}
									</div>
								</div>
								<div className="text-right">
									<div className={`text-sm font-semibold ${priceColor}`}>
										<span className="font-mono">{formatPrice(t.last)}</span>
									</div>
									<div className="mt-1 flex items-center justify-end gap-1 text-xs">
										<div
											className={`flex items-center gap-1 rounded border px-1.5 py-0.5 ${badgeBase}`}
										>
											{positive
												? <ArrowUpRight className="h-3 w-3"/>
												: negative
													? <ArrowDownRight className="h-3 w-3"/>
													: null}
											<span className="font-mono">
												{formatPercent(t.percentage)}
											</span>
										</div>
										<div className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
											<span className="font-mono">
												{formatChangeAbs(t.change)}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}


export default TickerTape;