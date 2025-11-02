/**
 * Wallet Card Component
 * Displays wallet card with balance and USD value
 */

import React from "react";
import { motion } from "framer-motion";
import { CreditCard, RefreshCw, Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WalletCardProps {
  cardNumber: string;
  balance: number;
  usdValue: number;
  isVerified: boolean;
  loading: boolean;
  onRefresh: () => void;
}

/**
 * Format balance with proper decimals
 */
function formatBalance(balance: number, decimals: number = 6): string {
  return balance.toFixed(decimals);
}

/**
 * Format USD value
 */
function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Wallet Card Component
 */
export function WalletCard({
  cardNumber,
  balance,
  usdValue,
  isVerified,
  loading,
  onRefresh,
}: WalletCardProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="relative bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-black rounded-xl p-6 shadow-xl overflow-hidden">
        {/* Card Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500 rounded-full translate-y-20 -translate-x-20" />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white/80" />
              <span className="text-white/80 font-medium text-sm tracking-wide">
                STELS Web 5
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isVerified
                ? (
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Verified</span>
                  </div>
                )
                : (
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <ShieldOff className="w-4 h-4 text-amber-400" />
                    <span>Unverified</span>
                  </div>
                )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              >
                <RefreshCw
                  className={cn(
                    "w-4 h-4",
                    loading && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>

          {/* Card Number */}
          <div className="text-white/60 text-sm font-mono tracking-wider">
            {cardNumber || "•••• •••• •••• ••••"}
          </div>

          {/* Balance Section */}
          <div className="space-y-2">
            <div className="text-white/60 text-xs font-medium">
              Balance
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {loading ? "..." : formatBalance(balance)}
              </span>
              <span className="text-white/60 text-sm font-medium">
                TST
              </span>
            </div>
            <div className="text-white/80 text-lg font-semibold">
              {loading ? "..." : formatUSD(usdValue)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
