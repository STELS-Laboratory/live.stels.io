import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface WalletPreviewProps {
  showActions?: boolean;
  onReset?: () => void;
  onContinue?: () => void;
}

/**
 * Wallet preview component showing wallet info without private key
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
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleCopyPublicKey = async (): Promise<void> => {
    if (!wallet) return;

    try {
      await navigator.clipboard.writeText(wallet.publicKey);
      setCopiedPublicKey(true);
      setTimeout(() => setCopiedPublicKey(false), 2000);
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
          <AlertCircle className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400">No wallet created yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5 text-amber-500" />
          Your Wallet
        </CardTitle>
        <p className="text-sm text-zinc-400">
          Secure Gliesereum wallet ready to use
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Status */}
        <div className="flex items-center justify-center">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-400">Address</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              className="h-6 px-2 text-xs"
            >
              {copiedAddress
                ? <CheckCircle className="h-3 w-3 text-green-500" />
                : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
            <div className="font-mono text-sm text-zinc-300 break-all">
              {wallet.address}
            </div>
          </div>
        </div>

        {/* Card Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">
            Card Number
          </label>
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
            <div className="font-mono text-sm text-zinc-300">
              {wallet.number}
            </div>
          </div>
        </div>

        {/* Public Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-400">
              Public Key
            </label>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPublicKey(!showPublicKey)}
                className="h-6 px-2 text-xs"
              >
                {showPublicKey
                  ? <EyeOff className="h-3 w-3" />
                  : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPublicKey}
                className="h-6 px-2 text-xs"
              >
                {copiedPublicKey
                  ? <CheckCircle className="h-3 w-3 text-green-500" />
                  : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
            {showPublicKey
              ? (
                <div className="font-mono text-xs text-zinc-300 break-all">
                  {wallet.publicKey}
                </div>
              )
              : (
                <div className="font-mono text-xs text-zinc-500">
                  ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                </div>
              )}
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300 text-xs">
            Your private key is securely stored and never displayed. You can
            export it later from wallet settings.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleResetWallet}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Wallet
            </Button>
            <Button
              onClick={handleContinue}
              size="sm"
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
