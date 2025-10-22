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
              "rounded-lg",
              "transition-all duration-200 ease-out",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              // Default variant
              !isActive && variant === "default" && [
                "bg-transparent",
                "text-zinc-500 dark:text-zinc-400",
                "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50",
                "hover:text-zinc-900 dark:hover:text-zinc-50",
              ],
              // Success variant (emerald for active connections)
              !isActive && variant === "success" && [
                "bg-emerald-500/10",
                "text-emerald-600 dark:text-emerald-400",
                "hover:bg-emerald-500/15",
              ],
              // Primary variant (zinc for settings)
              !isActive && variant === "primary" && [
                "bg-zinc-200/80 dark:bg-zinc-800/80",
                "text-zinc-700 dark:text-zinc-300",
                "hover:bg-zinc-300/80 dark:hover:bg-zinc-700/80",
              ],
              // Active states - soft glow
              isActive && variant === "default" && [
                "bg-zinc-900/95 dark:bg-zinc-100/95",
                "text-zinc-50 dark:text-zinc-900",
              ],
              isActive && variant === "success" && [
                "bg-emerald-500/90",
                "text-white",
              ],
              isActive && variant === "primary" && [
                "bg-zinc-800/90 dark:bg-zinc-200/90",
                "text-zinc-100 dark:text-zinc-900",
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
                  "bg-zinc-800/90 dark:bg-zinc-200/90 text-zinc-100 dark:text-zinc-900",
                  "border border-white/20 dark:border-zinc-950/20",
                )}
              >
                {badge}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-zinc-900/95 dark:bg-zinc-50/95 text-zinc-50 dark:text-zinc-900 border-zinc-800/60 dark:border-zinc-200/60 px-3 py-1.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{tooltip}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800/80 dark:bg-zinc-200/80 rounded border border-zinc-700/60 dark:border-zinc-300/60">
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
        "bg-zinc-50/50 dark:bg-zinc-900/50",
        "border border-zinc-200/60 dark:border-zinc-800/60",
        "rounded-lg",
        "text-[10px] font-medium tabular-nums",
        "text-zinc-600 dark:text-zinc-400",
      )}
    >
      <div className="flex items-center gap-1">
        <Network className="h-3 w-3" />
        <span>{edgeCount}</span>
      </div>
      <div className="w-px h-3 bg-zinc-300/60 dark:bg-zinc-700/60" />
      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
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
            "bg-white/95 dark:bg-zinc-950/95",
            "border border-zinc-200/60 dark:border-zinc-800/60",
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

            <div className="w-px h-5 bg-zinc-200/60 dark:bg-zinc-800/60 mx-1" />

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

            <div className="w-px h-5 bg-zinc-200/60 dark:bg-zinc-800/60 mx-1" />

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

            <div className="w-px h-5 bg-zinc-200/60 dark:bg-zinc-800/60 mx-1" />

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
      className="fixed inset-0 z-50 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl backdrop-blur-sm p-8 max-w-3xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-lg">
              <Keyboard className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Boost your workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 rounded text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
              Esc
            </kbd>
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-4">
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          <kbd
                            className={cn(
                              "px-2 py-1 text-xs font-mono font-medium",
                              "bg-zinc-100/80 dark:bg-zinc-800/80",
                              "border border-zinc-200/60 dark:border-zinc-700/60",
                              "rounded",
                              "text-zinc-700 dark:text-zinc-300",
                            )}
                          >
                            {key}
                          </kbd>
                          {keyIdx < item.keys.length - 1 && (
                            <span className="text-zinc-400 text-xs">+</span>
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
        <div className="mt-8 pt-6 border-t border-zinc-200/60 dark:border-zinc-700/60">
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            Pro tip: Combine shortcuts for faster workflow. Press{" "}
            <kbd className="px-1 py-0.5 bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 rounded text-[10px] text-zinc-700 dark:text-zinc-300">
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
