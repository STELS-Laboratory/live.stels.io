import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Key, Sparkles } from "lucide-react";
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

    setIsLoading(true);
    setError(null);
    clearConnectionError();

    try {
      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      const success = importExistingWallet(privateKey.trim());

      if (success) {
        setPrivateKey("");
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
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          {content.icon}
          {content.title}
        </CardTitle>
        <p className="text-zinc-400 mt-2">
          {content.subtitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
          <p className="text-sm text-zinc-300">
            {content.description}
          </p>
        </div>

        {/* Private Key Input (only for import) */}
        {content.showInput && (
          <div className="space-y-2">
            <Label htmlFor="privateKey" className="text-sm font-medium">
              Private Key
            </Label>
            <Input
              id="privateKey"
              type="password"
              placeholder="Enter your 64-character hex private key..."
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="font-mono text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-zinc-500">
              Your private key is 64 hexadecimal characters (0-9, a-f)
            </p>
          </div>
        )}

        {/* Error Display */}
        {(error || connectionError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || connectionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Security Notice */}
        <Alert className="bg-green-500/10 border-green-500/30">
          <AlertCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300 text-sm">
            <strong>Secure:</strong>{" "}
            Your private key is processed locally in your browser. We never have
            access to your private keys.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={content.actionHandler}
            disabled={isLoading || (content.showInput && !privateKey.trim())}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-900"
          >
            {isLoading
              ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-900 mr-2" />
                  Processing...
                </>
              )
              : (
                content.actionText
              )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
