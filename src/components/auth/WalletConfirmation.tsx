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
 * Professional wallet confirmation component
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
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-zinc-900/80 border-zinc-700/50 shadow-2xl">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-zinc-400">No wallet data available</p>
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Wallet Confirmation Card */}
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-zinc-900/80 border-zinc-700/50 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full blur-lg ${
                  walletType === "create" ? "bg-green-500/20" : "bg-blue-500/20"
                }`}
              />
              <div
                className={`relative p-3 rounded-full ${
                  walletType === "create"
                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30"
                    : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                } backdrop-blur-sm`}
              >
                {typeInfo.icon}
              </div>
            </div>
            <span
              className={`bg-gradient-to-r bg-clip-text text-transparent ${
                walletType === "create"
                  ? "from-green-400 via-white to-emerald-400"
                  : "from-blue-400 via-white to-cyan-400"
              }`}
            >
              {typeInfo.title}
            </span>
          </CardTitle>
          <p className="text-zinc-400 text-lg mt-3 leading-relaxed">
            {typeInfo.subtitle}
          </p>
          <Badge className={`mx-auto ${typeInfo.badge.className}`}>
            {typeInfo.badge.text}
          </Badge>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-8">
          {/* Wallet Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              Wallet Details
            </h3>

            <div className="p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 rounded-xl border border-zinc-700/30 backdrop-blur-sm space-y-4">
              {/* Wallet Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-400">
                    Wallet Address
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-8 px-2 text-xs hover:bg-zinc-700/50"
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
                    Private Key
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPublicKey(!showPublicKey)}
                      className="h-8 px-2 text-xs hover:bg-zinc-700/50"
                    >
                      {showPublicKey
                        ? <EyeOff className="h-3 w-3" />
                        : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPublicKey}
                      className="h-8 px-2 text-xs hover:bg-zinc-700/50"
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
                        {wallet.privateKey}
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
          </div>

          {/* Developer Mode Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-400" />
              Access Mode
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* User Mode */}
              <div
                onClick={() => setIsDeveloperMode(false)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  !isDeveloperMode
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 shadow-lg shadow-green-500/10"
                    : "bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      !isDeveloperMode ? "bg-green-500/20" : "bg-zinc-700/50"
                    }`}
                  >
                    <User
                      className={`h-5 w-5 ${
                        !isDeveloperMode ? "text-green-400" : "text-zinc-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div
                      className={`font-semibold ${
                        !isDeveloperMode ? "text-green-300" : "text-zinc-300"
                      }`}
                    >
                      User Mode
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      Standard access with production networks
                    </div>
                  </div>
                </div>
                {!isDeveloperMode && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Selected</span>
                  </div>
                )}
              </div>

              {/* Developer Mode */}
              <div
                onClick={() => setIsDeveloperMode(true)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isDeveloperMode
                    ? "bg-gradient-to-r from-purple-500/20 to-violet-500/20 border-purple-500/50 shadow-lg shadow-purple-500/10"
                    : "bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-600/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      isDeveloperMode ? "bg-purple-500/20" : "bg-zinc-700/50"
                    }`}
                  >
                    <Code
                      className={`h-5 w-5 ${
                        isDeveloperMode ? "text-purple-400" : "text-zinc-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div
                      className={`font-semibold ${
                        isDeveloperMode ? "text-purple-300" : "text-zinc-300"
                      }`}
                    >
                      Developer Mode
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      Access to test networks and dev tools
                    </div>
                  </div>
                </div>
                {isDeveloperMode && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <span className="text-xs text-purple-400">Selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/20 rounded-full">
                <AlertCircle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <div className="font-semibold text-amber-300 mb-2 text-lg">
                  🔒 Important Security Notice
                </div>
                <div className="text-amber-200/80 text-sm leading-relaxed">
                  Please save your private key securely. If you lose it, you
                  will permanently lose access to your wallet and funds.
                  Consider using a secure password manager or hardware wallet
                  for storage.
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
            <input
              type="checkbox"
              id="confirmWallet"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="w-4 h-4 text-amber-500 bg-zinc-700 border-zinc-600 rounded focus:ring-amber-500 focus:ring-2 mt-0.5"
            />
            <label
              htmlFor="confirmWallet"
              className="text-sm text-zinc-300 leading-relaxed"
            >
              I have securely saved my private key and understand that losing it
              will result in permanent loss of access to my wallet and all
              associated funds. I also confirm my selected access mode.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-12 border-zinc-700/50 hover:border-zinc-600/50 bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-zinc-900 shadow-lg shadow-amber-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Network Setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fade-in-up {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .animate-fade-in-up {
              animation: fade-in-up 0.8s ease-out forwards;
              opacity: 0;
            }
          `,
        }}
      />
    </div>
  );
}
