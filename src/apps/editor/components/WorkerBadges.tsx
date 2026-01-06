/**
 * WorkerBadges component
 * Displays badges for worker scope, execution mode, priority, and version
 */

import type { WorkerBadgesProps } from "../types/editor.types.ts";

/**
 * WorkerBadges component
 */
export function WorkerBadges({
  scope,
  executionMode,
  priority,
  version,
  size = "md",
  className = "",
}: WorkerBadgesProps) {
  const isSmall = size === "sm";
  const textSize = isSmall ? "text-[8px]" : "text-[9px]";
  const padding = isSmall ? "px-0.5" : "px-1 py-0.5";

  const getScopeBadge = () => {
    const isNetwork = scope === "network";
    return (
      <span
        className={`${textSize} ${padding} rounded ${
          isNetwork
            ? "bg-green-500/20 text-green-700 dark:text-green-700 dark:text-green-600"
            : "bg-blue-500/20 text-blue-700 dark:text-blue-400"
        } ${className}`}
        title={scope}
      >
        {isSmall ? (isNetwork ? "N" : "L") : isNetwork ? "NET" : "LOC"}
      </span>
    );
  };

  const getExecutionModeBadge = () => {
    const isLeader = executionMode === "leader";
    const isParallel = executionMode === "parallel";
    return (
      <span
        className={`${textSize} ${padding} rounded ${
          isLeader
            ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
            : isParallel
            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
            : "bg-purple-500/20 text-purple-700 dark:text-purple-400"
        } ${className}`}
        title={executionMode}
      >
        {isSmall
          ? isLeader
            ? "L"
            : isParallel
            ? "P"
            : "E"
          : isLeader
          ? "LDR"
          : isParallel
          ? "PAR"
          : "EXC"}
      </span>
    );
  };

  const getPriorityBadge = () => {
    const priorityColors = {
      critical: "bg-red-500/10 text-red-700 dark:text-red-400",
      high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      normal: "bg-green-500/10 text-green-700 dark:text-green-700 dark:text-green-600",
      low: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    };

    const priorityLabels = {
      critical: isSmall ? "C" : "CRT",
      high: isSmall ? "H" : "HI",
      normal: isSmall ? "N" : "NRM",
      low: isSmall ? "L" : "LOW",
    };

    return (
      <span
        className={`${textSize} ${padding} rounded font-mono ${priorityColors[priority]} ${className}`}
        title={priority}
      >
        {priorityLabels[priority]}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-0.5">
      {getScopeBadge()}
      {getExecutionModeBadge()}
      {!isSmall && getPriorityBadge()}
      {!isSmall && (
        <span className={`${textSize} text-muted-foreground`}>
          v{version}
        </span>
      )}
    </div>
  );
}

