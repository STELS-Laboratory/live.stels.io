import React, { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { LOTTIE_ANIMATIONS, LOTTIE_SIZES } from "./lottie_config";

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
  const { wallet } = useAuthStore();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPublicKey, setCopiedPublicKey] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!wallet) {
    return (
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-card/80 border-border/50">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">No wallet data available</p>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = (): void => {
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
          className:
            "bg-accent text-accent-foreground border-accent-foreground/30",
        },
        icon: <CheckCircle className="icon-lg text-accent-foreground" />,
      };
    } else {
      return {
        title: "Wallet Imported",
        subtitle: "Your existing Wallet has been successfully imported",
        badge: {
          text: "Imported",
          className:
            "bg-secondary text-secondary-foreground border-secondary-foreground/30",
        },
        icon: <CheckCircle className="icon-lg text-secondary-foreground" />,
      };
    }
  };

  const typeInfo = getWalletTypeInfo();

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Wallet Confirmation Card */}
      <Card className="w-full backdrop-blur-md bg-card/80 border border-border">
        <CardHeader className="text-center pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6">
          {/* Lottie Animation - Success Checkmark */}
          <div className="flex h-20 sm:h-24 md:h-32 items-center justify-center mb-2 sm:mb-3">
            <DotLottieReact
              src={LOTTIE_ANIMATIONS.success}
              loop
              speed={0.5}
              autoplay
              style={LOTTIE_SIZES.small}
            />
          </div>

          <CardTitle className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold">
            <span className="text-foreground">
              {typeInfo.title}
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 sm:mt-2 px-2">
            {typeInfo.subtitle}
          </p>
          <Badge
            className={`mx-auto mt-1.5 sm:mt-2 text-xs ${typeInfo.badge.className}`}
          >
            {typeInfo.badge.text}
          </Badge>
        </CardHeader>

        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-3 sm:space-y-4">
          {/* Wallet Information Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-card-foreground flex items-center gap-1.5 sm:gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700 dark:text-amber-400" />
              Wallet Details
            </h3>

            <div className="p-2.5 sm:p-3 md:p-4 bg-muted/50 border border-border rounded space-y-2 sm:space-y-3">
              {/* Wallet Address */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Wallet Address
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                  >
                    {copiedAddress
                      ? (
                        <CheckCircle className="h-3 w-3 text-accent-foreground" />
                      )
                      : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="p-1.5 sm:p-2 bg-background border border-border rounded">
                  <div className="font-mono text-[10px] sm:text-xs text-foreground break-all leading-tight">
                    {wallet.address}
                  </div>
                </div>
              </div>

              {/* Card Number */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Card Number
                </label>
                <div className="p-1.5 sm:p-2 bg-background border border-border rounded">
                  <div className="font-mono text-xs sm:text-sm text-foreground">
                    {wallet.number}
                  </div>
                </div>
              </div>

              {/* Public Key */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Private Key
                  </label>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPublicKey(!showPublicKey)}
                      className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                    >
                      {showPublicKey
                        ? <EyeOff className="h-3 w-3" />
                        : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPublicKey}
                      className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                    >
                      {copiedPublicKey
                        ? (
                          <CheckCircle className="h-3 w-3 text-accent-foreground" />
                        )
                        : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="p-1.5 sm:p-2 bg-background border border-border rounded">
                  {showPublicKey
                    ? (
                      <div className="font-mono text-[10px] sm:text-xs text-foreground break-all leading-tight">
                        {wallet.privateKey}
                      </div>
                    )
                    : (
                      <div className="font-mono text-[10px] sm:text-xs text-muted-foreground">
                        •••••••••••••••••••••••••••••••
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-2.5 sm:p-3 md:p-4 bg-primary/10 border border-primary/30 rounded">
            <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-1 sm:p-1.5 rounded border border-primary/30 bg-primary/10 flex-shrink-0">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-0.5 sm:mb-1 text-[11px] sm:text-xs">
                  Important Security Notice
                </div>
                <div className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                  Please save your private key securely. If you lose it, you
                  will permanently lose access to your wallet and funds.
                  Consider using a secure password manager or hardware wallet
                  for storage.
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 p-2.5 sm:p-3 bg-muted/50 border border-border rounded">
            <input
              type="checkbox"
              id="confirmWallet"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary bg-secondary border-muted rounded focus:ring-primary focus:ring-2 mt-0.5"
            />
            <label
              htmlFor="confirmWallet"
              className="text-[11px] sm:text-xs md:text-sm text-card-foreground leading-relaxed"
            >
              I have securely saved my private key and understand that losing it
              will result in permanent loss of access to my wallet and all
              associated funds.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Back</span>
              <span className="xs:hidden">←</span>
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className="flex-1 h-9 sm:h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">
                Continue to Network Setup
              </span>
              <span className="sm:hidden">Continue</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
