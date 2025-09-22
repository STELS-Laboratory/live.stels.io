import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SimpleDropdown,
  SimpleDropdownItem,
  SimpleDropdownSeparator,
} from "@/components/ui/simple-dropdown";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  LogOut,
  Network,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";

/**
 * Simple connection status component using custom dropdown
 */
export function ConnectionStatusSimple(): React.ReactElement {
  const {
    connectionSession,
    wallet,
    isConnected,
    disconnectFromNode,
    resetAuth,
  } = useAuthStore();

  const handleDisconnect = (): void => {
    disconnectFromNode();
  };

  const handleLogout = (): void => {
    resetAuth();
  };

  const getNetworkIcon = () => {
    if (!connectionSession) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    switch (connectionSession.network) {
      case "testnet":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "mainnet":
        return <Network className="h-4 w-4 text-green-500" />;
      case "localnet":
        return <Network className="h-4 w-4 text-purple-500" />;
      default:
        return <Network className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getNetworkColor = () => {
    if (!connectionSession) {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }

    switch (connectionSession.network) {
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

  if (!isConnected || !connectionSession || !wallet) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-400">Not Connected</span>
      </div>
    );
  }

  return (
    <SimpleDropdown
      trigger={
        <Button variant="ghost" size="sm" className="h-8 gap-2">
          {getNetworkIcon()}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {connectionSession.network}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${getNetworkColor()}`}
            >
              {isConnected
                ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                )
                : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </>
                )}
            </Badge>
          </div>
          <ChevronDown className="h-3 w-3" />
        </Button>
      }
      align="end"
      className="w-80"
    >
      <div className="p-3 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getNetworkIcon()}
            <span className="font-medium">Network</span>
          </div>
          <div className="text-sm text-zinc-400">
            {connectionSession.title} ({connectionSession.network})
          </div>
          <div className="text-xs font-mono text-zinc-500">
            {connectionSession.api}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="font-medium">Wallet</span>
          </div>
          <div className="text-xs font-mono text-zinc-400 break-all">
            {wallet.address}
          </div>
          <div className="text-xs text-zinc-500">
            Card: {wallet.number}
          </div>
        </div>

        {connectionSession.developer && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Developer Mode
            </Badge>
          </div>
        )}
      </div>

      <SimpleDropdownSeparator />

      <SimpleDropdownItem
        onClick={handleDisconnect}
        className="text-orange-400 hover:text-orange-300"
      >
        <Network className="h-4 w-4 mr-2" />
        Disconnect
      </SimpleDropdownItem>

      <SimpleDropdownItem
        onClick={handleLogout}
        className="text-red-400 hover:text-red-300"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </SimpleDropdownItem>
    </SimpleDropdown>
  );
}
