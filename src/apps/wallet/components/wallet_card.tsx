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
  mobile?: boolean;
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
  mobile = false,
}: WalletCardProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div
        className={cn(
          "relative bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-black rounded-xl shadow-xl overflow-hidden",
          mobile ? "p-4" : "p-6",
        )}
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
                {loading ? "..." : formatBalance(balance)}
              </span>
              <span
                className={cn(
                  "text-white/60 font-medium",
                  mobile ? "text-xs" : "text-sm",
                )}
              >
                TST
              </span>
            </div>
            <div
              className={cn(
                "text-white/80 font-semibold",
                mobile ? "text-base" : "text-lg",
              )}
            >
              {loading ? "..." : formatUSD(usdValue)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
