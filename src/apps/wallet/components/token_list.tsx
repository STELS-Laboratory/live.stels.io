/**
 * Token List Component
 * Displays list of available tokens in the network
 */

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Hash, Search, X, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormattedNumber } from "@/components/ui/formatted-number";
import { cn } from "@/lib/utils";
import { TokenListSkeleton } from "./wallet_skeletons";
import {
  type AssetBalanceItem,
  useAssetBalances,
} from "@/hooks/use_asset_balances";
import { useAllTokenPrices } from "@/hooks/use_token_price";
import { useAuthStore } from "@/stores";

interface AssetData {
  id?: string;
  channel?: string;
  module?: string;
  widget?: string;
  icon?: string; // Direct icon field on asset
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
    description: string;
    icon?: string;
  };
  raw?: {
    genesis: {
      token?: {
        id: string;
        metadata: {
          name: string;
          symbol: string;
          decimals: number;
          description: string;
          icon?: string;
        };
      };
      // Genesis metadata (for tokens without token field)
      metadata?: {
        name?: string;
        symbol?: string;
        decimals?: number;
        description?: string;
        icon?: string;
        [key: string]: unknown;
      };
      // Genesis network document fields (should be filtered out)
      genesis?: Record<string, unknown>;
      network?: Record<string, unknown>;
      [key: string]: unknown;
    };
  };
  timestamp?: number;
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
  // Support both formats: legacy (token.raw.genesis.token) and new (metadata directly)
  const metadata = asset.raw?.genesis?.token?.metadata || asset.raw?.genesis?.metadata || asset.metadata || {
    name: "Unknown Token",
    symbol: "UNKNOWN",
    decimals: 6,
    description: "",
  };
  // Get icon from multiple possible locations:
  // 1. Direct icon field on asset
  // 2. metadata.icon (from token.metadata or genesis.metadata)
  // 3. raw.genesis.token.metadata.icon (legacy token format)
  // 4. raw.genesis.metadata.icon (genesis metadata format)
  const icon = asset.icon || 
    metadata.icon || 
    asset.raw?.genesis?.token?.metadata?.icon || 
    asset.raw?.genesis?.metadata?.icon;
  const tokenId = asset.raw?.genesis?.token?.id || asset.id || asset.channel ||
    `token-${index}`;

  // Look up balance from the balances map
  const balanceData = balances.get(tokenId.toLowerCase());

  // First, try to use total_balance_sli from API if available (most accurate)
  // This is the total balance including mined tokens, already in human-readable format
  let totalBalance = 0;
  if (balanceData?.total_balance_sli) {
    const total = Number.parseFloat(balanceData.total_balance_sli);
    if (!Number.isNaN(total)) {
      totalBalance = total;
    }
  } else {
    // Fallback: calculate manually if total_balance_sli is not available
    const decimals = balanceData?.decimals ?? metadata.decimals;
    const rawBaseBalance = balanceData
      ? Number.parseFloat(balanceData.balance)
      : 0;

    // Check if balance is already in human-readable format or in raw format
    // If balance > 10^decimals, it's likely in raw format
    const isRawFormat = rawBaseBalance >= Math.pow(10, decimals);
    const baseBalance = Number.isNaN(rawBaseBalance)
      ? 0
      : isRawFormat
      ? rawBaseBalance / Math.pow(10, decimals)
      : rawBaseBalance; // Already in human-readable format

    // Add mined tokens to balance (mined_sli is already in human-readable format)
    const minedBalance = balanceData?.mined_sli
      ? Number.parseFloat(balanceData.mined_sli)
      : 0;
    totalBalance = baseBalance +
      (Number.isNaN(minedBalance) ? 0 : minedBalance);
  }

  // Check if this is first load (no balances loaded yet)
  const isFirstLoad = loading && balances.size === 0;

  // Get price from session ticker data
  // For USDT, use fixed price of 1 USD (stablecoin)
  const symbolUpper = metadata.symbol.toUpperCase();
  const isUSDT = symbolUpper === "USDT";
  const price = isUSDT ? 1 : (prices.get(symbolUpper) || null);

  // Calculate USD value: total balance * price (including mined tokens)
  // Memoize calculation to prevent unnecessary recalculations
  const usdValue = React.useMemo(() => {
    if (!price || totalBalance <= 0) return 0;
    return totalBalance * price;
  }, [price, totalBalance]);

  const token: TokenItem = {
    name: metadata.name,
    symbol: metadata.symbol,
    decimals: metadata.decimals,
    description: metadata.description,
    icon: icon, // Use icon from multiple possible locations
    balance: totalBalance, // Total balance including mined tokens
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
        "flex items-center rounded border border-border bg-card hover:bg-muted/50 transition-colors",
        mobile ? "gap-2 p-3" : "gap-4 p-4",
      )}
      role="listitem"
      aria-label={`${token.name} (${token.symbol}): ${totalBalance} ${token.symbol}, ${token.usdValue > 0 ? `$${token.usdValue.toFixed(2)}` : "No price available"}`}
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
            {/* Check if icon is SVG path (starts with M, L, C, etc.) or URL */}
            {token.icon.match(/^[MLCZQHVASmlczqhvsa\s\d.,-]+$/) ? (
              // SVG path - render as SVG element
              <svg
                viewBox="0 0 24 24"
                className={cn(
                  "fill-current text-foreground",
                  mobile ? "w-6 h-6" : "w-8 h-8",
                )}
                aria-hidden="true"
              >
                <path d={token.icon} />
              </svg>
            ) : (
              // URL or other format - render as image
              <img
                src={token.icon}
                alt={`${token.name} icon`}
                className="w-[70%] h-full object-contain"
                loading="lazy"
              />
            )}
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
              aria-hidden="true"
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
            : totalBalance > 0
            ? (
              <FormattedNumber
                value={totalBalance}
                decimals={token.decimals}
                useGrouping={true}
              />
            )
            : (
              <FormattedNumber
                value={0}
                decimals={token.decimals}
                useGrouping={true}
              />
            )}
        </div>
        <div
          className={cn(
            "text-green-600 dark:text-green-400",
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
            : price && totalBalance > 0
            ? "Price unavailable"
            : "$0.00"}
        </div>
        {/* Mined data */}
        {balanceData?.mined_sli &&
          Number.parseFloat(balanceData.mined_sli) > 0 && (
          <div
            className={cn(
              "flex items-center gap-1 justify-end mt-1 text-amber-500",
              mobile ? "text-[9px]" : "text-[10px]",
            )}
          >
            <Hash className={cn(mobile ? "w-2.5 h-2.5" : "w-3 h-3")} />
            <span className="font-medium flex items-baseline gap-1">
              Mined:{" "}
              <FormattedNumber
                value={balanceData.mined_sli}
                decimals={6}
                useGrouping={true}
              />{" "}
              SLI
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if actually changed
  // Asset changed - support both formats
  const prevTokenId = prevProps.asset.raw?.genesis?.token?.id ||
    prevProps.asset.id ||
    prevProps.asset.channel ||
    "";
  const nextTokenId = nextProps.asset.raw?.genesis?.token?.id ||
    nextProps.asset.id ||
    nextProps.asset.channel ||
    "";

  if (prevTokenId !== nextTokenId) {
    return false;
  }

  // Index changed
  if (prevProps.index !== nextProps.index) {
    return false;
  }

  // Check if balance changed for this token
  const tokenId = prevTokenId.toLowerCase();
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
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hideZeroBalance, setHideZeroBalance] = useState<boolean>(false);

  // Use getAssetBalances to fetch all balances in a single request
  // This is more efficient than multiple getAssetBalance calls
  const {
    balances: allBalances,
    loading: balancesLoading,
    assets: assetsFromBalances,
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

  // Create a map of assets from props for icon lookup
  const assetsMapForIcons = useMemo(() => {
    const map = new Map<string, AssetData>();
    if (assets && assets.length > 0) {
      for (const asset of assets) {
        // Skip genesis network documents
        const isGenesisDoc = asset.channel?.includes(".genesis:") ||
          (asset.raw?.genesis && !asset.raw.genesis.token &&
            asset.raw.genesis.genesis);

        if (isGenesisDoc) continue;

        // Support both formats: legacy (token.raw.genesis.token) and new (id directly)
        const tokenId = asset.raw?.genesis?.token?.id?.toLowerCase() ||
          asset.id?.toLowerCase() ||
          asset.channel?.toLowerCase();

        if (tokenId) {
          map.set(tokenId, asset);
        }
      }
    }
    return map;
  }, [assets]);

  // Use assets from getAssetBalances if available, otherwise fallback to props
  // This ensures we show all tokens that have balances
  const availableAssets = useMemo((): AssetData[] => {
    // Prefer assets from getAssetBalances as they're synchronized with balances
    if (assetsFromBalances && assetsFromBalances.length > 0) {
      return assetsFromBalances
        .filter((assetRecord) => {
          // Only include assets that have valid token data
          return assetRecord.raw?.genesis?.token?.id &&
            assetRecord.raw?.genesis?.token?.metadata;
        })
        .map((assetRecord) => {
          const token = assetRecord.raw.genesis.token!;
          const tokenId = token.id!.toLowerCase();

          // Try to get icon from multiple locations: direct field, metadata, or from assets prop
          const iconFromBalances = assetRecord.icon || token.metadata?.icon;
          const assetFromProps = assetsMapForIcons.get(tokenId);
          const iconFromProps = assetFromProps?.icon || 
            assetFromProps?.raw?.genesis?.token?.metadata?.icon ||
            assetFromProps?.raw?.genesis?.metadata?.icon ||
            assetFromProps?.metadata?.icon;

          return {
            channel: assetRecord.channel,
            module: assetRecord.module,
            widget: assetRecord.channel.replace("asset.", "widget.asset."),
            raw: {
              genesis: {
                token: {
                  id: token.id!,
                  metadata: {
                    name: token.metadata?.name || token.id!,
                    symbol: token.metadata?.symbol || "UNKNOWN",
                    decimals: token.metadata?.decimals || 6,
                    description: token.metadata?.name ||
                      `${token.metadata?.symbol || "Token"}`,
                    icon: iconFromBalances || iconFromProps || undefined, // Use icon from multiple possible locations
                  },
                },
              },
            },
            timestamp: assetRecord.timestamp,
          } as AssetData;
        });
    }

    // Fallback to assets from props (useAssetList)
    return assets || [];
  }, [assetsFromBalances, assets, assetsMapForIcons]);

  // Sort tokens by USD value (highest to lowest)
  // Also include tokens that have balances but might not be in assets list
  const tokens = useMemo((): AssetData[] => {
    // Create a map of all available assets by token_id
    const assetsMap = new Map<string, AssetData>();

    // Add all assets from availableAssets
    // Filter out genesis network documents (not tokens)
    for (const asset of availableAssets) {
      // Check if it's a genesis network document (not a token)
      const isGenesisDoc = asset.channel?.includes(".genesis:") ||
        (asset.raw?.genesis && !asset.raw.genesis.token &&
          asset.raw.genesis.genesis);

      // Skip genesis network documents
      if (isGenesisDoc) {
        continue;
      }

      // Support both formats: legacy (token) and new (metadata)
      const tokenId = asset.raw?.genesis?.token?.id?.toLowerCase() ||
        asset.id?.toLowerCase() ||
        asset.channel?.toLowerCase();

      if (tokenId) {
        assetsMap.set(tokenId, asset);
      }
    }

    // Add tokens from balances that might not be in assets list
    // Create minimal asset structure from balance data
    for (const balance of allBalances) {
      const tokenId = balance.token_id.toLowerCase();
      if (!assetsMap.has(tokenId)) {
        // Try to get icon from assets prop if available (check multiple locations)
        const assetFromProps = assetsMapForIcons.get(tokenId);
        const iconFromProps = assetFromProps?.icon || 
          assetFromProps?.raw?.genesis?.token?.metadata?.icon ||
          assetFromProps?.raw?.genesis?.metadata?.icon;

        // Create a minimal asset structure from balance data
        // This ensures we show all tokens with balances
        const symbol = balance.symbol || balance.currency || "UNKNOWN";
        assetsMap.set(tokenId, {
          channel: `asset.${
            connectionSession?.network || "testnet"
          }.${tokenId}`,
          module: "asset",
          widget: `widget.asset.${
            connectionSession?.network || "testnet"
          }.${tokenId}`,
          raw: {
            genesis: {
              token: {
                id: balance.token_id,
                metadata: {
                  name: symbol,
                  symbol: symbol,
                  decimals: balance.decimals,
                  description: `${symbol} Token`,
                  icon: iconFromProps, // Use icon from assets prop if available
                },
              },
            },
          },
          timestamp: Date.now(),
        } as AssetData);
      }
    }

    // Convert map to array and calculate USD values
    const tokensWithValue = Array.from(assetsMap.values()).map((asset) => {
      // Support both formats: legacy (token.raw.genesis.token) and new (id directly)
      const tokenId = asset.raw?.genesis?.token?.id?.toLowerCase() ||
        asset.id?.toLowerCase() ||
        asset.channel?.toLowerCase() ||
        "";

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
    }).filter((item): item is { asset: AssetData; usdValue: number } =>
      item !== null
    );

    // Sort by USD value descending (highest to lowest)
    tokensWithValue.sort((a, b) => b.usdValue - a.usdValue);

    return tokensWithValue.map((item) => item.asset);
  }, [
    availableAssets,
    allBalances,
    balancesMap,
    tokenPricesStable,
    connectionSession?.network,
    assetsMapForIcons,
  ]);

  // Filter tokens by search and zero balance
  const filteredTokens = useMemo((): AssetData[] => {
    let filtered = tokens;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((asset) => {
        const metadata = asset.raw?.genesis?.token?.metadata || asset.metadata || {};
        const name = metadata.name?.toLowerCase() || "";
        const symbol = metadata.symbol?.toLowerCase() || "";
        const description = metadata.description?.toLowerCase() || "";
        
        return name.includes(query) ||
               symbol.includes(query) ||
               description.includes(query);
      });
    }

    // Filter by zero balance
    if (hideZeroBalance) {
      filtered = filtered.filter((asset) => {
        const tokenId = asset.raw?.genesis?.token?.id?.toLowerCase() ||
          asset.id?.toLowerCase() ||
          asset.channel?.toLowerCase() ||
          "";
        const balanceData = balancesMap.get(tokenId);
        if (!balanceData) return false;
        
        // Check if balance is greater than 0
        const balance = Number.parseFloat(balanceData.balance || "0");
        const mined = Number.parseFloat(balanceData.mined_sli || "0");
        return balance > 0 || mined > 0;
      });
    }

    return filtered;
  }, [tokens, searchQuery, hideZeroBalance, balancesMap]);

  if (loading) {
    return <TokenListSkeleton mobile={mobile} />;
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
          Tokens ({filteredTokens.length}
          {tokens.length !== filteredTokens.length &&
            ` of ${tokens.length}`})
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(mobile && "px-4 pt-0 pb-4")}>
        {/* Search and Filter */}
        <div className={cn("space-y-3 mb-4", mobile && "space-y-2")}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tokens by name, symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-9", mobile && "text-sm")}
              aria-label="Search tokens"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Label htmlFor="hide-zero" className="text-sm cursor-pointer">
                Hide zero balance
              </Label>
            </div>
            <Switch
              id="hide-zero"
              checked={hideZeroBalance}
              onCheckedChange={setHideZeroBalance}
              aria-label="Hide tokens with zero balance"
            />
          </div>
        </div>

        {filteredTokens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {searchQuery || hideZeroBalance
                ? "No tokens match your filters"
                : "No tokens found"}
            </p>
            {(searchQuery || hideZeroBalance) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setHideZeroBalance(false);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(mobile ? "space-y-2" : "space-y-3")}>
            {filteredTokens.map((asset, index) => {
            // Support both formats for key generation
            const tokenId = asset.raw?.genesis?.token?.id ||
              asset.id ||
              asset.channel ||
              `token-${index}`;

            return (
              <TokenItemWithBalance
                key={tokenId}
                asset={asset}
                index={index}
                balancesMap={balancesMap}
                tokenPrices={tokenPricesStable}
                balancesLoading={balancesLoading}
                mobile={mobile}
              />
            );
          })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
