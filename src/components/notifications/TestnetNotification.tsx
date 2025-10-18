"use client";

import type React from "react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, Code, Rocket, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestnetNotificationProps {
  className?: string;
  onDismiss?: () => void;
}

/**
 * Professional notification component for testnet delays and updates
 */
const TestnetNotification: React.FC<TestnetNotificationProps> = ({
  className,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const handleDismiss = (): void => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-amber-200/20 bg-gradient-to-r from-amber-50/10 to-orange-50/10 backdrop-blur-sm",
        className,
      )}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent animate-pulse" />
      </div>

      <CardContent className="relative p-6">
        <div className="flex items-start gap-4">
          {/* Icon with animated pulse */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Rocket className="w-6 h-6 text-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-foreground">
                Testnet Status Update
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  Live Updates
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-700 dark:text-card-foreground">
              <p className="leading-relaxed">
                The testnet is currently experiencing{" "}
                <strong>temporary delays</strong>{" "}
                as our development team actively tests and refines various STELS
                platform features.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-3 rounded bg-zinc-50 dark:bg-muted/50">
                  <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-foreground mb-1">
                      Active Development
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Continuous platform updates and feature testing
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded bg-zinc-50 dark:bg-muted/50">
                  <Code className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-foreground mb-1">
                      Quality Assurance
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Rigorous testing of new functionality
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-zinc-700 dark:text-card-foreground">
                  <strong>Stay Updated:</strong>{" "}
                  Follow our development team announcements for real-time status
                  updates and feature releases.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-muted"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestnetNotification;
