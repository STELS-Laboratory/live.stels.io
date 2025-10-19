import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authDesignTokens, buildCornerClasses, cn } from "../design-system";

interface DecoratedCardProps {
  /**
   * Card title
   */
  title?: React.ReactNode;

  /**
   * Card subtitle/description
   */
  subtitle?: React.ReactNode;

  /**
   * Icon to display in header
   */
  icon?: React.ReactNode;

  /**
   * Content of the card
   */
  children: React.ReactNode;

  /**
   * Variant for styling
   */
  variant?:
    | "default"
    | "create"
    | "import"
    | "network"
    | "success"
    | "error"
    | "warning";

  /**
   * Corner decoration size
   */
  cornerSize?: "tiny" | "small" | "medium" | "large";

  /**
   * Show corner decorations
   */
  showCorners?: boolean;

  /**
   * Additional className for card
   */
  className?: string;

  /**
   * Additional className for header
   */
  headerClassName?: string;

  /**
   * Additional className for content
   */
  contentClassName?: string;

  /**
   * Center align header content
   */
  centerHeader?: boolean;

  /**
   * Make card interactive (clickable)
   */
  interactive?: boolean;

  /**
   * Click handler for interactive cards
   */
  onClick?: () => void;

  /**
   * ARIA role for accessibility
   */
  role?: string;

  /**
   * Tab index for keyboard navigation
   */
  tabIndex?: number;

  /**
   * Keyboard handler
   */
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Decorated card component with consistent styling
 * Used across all authentication components
 */
export function DecoratedCard({
  title,
  subtitle,
  icon,
  children,
  variant = "default",
  cornerSize = "small",
  showCorners = true,
  className,
  headerClassName,
  contentClassName,
  centerHeader = false,
  interactive = false,
  onClick,
  role,
  tabIndex,
  onKeyDown,
}: DecoratedCardProps): React.ReactElement {
  const getVariantColors = () => {
    switch (variant) {
      case "create":
        return authDesignTokens.walletTypes.create;
      case "import":
        return authDesignTokens.walletTypes.import;
      case "success":
        return authDesignTokens.status.success;
      case "error":
        return authDesignTokens.status.error;
      case "warning":
        return authDesignTokens.status.warning;
      default:
        return {
          border: "border-border",
          bg: "bg-card",
          text: "text-foreground",
        };
    }
  };

  const colors = getVariantColors();

  const cardClasses = cn(
    "relative bg-card border",
    interactive && authDesignTokens.transitions.colors,
    interactive && authDesignTokens.interactive.hover,
    interactive && authDesignTokens.interactive.active,
    interactive && authDesignTokens.interactive.focus,
    className,
  );

  const iconWrapperClasses = cn(
    "relative p-2 border-2",
    colors.border,
    colors.bg,
  );

  return (
    <Card
      className={cardClasses}
      onClick={interactive ? onClick : undefined}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
    >
      {/* Corner decorations */}
      {showCorners && variant !== "default" && (
        <div
          className={cn(
            "absolute border-t border-l",
            colors.border,
            buildCornerClasses(cornerSize, "topLeft"),
          )}
        />
      )}

      {/* Header */}
      {(title || icon) && (
        <CardHeader
          className={cn(
            centerHeader ? "text-center" : "",
            "pb-4",
            authDesignTokens.spacing.cardHeader,
            headerClassName,
          )}
        >
          {title && (
            <CardTitle
              className={cn(
                "flex items-center gap-3",
                centerHeader && "justify-center",
                authDesignTokens.typography.title,
              )}
            >
              {icon && (
                <div className={iconWrapperClasses}>
                  {showCorners && (
                    <div
                      className={cn(
                        "absolute border-t border-l border-current",
                        buildCornerClasses("tiny", "topLeft"),
                      )}
                    />
                  )}
                  {icon}
                </div>
              )}
              <span className={colors.text}>{title}</span>
            </CardTitle>
          )}
          {subtitle && (
            <p
              className={cn(
                authDesignTokens.typography.subtitle,
                "mt-2",
                centerHeader && "mx-auto max-w-2xl",
              )}
            >
              {subtitle}
            </p>
          )}
        </CardHeader>
      )}

      {/* Content */}
      <CardContent
        className={cn(authDesignTokens.spacing.cardContent, contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
}

