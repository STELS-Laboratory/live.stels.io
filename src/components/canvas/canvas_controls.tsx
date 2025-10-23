import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Keyboard,
  Layers,
  Network,
  ShoppingBag,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Canvas Controls - Professional Design
 * Soft zinc palette, minimal shadows, elegant transparency
 */

interface CanvasControlsProps {
  isWidgetStoreOpen: boolean;
  onToggleWidgetStore: () => void;
  isPanelManagerOpen: boolean;
  onTogglePanelManager: () => void;
  isAutoConnectionsEnabled: boolean;
  onToggleAutoConnections: () => void;
  isAutoConnectionsSettingsOpen: boolean;
  onToggleAutoConnectionsSettings: () => void;
  connectionStats?: {
    edgeCount: number;
    groupCount: number;
  } | null;
  nodeCount?: number;
}

interface ControlButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  shortcut?: string;
  isActive?: boolean;
  isEnabled?: boolean;
  badge?: string | number;
  onClick: () => void;
  variant?: "default" | "success" | "primary";
}

/**
 * Professional Control Button - Soft & Elegant
 */
const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  tooltip,
  shortcut,
  isActive = false,
  isEnabled = true,
  badge,
  onClick,
  variant = "default",
}) => {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={!isEnabled}
            className={cn(
              "group relative",
              "flex items-center justify-center",
              "w-9 h-9",
              "rounded",
              "transition-all duration-200 ease-out",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              // Default variant
              !isActive && variant === "default" && [
                "bg-transparent text-foreground hover:bg-accent",
              ],
              // Success variant (accent for active connections)
              !isActive && variant === "success" && [
                "bg-accent/50",
                "text-accent-foreground",
                "hover:bg-accent/70",
              ],
              // Primary variant (primary for settings)
              !isActive && variant === "primary" && [
                "bg-secondary/80",
                "text-secondary-foreground",
                "hover:bg-secondary",
              ],
              // Active states
              isActive && variant === "default" && [
                "bg-primary",
                "text-primary-foreground",
              ],
              isActive && variant === "success" && [
                "bg-accent",
                "text-accent-foreground",
              ],
              isActive && variant === "primary" && [
                "bg-primary",
                "text-primary-foreground",
              ],
            )}
          >
            {icon}

            {/* Badge - soft design */}
            {badge !== undefined && (
              <div
                className={cn(
                  "absolute -top-1 -right-1",
                  "min-w-[16px] h-4 px-1",
                  "flex items-center justify-center",
                  "rounded-full",
                  "text-[9px] font-semibold tabular-nums",
                  "border",
                )}
              >
                {badge}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="px-3 py-1.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{tooltip}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border">
                {shortcut}
              </kbd>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Stats Display - Soft & Minimal
 */
const StatsDisplay: React.FC<{
  edgeCount: number;
  groupCount: number;
}> = ({ edgeCount, groupCount }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        "px-3 py-1",
        "border border-border",
        "rounded",
        "text-[10px] font-medium tabular-nums",
        "text-muted-foreground",
      )}
    >
      <div className="flex items-center gap-1">
        <Network className="h-3 w-3" />
        <span>{edgeCount}</span>
      </div>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1 text-accent-foreground">
        <Zap className="h-3 w-3" />
        <span>{groupCount}</span>
      </div>
    </div>
  );
};

/**
 * Canvas Controls Component - Professional & Elegant
 */
export const CanvasControls: React.FC<CanvasControlsProps> = ({
  isWidgetStoreOpen,
  onToggleWidgetStore,
  isPanelManagerOpen,
  onTogglePanelManager,
  isAutoConnectionsEnabled,
  onToggleAutoConnections,
  isAutoConnectionsSettingsOpen,
  onToggleAutoConnectionsSettings,
  connectionStats,
  nodeCount = 0,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <>
      {/* Main Control Toolbar - Soft Design */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        {/* Stats - Only when active */}
        {isAutoConnectionsEnabled &&
          connectionStats &&
          connectionStats.groupCount > 0 && (
          <div className="flex justify-center mb-2">
            <StatsDisplay
              edgeCount={connectionStats.edgeCount}
              groupCount={connectionStats.groupCount}
            />
          </div>
        )}

        {/* Control Buttons - Soft Borders */}
        <div
          className={cn(
            "flex items-center",
            "border border-border bg-card/80",
            "rounded-xl",
            "backdrop-blur-sm",
            "p-1",
          )}
        >
          <div className="flex items-center gap-0.5">
            {/* Widget Store */}
            <ControlButton
              icon={<ShoppingBag className="h-4 w-4" />}
              tooltip="Widget Store"
              shortcut="S"
              isActive={isWidgetStoreOpen}
              onClick={onToggleWidgetStore}
            />

            <div className="w-px h-5 mx-1 bg-border" />

            {/* Auto Connections */}
            <ControlButton
              icon={<Network className="h-4 w-4" />}
              tooltip="Auto Connect"
              shortcut="A"
              isActive={isAutoConnectionsEnabled}
              onClick={onToggleAutoConnections}
              badge={isAutoConnectionsEnabled && connectionStats
                ? connectionStats.groupCount
                : undefined}
              variant={isAutoConnectionsEnabled ? "success" : "default"}
            />

            {/* Connection Settings */}
            <ControlButton
              icon={<Zap className="h-4 w-4" />}
              tooltip="Configure"
              isActive={isAutoConnectionsSettingsOpen}
              onClick={onToggleAutoConnectionsSettings}
              isEnabled={isAutoConnectionsEnabled}
              variant={isAutoConnectionsSettingsOpen ? "primary" : "default"}
            />

            <div className="w-px h-5 mx-1 bg-border" />

            {/* Panel Manager */}
            <ControlButton
              icon={<Layers className="h-4 w-4" />}
              tooltip="Panels"
              shortcut="P"
              isActive={isPanelManagerOpen}
              onClick={onTogglePanelManager}
            />

            {/* Node Count */}
            {nodeCount > 0 && (
              <ControlButton
                icon={<Boxes className="h-4 w-4" />}
                tooltip={`${nodeCount} nodes`}
                isActive={false}
                onClick={() => {}}
                badge={nodeCount}
                isEnabled={false}
              />
            )}

            <div className="w-px h-5 mx-1 bg-border" />

            {/* Keyboard Shortcuts */}
            <ControlButton
              icon={<Keyboard className="h-4 w-4" />}
              tooltip="Shortcuts"
              shortcut="?"
              isActive={showShortcuts}
              onClick={() => setShowShortcuts(!showShortcuts)}
            />
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && (
        <KeyboardShortcutsOverlay onClose={() => setShowShortcuts(false)} />
      )}
    </>
  );
};

/**
 * Keyboard Shortcuts Overlay - Professional
 */
interface KeyboardShortcutsOverlayProps {
  onClose: () => void;
}

const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({
  onClose,
}) => {
  const shortcuts = [
    {
      category: "Canvas",
      items: [
        { keys: ["S"], description: "Widget Store" },
        { keys: ["A"], description: "Auto Connect" },
        { keys: ["P"], description: "Panel Manager" },
        { keys: ["?"], description: "Shortcuts" },
        { keys: ["Esc"], description: "Close" },
      ],
    },
    {
      category: "Panels",
      items: [
        { keys: ["⌘", "T"], description: "New Panel" },
        { keys: ["⌘", "W"], description: "Close Panel" },
        { keys: ["⌘", "⇥"], description: "Next Panel" },
      ],
    },
    {
      category: "Navigate",
      items: [
        { keys: ["Space"], description: "Pan" },
        { keys: ["Wheel"], description: "Zoom" },
        { keys: ["⌘", "0"], description: "Reset" },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="border border-border bg-card rounded-2xl backdrop-blur-sm p-8 max-w-3xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-accent">
              <Keyboard className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-muted-foreground">
                Boost your workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Press{" "}
            <kbd className="px-1.5 py-0.5 border border-border rounded text-[10px] font-mono bg-secondary">
              Esc
            </kbd>
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-foreground">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd
                            className={cn(
                              "px-2 py-1 text-xs font-mono font-medium",
                              "border border-border bg-secondary",
                              "rounded",
                            )}
                          >
                            {key}
                          </kbd>
                          {keyIdx < item.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">
                              +
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Pro tip: Combine shortcuts for faster workflow. Press{" "}
            <kbd className="px-1 py-0.5 rounded text-[10px] border border-border bg-secondary">
              ?
            </kbd>{" "}
            anytime to show this panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CanvasControls;
