/**
 * Strategy Templates Application
 * Main entry point for strategy template management
 */

import { useCallback, useEffect, useState } from "react";
import Split from "react-split";
import { Zap, LayoutTemplate, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useMobile } from "@/hooks/use-mobile";
import { navigateTo } from "@/lib/router";
import { toast } from "@/stores";
import { DeveloperAccessRequestDialog } from "@/components/auth/developer-access-request";
import { useStrategyStore } from "./store";
import {
  TemplateListPanel,
  TemplateDetailsSheet,
  CreateStrategyDialog,
  StrategyListPanel,
} from "./components";
import type {
  StrategyTemplate,
  StrategyTemplateSummary,
  Strategy,
} from "./types";

const SPLIT_SIZES = [50, 50];
const SPLIT_MIN_SIZES = [400, 400];

export function StrategiesApp() {
  const mobile = useMobile();
  const { connectionSession } = useAuthStore();
  const { listTemplates, listStrategies } = useStrategyStore();

  // Local state
  const [activeTab, setActiveTab] = useState<"templates" | "strategies">("templates");
  const [selectedTemplateSummary, setSelectedTemplateSummary] = useState<StrategyTemplateSummary | null>(null);
  const [templateForCreate, setTemplateForCreate] = useState<StrategyTemplate | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!connectionSession) {
      navigateTo("/connect");
    }
  }, [connectionSession]);

  // Load data on mount
  useEffect(() => {
    if (connectionSession) {
      listTemplates();
      listStrategies();
    }
  }, [connectionSession, listTemplates, listStrategies]);

  // Handle template selection
  const handleSelectTemplate = useCallback((template: StrategyTemplateSummary) => {
    setSelectedTemplateSummary(template);
    setShowDetailsSheet(true);
  }, []);

  // Handle create strategy from template
  const handleCreateStrategy = useCallback((template: StrategyTemplate) => {
    setTemplateForCreate(template);
    setShowDetailsSheet(false);
    setShowCreateDialog(true);
  }, []);

  // Handle strategy created
  const handleStrategyCreated = useCallback(() => {
    setActiveTab("strategies");
    listStrategies();
  }, [listStrategies]);

  // Handle strategy selection
  const handleSelectStrategy = useCallback((strategy: Strategy) => {
    // Could open a strategy details view in the future
    console.log("Selected strategy:", strategy);
  }, []);

  // Handle new strategy button click
  const handleNewStrategyClick = useCallback(() => {
    const { templates } = useStrategyStore.getState();
    if (templates.length === 0) {
      toast.info("No templates available. Please wait for templates to load.");
      return;
    }
    toast.info("Select a template from the left panel to create a new strategy");
  }, []);

  if (!connectionSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please connect to continue</p>
      </div>
    );
  }

  // Mobile layout
  if (mobile) {
    return (
      <div className="flex flex-col h-full bg-background">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "templates" | "strategies")}
          className="flex flex-col h-full"
        >
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <TabsList>
              <TabsTrigger value="templates" className="gap-1.5">
                <LayoutTemplate className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="strategies" className="gap-1.5">
                <Zap className="w-4 h-4" />
                Strategies
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="templates"
            className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <TemplateListPanel onSelectTemplate={handleSelectTemplate} />
          </TabsContent>

          <TabsContent
            value="strategies"
            className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <StrategyListPanel onSelectStrategy={handleSelectStrategy} />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <TemplateDetailsSheet
          template={selectedTemplateSummary}
          open={showDetailsSheet}
          onOpenChange={setShowDetailsSheet}
          onCreateStrategy={handleCreateStrategy}
        />

        <CreateStrategyDialog
          template={templateForCreate}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleStrategyCreated}
        />

        <DeveloperAccessRequestDialog
          open={showAccessDialog}
          onOpenChange={setShowAccessDialog}
        />
      </div>
    );
  }

  // Desktop layout - split view
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Strategy Templates</h1>
            <p className="text-sm text-muted-foreground">
              Create automated trading strategies from templates
            </p>
          </div>
        </div>
        <Button className="gap-2" onClick={handleNewStrategyClick}>
          <ArrowLeft className="w-4 h-4" />
          Select Template
        </Button>
      </div>

      {/* Split Content */}
      <div className="flex-1 min-h-0">
        <Split
          className="split h-full"
          sizes={SPLIT_SIZES}
          minSize={SPLIT_MIN_SIZES}
          gutterSize={4}
          snapOffset={0}
        >
          {/* Left Panel - Templates */}
          <div className="h-full overflow-hidden border-r border-border">
            <TemplateListPanel onSelectTemplate={handleSelectTemplate} />
          </div>

          {/* Right Panel - My Strategies */}
          <div className="h-full overflow-hidden">
            <StrategyListPanel onSelectStrategy={handleSelectStrategy} />
          </div>
        </Split>
      </div>

      {/* Dialogs */}
      <TemplateDetailsSheet
        template={selectedTemplateSummary}
        open={showDetailsSheet}
        onOpenChange={setShowDetailsSheet}
        onCreateStrategy={handleCreateStrategy}
      />

      <CreateStrategyDialog
        template={templateForCreate}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleStrategyCreated}
      />

      <DeveloperAccessRequestDialog
        open={showAccessDialog}
        onOpenChange={setShowAccessDialog}
      />
    </div>
  );
}

export default StrategiesApp;
