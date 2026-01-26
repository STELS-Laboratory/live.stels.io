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
  GetBalanceParams,
  GetBalanceResponse,
  GetTickerParams,
  GetOrderBookParams,
  ListOrdersParams,
  ListTradesParams,
  CreateOrderParams,
  GetOrderParams,
  CancelOrderParams,
  FetchBalanceParams,
  FetchBalanceResponse,
  FetchPositionsParams,
  FetchOpenOrdersParams,
  FetchOrderHistoryParams,
  FetchTradesParams,
  SetLeverageParams,
  TransferFundsParams,
  CreateBatchOrdersParams,
  CreateConditionalOrderParams,
  GetAccountMarketTypesParams,
  GetAccountMarketTypesResponse,
  // Professional Trading Types (v2.15.0)
  EditOrderParams,
  EditOrderResponse,
  CancelAllOrdersParams,
  CancelAllOrdersResponse,
  CreateOrderWithTpSlParams,
  CreateOrderWithTpSlResponse,
  CreateStopOrderParams,
  CreateStopOrderResponse,
  SetMarginModeParams,
  SetMarginModeResponse,
  ClosePositionParams,
  ClosePositionResponse,
  SetPositionModeParams,
  SetPositionModeResponse,
  ModifyMarginParams,
  ModifyMarginResponse,
  FetchLeverageTiersParams,
  FetchLeverageTiersResponse,
  FetchFundingRateParams,
  FetchFundingRateResponse,
  FetchMyLiquidationsParams,
  FetchMyLiquidationsResponse,
  FetchGreeksParams,
  FetchGreeksResponse,
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
      
      // Risk Management State (v2.15.0)
      leverageTiers: {},
      fundingRate: null,
      fundingRateHistory: [],
      liquidations: [],
      greeks: null,
      marginMode: null,
      positionMode: null,

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
      // Professional Trading Loading States (v2.15.0)
      orderEditing: false,
      cancellingAll: false,
      closingPosition: false,
      marginModeUpdating: false,
      positionModeUpdating: false,
      marginModifying: false,
      leverageTiersLoading: false,
      fundingRateLoading: false,
      liquidationsLoading: false,
      greeksLoading: false,

      // Error states
      balanceError: null,
      ordersError: null,
      tradesError: null,
      positionsError: null,
      tickerError: null,
      orderBookError: null,
      marketTypesError: null,
      // Professional Trading Error States (v2.15.0)
      leverageTiersError: null,
      fundingRateError: null,
      liquidationsError: null,
      greeksError: null,

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
          const balances: BalanceMap = {};
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
          const balances: BalanceMap = {};
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
      // Professional Trading - Order Management (v2.15.0)
      // ============================================

      // Edit an existing order
      editOrder: async (params: EditOrderParams): Promise<EditOrderResponse["raw"] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ orderEditing: true });

        try {
          const response = await client.request<WebfixResponse<EditOrderResponse["raw"]>>(
            "editOrder",
            params
          );

          console.log("[TradingStore] editOrder response:", response);

          if (response.success && response.raw) {
            // Update order in list
            set((state) => ({
              orders: state.orders.map((o) =>
                o.id === params.orderId ? { ...o, ...response.raw } : o
              ),
              orderEditing: false,
            }));

            toast.success("Order updated", `Order ${params.orderId} has been modified`);
            return response.raw;
          }

          throw new Error(response.error?.message || "Failed to edit order");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to edit order";
          if (!message.includes("not found")) {
            console.error("[TradingStore] editOrder error:", error);
            toast.error("Failed to edit order", message);
          }
          set({ orderEditing: false });
          return null;
        }
      },

      // Cancel all orders for a symbol
      cancelAllOrders: async (params: CancelAllOrdersParams): Promise<CancelAllOrdersResponse["raw"] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ cancellingAll: true });

        try {
          const response = await client.request<WebfixResponse<CancelAllOrdersResponse["raw"]>>(
            "cancelAllOrders",
            params
          );

          console.log("[TradingStore] cancelAllOrders response:", response);

          if (response.success && response.raw) {
            // Update orders list - mark matching orders as cancelled
            set((state) => ({
              orders: state.orders.map((o) => {
                const shouldCancel = params.symbol ? o.symbol === params.symbol : true;
                return shouldCancel && o.status === "open"
                  ? { ...o, status: "cancelled" as const }
                  : o;
              }),
              cancellingAll: false,
            }));

            toast.success(
              "Orders cancelled",
              `${response.raw.canceledCount} orders cancelled${params.symbol ? ` for ${params.symbol}` : ""}`
            );
            return response.raw;
          }

          throw new Error(response.error?.message || "Failed to cancel orders");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to cancel all orders";
          if (!message.includes("not found")) {
            console.error("[TradingStore] cancelAllOrders error:", error);
            toast.error("Failed to cancel orders", message);
          }
          set({ cancellingAll: false });
          return null;
        }
      },

      // Create order with Take Profit / Stop Loss
      createOrderWithTpSl: async (params: CreateOrderWithTpSlParams): Promise<CreateOrderWithTpSlResponse["raw"] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ orderCreating: true });

        try {
          const response = await client.request<WebfixResponse<CreateOrderWithTpSlResponse["raw"]>>(
            "createOrderWithTpSl",
            params
          );

          console.log("[TradingStore] createOrderWithTpSl response:", response);

          if (response.success && response.raw) {
            // Add order to list
            const newOrder: Order = {
              id: response.raw.orderId,
              symbol: response.raw.symbol,
              side: response.raw.side,
              type: response.raw.type as Order["type"],
              status: response.raw.status,
              amount: response.raw.amount,
              price: response.raw.price,
              filled: 0,
              remaining: response.raw.amount,
              cost: 0,
              createdAt: response.raw.timestamp,
              updatedAt: response.raw.timestamp,
            };

            set((state) => ({
              orders: [newOrder, ...state.orders],
              orderCreating: false,
            }));

            const tpSlInfo = [];
            if (params.takeProfitPrice) tpSlInfo.push(`TP: ${params.takeProfitPrice}`);
            if (params.stopLossPrice) tpSlInfo.push(`SL: ${params.stopLossPrice}`);
            
            toast.success(
              "Order created with TP/SL",
              `${params.side.toUpperCase()} ${params.amount} ${params.symbol}${tpSlInfo.length ? ` (${tpSlInfo.join(", ")})` : ""}`
            );
            return response.raw;
          }

          throw new Error(response.error?.message || "Failed to create order");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create order";
          if (!message.includes("not found")) {
            console.error("[TradingStore] createOrderWithTpSl error:", error);
            toast.error("Failed to create order", message);
          }
          set({ orderCreating: false });
          return null;
        }
      },

      // Create stop/trigger order
      createStopOrder: async (params: CreateStopOrderParams): Promise<CreateStopOrderResponse["raw"] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ orderCreating: true });

        try {
          const response = await client.request<WebfixResponse<CreateStopOrderResponse["raw"]>>(
            "createStopOrder",
            params
          );

          console.log("[TradingStore] createStopOrder response:", response);

          if (response.success && response.raw) {
            toast.success(
              "Stop order created",
              `${params.stopOrderType.replace(/_/g, " ")} @ ${params.triggerPrice} for ${params.symbol}`
            );
            set({ orderCreating: false });
            return response.raw;
          }

          throw new Error(response.error?.message || "Failed to create stop order");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create stop order";
          if (!message.includes("not found")) {
            console.error("[TradingStore] createStopOrder error:", error);
            toast.error("Failed to create stop order", message);
          }
          set({ orderCreating: false });
          return null;
        }
      },

      // ============================================
      // Professional Trading - Position Management (v2.15.0)
      // ============================================

      // Set margin mode (cross/isolated)
      setMarginMode: async (params: SetMarginModeParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ marginModeUpdating: true });

        try {
          const response = await client.request<WebfixResponse<SetMarginModeResponse["raw"]>>(
            "setMarginMode",
            params
          );

          console.log("[TradingStore] setMarginMode response:", response);

          if (response.success) {
            set({ 
              marginMode: params.marginMode,
              marginModeUpdating: false 
            });
            toast.success("Margin mode updated", `Set to ${params.marginMode} margin for ${params.symbol}`);
            return true;
          }

          throw new Error(response.error?.message || "Failed to set margin mode");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to set margin mode";
          if (!message.includes("not found")) {
            console.error("[TradingStore] setMarginMode error:", error);
            toast.error("Failed to set margin mode", message);
          }
          set({ marginModeUpdating: false });
          return false;
        }
      },

      // Close position
      closePosition: async (params: ClosePositionParams): Promise<ClosePositionResponse["raw"] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ closingPosition: true });

        try {
          const response = await client.request<WebfixResponse<ClosePositionResponse["raw"]>>(
            "closePosition",
            params
          );

          console.log("[TradingStore] closePosition response:", response);

          if (response.success && response.raw) {
            // Remove or update position in list
            set((state) => ({
              positions: params.amount
                ? state.positions.map((p) =>
                    p.symbol === params.symbol
                      ? { ...p, amount: p.amount - (params.amount || 0) }
                      : p
                  ).filter((p) => p.amount > 0)
                : state.positions.filter((p) => p.symbol !== params.symbol),
              closingPosition: false,
            }));

            toast.success(
              "Position closed",
              `Closed ${params.amount || "full"} ${params.symbol} position`
            );
            return response.raw;
          }

          throw new Error(response.error?.message || "Failed to close position");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to close position";
          if (!message.includes("not found")) {
            console.error("[TradingStore] closePosition error:", error);
            toast.error("Failed to close position", message);
          }
          set({ closingPosition: false });
          return null;
        }
      },

      // Set position mode (one-way/hedge)
      setPositionMode: async (params: SetPositionModeParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ positionModeUpdating: true });

        try {
          const response = await client.request<WebfixResponse<SetPositionModeResponse["raw"]>>(
            "setPositionMode",
            params
          );

          console.log("[TradingStore] setPositionMode response:", response);

          if (response.success) {
            set({ 
              positionMode: params.hedged ? "hedge" : "one-way",
              positionModeUpdating: false 
            });
            toast.success(
              "Position mode updated",
              `Set to ${params.hedged ? "hedge" : "one-way"} mode`
            );
            return true;
          }

          throw new Error(response.error?.message || "Failed to set position mode");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to set position mode";
          if (!message.includes("not found")) {
            console.error("[TradingStore] setPositionMode error:", error);
            toast.error("Failed to set position mode", message);
          }
          set({ positionModeUpdating: false });
          return false;
        }
      },

      // Modify position margin
      modifyMargin: async (params: ModifyMarginParams): Promise<boolean> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return false;
        }

        set({ marginModifying: true });

        try {
          const response = await client.request<WebfixResponse<ModifyMarginResponse["raw"]>>(
            "modifyMargin",
            params
          );

          console.log("[TradingStore] modifyMargin response:", response);

          if (response.success) {
            set({ marginModifying: false });
            toast.success(
              "Margin modified",
              `${params.action === "add" ? "Added" : "Reduced"} ${params.amount} margin for ${params.symbol}`
            );
            return true;
          }

          throw new Error(response.error?.message || "Failed to modify margin");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to modify margin";
          if (!message.includes("not found")) {
            console.error("[TradingStore] modifyMargin error:", error);
            toast.error("Failed to modify margin", message);
          }
          set({ marginModifying: false });
          return false;
        }
      },

      // ============================================
      // Professional Trading - Risk Management (v2.15.0)
      // ============================================

      // Fetch leverage tiers
      fetchLeverageTiers: async (params: FetchLeverageTiersParams): Promise<FetchLeverageTiersResponse["raw"] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ leverageTiersLoading: true, leverageTiersError: null });

        try {
          const response = await client.request<WebfixResponse<FetchLeverageTiersResponse["raw"]>>(
            "fetchLeverageTiers",
            params
          );

          console.log("[TradingStore] fetchLeverageTiers response:", response);

          if (response.success && response.raw) {
            set({ 
              leverageTiers: response.raw.tiers,
              leverageTiersLoading: false 
            });
            return response.raw;
          }

          throw new Error(response.error?.message || "Failed to fetch leverage tiers");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch leverage tiers";
          if (!message.includes("not found")) {
            console.error("[TradingStore] fetchLeverageTiers error:", error);
          }
          set({ leverageTiersError: message, leverageTiersLoading: false });
          return null;
        }
      },

      // Fetch funding rate
      fetchFundingRate: async (params: FetchFundingRateParams): Promise<FetchFundingRateResponse["raw"] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ fundingRateLoading: true, fundingRateError: null });

        try {
          const response = await client.request<WebfixResponse<FetchFundingRateResponse["raw"]>>(
            "fetchFundingRate",
            params
          );

          console.log("[TradingStore] fetchFundingRate response:", response);

          if (response.success && response.raw) {
            set({ 
              fundingRate: response.raw.fundingRate || null,
              fundingRateHistory: response.raw.fundingRates || [],
              fundingRateLoading: false 
            });
            return response.raw;
          }

          throw new Error(response.error?.message || "Failed to fetch funding rate");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch funding rate";
          if (!message.includes("not found")) {
            console.error("[TradingStore] fetchFundingRate error:", error);
          }
          set({ fundingRateError: message, fundingRateLoading: false });
          return null;
        }
      },

      // Fetch liquidation history
      fetchMyLiquidations: async (params: FetchMyLiquidationsParams): Promise<Liquidation[] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ liquidationsLoading: true, liquidationsError: null });

        try {
          const response = await client.request<WebfixResponse<FetchMyLiquidationsResponse["raw"]>>(
            "fetchMyLiquidations",
            params
          );

          console.log("[TradingStore] fetchMyLiquidations response:", response);

          if (response.success && response.raw) {
            set({ 
              liquidations: response.raw.liquidations,
              liquidationsLoading: false 
            });
            return response.raw.liquidations;
          }

          throw new Error(response.error?.message || "Failed to fetch liquidations");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch liquidations";
          if (!message.includes("not found")) {
            console.error("[TradingStore] fetchMyLiquidations error:", error);
          }
          set({ liquidationsError: message, liquidationsLoading: false });
          return null;
        }
      },

      // Fetch option Greeks
      fetchGreeks: async (params: FetchGreeksParams): Promise<FetchGreeksResponse["raw"] | null> => {
        const client = getApiClient();
        if (!client) {
          toast.error("Not connected to server");
          return null;
        }

        set({ greeksLoading: true, greeksError: null });

        try {
          const response = await client.request<WebfixResponse<FetchGreeksResponse["raw"]>>(
            "fetchGreeks",
            params
          );

          console.log("[TradingStore] fetchGreeks response:", response);

          if (response.success && response.raw) {
            set({ 
              greeks: response.raw.greeks,
              greeksLoading: false 
            });
            return response.raw;
          }

          throw new Error(response.error?.message || "Failed to fetch Greeks");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to fetch Greeks";
          if (!message.includes("not found")) {
            console.error("[TradingStore] fetchGreeks error:", error);
          }
          set({ greeksError: message, greeksLoading: false });
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
          // Risk Management State (v2.15.0)
          leverageTiers: {},
          fundingRate: null,
          fundingRateHistory: [],
          liquidations: [],
          greeks: null,
          marginMode: null,
          positionMode: null,
          // Error states
          balanceError: null,
          ordersError: null,
          tradesError: null,
          positionsError: null,
          tickerError: null,
          orderBookError: null,
          marketTypesError: null,
          leverageTiersError: null,
          fundingRateError: null,
          liquidationsError: null,
          greeksError: null,
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
