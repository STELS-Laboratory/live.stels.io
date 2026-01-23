/**
 * Task History Panel Component
 * Displays execution history for a task
 */

import { useEffect, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAgentStore, useTaskHistory } from "../../store";
import type { Task, TaskExecutionLog } from "../../types";

interface TaskHistoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

/** Get status icon and color */
function getStatusDisplay(status: TaskExecutionLog["status"]) {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle2,
        color: "text-green-500",
        bgColor: "bg-green-100",
        label: "Completed",
      };
    case "failed":
      return {
        icon: XCircle,
        color: "text-red-500",
        bgColor: "bg-red-100",
        label: "Failed",
      };
    case "running":
      return {
        icon: Loader2,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
        label: "Running",
      };
    case "cancelled":
      return {
        icon: XCircle,
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        label: "Cancelled",
      };
    case "pending":
    default:
      return {
        icon: Clock,
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
        label: "Pending",
      };
  }
}

/** Format duration */
function formatDuration(ms?: number): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/** Format timestamp */
function formatTimestamp(ts?: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

export function TaskHistoryPanel({
  open,
  onOpenChange,
  task,
}: TaskHistoryPanelProps) {
  const history = useTaskHistory();
  const { getTaskHistory, clearTaskHistory } = useAgentStore();

  // Load history when task changes
  useEffect(() => {
    if (task && open) {
      getTaskHistory({ taskId: task.id, limit: 50 });
    }
    return () => {
      if (!open) {
        clearTaskHistory();
      }
    };
  }, [task, open, getTaskHistory, clearTaskHistory]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = history.length;
    const completed = history.filter((h) => h.status === "completed").length;
    const failed = history.filter((h) => h.status === "failed").length;
    const avgDuration =
      history.length > 0
        ? history.reduce((sum, h) => sum + (h.duration || 0), 0) / history.length
        : 0;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, failed, avgDuration, successRate };
  }, [history]);

  if (!task) return null;

  return (
    <TooltipProvider>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Execution History
            </SheetTitle>
            <SheetDescription>{task.name}</SheetDescription>
          </SheetHeader>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 py-4 border-b">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Rate</div>
            </div>
          </div>

          {/* Refresh button */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">
              Avg duration: {formatDuration(stats.avgDuration)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => getTaskHistory({ taskId: task.id, limit: 50 })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* History table */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">No execution history</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This task hasn&apos;t been executed yet
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => {
                    const statusDisplay = getStatusDisplay(entry.status);
                    const StatusIcon = statusDisplay.icon;

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${statusDisplay.bgColor} ${statusDisplay.color} gap-1`}
                          >
                            <StatusIcon
                              className={`h-3 w-3 ${
                                entry.status === "running" ? "animate-spin" : ""
                              }`}
                            />
                            {statusDisplay.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatTimestamp(entry.startedAt)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatDuration(entry.duration)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {entry.triggeredBy || "manual"}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.error ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-4 w-4 text-red-500 inline" />
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <p className="text-xs">{entry.error}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : entry.result ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <pre className="text-xs whitespace-pre-wrap">
                                  {JSON.stringify(entry.result, null, 2)}
                                </pre>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
