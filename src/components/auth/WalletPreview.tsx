import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { NetworkSelectorCompact } from "./NetworkSelectorCompact";

interface WalletPreviewProps {
  showActions?: boolean;
  onReset?: () => void;
  onContinue?: () => void;
}

/**
 * Wallet preview component showing Wallet info without private key
 */
export function WalletPreview({
  showActions = false,
  onReset,
  onContinue,
}: WalletPreviewProps): React.ReactElement {
  const { wallet, isWalletCreated } = useAuthStore();
  const [copiedAddress, setCopiedAddress] = React.useState(false);
  const [copiedPublicKey, setCopiedPublicKey] = React.useState(false);
  const [showPublicKey, setShowPublicKey] = React.useState(false);

  const handleCopyAddress = async (): Promise<void> => {
    if (!wallet) return;

    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleCopyPublicKey = async (): Promise<void> => {
    if (!wallet) return;

    try {
      await navigator.clipboard.writeText(wallet.publicKey);
      setCopiedPublicKey(true);
      setTimeout(() => setCopiedPublicKey(false), 1500);
    } catch (error) {
      console.error("Failed to copy public key:", error);
    }
  };

  const handleResetWallet = (): void => {
    onReset?.();
  };

  const handleContinue = (): void => {
    onContinue?.();
  };

  if (!isWalletCreated || !wallet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No wallet created yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className="bg-card border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-lg font-bold">
            <div className="relative p-2 border-2 border-amber-500/30 bg-amber-500/10">
              <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
              <Wallet className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-foreground">
              Your Wallet
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-xs mt-1">
            Secure Gliesereum wallet ready to use
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-4">
          {/* Wallet Status */}
          <div className="flex items-center justify-center">
            <Badge className="bg-green-500/10 text-green-500 border-green-500/30 px-3 py-1 text-xs">
              <CheckCircle className="h-3 w-3 mr-1.5" />
              Wallet Ready
            </Badge>
          </div>

          {/* Enhanced Address */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                Wallet Address
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-12 px-3 text-xs hover:bg-secondary/50 transition-all duration-200"
              >
                {copiedAddress
                  ? <CheckCircle className="h-4 w-4 text-green-400" />
                  : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            <div className="p-2 bg-background border border-border">
              <div className="font-mono text-xs text-foreground break-all">
                {wallet.address}
              </div>
            </div>
          </div>

          {/* Enhanced Card Number */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              Card Number
            </label>
            <div className="p-2 bg-background border border-border">
              <div className="font-mono text-sm text-foreground font-bold">
                {wallet.number}
              </div>
            </div>
          </div>

          {/* Enhanced Public Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                Public Key
              </label>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPublicKey(!showPublicKey)}
                  className="h-12 px-3 text-xs hover:bg-secondary/50 transition-all duration-200"
                >
                  {showPublicKey
                    ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                    : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPublicKey}
                  className="h-12 px-3 text-xs hover:bg-secondary/50 transition-all duration-200"
                >
                  {copiedPublicKey
                    ? <CheckCircle className="h-4 w-4 text-green-400" />
                    : <Copy className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="p-2 bg-background border border-border">
              {showPublicKey
                ? (
                  <div className="font-mono text-xs text-foreground break-all">
                    {wallet.publicKey}
                  </div>
                )
                : (
                  <div className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-2 bg-border"
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Network Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              Network Connection
            </label>
            <NetworkSelectorCompact />
          </div>

          {/* Security Notice */}
          <div className="relative p-3 bg-blue-500/5 border border-blue-500/30">
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-blue-500/50" />
            <div className="flex items-start gap-2">
              <div className="p-1 border border-blue-500/30 bg-blue-500/10">
                <AlertCircle className="h-3 w-3 text-blue-500" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-foreground mb-0.5">
                  Secure Storage
                </div>
                <div className="text-muted-foreground">
                  Your private key is securely stored and never displayed. You
                  can export it later from wallet settings.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-3">
              <Button
                onClick={handleResetWallet}
                variant="outline"
                size="sm"
                className="flex-1 h-9"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Wallet
              </Button>
              <Button
                onClick={handleContinue}
                size="sm"
                className="flex-1 h-9 bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
