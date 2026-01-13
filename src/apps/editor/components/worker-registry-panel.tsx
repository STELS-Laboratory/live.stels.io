/**
 * WorkerRegistryPanel component
 * Left panel with workers registry, search, filters, and list
 */

import {
  Database,
  Activity,
  Square,
  Plus,
  Search,
  X,
  Play,
  Server,
  Globe,
  Crown,
  Cpu,
  Zap,
  ArrowUp,
  ArrowDown,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkerListItem } from "./worker-list-item";
import { useWorkerFilters } from "../ami-editor/hooks/use-worker-filters";
import type { WorkerRegistryPanelProps } from "../types/editor.types.ts";

/**
 * WorkerRegistryPanel component
 */
export function WorkerRegistryPanel({
  workers,
  selectedWorker,
  loading,
  searchTerm,
  filterActive,
  filterExecutionMode,
  filterPriority,
  filterScope,
  sortOrder,
  newlyCreatedWorker,
  onSearchChange,
  onFilterActiveChange,
  onFilterExecutionModeChange,
  onFilterPriorityChange,
  onFilterScopeChange,
  onSortOrderChange,
  onSelectWorker,
  onCreateWorker,
  onShowStats,
  onStopAll,
  searchInputRef,
  onMigrate,
}: WorkerRegistryPanelProps & { onMigrate?: (worker: import("@/types/apps/editor/types").Worker) => void }) {
  const filteredWorkers = useWorkerFilters({
    workers,
    searchTerm,
    filterActive,
    filterExecutionMode,
    filterPriority,
    filterScope,
    sortOrder,
  });

  const activeWorkersCount = workers.filter((w) => w.value.raw.active).length;
  const hasActiveFilters =
    searchTerm ||
    filterActive !== null ||
    filterExecutionMode ||
    filterPriority ||
    filterScope !== "local";

  return (
    <div
      className="h-full bg-card flex flex-col overflow-hidden"
      role="complementary"
      aria-labelledby="registry-header"
    >
      {/* Header - Compact */}
      <div className="px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <h2
              className="text-amber-700 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wide"
              id="registry-header"
            >
              Protocol Registry
            </h2>
          </div>
          <TooltipProvider>
            <div className="flex items-center gap-1">
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onShowStats}
                    className="h-6 w-6 p-0"
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Worker Stats</TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onStopAll}
                    disabled={activeWorkersCount === 0}
                    className="h-6 w-6 p-0 text-red-700 dark:text-red-400 hover:text-red-800 dark:text-red-300"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Stop All Workers</TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-border mx-0.5" />

              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={onCreateWorker}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black h-6 px-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="text-[10px] font-mono font-bold">NEW</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Create Worker</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Search and Filters */}
        <div className="space-y-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground transition-colors duration-200" />
            <Input
              ref={searchInputRef}
              placeholder="Search workers... (⌘F)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-7 pr-7 bg-input border-border text-foreground placeholder:text-muted-foreground h-6 text-[11px] focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200 hover:border-amber-500/50"
              aria-label="Search workers by ID, note, or version"
            />
            {searchTerm && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 hover:bg-muted/50"
                onClick={() => onSearchChange("")}
                title="Clear search (Esc)"
              >
                <X className="w-3 h-3 transition-transform duration-200 group-hover:rotate-90" />
              </Button>
            )}
            {!searchTerm && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <kbd className="px-1 py-0.5 text-[9px] bg-muted/50 rounded border border-border/50 text-muted-foreground">
                  ⌘F
                </kbd>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5 border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
                Status
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterActiveChange(null)}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 ${
                  filterActive === null
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterActiveChange(true)}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
                  filterActive === true
                    ? "bg-green-500/20 text-green-700 dark:text-green-600 shadow-sm"
                    : "text-muted-foreground hover:text-green-700 dark:text-green-600 hover:bg-green-500/10"
                }`}
              >
                <Play className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
                Active
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterActiveChange(false)}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
                  filterActive === false
                    ? "bg-red-500/20 text-red-700 dark:text-red-400 shadow-sm"
                    : "text-muted-foreground hover:text-red-700 dark:text-red-400 hover:bg-red-500/10"
                }`}
              >
                <Square className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
                Stopped
              </Button>
            </div>

            {/* Scope Filter */}
            <div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5 border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
                Scope
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterScopeChange(null)}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 ${
                  filterScope === null
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterScopeChange("local")}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
                  filterScope === "local"
                    ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm"
                    : "text-muted-foreground hover:text-blue-700 dark:text-blue-400 hover:bg-blue-500/10"
                }`}
              >
                <Server className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
                Local
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterScopeChange("network")}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
                  filterScope === "network"
                    ? "bg-green-500/20 text-green-700 dark:text-green-600 shadow-sm"
                    : "text-muted-foreground hover:text-green-700 dark:text-green-600 hover:bg-green-500/10"
                }`}
              >
                <Globe className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
                Network
              </Button>
            </div>

            {/* Execution Mode Filter */}
            <div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5 border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
                Mode
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterExecutionModeChange(null)}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 ${
                  filterExecutionMode === null
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterExecutionModeChange("leader")}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
                  filterExecutionMode === "leader"
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm"
                    : "text-muted-foreground hover:text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                }`}
              >
                <Crown className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                Leader
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterExecutionModeChange("parallel")}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
                  filterExecutionMode === "parallel"
                    ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm"
                    : "text-muted-foreground hover:text-blue-700 dark:text-blue-400 hover:bg-blue-500/10"
                }`}
              >
                <Cpu className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
                Parallel
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterExecutionModeChange("exclusive")}
                className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
                  filterExecutionMode === "exclusive"
                    ? "bg-purple-500/20 text-purple-700 dark:text-purple-400 shadow-sm"
                    : "text-muted-foreground hover:text-purple-700 dark:text-purple-400 hover:bg-purple-500/10"
                }`}
              >
                <Zap className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                Exclusive
              </Button>
            </div>

            <div className="flex-1" />

            {/* Sort & Clear */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 hover:bg-muted/50"
                title={sortOrder === "asc" ? "Oldest first" : "Newest first"}
              >
                {sortOrder === "asc" ? (
                  <ArrowUp className="w-3 h-3 transition-transform duration-200 group-hover:-translate-y-0.5" />
                ) : (
                  <ArrowDown className="w-3 h-3 transition-transform duration-200 group-hover:translate-y-0.5" />
                )}
              </Button>

              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-amber-700 dark:text-amber-400"
                  onClick={() => {
                    onSearchChange("");
                    onFilterActiveChange(null);
                    onFilterExecutionModeChange(null);
                    onFilterPriorityChange(null);
                    onFilterScopeChange("local");
                  }}
                  title="Clear all filters"
                >
                  <X className="w-3 h-3 mr-0.5" />
                  Clear
                </Button>
              )}

              <div className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
                {filteredWorkers.length}/{workers.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workers List */}
      <ScrollArea
        className="flex-1 overflow-y-auto"
        role="list"
        aria-label="Workers list"
      >
        <div className="py-1">
          {loading ? (
            // Skeleton loaders
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="px-2 py-1.5 animate-in fade-in slide-in-from-left-4"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animationDuration: "300ms",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 flex-1 max-w-[200px]" />
                    <Skeleton className="h-3 w-6 rounded" />
                    <Skeleton className="h-3 w-6 rounded ml-auto" />
                  </div>
                  <Skeleton className="h-3 w-32 ml-5 mt-0.5" />
                </div>
              ))}
            </div>
          ) : filteredWorkers.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                  <FileCode className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500/20 rounded-full border-2 border-background animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No workers found
              </h3>
              <p className="text-xs text-muted-foreground text-center max-w-xs mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms"
                  : "Create your first worker to get started"}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={onCreateWorker}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold transition-all duration-200 hover:scale-105"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create Worker
                </Button>
              )}
            </div>
          ) : (
            filteredWorkers
              .filter((worker) => worker?.value?.raw) // Filter out invalid workers
              .map((worker, index) => {
                const uniqueKey = `${worker.key.join("-")}-${worker.value.raw.sid}-${index}`;
                return (
                  <WorkerListItem
                    key={uniqueKey}
                    worker={worker}
                    isSelected={selectedWorker?.value?.raw?.sid === worker.value.raw.sid}
                    isNewlyCreated={newlyCreatedWorker === worker.value.raw.sid}
                    onSelect={onSelectWorker}
                    onMigrate={onMigrate}
                  />
                );
              })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-2 py-1 border-t border-border bg-card/10 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
          <span className="transition-colors duration-200">
            {filteredWorkers.length} items
          </span>
          <div className="flex items-center gap-2">
            <span className="text-green-700 dark:text-green-600 transition-colors duration-200 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50" />
              {activeWorkersCount} active
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-red-700 dark:text-red-400 transition-colors duration-200 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full shadow-sm shadow-red-400/30" />
              {workers.filter((w) => !w.value.raw.active).length} stopped
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

