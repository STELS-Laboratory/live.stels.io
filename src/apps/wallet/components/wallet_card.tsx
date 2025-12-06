/**
 * Wallet Card Component
 * Displays wallet card with balance and USD value
 */

import React from "react";
import { motion } from "framer-motion";
import {
  Copy,
  CreditCard,
  RefreshCw,
  Shield,
  ShieldOff,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormattedNumber } from "@/components/ui/formatted-number";
import { cn } from "@/lib/utils";
import { toast } from "@/stores";

interface WalletCardProps {
  cardNumber: string;
  balance: number;
  balanceSymbol?: string; // Token symbol to display (default: "USDT")
  balanceDecimals?: number; // Number of decimals for balance formatting (default: 6)
  usdValue: number; // Total portfolio value (tokens + liquidity)
  liquidity: number;
  tokensValue?: number; // Tokens value only (for breakdown)
  isVerified: boolean;
  loading: boolean;
  onRefresh: () => void;
  walletAddress?: string;
  mobile?: boolean;
  onClick?: () => void;
}

/**
 * Wallet Card Component
 */
export function WalletCard({
  cardNumber,
  balance,
  balanceSymbol = "USDT",
  balanceDecimals = 6,
  usdValue,
  liquidity,
  tokensValue,
  isVerified,
  loading,
  onRefresh,
  walletAddress,
  mobile = false,
  onClick,
}: WalletCardProps): React.ReactElement {
  // Total portfolio value is already passed as usdValue (tokens + liquidity)
  // tokensValue is optional for detailed breakdown
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div
        className={cn(
          "relative bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-black rounded shadow-xl overflow-hidden",
          mobile ? "p-4" : "p-6",
          onClick && mobile &&
            "cursor-pointer active:scale-[0.98] transition-transform",
        )}
        onClick={onClick}
      >
        {/* Card Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500 rounded-full translate-y-20 -translate-x-20" />
        </div>

        <div
          className={cn(
            "relative z-10",
            mobile ? "space-y-4" : "space-y-6",
          )}
        >
          {/* Card Header */}
          <div
            className={cn(
              "flex items-start justify-between",
              mobile ? "gap-2" : "gap-4",
            )}
          >
            <div className="flex items-center gap-2">
              <CreditCard
                className={cn(
                  "text-white/80",
                  mobile ? "w-4 h-4" : "w-5 h-5",
                )}
              />
              <span
                className={cn(
                  "text-white/80 font-medium tracking-wide",
                  mobile ? "text-xs" : "text-sm",
                )}
              >
                STELS Web 5
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isVerified
                ? (
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <Shield
                      className={cn(
                        "text-green-400",
                        mobile ? "w-3.5 h-3.5" : "w-4 h-4",
                      )}
                    />
                    {!mobile && <span>Verified</span>}
                  </div>
                )
                : (
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <ShieldOff
                      className={cn(
                        "text-amber-400",
                        mobile ? "w-3.5 h-3.5" : "w-4 h-4",
                      )}
                    />
                    {!mobile && <span>Unverified</span>}
                  </div>
                )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className={cn(
                  "text-white/60 hover:text-white hover:bg-white/10 p-0",
                  mobile ? "h-8 w-8" : "h-8 w-8",
                )}
              >
                <RefreshCw
                  className={cn(
                    loading && "animate-spin",
                    mobile ? "w-4 h-4" : "w-4 h-4",
                  )}
                />
              </Button>
            </div>
          </div>

          {/* Card Number */}
          <div
            className={cn(
              "text-white/60 font-mono tracking-wider",
              mobile ? "text-xs" : "text-sm",
            )}
          >
            {cardNumber || "•••• •••• •••• ••••"}
          </div>

          {/* Balance Section */}
          <div className="space-y-2">
            <div className="text-white/60 text-xs font-medium">
              Balance
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "font-bold text-white",
                  mobile ? "text-2xl" : "text-3xl",
                )}
              >
                {loading && balance === 0 ? "..." : (
                  <FormattedNumber
                    value={balance}
                    decimals={balanceDecimals}
                    useGrouping={true}
                  />
                )}
              </span>
              <span
                className={cn(
                  "text-white/60 font-medium",
                  mobile ? "text-xs" : "text-sm",
                )}
              >
                {balanceSymbol}
              </span>
            </div>
            <div
              className={cn(
                "text-green-400 font-semibold",
                mobile ? "text-base" : "text-lg",
              )}
            >
              {loading && usdValue === 0
                ? "..."
                : (
                  <span className="flex items-baseline gap-0">
                    <span>$</span>
                    <FormattedNumber
                      value={usdValue}
                      decimals={2}
                      useGrouping={true}
                    />
                  </span>
                )}
            </div>
            {tokensValue !== undefined && liquidity > 0 && (
              <div className="text-green-400/70 text-[10px] leading-tight">
                Tokens:{" "}
                <span className="flex items-baseline gap-0">
                  <span>$</span>
                  <FormattedNumber
                    value={tokensValue || 0}
                    decimals={2}
                    useGrouping={true}
                  />
                </span>{" "}
                + Liquidity:{" "}
                <span className="flex items-baseline gap-0">
                  <span>$</span>
                  <FormattedNumber
                    value={liquidity}
                    decimals={2}
                    useGrouping={true}
                  />
                </span>
              </div>
            )}
          </div>

          {/* Wallet Address */}
          {walletAddress && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-white/60 text-[10px] uppercase tracking-wider">
                Wallet Address
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded p-2 border border-white/20">
                <code className="text-white text-[10px] font-mono flex-1 truncate">
                  {walletAddress}
                </code>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (walletAddress) {
                      navigator.clipboard.writeText(walletAddress);
                      toast.success(
                        "Address copied!",
                        "Wallet address copied to clipboard",
                      );
                    }
                  }}
                  className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded transition-colors active:bg-white/30"
                  title="Copy address"
                >
                  <Copy className="w-3.5 h-3.5 text-white" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Liquidity Section */}
          {liquidity > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp
                  className={cn(
                    "text-white/60",
                    mobile ? "w-3.5 h-3.5" : "w-4 h-4",
                  )}
                />
                <div className="text-white/60 text-xs font-medium">
                  Liquidity
                </div>
              </div>
              <div
                className={cn(
                  "text-white/80 font-semibold",
                  mobile ? "text-base" : "text-lg",
                )}
              >
                {loading && liquidity === 0
                  ? "..."
                  : (
                    <span className="flex items-baseline gap-0">
                      <span>$</span>
                      <FormattedNumber
                        value={liquidity}
                        decimals={2}
                        useGrouping={true}
                      />
                    </span>
                  )}
              </div>
              <div className="text-white/50 text-[10px] leading-tight">
                From connected trading accounts
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
