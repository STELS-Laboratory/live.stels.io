/**
 * Market Detail Modal Component
 * Full-screen trading terminal without order controllers
 * Shows chart, order book, and market trades
 */

import React, { lazy, Suspense, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Activity, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeviceType } from "@/hooks/use_mobile";
import {
  useOrderBookFromSession,
  useTickerFromSession,
} from "@/apps/trading/hooks/use-trading-session-data";
import { formatPrice } from "@/apps/trading/lib/formatting";
import { OrderBook } from "@/apps/trading/components/order-book";
import { MarketTrades } from "@/apps/trading/components/market-trades";
import {
  ChartSkeleton,
  OrderBookSkeleton,
} from "@/apps/trading/components/skeleton-loaders";
import { useTradingStore } from "@/apps/trading/store";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  getFirstLetter,
  importCoinIcon,
  importExchangeIcon,
} from "@/lib/icon-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Lazy load heavy chart component
const TradingChart = lazy(() =>
  import("@/apps/trading/components/trading-chart").then((module) => ({
    default: module.TradingChart,
  }))
);

interface MarketDetailModalProps {
  market: string;
  exchange: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Market Detail Modal Component
 */
export function MarketDetailModal({
  market,
  exchange,
  open,
  onOpenChange,
}: MarketDetailModalProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>("orderbook");
  const { isMobile, isTablet } = useDeviceType();

  // Get market data from session
  const ticker = useTickerFromSession(market, exchange);
  const orderBook = useOrderBookFromSession(market, exchange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "p-0 gap-0 m-0",
          "w-screen h-screen",
          "max-w-screen max-h-screen",
          "sm:max-w-screen sm:max-h-screen",
          "rounded-none border-0",
          "fixed bottom-0 left-0 right-0 top-0",
          "translate-x-0 translate-y-0",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "duration-200",
        )}
        style={{
          maxWidth: "100vw",
          maxHeight: "100vh",
          width: "100vw",
          height: "100vh",
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Market Terminal - {market}</DialogTitle>
          <DialogDescription>
            Full-screen trading terminal for {market} on {exchange}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-full w-full bg-background overflow-hidden">
          {/* Terminal Header */}
          <div className="flex-shrink-0 border-b border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center justify-between px-2 sm:px-4 py-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Coin Icon */}
                {(() => {
                  const baseCurrency = market.split("/")[0] || "";
                  const coinIcon = importCoinIcon(baseCurrency);
                  const firstLetter = getFirstLetter(baseCurrency);
                  return (
                    <div
                      className={cn(
                        "relative flex-shrink-0",
                        isMobile ? "w-5 h-5" : "w-6 h-6",
                      )}
                    >
                      {coinIcon
                        ? (
                          <img
                            src={coinIcon}
                            alt={baseCurrency}
                            className={cn(
                              "rounded-full object-cover",
                              isMobile ? "w-5 h-5" : "w-6 h-6",
                            )}
                            onError={(e) => {
                              // Show fallback on error
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback = target
                                .nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                        )
                        : null}
                      <div
                        className={cn(
                          "rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground",
                          isMobile ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-xs",
                          coinIcon ? "hidden" : "flex",
                        )}
                      >
                        {firstLetter}
                      </div>
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "font-bold text-foreground uppercase tracking-wider truncate",
                      isMobile ? "text-sm" : "text-lg",
                    )}
                  >
                    {market}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                    {/* Exchange Icon */}
                    {(() => {
                      const exchangeIcon = importExchangeIcon(exchange);
                      const firstLetter = getFirstLetter(exchange);
                      return (
                        <div
                          className={cn(
                            "relative flex-shrink-0",
                            isMobile ? "w-3.5 h-3.5" : "w-4 h-4",
                          )}
                        >
                          {exchangeIcon
                            ? (
                              <img
                                src={exchangeIcon}
                                alt={exchange}
                                className={cn(
                                  "rounded object-cover",
                                  isMobile ? "w-3.5 h-3.5" : "w-4 h-4",
                                )}
                                onError={(e) => {
                                  // Show fallback on error
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const fallback = target
                                    .nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            )
                            : null}
                          <div
                            className={cn(
                              "rounded bg-muted flex items-center justify-center font-semibold text-muted-foreground",
                              isMobile
                                ? "w-3.5 h-3.5 text-[7px]"
                                : "w-4 h-4 text-[8px]",
                              exchangeIcon ? "hidden" : "flex",
                            )}
                          >
                            {firstLetter}
                          </div>
                        </div>
                      );
                    })()}
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono flex-shrink-0",
                        isMobile ? "text-[10px] px-1 py-0" : "text-xs",
                      )}
                    >
                      {exchange.toUpperCase()}
                    </Badge>
                    {ticker && (
                      <span
                        className={cn(
                          "font-bold font-mono flex-shrink-0",
                          isMobile ? "text-xs" : "text-sm",
                          ticker.change >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {formatPrice(ticker.last)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className={cn(
                  "hover:bg-muted rounded transition-colors flex-shrink-0",
                  isMobile ? "p-1.5" : "p-2",
                )}
                aria-label="Close"
              >
                <X className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
              </button>
            </div>
          </div>

          {/* Main Terminal Layout */}
          <div
            className={cn(
              "flex-1 w-full h-full overflow-hidden min-h-0",
              isMobile || isTablet ? "flex-col" : "flex",
            )}
          >
            {/* Chart Area */}
            <div
              className={cn(
                "flex relative w-full min-h-0",
                isMobile || isTablet
                  ? "h-[50vh] border-b border-border flex-shrink-0"
                  : "flex-[2] h-full border-r border-border",
              )}
            >
              <Suspense fallback={<ChartSkeleton />}>
                <MarketChartWrapper
                  symbol={market}
                  exchange={exchange}
                />
              </Suspense>
            </div>

            {/* Side Panel */}
            <div
              className={cn(
                "overflow-hidden bg-card flex min-h-0",
                isMobile || isTablet
                  ? "w-full flex-[1] flex-col border-t border-border"
                  : "w-1/3 h-full border-l flex-row",
              )}
            >
              {/* Icon Tabs - Vertical on desktop, horizontal on mobile */}
              <TooltipProvider delayDuration={300}>
                <div
                  className={cn(
                    "flex items-center gap-1 bg-muted/20 flex-shrink-0",
                    isMobile || isTablet
                      ? "flex-row border-b border-border p-1.5 justify-around"
                      : "flex-col border-r border-border p-2",
                  )}
                >
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setActiveTab("orderbook")}
                        className={cn(
                          "rounded transition-colors",
                          isMobile || isTablet ? "p-2 flex-1" : "p-2",
                          activeTab === "orderbook"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground",
                        )}
                      >
                        <BookOpen
                          className={cn(
                            isMobile || isTablet
                              ? "h-4 w-4 mx-auto"
                              : "h-5 w-5",
                          )}
                        />
                        {(isMobile || isTablet) && (
                          <span className="text-[10px] font-medium mt-0.5 block">
                            Order Book
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {!(isMobile || isTablet) && (
                      <TooltipContent side="right">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">Order Book</span>
                          <span className="text-xs text-muted-foreground">
                            View real-time order book with bids and asks
                          </span>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>

                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setActiveTab("market-trades")}
                        className={cn(
                          "rounded transition-colors",
                          isMobile || isTablet ? "p-2 flex-1" : "p-2",
                          activeTab === "market-trades"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-muted-foreground",
                        )}
                      >
                        <Activity
                          className={cn(
                            isMobile || isTablet
                              ? "h-4 w-4 mx-auto"
                              : "h-5 w-5",
                          )}
                        />
                        {(isMobile || isTablet) && (
                          <span className="text-[10px] font-medium mt-0.5 block">
                            Trades
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {!(isMobile || isTablet) && (
                      <TooltipContent side="right">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">Market Trades</span>
                          <span className="text-xs text-muted-foreground">
                            Recent market trades and transaction history
                          </span>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </TooltipProvider>

              {/* Content Area */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  defaultValue="orderbook"
                  className="h-full w-full flex flex-col"
                >
                  <TabsContent
                    value="orderbook"
                    className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 m-0"
                  >
                    {!orderBook || !market
                      ? <OrderBookSkeleton />
                      : (
                        <MarketOrderBookWrapper
                          symbol={market}
                          exchange={exchange}
                          orderBook={orderBook}
                        />
                      )}
                  </TabsContent>

                  <TabsContent
                    value="market-trades"
                    className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 m-0"
                  >
                    <MarketTradesWrapper
                      symbol={market}
                      exchange={exchange}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Market Chart Wrapper
 * Temporarily sets symbol and exchange in store for chart component
 */
function MarketChartWrapper({
  symbol,
  exchange,
}: {
  symbol: string;
  exchange: string;
}): React.ReactElement {
  const { setSelectedSymbol, setSelectedExchange, setTicker } =
    useTradingStore();
  const ticker = useTickerFromSession(symbol, exchange);

  // Set symbol and exchange immediately on mount (synchronously)
  React.useLayoutEffect(() => {
    setSelectedSymbol(symbol);
    setSelectedExchange(exchange);
    if (ticker) {
      setTicker(ticker);
    }
  }, [
    symbol,
    exchange,
    ticker,
    setSelectedSymbol,
    setSelectedExchange,
    setTicker,
  ]);

  // Update ticker when it changes
  React.useEffect(() => {
    if (ticker) {
      setTicker(ticker);
    }
  }, [ticker, setTicker]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      setSelectedSymbol(null);
      setSelectedExchange(null);
      setTicker(null);
    };
  }, [setSelectedSymbol, setSelectedExchange, setTicker]);

  return <TradingChart />;
}

/**
 * Market Order Book Wrapper
 */
function MarketOrderBookWrapper({
  symbol,
  exchange,
  orderBook,
}: {
  symbol: string;
  exchange: string;
  orderBook: unknown;
}): React.ReactElement {
  const { setSelectedSymbol, setSelectedExchange, setOrderBook } =
    useTradingStore();

  React.useEffect(() => {
    setSelectedSymbol(symbol);
    setSelectedExchange(exchange);
    if (orderBook) {
      setOrderBook(orderBook as never);
    }
    return () => {
      setSelectedSymbol(null);
      setSelectedExchange(null);
      setOrderBook(null);
    };
  }, [
    symbol,
    exchange,
    orderBook,
    setSelectedSymbol,
    setSelectedExchange,
    setOrderBook,
  ]);

  return <OrderBook />;
}

/**
 * Market Trades Wrapper
 */
function MarketTradesWrapper({
  symbol,
  exchange,
}: {
  symbol: string;
  exchange: string;
}): React.ReactElement {
  const { setSelectedSymbol, setSelectedExchange } = useTradingStore();

  React.useEffect(() => {
    setSelectedSymbol(symbol);
    setSelectedExchange(exchange);
    return () => {
      setSelectedSymbol(null);
      setSelectedExchange(null);
    };
  }, [symbol, exchange, setSelectedSymbol, setSelectedExchange]);

  return <MarketTrades />;
}
