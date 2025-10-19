import React from "react";
import {
  AlertCircle,
  Network,
  Server,
  Shield,
} from "lucide-react";
import type { NetworkConfig } from "@/stores/modules/auth.store";
import { cn, getNetworkColors } from "../design-system";

interface NetworkIconProps {
  /**
   * Network configuration or network ID
   */
  network: NetworkConfig | NetworkConfig["id"] | null;

  /**
   * Icon size
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional className
   */
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

/**
 * Network icon component with consistent styling
 */
export function NetworkIcon({
  network,
  size = "md",
  className,
}: NetworkIconProps): React.ReactElement {
  const networkId = typeof network === "string"
    ? network
    : network?.id || null;

  const colors = networkId ? getNetworkColors(networkId) : null;
  const iconClass = cn(
    sizeClasses[size],
    colors?.text || "text-muted-foreground",
    className,
  );

  if (!networkId) {
    return <AlertCircle className={cn(iconClass, "text-red-500")} />;
  }

  switch (networkId) {
    case "testnet":
      return <Shield className={iconClass} />;
    case "mainnet":
      return <Server className={iconClass} />;
    case "localnet":
      return <Network className={iconClass} />;
    default:
      return <Network className={iconClass} />;
  }
}

