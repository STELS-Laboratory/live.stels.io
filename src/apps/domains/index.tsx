/**
 * Domains App Component
 * Main entry point for domains and templates functionality
 */

import { useEffect, useCallback, useState } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useDomainsStore } from "./store";
import type { DomainInfo, Template, ExecuteDomainActionParams } from "./types";
import type { AgentDomain } from "../agents/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Globe,
  FileCode,
  Play,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DomainsApp() {
  const connectionSession = useAuthStore((s) => s.connectionSession);

  const {
    domains,
    templates,
    domainsLoading,
    templatesLoading,
    domainsError,
    templatesError,
    actionExecuting,
    creating,
    listDomains,
    executeDomainAction,
    listTemplates,
    createFromTemplate,
    setSelectedDomain,
    setSelectedTemplate,
  } = useDomainsStore();

  const [domainFilter, setDomainFilter] = useState<AgentDomain | "all">("all");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ domain: DomainInfo; action: string } | null>(null);
  const [selectedTemplateForCreate, setSelectedTemplateForCreate] = useState<Template | null>(null);
  const [actionParams, setActionParams] = useState<Record<string, string>>({});
  const [createName, setCreateName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  // Load domains and templates on mount
  useEffect(() => {
    if (!connectionSession) return;
    listDomains();
    listTemplates();
  }, [connectionSession, listDomains, listTemplates]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    listDomains();
    listTemplates(domainFilter !== "all" ? { domain: domainFilter } : undefined);
  }, [listDomains, listTemplates, domainFilter]);

  // Execute action
  const handleExecuteAction = useCallback(async () => {
    if (!selectedAction || !accountId) return;

    const params: ExecuteDomainActionParams = {
      domain: selectedAction.domain.name as AgentDomain,
      action: selectedAction.action,
      accountId,
      params: actionParams,
    };

    const result = await executeDomainAction(params);
    if (result) {
      setActionDialogOpen(false);
      setSelectedAction(null);
      setActionParams({});
      setAccountId("");
    }
  }, [selectedAction, accountId, actionParams, executeDomainAction]);

  // Create from template
  const handleCreateFromTemplate = useCallback(async () => {
    if (!selectedTemplateForCreate || !workspaceId) return;

    const result = await createFromTemplate({
      templateId: selectedTemplateForCreate.id,
      workspaceId,
      name: createName || undefined,
    });

    if (result) {
      setCreateDialogOpen(false);
      setSelectedTemplateForCreate(null);
      setCreateName("");
      setWorkspaceId("");
    }
  }, [selectedTemplateForCreate, workspaceId, createName, createFromTemplate]);

  // Open action dialog
  const openActionDialog = useCallback((domain: DomainInfo, action: string) => {
    setSelectedAction({ domain, action });
    setActionDialogOpen(true);
  }, []);

  // Open create dialog
  const openCreateDialog = useCallback((template: Template) => {
    setSelectedTemplateForCreate(template);
    setCreateDialogOpen(true);
  }, []);

  // Filter templates by domain (ensure templates is an array)
  const templatesList = Array.isArray(templates) ? templates : [];
  const filteredTemplates = domainFilter === "all"
    ? templatesList
    : templatesList.filter((t) => t.domain === domainFilter);

  if (!connectionSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please connect to use domains features</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domains & Templates
          </h2>
          <Select
            value={domainFilter}
            onValueChange={(v) => setDomainFilter(v as AgentDomain | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="trading">Trading</SelectItem>
              <SelectItem value="iot">IoT</SelectItem>
              <SelectItem value="drone">Drone</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="devops">DevOps</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={domainsLoading || templatesLoading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", (domainsLoading || templatesLoading) && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="domains" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="domains">
            <Globe className="h-4 w-4 mr-2" />
            Domains ({domains.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileCode className="h-4 w-4 mr-2" />
            Templates ({filteredTemplates.length})
          </TabsTrigger>
        </TabsList>

        {/* Domains Tab */}
        <TabsContent value="domains" className="flex-1 mt-4">
          {domainsError && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-4">
              <p className="text-sm text-destructive">{domainsError}</p>
            </div>
          )}

          {domainsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : domains.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No domains available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {domains.map((domain) => (
                <DomainCard
                  key={domain.name}
                  domain={domain}
                  onAction={(action) => openActionDialog(domain, action)}
                  onSelect={() => {
                    setSelectedDomain(domain);
                    // Note: getDomainInfo disabled until backend fixes parameter name
                    // Backend expects 'domainId' but OpenAPI spec says 'domain'
                    // getDomainInfo({ domain: domain.name as AgentDomain });
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="flex-1 mt-4">
          {templatesError && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-4">
              <p className="text-sm text-destructive">{templatesError}</p>
            </div>
          )}

          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onCreate={() => openCreateDialog(template)}
                  onSelect={() => setSelectedTemplate(template)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Execute Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Action</DialogTitle>
            <DialogDescription>
              Execute {selectedAction?.action} on {selectedAction?.domain.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID</Label>
              <Input
                id="accountId"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Account ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExecuteAction} disabled={!accountId || actionExecuting}>
              {actionExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create from Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create from Template</DialogTitle>
            <DialogDescription>
              Create new {selectedTemplateForCreate?.type || "resource"} from {selectedTemplateForCreate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspaceId">Workspace ID</Label>
              <Input
                id="workspaceId"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                placeholder="Workspace ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createName">Name (optional)</Label>
              <Input
                id="createName"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Custom name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFromTemplate} disabled={!workspaceId || creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DomainCardProps {
  domain: DomainInfo;
  onAction: (action: string) => void;
  onSelect: () => void;
}

function DomainCard({ domain, onAction, onSelect }: DomainCardProps) {
  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onSelect}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{domain.name}</CardTitle>
          {domain.providers && domain.providers.length > 0 && (
            <Badge variant="outline">{domain.providers.length} providers</Badge>
          )}
        </div>
        {domain.description && (
          <CardDescription className="line-clamp-2">{domain.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {domain.actions && domain.actions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {domain.actions.slice(0, 5).map((action) => (
              <Button
                key={action.name}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(action.name);
                }}
              >
                {action.name}
              </Button>
            ))}
            {domain.actions.length > 5 && (
              <Badge variant="secondary" className="h-6">
                +{domain.actions.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TemplateCardProps {
  template: Template;
  onCreate: () => void;
  onSelect: () => void;
}

function TemplateCard({ template, onCreate, onSelect }: TemplateCardProps) {
  return (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={onSelect}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <div className="flex gap-1">
            {template.type && <Badge variant="outline">{template.type}</Badge>}
            {template.domain && <Badge variant="secondary">{template.domain}</Badge>}
          </div>
        </div>
        {template.description && (
          <CardDescription className="line-clamp-2">{template.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onCreate();
          }}
        >
          <Play className="h-3 w-3 mr-1" />
          Create from Template
        </Button>
      </CardContent>
    </Card>
  );
}

export default DomainsApp;
