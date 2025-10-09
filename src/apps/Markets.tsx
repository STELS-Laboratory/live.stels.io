import React, { useMemo, useState } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import { filterSession } from "@/lib/utils.ts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table.tsx";
import {
	ExchangeGroup as ExchangeGroupComponent,
	MarketFilters,
} from "./Markets/components";
import type {
	CandleData,
	CandleDataRaw,
	ExchangeGroupData,
	FormattedTicker,
	TickerData,
} from "./Markets/types.ts";

/**
 * Markets component displaying live cryptocurrency spot data
 */
function Markets(): React.ReactElement {
	const session = useSessionStoreSync() as Record<string, unknown> | null;
	const spotTickers = filterSession(
		session || {},
		/\.spot\..*\.ticker$/,
	) as TickerData[];
	const spotCandles = filterSession(
		session || {},
		/\.spot\..*\.candles$/,
	) as CandleDataRaw[];

	// Filter states
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
	const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);

	const formattedTickers = useMemo(() => {
		return spotTickers.map((tickerItem) => {
			const raw = tickerItem.value.raw;
			const symbol = raw.market.split("/")[0];
			const baseSymbol = raw.market.split("/")[1].split(":")[0];

			// Find corresponding candles for the same exchange and market
			const candleData = spotCandles.find((candleItem) => {
				return candleItem.value.raw.exchange === raw.exchange &&
					candleItem.value.raw.market === raw.market;
			});

			const candles: CandleData[] = candleData
				? candleData.value.raw.candles.map((c: number[]) => ({
					timestamp: c[0],
					open: c[1],
					high: c[2],
					low: c[3],
					close: c[4],
					volume: c[5],
				}))
				: [];

			return {
				exchange: raw.exchange,
				symbol,
				market: `${symbol}/${baseSymbol}`,
				price: raw.last,
				change: raw.change || 0,
				percentage: raw.percentage || 0,
				volume: raw.baseVolume || 0,
				quoteVolume: raw.quoteVolume || 0,
				bid: raw.bid || 0,
				ask: raw.ask || 0,
				latency: raw.latency,
				candles,
			};
		});
	}, [spotTickers, spotCandles]);

	// Get unique exchanges and symbols for filters
	const availableExchanges = useMemo(() => {
		return Array.from(new Set(formattedTickers.map((t) => t.exchange))).sort();
	}, [formattedTickers]);

	const availableSymbols = useMemo(() => {
		return Array.from(new Set(formattedTickers.map((t) => t.symbol))).sort();
	}, [formattedTickers]);

	// Filtered tickers
	const filteredTickers = useMemo(() => {
		return formattedTickers.filter((ticker) => {
			// Search filter
			if (
				searchTerm &&
				!ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()) &&
				!ticker.market.toLowerCase().includes(searchTerm.toLowerCase())
			) {
				return false;
			}

			// Exchange filter
			if (
				selectedExchanges.length > 0 &&
				!selectedExchanges.includes(ticker.exchange)
			) {
				return false;
			}

			// Symbol filter
			if (
				selectedSymbols.length > 0 && !selectedSymbols.includes(ticker.symbol)
			) {
				return false;
			}

			return true;
		});
	}, [formattedTickers, searchTerm, selectedExchanges, selectedSymbols]);

	const exchangeGroups = useMemo((): ExchangeGroupData[] => {
		const groups = new Map<string, FormattedTicker[]>();

		filteredTickers.forEach((ticker) => {
			if (!groups.has(ticker.exchange)) {
				groups.set(ticker.exchange, []);
			}
			groups.get(ticker.exchange)!.push(ticker);
		});

		return Array.from(groups.entries()).map(([exchange, markets]) => ({
			exchange,
			markets: markets.sort((a, b) => b.price - a.price), // Sort by price descending
			totalMarkets: markets.length,
			avgLatency: markets.length > 0
				? markets.reduce((sum, m) => sum + m.latency, 0) / markets.length
				: 0,
		}));
	}, [filteredTickers]);

	// Filter functions
	const toggleExchange = (exchange: string): void => {
		setSelectedExchanges((prev) =>
			prev.includes(exchange)
				? prev.filter((e) => e !== exchange)
				: [...prev, exchange]
		);
	};

	const toggleSymbol = (symbol: string): void => {
		setSelectedSymbols((prev) =>
			prev.includes(symbol)
				? prev.filter((s) => s !== symbol)
				: [...prev, symbol]
		);
	};

	const clearFilters = (): void => {
		setSearchTerm("");
		setSelectedExchanges([]);
		setSelectedSymbols([]);
	};

	const hasActiveFilters = Boolean(
		searchTerm || selectedExchanges.length > 0 || selectedSymbols.length > 0,
	);

	return (
		<div className="container m-auto space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Spot Markets</span>
						<div className="text-sm font-normal text-muted-foreground">
							{exchangeGroups.length} exchanges • {filteredTickers.length}{" "}
							markets
						</div>
					</CardTitle>
					<CardDescription>
						Real-time cryptocurrency spot prices and market data from multiple
						exchanges
					</CardDescription>
				</CardHeader>

				{/* Filters */}
				<CardContent className="pt-0">
					<MarketFilters
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						selectedExchanges={selectedExchanges}
						selectedSymbols={selectedSymbols}
						availableExchanges={availableExchanges}
						availableSymbols={availableSymbols}
						toggleExchange={toggleExchange}
						toggleSymbol={toggleSymbol}
						clearFilters={clearFilters}
						hasActiveFilters={hasActiveFilters}
					/>
				</CardContent>

				<CardContent className="p-0">
					<div className="rounded-md border overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50">
									<TableHead className="w-[200px]">Exchange & Market</TableHead>
									<TableHead className="w-[120px]">Chart</TableHead>
									<TableHead className="text-right w-[120px]">Price</TableHead>
									<TableHead className="text-right w-[120px]">
										24h Change
									</TableHead>
									<TableHead className="text-right w-[100px]">Volume</TableHead>
									<TableHead className="text-right w-[120px]">
										Bid/Ask
									</TableHead>
									<TableHead className="text-right w-[80px]">Latency</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{exchangeGroups.map((group) => (
									<ExchangeGroupComponent
										key={group.exchange}
										group={group}
									/>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default Markets;
