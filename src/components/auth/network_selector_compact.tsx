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
        return "text-blue-700 dark:text-blue-400";
      case "localnet":
        return "text-purple-700 dark:text-purple-400";
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
            className="w-full justify-between h-9 sm:h-10 transition-colors text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {selectedNetwork
                ? (
                  <>
                    {getNetworkIcon(selectedNetwork)}
                    <div className="text-left min-w-0 flex-1">
                      <div
                        className={`font-medium truncate ${
                          getNetworkColor(selectedNetwork)
                        }`}
                      >
                        {selectedNetwork.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {selectedNetwork.developer
                          ? "Development"
                          : "Test Network"}
                      </div>
                    </div>
                  </>
                )
                : (
                  <>
                    <Network className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      Select Network
                    </span>
                  </>
                )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 sm:w-80 bg-popover border border-border"
        >
          <div className="p-2 sm:p-3">
            <div className="text-xs sm:text-sm font-medium text-card-foreground mb-2 sm:mb-3">
              Choose Network
            </div>
            {availableNetworks.map((network) => (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                className="p-2 sm:p-3 cursor-pointer hover:bg-accent rounded transition-colors"
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {getNetworkIcon(network)}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium text-xs sm:text-sm truncate ${
                          getNetworkColor(network)
                        }`}
                      >
                        {network.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {network.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {network.developer && (
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs"
                      >
                        Dev
                      </Badge>
                    )}
                    {selectedNetwork?.id === network.id && (
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700 dark:text-amber-400" />
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="bg-border" />

          <div className="p-2 sm:p-3">
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              All networks are secure and encrypted
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
