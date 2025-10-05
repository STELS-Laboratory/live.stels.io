import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Убрали Tabs компоненты, используем обычные кнопки
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import OrderBookWidget from "@/components/widgets/OrderBook";
//import AggregatedCandles from "@/components/widgets/AggregatedCandles";
import {
  Activity,
  ArrowDownUp,
  BarChart3,
  Clock,
  RefreshCcw,
  Scale,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import { filterSession } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import exchange and currency icons
import BinanceIcon from "@/assets/icons/exchanges/BINANCE.png";
import BybitIcon from "@/assets/icons/exchanges/BYBIT.png";
import OkxIcon from "@/assets/icons/exchanges/OKX.png";
import CoinbaseIcon from "@/assets/icons/exchanges/COINBASE.png";
import HtxIcon from "@/assets/icons/exchanges/HTX.png";
import KucoinIcon from "@/assets/icons/exchanges/KUCOIN.png";
import GateIcon from "@/assets/icons/exchanges/GATE.png";
import BitgetIcon from "@/assets/icons/exchanges/BITGET.png";
import UpbitIcon from "@/assets/icons/exchanges/UPBIT.png";
import BitstampIcon from "@/assets/icons/exchanges/BITSTAMP.png";
import CryptocomIcon from "@/assets/icons/exchanges/CRYPTOCOM.png";
import BitfinexIcon from "@/assets/icons/exchanges/BITFINEX.png";
import KrakenIcon from "@/assets/icons/exchanges/KRAKEN.png";

import BTCIcon from "@/assets/icons/coins/BTC.png";
import ETHIcon from "@/assets/icons/coins/ETH.png";
import SOLIcon from "@/assets/icons/coins/SOL.png";
import TRXIcon from "@/assets/icons/coins/TRX.png";
import XRPIcon from "@/assets/icons/coins/XRP.png";
import BNBIcon from "@/assets/icons/coins/BNB.png";
import JASMYIcon from "@/assets/icons/coins/JASMY.png";

interface OrderBookDataRaw {
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

interface OrderBookData {
  exchange: string;
  market: string;
  bids: [number, number][];
  asks: [number, number][];
  volume: [number, number];
  timestamp: number;
  latency: number;
}

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  exchange: string;
  market: string;
}

interface TickerData {
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

interface AggregatedOrderBook {
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

interface BookMetrics {
  imbalance: number;
  depthRatio: number;
  vwap: number;
  priceVelocity: number;
  volatility: number;
  largeOrders: number;
}

const OrderBook: React.FC = React.memo(() => {
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [metrics, setMetrics] = useState<BookMetrics>({
    imbalance: 0,
    depthRatio: 0,
    vwap: 0,
    priceVelocity: 0,
    volatility: 0,
    largeOrders: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [showScales, setShowScales] = useState(true);
  const [selectedExchange, setSelectedExchange] = useState<string>("");
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  // Get session data
  const session = useSessionStoreSync() as Record<string, unknown> | null;

  // Get all data types
  const spotBooksRaw = filterSession(
    session || {},
    /\.spot\..*\.book$/,
  ) as OrderBookDataRaw[];

  const spotCandlesRaw = filterSession(
    session || {},
    /\.spot\..*\.candles$/,
  ) as any[];

  const spotTickersRaw = filterSession(
    session || {},
    /\.spot\..*\.ticker$/,
  ) as any[];

  // Transform session data
  const orderBookData: OrderBookData[] = useMemo(() => {
    return spotBooksRaw.map((item) => {
      const raw = item.value.raw;
      return {
        exchange: raw.exchange,
        market: raw.market,
        bids: raw.bids,
        asks: raw.asks,
        volume: raw.volume,
        timestamp: raw.timestamp,
        latency: raw.latency,
      };
    });
  }, [spotBooksRaw]);

  const candlesData: CandleData[] = useMemo(() => {
    const result = spotCandlesRaw.flatMap((item) => {
      const raw = item.value.raw;
      return raw.candles.map((c: number[]) => ({
        timestamp: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
        exchange: raw.exchange, // Add exchange info
        market: raw.market, // Add market info
      }));
    });

    return result;
  }, [spotCandlesRaw]);

  const tickersData: TickerData[] = useMemo(() => {
    return spotTickersRaw.map((item) => {
      const raw = item.value.raw;
      return {
        exchange: raw.exchange,
        market: raw.market,
        last: raw.last,
        bid: raw.bid || 0,
        ask: raw.ask || 0,
        change: raw.change || 0,
        percentage: raw.percentage || 0,
        baseVolume: raw.baseVolume || 0,
        quoteVolume: raw.quoteVolume || 0,
        timestamp: raw.timestamp,
        latency: raw.latency,
      };
    });
  }, [spotTickersRaw]);

  const getExchangeIcon = React.useCallback(
    (exchange: string): string | null => {
      const exchangeIconMap: { [key: string]: string } = {
        binance: BinanceIcon,
        bybit: BybitIcon,
        okx: OkxIcon,
        coinbase: CoinbaseIcon,
        htx: HtxIcon,
        kucoin: KucoinIcon,
        gate: GateIcon,
        bitget: BitgetIcon,
        upbit: UpbitIcon,
        bitstamp: BitstampIcon,
        cryptocom: CryptocomIcon,
        bitfinex: BitfinexIcon,
        kraken: KrakenIcon,
      };
      return exchangeIconMap[exchange.toLowerCase()] || null;
    },
    [],
  );

  const getCurrencyIcon = React.useCallback((symbol: string): string | null => {
    const currencyIconMap: { [key: string]: string } = {
      BTC: BTCIcon,
      ETH: ETHIcon,
      SOL: SOLIcon,
      TRX: TRXIcon,
      XRP: XRPIcon,
      BNB: BNBIcon,
      JASMY: JASMYIcon,
    };
    return currencyIconMap[symbol] || null;
  }, []);

  const getExchangeColor = (_exchange: string): string => {
    // Используем единую цветовую схему приложения - zinc/amber
    return "from-amber-400 to-amber-600";
  };

  const availableMarkets = useMemo(() => {
    if (orderBookData.length === 0) return ["SOL/USDT"]; // Default fallback
    const markets = [...new Set(orderBookData.map((item) => item.market))];
    const sortedMarkets = markets.sort();

    // Убеждаемся что SOL/USDT всегда первый, если он есть
    if (sortedMarkets.includes("SOL/USDT")) {
      return [
        "SOL/USDT",
        ...sortedMarkets.filter((market) => market !== "SOL/USDT"),
      ];
    }

    return sortedMarkets;
  }, [orderBookData]);

  // Update selected market - устанавливаем SOL/USDT как приоритетную вкладку
  React.useEffect(() => {
    if (availableMarkets.length > 0 && !selectedMarket) {
      // Приоритет SOL/USDT, если доступен
      const defaultMarket = availableMarkets.includes("SOL/USDT")
        ? "SOL/USDT"
        : availableMarkets[0];

      setSelectedMarket(defaultMarket);
    }
  }, [availableMarkets, selectedMarket]);

  const aggregatedOrderBooks = useMemo(() => {
    const result: { [market: string]: AggregatedOrderBook } = {};

    availableMarkets.forEach((market) => {
      const marketData = orderBookData.filter((item) => item.market === market);

      const exchanges: { [exchange: string]: any } = {};
      let totalBidLiquidity = 0;
      let totalAskLiquidity = 0;

      marketData.forEach((item) => {
        const bidLiquidity = item.bids.reduce(
          (sum, [price, volume]) => sum + (price * volume),
          0,
        );
        const askLiquidity = item.asks.reduce(
          (sum, [price, volume]) => sum + (price * volume),
          0,
        );
        const totalLiquidity = bidLiquidity + askLiquidity;

        exchanges[item.exchange] = {
          bids: item.bids,
          asks: item.asks,
          volume: item.volume,
          latency: item.latency,
          bidLiquidity,
          askLiquidity,
          totalLiquidity,
        };

        totalBidLiquidity += bidLiquidity;
        totalAskLiquidity += askLiquidity;
      });

      // Aggregate all bids and asks
      const allBids: { [price: number]: number } = {};
      const allAsks: { [price: number]: number } = {};

      marketData.forEach((item) => {
        item.bids.forEach(([price, volume]) => {
          allBids[price] = (allBids[price] || 0) + volume;
        });
        item.asks.forEach(([price, volume]) => {
          allAsks[price] = (allAsks[price] || 0) + volume;
        });
      });

      const aggregatedBids = Object.entries(allBids)
        .map(([price, volume]) =>
          [parseFloat(price), volume] as [number, number]
        )
        .sort((a, b) => b[0] - a[0])
        .slice(0, 10);

      const aggregatedAsks = Object.entries(allAsks)
        .map(([price, volume]) =>
          [parseFloat(price), volume] as [number, number]
        )
        .sort((a, b) => a[0] - b[0])
        .slice(0, 10);

      // Calculate exchange ranking
      const exchangeRanking = Object.entries(exchanges)
        .map(([exchange, data]) => ({
          exchange,
          liquidity: data.totalLiquidity,
          percentage: (totalBidLiquidity + totalAskLiquidity) > 0
            ? (data.totalLiquidity / (totalBidLiquidity + totalAskLiquidity)) *
              100
            : 0,
        }))
        .sort((a, b) => b.liquidity - a.liquidity);

      const dominantExchange = exchangeRanking[0]?.exchange || "";

      result[market] = {
        market,
        exchanges,
        aggregatedBids,
        aggregatedAsks,
        totalBidLiquidity,
        totalAskLiquidity,
        dominantExchange,
        exchangeRanking,
      };
    });

    return result;
  }, [orderBookData, availableMarkets]);

  const currentOrderBook = React.useMemo(() => {
    return aggregatedOrderBooks[selectedMarket] || null;
  }, [aggregatedOrderBooks, selectedMarket]);

  const formatPrice = React.useCallback((price: number): string => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  }, []);

  const formatVolume = React.useCallback((volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toFixed(2);
  }, []);

  // Мемоизированные данные для рынков
  const marketData = React.useMemo(() => {
    const data: {
      [market: string]: { price: number | null; latency: number };
    } = {};

    availableMarkets.forEach((market) => {
      // Цена из ticker данных
      const marketTicker = tickersData.find((ticker) =>
        ticker.market === market
      );
      const price = marketTicker ? marketTicker.last : null;

      // Задержка из order book данных
      const marketOrderBooks = orderBookData.filter((item) =>
        item.market === market
      );
      const latency = marketOrderBooks.length > 0
        ? Math.round(
          marketOrderBooks.reduce((sum, item) => sum + item.latency, 0) /
            marketOrderBooks.length,
        )
        : 0;

      data[market] = { price, latency };
    });

    return data;
  }, [availableMarkets, tickersData, orderBookData]);

  // Оптимизированные функции для получения данных
  const getMarketPrice = React.useCallback((market: string): number | null => {
    return marketData[market]?.price || null;
  }, [marketData]);

  const getMarketLatency = React.useCallback((market: string): number => {
    return marketData[market]?.latency || 0;
  }, [marketData]);

  // Мемоизированный компонент вкладки
  const TabButton = React.memo(({
    market,
    isSelected,
    onClick,
  }: {
    market: string;
    isSelected: boolean;
    onClick: () => void;
  }) => {
    const symbol = market.split("/")[0];
    const price = getMarketPrice(market);
    const latency = getMarketLatency(market);

    return (
      <button
        onClick={onClick}
        className={`flex gap-6 px-4 py-2 min-w-fit flex-shrink-0 border-r ${
          isSelected
            ? "bg-amber-100 text-black"
            : "text-zinc-300 hover:bg-zinc-800"
        }`}
      >
        {getCurrencyIcon(symbol)
          ? (
            <img
              src={getCurrencyIcon(symbol)!}
              alt={symbol}
              className="mt-2 w-5 h-5 rounded-full shadow-sm"
            />
          )
          : (
            <div className="w-5 h-5 bg-amber-500 flex items-center justify-center text-black text-xs font-bold">
              {symbol.slice(0, 2)}
            </div>
          )}
        <div className="flex flex-col items-start">
          <span className="font-medium tracking-wide text-sm">
            {market}
          </span>
          <div className="flex items-center gap-2 text-xs">
            {price && (
              <span
                className={`font-mono ${
                  isSelected ? "text-black" : "text-amber-500"
                }`}
              >
                ${formatPrice(price)}
              </span>
            )}
            {latency > 0 && (
              <>
                <span className="text-zinc-400">•</span>
                <span
                  className={`font-mono w-8 ${
                    latency < 1000
                      ? "text-green-500"
                      : latency < 3000
                      ? "text-amber-600"
                      : "text-red-500"
                  }`}
                >
                  live
                </span>
              </>
            )}
          </div>
        </div>
      </button>
    );
  });

  // Function to open exchange details modal
  const openExchangeDetails = (exchange: string) => {
    setSelectedExchange(exchange);
    setIsExchangeModalOpen(true);
  };

  // Calculate time since last update - memoized to prevent excessive recalculations
  const timeSinceUpdate = useMemo(() => {
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    return seconds < 60
      ? `${seconds}s ago`
      : `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
  }, [lastUpdate]);

  // Дебаунс для обновления времени - обновляем каждые 5 секунд
  const [displayTime, setDisplayTime] = useState(timeSinceUpdate);
  React.useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
      const newTime = seconds < 60
        ? `${seconds}s ago`
        : `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
      setDisplayTime(newTime);
    }, 5000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Calculate metrics for current order book - memoized to prevent infinite loops
  const calculatedMetrics = React.useMemo(() => {
    if (!currentOrderBook) {
      return {
        imbalance: 0,
        depthRatio: 0,
        vwap: 0,
        priceVelocity: 0,
        volatility: 0,
        largeOrders: 0,
      };
    }

    const bidVolume = currentOrderBook.aggregatedBids.reduce(
      (sum, [_, vol]) => sum + vol,
      0,
    );
    const askVolume = currentOrderBook.aggregatedAsks.reduce(
      (sum, [_, vol]) => sum + vol,
      0,
    );

    // Volume imbalance - защита от деления на ноль
    const totalVolume = bidVolume + askVolume;
    const imbalance = totalVolume > 0
      ? (bidVolume - askVolume) / totalVolume
      : 0;

    // Depth ratio - защита от деления на ноль
    const depthRatio = askVolume > 0
      ? bidVolume / askVolume
      : bidVolume > 0
      ? 999.99
      : 0; // Ограничиваем максимальное значение

    // VWAP calculation - защита от деления на ноль
    const totalVwap = totalVolume > 0
      ? [...currentOrderBook.aggregatedBids, ...currentOrderBook.aggregatedAsks]
        .reduce((sum, [price, vol]) => sum + price * vol, 0) / totalVolume
      : 0;

    // Large orders detection - защита от пустых массивов
    const bidVolumes = currentOrderBook.aggregatedBids.map(([, vol]) => vol);
    const askVolumes = currentOrderBook.aggregatedAsks.map(([, vol]) => vol);
    const allVolumes = [...bidVolumes, ...askVolumes];
    const maxVolume = allVolumes.length > 0 ? Math.max(...allVolumes) : 0;
    const largeOrderThreshold = maxVolume * 0.4;
    const largeOrders =
      [...currentOrderBook.aggregatedBids, ...currentOrderBook.aggregatedAsks]
        .filter((
          [_, vol],
        ) => vol > largeOrderThreshold).length;

    return {
      imbalance,
      depthRatio,
      vwap: totalVwap,
      priceVelocity: 0, // Would need previous data to calculate
      volatility: 0, // Would need previous data to calculate
      largeOrders,
    };
  }, [currentOrderBook]);

  // Update metrics when calculated metrics change - with deep comparison
  React.useEffect(() => {
    setMetrics((prevMetrics) => {
      // Only update if metrics actually changed
      if (
        prevMetrics.imbalance !== calculatedMetrics.imbalance ||
        prevMetrics.depthRatio !== calculatedMetrics.depthRatio ||
        prevMetrics.vwap !== calculatedMetrics.vwap ||
        prevMetrics.largeOrders !== calculatedMetrics.largeOrders
      ) {
        return calculatedMetrics;
      }
      return prevMetrics;
    });
  }, [calculatedMetrics]);

  return (
    <div className="space-y-1">
      {orderBookData.length === 0
        ? (
          <Card className="bg-zinc-900 border ">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Order Book Data
                </h3>
                <p className="text-muted-foreground">
                  Waiting for order book data from exchanges...
                </p>
              </div>
            </CardContent>
          </Card>
        )
        : currentOrderBook
        ? (
          <>
            {/* Market Overview */}
            <Card className="bg-zinc-900 border">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getCurrencyIcon(selectedMarket.split("/")[0])
                    ? (
                      <img
                        src={getCurrencyIcon(selectedMarket.split("/")[0])!}
                        alt={selectedMarket.split("/")[0]}
                        className="w-8 h-8 rounded-full"
                      />
                    )
                    : (
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {selectedMarket.split("/")[0].slice(0, 2)}
                      </div>
                    )}
                  {selectedMarket} Market Analysis
                </CardTitle>
                <CardDescription>
                  Liquidity-weighted aggregation across{" "}
                  {Object.keys(currentOrderBook.exchanges).length} exchanges
                  {currentOrderBook.dominantExchange && (
                    <>
                      <br />
                      <span className="text-amber-500 font-semibold">
                        Market Leader: {currentOrderBook.dominantExchange}
                      </span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">
                        Total Bids
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      ${formatVolume(currentOrderBook.totalBidLiquidity)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm font-medium">
                        Total Asks
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-red-500">
                      ${formatVolume(currentOrderBook.totalAskLiquidity)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">
                        Dominant
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getExchangeIcon(currentOrderBook.dominantExchange)
                        ? (
                          <img
                            src={getExchangeIcon(
                              currentOrderBook.dominantExchange,
                            )!}
                            alt={currentOrderBook.dominantExchange}
                            className="w-6 h-6 rounded-full"
                          />
                        )
                        : (
                          <div
                            className={`w-6 h-6 bg-gradient-to-br ${
                              getExchangeColor(
                                currentOrderBook.dominantExchange,
                              )
                            } rounded-full flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {currentOrderBook.dominantExchange.charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      <span className="text-lg font-bold capitalize">
                        {currentOrderBook.dominantExchange}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aggregated Candles Chart */}
            {/*<Card className="bg-zinc-900 border mb-6">*/}
            {/*  <CardHeader>*/}
            {/*    <CardTitle className="flex items-center gap-2">*/}
            {/*      <BarChart3 className="w-5 h-5 text-amber-500" />*/}
            {/*      Professional Price Analysis*/}
            {/*    </CardTitle>*/}
            {/*    <CardDescription>*/}
            {/*      Liquidity-weighted aggregation with fair value calculation and*/}
            {/*      market efficiency metrics*/}
            {/*    </CardDescription>*/}
            {/*  </CardHeader>*/}
            {/*  <CardContent>*/}
            {/*    <AggregatedCandles*/}
            {/*      candlesData={candlesData}*/}
            {/*      orderBookData={orderBookData}*/}
            {/*      selectedMarket={selectedMarket}*/}
            {/*      height={400}*/}
            {/*    />*/}
            {/*  </CardContent>*/}
            {/*</Card>*/}
          </>
        )
        : (
          <Card className="bg-zinc-900 border border-zinc-700">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Data for {selectedMarket}
                </h3>
                <p className="text-muted-foreground">
                  No order book data available for the selected market.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      {/* Optimized Market Tabs with Price and Latency */}
      {availableMarkets.length > 0
        ? (
          <div className="flex border">
            {/* Фиксированная первая вкладка */}
            {availableMarkets.length > 0 && (
              <div className="flex-shrink-0 bg-zinc-800">
                <TabButton
                  market={availableMarkets[0]}
                  isSelected={selectedMarket === availableMarkets[0]}
                  onClick={() => setSelectedMarket(availableMarkets[0])}
                />
              </div>
            )}

            {/* Скроллируемые остальные вкладки */}
            {availableMarkets.length > 1 && (
              <>
                <div className="flex w-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
                  {availableMarkets.slice(1).map((market) => (
                    <TabButton
                      key={market}
                      market={market}
                      isSelected={selectedMarket === market}
                      onClick={() => setSelectedMarket(market)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )
        : (
          <div className="text-center py-2 text-zinc-400">
            <p>Loading markets...</p>
          </div>
        )}

      {/* Optimized Professional Header */}
      <div className="bg-zinc-950 border  overflow-hidden">
        <header className="border-b p-4 bg-zinc-950">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm flex items-center gap-2">
                <div className="h-4 w-1 bg-amber-500 rounded-full"></div>
                <span className="text-amber-500 font-medium tracking-widest uppercase">
                  {selectedMarket}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal h-5 px-2 bg-zinc-900"
                >
                  Stels AI Controlled
                </Badge>
              </h2>
              <div className="flex items-center text-left gap-2 text-[10px] text-zinc-600 mt-1">
                <Clock className="h-3 w-3" />
                <span className="w-18">{new Date().toLocaleTimeString()}</span>
                <span>|</span>
                <span className="flex items-center">
                  <Zap className="h-3 w-3 mr-1 text-amber-500" />
                </span>
                {currentOrderBook &&
                  currentOrderBook.exchangeRanking.length > 0 &&
                  currentOrderBook.exchangeRanking[0].percentage > 40 && (
                  <>
                    <span>|</span>
                    <span className="text-red-500 font-semibold">
                      ⚠️
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right text-[10px]">
              <div className="text-zinc-600 uppercase tracking-wider">
                DATA SOURCES
              </div>
              <div className="font-mono text-amber-500 mt-1">
                {candlesData.length} C / {tickersData.length} T /{" "}
                {orderBookData.length} B
              </div>
            </div>
          </div>
        </header>

        {/* Technical Metrics */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 border-b p-2 bg-zinc-900">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-zinc-950 p-2 border cursor-help">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    IMBALANCE
                  </div>
                  <div className="font-mono flex items-center mt-1 w-full justify-end">
                    {metrics.imbalance > 0
                      ? (
                        <TrendingUp className="h-3 w-3 text-green-400/80 mr-1" />
                      )
                      : (
                        <TrendingDown className="h-3 w-3 text-red-400/80 mr-1" />
                      )}
                    <span
                      className={metrics.imbalance > 0
                        ? "text-green-400/80"
                        : "text-red-400/80"}
                    >
                      {Math.abs(metrics.imbalance * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Difference between buy and sell volume
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-zinc-950 p-2 rounded-lg border cursor-help">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    DEPTH RATIO
                  </div>
                  <div className="flex items-center font-mono text-amber-500 mt-1 w-full justify-end">
                    {metrics.depthRatio.toFixed(2)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Ratio of buy volume to sell volume</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-zinc-950 p-2 rounded-lg border cursor-help">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    VWAP
                  </div>
                  <div className="flex items-center font-mono text-amber-500 mt-1 w-full justify-end">
                    {metrics.vwap.toFixed(2)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Volume-weighted average price</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-zinc-950 p-2 rounded-lg border cursor-help">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    LARGE ORDERS
                  </div>
                  <div className="flex items-center font-mono text-amber-500 mt-1 w-full justify-end">
                    {metrics.largeOrders}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Number of large orders detected</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-zinc-950 p-2 rounded-lg border cursor-help">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    MARKET CONC.
                  </div>
                  <div className="flex items-center font-mono text-amber-500 mt-1 w-full justify-end">
                    {currentOrderBook &&
                        currentOrderBook.exchangeRanking.length > 0
                      ? currentOrderBook.exchangeRanking[0].percentage.toFixed(
                        1,
                      ) + "%"
                      : "0%"}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Market concentration by top exchange</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="bg-zinc-950 p-2 flex flex-col justify-between">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              CONTROLS
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setShowScales(!showScales)}
                className="text-zinc-500 hover:text-amber-500 transition-colors"
                title={showScales ? "Hide scales" : "Show scales"}
              >
                <Scale className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLastUpdate(Date.now())}
                className="text-zinc-500 hover:text-amber-500 transition-colors"
                title="Refresh data"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
        {/* Optimized Order Book */}
        <div className="bg-zinc-900 border  overflow-hidden">
          {/* Spread Information */}
          <div className="flex items-center justify-center gap-2 py-3 border-b border-zinc-800 bg-zinc-950">
            <ArrowDownUp className="h-4 w-4 text-zinc-500" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              SPREAD:
            </span>
            <span className="font-mono font-medium text-amber-500">
              {currentOrderBook && currentOrderBook.aggregatedAsks[0] &&
                  currentOrderBook.aggregatedBids[0]
                ? formatPrice(
                  currentOrderBook.aggregatedAsks[0][0] -
                    currentOrderBook.aggregatedBids[0][0],
                )
                : "N/A"}
            </span>
            <span className="text-zinc-500">|</span>
            <span className="font-mono font-medium text-amber-500">
              {currentOrderBook && currentOrderBook.aggregatedAsks[0] &&
                  currentOrderBook.aggregatedBids[0]
                ? `${
                  currentOrderBook.aggregatedBids[0][0] > 0
                    ? (((currentOrderBook.aggregatedAsks[0][0] -
                      currentOrderBook.aggregatedBids[0][0]) /
                      currentOrderBook.aggregatedBids[0][0]) * 100)
                      .toFixed(4)
                    : "0.0000"
                }%`
                : "N/A"}
            </span>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-6 text-[10px] text-zinc-400 uppercase tracking-wider py-2 px-4 bg-zinc-900 border-b">
            <div className="text-left">AMOUNT</div>
            <div className="text-right col-span-2">PRICE</div>
            <div className="text-left col-span-2">PRICE</div>
            <div className="text-right">AMOUNT</div>
          </div>

          {/* Combined Bids and Asks */}
          <div className="px-2 py-1 bg-zinc-950 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
            {currentOrderBook &&
              Array.from({
                length: Math.max(
                  currentOrderBook.aggregatedBids.length,
                  currentOrderBook.aggregatedAsks.length,
                ),
              })
                .map((_, index) => {
                  const bidVolumes = currentOrderBook.aggregatedBids.map((
                    [, vol],
                  ) => vol);
                  const askVolumes = currentOrderBook.aggregatedAsks.map((
                    [, vol],
                  ) => vol);
                  const maxBidVolume = bidVolumes.length > 0
                    ? Math.max(...bidVolumes)
                    : 0;
                  const maxAskVolume = askVolumes.length > 0
                    ? Math.max(...askVolumes)
                    : 0;
                  const maxVolume = Math.max(maxBidVolume, maxAskVolume);
                  const largeOrderThreshold = maxVolume * 0.4;

                  // Bid data
                  const bidData = index < currentOrderBook.aggregatedBids.length
                    ? currentOrderBook.aggregatedBids[index]
                    : null;
                  const bidTotalVolume = currentOrderBook.aggregatedBids
                    .slice(0, index + 1).reduce(
                      (sum, [, vol]) => sum + vol,
                      0,
                    );
                  const isLargeBid = bidData &&
                    bidData[1] > largeOrderThreshold;

                  // Ask data
                  const askData = index < currentOrderBook.aggregatedAsks.length
                    ? currentOrderBook.aggregatedAsks[index]
                    : null;
                  const askTotalVolume = currentOrderBook.aggregatedAsks
                    .slice(0, index + 1).reduce(
                      (sum, [, vol]) => sum + vol,
                      0,
                    );
                  const isLargeAsk = askData &&
                    askData[1] > largeOrderThreshold;

                  return (
                    <div
                      key={`row-${index}`}
                      className="grid grid-cols-6 h-6 items-center relative my-0.5"
                    >
                      {/* Bid side */}
                      {bidData && (
                        <>
                          <div className="relative font-mono text-green-400 text-[9px] text-left pl-2 flex items-center z-10">
                            {bidData[1].toFixed(3)}
                            {showScales && (
                              <span className="ml-1 text-[7px] text-green-600">
                                Σ{formatVolume(bidTotalVolume)}
                              </span>
                            )}
                          </div>
                          {isLargeBid
                            ? (
                              <div className="col-span-2 flex items-center justify-end z-10">
                                <div className="bg-zinc-800 border border-green-600 rounded-md px-2 mr-2 h-5 flex items-center">
                                  <span className="text-[7px] font-semibold text-amber-500 mr-1">
                                    W
                                  </span>
                                  <span className="text-[7px] text-green-500">
                                    {formatVolume(
                                      bidData[0] * bidData[1],
                                    )}
                                  </span>
                                </div>
                                <div className="font-mono text-[11px] text-green-500 text-right">
                                  {bidData[0].toFixed(2)}
                                </div>
                              </div>
                            )
                            : (
                              <div className="col-span-2 font-mono text-[11px] text-green-500 text-right pr-2 z-10">
                                {bidData[0].toFixed(2)}
                              </div>
                            )}
                          <div
                            className="absolute left-0 h-6 bg-green-500/20 rounded-r-sm"
                            style={{
                              width: `${(bidData[1] / maxVolume) * 50}%`,
                            }}
                          />
                        </>
                      )}
                      {!bidData && (
                        <>
                          <div></div>
                          <div className="col-span-2"></div>
                        </>
                      )}

                      {/* Ask side */}
                      {askData && (
                        <>
                          {isLargeAsk
                            ? (
                              <div className="col-span-2 flex items-center z-10">
                                <div className="font-mono text-[11px] text-red-500 text-left pl-2">
                                  {askData[0].toFixed(2)}
                                </div>
                                <div className="bg-zinc-800 border border-red-600 rounded-md px-2 ml-2 h-5 flex items-center">
                                  <span className="text-[7px] font-semibold text-amber-500 mr-1">
                                    W
                                  </span>
                                  <span className="text-[7px] text-red-500">
                                    {formatVolume(
                                      askData[0] * askData[1],
                                    )}
                                  </span>
                                </div>
                              </div>
                            )
                            : (
                              <div className="col-span-2 font-mono text-[11px] text-red-500 text-left pl-2 z-10">
                                {askData[0].toFixed(2)}
                              </div>
                            )}
                          <div className="relative font-mono text-red-400 text-[9px] text-right pr-2 flex items-center justify-end z-10">
                            {showScales && (
                              <span className="mr-1 text-[7px] text-red-600">
                                Σ{formatVolume(askTotalVolume)}
                              </span>
                            )}
                            {askData[1].toFixed(3)}
                          </div>
                          <div
                            className="absolute right-0 h-6 bg-red-500/20 rounded-l-sm"
                            style={{
                              width: `${(askData[1] / maxVolume) * 50}%`,
                            }}
                          />
                        </>
                      )}
                      {!askData && (
                        <>
                          <div className="col-span-2"></div>
                          <div></div>
                        </>
                      )}
                    </div>
                  );
                })}
          </div>

          {/* Market Dominance Footer */}
          <div className="border-t  p-4 bg-zinc-900">
            <div className="flex flex-col items-center">
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-2">
                MARKET DOMINANCE
              </div>
              <div className="w-full flex items-center justify-between mb-2">
                <div className="text-[10px] text-red-500 font-semibold">
                  SELLERS {currentOrderBook
                    ? ((currentOrderBook.totalAskLiquidity /
                      (currentOrderBook.totalBidLiquidity +
                        currentOrderBook.totalAskLiquidity)) * 100)
                      .toFixed(1)
                    : 50}%
                </div>
                <div className="text-[10px] text-green-500 font-semibold">
                  {currentOrderBook
                    ? ((currentOrderBook.totalBidLiquidity /
                      (currentOrderBook.totalBidLiquidity +
                        currentOrderBook.totalAskLiquidity)) * 100)
                      .toFixed(1)
                    : 50}% BUYERS
                </div>
              </div>
              <div className="w-full h-4 overflow-hidden relative border">
                <div className="absolute inset-0 flex">
                  <div
                    className="h-full bg-red-500/40 flex items-center justify-center"
                    style={{
                      width: `${
                        currentOrderBook
                          ? (currentOrderBook.totalAskLiquidity /
                            (currentOrderBook.totalBidLiquidity +
                              currentOrderBook.totalAskLiquidity)) * 100
                          : 50
                      }%`,
                    }}
                  />
                  <div className="h-full w-[2px] bg-zinc-300 z-10" />
                  <div
                    className="h-full bg-green-500/40 flex items-center justify-center"
                    style={{
                      width: `${
                        currentOrderBook
                          ? (currentOrderBook.totalBidLiquidity /
                            (currentOrderBook.totalBidLiquidity +
                              currentOrderBook.totalAskLiquidity)) * 100
                          : 50
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="w-full flex justify-center mt-2">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <span>LAST UPDATE:</span>
                  <span className="font-mono text-amber-500">
                    {displayTime}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
	      
	      {/* Compact Exchange Ranking */}
	      <Card className="bg-zinc-900 border">
		      <CardHeader>
			      <CardTitle className="flex items-center gap-2">
				      <BarChart3 className="w-5 h-5 text-amber-500" />
				      Exchange Liquidity Ranking
			      </CardTitle>
			      <CardDescription>
				      Click on exchange for detailed order book
			      </CardDescription>
		      </CardHeader>
		      <CardContent>
			      <div className="grid grid-row-2 gap-0">
				      {currentOrderBook?.exchangeRanking?.length > 0
					      ? (
						      currentOrderBook.exchangeRanking.slice(0, 6).map((
							      item,
							      index,
						      ) => (
							      <Dialog key={item.exchange}>
								      <DialogTrigger asChild>
									      <Button
										      variant="ghost"
										      className="bg-zinc-950 h-auto mb-1 p-2 hover:bg-zinc-950 transition-colors border"
										      onClick={() => openExchangeDetails(item.exchange)}
									      >
										      <div className="flex items-center gap-3 w-full">
											      <Badge
												      variant="outline"
												      className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-amber-500/20 text-amber-500 border-amber-400/30"
											      >
												      {index + 1}
											      </Badge>
											      {getExchangeIcon(item.exchange)
												      ? (
													      <img
														      src={getExchangeIcon(item.exchange)!}
														      alt={item.exchange}
														      className="w-6 h-6 rounded-full"
													      />
												      )
												      : (
													      <div
														      className={`w-6 h-6 bg-gradient-to-br ${
															      getExchangeColor(item.exchange)
														      } rounded-full flex items-center justify-center text-white text-xs font-bold`}
													      >
														      {item.exchange.charAt(0).toUpperCase()}
													      </div>
												      )}
											      <div className="flex-1 text-left">
												      <div className="font-medium capitalize text-sm">
													      {item.exchange}
												      </div>
												      <div className="text-xs text-amber-500">
													      {item.percentage.toFixed(1)}%
												      </div>
											      </div>
											      <div className="text-right">
												      <div className="font-bold text-xs text-amber-500">
													      ${formatVolume(item.liquidity)}
												      </div>
											      </div>
										      </div>
									      </Button>
								      </DialogTrigger>
							      </Dialog>
						      ))
					      )
					      : (
						      <div className="text-center py-8 text-zinc-400">
							      <p>No exchange data available</p>
						      </div>
					      )}
			      </div>
		      </CardContent>
	      </Card>
      </div>

      {/* Exchange Details Modal */}
      <Dialog open={isExchangeModalOpen} onOpenChange={setIsExchangeModalOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {getExchangeIcon(selectedExchange)
                ? (
                  <img
                    src={getExchangeIcon(selectedExchange)!}
                    alt={selectedExchange}
                    className="w-8 h-8 rounded-full"
                  />
                )
                : (
                  <div
                    className={`w-8 h-8 bg-gradient-to-br ${
                      getExchangeColor(selectedExchange)
                    } rounded-full flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {selectedExchange.charAt(0).toUpperCase()}
                  </div>
                )}
              <span className="capitalize">{selectedExchange}</span>
              <span className="text-muted-foreground">
                - {selectedMarket} Order Book
              </span>
            </DialogTitle>
          </DialogHeader>

          {currentOrderBook && currentOrderBook.exchanges[selectedExchange] && (
            <div className="space-y-6">
              {/* Exchange Stats - Compact */}
              <div className="flex justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-500">
                    ${formatVolume(
                      currentOrderBook.exchanges[selectedExchange]
                        .bidLiquidity,
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bid Liquidity
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-500">
                    ${formatVolume(
                      currentOrderBook.exchanges[selectedExchange]
                        .askLiquidity,
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ask Liquidity
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-500">
                    {currentOrderBook.exchanges[selectedExchange].latency}ms
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Latency
                  </div>
                </div>
              </div>

              {/* Professional Order Book Widget */}
              <div className="flex justify-center">
                <OrderBookWidget
                  book={{
                    exchange: selectedExchange,
                    market: selectedMarket,
                    bids: currentOrderBook.exchanges[selectedExchange].bids,
                    asks: currentOrderBook.exchanges[selectedExchange].asks,
                    volume: [0, 0], // Placeholder - would need actual volume data
                    timestamp: Date.now(),
                    latency:
                      currentOrderBook.exchanges[selectedExchange].latency,
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default OrderBook;
