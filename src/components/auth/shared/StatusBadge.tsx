import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { cn, authDesignTokens } from "../design-system";

interface StatusBadgeProps {
  /**
   * Status type
   */
  status: "success" | "error" | "warning" | "info" | "loading" | "connected" | "disconnected";

  /**
   * Badge label
   */
  label?: string;

  /**
   * Show icon
   */
  showIcon?: boolean;

  /**
   * Size
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional className
   */
  className?: string;
}

const iconSizeClasses = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

const badgeSizeClasses = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
  lg: "text-sm px-3 py-1.5",
};

/**
 * Status badge component with icon and consistent styling
 */
export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = "md",
  className,
}: StatusBadgeProps): React.ReactElement {
  const getStatusConfig = () => {
    switch (status) {
      case "success":
      case "connected":
        return {
          icon: CheckCircle,
          label: label || (status === "connected" ? "Connected" : "Success"),
          className: cn(
            authDesignTokens.status.success.bg,
            authDesignTokens.status.success.text,
            authDesignTokens.status.success.border,
          ),
        };
      case "error":
      case "disconnected":
        return {
          icon: AlertCircle,
          label: label || (status === "disconnected" ? "Disconnected" : "Error"),
          className: cn(
            authDesignTokens.status.error.bg,
            authDesignTokens.status.error.text,
            authDesignTokens.status.error.border,
          ),
        };
      case "warning":
        return {
          icon: AlertTriangle,
          label: label || "Warning",
          className: cn(
            authDesignTokens.status.warning.bg,
            authDesignTokens.status.warning.text,
            authDesignTokens.status.warning.border,
          ),
        };
      case "info":
        return {
          icon: Info,
          label: label || "Info",
          className: cn(
            authDesignTokens.status.info.bg,
            authDesignTokens.status.info.text,
            authDesignTokens.status.info.border,
          ),
        };
      case "loading":
        return {
          icon: Loader2,
          label: label || "Loading",
          className: cn(
            authDesignTokens.status.info.bg,
            authDesignTokens.status.info.text,
            authDesignTokens.status.info.border,
          ),
          animate: true,
        };
      default:
        return {
          icon: Info,
          label: label || "Unknown",
          className: "bg-zinc-500/20 text-muted-foreground border-zinc-500/30",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1.5",
        badgeSizeClasses[size],
        config.className,
        className,
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizeClasses[size],
            config.animate && "animate-spin",
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

