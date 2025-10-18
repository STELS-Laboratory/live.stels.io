import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils.ts";

/**
 * Props for MetricCard component
 */
interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

/**
 * Metric display card component
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  color = "text-foreground",
  icon,
  size = "md",
  trend,
  onClick,
  className,
}) => (
  <div
    className={cn(
      "space-y-1 p-3 rounded transition-all duration-200",
      onClick &&
        "cursor-pointer hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98]",
      className,
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-1.5">
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <p className="text-xs text-muted-foreground font-medium truncate">
        {label}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <p
        className={cn(
          "font-semibold font-mono transition-colors duration-200",
          size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm",
          color,
        )}
      >
        {value}
      </p>
      {trend && (
        <div
          className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            trend.isPositive ? "text-emerald-600" : "text-red-500",
          )}
        >
          {trend.isPositive
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(trend.value).toFixed(1)}%</span>
        </div>
      )}
    </div>
  </div>
);
