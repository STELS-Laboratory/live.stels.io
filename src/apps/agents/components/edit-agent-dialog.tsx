/**
 * Edit Agent Dialog Component
 * Modal for editing existing AI agents
 * Uses real API calls for account linking/unlinking
 */

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Folder,
  Link2,
  Loader2,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Unlink,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { useAgentStore } from "../store";
import { getExchangeIconPath } from "@/apps/accounts/types";
import type {
  Agent,
  AgentConfig,
  AgentStatus,
  AgentUpdateRequest,
  ConnectedAccountRef,
  PermissionScope,
} from "../types";
import { PERMISSION_SCOPES } from "../types";

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  onSubmit: (request: AgentUpdateRequest) => Promise<void>;
  loading?: boolean;
}

const MODEL_OPTIONS = [
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  { value: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B" },
  { value: "mistral/mistral-large", label: "Mistral Large" },
];

const STATUS_OPTIONS: { value: AgentStatus; label: string; color: string }[] = [
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "paused", label: "Paused", color: "bg-orange-500" },
  { value: "error", label: "Error", color: "bg-red-500" },
];

export function EditAgentDialog({
  open,
  onOpenChange,
  agent,
  onSubmit,
  loading = false,
}: EditAgentDialogProps) {
  // Basic info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<AgentStatus>("active");

  // Configuration
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("basic");
  
  // Account linking state - now uses API calls
  const [selectedNewAccount, setSelectedNewAccount] = useState("");
  const [newAccountScopes, setNewAccountScopes] = useState<PermissionScope[]>([]);
  const [showScopeSelector, setShowScopeSelector] = useState(false);

  const accounts = useAccountsStore((s) => s.accounts);
  const { connectAccountToAgent, disconnectAccountFromAgent, accountLinking } = useAgentStore();

  // Get connected accounts from the agent prop (real-time from server)
  const connectedAccounts: ConnectedAccountRef[] = agent?.connectedAccounts?.length
    ? agent.connectedAccounts
    : (agent?.connectedAccountIds ?? []).map((id) => ({
        accountId: id,
        grantedScopes: [],
      }));

  // Reset form when agent changes
  useEffect(() => {
    if (agent && open) {
      setName(agent.name || "");
      setDescription(agent.description || "");
      setStatus(agent.status || "active");
      setSystemPrompt(agent.systemPrompt || agent.config?.systemPrompt || "");
      setModel(agent.model || agent.config?.model || "anthropic/claude-3.5-sonnet");
      setTemperature(agent.config?.temperature ?? 0.7);
      setMaxTokens(agent.config?.maxTokens ?? 4096);
      setSelectedNewAccount("");
      setNewAccountScopes([]);
      setShowScopeSelector(false);
      setErrors({});
      setActiveTab("basic");
    }
  }, [agent, open]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!systemPrompt.trim()) {
      newErrors.systemPrompt = "System prompt is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, systemPrompt]);

  const handleSubmit = useCallback(async () => {
    if (!agent || !validate()) return;

    const config: AgentConfig = {
      temperature,
      maxTokens,
      systemPrompt: systemPrompt.trim(),
    };

    // Note: Account connections are now managed via real-time API calls
    // They are not part of the updateAgent request anymore
    const request: AgentUpdateRequest = {
      agentId: agent.id,
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      config,
    };

    await onSubmit(request);
    onOpenChange(false);
  }, [
    agent,
    name,
    description,
    status,
    systemPrompt,
    temperature,
    maxTokens,
    validate,
    onSubmit,
    onOpenChange,
  ]);

  // Handle connecting a new account
  const handleConnectAccount = useCallback(async () => {
    if (!agent || !selectedNewAccount || newAccountScopes.length === 0) return;

    const success = await connectAccountToAgent({
      agentId: agent.id,
      accountId: selectedNewAccount,
      grantedScopes: newAccountScopes,
    });

    if (success) {
      setSelectedNewAccount("");
      setNewAccountScopes([]);
      setShowScopeSelector(false);
    }
  }, [agent, selectedNewAccount, newAccountScopes, connectAccountToAgent]);

  // Handle disconnecting an account
  const handleDisconnectAccount = useCallback(async (accountId: string) => {
    if (!agent) return;

    await disconnectAccountFromAgent({
      agentId: agent.id,
      accountId,
    });
  }, [agent, disconnectAccountFromAgent]);

  // Toggle scope for new account
  const toggleNewAccountScope = useCallback((scope: PermissionScope) => {
    setNewAccountScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  }, []);

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Edit Agent
          </DialogTitle>
          <DialogDescription>
            Update agent configuration and settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="mt-0 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Agent name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this agent..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as AgentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Domain</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{agent.domain}</Badge>
                  <span className="text-xs text-muted-foreground">
                    (Cannot be changed after creation)
                  </span>
                </div>
              </div>

              {/* Workspace Context Section */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Workspace Context
                </Label>
                {agent.workspaceContext ? (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-medium">
                        {agent.workspaceContext.workspaceName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        (Use "Move to workspace" to change)
                      </span>
                    </div>
                    {agent.workspaceContext.workspaceDescription && (
                      <p className="text-sm text-muted-foreground">
                        {agent.workspaceContext.workspaceDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1">
                        <Link2 className="w-3 h-3" />
                        <code className="bg-muted px-1 rounded text-[10px]">
                          {agent.workspaceContext.workspaceId.slice(0, 8)}...
                        </code>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Assigned: {new Date(agent.workspaceContext.assignedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">No Workspace Context</span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      This agent is not linked to a workspace context. Move it to a workspace to establish context.
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <code className="bg-muted px-1 rounded">{agent.workspaceId}</code>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Prompt Tab */}
            <TabsContent value="prompt" className="mt-0 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Define your agent's personality and behavior..."
                  className={`min-h-[200px] font-mono text-sm ${
                    errors.systemPrompt ? "border-destructive" : ""
                  }`}
                />
                {errors.systemPrompt && (
                  <p className="text-xs text-destructive">{errors.systemPrompt}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {systemPrompt.length} characters
                </p>
              </div>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="config" className="mt-0 space-y-6">
              <div className="grid gap-2">
                <Label>Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={([v]) => setTemperature(v)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower values make output more focused and deterministic.
                  Higher values make output more random and creative.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>Max Tokens</Label>
                  <span className="text-sm font-mono text-muted-foreground">
                    {maxTokens.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[maxTokens]}
                  onValueChange={([v]) => setMaxTokens(v)}
                  min={256}
                  max={128000}
                  step={256}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of tokens in the response. Higher values allow
                  longer responses but cost more.
                </p>
              </div>

              {/* Agent Stats */}
              {agent.stats && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Usage Statistics</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Messages:</span>
                      <span className="ml-2 font-mono">
                        {agent.stats.totalMessages?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Tokens:</span>
                      <span className="ml-2 font-mono">
                        {agent.stats.totalTokens?.toLocaleString() || 0}
                      </span>
                    </div>
                    {agent.stats.lastActiveAt && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Last Active:</span>
                        <span className="ml-2">
                          {new Date(agent.stats.lastActiveAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="mt-0 space-y-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Connected Accounts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Link exchange accounts so this agent can access trading data and
                  perform actions. Changes are saved immediately.
                </p>

                {/* Connected Accounts List */}
                <div className="space-y-2 mt-2">
                  {connectedAccounts.length === 0 ? (
                    <div className="p-4 text-center border border-dashed rounded-lg">
                      <Wallet className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No accounts linked to this agent.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {connectedAccounts.map((ref) => {
                        const acc = accounts.find(
                          (a) =>
                            a.account.nid === ref.accountId ||
                            a.id === ref.accountId,
                        );
                        const scopes = ref.grantedScopes ?? [];
                        const groups = Array.from(
                          new Set(PERMISSION_SCOPES.map((s) => s.group)),
                        );
                        return (
                          <li
                            key={ref.accountId}
                            className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <img
                                src={getExchangeIconPath(
                                  acc?.account.exchange ?? "gate",
                                )}
                                alt=""
                                className="h-6 w-6 shrink-0 rounded object-contain"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="truncate font-mono text-sm block">
                                  {acc?.account.nid ?? ref.accountId}
                                </span>
                                {scopes.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {scopes.slice(0, 3).map((scope) => (
                                      <Badge key={scope} variant="secondary" className="text-[10px] px-1 py-0">
                                        {scope}
                                      </Badge>
                                    ))}
                                    {scopes.length > 3 && (
                                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                                        +{scopes.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Popover>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          aria-label="View permissions"
                                        >
                                          <ShieldCheck className="h-4 w-4" />
                                        </Button>
                                      </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Permissions ({scopes.length})
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <PopoverContent
                                  className="w-80"
                                  align="end"
                                  side="left"
                                >
                                  <div className="mb-2 font-medium">
                                    Permissions for{" "}
                                    <span className="font-mono text-sm">
                                      {acc?.account.nid ?? ref.accountId}
                                    </span>
                                  </div>
                                  <div className="max-h-64 space-y-3 overflow-y-auto">
                                    {groups.map((gr) => {
                                      const groupScopes = PERMISSION_SCOPES.filter(
                                        (s) => s.group === gr,
                                      );
                                      const hasAnyInGroup = groupScopes.some((s) =>
                                        scopes.includes(s.value)
                                      );
                                      if (!hasAnyInGroup) return null;
                                      return (
                                        <div key={gr}>
                                          <div className="mb-1 text-xs font-medium text-muted-foreground">
                                            {gr}
                                          </div>
                                          <div className="flex flex-wrap gap-1">
                                            {groupScopes
                                              .filter((s) => scopes.includes(s.value))
                                              .map((s) => (
                                                <Badge
                                                  key={s.value}
                                                  variant="secondary"
                                                  className="text-xs"
                                                >
                                                  {s.label}
                                                </Badge>
                                              ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                                    To change permissions, disconnect and reconnect the account.
                                  </p>
                                </PopoverContent>
                              </Popover>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => handleDisconnectAccount(ref.accountId)}
                                      disabled={accountLinking}
                                      aria-label="Disconnect"
                                    >
                                      {accountLinking ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Unlink className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Disconnect account</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Add Account Section */}
                  {(() => {
                    const linked = new Set(
                      connectedAccounts.map((c) => c.accountId),
                    );
                    const available = accounts.filter(
                      (a) =>
                        !linked.has(a.account.nid) && !linked.has(a.id),
                    );
                    
                    if (available.length === 0 && !showScopeSelector) {
                      return (
                        <p className="text-sm text-muted-foreground pt-2">
                          No more accounts to add. Add accounts in the Accounts
                          section first.
                        </p>
                      );
                    }
                    
                    return (
                      <div className="pt-3 border-t mt-3 space-y-3">
                        <Label className="text-sm font-medium">Connect New Account</Label>
                        
                        {!showScopeSelector ? (
                          <Select
                            value={selectedNewAccount}
                            onValueChange={(v) => {
                              setSelectedNewAccount(v);
                              setShowScopeSelector(true);
                              // Pre-select scopes based on agent domain
                              // For trading agents: "read" + "trade" (required for strategies)
                              setNewAccountScopes(agent.domain === "trading" ? ["read", "trade"] : ["read"]);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select an account to connect..." />
                            </SelectTrigger>
                            <SelectContent>
                              {available.map((a) => (
                                <SelectItem key={a.id} value={a.account.nid}>
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={getExchangeIconPath(a.account.exchange)}
                                      alt=""
                                      className="h-4 w-4 rounded object-contain"
                                    />
                                    {a.account.nid} ({a.account.exchange})
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const acc = accounts.find(
                                    (a) => a.account.nid === selectedNewAccount,
                                  );
                                  return acc ? (
                                    <>
                                      <img
                                        src={getExchangeIconPath(acc.account.exchange)}
                                        alt=""
                                        className="h-5 w-5 rounded object-contain"
                                      />
                                      <span className="font-mono text-sm">
                                        {acc.account.nid}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="font-mono text-sm">
                                      {selectedNewAccount}
                                    </span>
                                  );
                                })()}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowScopeSelector(false);
                                  setSelectedNewAccount("");
                                  setNewAccountScopes([]);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                            
                            <div className="space-y-3">
                              <Label className="text-xs font-medium text-muted-foreground">
                                Select Permissions
                              </Label>
                              {Array.from(
                                new Set(PERMISSION_SCOPES.map((s) => s.group)),
                              ).map((gr) => (
                                <div key={gr}>
                                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                                    {gr}
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    {PERMISSION_SCOPES.filter(
                                      (s) => s.group === gr,
                                    ).map((s) => (
                                      <label
                                        key={s.value}
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                      >
                                        <Checkbox
                                          checked={newAccountScopes.includes(s.value)}
                                          onCheckedChange={() => toggleNewAccountScope(s.value)}
                                        />
                                        {s.label}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {(newAccountScopes.includes("trade") || newAccountScopes.includes("trading:write")) && (
                              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
                                  <strong>Warning:</strong> Trade permission allows this agent to execute trades on this account.
                                </AlertDescription>
                              </Alert>
                            )}

                            <Button
                              className="w-full"
                              onClick={handleConnectAccount}
                              disabled={accountLinking || newAccountScopes.length === 0}
                            >
                              {accountLinking ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Connect with {newAccountScopes.length} permission{newAccountScopes.length !== 1 ? "s" : ""}
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
