/**
 * Create Agent Dialog Component
 * Modal for creating new AI agents
 */

import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2, Plus, FolderPlus, Rocket, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { AgentCreateRequest, AgentDomain, AgentStatus, Workspace } from "../types";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: AgentCreateRequest) => Promise<void>;
  onCreateWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  workspaces: Workspace[];
  loading?: boolean;
}

const DOMAIN_OPTIONS: { value: AgentDomain; label: string; description: string }[] = [
  {
    value: "general",
    label: "General",
    description: "General-purpose assistant for various tasks",
  },
  {
    value: "trading",
    label: "Trading",
    description: "Financial analysis and trading operations",
  },
  {
    value: "iot",
    label: "IoT",
    description: "Smart home and IoT device control",
  },
  {
    value: "drone",
    label: "Drone",
    description: "Drone operations and mission planning",
  },
  {
    value: "social",
    label: "Social",
    description: "Social media management and engagement",
  },
  {
    value: "devops",
    label: "DevOps",
    description: "CI/CD, infrastructure, and deployment automation",
  },
];

// Model options matching Gradient AI platform
const MODEL_OPTIONS = [
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  { value: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B" },
  { value: "mistral/mistral-large", label: "Mistral Large" },
];

const DEFAULT_PROMPTS: Record<AgentDomain, string> = {
  general: "You are a helpful AI assistant. Answer questions accurately and helpfully.",
  trading: "You are a trading assistant specializing in market analysis. Provide insights on market trends, analyze trading opportunities, and help with portfolio management. Always remind users that this is not financial advice.",
  iot: "You are an IoT control assistant. Help users manage their smart home devices, create automation routines, and troubleshoot device issues.",
  drone: "You are a drone operations assistant. Help with mission planning, flight safety checks, and navigation. Always prioritize safety and regulatory compliance.",
  social: "You are a social media assistant. Help create engaging content, manage posting schedules, and analyze engagement metrics.",
  devops: "You are a DevOps assistant. Help with CI/CD pipelines, infrastructure as code, container orchestration, and deployment strategies. Provide best practices for reliability and security.",
};

export function CreateAgentDialog({
  open,
  onOpenChange,
  onSubmit,
  onCreateWorkspace,
  workspaces,
  loading = false,
}: CreateAgentDialogProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState<AgentDomain>("general");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPTS.general);
  const [model, setModel] = useState("anthropic/claude-3.5-sonnet");
  const [workspaceId, setWorkspaceId] = useState("");
  const [status, setStatus] = useState<AgentStatus>("active");
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // New workspace creation state
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setDomain("general");
      setSystemPrompt(DEFAULT_PROMPTS.general);
      setModel("anthropic/claude-3-5-sonnet");
      setWorkspaceId(workspaces[0]?.id || "");
      setStatus("active");
      setAutoDeploy(true);
      setErrors({});
      setShowNewWorkspace(false);
      setNewWorkspaceName("");
    }
  }, [open, workspaces]);

  // Handle workspace creation
  const handleCreateWorkspace = useCallback(async () => {
    if (!newWorkspaceName.trim()) {
      setErrors((prev) => ({ ...prev, newWorkspace: "Workspace name is required" }));
      return;
    }

    setCreatingWorkspace(true);
    try {
      const workspace = await onCreateWorkspace(newWorkspaceName.trim());
      if (workspace) {
        setWorkspaceId(workspace.id);
        setShowNewWorkspace(false);
        setNewWorkspaceName("");
        setErrors((prev) => {
          const { newWorkspace, workspaceId, ...rest } = prev;
          return rest;
        });
      }
    } finally {
      setCreatingWorkspace(false);
    }
  }, [newWorkspaceName, onCreateWorkspace]);

  // Update prompt when domain changes
  useEffect(() => {
    setSystemPrompt(DEFAULT_PROMPTS[domain]);
  }, [domain]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    } else if (name.length > 50) {
      newErrors.name = "Name must be less than 50 characters";
    }

    if (!systemPrompt.trim()) {
      newErrors.systemPrompt = "System prompt is required";
    } else if (systemPrompt.length < 10) {
      newErrors.systemPrompt = "System prompt must be at least 10 characters";
    }

    if (!workspaceId) {
      newErrors.workspaceId = "Workspace is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, systemPrompt, workspaceId]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const request: AgentCreateRequest = {
      name: name.trim(),
      workspaceId,
      domain,
      systemPrompt: systemPrompt.trim(),
      model,
      status,
      autoDeploy,
    };

    await onSubmit(request);
    onOpenChange(false);
  }, [name, workspaceId, domain, systemPrompt, model, status, autoDeploy, validate, onSubmit, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Create New Agent
          </DialogTitle>
          <DialogDescription>
            Configure your AI agent's personality and capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="My Assistant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Workspace */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="workspace">Workspace</Label>
              {!showNewWorkspace && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setShowNewWorkspace(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New
                </Button>
              )}
            </div>
            
            {showNewWorkspace ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Workspace name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className={errors.newWorkspace ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateWorkspace}
                    disabled={creatingWorkspace}
                  >
                    {creatingWorkspace ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FolderPlus className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewWorkspace(false);
                      setNewWorkspaceName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {errors.newWorkspace && (
                  <p className="text-xs text-destructive">{errors.newWorkspace}</p>
                )}
              </div>
            ) : workspaces.length === 0 ? (
              <div className="p-3 border border-dashed border-muted-foreground/25 rounded-lg text-center">
                <FolderPlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-2">
                  No workspaces found
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewWorkspace(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Workspace
                </Button>
              </div>
            ) : (
              <>
                <Select value={workspaceId} onValueChange={setWorkspaceId}>
                  <SelectTrigger className={errors.workspaceId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces
                      .filter((ws) => ws && ws.id)
                      .map((ws) => (
                        <SelectItem key={ws.id} value={ws.id}>
                          {ws.name || "Unnamed Workspace"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.workspaceId && (
                  <p className="text-xs text-destructive">{errors.workspaceId}</p>
                )}
              </>
            )}
          </div>

          {/* Domain */}
          <div className="grid gap-2">
            <Label htmlFor="domain">Domain</Label>
            <Select value={domain} onValueChange={(v) => setDomain(v as AgentDomain)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAIN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
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

          {/* Deployment Settings */}
          <div className="grid gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="status" className="text-sm font-medium">
                  Initial Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Set the agent's operational status
                </p>
              </div>
              <Select value={status} onValueChange={(v) => setStatus(v as AgentStatus)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="paused">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      Paused
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoDeploy" className="text-sm font-medium flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Auto Deploy
                </Label>
                <p className="text-xs text-muted-foreground">
                  Deploy agent to Gradient AI after creation
                </p>
              </div>
              <Switch
                id="autoDeploy"
                checked={autoDeploy}
                onCheckedChange={setAutoDeploy}
              />
            </div>
          </div>

          {/* System Prompt */}
          <div className="grid gap-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              placeholder="Define your agent's personality and behavior..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className={`min-h-[100px] ${errors.systemPrompt ? "border-destructive" : ""}`}
            />
            {errors.systemPrompt && (
              <p className="text-xs text-destructive">{errors.systemPrompt}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {systemPrompt.length} characters
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            You can link exchange accounts after creation in Edit Agent.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Create Agent
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
