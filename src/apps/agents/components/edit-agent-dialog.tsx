/**
 * Edit Agent Dialog Component
 * Modal for editing existing AI agents
 */

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Loader2,
  Save,
  Rocket,
  Settings,
  AlertTriangle,
  Folder,
  Clock,
  Link2,
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
import {
  Slider,
} from "@/components/ui/slider";
import type {
  Agent,
  AgentUpdateRequest,
  AgentDomain,
  AgentStatus,
  AgentConfig,
} from "../types";

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
  onSubmit: (request: AgentUpdateRequest) => Promise<void>;
  loading?: boolean;
}

const DOMAIN_OPTIONS: { value: AgentDomain; label: string }[] = [
  { value: "general", label: "General" },
  { value: "trading", label: "Trading" },
  { value: "iot", label: "IoT" },
  { value: "drone", label: "Drone" },
  { value: "social", label: "Social" },
  { value: "devops", label: "DevOps" },
];

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
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
