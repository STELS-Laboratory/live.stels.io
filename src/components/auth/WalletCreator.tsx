import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";

interface WalletCreatorProps {
  walletType: "create" | "import";
  onBack: () => void;
  onSuccess: () => void;
}

/**
 * Professional wallet creator/importer component
 */
export function WalletCreator(
  { walletType, onBack, onSuccess }: WalletCreatorProps,
): React.ReactElement {
  const {
    createNewWallet,
    importExistingWallet,
    connectionError,
    clearConnectionError,
  } = useAuthStore();
  const [privateKey, setPrivateKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    message: string;
    type: "success" | "error" | "warning" | null;
  }>({ isValid: false, message: "", type: null });

  // Enhanced private key validation
  const validatePrivateKey = (key: string): boolean => {
    // Remove any whitespace and 0x prefix
    const cleanKey = key.replace(/^0x/, "").replace(/\s/g, "");

    // Check if it's a valid hex string
    if (!/^[0-9a-fA-F]+$/.test(cleanKey)) {
      setValidationState({
        isValid: false,
        message:
          "Private key must contain only hexadecimal characters (0-9, a-f)",
        type: "error",
      });
      return false;
    }

    // Check length (64 characters for 256-bit key)
    if (cleanKey.length !== 64) {
      setValidationState({
        isValid: false,
        message:
          `Private key must be exactly 64 characters long (currently ${cleanKey.length})`,
        type: "error",
      });
      return false;
    }

    setValidationState({
      isValid: true,
      message: "Private key format is valid",
      type: "success",
    });
    return true;
  };

  // Validate private key on change
  useEffect(() => {
    if (privateKey.trim() && walletType === "import") {
      validatePrivateKey(privateKey);
    } else {
      setValidationState({ isValid: false, message: "", type: null });
    }
  }, [privateKey, walletType]);

  const handleCreateWallet = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    clearConnectionError();

    try {
      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      createNewWallet();
      onSuccess();
    } catch (err) {
      setError("Failed to create wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async (): Promise<void> => {
    if (!privateKey.trim()) {
      setError("Private key is required");
      return;
    }

    if (!validatePrivateKey(privateKey)) {
      setError("Please enter a valid private key");
      return;
    }

    setIsLoading(true);
    setError(null);
    clearConnectionError();

    try {
      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      const success = importExistingWallet(privateKey.trim());

      if (success) {
        setPrivateKey("");
        setValidationState({ isValid: false, message: "", type: null });
        onSuccess();
      } else {
        setError("Invalid private key format. Please check and try again.");
      }
    } catch (err) {
      setError(
        "Failed to import wallet. Please check your private key and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getContent = () => {
    if (walletType === "create") {
      return {
        title: "Create New Wallet",
        subtitle: "Generate a secure wallet with a unique private key",
        icon: <Sparkles className="h-6 w-6 text-amber-500" />,
        description:
          "We'll generate a cryptographically secure private key for your new wallet. This process is completely secure and happens locally in your browser.",
        actionText: "Generate Wallet",
        actionHandler: handleCreateWallet,
      };
    } else {
      return {
        title: "Import Existing Wallet",
        subtitle: "Restore your wallet using your private key",
        icon: <Key className="h-6 w-6 text-blue-500" />,
        description:
          "Enter your 64-character hexadecimal private key to restore access to your existing wallet and funds.",
        actionText: "Import Wallet",
        actionHandler: handleImportWallet,
        showInput: true,
      };
    }
  };

  const content = getContent();

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <Card className="backdrop-blur-sm bg-zinc-900/80 border-zinc-700/50 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full blur-lg ${
                  walletType === "create" ? "bg-amber-500/20" : "bg-blue-500/20"
                }`}
              />
              <div
                className={`relative p-3 rounded-full ${
                  walletType === "create"
                    ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                    : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                } backdrop-blur-sm`}
              >
                {content.icon}
              </div>
            </div>
            <span
              className={`bg-gradient-to-r bg-clip-text text-transparent ${
                walletType === "create"
                  ? "from-amber-400 via-white to-orange-400"
                  : "from-blue-400 via-white to-cyan-400"
              }`}
            >
              {content.title}
            </span>
          </CardTitle>
          <p className="text-zinc-400 text-lg mt-3 leading-relaxed">
            {content.subtitle}
          </p>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-8">
          {/* Enhanced Description */}
          <div className="p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 rounded-xl border border-zinc-700/30 backdrop-blur-sm">
            <p className="text-zinc-300 leading-relaxed">
              {content.description}
            </p>
          </div>

          {/* Enhanced Private Key Input (only for import) */}
          {content.showInput && (
            <div className="space-y-4">
              <Label
                htmlFor="privateKey"
                className="text-sm font-semibold text-zinc-300 flex items-center gap-2"
              >
                <Key className="h-4 w-4" />
                Private Key
              </Label>

              <div className="relative">
                <Input
                  id="privateKey"
                  type={showPrivateKey ? "text" : "password"}
                  placeholder="Enter your 64-character hex private key..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className={`font-mono text-sm transition-all duration-300 ${
                    validationState.type === "error"
                      ? "border-red-500/50 focus:border-red-400 bg-red-500/5"
                      : validationState.type === "success"
                      ? "border-green-500/50 focus:border-green-400 bg-green-500/5"
                      : "border-zinc-700/50 focus:border-amber-400"
                  }`}
                  disabled={isLoading}
                  aria-describedby="private-key-help private-key-validation"
                  aria-invalid={validationState.type === "error"}
                  autoComplete="off"
                  spellCheck="false"
                />

                {/* Toggle visibility button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  {showPrivateKey
                    ? <EyeOff className="h-4 w-4 text-zinc-400" />
                    : <Eye className="h-4 w-4 text-zinc-400" />}
                </Button>
              </div>

              {/* Validation feedback */}
              {validationState.message && (
                <div
                  id="private-key-validation"
                  className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                    validationState.type === "error"
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                  role="alert"
                  aria-live="polite"
                >
                  {validationState.type === "error"
                    ? <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    : <CheckCircle className="h-4 w-4" aria-hidden="true" />}
                  {validationState.message}
                </div>
              )}

              <p id="private-key-help" className="text-xs text-zinc-500">
                Your private key is 64 hexadecimal characters (0-9, a-f). It's
                processed securely in your browser.
              </p>
            </div>
          )}

          {/* Enhanced Error Display */}
          {(error || connectionError) && (
            <Alert
              variant="destructive"
              className="border-red-500/50 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {error || connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Security Notice */}
          <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/20 rounded-full">
                <AlertCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-green-300 mb-2">
                  🔒 Maximum Security
                </div>
                <div className="text-green-200/80 text-sm leading-relaxed">
                  Your private key is processed locally in your browser using
                  advanced cryptographic functions. We never have access to your
                  private keys, and all operations happen securely on your
                  device.
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-12 border-zinc-700/50 hover:border-zinc-600/50 bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-300"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Selection
            </Button>
            <Button
              onClick={content.actionHandler}
              disabled={isLoading ||
                (content.showInput &&
                  (!privateKey.trim() || !validationState.isValid))}
              className={`flex-1 h-12 transition-all duration-300 ${
                walletType === "create"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-zinc-900 shadow-lg shadow-amber-500/25"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25"
              }`}
            >
              {isLoading
                ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {walletType === "create" ? "Generating..." : "Importing..."}
                  </>
                )
                : (
                  <>
                    {content.actionText}
                    {walletType === "create"
                      ? <Sparkles className="h-4 w-4 ml-2" />
                      : <Key className="h-4 w-4 ml-2" />}
                  </>
                )}
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
