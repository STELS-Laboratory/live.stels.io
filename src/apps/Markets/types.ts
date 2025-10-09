/**
 * Type definitions for Markets component
 */

export interface CandleData {
	timestamp: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

export interface TickerData {
	key: string;
	value: {
		channel: string;
		module: string;
		widget: string;
		raw: {
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
		};
		timestamp: number;
	};
}

export interface CandleDataRaw {
	key: string;
	value: {
		channel: string;
		module: string;
		widget: string;
		raw: {
			exchange: string;
			market: string;
			timeframe: string;
			candles: number[][];
		};
	};
}

export interface FormattedTicker {
	exchange: string;
	symbol: string;
	market: string;
	price: number;
	change: number;
	percentage: number;
	volume: number;
	quoteVolume: number;
	bid: number;
	ask: number;
	latency: number;
	candles: CandleData[];
}

export interface ExchangeGroupData {
	exchange: string;
	markets: FormattedTicker[];
	totalMarkets: number;
	avgLatency: number;
}

