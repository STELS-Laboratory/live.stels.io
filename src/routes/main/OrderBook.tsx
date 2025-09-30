import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import { filterSession } from "@/lib/utils";

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

const OrderBook: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<string>("BTC/USDT");

  // Get session data
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const spotBooksRaw = filterSession(
    session || {},
    /\.spot\..*\.book$/,
  ) as OrderBookDataRaw[];

  // Transform session data to OrderBookData format
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

  const getExchangeIcon = (exchange: string): string | null => {
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
  };

  const getCurrencyIcon = (symbol: string): string | null => {
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
  };

  const getExchangeColor = (exchange: string): string => {
    const colors: { [key: string]: string } = {
      binance: "from-yellow-400 to-yellow-600",
      bybit: "from-blue-400 to-blue-600",
      okx: "from-purple-400 to-purple-600",
      coinbase: "from-blue-500 to-blue-700",
      htx: "from-red-400 to-red-600",
      kucoin: "from-green-400 to-green-600",
      gate: "from-indigo-400 to-indigo-600",
      bitget: "from-orange-400 to-orange-600",
      upbit: "from-pink-400 to-pink-600",
      bitstamp: "from-gray-400 to-gray-600",
      cryptocom: "from-violet-400 to-violet-600",
      bitfinex: "from-cyan-400 to-cyan-600",
      kraken: "from-emerald-400 to-emerald-600",
    };
    return colors[exchange.toLowerCase()] || "from-orange-400 to-orange-600";
  };

  const availableMarkets = useMemo(() => {
    if (orderBookData.length === 0) return ["BTC/USDT"]; // Default fallback
    const markets = [...new Set(orderBookData.map((item) => item.market))];
    return markets.sort();
  }, [orderBookData]);

  // Update selected market if it's not available
  React.useEffect(() => {
    if (
      availableMarkets.length > 0 && !availableMarkets.includes(selectedMarket)
    ) {
      setSelectedMarket(availableMarkets[0]);
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
          percentage:
            (data.totalLiquidity / (totalBidLiquidity + totalAskLiquidity)) *
            100,
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

  const currentOrderBook = aggregatedOrderBooks[selectedMarket];

  const formatPrice = (price: number): string => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toFixed(2);
  };

  const getLatencyColor = (latency: number): string => {
    if (latency < 1000) return "text-green-400";
    if (latency < 3000) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Order Book Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Regulatory oversight of exchange liquidity and market dominance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-400" />
          <span className="text-sm text-muted-foreground">Real-time</span>
        </div>
      </div>

      {/* Market Tabs */}
      <Card className="bg-card/50 backdrop-blur-sm border-orange-400/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Market Selection</CardTitle>
          <CardDescription>
            Select asset to analyze order book aggregation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMarket} onValueChange={setSelectedMarket}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              {availableMarkets.map((market) => {
                const symbol = market.split("/")[0];
                return (
                  <TabsTrigger
                    key={market}
                    value={market}
                    className="flex items-center gap-2"
                  >
                    {getCurrencyIcon(symbol)
                      ? (
                        <img
                          src={getCurrencyIcon(symbol)!}
                          alt={symbol}
                          className="w-4 h-4 rounded-full"
                        />
                      )
                      : (
                        <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {symbol.slice(0, 2)}
                        </div>
                      )}
                    <span className="hidden sm:inline">{market}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {orderBookData.length === 0
        ? (
          <Card className="bg-card/50 backdrop-blur-sm border-orange-400/20">
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
            <Card className="bg-card/50 backdrop-blur-sm border-orange-400/20">
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
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {selectedMarket.split("/")[0].slice(0, 2)}
                      </div>
                    )}
                  {selectedMarket} Market Analysis
                </CardTitle>
                <CardDescription>
                  Aggregated order book across{" "}
                  {Object.keys(currentOrderBook.exchanges).length} exchanges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium">
                        Total Bid Liquidity
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ${formatVolume(currentOrderBook.totalBidLiquidity)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium">
                        Total Ask Liquidity
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      ${formatVolume(currentOrderBook.totalAskLiquidity)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium">
                        Dominant Exchange
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exchange Ranking */}
              <Card className="bg-card/50 backdrop-blur-sm border-orange-400/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-400" />
                    Exchange Liquidity Ranking
                  </CardTitle>
                  <CardDescription>
                    Market share by liquidity volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentOrderBook.exchangeRanking.map((item, index) => (
                      <div key={item.exchange} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
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
                            <span className="font-medium capitalize">
                              {item.exchange}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">
                              ${formatVolume(item.liquidity)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Aggregated Order Book */}
              <Card className="bg-card/50 backdrop-blur-sm border-orange-400/20">
                <CardHeader>
                  <CardTitle>Aggregated Order Book</CardTitle>
                  <CardDescription>
                    Combined bids and asks across all exchanges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Asks */}
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-red-400 mb-2">
                        Asks (Sell Orders)
                      </div>
                      {currentOrderBook.aggregatedAsks.map((
                        [price, volume],
                        index,
                      ) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-1 px-2 rounded bg-red-400/10"
                        >
                          <span className="text-red-400 font-mono">
                            {formatPrice(price)}
                          </span>
                          <span className="text-muted-foreground">
                            {formatVolume(volume)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bids */}
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-green-400 mb-2">
                        Bids (Buy Orders)
                      </div>
                      {currentOrderBook.aggregatedBids.map((
                        [price, volume],
                        index,
                      ) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-1 px-2 rounded bg-green-400/10"
                        >
                          <span className="text-green-400 font-mono">
                            {formatPrice(price)}
                          </span>
                          <span className="text-muted-foreground">
                            {formatVolume(volume)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exchange Details */}
            <Card className="bg-card/50 backdrop-blur-sm border-orange-400/20">
              <CardHeader>
                <CardTitle>Exchange Order Book Details</CardTitle>
                <CardDescription>
                  Individual exchange data and latency metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(currentOrderBook.exchanges).map((
                    [exchange, data],
                  ) => (
                    <div
                      key={exchange}
                      className="border rounded-lg p-4 bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getExchangeIcon(exchange)
                            ? (
                              <img
                                src={getExchangeIcon(exchange)!}
                                alt={exchange}
                                className="w-8 h-8 rounded-full"
                              />
                            )
                            : (
                              <div
                                className={`w-8 h-8 bg-gradient-to-br ${
                                  getExchangeColor(exchange)
                                } rounded-full flex items-center justify-center text-white text-sm font-bold`}
                              >
                                {exchange.charAt(0).toUpperCase()}
                              </div>
                            )}
                          <div>
                            <h3 className="font-bold capitalize">{exchange}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                Bid: ${formatVolume(data.bidLiquidity)}
                              </span>
                              <span>
                                Ask: ${formatVolume(data.askLiquidity)}
                              </span>
                              <span
                                className={`${getLatencyColor(data.latency)}`}
                              >
                                {data.latency}ms
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-orange-400 border-orange-400/50"
                        >
                          {((data.totalLiquidity /
                            (currentOrderBook.totalBidLiquidity +
                              currentOrderBook.totalAskLiquidity)) * 100)
                            .toFixed(
                              1,
                            )}% Market Share
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-red-400 mb-2">
                            Top Asks
                          </div>
                          <div className="space-y-1">
                            {data.asks.slice(0, 5).map((
                              [price, volume],
                              index,
                            ) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-red-400 font-mono">
                                  {formatPrice(price)}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatVolume(volume)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-400 mb-2">
                            Top Bids
                          </div>
                          <div className="space-y-1">
                            {data.bids.slice(0, 5).map((
                              [price, volume],
                              index,
                            ) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-green-400 font-mono">
                                  {formatPrice(price)}
                                </span>
                                <span className="text-muted-foreground">
                                  {formatVolume(volume)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )
        : (
          <Card className="bg-card/50 backdrop-blur-sm border-orange-400/20">
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
    </div>
  );
};

export default OrderBook;
