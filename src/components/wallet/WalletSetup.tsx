import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletStore } from "@/stores/modules/wallet.store";
import LogoSVG from "@/assets/logo.svg";

interface WalletSetupProps {
  onWalletCreated?: () => void;
}

/**
 * Wallet setup component for creating new wallets and importing existing ones
 */
export function WalletSetup({ onWalletCreated }: WalletSetupProps) {
  const {
    createNewWallet,
    importExistingWallet,
    isLoading,
    error,
    clearError,
  } = useWalletStore();

  const [privateKey, setPrivateKey] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const handleCreateWallet = () => {
    clearError();
    createNewWallet();
    onWalletCreated?.();
  };

  const handleImportWallet = async () => {
    if (!privateKey.trim()) {
      setImportError("Private key is required");
      return;
    }

    clearError();
    setImportError(null);

    const success = await importExistingWallet(privateKey.trim());
    if (success) {
      setPrivateKey("");
      onWalletCreated?.();
    }
  };

  const handlePrivateKeyChange = (value: string) => {
    setPrivateKey(value);
    setImportError(null);
  };

  return (
    <Card className="bg-zinc-950 border-zinc-700/50 max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-32 h-32 flex items-center justify-center mx-auto mb-4">
          {/*<Graphite size={5}/>*/}
	        <img src={LogoSVG} alt="Gliesereum Wallet"/>
        </div>
        <CardTitle className="text-zinc-100 text-xl">
          Gliesereum Wallet
        </CardTitle>
        <p className="text-zinc-400 text-sm mt-2">
          Create a new wallet or import an existing one
        </p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid h-14 w-full grid-cols-2 bg-zinc-800/50">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-900"
            >
              Create
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-900"
            >
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
                <div className="text-4xl mb-2">🔐</div>
                <h3 className="text-zinc-100 font-medium mb-2">
                  Create New Wallet
                </h3>
                <p className="text-zinc-400 text-sm">
                  Generate a new secure wallet with a unique private key
                </p>
              </div>

              <Button
                onClick={handleCreateWallet}
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-medium"
              >
                {isLoading ? "Creating..." : "Create New Wallet"}
              </Button>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="private-key" className="text-zinc-300">
                  Private Key
                </Label>
                <Input
                  id="private-key"
                  type="password"
                  placeholder="Enter your 64-character private key"
                  value={privateKey}
                  onChange={(e) => handlePrivateKeyChange(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 font-mono"
                  maxLength={64}
                />
                <p className="text-xs text-zinc-500">
                  Enter the 64-character hexadecimal private key
                </p>
              </div>

              <Button
                onClick={handleImportWallet}
                disabled={isLoading || !privateKey.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-medium"
              >
                {isLoading ? "Importing..." : "Import Wallet"}
              </Button>

              {(error || importError) && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error || importError}</p>
                </div>
              )}

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-amber-400 text-sm">⚠️</div>
                  <div className="text-xs text-amber-300">
                    <strong>Security Notice:</strong>{" "}
                    Never share your private key with anyone. It provides full
                    access to your wallet and funds.
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
