/**
 * Token List Component
 * Displays list of available tokens in the network
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Coins, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

/**
 * Token List Component
 */
export function TokenList({
  assets,
  loading,
  mobile = false,
}: TokenListProps): React.ReactElement {
  const tokens = useMemo((): TokenItem[] => {
    if (!assets || assets.length === 0) return [];

    return assets.map((asset) => {
      const metadata = asset.raw.genesis.token.metadata;

      // For now, we don't have token balances from transactions
      // In production, you'd fetch balances for each token
      return {
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        description: metadata.description,
        icon: metadata.icon,
        balance: 0, // TODO: Fetch from transactions
        usdValue: 0, // TODO: Calculate from balance and price
      };
    });
  }, [assets]);

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
      <CardContent className={cn(mobile && "px-4 pb-4")}>
        <div className={cn(mobile ? "space-y-2" : "space-y-3")}>
          {tokens.map((token, index) => (
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
                  {token.balance.toFixed(token.decimals)}
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
                    }).format(token.usdValue)
                    : "$0.00"}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
