import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  ChevronDown,
  Network,
  //Server,
  Shield,
} from "lucide-react";
import { type NetworkConfig, useAuthStore } from "@/stores/modules/auth.store";

interface NetworkSelectorCompactProps {
  className?: string;
}

/**
 * Compact network selector for use in Wallet interface
 */
export function NetworkSelectorCompact(
  { className }: NetworkSelectorCompactProps,
): React.ReactElement {
  const {
    availableNetworks,
    selectedNetwork,
    selectNetwork,
    clearConnectionError,
  } = useAuthStore();

  const handleNetworkSelect = (network: NetworkConfig): void => {
    clearConnectionError();
    selectNetwork(network);
  };

  const getNetworkIcon = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "localnet":
        return <Network className="h-4 w-4 text-purple-500" />;
      default:
        return <Network className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNetworkColor = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return "text-blue-400";
      case "localnet":
        return "text-purple-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-10 border-zinc-700 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {selectedNetwork
                ? (
                  <>
                    {getNetworkIcon(selectedNetwork)}
                    <div className="text-left">
                      <div
                        className={`font-medium ${
                          getNetworkColor(selectedNetwork)
                        }`}
                      >
                        {selectedNetwork.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedNetwork.developer
                          ? "Development"
                          : "Test Network"}
                      </div>
                    </div>
                  </>
                )
                : (
                  <>
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Select Network
                    </span>
                  </>
                )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-80 bg-zinc-900 border border-zinc-800"
        >
          <div className="p-3">
            <div className="text-sm font-medium text-card-foreground mb-3">
              Choose Network
            </div>
            {availableNetworks.map((network) => (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                className="p-3 cursor-pointer hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {getNetworkIcon(network)}
                    <div>
                      <div
                        className={`font-medium ${getNetworkColor(network)}`}
                      >
                        {network.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {network.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {network.developer && (
                      <Badge variant="outline" className="text-xs">
                        Dev
                      </Badge>
                    )}
                    {selectedNetwork?.id === network.id && (
                      <CheckCircle className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="bg-zinc-800" />

          <div className="p-3">
            <div className="text-xs text-muted-foreground">
              All networks are secure and encrypted
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
