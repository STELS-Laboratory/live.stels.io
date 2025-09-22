import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/modules/auth.store";

/**
 * Debug component for troubleshooting authentication state
 */
export const AuthDebug: React.FC = () => {
  const {
    wallet,
    isWalletCreated,
    selectedNetwork,
    isConnected,
    isConnecting,
    connectionSession,
    connectionError,
    isAuthenticated,
    _hasHydrated,
    disconnectFromNode,
    resetAuth,
  } = useAuthStore();

  const [debugInfo, setDebugInfo] = useState({
    localStorageAuth: null as any,
    localStoragePrivate: null as any,
    timestamp: Date.now(),
  });

  useEffect(() => {
    const authData = localStorage.getItem("auth-store");
    const privateData = localStorage.getItem("private-store");

    setDebugInfo({
      localStorageAuth: authData ? JSON.parse(authData) : null,
      localStoragePrivate: privateData ? JSON.parse(privateData) : null,
      timestamp: Date.now(),
    });
  }, [isAuthenticated, isConnected, connectionSession]);

  const handleDisconnect = async (): Promise<void> => {
    console.log("[AuthDebug] Triggering disconnect...");
    await disconnectFromNode();
  };

  const handleReset = async (): Promise<void> => {
    console.log("[AuthDebug] Triggering auth reset...");
    await resetAuth();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Authentication Debug
          <Badge variant="outline" className="text-blue-400 border-blue-500/30">
            Debug
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          {/* Store State */}
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">
              Store State
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Hydrated:</span>
                <Badge
                  variant={_hasHydrated ? "default" : "destructive"}
                  className="ml-2"
                >
                  {_hasHydrated ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Store vs LS Auth:</span>
                <div className="flex gap-1 mt-1">
                  <Badge
                    variant={isAuthenticated ? "default" : "destructive"}
                    className="text-xs"
                  >
                    Store: {isAuthenticated ? "✓" : "✗"}
                  </Badge>
                  <Badge
                    variant={debugInfo.localStorageAuth?.state?.isAuthenticated
                      ? "default"
                      : "destructive"}
                    className="text-xs"
                  >
                    LS: {debugInfo.localStorageAuth?.state?.isAuthenticated
                      ? "✓"
                      : "✗"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Authenticated:</span>
                <Badge
                  variant={isAuthenticated ? "default" : "destructive"}
                  className="ml-2"
                >
                  {isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Connected:</span>
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className="ml-2"
                >
                  {isConnected ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Connecting:</span>
                <Badge
                  variant={isConnecting ? "secondary" : "outline"}
                  className="ml-2"
                >
                  {isConnecting ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Wallet Created:</span>
                <Badge
                  variant={isWalletCreated ? "default" : "destructive"}
                  className="ml-2"
                >
                  {isWalletCreated ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Wallet & Network */}
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">
              Wallet & Network
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Wallet Address:</span>
                <div className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">
                  {wallet?.address || "None"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Network:</span>
                <Badge variant="secondary" className="ml-2">
                  {selectedNetwork?.name || "None"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Session:</span>
                <div className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">
                  {connectionSession?.session?.slice(0, 20) || "None"}
                  {connectionSession?.session && "..."}
                </div>
              </div>
              {connectionError && (
                <div>
                  <span className="text-muted-foreground">Error:</span>
                  <div className="mt-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                    {connectionError}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LocalStorage */}
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">
              LocalStorage
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Auth Store:</span>
                <Badge
                  variant={debugInfo.localStorageAuth
                    ? "default"
                    : "destructive"}
                  className="ml-2"
                >
                  {debugInfo.localStorageAuth ? "Present" : "Missing"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Private Store:</span>
                <Badge
                  variant={debugInfo.localStoragePrivate
                    ? "default"
                    : "destructive"}
                  className="ml-2"
                >
                  {debugInfo.localStoragePrivate ? "Present" : "Missing"}
                </Badge>
              </div>
              {debugInfo.localStoragePrivate?.raw?.session && (
                <div>
                  <span className="text-muted-foreground">Session in LS:</span>
                  <div className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">
                    {debugInfo.localStoragePrivate.raw.session.slice(0, 20)}...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
          >
            Test Disconnect
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
          >
            Reset Auth
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
          >
            Reload Page
          </Button>
          <div className="text-xs text-muted-foreground self-center ml-auto">
            Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
