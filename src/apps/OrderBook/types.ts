/**
 * TypeScript type definitions for OrderBook module
 */

export interface OrderBookDataRaw {
	key: string;
	value: {
		channel: string;
		module: string;
		widget: string;
		raw: {
			exchange: string;
			market: string;
			bids: [number, number][];
			asks: [number, number][];
			volume: [number, number];
			timestamp: number;
			latency: number;
		};
		timestamp: number;
	};
}

export interface OrderBookData {
	exchange: string;
	market: string;
	bids: [number, number][];
	asks: [number, number][];
	volume: [number, number];
	timestamp: number;
	latency: number;
}

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

export interface TickerData {
	exchange: string;
	market: string;
	last: number;
	bid?: number;
	ask?: number;
	change?: number;
	percentage?: number;
	baseVolume?: number;
	quoteVolume?: number;
	timestamp: number;
	latency: number;
}

export interface AggregatedOrderBook {
	market: string;
	exchanges: {
		[exchange: string]: {
			bids: [number, number][];
			asks: [number, number][];
			volume: [number, number];
			latency: number;
			bidLiquidity: number;
			askLiquidity: number;
			totalLiquidity: number;
		};
	};
	aggregatedBids: [number, number][];
	aggregatedAsks: [number, number][];
	totalBidLiquidity: number;
	totalAskLiquidity: number;
	dominantExchange: string;
	exchangeRanking: Array<{
		exchange: string;
		liquidity: number;
		percentage: number;
	}>;
}

export interface BookMetrics {
	imbalance: number;
	depthRatio: number;
	vwap: number;
	priceVelocity: number;
	volatility: number;
	largeOrders: number;
}

