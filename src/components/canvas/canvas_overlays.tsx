import React from "react";
import { cn } from "@/lib/utils";
import { Download, Layers, Loader2, Plus } from "lucide-react";

/**
 * Canvas Overlays - Professional Design
 * Soft zinc palette, minimal effects, elegant transparency
 */

interface EnhancedDropZoneProps {
  isActive: boolean;
  mousePosition?: { x: number; y: number };
}

/**
 * Enhanced Drop Zone - Elegant & Minimal
 */
export const EnhancedDropZone: React.FC<EnhancedDropZoneProps> = ({
  isActive,
  mousePosition,
}) => {
  if (!isActive || !mousePosition) return null;

  return (
    <>
      {/* Subtle overlay */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {/* Gentle tint */}
        <div className="absolute inset-0 animate-in fade-in duration-300" />

        {/* Elegant grid */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-10"
          style={{
            backgroundImage:
              "1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Cursor indicator - soft */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Soft ring */}
        <div className="absolute inset-0 -m-10">
          <div className="w-20 h-20 rounded-full border animate-ping" />
        </div>

        {/* Central indicator */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl",
            "flex items-center justify-center",
            "animate-in zoom-in duration-200",
          )}
        >
          <Plus className="h-5 w-5 " />
        </div>

        {/* Hint text - soft */}
        <div
          className={cn(
            "absolute top-full mt-3 left-1/2 -translate-x-1/2",
            "border",
            "rounded backdrop-blur-sm",
            "px-3 py-1.5",
            "whitespace-nowrap",
            "animate-in slide-in-from-top-2 duration-300",
          )}
        >
          <div className="flex items-center gap-2 text-xs font-medium ">
            <Download className="h-3 w-3" />
            <span>Drop to add</span>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Panel Transition Overlay - Soft
 */
interface PanelTransitionOverlayProps {
  isTransitioning: boolean;
  panelName?: string;
}

export const PanelTransitionOverlay: React.FC<
  PanelTransitionOverlayProps
> = ({ isTransitioning, panelName }) => {
  if (!isTransitioning) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50",
        "backdrop-blur-md",
        "flex items-center justify-center",
        "animate-in fade-in duration-200",
      )}
    >
      <div
        className={cn(
          "border",
          "rounded-2xl backdrop-blur-sm",
          "p-8 min-w-[300px]",
          "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
        )}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Elegant loader */}
          <div className="relative">
            {/* Outer ring - soft */}
            <div className="absolute inset-0 -m-5">
              <div
                className="w-20 h-20 rounded-full border-2  animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>

            {/* Inner icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl",
                "flex items-center justify-center",
              )}
            >
              <Layers className="h-5 w-5  animate-pulse" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-sm font-semibold mb-1">
              Loading panel
            </p>
            {panelName && (
              <p className="text-xs  font-mono">
                {panelName}
              </p>
            )}
          </div>

          {/* Progress dots - soft */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full  animate-pulse"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "1s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Empty Canvas State - Soft Design
 */
interface EmptyCanvasStateProps {
  onAddWidget: () => void;
}

export const EmptyCanvasState: React.FC<EmptyCanvasStateProps> = ({
  onAddWidget,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className={cn(
          "border ",
          "rounded-2xl backdrop-blur-sm",
          "p-10 max-w-md",
          "text-center",
          "pointer-events-auto",
          "animate-in fade-in zoom-in-95 duration-500",
        )}
      >
        {/* Icon */}
        <div className="mb-6">
          <div
            className={cn(
              "w-16 h-16 mx-auto",
              "rounded-2xl",
              "flex items-center justify-center",
            )}
          >
            <Layers className="h-7 w-7 " />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold mb-2">
          Canvas is empty
        </h3>
        <p className="text-sm  mb-6 leading-relaxed">
          Start building your workspace by adding widgets from the store
        </p>

        {/* CTA Button - soft */}
        <button
          onClick={onAddWidget}
          className={cn(
            "px-5 py-2.5 rounded",
            "text-sm font-semibold",
            "transition-colors duration-200",
          )}
        >
          Open Widget Store
        </button>

        {/* Hint */}
        <div className="mt-4 text-xs ">
          or press{" "}
          <kbd className="px-1.5 py-0.5  rounded text-[10px] font-mono border">
            S
          </kbd>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading Spinner - Soft Design
 */
interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
        )}
      />
      {message && (
        <span className="text-sm">
          {message}
        </span>
      )}
    </div>
  );
};

export default {
  EnhancedDropZone,
  PanelTransitionOverlay,
  EmptyCanvasState,
  LoadingSpinner,
};
