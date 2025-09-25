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
 * Compact network selector for use in wallet interface
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
        return <Network className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getNetworkColor = (network: NetworkConfig) => {
    switch (network.id) {
      case "testnet":
        return "text-blue-400";
      case "localnet":
        return "text-purple-400";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12 border-zinc-700/50 hover:border-zinc-600/50 bg-zinc-800/50 hover:bg-zinc-700/50 transition-all duration-300"
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
                      <div className="text-xs text-zinc-500">
                        {selectedNetwork.developer
                          ? "Development"
                          : "Test Network"}
                      </div>
                    </div>
                  </>
                )
                : (
                  <>
                    <Network className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-400">Select Network</span>
                  </>
                )}
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-80 bg-zinc-900/95 border-zinc-700/50 backdrop-blur-sm"
        >
          <div className="p-3">
            <div className="text-sm font-medium text-zinc-300 mb-3">
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
                      <div className="text-xs text-zinc-500">
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

          <DropdownMenuSeparator className="bg-zinc-700/50" />

          <div className="p-3">
            <div className="text-xs text-zinc-500">
              All networks are secure and encrypted
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
