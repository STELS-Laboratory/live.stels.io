import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the WidgetStatusBadge component
 */
interface WidgetStatusBadgeProps {
  /** Whether the widget is in canvas */
  isInCanvas: boolean;
  /** Size of the badge */
  size?: "sm" | "md" | "lg";
  /** Whether to show icon */
  showIcon?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Widget Status Badge Component
 */
export function WidgetStatusBadge({
  isInCanvas,
  size = "sm",
  showIcon = true,
  className,
}: WidgetStatusBadgeProps): React.ReactElement {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (isInCanvas) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-zinc-500 text-white border-zinc-500",
          sizeClasses[size],
          className,
        )}
      >
        {showIcon && <CheckCircle className={cn("mr-1", iconSizes[size])} />}
        In Canvas
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        sizeClasses[size],
        className,
      )}
    >
      {showIcon && <XCircle className={cn("mr-1", iconSizes[size])} />}
      Available
    </Badge>
  );
}
