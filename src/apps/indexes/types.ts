/**
 * Market Indexes Application Types
 */

/**
 * Index types available in the system
 */
export type IndexType =
  | "arbitrage_analysis"
  | "market_dominance"
  | "correlation_analysis"
  | "cross_exchange_vwap"
  | "geometric_mean"
  | "liquidity_analysis"
  | "sentiment_analysis"
  | "price_sum"
  | "market_breadth"
  | "market_cap_weighted"
  | "momentum_average"
  | "composite_weighted"
  | "spread_analysis"
  | "price_average"
  | "trend_analysis"
  | "volatility_average"
  | "volume_weighted";

/**
 * Index codes
 */
export type IndexCode =
  | "AOI"
  | "BDI"
  | "CI"
  | "CEPI"
  | "EWI"
  | "ELI"
  | "FGI"
  | "LIQ"
  | "MBI"
  | "MCWI"
  | "MI"
  | "MECI"
  | "PSI"
  | "PI"
  | "TSI"
  | "VI"
  | "VWPI";

/**
 * Timeframe for candles
 */
export type Timeframe = "1m" | "5m" | "15m" | "1h";

/**
 * Candle data structure
 */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Base index data structure
 */
export interface BaseIndexData {
  index: IndexCode;
  name: string;
  type: IndexType;
  info: string;
  timestamp: number;
}

/**
 * Arbitrage Opportunity Index
 */
export interface ArbitrageOpportunityIndex extends BaseIndexData {
  index: "AOI";
  type: "arbitrage_analysis";
  avgProfitPercent: number;
  totalOpportunities: number;
  highOpportunities: number;
  opportunities: Record<
    string,
    {
      asset: string;
      priceSpread: number;
      minPrice: number;
      maxPrice: number;
      minExchange: string;
      maxExchange: string;
      allExchanges: Record<
        string,
        {
          price: number;
          bid: number;
          ask: number;
          spread: number;
        }
      >;
      opportunity: "none" | "low" | "medium" | "high";
      timestamp: number;
    }
  >;
  assetCount: number;
  exchangeCount: number;
}

/**
 * Bitcoin Dominance Index
 */
export interface BitcoinDominanceIndex extends BaseIndexData {
  index: "BDI";
  type: "market_dominance";
  value: number;
  level: "low" | "medium" | "high";
  btcMarketValue: number;
  totalMarketValue: number;
  altcoinDominance: number;
  assetCount: number;
  assets: Record<
    string,
    {
      name: string;
      price: number;
      volume: number;
      marketValue: number;
    }
  >;
}

/**
 * Correlation Index
 */
export interface CorrelationIndex extends BaseIndexData {
  index: "CI";
  type: "correlation_analysis";
  overallCorrelation: number;
  avgBTCorrelation: number;
  level: "low" | "medium" | "high";
  correlationMatrix: Record<string, Record<string, number>>;
  assetData: Record<
    string,
    {
      name: string;
      price: number;
      percentage: number;
    }
  >;
  assetCount: number;
}

/**
 * Cross Exchange Price Index
 */
export interface CrossExchangePriceIndex extends BaseIndexData {
  index: "CEPI";
  type: "cross_exchange_vwap";
  compositeIndex: number;
  totalVolume: number;
  assets: Record<
    string,
    {
      prices: Record<string, number>;
      volumes: Record<string, number>;
      weightedPrice: number;
      totalVolume: number;
      exchangeCount: number;
      priceSpread: number;
      minPrice: number;
      maxPrice: number;
      vwap: number;
      avgPrice: number;
    }
  >;
  componentWeights: Record<string, number>;
  exchangeCount: number;
  assetCount: number;
}

/**
 * Equal Weighted Index
 */
export interface EqualWeightedIndex extends BaseIndexData {
  index: "EWI";
  type: "geometric_mean";
  value: number;
  arithmeticMean: number;
  components: Record<string, number>;
  count: number;
}

/**
 * Exchange Liquidity Index
 */
export interface ExchangeLiquidityIndex extends BaseIndexData {
  index: "ELI";
  type: "liquidity_analysis";
  totalMarketVolume: number;
  mostLiquidExchange: string;
  exchangeLiquidity: Record<
    string,
    {
      totalVolume: number;
      assetCount: number;
      assets: Record<string, number>;
      marketShare: number;
    }
  >;
  assetLiquidity: Record<
    string,
    {
      totalVolume: number;
      exchangeVolumes: Record<
        string,
        {
          quoteVolume: number;
          baseVolume: number;
          price: number;
        }
      >;
      exchangeCount: number;
    }
  >;
  hhi: number;
  concentration: "low" | "medium" | "high";
  assetCount: number;
  exchangeCount: number;
}

/**
 * Fear & Greed Index
 */
export interface FearGreedIndex extends BaseIndexData {
  index: "FGI";
  type: "sentiment_analysis";
  value: number;
  sentiment:
    | "extreme_fear"
    | "fear"
    | "neutral"
    | "greed"
    | "extreme_greed";
  condition: "oversold" | "neutral" | "overbought";
  components: {
    volatility: number;
    momentum: number;
    volume: number;
  };
  componentData: Record<
    string,
    {
      price: number;
      percentage: number;
      volume: number;
      change: number;
      volatilityScore: number;
      momentumScore: number;
      volumeScore: number;
      priceActionScore: number;
    }
  >;
}

/**
 * Liquidity Index
 */
export interface LiquidityIndex extends BaseIndexData {
  index: "LIQ";
  type: "price_sum";
  value: number;
  components: Record<string, number>;
  count: number;
}

/**
 * Market Breadth Index
 */
export interface MarketBreadthIndex extends BaseIndexData {
  index: "MBI";
  type: "market_breadth";
  value: number;
  condition: "very_bearish" | "bearish" | "neutral" | "bullish" | "very_bullish";
  breadthPercentage: number;
  bearishPercentage: number;
  neutralPercentage: number;
  uptrendCount: number;
  downtrendCount: number;
  neutralCount: number;
  totalAssets: number;
  assetTrends: Record<
    string,
    {
      price: number;
      percentage: number;
      trend:
        | "strong_downtrend"
        | "downtrend"
        | "neutral"
        | "uptrend"
        | "strong_uptrend";
    }
  >;
}

/**
 * Market Cap Weighted Index
 */
export interface MarketCapWeightedIndex extends BaseIndexData {
  index: "MCWI";
  type: "market_cap_weighted";
  value: number;
  totalWeight: number;
  components: Record<
    string,
    {
      price: number;
      weight: number;
      staticWeight: number;
      volume: number;
    }
  >;
  weights: Record<string, number>;
  count: number;
}

/**
 * Momentum Index
 */
export interface MomentumIndex extends BaseIndexData {
  index: "MI";
  type: "momentum_average";
  value: number;
  sentiment: "strong_bearish" | "bearish" | "neutral" | "bullish" | "strong_bullish";
  components: Record<
    string,
    {
      momentum: number;
      price: number;
    }
  >;
  count: number;
}

/**
 * Multi-Exchange Composite Index
 */
export interface MultiExchangeCompositeIndex extends BaseIndexData {
  index: "MECI";
  type: "composite_weighted";
  value: number;
  momentum: number;
  sentiment: "strong_bearish" | "bearish" | "neutral" | "bullish" | "strong_bullish";
  components: Record<
    string,
    {
      symbol: string;
      weight: number;
      adjustedWeight: number;
      price: number;
      avgPrice: number;
      momentum: number;
      totalVolume: number;
      exchangePrices: Record<string, number>;
      exchangeVolumes: Record<string, number>;
      exchangeCount: number;
      weightedValue: number;
    }
  >;
  weights: Record<string, number>;
  totalWeight: number;
  componentCount: number;
}

/**
 * Price Spread Index
 */
export interface PriceSpreadIndex extends BaseIndexData {
  index: "PSI";
  type: "spread_analysis";
  overallSpread: number;
  efficiency: "low" | "medium" | "high";
  spreads: Record<
    string,
    {
      asset: string;
      avgSpread: number;
      tightestSpread: {
        exchange: string;
        spread: number;
      };
      widestSpread: {
        exchange: string;
        spread: number;
      };
      crossExchangeSpread: number;
      exchangeSpreads: Record<
        string,
        {
          bid: number;
          ask: number;
          spread: number;
          spreadPercent: number;
          midPrice: number;
          last: number;
        }
      >;
      exchangeCount: number;
      timestamp: number;
    }
  >;
}

/**
 * Price Index
 */
export interface PriceIndex extends BaseIndexData {
  index: "PI";
  type: "price_average";
  value: number;
  components: Record<string, number>;
  count: number;
}

/**
 * Trend Strength Index
 */
export interface TrendStrengthIndex extends BaseIndexData {
  index: "TSI";
  type: "trend_analysis";
  value: number;
  direction: "strong_downtrend" | "downtrend" | "neutral" | "uptrend" | "strong_uptrend";
  strength: "weak" | "moderate" | "strong" | "very_strong";
  assetStrengths: Record<
    string,
    {
      price: number;
      percentage: number;
      volume: number;
      change: number;
      trendStrength: number;
      momentumStrength: number;
      volumeStrength: number;
      direction: "up" | "down";
    }
  >;
  componentCount: number;
}

/**
 * Volatility Index
 */
export interface VolatilityIndex extends BaseIndexData {
  index: "VI";
  type: "volatility_average";
  value: number;
  level: "low" | "medium" | "high";
  components: Record<
    string,
    {
      volatility: number;
      price: number;
      change: number;
      percentage: number;
    }
  >;
  count: number;
}

/**
 * Volume Weighted Price Index
 */
export interface VolumeWeightedPriceIndex extends BaseIndexData {
  index: "VWPI";
  type: "volume_weighted";
  value: number;
  totalVolume: number;
  components: Record<
    string,
    {
      price: number;
      volume: number;
      weight: number;
    }
  >;
  weights: Record<string, number>;
  count: number;
}

/**
 * Union type for all index data
 */
export type IndexData =
  | ArbitrageOpportunityIndex
  | BitcoinDominanceIndex
  | CorrelationIndex
  | CrossExchangePriceIndex
  | EqualWeightedIndex
  | ExchangeLiquidityIndex
  | FearGreedIndex
  | LiquidityIndex
  | MarketBreadthIndex
  | MarketCapWeightedIndex
  | MomentumIndex
  | MultiExchangeCompositeIndex
  | PriceSpreadIndex
  | PriceIndex
  | TrendStrengthIndex
  | VolatilityIndex
  | VolumeWeightedPriceIndex;

/**
 * Candle data for an index
 */
export interface IndexCandleData {
  index: IndexCode;
  indexName: string;
  timeframe: Timeframe;
  candles: Candle[];
  candleCount: number;
  lastUpdate: number;
}

/**
 * Session storage entry for index
 */
export interface IndexSessionEntry {
  channel: string;
  module: string;
  widget: string;
  raw: IndexData | IndexCandleData;
  timestamp: number;
}

/**
 * Index metadata
 */
export interface IndexMetadata {
  code: IndexCode;
  name: string;
  description: string;
  category: "market" | "sentiment" | "technical" | "liquidity" | "arbitrage";
  icon: string;
  color: string;
}
