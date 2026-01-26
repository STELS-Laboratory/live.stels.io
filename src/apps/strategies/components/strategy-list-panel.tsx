/**
 * Strategy List Panel Component
 * Displays user's created strategies with status and actions
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  Search,
  Square,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStrategyStore } from "../store";
import {
  STATUS_CONFIG,
  type Strategy,
  type StrategyStatus,
} from "../types";

interface StrategyListPanelProps {
  onSelectStrategy?: (strategy: Strategy) => void;
}

export function StrategyListPanel({ onSelectStrategy }: StrategyListPanelProps) {
  const {
    strategies,
    templates,
    strategiesLoading,
    strategiesError,
    filters,
    listStrategies,
    startStrategy,
    pauseStrategy,
    stopStrategy,
    deleteStrategy,
    setFilters,
  } = useStrategyStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load strategies on mount
  useEffect(() => {
    listStrategies();
  }, [listStrategies]);

  // Filter strategies
  const filteredStrategies = useMemo(() => {
    let result = strategies;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.templateId.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((s) => s.status === filters.status);
    }

    return result;
  }, [strategies, searchQuery, filters.status]);

  // Get template name by ID
  const getTemplateName = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      return template?.name ?? templateId;
    },
    [templates]
  );

  // Get template icon by ID
  const getTemplateIcon = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      return template?.icon;
    },
    [templates]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    listStrategies();
  }, [listStrategies]);

  // Handle start
  const handleStart = useCallback(
    async (strategyId: string) => {
      setActionLoading(strategyId);
      await startStrategy(strategyId);
      setActionLoading(null);
    },
    [startStrategy]
  );

  // Handle pause
  const handlePause = useCallback(
    async (strategyId: string) => {
      setActionLoading(strategyId);
      await pauseStrategy(strategyId);
      setActionLoading(null);
    },
    [pauseStrategy]
  );

  // Handle stop
  const handleStop = useCallback(
    async (strategyId: string) => {
      setActionLoading(strategyId);
      await stopStrategy(strategyId);
      setActionLoading(null);
    },
    [stopStrategy]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deleteConfirmId) return;

    setActionLoading(deleteConfirmId);
    await deleteStrategy(deleteConfirmId);
    setActionLoading(null);
    setDeleteConfirmId(null);
  }, [deleteConfirmId, deleteStrategy]);

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats summary
  const stats = useMemo(() => {
    const total = strategies.length;
    const running = strategies.filter((s) => s.status === "running").length;
    const paused = strategies.filter((s) => s.status === "paused").length;
    const errors = strategies.filter((s) => s.status === "error").length;
    return { total, running, paused, errors };
  }, [strategies]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold">My Strategies</h2>
          <p className="text-sm text-muted-foreground">
            {filteredStrategies.length} of {strategies.length} strategies
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={strategiesLoading}
        >
          <RefreshCw
            className={cn("w-4 h-4", strategiesLoading && "animate-spin")}
          />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 p-4 border-b border-border flex-shrink-0">
        <div className="text-center">
          <p className="text-xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-green-500">{stats.running}</p>
          <p className="text-xs text-muted-foreground">Running</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-yellow-500">{stats.paused}</p>
          <p className="text-xs text-muted-foreground">Paused</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-red-500">{stats.errors}</p>
          <p className="text-xs text-muted-foreground">Errors</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search strategies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          <Select
            value={filters.status || "all"}
            onValueChange={(v) =>
              setFilters({ status: v === "all" ? undefined : (v as StrategyStatus) })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {strategiesLoading && strategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Loading strategies...</p>
            </div>
          ) : strategiesError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
              <p className="text-sm text-destructive">{strategiesError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh}>
                Try again
              </Button>
            </div>
          ) : filteredStrategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Zap className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {strategies.length === 0
                  ? "No strategies yet"
                  : "No strategies match your filters"}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  templateName={getTemplateName(strategy.templateId)}
                  templateIcon={getTemplateIcon(strategy.templateId)}
                  isLoading={actionLoading === strategy.id}
                  onStart={() => handleStart(strategy.id)}
                  onPause={() => handlePause(strategy.id)}
                  onStop={() => handleStop(strategy.id)}
                  onDelete={() => setDeleteConfirmId(strategy.id)}
                  onClick={() => onSelectStrategy?.(strategy)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Strategy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this strategy? This action cannot be undone.
              All associated tasks will also be stopped and removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === deleteConfirmId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// Strategy Card Component
// ============================================================================

interface StrategyCardProps {
  strategy: Strategy;
  templateName: string;
  templateIcon?: string;
  isLoading: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onDelete: () => void;
  onClick?: () => void;
  formatDate: (timestamp: number) => string;
}

function StrategyCard({
  strategy,
  templateName,
  templateIcon,
  isLoading,
  onStart,
  onPause,
  onStop,
  onDelete,
  onClick,
  formatDate,
}: StrategyCardProps) {
  const statusConfig = STATUS_CONFIG[strategy.status];

  return (
    <Card
      className={cn(
        "hover:border-primary/50 transition-colors",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {templateIcon ? (
              <span className="text-xl">{templateIcon}</span>
            ) : (
              <Zap className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium truncate">{strategy.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {templateName}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>

                {/* Quick Actions */}
                <TooltipProvider>
                  {strategy.status === "running" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPause();
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Pause className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pause</TooltipContent>
                    </Tooltip>
                  ) : strategy.status === "paused" || strategy.status === "ready" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStart();
                          }}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Start</TooltipContent>
                    </Tooltip>
                  ) : null}
                </TooltipProvider>

                {/* More Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {strategy.status !== "running" && (
                      <DropdownMenuItem onClick={onStart} disabled={isLoading}>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </DropdownMenuItem>
                    )}
                    {strategy.status === "running" && (
                      <>
                        <DropdownMenuItem onClick={onPause} disabled={isLoading}>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onStop} disabled={isLoading}>
                          <Square className="w-4 h-4 mr-2" />
                          Stop
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      disabled={isLoading}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Created {formatDate(strategy.createdAt)}</span>
              </div>
              {strategy.stats?.totalExecutions !== undefined && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>{strategy.stats.totalExecutions} executions</span>
                </div>
              )}
              {strategy.stats?.failedExecutions !== undefined && strategy.stats.failedExecutions > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{strategy.stats.failedExecutions} errors</span>
                </div>
              )}
            </div>

            {/* Stats Preview */}
            {strategy.stats && (
              <div className="flex items-center gap-4 mt-2 text-xs">
                {(strategy.stats.totalProfit !== undefined || strategy.stats.totalLoss !== undefined) && (
                  <span
                    className={cn(
                      "font-medium",
                      (strategy.stats.totalProfit ?? 0) - (strategy.stats.totalLoss ?? 0) >= 0 
                        ? "text-green-500" 
                        : "text-red-500"
                    )}
                  >
                    {(strategy.stats.totalProfit ?? 0) - (strategy.stats.totalLoss ?? 0) >= 0 ? "+" : ""}
                    ${((strategy.stats.totalProfit ?? 0) - (strategy.stats.totalLoss ?? 0)).toFixed(2)}
                  </span>
                )}
                {strategy.stats.winRate !== undefined && (
                  <span className="text-muted-foreground">
                    Win rate: {(strategy.stats.winRate * 100).toFixed(1)}%
                  </span>
                )}
                {strategy.stats.totalExecutions !== undefined && (
                  <span className="text-muted-foreground">
                    {strategy.stats.totalExecutions} executions
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
