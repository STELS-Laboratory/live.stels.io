import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { copyToClipboard } from "../auth-utils";
import { cn, authDesignTokens } from "../design-system";

interface CopyButtonProps {
  /**
   * Text to copy
   */
  text: string;

  /**
   * Success message (optional)
   */
  successMessage?: string;

  /**
   * Button size
   */
  size?: "sm" | "md" | "lg";

  /**
   * Show label
   */
  showLabel?: boolean;

  /**
   * Custom label
   */
  label?: string;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Callback after successful copy
   */
  onCopy?: () => void;
}

/**
 * Copy button with visual feedback
 */
export function CopyButton({
  text,
  successMessage,
  size = "sm",
  showLabel = false,
  label = "Copy",
  className,
  onCopy,
}: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    const result = await copyToClipboard(text);

    if (result.success) {
      setCopied(true);
      onCopy?.();

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    sm: "h-8 px-2",
    md: "h-10 px-3",
    lg: authDesignTokens.buttons.default,
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={cn(
        sizeClasses[size],
        "transition-all duration-200",
        authDesignTokens.interactive.focus,
        className,
      )}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          {showLabel && (
            <span className="ml-2 text-green-500">
              {successMessage || "Copied!"}
            </span>
          )}
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {showLabel && <span className="ml-2">{label}</span>}
        </>
      )}
    </Button>
  );
}

