/**
 * Professional Trading Terminal
 * Exchange-style layout similar to Binance/Bybit
 * Layout: [OrderBook | Chart | OrderForm] with bottom tables
 * Features: Resizable panels, professional UX, realtime data
 */

import { useEffect, useCallback, useState, useMemo } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { useTradingStore } from "./store";
import { useTradingThemeStore, useTradingLayoutStore } from "./stores";
import {
  BalancePanel,
  OrderForm,
  OrderList,
  PositionsPanel,
  LeverageDialog,
  TransferDialog,
  BatchOrderDialog,
  ConditionalOrderDialog,
  CandlestickChart,
  AdvancedOrderBook,
  Watchlist,
  PnLPanel,
  AlertsPanel,
  HotkeysDialog,
  QuickOrderButtons,
  SymbolSearchDialog,
} from "./components";
import { useRealtimeTicker, useRealtimeCandles } from "./hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  Settings2,
  Layers,
  Zap,
  ArrowRightLeft,
  Gauge,
  Keyboard,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  BarChart3,
  Activity,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================
// Mini Sparkline Component for Header
// ============================================
interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  positive?: boolean;
}

function MiniSparkline({ data, width = 60, height = 20, className, positive = true }: MiniSparklineProps) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  
  return (
    <svg width={width} height={height} className={cn("overflow-visible", className)}>
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "var(--trading-buy)" : "var(--trading-sell)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TradingApp() {
  const connectionSession = useAuthStore((s) => s.connectionSession);
  const accounts = useAccountsStore((s) => s.accounts);

  const {
    getBalance,
    listOrders,
    listTrades,
    fetchPositions,
    balanceLoading,
    ordersLoading,
    positionsLoading,
    currentLeverage,
    // Multi-Market Trading (v2.13.0)
    marketTypes,
    selectedMarketType,
    availableMethods,
    marketTypesLoading,
    getAccountMarketTypes,
    setSelectedMarketType,
  } = useTradingStore();

  // Layout store for panel visibility and sizes
  const {
    showOrderBook,
    showOrderForm,
    isChartFullscreen,
    toggleOrderBook,
    toggleOrderForm,
    toggleChartFullscreen,
  } = useTradingLayoutStore();

  const [selectedNid, setSelectedNid] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTC/USDT");
  const [selectedExchange, setSelectedExchange] = useState<string>("bybit");
  const [selectedMarket, setSelectedMarket] = useState<string>("spot");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("1h");

  // Bottom panel tab state
  const [bottomTab, setBottomTab] = useState<string>("orders");

  // Order form price state (for click-to-fill from orderbook)
  const [orderFormPrice, setOrderFormPrice] = useState<string>("");

  // Dialog states
  const [leverageDialogOpen, setLeverageDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [batchOrderDialogOpen, setBatchOrderDialogOpen] = useState(false);
  const [conditionalOrderDialogOpen, setConditionalOrderDialogOpen] = useState(false);
  const [symbolSearchOpen, setSymbolSearchOpen] = useState(false);

  // Get realtime ticker for header display
  const { raw: headerTicker } = useRealtimeTicker(selectedSymbol, selectedExchange, selectedMarket, { interval: 1000 });

  // Get candles for mini sparkline in header
  const { raw: candlesData } = useRealtimeCandles(selectedSymbol, selectedExchange, selectedMarket, "1h", { interval: 30000 });

  // Extract close prices for sparkline
  const sparklineData = useMemo(() => {
    if (!candlesData?.candles?.length) return [];
    // Get last 24 candles (24h for 1h timeframe)
    return candlesData.candles.slice(-24).map((c: number[]) => c[4]); // Close price
  }, [candlesData]);

  // Initialize trading theme on mount
  const applyTheme = useTradingThemeStore((s) => s.applyTheme);
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Keyboard shortcut for symbol search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSymbolSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter exchange accounts (StoredAccount has nested account object)
  const exchangeAccounts = accounts.filter(
    (acc) => acc.account?.exchange && acc.account?.status === "active"
  );

  // Update selectedAccountId and exchange when account changes
  useEffect(() => {
    const account = exchangeAccounts.find((acc) => acc.account?.nid === selectedNid);
    if (account) {
      setSelectedAccountId(account.id);
      setSelectedExchange(account.account.exchange.toLowerCase());
      // Determine market type from account - use 'spot' as default
      const marketType = (account.account as { type?: string })?.type || "spot";
      setSelectedMarket(marketType);
    }
  }, [selectedNid, exchangeAccounts]);

  // Load market types when account is selected (v2.13.0)
  useEffect(() => {
    if (!connectionSession || !selectedNid) return;
    getAccountMarketTypes({ accountId: selectedNid });
  }, [connectionSession, selectedNid, getAccountMarketTypes]);

  // Load data when account is selected
  useEffect(() => {
    if (!connectionSession || !selectedNid) return;

    getBalance({ nid: selectedNid });
    listOrders({ nid: selectedNid });
    listTrades({ nid: selectedNid });
  }, [connectionSession, selectedNid, getBalance, listOrders, listTrades]);

  // Load positions when accountId is available and method is supported
  useEffect(() => {
    if (!connectionSession || !selectedAccountId) return;
    if (availableMethods.length > 0 && availableMethods.includes("fetchPositions")) {
      fetchPositions({ accountId: selectedAccountId });
    }
  }, [connectionSession, selectedAccountId, availableMethods, fetchPositions]);

  // Refresh all data
  const handleRefresh = useCallback(() => {
    if (!selectedNid) return;

    getBalance({ nid: selectedNid });
    listOrders({ nid: selectedNid });
    listTrades({ nid: selectedNid });

    if (selectedAccountId && availableMethods.includes("fetchPositions")) {
      fetchPositions({ accountId: selectedAccountId });
    }
  }, [selectedNid, selectedAccountId, availableMethods, getBalance, listOrders, listTrades, fetchPositions]);

  // Handle symbol selection from watchlist
  const handleSymbolSelect = useCallback((symbol: string, exchange: string, market: string) => {
    setSelectedSymbol(symbol);
    setSelectedExchange(exchange);
    setSelectedMarket(market);
  }, []);

  // Handle price click from order book - fills order form
  const handleOrderBookPriceClick = useCallback((price: number) => {
    setOrderFormPrice(price.toString());
  }, []);

  // Check if feature is available for current market type
  const hasFeature = useCallback((method: string) => {
    return availableMethods.includes(method);
  }, [availableMethods]);

  const isLoading = balanceLoading || ordersLoading || positionsLoading || marketTypesLoading;

  // Format large numbers
  const formatVolume = (vol: number | undefined) => {
    if (!vol) return "-";
    if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(2) + "B";
    if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + "M";
    if (vol >= 1_000) return (vol / 1_000).toFixed(2) + "K";
    return vol.toFixed(2);
  };

  if (!connectionSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please connect to use trading features</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ==================== HEADER BAR ==================== */}
      <header className={cn(
        "flex items-center gap-1 px-3 h-12 border-b shrink-0 sticky top-0 z-20",
        "bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80",
        "transition-all duration-300"
      )}>
        {/* Symbol Selector */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-base font-bold gap-1.5 hover:bg-muted/80 rounded-lg"
          onClick={() => setSymbolSearchOpen(true)}
        >
          <span className="text-lg">{selectedSymbol}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>

        {/* Price & Change with Mini Sparkline */}
        {headerTicker && (
          <>
            <div className="w-px h-8 bg-border/50 mx-2" />
            <div className="flex items-center gap-3 px-2">
              {/* Mini Sparkline Chart */}
              {sparklineData.length > 1 && (
                <MiniSparkline 
                  data={sparklineData} 
                  width={50} 
                  height={24}
                  positive={(headerTicker.percentage ?? 0) >= 0}
                  className="opacity-80"
                />
              )}
              <div className="flex flex-col">
                <span className={cn(
                  "text-xl font-bold font-mono transition-colors",
                  (headerTicker.percentage ?? 0) >= 0 ? "text-trading-buy" : "text-trading-sell"
                )}>
                  {headerTicker.last?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ≈ ${headerTicker.last?.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "h-7 px-2.5 text-xs font-semibold border-0 rounded-md transition-all",
                  (headerTicker.percentage ?? 0) >= 0
                    ? "bg-trading-buy/15 text-trading-buy shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                    : "bg-trading-sell/15 text-trading-sell shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                )}
              >
                {(headerTicker.percentage ?? 0) >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 mr-1" />
                )}
                {(headerTicker.percentage ?? 0) >= 0 ? "+" : ""}
                {headerTicker.percentage?.toFixed(2)}%
              </Badge>
            </div>
          </>
        )}

        {/* Market Stats */}
        {headerTicker && (
          <>
            <div className="w-px h-8 bg-border/50 mx-2" />
            <div className="flex items-center gap-5 px-2 text-xs">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Bid</span>
                <span className="font-mono font-medium text-trading-buy">{headerTicker.bid?.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Ask</span>
                <span className="font-mono font-medium text-trading-sell">{headerTicker.ask?.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Change</span>
                <span className={cn(
                  "font-mono font-medium",
                  (headerTicker.change ?? 0) >= 0 ? "text-trading-buy" : "text-trading-sell"
                )}>
                  {(headerTicker.change ?? 0) >= 0 ? "+" : ""}{headerTicker.change?.toFixed(2) ?? "-"}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">24h Vol</span>
                <span className="font-mono font-medium">{formatVolume(headerTicker.baseVolume)}</span>
              </div>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Account Selector */}
        <Select value={selectedNid} onValueChange={setSelectedNid}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            {exchangeAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.account.nid} className="text-xs">
                {acc.account.nid} ({acc.account.exchange})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Market Type Selector (v2.13.0) */}
        {marketTypes.length > 1 && (
          <Select
            value={selectedMarketType || ""}
            onValueChange={(v) => v && setSelectedMarketType(v as "spot" | "linear" | "inverse" | "option")}
          >
            <SelectTrigger className="w-[90px] h-8 text-xs">
              <SelectValue placeholder="Market" />
            </SelectTrigger>
            <SelectContent>
              {marketTypes.map((mt) => (
                <SelectItem key={mt.type} value={mt.type} className="text-xs">
                  {mt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Leverage Button (futures only) */}
        {hasFeature("setLeverage") && currentLeverage && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold"
            onClick={() => setLeverageDialogOpen(true)}
            disabled={!selectedAccountId}
          >
            <Gauge className="h-3.5 w-3.5 mr-1" />
            {currentLeverage}x
          </Button>
        )}

        {/* Action Buttons */}
        <div className="w-px h-8 bg-border/50 mx-2" />
        <div className="flex items-center gap-0.5">
          {/* Layout Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showOrderBook ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={toggleOrderBook}
              >
                <PanelLeftClose className={cn("h-4 w-4", !showOrderBook && "opacity-50")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Order Book</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showOrderForm ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={toggleOrderForm}
              >
                <PanelRightClose className={cn("h-4 w-4", !showOrderForm && "opacity-50")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle Order Form</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isChartFullscreen ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={toggleChartFullscreen}
              >
                {isChartFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isChartFullscreen ? "Exit Fullscreen" : "Fullscreen Chart"}
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border/50 mx-1" />

          {/* Hotkeys */}
          <HotkeysDialog
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <Keyboard className="h-4 w-4" />
              </Button>
            }
          />

          {/* Advanced Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={!selectedAccountId}>
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {hasFeature("setLeverage") && (
                <DropdownMenuItem onClick={() => setLeverageDialogOpen(true)} className="text-xs">
                  <Gauge className="h-3.5 w-3.5 mr-2" />
                  Set Leverage
                </DropdownMenuItem>
              )}
              {hasFeature("transferFunds") && (
                <DropdownMenuItem onClick={() => setTransferDialogOpen(true)} className="text-xs">
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                  Transfer Funds
                </DropdownMenuItem>
              )}
              {(hasFeature("setLeverage") || hasFeature("transferFunds")) && hasFeature("createBatchOrders") && (
                <DropdownMenuSeparator />
              )}
              {hasFeature("createBatchOrders") && (
                <DropdownMenuItem onClick={() => setBatchOrderDialogOpen(true)} className="text-xs">
                  <Layers className="h-3.5 w-3.5 mr-2" />
                  Batch Orders
                </DropdownMenuItem>
              )}
              {hasFeature("createConditionalOrder") && (
                <DropdownMenuItem onClick={() => setConditionalOrderDialogOpen(true)} className="text-xs">
                  <Zap className="h-3.5 w-3.5 mr-2" />
                  Conditional Order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={handleRefresh}
            disabled={!selectedNid || isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      {!selectedNid ? (
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium mb-2">Select an Account</p>
              <p className="text-sm text-muted-foreground">
                Choose an exchange account from the header to start trading
              </p>
            </CardContent>
          </Card>
        </div>
      ) : isChartFullscreen ? (
        /* ==================== FULLSCREEN CHART MODE ==================== */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <CandlestickChart
            symbol={selectedSymbol}
            exchange={selectedExchange}
            market={selectedMarket}
            timeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
        </div>
      ) : (
        /* ==================== RESIZABLE LAYOUT ==================== */
        <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
          {/* ==================== MAIN TRADING AREA (TOP) ==================== */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* LEFT: Order Book - min 280px equivalent (~20%) */}
              {showOrderBook && (
                <>
                  <ResizablePanel defaultSize={380} minSize={380} maxSize={380}>
                    <div className="h-full min-w-[280px] flex flex-col overflow-hidden border-r bg-background">
                      <AdvancedOrderBook
                        symbol={selectedSymbol}
                        exchange={selectedExchange}
                        market={selectedMarket}
                        onPriceClick={handleOrderBookPriceClick}
                        maxRows={25}
                      />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/20 transition-colors" />
                </>
              )}

              {/* CENTER: Chart - min 400px equivalent */}
              <ResizablePanel 
                defaultSize={showOrderBook && showOrderForm ? 52 : showOrderBook || showOrderForm ? 76 : 100}
                minSize={30}
              >
                <div className="h-full min-w-[400px] flex flex-col overflow-hidden bg-background">
                  <CandlestickChart
                    symbol={selectedSymbol}
                    exchange={selectedExchange}
                    market={selectedMarket}
                    timeframe={selectedTimeframe}
                    onTimeframeChange={setSelectedTimeframe}
                  />
                </div>
              </ResizablePanel>

              {/* RIGHT: Order Form - min 300px equivalent (~22%) */}
              {showOrderForm && (
                <>
                  <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/20 transition-colors" />
                  <ResizablePanel defaultSize={380} minSize={380} maxSize={380}>
                    <div className="h-full min-w-[300px] flex flex-col overflow-hidden bg-background">
                      <div className="flex-1 min-h-0 overflow-auto px-3 py-2">
                        <OrderForm
                          nid={selectedNid}
                          symbol={selectedSymbol}
                          exchange={selectedExchange}
                          market={selectedMarket}
                          initialPrice={orderFormPrice}
                          onPriceChange={setOrderFormPrice}
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/20 transition-colors" />

          {/* ==================== BOTTOM AREA ==================== */}
          <ResizablePanel defaultSize={45} minSize={20}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* LEFT: Quick Orders + Balance - min 280px */}
              {showOrderBook && (
                <>
                  <ResizablePanel defaultSize={380} minSize={380} maxSize={380}>
                    <div className="h-full min-w-[280px] flex flex-col overflow-hidden border-r bg-background">
                      {/* Quick Order Buttons */}
                      <div className="shrink-0 px-3 py-2 border-b bg-muted/30">
                        <QuickOrderButtons
                          nid={selectedNid}
                          symbol={selectedSymbol}
                          exchange={selectedExchange}
                          market={selectedMarket}
                        />
                      </div>
                      {/* Balance Panel */}
                      <div className="flex-1 min-h-0 overflow-auto">
                        <BalancePanel nid={selectedNid} exchange={selectedExchange} />
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle className="bg-border/50 hover:bg-primary/20 transition-colors" />
                </>
              )}

              {/* RIGHT: Orders/Trades/Positions Tabs */}
              <ResizablePanel defaultSize={showOrderBook ? 76 : 100} minSize={50}>
                <div className="h-full flex flex-col overflow-hidden bg-background">
                  <Tabs value={bottomTab} onValueChange={setBottomTab} className="h-full flex flex-col">
                    {/* Tab Header */}
                    <div className="flex items-center shrink-0 border-b bg-muted/30">
                      <TabsList className="h-8 bg-transparent rounded-none p-0 gap-0">
                        <TabsTrigger 
                          value="orders" 
                          className="h-8 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-medium transition-all"
                        >
                          Orders
                        </TabsTrigger>
                        <TabsTrigger 
                          value="trades" 
                          className="h-8 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-medium transition-all"
                        >
                          Trades
                        </TabsTrigger>
                        {selectedAccountId && hasFeature("fetchPositions") && (
                          <TabsTrigger 
                            value="positions" 
                            className="h-8 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-medium transition-all"
                          >
                            Positions
                          </TabsTrigger>
                        )}
                        <TabsTrigger 
                          value="watchlist" 
                          className="h-8 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-medium transition-all"
                        >
                          Watchlist
                        </TabsTrigger>
                        <TabsTrigger 
                          value="alerts" 
                          className="h-8 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-medium transition-all"
                        >
                          Alerts
                        </TabsTrigger>
                        <TabsTrigger 
                          value="pnl" 
                          className="h-8 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-medium transition-all"
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          P&L
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <TabsContent value="orders" className="h-full m-0 overflow-auto">
                        <OrderList nid={selectedNid} type="orders" />
                      </TabsContent>
                      <TabsContent value="trades" className="h-full m-0 overflow-auto">
                        <OrderList nid={selectedNid} type="trades" />
                      </TabsContent>
                      {selectedAccountId && hasFeature("fetchPositions") && (
                        <TabsContent value="positions" className="h-full m-0 overflow-auto">
                          <PositionsPanel accountId={selectedAccountId} symbol={selectedSymbol} />
                        </TabsContent>
                      )}
                      <TabsContent value="watchlist" className="h-full m-0 overflow-auto">
                        <Watchlist
                          onSymbolSelect={handleSymbolSelect}
                          currentSymbol={selectedSymbol}
                        />
                      </TabsContent>
                      <TabsContent value="alerts" className="h-full m-0 overflow-auto">
                        <AlertsPanel
                          symbol={selectedSymbol}
                          exchange={selectedExchange}
                          market={selectedMarket}
                        />
                      </TabsContent>
                      <TabsContent value="pnl" className="h-full m-0 overflow-auto">
                        <PnLPanel showChart={false} />
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {/* ==================== DIALOGS ==================== */}
      {selectedAccountId && (
        <>
          <LeverageDialog
            open={leverageDialogOpen}
            onOpenChange={setLeverageDialogOpen}
            accountId={selectedAccountId}
            symbol={selectedSymbol}
            currentLeverage={currentLeverage || 1}
          />
          <TransferDialog
            open={transferDialogOpen}
            onOpenChange={setTransferDialogOpen}
            accountId={selectedAccountId}
          />
          <BatchOrderDialog
            open={batchOrderDialogOpen}
            onOpenChange={setBatchOrderDialogOpen}
            accountId={selectedAccountId}
            defaultSymbol={selectedSymbol}
          />
          <ConditionalOrderDialog
            open={conditionalOrderDialogOpen}
            onOpenChange={setConditionalOrderDialogOpen}
            accountId={selectedAccountId}
            defaultSymbol={selectedSymbol}
          />
        </>
      )}

      {/* Symbol Search Dialog */}
      <SymbolSearchDialog
        open={symbolSearchOpen}
        onOpenChange={setSymbolSearchOpen}
        onSelect={handleSymbolSelect}
      />
    </div>
  );
}

export default TradingApp;
