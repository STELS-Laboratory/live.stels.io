import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Network, Server, Shield } from "lucide-react";
import { type NetworkConfig, useAuthStore } from "@/stores/modules/auth.store";

interface NetworkSelectorProps {
  onNetworkSelected?: () => void;
}

/**
 * Network selector component for choosing the network to connect to
 */
export function NetworkSelector(
  { onNetworkSelected }: NetworkSelectorProps,
): React.ReactElement {
  const {
    availableNetworks,
    selectedNetwork,
    selectNetwork,
    connectionError,
    clearConnectionError,
  } = useAuthStore();

  const handleNetworkSelect = (network: NetworkConfig): void => {
    clearConnectionError();
    selectNetwork(network);
    onNetworkSelected?.();
  };

  const getNetworkIcon = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return <Shield className="h-5 w-5 text-blue-500" />;
      case "mainnet":
        return <Server className="h-5 w-5 text-green-500" />;
      case "localnet":
        return <Network className="h-5 w-5 text-purple-500" />;
      default:
        return <Network className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNetworkStatusColor = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "mainnet":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "localnet":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-zinc-500/20 text-muted-foreground border-zinc-500/30";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-lg">
          <div className="relative p-1.5 border border-amber-500/30 bg-amber-500/10">
            <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-amber-500/50" />
            <Network className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-foreground">Select Network</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Choose the network you want to connect to
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {availableNetworks.map((network) => (
            <div
              key={network.id}
              className={`relative p-3 border cursor-pointer transition-colors hover:bg-muted ${
                selectedNetwork?.id === network.id
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border"
              }`}
              onClick={() => handleNetworkSelect(network)}
            >
              {selectedNetwork?.id === network.id && (
                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-amber-500/50" />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getNetworkIcon(network)}
                  <div>
                    <h3 className="font-medium text-foreground">
                      {network.name}
                    </h3>
                    {network.description && (
                      <p className="text-sm text-muted-foreground">
                        {network.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {network.developer && (
                    <Badge variant="outline" className="text-xs">
                      Dev
                    </Badge>
                  )}
                  <Badge
                    className={`text-xs ${getNetworkStatusColor(network)}`}
                  >
                    {network.id}
                  </Badge>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-muted-foreground">API:</span>
                    <div className="font-mono text-card-foreground break-all">
                      {network.api}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Socket:</span>
                    <div className="font-mono text-card-foreground break-all">
                      {network.socket}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {connectionError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        {selectedNetwork && (
          <div className="relative mt-3 p-3 bg-amber-500/5 border border-amber-500/30">
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500">
                <Network className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">
                  Selected: {selectedNetwork.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500" />
                <span className="text-[10px] text-muted-foreground">Ready</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
