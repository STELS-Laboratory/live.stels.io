/**
 * Task List Panel Component
 * Displays list of tasks for an agent with actions
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAgentStore, useTasks, useTasksLoading, useTaskExecuting } from "../../store";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { getExchangeIconPath } from "@/apps/accounts/types";
import type { Task, TaskStatus, Agent } from "../../types";
import { TASK_STATUS_CONFIG, TASK_TRIGGER_TYPES } from "../../types";

interface TaskListPanelProps {
  agent: Agent;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onViewHistory: (task: Task) => void;
}

/** Format timestamp to relative time */
function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "Never";
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Format next execution time */
function formatNextExecution(timestamp?: number): string {
  if (!timestamp) return "Not scheduled";
  
  const now = Date.now();
  const diff = timestamp - now;
  
  if (diff < 0) return "Overdue";
  if (diff < 60000) return "In < 1m";
  if (diff < 3600000) return `In ${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `In ${Math.floor(diff / 3600000)}h`;
  return new Date(timestamp).toLocaleDateString();
}

/** Get status badge config */
function getStatusConfig(status: TaskStatus) {
  return TASK_STATUS_CONFIG.find((s) => s.value === status) || TASK_STATUS_CONFIG[0];
}

/** Get trigger label */
function getTriggerLabel(type: string) {
  return TASK_TRIGGER_TYPES.find((t) => t.value === type)?.label || type;
}

export function TaskListPanel({
  agent,
  onCreateTask,
  onEditTask,
  onViewHistory,
}: TaskListPanelProps) {
  const allTasks = useTasks();
  const loading = useTasksLoading();
  const executing = useTaskExecuting();
  const { listTasks, executeTask, pauseTask, resumeTask, deleteTask } = useAgentStore();
  const accounts = useAccountsStore((s) => s.accounts);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  // Filter tasks by agent ID - memoized to prevent infinite loops
  const tasks = useMemo(() => {
    return allTasks.filter((t) => t.agentId === agent.id);
  }, [allTasks, agent.id]);

  // Load tasks on mount
  useEffect(() => {
    listTasks({ agentId: agent.id });
  }, [agent.id, listTasks]);

  // Filter tasks by search and status
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchTerm === "" ||
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  // Handle task execution
  const handleExecute = useCallback(async (task: Task) => {
    setExecutingTaskId(task.id);
    await executeTask({ taskId: task.id });
    setExecutingTaskId(null);
  }, [executeTask]);

  // Handle pause/resume
  const handleTogglePause = useCallback(async (task: Task) => {
    if (task.status === "cancelled" || task.status === "pending") {
      await resumeTask(task.id);
    } else if (task.status === "scheduled" || task.status === "running") {
      await pauseTask(task.id);
    }
  }, [pauseTask, resumeTask]);

  // Handle delete
  const handleDelete = useCallback(async (task: Task) => {
    if (confirm(`Delete task "${task.name}"?`)) {
      await deleteTask(task.id);
    }
  }, [deleteTask]);

  // Refresh tasks
  const handleRefresh = useCallback(() => {
    listTasks({ agentId: agent.id });
  }, [agent.id, listTasks]);

  // Task stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) => t.status === "scheduled" || t.status === "running").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const failed = tasks.filter((t) => t.status === "failed").length;
    return { total, active, completed, failed };
  }, [tasks]);

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold">Tasks</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} tasks · {stats.active} active
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh tasks</TooltipContent>
            </Tooltip>
            <Button onClick={onCreateTask}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 border-b p-4">
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}
          >
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {TASK_STATUS_CONFIG.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Task List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {loading && tasks.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Zap className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">No tasks found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create a task to automate agent actions"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={onCreateTask} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Task
                  </Button>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => {
                const statusConfig = getStatusConfig(task.status);
                const isExecuting = executingTaskId === task.id || (executing && task.status === "running");
                const canPause = task.status === "scheduled" || task.status === "running";
                const canResume = task.status === "cancelled" || task.status === "pending";
                const canExecute = task.status !== "running" && task.trigger.type === "manual";
                
                // Find linked account
                const linkedAccount = task.action.accountId 
                  ? accounts.find((a) => a.account.nid === task.action.accountId)
                  : null;

                return (
                  <Card
                    key={task.id}
                    className="group cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => onEditTask(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Task name and status */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{task.name}</h3>
                            <Badge
                              variant="secondary"
                              className={`${statusConfig.bgColor} ${statusConfig.color} text-xs`}
                            >
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate mb-2">
                              {task.description}
                            </p>
                          )}

                          {/* Meta info */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              <span>{getTriggerLabel(task.trigger.type)}</span>
                            </div>
                            {linkedAccount && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1">
                                    <img
                                      src={getExchangeIconPath(linkedAccount.account.exchange)}
                                      alt={linkedAccount.account.exchange}
                                      className="h-3 w-3"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                    <span className="truncate max-w-[80px]">
                                      {linkedAccount.account.note || linkedAccount.account.nid}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Account: {linkedAccount.account.note || linkedAccount.account.nid}</p>
                                  <p className="text-xs text-muted-foreground">{linkedAccount.account.exchange}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Last: {formatRelativeTime(task.lastExecutedAt)}</span>
                            </div>
                            {task.nextExecutionAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Next: {formatNextExecution(task.nextExecutionAt)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              {task.errorCount > 0 ? (
                                <XCircle className="h-3 w-3 text-red-500" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              )}
                              <span>
                                {task.executionCount} runs
                                {task.errorCount > 0 && ` · ${task.errorCount} errors`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canExecute && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleExecute(task)}
                                  disabled={isExecuting}
                                >
                                  {isExecuting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Execute now</TooltipContent>
                            </Tooltip>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditTask(task)}>
                                <ChevronRight className="mr-2 h-4 w-4" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onViewHistory(task)}>
                                <Clock className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {canPause && (
                                <DropdownMenuItem onClick={() => handleTogglePause(task)}>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause
                                </DropdownMenuItem>
                              )}
                              {canResume && (
                                <DropdownMenuItem onClick={() => handleTogglePause(task)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Resume
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(task)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
