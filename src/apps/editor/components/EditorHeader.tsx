/**
 * EditorHeader component
 * Header for the code editor panel with worker info and actions
 */

import {
  Terminal,
  Upload,
  PowerOff,
  Play,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkerBadges } from "./WorkerBadges.tsx";
import type { EditorHeaderProps } from "../types/editor.types.ts";

/**
 * EditorHeader component
 */
export function EditorHeader({
  worker,
  isEditing,
  isEditingNote,
  isEditingConfig,
  toggling,
  onToggle,
  onMigrate,
}: EditorHeaderProps) {
  const scope = worker.value.raw.scope || "local";
  const execMode = worker.value.raw.executionMode || "parallel";
  const priority = worker.value.raw.priority || "normal";
  const version = worker.value.raw.version || "1.19.2";
  const hasUnsavedChanges = isEditing || isEditingNote || isEditingConfig;

  return (
    <div className="bg-card border-b border-border px-3 py-2 shadow-sm relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative w-7 h-7 bg-muted rounded flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:bg-muted/80 hover:scale-105">
            <Terminal className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 transition-transform duration-200" />
            {worker.value.raw.active && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground font-mono text-[11px] font-bold truncate">
              {worker.value.raw.sid}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <WorkerBadges
                scope={scope}
                executionMode={execMode}
                priority={priority}
                version={version}
                size="md"
              />
            </div>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] text-amber-700 dark:text-amber-400 font-mono">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              <span>Unsaved changes</span>
            </div>
          )}
        </div>

        <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* Migrate button for local workers */}
            {scope === "local" && onMigrate && (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onMigrate}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:text-blue-300"
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="space-y-1">
                    <p className="font-semibold">Migrate to Network</p>
                    <p className="text-xs text-muted-foreground">
                      Create a network copy with new ID
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Start/Stop button */}
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  onClick={onToggle}
                  size="sm"
                  disabled={toggling}
                  className={`h-6 w-6 p-0 ${
                    worker.value.raw.active
                      ? "bg-red-500 hover:bg-red-600 text-white dark:text-white"
                      : "bg-green-500 hover:bg-green-600 text-white dark:text-white"
                  }`}
                >
                  {toggling ? (
                    <Settings className="animate-spin w-3 h-3" />
                  ) : worker.value.raw.active ? (
                    <PowerOff className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {worker.value.raw.active ? "Stop Worker" : "Start Worker"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {worker.value.raw.active
                      ? "Deactivate this worker"
                      : "Activate this worker"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border">
                    Shortcut: ⌘K
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}

