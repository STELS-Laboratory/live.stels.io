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
        return <Network className="h-5 w-5 text-zinc-500" />;
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
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Network className="h-5 w-5 text-amber-500" />
          Select Network
        </CardTitle>
        <p className="text-sm text-zinc-400">
          Choose the network you want to connect to
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {availableNetworks.map((network) => (
            <div
              key={network.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-zinc-800/50 ${
                selectedNetwork?.id === network.id
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-zinc-700/50 hover:border-zinc-600/50"
              }`}
              onClick={() => handleNetworkSelect(network)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getNetworkIcon(network)}
                  <div>
                    <h3 className="font-medium text-foreground">
                      {network.name}
                    </h3>
                    {network.description && (
                      <p className="text-sm text-zinc-400">
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

              <div className="mt-3 pt-3 border-t border-zinc-700/50">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400">API:</span>
                    <div className="font-mono text-zinc-300 break-all">
                      {network.api}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Socket:</span>
                    <div className="font-mono text-zinc-300 break-all">
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
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Network className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Selected: {selectedNetwork.name}
                </span>
              </div>
              <div className="text-xs text-amber-300">
                Ready to connect
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
