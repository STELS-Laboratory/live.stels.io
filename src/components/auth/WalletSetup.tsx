import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Key, Wallet } from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { WalletPreview } from "./WalletPreview";

/**
 * Wallet setup component for creating or importing wallets
 */
export function WalletSetup(): React.ReactElement {
  const {
    createNewWallet,
    importExistingWallet,
    wallet,
    isWalletCreated,
    connectionError,
    clearConnectionError,
    resetWallet,
  } = useAuthStore();

  const [privateKey, setPrivateKey] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleCreateWallet = (): void => {
    clearConnectionError();
    createNewWallet();
  };

  const handleImportWallet = (): void => {
    if (!privateKey.trim()) {
      setImportError("Private key is required");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    clearConnectionError();

    const success = importExistingWallet(privateKey.trim());

    if (!success) {
      setImportError("Invalid private key format");
    } else {
      setPrivateKey("");
    }

    setIsImporting(false);
  };

  if (isWalletCreated && wallet) {
    return (
      <WalletPreview
        showActions={true}
        onReset={resetWallet}
      />
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5 text-amber-500" />
          Setup Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-zinc-400">
                Generate a new Gliesereum wallet with a unique private key
              </p>
              <Button
                onClick={handleCreateWallet}
                className="w-full"
                size="lg"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Create New Wallet
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="Enter your private key..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleImportWallet}
              disabled={isImporting || !privateKey.trim()}
              className="w-full"
              size="lg"
            >
              <Key className="h-4 w-4 mr-2" />
              {isImporting ? "Importing..." : "Import Wallet"}
            </Button>
          </TabsContent>
        </Tabs>

        {connectionError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
