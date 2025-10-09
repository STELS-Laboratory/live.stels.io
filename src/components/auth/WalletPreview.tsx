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
    <div className="w-full max-w-lg mx-auto animate-fade-in-up">
      <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg" />
              <Wallet className="relative h-6 w-6 text-amber-400" />
            </div>
            <span className="bg-gradient-to-r from-amber-400 via-white to-orange-400 bg-clip-text text-transparent">
              Your Wallet
            </span>
          </CardTitle>
          <p className="text-muted-foreground mt-2 leading-relaxed">
            Secure Gliesereum wallet ready to use
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-6">
          {/* Enhanced Wallet Status */}
          <div className="flex items-center justify-center">
            <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
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
            <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border/30 backdrop-blur-sm">
              <div className="font-mono text-sm text-foreground break-all leading-relaxed">
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
            <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border/30 backdrop-blur-sm">
              <div className="font-mono text-lg text-foreground font-bold">
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
            <div className="p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border/30 backdrop-blur-sm">
              {showPublicKey
                ? (
                  <div className="font-mono text-xs text-foreground break-all leading-relaxed">
                    {wallet.publicKey}
                  </div>
                )
                : (
                  <div className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-3 bg-border dark:bg-muted rounded-full"
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

          {/* Enhanced Security Notice */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-500/20 rounded-full">
                <AlertCircle className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-blue-300 mb-1">
                  🔐 Secure Storage
                </div>
                <div className="text-blue-200/80 leading-relaxed">
                  Your private key is securely stored and never displayed. You
                  can export it later from wallet settings.
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          {showActions && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleResetWallet}
                variant="outline"
                size="sm"
                className="flex-1 h-12 border-border/50 hover:border-muted/50 bg-muted/50 hover:bg-secondary/50 transition-all duration-300"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Wallet
              </Button>
              <Button
                onClick={handleContinue}
                size="sm"
                className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black dark:text-black shadow-lg shadow-amber-500/25 transition-all duration-300"
              >
                Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
            opacity: 0;
          }
        `,
        }}
      />
    </div>
  );
}
