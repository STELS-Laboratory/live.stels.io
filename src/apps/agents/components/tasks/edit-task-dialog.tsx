/**
 * Edit Task Dialog Component
 * Modal for editing existing tasks
 */

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  Save,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { getExchangeIconPath } from "@/apps/accounts/types";
import type { Task, UpdateTaskRequest, TriggerType, AgentDomain } from "../../types";
import { TASK_ACTION_TYPES, TASK_TRIGGER_TYPES, TASK_STATUS_CONFIG } from "../../types";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSubmit: (request: UpdateTaskRequest) => Promise<void>;
  loading?: boolean;
}

/** Common cron presets */
const CRON_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 4 hours", value: "0 */4 * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every day at 9 AM", value: "0 9 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
];

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
  loading = false,
}: EditTaskDialogProps) {
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<AgentDomain>("general");
  const [actionType, setActionType] = useState("");
  const [accountId, setAccountId] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("manual");
  const [cronExpression, setCronExpression] = useState("0 * * * *");
  const [intervalMs, setIntervalMs] = useState(60000);
  const [requireApproval, setRequireApproval] = useState(false);
  const [maxExecutions, setMaxExecutions] = useState<number | undefined>(undefined);
  const [maxExecutionsPerHour, setMaxExecutionsPerHour] = useState<number | undefined>(undefined);
  const [cooldownMs, setCooldownMs] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState("normal");
  const [parameters, setParameters] = useState<Record<string, string>>({});

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get accounts
  const { accounts } = useAccountsStore();

  // Load task data when task changes
  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description || "");
      setDomain(task.domain as AgentDomain);
      setActionType(task.action.type);
      setAccountId(task.action.accountId);
      setTriggerType(task.trigger.type);
      
      const config = task.trigger.config as Record<string, unknown>;
      if (config.cron) {
        setCronExpression(config.cron as string);
      }
      if (config.interval) {
        setIntervalMs(config.interval as number);
      }
      
      setRequireApproval(task.approval?.required || false);
      setMaxExecutions(task.limits?.maxExecutions);
      setMaxExecutionsPerHour(task.limits?.maxExecutionsPerHour);
      setCooldownMs(task.limits?.cooldownMs);
      setPriority(task.priority || "normal");
      
      // Convert parameters to string values for form
      const params: Record<string, string> = {};
      Object.entries(task.action.parameters || {}).forEach(([key, value]) => {
        params[key] = String(value);
      });
      setParameters(params);
    }
  }, [task]);

  // Filter action types by domain
  const availableActions = useMemo(() => {
    return TASK_ACTION_TYPES.filter(
      (action) => action.domain === domain || action.domain === "general"
    );
  }, [domain]);

  // Validate form
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!actionType) {
      newErrors.actionType = "Action type is required";
    }

    // Domains that require account binding
    const domainsRequiringAccount = ["trading", "iot", "drone", "social"];
    if (!accountId && domainsRequiringAccount.includes(domain)) {
      newErrors.accountId = `Account is required for ${domain} tasks`;
    }

    if (triggerType === "scheduled" && !cronExpression && !intervalMs) {
      newErrors.trigger = "Cron expression or interval is required for scheduled tasks";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, actionType, accountId, domain, triggerType, cronExpression, intervalMs]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!task || !validate()) return;

    const triggerConfig: Record<string, unknown> = {};
    
    if (triggerType === "scheduled") {
      if (cronExpression) {
        triggerConfig.cron = cronExpression;
      } else {
        triggerConfig.interval = intervalMs;
      }
    }

    const request: UpdateTaskRequest = {
      taskId: task.id,
      name: name.trim(),
      description: description.trim() || undefined,
      action: {
        type: actionType,
        accountId: accountId || undefined,
        parameters,
      },
      trigger: {
        type: triggerType,
        config: triggerConfig,
      },
      approval: { required: requireApproval },
      limits: {
        maxExecutions,
        maxExecutionsPerHour,
        cooldownMs,
      },
      priority,
    };

    await onSubmit(request);
    onOpenChange(false);
  }, [
    task,
    validate,
    name,
    description,
    actionType,
    accountId,
    parameters,
    triggerType,
    cronExpression,
    intervalMs,
    requireApproval,
    maxExecutions,
    maxExecutionsPerHour,
    cooldownMs,
    priority,
    onSubmit,
    onOpenChange,
  ]);

  // Update parameter value
  const updateParameter = (key: string, value: string) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  // Get status config
  const statusConfig = task ? TASK_STATUS_CONFIG.find((s) => s.value === task.status) : null;

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Task
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {statusConfig && (
              <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
            )}
            <span>Executed {task.executionCount} times</span>
            {task.errorCount > 0 && (
              <span className="text-red-500">· {task.errorCount} errors</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">
              <Settings className="mr-2 h-4 w-4" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="trigger">
              <Clock className="mr-2 h-4 w-4" />
              Trigger
            </TabsTrigger>
            <TabsTrigger value="action">
              <Zap className="mr-2 h-4 w-4" />
              Action
            </TabsTrigger>
            <TabsTrigger value="limits">
              <Shield className="mr-2 h-4 w-4" />
              Limits
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="pr-4">
              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Task Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Daily Balance Check"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this task do?"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Select value={domain} onValueChange={(v) => setDomain(v as AgentDomain)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="iot">IoT</SelectItem>
                        <SelectItem value="drone">Drone</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="devops">DevOps</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Task Info */}
                <Card className="bg-muted/30">
                  <CardContent className="p-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>{" "}
                      {new Date(task.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>{" "}
                      {new Date(task.updatedAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Executed:</span>{" "}
                      {task.lastExecutedAt
                        ? new Date(task.lastExecutedAt).toLocaleString()
                        : "Never"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Execution:</span>{" "}
                      {task.nextExecutionAt
                        ? new Date(task.nextExecutionAt).toLocaleString()
                        : "Not scheduled"}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Trigger Tab */}
              <TabsContent value="trigger" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TASK_TRIGGER_TYPES.map((trigger) => (
                      <Card
                        key={trigger.value}
                        className={`cursor-pointer transition-colors ${
                          triggerType === trigger.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setTriggerType(trigger.value)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full border-2 ${
                                triggerType === trigger.value
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground"
                              }`}
                            />
                            <div>
                              <p className="font-medium text-sm">{trigger.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {trigger.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {triggerType === "scheduled" && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Schedule Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Cron Expression</Label>
                        <Input
                          value={cronExpression}
                          onChange={(e) => setCronExpression(e.target.value)}
                          placeholder="* * * * *"
                          className="font-mono"
                        />
                        <div className="flex flex-wrap gap-1">
                          {CRON_PRESETS.map((preset) => (
                            <Badge
                              key={preset.value}
                              variant="outline"
                              className="cursor-pointer hover:bg-muted"
                              onClick={() => setCronExpression(preset.value)}
                            >
                              {preset.label}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Or use interval (ms)</Label>
                        <Input
                          type="number"
                          value={intervalMs}
                          onChange={(e) => setIntervalMs(Number(e.target.value))}
                          min={1000}
                          step={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum: 1000ms (1 second)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {errors.trigger && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.trigger}
                  </p>
                )}
              </TabsContent>

              {/* Action Tab */}
              <TabsContent value="action" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label>
                    Action Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableActions.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.actionType && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.actionType}
                    </p>
                  )}
                </div>

                {/* Account selector for domains that require it */}
                {["trading", "iot", "drone", "social"].includes(domain) && (
                  <div className="space-y-2">
                    <Label>
                      Account <span className="text-red-500">*</span>
                    </Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No accounts available. Add an account first.
                          </div>
                        ) : (
                          accounts.map((stored) => (
                            <SelectItem key={stored.account.nid} value={stored.account.nid}>
                              <div className="flex items-center gap-2">
                                <img
                                  src={getExchangeIconPath(stored.account.exchange)}
                                  alt={stored.account.exchange}
                                  className="h-4 w-4"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                                <span>{stored.account.note || stored.account.nid}</span>
                                <Badge variant="outline" className="text-xs">
                                  {stored.account.exchange}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This account will be used to execute {domain} actions
                    </p>
                    {errors.accountId && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {errors.accountId}
                      </p>
                    )}
                  </div>
                )}

                {/* Dynamic parameters based on action type */}
                {actionType && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Action Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {actionType === "trading:create_order" && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Symbol</Label>
                              <Input
                                value={parameters.symbol || ""}
                                onChange={(e) => updateParameter("symbol", e.target.value)}
                                placeholder="BTC/USDT"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Side</Label>
                              <Select
                                value={parameters.side || ""}
                                onValueChange={(v) => updateParameter("side", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="buy">Buy</SelectItem>
                                  <SelectItem value="sell">Sell</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Amount</Label>
                              <Input
                                type="number"
                                value={parameters.amount || ""}
                                onChange={(e) => updateParameter("amount", e.target.value)}
                                placeholder="0.001"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Price (optional)</Label>
                              <Input
                                type="number"
                                value={parameters.price || ""}
                                onChange={(e) => updateParameter("price", e.target.value)}
                                placeholder="Market order if empty"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {actionType === "trading:fetch_balance" && (
                        <p className="text-sm text-muted-foreground">
                          No additional parameters required. Will fetch all balances.
                        </p>
                      )}

                      {actionType === "trading:fetch_positions" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Symbol (optional)</Label>
                          <Input
                            value={parameters.symbol || ""}
                            onChange={(e) => updateParameter("symbol", e.target.value)}
                            placeholder="Leave empty for all positions"
                          />
                        </div>
                      )}

                      {actionType === "notify:send" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Channel</Label>
                            <Select
                              value={parameters.channel || ""}
                              onValueChange={(v) => updateParameter("channel", v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="telegram">Telegram</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="webhook">Webhook</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Message</Label>
                            <Textarea
                              value={parameters.message || ""}
                              onChange={(e) => updateParameter("message", e.target.value)}
                              placeholder="Notification message..."
                              rows={2}
                            />
                          </div>
                        </>
                      )}

                      {!["trading:create_order", "trading:fetch_balance", "trading:fetch_positions", "notify:send"].includes(actionType) && (
                        <p className="text-sm text-muted-foreground">
                          Configure parameters as JSON in the parameters field.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Limits Tab */}
              <TabsContent value="limits" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Approval
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Require Approval</p>
                        <p className="text-xs text-muted-foreground">
                          Task must be approved before execution
                        </p>
                      </div>
                      <Switch
                        checked={requireApproval}
                        onCheckedChange={setRequireApproval}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Execution Limits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Max Total Executions</Label>
                        <Input
                          type="number"
                          value={maxExecutions || ""}
                          onChange={(e) =>
                            setMaxExecutions(e.target.value ? Number(e.target.value) : undefined)
                          }
                          placeholder="Unlimited"
                          min={1}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max per Hour</Label>
                        <Input
                          type="number"
                          value={maxExecutionsPerHour || ""}
                          onChange={(e) =>
                            setMaxExecutionsPerHour(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          placeholder="Unlimited"
                          min={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Cooldown (ms)</Label>
                      <Input
                        type="number"
                        value={cooldownMs || ""}
                        onChange={(e) =>
                          setCooldownMs(e.target.value ? Number(e.target.value) : undefined)
                        }
                        placeholder="No cooldown"
                        min={0}
                        step={1000}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum time between executions
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
