import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Copy,
  //Download,
  Eye,
  EyeOff,
  //Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";

interface WalletConfirmationProps {
  walletType: "create" | "import";
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Professional wallet confirmation component
 */
export function WalletConfirmation({
  walletType,
  onConfirm,
  onBack,
}: WalletConfirmationProps): React.ReactElement {
  const { wallet } = useAuthStore();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPublicKey, setCopiedPublicKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!wallet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-zinc-400">No wallet data available</p>
        </CardContent>
      </Card>
    );
  }

  const handleCopyAddress = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleCopyPublicKey = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(wallet.publicKey);
      setCopiedPublicKey(true);
      setTimeout(() => setCopiedPublicKey(false), 2000);
    } catch (error) {
      console.error("Failed to copy public key:", error);
    }
  };

  // const handleDownloadPrivateKey = (): void => {
  //   const blob = new Blob([wallet.privateKey], { type: "text/plain" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `gliesereum-private-key-${wallet.address.slice(0, 8)}.txt`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  const getWalletTypeInfo = () => {
    if (walletType === "create") {
      return {
        title: "New Wallet Created",
        subtitle: "Your wallet has been successfully generated",
        badge: {
          text: "New Wallet",
          className: "bg-green-500/20 text-green-400 border-green-500/30",
        },
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      };
    } else {
      return {
        title: "Wallet Imported",
        subtitle: "Your existing wallet has been successfully imported",
        badge: {
          text: "Imported",
          className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        },
        icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
      };
    }
  };

  const typeInfo = getWalletTypeInfo();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          {typeInfo.icon}
          {typeInfo.title}
        </CardTitle>
        <p className="text-zinc-400 mt-2">
          {typeInfo.subtitle}
        </p>
        <Badge className={`mx-auto ${typeInfo.badge.className}`}>
          {typeInfo.badge.text}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-400">
                Wallet Address
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-12 px-2 text-xs"
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
                  className="h-12 px-2 text-xs"
                >
                  {showPublicKey
                    ? <EyeOff className="h-3 w-3" />
                    : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPublicKey}
                  className="h-12 px-2 text-xs"
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
                    •••••••••••••••••••••••••••••••
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-300">
            <strong>Important:</strong>{" "}
            Please save your private key securely. If you lose it, you will
            permanently lose access to your wallet and funds.
          </AlertDescription>
        </Alert>

        {/* Confirmation Checkbox */}
        <div className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
          <input
            type="checkbox"
            id="confirmWallet"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="w-4 h-4 text-amber-500 bg-zinc-700 border-zinc-600 rounded focus:ring-amber-500 focus:ring-2"
          />
          <label htmlFor="confirmWallet" className="text-sm text-zinc-300">
            I have securely saved my private key and understand that losing it
            will result in permanent loss of access to my wallet
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-900"
          >
            Continue to Network Setup
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
