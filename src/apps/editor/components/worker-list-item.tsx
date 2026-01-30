/**
 * WorkerListItem component
 * Displays a single worker in the registry list
 */

import { memo } from "react";
import { FileCode, Crown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkerBadges } from "./worker-badges";
import type { WorkerListItemProps } from "../types/editor.types.ts";

/**
 * Helper function to format time ago
 */
function getTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 1000 / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * WorkerListItem component
 */
export const WorkerListItem = memo(function WorkerListItem({
  worker,
  isSelected,
  isNewlyCreated,
  onSelect,
  onMigrate,
}: WorkerListItemProps) {
  const isLeaderMode = worker.value.raw.executionMode === "leader";
  const scope = worker.value.raw.scope || "local";
  const execMode = worker.value.raw.executionMode || "parallel";
  const priority = worker.value.raw.priority || "normal";
  const version = worker.value.raw.version || "1.19.2";
  const sandbox = worker.value.raw.sandbox;

  const handleClick = () => {
    onSelect(worker);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(worker);
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      // Could add delete confirmation here
    }
  };

  const handleMigrateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMigrate) {
      onMigrate(worker);
    }
  };

  return (
    <div
      role="listitem"
      aria-selected={isSelected}
      aria-label={`Worker ${worker.value.raw.sid}${
        worker.value.raw.active ? ", active" : ", stopped"
      }`}
      className={`group flex flex-col px-2 py-1.5 cursor-pointer transition-all duration-200 ease-out ${
        isSelected
          ? "bg-[var(--editor-accent)]/15 border-l-2 border-[var(--editor-accent)]"
          : isNewlyCreated
          ? "bg-green-500/10 animate-pulse border-l-2 border-green-500"
          : "hover:bg-[var(--editor-sidebar)]/80 hover:border-l-2 hover:border-[var(--editor-sidebar-border)]"
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      title={`${worker.value.raw.sid} - ${
        worker.value.raw.active ? "Active" : "Stopped"
      } - Press Enter to select, Arrow keys to navigate`}
    >
      {/* Main row */}
      <div className="flex items-center gap-1.5">
        {/* File Icon with Status */}
        <div className="relative flex-shrink-0">
          <FileCode
            className={`w-4 h-4 shrink-0 ${
              isNewlyCreated
                ? "text-green-600"
                : isSelected
                ? "text-[var(--editor-accent)]"
                : worker.value.raw.active
                ? "text-[var(--editor-sidebar-foreground)]"
                : "text-[var(--editor-sidebar-foreground)]/60"
            }`}
          />
          {/* Active indicator */}
          {worker.value.raw.active && !isSelected && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          )}
          {/* Leader crown */}
          {isLeaderMode && (
            <Crown className="absolute -bottom-0.5 -right-0.5 w-2 h-2 text-[var(--editor-accent)]" />
          )}
        </div>

        {/* Filename and badges */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <span
            className={`font-mono text-[11px] font-semibold truncate ${
              isSelected
                ? "text-[var(--editor-sidebar-title)]"
                : worker.value.raw.active
                ? "text-[var(--editor-sidebar-foreground)]"
                : "text-[var(--editor-sidebar-foreground)]/70"
            }`}
          >
            {worker.value.raw.sid}
          </span>

          {/* Inline badges */}
          <WorkerBadges
            scope={scope}
            executionMode={execMode}
            priority={priority}
            version={version}
            sandbox={sandbox}
            size="sm"
          />
        </div>

        {/* Right side - Actions and time */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Migrate button */}
          {scope === "local" && onMigrate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMigrateClick}
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-green-700 dark:text-green-700 dark:text-green-600 hover:scale-110 hover:bg-green-500/10"
              title="Migrate to network"
            >
              <Upload className="w-2.5 h-2.5 transition-transform duration-200 group-hover:translate-y-[-2px]" />
            </Button>
          )}

          {/* Time ago */}
          <span className="text-[9px] text-muted-foreground font-mono min-w-[24px] text-right">
            {getTimeAgo(worker.value.raw.timestamp)}
          </span>
        </div>
      </div>

      {/* Description/Prompts - always visible if exists */}
      {worker.value.raw.note && (
        <div className="ml-5 mt-0.5">
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {worker.value.raw.note}
          </p>
        </div>
      )}
    </div>
  );
});

