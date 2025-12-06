/**
 * Web Worker for parsing large data structures
 * Offloads heavy parsing operations from main thread
 */

export interface ParseMessage {
	id: string;
	type: "parse" | "parseBatch";
	data: unknown;
	channels?: string[];
	dataArray?: unknown[];
	options?: {
		type?: "orderBook" | "ticker" | "accountBalance" | "candles" | "index" | "auto";
		symbol?: string;
	};
}

export interface ParseResponse {
	id: string;
	type: "success" | "error";
	result?: unknown;
	error?: string;
}

/**
 * Parse order book data
 */
function parseOrderBook(data: unknown): unknown {
	try {
		const raw = (data as { raw?: unknown }).raw as {
			bids?: number[][];
			asks?: number[][];
			timestamp?: number;
		} | undefined;

		if (!raw || !raw.bids || !raw.asks) {
			return null;
		}

		const bids = raw.bids.slice(0, 20).map(([price, amount]) => ({
			price: Number(price) || 0,
			amount: Number(amount) || 0,
		}));

		const asks = raw.asks.slice(0, 20).map(([price, amount]) => ({
			price: Number(price) || 0,
			amount: Number(amount) || 0,
		}));

		return {
			bids,
			asks,
			timestamp: raw.timestamp || Date.now(),
			datetime: new Date(raw.timestamp || Date.now()).toISOString(),
		};
	} catch {
		return null;
	}
}

/**
 * Parse ticker data
 */
function parseTicker(data: unknown, symbol: string): unknown {
	try {
		const raw = (data as { raw?: unknown }).raw as {
			exchange?: string;
			market?: string;
			last?: number;
			bid?: number;
			ask?: number;
			change?: number;
			percentage?: number;
			baseVolume?: number;
			quoteVolume?: number;
			timestamp?: number;
		} | undefined;

		if (!raw || raw.last === undefined) {
			return null;
		}

		return {
			symbol: raw.market || symbol,
			bid: raw.bid || raw.last,
			ask: raw.ask || raw.last,
			last: raw.last,
			high: raw.last,
			low: raw.last,
			vwap: raw.last,
			open: raw.last,
			close: raw.last,
			change: raw.change || 0,
			percentage: raw.percentage || 0,
			average: raw.last,
			baseVolume: raw.baseVolume || 0,
			quoteVolume: raw.quoteVolume || 0,
			timestamp: raw.timestamp || Date.now(),
			datetime: new Date(raw.timestamp || Date.now()).toISOString(),
		};
	} catch {
		return null;
	}
}

/**
 * Parse account balance data
 */
function parseAccountBalance(data: unknown): unknown {
	try {
		const raw = (data as { raw?: unknown }).raw as Record<string, unknown>;

		// Try direct format first
		const balances: Record<string, { free: number; used: number; total: number }> = {};

		// Check for direct balance format (BTC, ETH, etc.)
		const coinSymbols = ["BTC", "ETH", "USDT", "SOL", "BNB"];
		for (const symbol of coinSymbols) {
			const coinData = raw[symbol] as {
				free?: number;
				used?: number;
				total?: number;
			} | undefined;

			if (coinData) {
				balances[symbol] = {
					free: coinData.free || 0,
					used: coinData.used || 0,
					total: coinData.total || 0,
				};
			}
		}

		// If no direct balances found, try wallet format
		if (Object.keys(balances).length === 0) {
			const wallet = raw.wallet as {
				info?: {
					result?: {
						list?: Array<{
							coin?: string;
							walletBalance?: string | number;
							equity?: string | number;
							availableToWithdraw?: string | number;
							locked?: string | number;
						}>;
					};
				};
			} | undefined;

			if (wallet?.info?.result?.list) {
				for (const item of wallet.info.result.list) {
					if (item.coin) {
						balances[item.coin] = {
							free: Number(item.availableToWithdraw) || 0,
							used: Number(item.locked) || 0,
							total: Number(item.walletBalance) || Number(item.equity) || 0,
						};
					}
				}
			}
		}

		return Object.keys(balances).length > 0 ? { balances } : null;
	} catch {
		return null;
	}
}

/**
 * Parse candles data
 */
function parseCandles(data: unknown): unknown[] {
	try {
		const raw = (data as { raw?: unknown }).raw as {
			candles?: Array<[number, number, number, number, number, number]>;
		} | undefined;

		if (!raw?.candles || !Array.isArray(raw.candles)) {
			return [];
		}

		return raw.candles.map(([timestamp, open, high, low, close, volume]) => ({
			timestamp,
			open: Number(open) || 0,
			high: Number(high) || 0,
			low: Number(low) || 0,
			close: Number(close) || 0,
			volume: Number(volume) || 0,
			datetime: new Date(timestamp).toISOString(),
		}));
	} catch {
		return [];
	}
}

/**
 * Parse index data
 */
function parseIndexData(data: unknown): unknown {
	try {
		const raw = (data as { raw?: unknown }).raw as Record<string, unknown>;

		if (!raw || typeof raw !== "object") {
			return null;
		}

		return {
			index: raw.index as string,
			name: raw.name as string,
			value: Number(raw.value) || 0,
			change: Number(raw.change) || 0,
			percentage: Number(raw.percentage) || 0,
			timestamp: Number(raw.timestamp) || Date.now(),
		};
	} catch {
		return null;
	}
}

// Handle messages from main thread
self.addEventListener("message", (event: MessageEvent<ParseMessage>) => {
	const message = event.data;

	try {
		let result: unknown;

		switch (message.type) {
			case "parse": {
				const parserType = message.options?.type || "auto";
				const symbol = message.options?.symbol || "";

				// Use specified parser or auto-detect
				if (parserType === "orderBook" || (parserType === "auto" && (message.data as { raw?: { bids?: unknown; asks?: unknown } }).raw?.bids)) {
					result = parseOrderBook(message.data);
				} else if (parserType === "ticker" || (parserType === "auto" && (message.data as { raw?: { last?: unknown } }).raw?.last !== undefined)) {
					result = parseTicker(message.data, symbol);
				} else if (parserType === "accountBalance" || (parserType === "auto" && ((message.data as { raw?: { BTC?: unknown; ETH?: unknown } }).raw?.BTC || (message.data as { raw?: { wallet?: unknown } }).raw?.wallet))) {
					result = parseAccountBalance(message.data);
				} else if (parserType === "candles" || (parserType === "auto" && (message.data as { raw?: { candles?: unknown } }).raw?.candles)) {
					result = parseCandles(message.data);
				} else if (parserType === "index" || (parserType === "auto" && (message.data as { raw?: { index?: unknown } }).raw?.index)) {
					result = parseIndexData(message.data);
				} else {
					result = message.data;
				}
				break;
			}

			case "parseBatch": {
				// Parse multiple data items
				const results: Record<string, unknown> = {};
				if (message.channels && message.dataArray) {
					for (let i = 0; i < message.channels.length && i < message.dataArray.length; i++) {
						const channel = message.channels[i];
						const data = message.dataArray[i];
						
						// Auto-detect parser for each item
						if ((data as { raw?: { bids?: unknown; asks?: unknown } }).raw?.bids) {
							results[channel] = parseOrderBook(data);
						} else if ((data as { raw?: { last?: unknown } }).raw?.last !== undefined) {
							results[channel] = parseTicker(data, "");
						} else if ((data as { raw?: { BTC?: unknown; ETH?: unknown } }).raw?.BTC || (data as { raw?: { wallet?: unknown } }).raw?.wallet) {
							results[channel] = parseAccountBalance(data);
						} else if ((data as { raw?: { candles?: unknown } }).raw?.candles) {
							results[channel] = parseCandles(data);
						} else if ((data as { raw?: { index?: unknown } }).raw?.index) {
							results[channel] = parseIndexData(data);
						} else {
							results[channel] = data;
						}
					}
				}
				result = results;
				break;
			}

			default:
				throw new Error(`Unknown message type: ${message.type}`);
		}

		const response: ParseResponse = {
			id: message.id,
			type: "success",
			result,
		};

		self.postMessage(response);
	} catch (error) {
		const response: ParseResponse = {
			id: message.id,
			type: "error",
			error: error instanceof Error ? error.message : "Unknown error",
		};

		self.postMessage(response);
	}
});

