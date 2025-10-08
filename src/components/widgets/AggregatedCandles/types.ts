/**
 * TypeScript type definitions for AggregatedCandles widget
 */

export interface CandleData {
	timestamp: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	exchange: string;
	market: string;
}

export interface ExchangeData {
	exchange: string;
	candles: CandleData[];
	liquidity: number;
	color: string;
	dominance?: number;
	marketShare?: number;
}

export interface AggregatedCandlesProps {
	candlesData: CandleData[];
	orderBookData: Array<{
		exchange: string;
		market: string;
		bids: [number, number][];
		asks: [number, number][];
		volume: [number, number];
		timestamp: number;
		latency: number;
	}>;
	selectedMarket: string;
	height?: number;
}

