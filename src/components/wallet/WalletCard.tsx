import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Wallet } from "@/lib/gliesereum";
import { useWalletStore } from "@/stores/modules/wallet.store";

interface WalletCardProps {
  wallet: Wallet;
  onExport?: () => void;
  onLock?: () => void;
}

/**
 * Beautiful wallet card component with gradient design and card number display
 */
export function WalletCard({ wallet, onExport, onLock }: WalletCardProps) {
  const { isUnlocked } = useWalletStore();

  // Format card number with spaces for better readability
  const formatCardNumber = (number: string): string => {
    return number.replace(/(.{4})/g, "$1 ").trim();
  };

  // Get card type based on number prefix
  const getCardType = (number: string): string => {
    if (number.startsWith("0")) return "Classic";
    if (number.startsWith("1")) return "Premium";
    if (number.startsWith("2")) return "Elite";
    return "Standard";
  };

  const cardType = getCardType(wallet.number);

  return (
    <div className="relative group">
      {/* Main Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border-zinc-700/50 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-amber-500/20">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 opacity-60" />

        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_50%)] animate-pulse" />
        </div>

        {/* Card Header */}
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-zinc-900 font-bold text-sm">G</span>
              </div>
              <div>
                <CardTitle className="text-zinc-100 text-lg font-semibold">
                  Gliesereum Wallet
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="bg-amber-500/20 text-amber-300 border-amber-500/30"
                >
                  {cardType}
                </Badge>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isUnlocked ? "bg-green-400" : "bg-red-400"
                } animate-pulse`}
              />
              <span className="text-xs text-zinc-400">
                {isUnlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Card Content */}
        <CardContent className="relative z-10 space-y-6">
          {/* Card Number Display */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">
              Card Number
            </label>
            <div className="font-mono text-xl text-zinc-100 tracking-wider bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
              {formatCardNumber(wallet.number)}
            </div>
          </div>

          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">
              Wallet Address
            </label>
            <div className="font-mono text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 break-all">
              {wallet.address}
            </div>
          </div>

          {/* Public Key (Truncated) */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">
              Public Key
            </label>
            <div className="font-mono text-xs text-zinc-400 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
              {wallet.publicKey.slice(0, 20)}...{wallet.publicKey.slice(-20)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex-1 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100"
              >
                Export Key
              </Button>
            )}
            {onLock && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLock}
                className="flex-1 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100"
              >
                {isUnlocked ? "Lock Wallet" : "Unlock Wallet"}
              </Button>
            )}
          </div>
        </CardContent>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-xl" />
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-lg" />
      </Card>
    </div>
  );
}
