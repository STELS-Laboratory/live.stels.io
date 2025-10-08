import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle,
  Database,
  Key,
  Network,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { clearAllStorage } from "@/lib/storage-cleaner";

/**
 * Debug panel for testing authentication functionality
 */
export function AuthTestPanel(): React.ReactElement {
  const {
    wallet,
    selectedNetwork,
    isConnected,
    isConnecting,
    connectionSession,
    connectionError,
    connectToNode,
    disconnectFromNode,
    resetAuth,
    restoreConnection,
    resetWallet,
  } = useAuthStore();

  const handleClearAllData = async (): Promise<void> => {
    // Clear all localStorage data
    localStorage.clear();
    // Reset auth state
    await resetAuth();
    console.log("[AuthTest] All data cleared");
  };

  const handleTestRestore = async (): Promise<void> => {
    console.log("[AuthTest] Testing restore connection...");
    const success = await restoreConnection();
    console.log("[AuthTest] Restore result:", success);
  };

  const handleTestFullClear = async (): Promise<void> => {
    console.log("[AuthTest] Testing full storage clear...");
    try {
      await clearAllStorage();
      console.log("[AuthTest] Full storage clear completed");
    } catch (error) {
      console.error("[AuthTest] Full storage clear failed:", error);
    }
  };

  const handleTestResetWallet = (): void => {
    console.log("[AuthTest] Testing wallet reset...");
    resetWallet();
    console.log("[AuthTest] Wallet reset completed");
  };

  const checkLocalStorage = () => {
    const authStore = localStorage.getItem("auth-store");
    const privateStore = localStorage.getItem("private-store");
    const oldWallet = localStorage.getItem("_g");

    return {
      authStore: authStore ? JSON.parse(authStore) : null,
      privateStore: privateStore ? JSON.parse(privateStore) : null,
      oldWallet: oldWallet ? JSON.parse(oldWallet) : null,
    };
  };

  const localStorageData = checkLocalStorage();

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Authentication Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Current State</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span>Wallet:</span>
                  <Badge variant={wallet ? "default" : "secondary"}>
                    {wallet ? "Created" : "None"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  <span>Network:</span>
                  <Badge variant={selectedNetwork ? "default" : "secondary"}>
                    {selectedNetwork?.name || "None"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected
                    ? <CheckCircle className="h-4 w-4 text-green-500" />
                    : <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span>Connected:</span>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Connecting:</span>
                  <Badge variant={isConnecting ? "default" : "secondary"}>
                    {isConnecting ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Session Info</h4>
              <div className="space-y-1 text-sm">
                <div>Session ID: {connectionSession?.session || "None"}</div>
                <div>Network: {connectionSession?.network || "None"}</div>
                <div>API: {connectionSession?.api || "None"}</div>
                <div>
                  Developer: {connectionSession?.developer ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}

          {/* LocalStorage Info */}
          <div className="space-y-2">
            <h4 className="font-medium">LocalStorage Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-muted rounded border">
                <div className="font-medium">auth-store</div>
                <div className="text-muted-foreground">
                  {localStorageData.authStore ? "Present" : "Empty"}
                </div>
              </div>
              <div className="p-2 bg-muted rounded border">
                <div className="font-medium">private-store</div>
                <div className="text-muted-foreground">
                  {localStorageData.privateStore ? "Present" : "Empty"}
                </div>
              </div>
              <div className="p-2 bg-muted rounded border">
                <div className="font-medium">_g (old wallet)</div>
                <div className="text-muted-foreground">
                  {localStorageData.oldWallet ? "Present" : "Empty"}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={connectToNode}
              disabled={!wallet || !selectedNetwork || isConnecting}
              size="sm"
              className="h-12"
            >
              Connect to Node
            </Button>

            <Button
              onClick={disconnectFromNode}
              disabled={!isConnected}
              variant="outline"
              size="sm"
              className="h-12"
            >
              Disconnect
            </Button>

            <Button
              onClick={handleTestRestore}
              disabled={isConnecting || !wallet || !selectedNetwork}
              variant="outline"
              size="sm"
              className="h-12"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Restore
            </Button>

            <Button
              onClick={handleClearAllData}
              variant="destructive"
              size="sm"
              className="h-12"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>

            <Button
              onClick={handleTestFullClear}
              variant="destructive"
              size="sm"
              className="h-12"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Test Full Clear
            </Button>

            <Button
              onClick={handleTestResetWallet}
              variant="outline"
              size="sm"
              className="h-12"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Test Reset Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
