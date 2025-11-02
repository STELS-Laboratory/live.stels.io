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
  walletAddress: string;
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
  walletAddress,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Tokens ({tokens.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              {/* Token Icon */}
              {token.icon
                ? (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={token.icon}
                      alt={token.name}
                      className="w-[70%] h-full object-contain"
                    />
                  </div>
                )
                : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Coins className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}

              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    {token.name}
                  </span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {token.symbol}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {token.description}
                </p>
              </div>

              {/* Token Balance */}
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-foreground">
                  {token.balance.toFixed(token.decimals)}
                </div>
                <div className="text-xs text-muted-foreground">
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
