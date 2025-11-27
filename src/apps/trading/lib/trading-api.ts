/**
 * Trading API Service
 * Handles all WebFIX API calls for trading operations
 */

import type {
	AccountBalance,
	CreateOrderParams,
	OrderBook,
	Ticker,
	TradingOrder,
	TradingTrade,
} from "../types";

export class TradingApiService {
	private baseUrl: string;
	private session: string | null = null;

	constructor(baseUrl: string = "http://localhost:8000") {
		this.baseUrl = baseUrl;
	}

	/**
	 * Set session for authentication
	 */
	setSession(session: string | null): void {
		this.session = session;
	}

	/**
	 * Get headers for API requests
	 * Note: Some public endpoints (getOrderBook, getTicker, getBalance) may not
	 * require stels-session header. Warnings about missing session are expected
	 * for these public requests and can be safely ignored.
	 */
	private getHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};

		if (this.session) {
			headers["stels-session"] = this.session;
		}

		return headers;
	}

	/**
	 * Make WebFIX API request
	 */
	private async makeRequest<T>(
		method: string,
		body: unknown,
		networkId: string = "network-id",
	): Promise<T> {
		const requestBody = {
			webfix: "1.0",
			method,
			params: [networkId],
			body,
		};

		const response = await fetch(`${this.baseUrl}/`, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMessage =
				(errorData as { error?: string }).error ||
				`HTTP error! status: ${response.status}`;
			throw new Error(errorMessage);
		}

		const data = await response.json();

		if ((data as { success?: boolean }).success === false) {
			const errorMessage =
				(data as { error?: string }).error || "Unknown error";
			throw new Error(errorMessage);
		}

		return (data as { data: T }).data;
	}

	/**
	 * Create order
	 */
	async createOrder(params: CreateOrderParams): Promise<TradingOrder> {
		return this.makeRequest<TradingOrder>("createOrder", params);
	}

	/**
	 * Get order details
	 */
	async getOrder(
		nid: string,
		orderId: string,
		symbol?: string,
	): Promise<TradingOrder> {
		const result = await this.makeRequest<unknown>("getOrder", {
			nid,
			orderId,
			symbol,
		});
		return this.transformOrder(result as Record<string, unknown>);
	}

	/**
	 * Cancel order
	 */
	async cancelOrder(
		nid: string,
		orderId: string,
		symbol?: string,
	): Promise<TradingOrder> {
		const result = await this.makeRequest<unknown>("cancelOrder", {
			nid,
			orderId,
			symbol,
		});
		return this.transformOrder(result as Record<string, unknown>);
	}

	/**
	 * Transform raw API order to TradingOrder format
	 * Handles various API response formats (Bybit, etc.)
	 */
	private transformOrder(rawOrder: Record<string, unknown>): TradingOrder {
		const info = (rawOrder.info as Record<string, unknown>) || {};
		
		// Helper to get value from multiple possible keys and nested structures
		const getValue = <T>(
			...keys: Array<string | undefined>
		): T | undefined => {
			for (const key of keys) {
				if (!key) continue;
				// Check root level
				let value = rawOrder[key] as T | undefined;
				if (value !== undefined && value !== null) {
					return value;
				}
				// Check info level
				value = info[key] as T | undefined;
				if (value !== undefined && value !== null) {
					return value;
				}
				// Check nested in info (e.g., info.orderDetails.side)
				if (typeof info === "object" && info !== null) {
					for (const infoKey in info) {
						const nested = info[infoKey];
						if (nested && typeof nested === "object") {
							const nestedValue = (nested as Record<string, unknown>)[key] as T | undefined;
							if (nestedValue !== undefined && nestedValue !== null) {
								return nestedValue;
							}
						}
					}
				}
			}
			return undefined;
		};
		
		// Extract data from info or root level with multiple fallback keys
		const side = getValue<string>("side", "Side", "orderSide", "OrderSide");
		const type = getValue<string>("type", "Type", "orderType", "OrderType", "orderType", "OrderType");
		const rawStatus = getValue<string>("status", "Status", "orderStatus", "OrderStatus", "orderStatus", "OrderStatus") || "unknown";
		const cancelType = getValue<string>("cancelType", "CancelType");
		
		// Map Bybit orderStatus to our status format
		// Bybit statuses: New, PartiallyFilled, Filled, Cancelled, Rejected
		let status: string = rawStatus.toLowerCase();
		
		// Check if order was canceled
		// cancelType: "UNKNOWN" is a default value and doesn't indicate cancellation
		// Only consider canceled if:
		// 1. orderStatus explicitly says "Cancelled" or "Rejected", OR
		// 2. cancelType exists and is not empty and not "UNKNOWN"
		const hasValidCancelType = cancelType !== undefined && 
			cancelType !== null && 
			cancelType !== "" && 
			cancelType.toUpperCase() !== "UNKNOWN";
		
		const isExplicitlyCanceled = rawStatus.toLowerCase() === "cancelled" || 
			rawStatus.toLowerCase() === "canceled" || 
			rawStatus.toLowerCase() === "rejected";
		
		if (isExplicitlyCanceled || hasValidCancelType) {
			// Order is explicitly canceled
			status = "canceled";
		} else {
			// Map Bybit statuses to our format
			switch (rawStatus.toLowerCase()) {
				case "new":
					status = "open";
					break;
				case "partiallyfilled":
				case "partially_filled":
					status = "partiallyFilled";
					break;
				case "filled":
				case "fullyfilled":
				case "fully_filled":
					status = "filled";
					break;
				case "cancelled":
				case "canceled":
					status = "canceled";
					break;
				case "rejected":
					status = "canceled"; // Treat rejected as canceled
					break;
				default:
					// Keep lowercase status as-is if it matches our format
					if (!["open", "closed", "canceled", "filled", "partiallyFilled"].includes(status)) {
						status = "unknown";
					}
			}
		}
		
		// Numeric values
		const amount = getValue<number>("amount", "qty", "Qty", "quantity", "Quantity", "orderQty", "OrderQty");
		const price = getValue<number>("price", "Price", "orderPrice", "OrderPrice", "limitPrice", "LimitPrice");
		const filled = getValue<number>("filled", "Filled", "cumExecQty", "CumExecQty", "executedQty", "ExecutedQty") ?? 0;
		const remaining = getValue<number>("remaining", "Remaining", "leavesQty", "LeavesQty", "remainingQty", "RemainingQty") ?? (amount ? amount - filled : undefined);
		const cost = getValue<number>("cost", "Cost", "cumExecValue", "CumExecValue", "executedValue", "ExecutedValue") ?? (price && filled ? price * filled : undefined);
		
		// Timestamp handling
		const timestamp = getValue<number>("timestamp", "Timestamp", "createdTime", "CreatedTime", "updateTime", "UpdateTime", "time", "Time") ?? Date.now();
		const datetime = (rawOrder.datetime as string) || (info.datetime as string) || new Date(timestamp).toISOString();
		
		// Order ID handling
		const id = (rawOrder.id as string) || (info.orderId as string) || (info.OrderId as string) || "";
		const clientOrderId = (rawOrder.clientOrderId as string) || (info.orderLinkId as string) || (info.OrderLinkId as string) || (info.clientOrderId as string) || undefined;
		
		return {
			id,
			clientOrderId,
			symbol: (rawOrder.symbol as string) || "",
			type: type?.toLowerCase() as TradingOrder["type"] | undefined,
			side: side?.toLowerCase() as TradingOrder["side"] | undefined,
			amount,
			price,
			status: status as TradingOrder["status"] | undefined,
			timestamp,
			datetime,
			filled,
			remaining,
			cost,
			fee: rawOrder.fee as TradingOrder["fee"] | undefined,
			trades: rawOrder.trades as unknown[] | undefined,
			info: rawOrder.info as Record<string, unknown> | undefined,
		};
	}

	/**
	 * List orders
	 * Fetches orders and optionally enriches them with details
	 * Note: If nid is not provided, this is a public request - missing stels-session
	 * header is expected and warnings about unauthorized sessions are normal
	 */
	async listOrders(params: {
		nid?: string;
		symbol?: string;
		status?: "open" | "closed" | "all";
		since?: number;
		limit?: number;
	}): Promise<{ orders: TradingOrder[]; total: number }> {
		const result = await this.makeRequest<{ orders: unknown[]; total: number }>(
			"listOrders",
			params,
		);
		
		// Transform raw orders to TradingOrder format
		const transformedOrders = result.orders.map((order) =>
			this.transformOrder(order as Record<string, unknown>),
		);
		
		// If orders are missing critical data, try to fetch details for each order
		const enrichedOrders = await Promise.all(
			transformedOrders.map(async (order) => {
				// Check if order is missing critical fields
				// Consider order incomplete if it's missing side, type, status, or amount
				const isIncomplete = !order.side || 
					!order.type || 
					!order.status || 
					order.amount === undefined || 
					order.amount === null;
				
				// If order is incomplete and we have nid, try to fetch details
				if (isIncomplete && params.nid && order.id) {
					try {
						const detailedOrder = await this.getOrder(
							params.nid,
							order.id,
							order.symbol,
						);
						// Merge detailed data with existing order
						const merged = {
							...order,
							...detailedOrder,
							// Preserve original id and symbol
							id: order.id,
							symbol: order.symbol || detailedOrder.symbol,
						};
						return merged;
					} catch {
						return order;
					}
				}
				return order;
			}),
		);
		
		return {
			orders: enrichedOrders,
			total: result.total,
		};
	}

	/**
	 * List trades
	 * Note: nid is required to filter trades by account
	 */
	async listTrades(params: {
		nid: string; // Make nid required to ensure account filtering
		symbol?: string;
		since?: number;
		limit?: number;
	}): Promise<{ trades: TradingTrade[]; total: number }> {
		if (!params.nid) {
			throw new Error("nid is required to list trades for an account");
		}
		const result = await this.makeRequest<{ trades: TradingTrade[]; total: number }>(
			"listTrades",
			params,
		);
		return result;
	}

	/**
	 * Get order book
	 * Note: This is a public request - missing stels-session header is expected
	 * and warnings about unauthorized sessions are normal for this endpoint
	 */
	async getOrderBook(
		nid: string,
		symbol: string,
		limit?: number,
	): Promise<OrderBook> {
		return this.makeRequest<OrderBook>("getOrderBook", {
			nid,
			symbol,
			limit,
		});
	}

	/**
	 * Get ticker
	 * Note: This is a public request - missing stels-session header is expected
	 * and warnings about unauthorized sessions are normal for this endpoint
	 */
	async getTicker(nid: string, symbol: string): Promise<Ticker> {
		return this.makeRequest<Ticker>("getTicker", { nid, symbol });
	}

	/**
	 * Get balance
	 * Note: This is a public request - missing stels-session header is expected
	 * and warnings about unauthorized sessions are normal for this endpoint
	 */
	async getBalance(nid: string): Promise<AccountBalance> {
		return this.makeRequest<AccountBalance>("getBalance", { nid });
	}
}
