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
 * Professional Wallet creator/importer component
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
      await new Promise((resolve) => setTimeout(resolve, 150));
      createNewWallet();
      onSuccess();
    } catch {
      setError("Failed to create Wallet. Please try again.");
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
      await new Promise((resolve) => setTimeout(resolve, 200));

      const success = importExistingWallet(privateKey.trim());

      if (success) {
        setPrivateKey("");
        setValidationState({ isValid: false, message: "", type: null });
        onSuccess();
      } else {
        setError("Invalid private key format. Please check and try again.");
      }
    } catch {
      setError(
        "Failed to import Wallet. Please check your private key and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getContent = () => {
    if (walletType === "create") {
      return {
        title: "Create New Wallet",
        subtitle: "Generate a secure Wallet with a unique private key",
        icon: <Sparkles className="h-6 w-6 text-amber-500" />,
        description:
          "We'll generate a cryptographically secure private key for your new Wallet. This process is completely secure and happens locally in your browser.",
        actionText: "Generate Wallet",
        actionHandler: handleCreateWallet,
      };
    } else {
      return {
        title: "Import Existing Wallet",
        subtitle: "Restore your Wallet using your private key",
        icon: <Key className="h-6 w-6 text-blue-500" />,
        description:
          "Enter your 64-character hexadecimal private key to restore access to your existing Wallet and funds.",
        actionText: "Import Wallet",
        actionHandler: handleImportWallet,
        showInput: true,
      };
    }
  };

  const content = getContent();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="backdrop-blur-md bg-zinc-900/80 border border-zinc-800">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-xl font-bold">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                walletType === "create"
                  ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"
              }`}
            >
              {walletType === "create"
                ? <Sparkles className="h-6 w-6 text-black" />
                : <Key className="h-6 w-6 text-white" />}
            </div>
            <span className="text-foreground">
              {content.title}
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            {content.subtitle}
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-4">
          {/* Description */}
          <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            <p className="text-muted-foreground text-sm">
              {content.description}
            </p>
          </div>

          {/* Enhanced Private Key Input (only for import) */}
          {content.showInput && (
            <div className="space-y-4">
              <Label
                htmlFor="privateKey"
                className="text-sm font-semibold text-card-foreground flex items-center gap-2"
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
                  className={`h-10 font-mono text-sm transition-colors ${
                    validationState.type === "error"
                      ? "border-red-500/30 focus:border-red-500 bg-red-500/5"
                      : validationState.type === "success"
                      ? "border-green-500/30 focus:border-green-500 bg-green-500/5"
                      : "border-border focus:border-amber-500"
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
                    ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                    : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>

              {/* Validation feedback */}
              {validationState.message && (
                <div
                  id="private-key-validation"
                  className={`flex items-center gap-2 text-sm transition-all duration-150 ${
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

              <p
                id="private-key-help"
                className="text-xs text-muted-foreground"
              >
                Your private key is 64 hexadecimal characters (0-9, a-f). It's
                processed securely in your browser.
              </p>
            </div>
          )}

          {/* Error Display */}
          {(error || connectionError) && (
            <Alert
              variant="destructive"
              className="border-red-500/30 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">
                {error || connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg border border-green-500/30 bg-green-500/10">
                <AlertCircle className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-1 text-xs">
                  Maximum Security
                </div>
                <div className="text-muted-foreground text-xs">
                  Your private key is processed locally in your browser using
                  advanced cryptographic functions. We never have access to your
                  private keys, and all operations happen securely on your
                  device.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-10"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={content.actionHandler}
              disabled={isLoading ||
                (content.showInput &&
                  (!privateKey.trim() || !validationState.isValid))}
              className={`flex-1 h-10 font-bold ${
                walletType === "create"
                  ? "bg-amber-500 hover:bg-amber-600 text-black"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
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
    </div>
  );
}
