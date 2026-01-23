/**
 * Create Strategy Dialog Component
 * Dynamic form for creating strategies based on template configSchema
 * Aligned with OpenAPI specification
 * 
 * IMPORTANT: Strategies must be bound to an agent.
 * The agent selector ensures only accounts connected to the selected agent are available.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Play,
  Settings,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useAgentStore } from "@/apps/agents/store";
import { useStrategyStore } from "../store";
import { ConfigFieldRenderer, validateConfig, isFieldVisible } from "./config-field-renderer";
import {
  DIFFICULTY_CONFIG,
  RISK_LEVEL_CONFIG,
  initializeConfig,
  getAllFields,
  type StrategyTemplate,
  type CreateStrategyRequest,
  type ConfigExample,
  type StrategyConfigField,
} from "../types";
import type { Agent } from "@/apps/agents/types";
import { TRADE_CAPABLE_SCOPES } from "@/apps/agents/types";

interface CreateStrategyDialogProps {
  template: StrategyTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateStrategyDialog({
  template,
  open,
  onOpenChange,
  onSuccess,
}: CreateStrategyDialogProps) {
  const { connectionSession } = useAuthStore();
  const { createStrategy, strategyCreating } = useStrategyStore();
  const { agents, listAgents, agentsLoading } = useAgentStore();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [autoStart, setAutoStart] = useState(false);
  
  // Agent selection - REQUIRED for strategies
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  // Get selected agent
  const selectedAgent: Agent | undefined = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentId);
  }, [agents, selectedAgentId]);

  // Filter agents that have trade-capable accounts (for trading strategies)
  const eligibleAgents = useMemo(() => {
    if (!template) return agents;
    
    // For trading domain, filter agents with at least one account that has trade permissions
    if (template.domain === "trading") {
      return agents.filter((agent) => {
        const connectedAccounts = agent.connectedAccounts || [];
        // Agent needs at least one account with trade permission
        // TRADE_CAPABLE_SCOPES = ["trade", "trading:write"]
        return connectedAccounts.some((acc) => {
          const scopes = acc.grantedScopes || [];
          return TRADE_CAPABLE_SCOPES.some((tradeScope) => scopes.includes(tradeScope));
        });
      });
    }
    
    return agents;
  }, [agents, template]);

  // Load agents when dialog opens
  useEffect(() => {
    if (open && agents.length === 0) {
      listAgents();
    }
  }, [open, agents.length, listAgents]);

  // Initialize form when template changes
  useEffect(() => {
    if (template && open) {
      setName(`My ${template.name}`);
      setDescription("");
      setAutoStart(false);
      setSelectedAgentId("");
      setErrors({});
      setValidationErrors([]);
      setShowValidation(false);
      setShowAdvanced(false);

      // Initialize config with defaults from schema
      const initialConfig = initializeConfig(template.configSchema);
      // Also apply defaultConfig from template if provided
      if (template.defaultConfig) {
        Object.assign(initialConfig, template.defaultConfig);
      }
      setConfig(initialConfig);

      // Initialize group expansion (collapsed by default from API)
      const groupState: Record<string, boolean> = {};
      template.configSchema.groups.forEach((group) => {
        groupState[group.id] = !group.collapsed;
      });
      setExpandedGroups(groupState);
    }
  }, [template, open]);

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  // Handle group toggle
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  // Apply example configuration
  const applyExample = useCallback((example: ConfigExample) => {
    setConfig((prev) => ({ ...prev, ...example.config }));
    setErrors({});
  }, []);

  // Get all fields for validation
  const allFields = useMemo(() => {
    if (!template) return [];
    return getAllFields(template.configSchema);
  }, [template]);

  // Check if there are any advanced fields
  const hasAdvancedFields = useMemo(() => {
    return allFields.some(field => field.advanced);
  }, [allFields]);

  // Filter visible fields for a group
  const getVisibleFields = useCallback((fields: StrategyConfigField[]) => {
    return fields.filter(field => {
      // Check dependsOn condition
      if (!isFieldVisible(field, config)) return false;
      // Check advanced toggle
      if (field.advanced && !showAdvanced) return false;
      return true;
    });
  }, [config, showAdvanced]);

  // Validate form
  const validate = useCallback((): boolean => {
    if (!template) return false;

    const newErrors: Record<string, string> = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = "Strategy name is required";
    }

    // Validate agent selection
    if (!selectedAgentId) {
      newErrors.agent = "Please select an agent to run this strategy";
    }

    // Validate config fields (only visible ones)
    const visibleFields = allFields.filter(field => isFieldVisible(field, config));
    const fieldErrors = validateConfig(visibleFields, config);
    Object.assign(newErrors, fieldErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [template, name, selectedAgentId, config, allFields]);

  // Get owner ID from session
  const ownerId = useMemo(() => {
    return connectionSession?.title || connectionSession?.nid || "default";
  }, [connectionSession]);

  // Handle dry run validation
  const handleValidate = useCallback(async () => {
    if (!template || !connectionSession || !selectedAgentId) return;

    if (!validate()) {
      return;
    }

    const request: CreateStrategyRequest = {
      templateId: template.id,
      name: name.trim(),
      description: description.trim() || undefined,
      agentId: selectedAgentId,
      ownerId,
      config,
      autoStart: false,
      dryRun: true,
    };

    const response = await createStrategy(request);
    if (response) {
      setValidationErrors(response.validationErrors ?? []);
      setShowValidation(true);
    }
  }, [template, connectionSession, name, description, selectedAgentId, ownerId, config, createStrategy, validate]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!template || !connectionSession || !selectedAgentId) return;

    if (!validate()) {
      return;
    }

    const request: CreateStrategyRequest = {
      templateId: template.id,
      name: name.trim(),
      description: description.trim() || undefined,
      agentId: selectedAgentId,
      ownerId,
      config,
      autoStart,
      dryRun: false,
    };

    const response = await createStrategy(request);
    if (response && response.success) {
      onOpenChange(false);
      onSuccess?.();
    }
  }, [template, connectionSession, name, description, selectedAgentId, ownerId, config, autoStart, createStrategy, validate, onOpenChange, onSuccess]);

  if (!template) return null;

  const difficultyConfig = DIFFICULTY_CONFIG[template.difficulty];
  const riskConfig = RISK_LEVEL_CONFIG[template.riskLevel];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            {template.icon && <span className="text-3xl">{template.icon}</span>}
            <div className="flex-1">
              <DialogTitle className="text-lg">
                Create {template.name} Strategy
              </DialogTitle>
              <DialogDescription className="mt-1">
                Configure your strategy settings below
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < difficultyConfig.stars
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${riskConfig.bgColor}`} />
                  <span className={cn("text-xs", riskConfig.color)}>
                    {riskConfig.label} Risk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 pb-6 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Strategy Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.name;
                          return next;
                        });
                      }
                    }}
                    placeholder="Enter strategy name"
                    className={cn(errors.name && "border-destructive")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your strategy..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agent Selection - REQUIRED */}
            <Card className={cn(errors.agent && "border-destructive")}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Select Agent <span className="text-destructive">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Choose an agent to execute this strategy. The strategy can only use
                  accounts that are connected to this agent.
                </p>

                {agentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading agents...</span>
                  </div>
                ) : eligibleAgents.length === 0 ? (
                  <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                      {template?.domain === "trading" ? (
                        <>
                          No agents with trading-enabled accounts found. 
                          Please connect an account with trade permissions to an agent first.
                        </>
                      ) : (
                        <>
                          No agents found. Please create an agent first.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Select
                      value={selectedAgentId}
                      onValueChange={(v) => {
                        setSelectedAgentId(v);
                        if (errors.agent) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.agent;
                            return next;
                          });
                        }
                        // Clear account from config when agent changes
                        setConfig((prev) => {
                          const next = { ...prev };
                          delete next.accountId;
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger className={cn(errors.agent && "border-destructive")}>
                        <SelectValue placeholder="Select an agent..." />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleAgents.map((agent) => {
                          const accountCount = agent.connectedAccounts?.length || 0;
                          return (
                            <SelectItem key={agent.id} value={agent.id}>
                              <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-muted-foreground" />
                                <span>{agent.name}</span>
                                <Badge variant="secondary" className="text-[10px] ml-1">
                                  {accountCount} account{accountCount !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.agent && (
                      <p className="text-xs text-destructive">{errors.agent}</p>
                    )}

                    {/* Show selected agent's connected accounts */}
                    {selectedAgent && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Connected Accounts</span>
                        </div>
                        {selectedAgent.connectedAccounts && selectedAgent.connectedAccounts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedAgent.connectedAccounts.map((acc) => (
                              <Badge key={acc.accountId} variant="outline" className="text-xs">
                                {acc.accountId}
                                {acc.grantedScopes?.includes("trading:write") && (
                                  <span className="ml-1 text-amber-600">trade</span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No accounts connected to this agent.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Configuration Examples */}
            {template.documentation?.examples && template.documentation.examples.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Quick Start Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {template.documentation.examples.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => applyExample(example)}
                        className="p-3 text-left rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      >
                        <h4 className="font-medium text-sm">{example.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {example.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show Advanced Toggle */}
            {hasAdvancedFields && (
              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="gap-2 text-muted-foreground"
                >
                  {showAdvanced ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide Advanced
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show Advanced
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Configuration Groups */}
            {template.configSchema?.groups?.length > 0 ? (
              template.configSchema.groups.map((group) => {
                const visibleFields = getVisibleFields(group.fields || []);
                
                const isExpanded = expandedGroups[group.id] ?? true;

                return (
                  <Collapsible
                    key={group.id}
                    open={isExpanded}
                    onOpenChange={() => toggleGroup(group.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            {group.label}
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 ml-auto transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </CardTitle>
                          {group.description && (
                            <p className="text-xs text-muted-foreground font-normal">
                              {group.description}
                            </p>
                          )}
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          {visibleFields.length > 0 ? (
                            visibleFields.map((field) => (
                              <ConfigFieldRenderer
                                key={field.id}
                                field={field}
                                value={config[field.id]}
                                onChange={handleFieldChange}
                                allValues={config}
                                error={errors[field.id]}
                                disabled={strategyCreating}
                                selectedAgent={selectedAgent}
                              />
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic py-2">
                              Configuration fields pending backend implementation
                            </p>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <Settings className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Configuration fields not yet available from backend
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Auto Start Option */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoStart" className="cursor-pointer">
                      Auto Start Strategy
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Start the strategy immediately after creation
                    </p>
                  </div>
                  <Switch
                    id="autoStart"
                    checked={autoStart}
                    onCheckedChange={setAutoStart}
                    disabled={strategyCreating}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Validation Result */}
            {showValidation && (
              <Alert
                variant={validationErrors.length === 0 ? "default" : "destructive"}
                className={cn(
                  validationErrors.length === 0 && "border-green-500/50 bg-green-500/10"
                )}
              >
                {validationErrors.length === 0 ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <AlertTitle>
                  {validationErrors.length === 0 ? "Validation Passed" : "Validation Failed"}
                </AlertTitle>
                <AlertDescription>
                  {validationErrors.length === 0 ? (
                    <span>Your configuration is valid and ready to use.</span>
                  ) : (
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      {validationErrors.map((err, i) => (
                        <li key={i} className="text-sm">{err}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={strategyCreating}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Validate
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={strategyCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={strategyCreating}
              className="gap-2"
            >
              {strategyCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : autoStart ? (
                <Play className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {autoStart ? "Create & Start" : "Create Strategy"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
