import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Info,
  Network,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { DynamicAutoConnectionConfig } from "@/lib/auto-connections-dynamic";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChannelBlock } from "@/lib/channel-analyzer";
import { getBlockColor } from "@/lib/channel-analyzer";

/**
 * Auto Connections Panel - Professional Design
 * Soft zinc palette, minimal shadows, elegant transparency
 */

interface AutoConnectionsPanelProps {
  config: DynamicAutoConnectionConfig;
  isEnabled: boolean;
  onToggle: () => void;
  onUpdateConfig: (config: Partial<DynamicAutoConnectionConfig>) => void;
  stats?: {
    nodeCount: number;
    edgeCount: number;
    groupCount: number;
    connectionsByType: Record<string, number>;
  };
  availableBlocks: ChannelBlock[];
  onClose: () => void;
}

/**
 * Block Item Component - Soft & Elegant
 */
const BlockItem: React.FC<{
  block: ChannelBlock;
  isSelected: boolean;
  onToggle: () => void;
  showDetails: boolean;
}> = ({ block, isSelected, onToggle, showDetails }) => {
  const valueArray = Array.from(block.values);

  // Position icons - elegant circles
  const positionIcons = ["⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];
  const icon = positionIcons[block.position] || "⊙";

  return (
    <div>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              className={cn(
                "w-full group",
                "flex items-center gap-3 px-3 py-2.5",
                "rounded",
                "transition-all duration-200",
                "border",
                !isSelected && [
                  "bg-transparent",
                ],
                isSelected && [],
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center",
                  "w-6 h-6 rounded",
                  "text-sm font-medium",
                  "transition-colors",
                  isSelected
                    ? ""
                    : "",
                )}
              >
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isSelected
                        ? ""
                        : "",
                    )}
                  >
                    Position {block.position}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4 font-mono",
                    )}
                  >
                    {block.values.size}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "text-xs font-mono truncate",
                    isSelected
                      ? ""
                      : "",
                  )}
                >
                  {valueArray.slice(0, 2).join(", ")}
                  {block.values.size > 2 && ` +${block.values.size - 2}`}
                </div>
              </div>

              {/* Check Icon */}
              {isSelected && (
                <Check className="h-4 w-4 flex-shrink-0" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="max-w-sm"
          >
            <div className="space-y-2">
              <p className="font-semibold font-mono text-sm">
                Position {block.position}
              </p>
              <div>
                <p className="text-xs opacity-80 mb-1">
                  {block.values.size}{" "}
                  unique value{block.values.size !== 1 ? "s" : ""}
                </p>
                <div className="text-xs font-mono px-2 py-1 rounded">
                  {valueArray.slice(0, 5).join(", ")}
                  {block.values.size > 5 && ` +${block.values.size - 5} more`}
                </div>
              </div>
              <p className="text-xs opacity-70">
                {isSelected ? "Click to deselect" : "Click to select"}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Expandable Details - Soft */}
      {showDetails && isSelected && (
        <div className="mt-2 ml-9 p-3 rounded">
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            All values at position {block.position}:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {valueArray.map((value) => (
              <code
                key={value}
                className="px-2 py-1 text-[10px] font-mono "
              >
                {value}
              </code>
            ))}
          </div>
          {block.examples[0] && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-[10px] font-medium mb-1.5">
                Example channel:
              </div>
              <code className="block text-[10px] font-mono px-2 py-1.5 rounded border">
                {block.examples[0]}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Auto Connections Panel Component - Professional & Elegant
 */
export const AutoConnectionsPanel: React.FC<AutoConnectionsPanelProps> = ({
  config,
  isEnabled,
  onToggle,
  onUpdateConfig,
  stats,
  availableBlocks,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBlockDetails, setShowBlockDetails] = useState(false);

  const selectedPositions = config.selectedBlocks || [];

  const toggleBlockPosition = (position: number): void => {
    const positions = selectedPositions;
    const newPositions = positions.includes(position)
      ? positions.filter((p) => p !== position)
      : [...positions, position].sort((a, b) => a - b);

    onUpdateConfig({ selectedBlocks: newPositions });
  };

  const isBlockSelected = (position: number): boolean => {
    return selectedPositions.includes(position);
  };

  return (
    <div
      className={cn(
        "w-96",
        "border ",
        "rounded-2xl",
        "backdrop-blur-sm",
        "overflow-hidden",
      )}
    >
      {/* Header - Soft Design */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          "border-b",
          isEnabled
            ? ""
            : "",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-1.5 rounded",
              isEnabled
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-zinc-200/80  text-zinc-500 ",
            )}
          >
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold ">
              Auto Connections
            </h3>
            <p className="text-[10px]">
              {isEnabled ? "Active" : "Disabled"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded transition-colors"
          >
            {isExpanded
              ? <ChevronUp className="h-4 w-4 " />
              : <ChevronDown className="h-4 w-4 " />}
          </button>

          {/* Toggle */}
          <button
            onClick={onToggle}
            className={cn(
              "p-1.5 rounded transition-colors",
              isEnabled
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                : "bg-zinc-100/80",
            )}
          >
            {isEnabled
              ? <Eye className="h-4 w-4" />
              : <EyeOff className="h-4 w-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
          >
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Stats - Soft Grid */}
          {stats && isEnabled && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3  rounded border">
                <div className="text-xs mb-1">
                  Nodes
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  {stats.nodeCount}
                </div>
              </div>
              <div className="text-center p-3 rounded border ">
                <div className="text-xs mb-1">
                  Edges
                </div>
                <div className="text-lg font-semibold tabular-nums">
                  {stats.edgeCount}
                </div>
              </div>
              <div className="text-center p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-200/60 dark:border-emerald-900/30">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                  Groups
                </div>
                <div className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {stats.groupCount}
                </div>
              </div>
            </div>
          )}

          {/* Block Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide">
                Select Positions
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tabular-nums">
                  {selectedPositions.length} / {availableBlocks.length}
                </span>
                {availableBlocks.length > 0 && (
                  <button
                    onClick={() => setShowBlockDetails(!showBlockDetails)}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors"
                  >
                    {showBlockDetails ? "Hide" : "Details"}
                  </button>
                )}
              </div>
            </div>

            {availableBlocks.length > 0
              ? (
                <div className="space-y-1.5">
                  {availableBlocks.map((block) => (
                    <BlockItem
                      key={block.position}
                      block={block}
                      isSelected={isBlockSelected(block.position)}
                      onToggle={() => toggleBlockPosition(block.position)}
                      showDetails={showBlockDetails}
                    />
                  ))}
                </div>
              )
              : (
                <div className="text-center py-8 px-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full  flex items-center justify-center">
                    <Sparkles className="h-5 w-5 " />
                  </div>
                  <p className="text-sm font-medium mb-1">
                    No blocks found
                  </p>
                  <p className="text-xs">
                    Add nodes to canvas to analyze channels
                  </p>
                </div>
              )}
          </div>

          {/* Display Options */}
          {availableBlocks.length > 0 && (
            <div className="pt-4 border-t ">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-sm ">
                    Show Labels
                  </span>
                </div>
                <Switch
                  checked={config.showLabels}
                  onCheckedChange={(checked) =>
                    onUpdateConfig({ showLabels: checked })}
                />
              </div>
            </div>
          )}

          {/* Connection Stats */}
          {stats &&
            isEnabled &&
            Object.keys(stats.connectionsByType).length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide ">
                  Active
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.connectionsByType).map(
                  ([type, count]) => {
                    const position = parseInt(type);
                    const blockColor = getBlockColor(position);
                    const positionIcons = [
                      "⓪",
                      "①",
                      "②",
                      "③",
                      "④",
                      "⑤",
                      "⑥",
                      "⑦",
                      "⑧",
                      "⑨",
                    ];
                    const icon = positionIcons[position] || "⊙";

                    return (
                      <Badge
                        key={type}
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 font-mono font-medium"
                        style={{
                          backgroundColor: `${blockColor}10`,
                          borderColor: `${blockColor}40`,
                          color: blockColor,
                        }}
                      >
                        {icon} [{position}]: {count}
                      </Badge>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Helper - Soft Design */}
          {availableBlocks.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-start gap-2 p-3  border border-amber-200/60  rounded">
                <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                  <p className="font-medium mb-1">Dynamic Block Grouping</p>
                  <p className="opacity-80">
                    Select positions from channel keys (split by dot). Nodes
                    with matching values will connect.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoConnectionsPanel;
