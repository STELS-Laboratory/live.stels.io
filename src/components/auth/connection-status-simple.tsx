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
  AlertCircle,
  CheckCircle,
  ChevronDown,
  LogOut,
  Network,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { motion } from "framer-motion";

/**
 * Connection status component using shadcn dropdown
 */
export function ConnectionStatusSimple(): React.ReactElement {
  const {
    connectionSession,
    isConnected,
    disconnectFromNode,
    resetAuth,
  } = useAuthStore();

  // Try to get wallet from auth store (if it exists) or from sessionStorage
  const wallet = React.useMemo(() => {
    try {
      // Try to get wallet from auth store first
      const authStore = useAuthStore.getState();
      if (
        (authStore as { wallet?: { address?: string; number?: string } }).wallet
      ) {
        return (authStore as { wallet: { address: string; number: string } })
          .wallet;
      }

      // Try to get wallet from sessionStorage
      // Wallet data might be stored in sessionStorage with different keys
      const walletKeys = ["Wallet-store", "gliesereum-Wallet", "Wallet-data"];
      for (const key of walletKeys) {
        const walletData = sessionStorage.getItem(key);
        if (walletData) {
          try {
            const parsed = JSON.parse(walletData);
            if (parsed?.raw?.address || parsed?.address) {
              return {
                address: parsed.raw?.address || parsed.address,
                number: parsed.raw?.number || parsed.number || "N/A",
              };
            }
          } catch {
            // Continue to next key
          }
        }
      }
    } catch {
      // Return null if wallet not found
    }
    return null;
  }, []);

  const handleDisconnect = async (): Promise<void> => {
    await disconnectFromNode();
  };

  const handleLogout = async (): Promise<void> => {
    await resetAuth();
  };

  const getNetworkIcon = () => {
    if (!connectionSession) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }

    switch (connectionSession.network) {
      case "snaga":
        return <Network className="h-4 w-4 text-secondary-foreground" />;
      case "air":
        return <Network className="h-4 w-4 text-sky-500" />;
      default:
        return <Network className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNetworkColor = () => {
    if (!connectionSession) {
      return "bg-destructive/20 text-destructive border-destructive/30";
    }

    switch (connectionSession.network) {
      case "snaga":
        return "bg-secondary text-secondary-foreground border-secondary-foreground/30";
      case "air":
        return "bg-sky-500/20 text-sky-700 dark:text-sky-400 border-sky-500/30";
      default:
        return "bg-muted/20 text-muted-foreground border-border";
    }
  };

  // Show "Not Connected" only if we don't have connection info
  if (!isConnected || !connectionSession) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">Not Connected</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 w-full justify-start"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {getNetworkIcon()}
          </motion.div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium truncate">
              {connectionSession.network}
            </span>
            <Badge
              variant="outline"
              className={`text-xs rounded ${getNetworkColor()}`}
            >
              {isConnected ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-72"
        sideOffset={8}
      >
        {/* Network Info */}
        <div className="p-3 space-y-3">
          <div className="space-y-2 p-3 bg-muted/50 border border-border rounded">
            <div className="flex items-center gap-2">
              {getNetworkIcon()}
              <span className="font-medium text-sm">Network</span>
            </div>
            <div className="text-sm font-medium text-foreground">
              {connectionSession.title}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs rounded">
                {connectionSession.network}
              </Badge>
            </div>
            <div className="pt-1 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-1">
                API Endpoint:
              </div>
              <div className="text-xs font-mono text-foreground break-all bg-background/50 px-2 py-1 rounded">
                {connectionSession.api}
              </div>
            </div>
            {connectionSession.socket && (
              <div className="pt-1 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-1">
                  WebSocket:
                </div>
                <div className="text-xs font-mono text-foreground break-all bg-background/50 px-2 py-1 rounded">
                  {connectionSession.socket}
                </div>
              </div>
            )}
          </div>

          {/* Wallet Info */}
          {wallet && (
            <div className="space-y-2 p-3 bg-muted/50 border border-border rounded">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Wallet</span>
              </div>
              <div className="text-xs font-mono text-muted-foreground break-all">
                {wallet.address}
              </div>
              {wallet.number && (
                <div className="text-xs text-muted-foreground">
                  Card: {wallet.number}
                </div>
              )}
            </div>
          )}

          {/* Developer Badge */}
          {connectionSession.developer && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs rounded bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400"
              >
                Developer
              </Badge>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="text-orange-600 dark:text-orange-400 focus:text-orange-600 dark:focus:text-orange-400"
        >
          <Network className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
