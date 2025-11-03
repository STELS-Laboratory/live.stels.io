/**
 * Token List Component
 * Displays list of available tokens in the network
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Coins, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type AssetBalanceItem,
  useAssetBalances,
} from "@/hooks/use_asset_balances";
import { useAllTokenPrices } from "@/hooks/use_token_price";
import { useAuthStore } from "@/stores";

interface AssetData {
  channel: string;
  module: string;
  widget: string;
  raw: {
    genesis: {
      token: {
        id: string;
        metadata: {
          name: string;
          symbol: string;
          decimals: number;
          description: string;
          icon?: string;
        };
      };
    };
  };
  timestamp: number;
}

interface TokenListProps {
  assets: AssetData[];
  loading: boolean;
  mobile?: boolean;
  address?: string;
}

interface TokenItem {
  name: string;
  symbol: string;
  decimals: number;
  description: string;
  icon?: string;
  balance: number;
  usdValue: number;
}

interface TokenItemProps {
  asset: AssetData;
  index: number;
  balancesMap: Map<string, AssetBalanceItem>;
  tokenPrices: Map<string, number>;
  balancesLoading: boolean;
  mobile?: boolean;
}

// Token item component - defined outside to prevent recreation
const TokenItemWithBalance = React.memo(function TokenItemWithBalance({
  asset,
  index,
  balancesMap: balances,
  tokenPrices: prices,
  balancesLoading: loading,
  mobile = false,
}: TokenItemProps): React.ReactElement {
  const metadata = asset.raw.genesis.token.metadata;
  const tokenId = asset.raw.genesis.token.id;

  // Look up balance from the balances map
  const balanceData = balances.get(tokenId.toLowerCase());
  const balance = balanceData ? Number.parseFloat(balanceData.balance) : 0;

  // Check if this is first load (no balances loaded yet)
  const isFirstLoad = loading && balances.size === 0;

  // Get price from session ticker data
  // For USDT, use fixed price of 1 USD (stablecoin)
  const symbolUpper = metadata.symbol.toUpperCase();
  const isUSDT = symbolUpper === "USDT";
  const price = isUSDT ? 1 : (prices.get(symbolUpper) || null);

  // Calculate USD value: balance * price
  // Memoize calculation to prevent unnecessary recalculations
  const usdValue = React.useMemo(() => {
    if (!price || balance <= 0) return 0;
    return balance * price;
  }, [price, balance]);

  const token: TokenItem = {
    name: metadata.name,
    symbol: metadata.symbol,
    decimals: metadata.decimals,
    description: metadata.description,
    icon: metadata.icon,
    balance,
    usdValue,
  };

  return (
    <motion.div
      key={`${token.symbol}-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "flex items-center rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors",
        mobile ? "gap-2 p-3" : "gap-4 p-4",
      )}
    >
      {/* Token Icon */}
      {token.icon
        ? (
          <div
            className={cn(
              "rounded-full flex items-center justify-center overflow-hidden flex-shrink-0",
              mobile ? "w-10 h-10" : "w-12 h-12",
            )}
          >
            <img
              src={token.icon}
              alt={token.name}
              className="w-[70%] h-full object-contain"
            />
          </div>
        )
        : (
          <div
            className={cn(
              "rounded-full bg-muted flex items-center justify-center flex-shrink-0",
              mobile ? "w-10 h-10" : "w-12 h-12",
            )}
          >
            <Coins
              className={cn(
                "text-muted-foreground",
                mobile ? "w-5 h-5" : "w-6 h-6",
              )}
            />
          </div>
        )}

      {/* Token Info */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "flex items-center mb-1",
            mobile ? "gap-1.5 flex-wrap" : "gap-2",
          )}
        >
          <span
            className={cn(
              "font-semibold text-foreground",
              mobile ? "text-sm" : "text-base",
            )}
          >
            {token.name}
          </span>
          <span
            className={cn(
              "text-muted-foreground font-mono",
              mobile ? "text-xs" : "text-sm",
            )}
          >
            {token.symbol}
          </span>
        </div>
        {!mobile && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {token.description}
          </p>
        )}
      </div>

      {/* Token Balance */}
      <div className="text-right flex-shrink-0">
        <div
          className={cn(
            "font-semibold text-foreground",
            mobile ? "text-sm" : "text-base",
          )}
        >
          {isFirstLoad && balanceData === undefined
            ? "..."
            : balance > 0
            ? balance.toFixed(token.decimals)
            : "0.000000"}
        </div>
        <div
          className={cn(
            "text-muted-foreground",
            mobile ? "text-[10px]" : "text-xs",
          )}
        >
          {token.usdValue > 0
            ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(token.usdValue)
            : price && balance > 0
            ? "Price unavailable"
            : "$0.00"}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if actually changed
  // Asset changed
  if (
    prevProps.asset.raw.genesis.token.id !==
      nextProps.asset.raw.genesis.token.id
  ) {
    return false;
  }

  // Index changed
  if (prevProps.index !== nextProps.index) {
    return false;
  }

  // Check if balance changed for this token
  const tokenId = prevProps.asset.raw.genesis.token.id.toLowerCase();
  const prevBalance = prevProps.balancesMap.get(tokenId);
  const nextBalance = nextProps.balancesMap.get(tokenId);

  if (prevBalance?.balance !== nextBalance?.balance) {
    return false;
  }

  // Check if price changed for this token
  const symbol = prevProps.asset.raw.genesis.token.metadata.symbol
    .toUpperCase();
  const prevPrice = prevProps.tokenPrices.get(symbol);
  const nextPrice = nextProps.tokenPrices.get(symbol);

  // Only re-render if price changed significantly (> 0.1% or > 0.01 absolute)
  if (prevPrice !== nextPrice) {
    if (prevPrice === undefined || nextPrice === undefined) {
      return false; // Re-render if price appears/disappears
    }
    const changePercent = Math.abs((nextPrice - prevPrice) / prevPrice);
    const changeAbsolute = Math.abs(nextPrice - prevPrice);
    if (changePercent > 0.001 || changeAbsolute > 0.01) {
      return false; // Re-render if significant change
    }
    // Ignore minor changes
  }

  // Check if loading state changed - only re-render if going from loading to loaded with data
  if (prevProps.balancesLoading !== nextProps.balancesLoading) {
    const nextBalanceData = nextProps.balancesMap.get(tokenId);

    // If loading finished and we have balance data, allow re-render
    if (
      prevProps.balancesLoading && !nextProps.balancesLoading &&
      nextBalanceData && nextBalanceData.balance
    ) {
      return false; // Re-render to show data
    }

    // If loading started and we have cached data, don't re-render (keep showing cached data)
    if (!prevProps.balancesLoading && nextProps.balancesLoading) {
      return true; // Don't re-render, keep showing cached data
    }
  }

  return true;
});

/**
 * Token List Component
 */
/**
 * Token List Component with balance support
 */
export function TokenList({
  assets,
  loading,
  mobile = false,
  address,
}: TokenListProps): React.ReactElement {
  const { wallet, connectionSession } = useAuthStore();
  const walletAddress = address || wallet?.address || "";

  // Use getAssetBalances to fetch all balances in a single request
  // This is more efficient than multiple getAssetBalance calls
  const {
    balances: allBalances,
    loading: balancesLoading,
  } = useAssetBalances({
    address: walletAddress,
    network: connectionSession?.network,
  });

  // Get all token prices from session ticker data (debounced)
  const tokenPrices = useAllTokenPrices(connectionSession?.network);

  // Create stable map of token_id -> balance for quick lookup
  // Use ref to maintain same Map reference unless balances actually change
  const balancesMapRef = React.useRef<Map<string, typeof allBalances[0]>>(
    new Map(),
  );

  React.useEffect(() => {
    // Only update map if balances actually changed
    let needsUpdate = false;

    // Check if any balance changed
    if (balancesMapRef.current.size !== allBalances.length) {
      needsUpdate = true;
    } else {
      for (const balance of allBalances) {
        const normalizedId = balance.token_id.toLowerCase();
        const oldBalance = balancesMapRef.current.get(normalizedId);

        if (!oldBalance || oldBalance.balance !== balance.balance) {
          needsUpdate = true;
          break;
        }
      }
    }

    if (needsUpdate) {
      const map = new Map<string, typeof allBalances[0]>();
      for (const balance of allBalances) {
        const normalizedId = balance.token_id.toLowerCase();
        map.set(normalizedId, balance);
      }
      balancesMapRef.current = map;
    }
  }, [allBalances]);

  const balancesMap = balancesMapRef.current;

  // Create stable reference to token prices to prevent unnecessary re-renders
  // Use ref to maintain same Map reference unless prices actually change
  const tokenPricesStableRef = React.useRef<Map<string, number>>(new Map());
  const isInitializedRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    // Initialize on first render
    if (!isInitializedRef.current && tokenPrices.size > 0) {
      tokenPricesStableRef.current = new Map(tokenPrices);
      isInitializedRef.current = true;
      return;
    }

    // Only update ref if prices actually changed significantly
    let needsUpdate = false;

    if (tokenPricesStableRef.current.size !== tokenPrices.size) {
      needsUpdate = true;
    } else {
      for (const [symbol, price] of tokenPrices) {
        const oldPrice = tokenPricesStableRef.current.get(symbol);
        if (oldPrice !== price) {
          // Only update if change is significant (> 0.1% or > 0.01)
          if (
            oldPrice === undefined ||
            Math.abs((price - oldPrice) / oldPrice) > 0.001 ||
            Math.abs(price - oldPrice) > 0.01
          ) {
            needsUpdate = true;
            break;
          }
        }
      }
    }

    if (needsUpdate) {
      tokenPricesStableRef.current = new Map(tokenPrices);
    }
  }, [tokenPrices]);

  // Use stable ref - always use ref to ensure stable reference
  const tokenPricesStable = React.useMemo(() => {
    return tokenPricesStableRef.current.size > 0
      ? tokenPricesStableRef.current
      : tokenPrices;
  }, [tokenPrices]);

  // Sort tokens by USD value (highest to lowest)
  const tokens = useMemo((): AssetData[] => {
    if (!assets || assets.length === 0) return [];

    // Calculate USD value for each token and sort
    const tokensWithValue = assets.map((asset) => {
      const tokenId = asset.raw.genesis.token.id.toLowerCase();
      const balanceData = balancesMap.get(tokenId);
      const balance = balanceData ? Number.parseFloat(balanceData.balance) : 0;

      const symbolUpper = asset.raw.genesis.token.metadata.symbol.toUpperCase();
      const isUSDT = symbolUpper === "USDT";
      const price = isUSDT ? 1 : (tokenPricesStable.get(symbolUpper) || 0);

      const usdValue = balance > 0 && price > 0 ? balance * price : 0;

      return {
        asset,
        usdValue,
      };
    });

    // Sort by USD value descending (highest to lowest)
    tokensWithValue.sort((a, b) => b.usdValue - a.usdValue);

    return tokensWithValue.map((item) => item.asset);
  }, [assets, balancesMap, tokenPricesStable]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No tokens available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(mobile && "p-2")}>
      <CardHeader className={cn(mobile && "px-4 py-4")}>
        <CardTitle
          className={cn(
            "flex items-center gap-2",
            mobile && "text-base",
          )}
        >
          <Coins className={cn(mobile ? "w-4 h-4" : "w-5 h-5")} />
          Tokens ({tokens.length})
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(mobile && "px-4 pt-0 pb-4")}>
        <div className={cn(mobile ? "space-y-2" : "space-y-3")}>
          {tokens.map((asset, index) => (
            <TokenItemWithBalance
              key={asset.raw.genesis.token.id}
              asset={asset}
              index={index}
              balancesMap={balancesMap}
              tokenPrices={tokenPricesStable}
              balancesLoading={balancesLoading}
              mobile={mobile}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
