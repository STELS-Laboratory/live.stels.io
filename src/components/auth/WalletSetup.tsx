import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Key, Wallet } from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";

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

  const handleDownloadPrivateKey = (): void => {
    if (!wallet) return;

    const blob = new Blob([wallet.privateKey], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gliesereum-private-key-${wallet.address.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isWalletCreated && wallet) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5 text-amber-500" />
            Wallet Created
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-400">Address</Label>
            <div className="p-3 bg-zinc-800 rounded-lg font-mono text-sm break-all">
              {wallet.address}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-400">
              Public Key
            </Label>
            <div className="p-3 bg-zinc-800 rounded-lg font-mono text-sm break-all">
              {wallet.publicKey}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-400">
              Card Number
            </Label>
            <div className="p-3 bg-zinc-800 rounded-lg font-mono text-sm">
              {wallet.number}
            </div>
          </div>

          <Button
            onClick={handleDownloadPrivateKey}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Private Key
          </Button>

          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
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
