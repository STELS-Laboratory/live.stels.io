"use client";

import type React from "react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Code, Rocket, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestnetStatusAlertProps {
  className?: string;
  onDismiss?: () => void;
  variant?: "default" | "compact";
}

/**
 * Compact testnet status alert for integration into existing pages
 */
const TestnetStatusAlert: React.FC<TestnetStatusAlertProps> = ({
  className,
  onDismiss,
  variant = "default",
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const handleDismiss = (): void => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  if (variant === "compact") {
    return (
      <Alert
        className={cn(
          "border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 backdrop-blur-sm",
          className,
        )}
      >
        <Rocket className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Testnet Delays
            </span>
            <Badge
              variant="secondary"
              className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
            >
              <Clock className="w-3 h-3 mr-1" />
              Active Testing
            </Badge>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              STELS team is testing platform features and updating continuously
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Dismiss notification"
          >
            <X className="w-3 h-3" />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      className={cn(
        "border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 backdrop-blur-sm",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent animate-pulse rounded-lg" />
        <Rocket className="h-4 w-4 text-amber-600 dark:text-amber-400 relative z-10" />
      </div>
      <AlertDescription className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Testnet Status Update
            </h4>
            <Badge
              variant="secondary"
              className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
            >
              <Clock className="w-3 h-3 mr-1" />
              Live Updates
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Dismiss notification"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
          The testnet is experiencing <strong>temporary delays</strong>{" "}
          as our development team actively tests and refines various STELS
          platform features. We're continuously updating the platform to ensure
          optimal performance.
        </p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              Active Development
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-zinc-600 dark:text-zinc-400">
              Quality Testing
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                Stay Updated
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Follow our development team announcements for real-time status
                updates and feature releases.
              </p>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default TestnetStatusAlert;
