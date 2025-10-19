import React from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { cn, authDesignTokens } from "../design-system";

export interface ProgressStep {
  label: string;
  progress: number;
  description?: string;
}

interface ProgressStepsProps {
  /**
   * Array of steps
   */
  steps: ProgressStep[];

  /**
   * Current progress (0-100)
   */
  currentProgress: number;

  /**
   * Show descriptions
   */
  showDescriptions?: boolean;

  /**
   * Orientation
   */
  orientation?: "horizontal" | "vertical";

  /**
   * Additional className
   */
  className?: string;
}

/**
 * Progress steps component for multi-step processes
 */
export function ProgressSteps({
  steps,
  currentProgress,
  showDescriptions = false,
  orientation = "vertical",
  className,
}: ProgressStepsProps): React.ReactElement {
  if (orientation === "horizontal") {
    return (
      <div className={cn("flex justify-between", className)}>
        {steps.map((step, index) => {
          const isCompleted = currentProgress >= step.progress;
          const isCurrent =
            currentProgress >= step.progress &&
            (index === steps.length - 1 ||
              currentProgress < steps[index + 1].progress);

          return (
            <div key={step.label} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-2 h-2 border transition-all",
                  authDesignTokens.transitions.default,
                  isCompleted
                    ? isCurrent
                      ? "bg-amber-500 border-amber-500"
                      : "bg-green-500 border-green-500"
                    : "bg-background border-border",
                )}
              />
              <span
                className={cn(
                  "text-[10px] mt-1 transition-colors font-medium",
                  authDesignTokens.transitions.colors,
                  isCompleted ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = currentProgress >= step.progress;
        const isCurrent =
          currentProgress >= step.progress - 5 &&
          currentProgress < step.progress + 5;

        return (
          <div
            key={step.label}
            className={cn(
              "flex items-start gap-3 text-xs transition-all duration-300",
              authDesignTokens.transitions.colors,
              isCompleted
                ? "text-green-500"
                : isCurrent
                ? "text-amber-500"
                : "text-muted-foreground",
            )}
          >
            <div className="relative shrink-0">
              <div
                className={cn(
                  "w-5 h-5 border-2 flex items-center justify-center transition-all",
                  authDesignTokens.transitions.default,
                  isCompleted
                    ? "bg-green-500/10 border-green-500"
                    : isCurrent
                    ? "bg-amber-500/10 border-amber-500"
                    : "bg-background border-border",
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span className="text-[10px]">{index + 1}</span>
                )}
              </div>

              {/* Pulse animation for current step */}
              {isCurrent && !isCompleted && (
                <div className="absolute -inset-0.5 border border-amber-500 animate-ping" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-medium block">{step.label}</span>
              {showDescriptions && step.description && (
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {step.description}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

