import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Code,
  Copy,
  Eye,
  EyeOff,
  Shield,
  User,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";

interface WalletConfirmationProps {
  walletType: "create" | "import";
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Professional Wallet confirmation component
 */
export function WalletConfirmation({
  walletType,
  onConfirm,
  onBack,
}: WalletConfirmationProps): React.ReactElement {
  const { wallet, setDeveloperMode } = useAuthStore();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPublicKey, setCopiedPublicKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  if (!wallet) {
    return (
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">No wallet data available</p>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = (): void => {
    // Set developer mode in the store before confirming
    setDeveloperMode(isDeveloperMode);
    onConfirm();
  };

  const handleCopyAddress = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleCopyPublicKey = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(wallet.publicKey);
      setCopiedPublicKey(true);
      setTimeout(() => setCopiedPublicKey(false), 1500);
    } catch (error) {
      console.error("Failed to copy public key:", error);
    }
  };

  // const handleDownloadPrivateKey = (): void => {
  //   const blob = new Blob([Wallet.privateKey], { type: "text/plain" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `gliesereum-private-key-${Wallet.address.slice(0, 8)}.txt`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  const getWalletTypeInfo = () => {
    if (walletType === "create") {
      return {
        title: "New Wallet Created",
        subtitle: "Your Wallet has been successfully generated",
        badge: {
          text: "New Wallet",
          className: "bg-green-500/20 text-green-700 dark:text-green-600 border-green-500/30",
        },
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      };
    } else {
      return {
        title: "Wallet Imported",
        subtitle: "Your existing Wallet has been successfully imported",
        badge: {
          text: "Imported",
          className: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
        },
        icon: <CheckCircle className="h-6 w-6 text-blue-500" />,
      };
    }
  };

  const typeInfo = getWalletTypeInfo();

  return (
    <div className="space-y-6">
      {/* Wallet Confirmation Card */}
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-md bg-card/80 border border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-xl font-bold">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                walletType === "create"
                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              }`}
            >
              {walletType === "create"
                ? <CheckCircle className="h-6 w-6 text-white" />
                : <CheckCircle className="h-6 w-6 text-white" />}
            </div>
            <span className="text-foreground">
              {typeInfo.title}
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            {typeInfo.subtitle}
          </p>
          <Badge className={`mx-auto mt-2 ${typeInfo.badge.className}`}>
            {typeInfo.badge.text}
          </Badge>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-4">
          {/* Wallet Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              Wallet Details
            </h3>

            <div className="p-4 bg-muted/50 border border-border rounded-lg space-y-3">
              {/* Wallet Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Wallet Address
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-8 px-2 text-xs"
                  >
                    {copiedAddress
                      ? <CheckCircle className="h-3 w-3 text-green-500" />
                      : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="p-2 bg-background border border-border rounded">
                  <div className="font-mono text-xs text-foreground break-all">
                    {wallet.address}
                  </div>
                </div>
              </div>

              {/* Card Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Card Number
                </label>
                <div className="p-2 bg-background border border-border rounded">
                  <div className="font-mono text-sm text-foreground">
                    {wallet.number}
                  </div>
                </div>
              </div>

              {/* Public Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Private Key
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPublicKey(!showPublicKey)}
                      className="h-8 px-2 text-xs"
                    >
                      {showPublicKey
                        ? <EyeOff className="h-3 w-3" />
                        : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPublicKey}
                      className="h-8 px-2 text-xs"
                    >
                      {copiedPublicKey
                        ? <CheckCircle className="h-3 w-3 text-green-500" />
                        : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-background border border-border rounded">
                  {showPublicKey
                    ? (
                      <div className="font-mono text-xs text-foreground break-all">
                        {wallet.privateKey}
                      </div>
                    )
                    : (
                      <div className="font-mono text-xs text-muted-foreground">
                        •••••••••••••••••••••••••••••••
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Developer Mode Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-700 dark:text-purple-400" />
              Access Mode
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* User Mode */}
              <div
                onClick={() => setIsDeveloperMode(false)}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  !isDeveloperMode
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-muted/50 border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      !isDeveloperMode
                        ? "border-green-500/30 bg-green-500/10"
                        : "border-border bg-background"
                    }`}
                  >
                    <User
                      className={`h-5 w-5 ${
                        !isDeveloperMode
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      User Mode
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Standard access with production networks
                    </div>
                  </div>
                </div>
                {!isDeveloperMode && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-500 font-medium">
                      Selected
                    </span>
                  </div>
                )}
              </div>

              {/* Developer Mode */}
              <div
                onClick={() => setIsDeveloperMode(true)}
                className={`p-4 border rounded-lg transition-all cursor-pointer ${
                  isDeveloperMode
                    ? "bg-purple-500/10 border-purple-500/30"
                    : "bg-muted/50 border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      isDeveloperMode
                        ? "border-purple-500/30 bg-purple-500/10"
                        : "border-border bg-background"
                    }`}
                  >
                    <Code
                      className={`h-5 w-5 ${
                        isDeveloperMode
                          ? "text-purple-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      Developer
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Access to test networks and dev tools
                    </div>
                  </div>
                </div>
                {isDeveloperMode && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-xs text-purple-500 font-medium">
                      Selected
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-1 text-xs">
                  Important Security Notice
                </div>
                <div className="text-muted-foreground text-xs">
                  Please save your private key securely. If you lose it, you
                  will permanently lose access to your wallet and funds.
                  Consider using a secure password manager or hardware wallet
                  for storage.
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 border border-border rounded-lg">
            <input
              type="checkbox"
              id="confirmWallet"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="w-4 h-4 text-amber-500 bg-secondary border-muted rounded focus:ring-amber-500 focus:ring-2 mt-0.5"
            />
            <label
              htmlFor="confirmWallet"
              className="text-sm text-card-foreground leading-relaxed"
            >
              I have securely saved my private key and understand that losing it
              will result in permanent loss of access to my wallet and all
              associated funds. I also confirm my selected access mode.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Network Setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
