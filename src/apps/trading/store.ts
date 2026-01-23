/**
 * Trading API Store
 * Manages trading operations via RPC calls
 * 
 * WebFIX v2.12.0: All responses use `raw` field for data payload
 * See: /docs/WEBFIX-MIGRATION-GUIDE.md
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useAuthStore } from "@/stores/modules/auth.store";
import { toast } from "@/stores";
import { WebfixApiClient } from "@/lib/webfix-api-client";

// WebFIX v2.12.0 response wrapper type
interface WebfixResponse<T> {
  success: boolean;
  raw?: T;
  error?: {
    code: string;
    message: string;
    httpStatus?: number;
  };
}
import type {
  TradingStore,
  TradingFilters,
  BalanceMap,
  Order,
  Trade,
  Ticker,
  OrderBook,
  Position,
  ConditionalOrder,
  BatchOrderResult,
  MarketType,
  MarketTypeInfo,
  GetBalanceParams,
  GetBalanceResponse,
  GetTickerParams,
  GetTickerResponse,
  GetOrderBookParams,
  GetOrderBookResponse,
  ListOrdersParams,
  ListOrdersResponse,
  ListTradesParams,
  ListTradesResponse,
  CreateOrderParams,
  CreateOrderResponse,
  GetOrderParams,
  GetOrderResponse,
  CancelOrderParams,
  CancelOrderResponse,
  FetchBalanceParams,
  FetchBalanceResponse,
  FetchPositionsParams,
  FetchPositionsResponse,
  FetchOpenOrdersParams,
  FetchOpenOrdersResponse,
  FetchOrderHistoryParams,
  FetchOrderHistoryResponse,
  FetchTradesParams,
  FetchTradesResponse,
  SetLeverageParams,
  SetLeverageResponse,
  TransferFundsParams,
  TransferFundsResponse,
  CreateBatchOrdersParams,
  CreateBatchOrdersResponse,
  CreateConditionalOrderParams,
  CreateConditionalOrderResponse,
  GetAccountMarketTypesParams,
  GetAccountMarketTypesResponse,
} from "./types";

/**
 * Helper to get API client
 */
function getApiClient(): WebfixApiClient | null {
  const connectionSession = useAuthStore.getState().connectionSession;
  if (!connectionSession) return null;

  const client = new WebfixApiClient(connectionSession.api);
  client.setSession(connectionSession.session);
  return client;
}

/**
 * Initial filters state
 */
const initialFilters: TradingFilters = {
  symbol: undefined,
  status: undefined,
  side: undefined,
};

/**
 * Trading Store
 */
export const useTradingStore = create<TradingStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      balances: {},
      orders: [],
      trades: [],
      positions: [],
      conditionalOrders: [],
      ticker: null,
      orderBook: null,
      selectedOrder: null,
      selectedPosition: null,
      filters: initialFilters,
      currentLeverage: null,
      
      // Market Types State (v2.13.0)
      marketTypes: [],
      selectedMarketType: null,
      availableMethods: [],

      // Loading states
      balanceLoading: false,
      ordersLoading: false,
      tradesLoading: false,
      positionsLoading: false,
      tickerLoading: false,
      orderBookLoading: false,
      orderCreating: false,
      orderCancelling: false,
      batchOrdersCreating: false,
      conditionalOrderCreating: false,
      leverageUpdating: false,
      transferring: false,
      marketTypesLoading: false,

      // Error states
      balanceError: null,
      ordersError: null,
      tradesError: null,
      positionsError: null,
      tickerError: null,
      orderBookError: null,
      marketTypesError: null,

      // Get account balance
      getBalance: async (params: GetBalanceParams): Promise<BalanceMap | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ balanceLoading: true, balanceError: null });

        try {
          const response = await client.request<WebfixResponse<GetBalanceResponse>>(
            "getBalance",
            params
          );

          console.log("[TradingStore] getBalance response:", response);

          // WebFIX v2.12.0: Parse response.raw
          let balances: BalanceMap = {};
          const rawData = response.raw;
          
          if (rawData && typeof rawData === 'object') {
            const data = rawData as Record<string, unknown>;
            
            // Prefer 'balances' field if available (already in correct format)
            if (data.balances && typeof data.balances === 'object') {
              const rawBalances = data.balances as Record<string, { free?: number; used?: number; total?: number }>;
              for (const [currency, balance] of Object.entries(rawBalances)) {
                if (balance.total && balance.total > 0) {
                  balances[currency] = {
                    currency,
                    free: balance.free || 0,
                    used: balance.used || 0,
                    total: balance.total || 0,
                  };
                }
              }
            } 
            // Fallback: build from free/total objects
            else if (data.total && typeof data.total === 'object') {
              const totals = data.total as Record<string, number>;
              const frees = (data.free as Record<string, number>) || {};
              const useds = (data.used as Record<string, number>) || {};
              
              for (const [currency, total] of Object.entries(totals)) {
                if (total > 0) {
                  balances[currency] = {
                    currency,
                    free: frees[currency] || 0,
                    used: useds[currency] || 0,
                    total,
                  };
                }
              }
            }
          }

          set({ balances, balanceLoading: false });
          return balances;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch balance";
          console.error("[TradingStore] getBalance error:", error);
          set({ balanceError: message, balanceLoading: false });
          toast.error("Failed to fetch balance", message);
          return null;
        }
      },

      // Get ticker for symbol
      getTicker: async (params: GetTickerParams): Promise<Ticker | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ tickerLoading: true, tickerError: null });

        try {
          const response = await client.request<WebfixResponse<Ticker>>(
            "getTicker",
            params
          );

          console.log("[TradingStore] getTicker response:", response);

          // WebFIX v2.12.0: Parse response.raw
          const ticker = response.raw || null;
          set({ ticker, tickerLoading: false });
          return ticker;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch ticker";
          console.error("[TradingStore] getTicker error:", error);
          set({ tickerError: message, tickerLoading: false });
          toast.error("Failed to fetch ticker", message);
          return null;
        }
      },

      // Get order book for symbol
      getOrderBook: async (params: GetOrderBookParams): Promise<OrderBook | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ orderBookLoading: true, orderBookError: null });

        try {
          const response = await client.request<WebfixResponse<OrderBook>>(
            "getOrderBook",
            params
          );

          console.log("[TradingStore] getOrderBook response:", response);

          // WebFIX v2.12.0: Parse response.raw
          const orderBook = response.raw || null;
          set({ orderBook, orderBookLoading: false });
          return orderBook;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch order book";
          console.error("[TradingStore] getOrderBook error:", error);
          set({ orderBookError: message, orderBookLoading: false });
          toast.error("Failed to fetch order book", message);
          return null;
        }
      },

      // List orders
      listOrders: async (params: ListOrdersParams): Promise<void> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return;
        }

        set({ ordersLoading: true, ordersError: null });

        try {
          const response = await client.request<WebfixResponse<{ orders: Order[]; total?: number }>>(
            "listOrders",
            params
          );

          console.log("[TradingStore] listOrders response:", response);

          // WebFIX v2.12.0: Parse response.raw.orders
          const orders = response.raw?.orders || [];
          set({ orders, ordersLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch orders";
          console.error("[TradingStore] listOrders error:", error);
          set({ ordersError: message, ordersLoading: false });
          toast.error("Failed to fetch orders", message);
        }
      },

      // List trades
      listTrades: async (params: ListTradesParams): Promise<void> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return;
        }

        set({ tradesLoading: true, tradesError: null });

        try {
          const response = await client.request<WebfixResponse<{ trades: Trade[]; total?: number }>>(
            "listTrades",
            params
          );

          console.log("[TradingStore] listTrades response:", response);

          // WebFIX v2.12.0: Parse response.raw.trades
          const trades = response.raw?.trades || [];
          set({ trades, tradesLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch trades";
          console.error("[TradingStore] listTrades error:", error);
          set({ tradesError: message, tradesLoading: false });
          toast.error("Failed to fetch trades", message);
        }
      },

      // Create order
      createOrder: async (params: CreateOrderParams): Promise<Order | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ orderCreating: true });

        try {
          const response = await client.request<WebfixResponse<Order>>(
            "createOrder",
            params
          );

          console.log("[TradingStore] createOrder response:", response);

          // WebFIX v2.12.0: Parse response.raw
          const order = response.raw;

          if (order) {
            // Add to orders list
            set((state) => ({
              orders: [order, ...state.orders],
              orderCreating: false,
            }));

            toast.success(
              "Order created",
              `${params.side.toUpperCase()} ${params.amount} ${params.symbol}`
            );
            return order;
          }

          throw new Error(response.error?.message || "Failed to create order");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create order";
          console.error("[TradingStore] createOrder error:", error);
          set({ orderCreating: false });
          toast.error("Failed to create order", message);
          return null;
        }
      },

      // Get single order
      getOrder: async (params: GetOrderParams): Promise<Order | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        try {
          const response = await client.request<WebfixResponse<{ order: Order }>>(
            "getOrder",
            params
          );

          console.log("[TradingStore] getOrder response:", response);

          // WebFIX v2.12.0: Parse response.raw.order
          const order = response.raw?.order;

          if (order) {
            // Update order in list if exists
            set((state) => ({
              orders: state.orders.map((o) =>
                o.id === order.id ? order : o
              ),
              selectedOrder: state.selectedOrder?.id === order.id
                ? order
                : state.selectedOrder,
            }));
            return order;
          }

          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch order";
          console.error("[TradingStore] getOrder error:", error);
          toast.error("Failed to fetch order", message);
          return null;
        }
      },

      // Cancel order
      cancelOrder: async (params: CancelOrderParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ orderCancelling: true });

        try {
          const response = await client.request<WebfixResponse<{ cancelled: boolean }>>(
            "cancelOrder",
            params
          );

          console.log("[TradingStore] cancelOrder response:", response);

          // WebFIX v2.12.0: Check response.success
          if (response.success) {
            // Update order status in list
            set((state) => ({
              orders: state.orders.map((o) =>
                o.id === params.orderId
                  ? { ...o, status: "cancelled" as const }
                  : o
              ),
              orderCancelling: false,
            }));

            toast.success("Order cancelled", `Order ${params.orderId} has been cancelled`);
            return true;
          }

          throw new Error(response.error?.message || "Failed to cancel order");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to cancel order";
          console.error("[TradingStore] cancelOrder error:", error);
          set({ orderCancelling: false });
          toast.error("Failed to cancel order", message);
          return false;
        }
      },

      // ============================================
      // AccountId-based Actions (using UUID)
      // ============================================

      // Fetch balance using accountId
      fetchBalance: async (params: FetchBalanceParams): Promise<BalanceMap | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ balanceLoading: true, balanceError: null });

        try {
          const response = await client.request<WebfixResponse<FetchBalanceResponse>>(
            "fetchBalance",
            params
          );

          console.log("[TradingStore] fetchBalance response:", response);

          // WebFIX v2.12.0: Parse response.raw
          let balances: BalanceMap = {};
          const rawData = response.raw;
          
          if (rawData && typeof rawData === 'object') {
            const data = rawData as Record<string, unknown>;
            
            // Prefer 'balances' field if available
            if (data.balances && typeof data.balances === 'object') {
              const rawBalances = data.balances as Record<string, { free?: number; used?: number; total?: number }>;
              for (const [currency, balance] of Object.entries(rawBalances)) {
                if (balance.total && balance.total > 0) {
                  balances[currency] = {
                    currency,
                    free: balance.free || 0,
                    used: balance.used || 0,
                    total: balance.total || 0,
                  };
                }
              }
            } 
            // Fallback: build from free/total objects
            else if (data.total && typeof data.total === 'object') {
              const totals = data.total as Record<string, number>;
              const frees = (data.free as Record<string, number>) || {};
              const useds = (data.used as Record<string, number>) || {};
              
              for (const [currency, total] of Object.entries(totals)) {
                if (total > 0) {
                  balances[currency] = {
                    currency,
                    free: frees[currency] || 0,
                    used: useds[currency] || 0,
                    total,
                  };
                }
              }
            }
          }

          set({ balances, balanceLoading: false });
          return balances;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch balance";
          if (!message.includes("not found")) {
            console.error("[TradingStore] fetchBalance error:", error);
            toast.error("Failed to fetch balance", message);
          }
          set({ balanceError: message, balanceLoading: false });
          return null;
        }
      },

      // Fetch positions
      fetchPositions: async (params: FetchPositionsParams): Promise<Position[] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ positionsLoading: true, positionsError: null });

        try {
          const response = await client.request<WebfixResponse<{ positions: Position[] }>>(
            "fetchPositions",
            params
          );

          console.log("[TradingStore] fetchPositions response:", response);

          // WebFIX v2.12.0: Parse response.raw.positions
          const positions = response.raw?.positions || [];
          set({ positions, positionsLoading: false });
          return positions;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch positions";
          // Don't spam for known issues:
          // - "method not found" - server hasn't implemented yet
          // - "category only support linear or option" - Bybit: positions only for derivatives, not spot
          const isExpectedError = message.includes("not found") || 
                                  message.includes("category only support");
          if (!isExpectedError) {
            console.error("[TradingStore] fetchPositions error:", error);
            toast.error("Failed to fetch positions", message);
          }
          // For spot accounts, return empty positions instead of error state
          if (message.includes("category only support")) {
            set({ positions: [], positionsLoading: false, positionsError: null });
            return [];
          }
          set({ positionsError: message, positionsLoading: false });
          return null;
        }
      },

      // Fetch open orders
      fetchOpenOrders: async (params: FetchOpenOrdersParams): Promise<Order[] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ ordersLoading: true, ordersError: null });

        try {
          const response = await client.request<WebfixResponse<{ orders: Order[] }>>(
            "fetchOpenOrders",
            params
          );

          console.log("[TradingStore] fetchOpenOrders response:", response);

          // WebFIX v2.12.0: Parse response.raw.orders
          const orders = response.raw?.orders || [];
          set({ orders, ordersLoading: false });
          return orders;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch open orders";
          if (!message.includes("not found")) {
            console.error("[TradingStore] fetchOpenOrders error:", error);
            toast.error("Failed to fetch open orders", message);
          }
          set({ ordersError: message, ordersLoading: false });
          return null;
        }
      },

      // Fetch order history
      fetchOrderHistory: async (params: FetchOrderHistoryParams): Promise<Order[] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ ordersLoading: true, ordersError: null });

        try {
          const response = await client.request<WebfixResponse<{ orders: Order[] }>>(
            "fetchOrderHistory",
            params
          );

          console.log("[TradingStore] fetchOrderHistory response:", response);

          // WebFIX v2.12.0: Parse response.raw.orders
          const orders = response.raw?.orders || [];
          set({ orders, ordersLoading: false });
          return orders;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch order history";
          if (!message.includes("not found")) {
            console.error("[TradingStore] fetchOrderHistory error:", error);
            toast.error("Failed to fetch order history", message);
          }
          set({ ordersError: message, ordersLoading: false });
          return null;
        }
      },

      // Fetch trades
      fetchTrades: async (params: FetchTradesParams): Promise<Trade[] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ tradesLoading: true, tradesError: null });

        try {
          const response = await client.request<WebfixResponse<{ trades: Trade[] }>>(
            "fetchTrades",
            params
          );

          console.log("[TradingStore] fetchTrades response:", response);

          // WebFIX v2.12.0: Parse response.raw.trades
          const trades = response.raw?.trades || [];
          set({ trades, tradesLoading: false });
          return trades;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch trades";
          if (!message.includes("not found")) {
            console.error("[TradingStore] fetchTrades error:", error);
            toast.error("Failed to fetch trades", message);
          }
          set({ tradesError: message, tradesLoading: false });
          return null;
        }
      },

      // Set leverage
      setLeverage: async (params: SetLeverageParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ leverageUpdating: true });

        try {
          const response = await client.request<WebfixResponse<{ leverage: number }>>(
            "setLeverage",
            params
          );

          console.log("[TradingStore] setLeverage response:", response);

          // WebFIX v2.12.0: Check response.success
          if (response.success) {
            set({ 
              currentLeverage: response.raw?.leverage || params.leverage,
              leverageUpdating: false 
            });
            toast.success("Leverage updated", `Leverage set to ${params.leverage}x`);
            return true;
          }

          throw new Error(response.error?.message || "Failed to set leverage");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to set leverage";
          if (!message.includes("not found")) {
            console.error("[TradingStore] setLeverage error:", error);
            toast.error("Failed to set leverage", message);
          }
          set({ leverageUpdating: false });
          return false;
        }
      },

      // Transfer funds
      transferFunds: async (params: TransferFundsParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ transferring: true });

        try {
          const response = await client.request<WebfixResponse<{ transferId: string }>>(
            "transferFunds",
            params
          );

          console.log("[TradingStore] transferFunds response:", response);

          // WebFIX v2.12.0: Check response.success
          if (response.success) {
            set({ transferring: false });
            toast.success(
              "Transfer successful",
              `${params.amount} ${params.currency} from ${params.fromAccount} to ${params.toAccount}`
            );
            return true;
          }

          throw new Error(response.error?.message || "Failed to transfer funds");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to transfer funds";
          if (!message.includes("not found")) {
            console.error("[TradingStore] transferFunds error:", error);
            toast.error("Failed to transfer funds", message);
          }
          set({ transferring: false });
          return false;
        }
      },

      // Create batch orders
      createBatchOrders: async (params: CreateBatchOrdersParams): Promise<BatchOrderResult[] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ batchOrdersCreating: true });

        try {
          const response = await client.request<WebfixResponse<{ results: BatchOrderResult[]; total: number; successful: number }>>(
            "createBatchOrders",
            params
          );

          console.log("[TradingStore] createBatchOrders response:", response);

          // WebFIX v2.12.0: Parse response.raw
          if (response.success && response.raw?.results) {
            // Add successful orders to the orders list
            const successfulOrders = response.raw.results
              .filter((r) => r.success && r.data)
              .map((r) => r.data as Order);

            set((state) => ({
              orders: [...successfulOrders, ...state.orders],
              batchOrdersCreating: false,
            }));

            toast.success(
              "Batch orders created",
              `${response.raw.successful}/${response.raw.total} orders successful`
            );
            return response.raw.results;
          }

          throw new Error(response.error?.message || "Failed to create batch orders");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create batch orders";
          if (!message.includes("not found")) {
            console.error("[TradingStore] createBatchOrders error:", error);
            toast.error("Failed to create batch orders", message);
          }
          set({ batchOrdersCreating: false });
          return null;
        }
      },

      // Create conditional order
      createConditionalOrder: async (params: CreateConditionalOrderParams): Promise<string | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ conditionalOrderCreating: true });

        try {
          const response = await client.request<WebfixResponse<{ conditionalOrderId: string; message?: string; timestamp?: number }>>(
            "createConditionalOrder",
            params
          );

          console.log("[TradingStore] createConditionalOrder response:", response);

          // WebFIX v2.12.0: Parse response.raw
          if (response.success && response.raw?.conditionalOrderId) {
            // Add to conditional orders list
            const newConditionalOrder: ConditionalOrder = {
              id: response.raw.conditionalOrderId,
              accountId: params.accountId,
              condition: params.condition,
              order: params.order,
              status: "pending",
              createdAt: response.raw.timestamp || Date.now(),
              expiresAt: params.expiresAt,
            };

            set((state) => ({
              conditionalOrders: [newConditionalOrder, ...state.conditionalOrders],
              conditionalOrderCreating: false,
            }));

            toast.success(
              "Conditional order created",
              response.raw.message || "Order will execute when condition is met"
            );
            return response.raw.conditionalOrderId;
          }

          throw new Error(response.error?.message || "Failed to create conditional order");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create conditional order";
          if (!message.includes("not found")) {
            console.error("[TradingStore] createConditionalOrder error:", error);
            toast.error("Failed to create conditional order", message);
          }
          set({ conditionalOrderCreating: false });
          return null;
        }
      },

      // ============================================
      // UI Actions
      // ============================================

      setFilters: (filters: Partial<TradingFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      clearFilters: () => {
        set({ filters: initialFilters });
      },

      setSelectedOrder: (order: Order | null) => {
        set({ selectedOrder: order });
      },

      setSelectedPosition: (position: Position | null) => {
        set({ selectedPosition: position });
      },

      clearBalances: () => {
        set({ balances: {}, balanceError: null });
      },

      clearOrders: () => {
        set({ orders: [], ordersError: null, selectedOrder: null });
      },

      clearTrades: () => {
        set({ trades: [], tradesError: null });
      },

      clearPositions: () => {
        set({ positions: [], positionsError: null, selectedPosition: null });
      },

      clearAll: () => {
        set({
          balances: {},
          orders: [],
          trades: [],
          positions: [],
          conditionalOrders: [],
          ticker: null,
          orderBook: null,
          selectedOrder: null,
          selectedPosition: null,
          filters: initialFilters,
          currentLeverage: null,
          marketTypes: [],
          selectedMarketType: null,
          availableMethods: [],
          balanceError: null,
          ordersError: null,
          tradesError: null,
          positionsError: null,
          tickerError: null,
          orderBookError: null,
          marketTypesError: null,
        });
      },

      // Multi-Market Trading (v2.13.0)
      getAccountMarketTypes: async (params: GetAccountMarketTypesParams): Promise<GetAccountMarketTypesResponse | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ marketTypesLoading: true, marketTypesError: null });

        try {
          const response = await client.request<WebfixResponse<GetAccountMarketTypesResponse>>(
            "getAccountMarketTypes",
            params
          );

          console.log("[TradingStore] getAccountMarketTypes response:", response);

          // WebFIX v2.12.0+: Parse response.raw
          const data = response.raw;
          if (data) {
            const availableTypes = data.marketTypes.filter(t => t.isAvailable);
            const defaultType = availableTypes.find(t => t.isDefault);
            
            set({
              marketTypes: availableTypes,
              selectedMarketType: defaultType?.type || (availableTypes[0]?.type as MarketType) || null,
              availableMethods: defaultType?.availableMethods || availableTypes[0]?.availableMethods || [],
              marketTypesLoading: false,
            });
            
            return data;
          }

          set({ marketTypesLoading: false });
          return null;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to get market types";
          // Don't spam logs for errors during backend development of v2.13.0 features
          // "Invalid request body" / "not found" / "RPC method not found" = backend hasn't implemented yet
          const isNotImplemented = message.includes("not found") || 
                                   message.includes("Invalid request") ||
                                   message.includes("RPC method");
          if (!isNotImplemented) {
            console.error("[TradingStore] getAccountMarketTypes error:", error);
          }
          set({ marketTypesError: message, marketTypesLoading: false });
          return null;
        }
      },

      setSelectedMarketType: (marketType: MarketType) => {
        const { marketTypes } = get();
        const selectedTypeInfo = marketTypes.find(t => t.type === marketType);
        
        set({
          selectedMarketType: marketType,
          availableMethods: selectedTypeInfo?.availableMethods || [],
        });
      },
    }),
    { name: "trading-store" }
  )
);
