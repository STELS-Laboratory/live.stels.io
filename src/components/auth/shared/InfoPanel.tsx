import React from "react";
import { Shield, AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { cn, authDesignTokens, buildCornerClasses } from "../design-system";

interface InfoPanelProps {
  /**
   * Panel variant
   */
  variant?: "success" | "error" | "warning" | "info" | "security";

  /**
   * Panel title
   */
  title?: string;

  /**
   * Panel content
   */
  children: React.ReactNode;

  /**
   * Custom icon
   */
  icon?: React.ReactNode;

  /**
   * Show corner decorations
   */
  showCorners?: boolean;

  /**
   * Additional className
   */
  className?: string;
}

/**
 * Info panel component with icon and consistent styling
 */
export function InfoPanel({
  variant = "info",
  title,
  children,
  icon,
  showCorners = true,
  className,
}: InfoPanelProps): React.ReactElement {
  const getVariantConfig = () => {
    switch (variant) {
      case "success":
        return {
          icon: icon || <CheckCircle className="h-4 w-4 text-green-500" />,
          colors: authDesignTokens.status.success,
        };
      case "error":
        return {
          icon: icon || <AlertCircle className="h-4 w-4 text-red-500" />,
          colors: authDesignTokens.status.error,
        };
      case "warning":
        return {
          icon: icon || <AlertTriangle className="h-4 w-4 text-amber-500" />,
          colors: authDesignTokens.status.warning,
        };
      case "security":
        return {
          icon: icon || <Shield className="h-4 w-4 text-green-500" />,
          colors: authDesignTokens.status.success,
        };
      case "info":
      default:
        return {
          icon: icon || <Info className="h-4 w-4 text-blue-500" />,
          colors: authDesignTokens.status.info,
        };
    }
  };

  const config = getVariantConfig();

  return (
    <div
      className={cn(
        "relative p-4",
        config.colors.bg,
        config.colors.border,
        "border",
        authDesignTokens.transitions.default,
        className,
      )}
    >
      {/* Corner decoration */}
      {showCorners && (
        <div
          className={cn(
            "absolute border-t border-l",
            config.colors.border,
            buildCornerClasses("medium", "topLeft"),
          )}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon container */}
        <div
          className={cn(
            "p-1.5 border shrink-0",
            config.colors.border,
            config.colors.bg,
          )}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-bold text-foreground mb-1 text-xs">
              {title}
            </div>
          )}
          <div className="text-muted-foreground text-xs">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

