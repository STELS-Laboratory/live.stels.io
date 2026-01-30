/**
 * CodeEditorPanel component
 * Right panel with code editor, config, prompts, and logs tabs
 */

import { lazy, Suspense, useState } from "react";
import {
  Code,
  Settings,
  FileText,
  Terminal,
  Crown,
  Save,
  RotateCcw,
  Undo,
  Redo,
  AlignJustify,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorHeader } from "./editor-header";
import { ConfigForm } from "./config-form";
import { PromptsEditor } from "./prompts-editor";
import { WorkerLogsPanel } from "../ami-editor/worker-logs-panel";
import { LeaderInfoCard } from "../ami-editor/leader-info-card";
import type { CodeEditorPanelProps } from "../types/editor.types.ts";
import type { LeaderInfo } from "@/types/apps/editor/types";

// Lazy load Monaco Editor
const MonacoEditor = lazy(() => import("@/components/editor/monaco-editor"));

/**
 * CodeEditorPanel component
 */
export function CodeEditorPanel({
  worker,
  script,
  note,
  config,
  isEditingScript,
  isEditingNote,
  isEditingConfig,
  validationError,
  saving,
  activeTab,
  onScriptChange,
  onNoteChange,
  onConfigChange,
  onTabChange,
  onSave,
  onReset,
  onFormatCodeReady,
  onUndoRedoReady,
  onToggle,
  onMigrate,
  getLeaderInfo,
}: CodeEditorPanelProps & {
  onToggle: () => void;
  onMigrate?: () => void;
  getLeaderInfo?: (workerId: string) => Promise<LeaderInfo | null>;
}) {
  // Hooks must be called before any early returns
  const [formatCodeFnState, setFormatCodeFnState] = useState<(() => void) | null>(null);
  const [undoFnState, setUndoFnState] = useState<(() => void) | null>(null);
  const [redoFnState, setRedoFnState] = useState<(() => void) | null>(null);

  if (!worker || !worker.value || !worker.value.raw) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--editor-main)]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded flex items-center justify-center mb-6 mx-auto bg-[var(--editor-tab-bar)]">
            <Code className="w-10 h-10 text-[var(--editor-sidebar-foreground)]" />
          </div>
          <h3 className="text-[var(--editor-main-foreground)] font-semibold text-lg mb-2">
            Code Editor
          </h3>
          <p className="text-[var(--editor-sidebar-foreground)] text-sm mb-6">
            Select a protocol from the registry to start editing
          </p>
          <div className="px-4 py-2 rounded inline-block bg-[var(--editor-tab-inactive)]">
            <div className="text-xs text-[var(--editor-sidebar-foreground)] font-mono flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              Ready for development
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasUnsavedChanges = isEditingScript || isEditingNote || isEditingConfig;

  return (
    <div className="h-full flex flex-col bg-[var(--editor-main)]">
      {/* Editor Header - VS Code title bar */}
      <EditorHeader
        worker={worker}
        isEditing={isEditingScript}
        isEditingNote={isEditingNote}
        isEditingConfig={isEditingConfig}
        toggling={false}
        saving={saving}
        activeTab={activeTab}
        formatCodeFn={null}
        undoFn={null}
        redoFn={null}
        onToggle={onToggle}
        onMigrate={onMigrate}
        onSave={onSave}
        onReset={onReset}
      />

      {/* Tabs Navigation & Content */}
      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className="flex-1 flex flex-col min-h-0 p-0 m-0 gap-0"
      >
        <div className="bg-[var(--editor-tab-bar)] border-b border-[var(--editor-tab-border)] px-1 py-0 flex items-end min-h-[35px]">
          <div className="flex items-center justify-between w-full">
            <TabsList className="bg-transparent p-0 h-full gap-0 rounded-none border-0 flex items-end">
              <TabsTrigger
                value="code"
                className="text-[12px] h-[35px] px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--editor-accent)] data-[state=active]:bg-[var(--editor-tab-active)] data-[state=active]:text-[var(--editor-tab-active-foreground)] text-[var(--editor-sidebar-foreground)] hover:bg-[var(--editor-tab-inactive)] transition-colors"
                title="Code Editor (⌘1)"
              >
                <Code className="w-3.5 h-3.5 mr-2" />
                Code
              </TabsTrigger>
              <TabsTrigger
                value="config"
                className="text-[12px] h-[35px] px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--editor-accent)] data-[state=active]:bg-[var(--editor-tab-active)] data-[state=active]:text-[var(--editor-tab-active-foreground)] text-[var(--editor-sidebar-foreground)] hover:bg-[var(--editor-tab-inactive)] transition-colors"
                title="Configuration (⌘2)"
              >
                <Settings className="w-3.5 h-3.5 mr-2" />
                Config
              </TabsTrigger>
              <TabsTrigger
                value="prompts"
                className="text-[12px] h-[35px] px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--editor-accent)] data-[state=active]:bg-[var(--editor-tab-active)] data-[state=active]:text-[var(--editor-tab-active-foreground)] text-[var(--editor-sidebar-foreground)] hover:bg-[var(--editor-tab-inactive)] transition-colors"
                title="Prompts (⌘3)"
              >
                <FileText className="w-3.5 h-3.5 mr-2" />
                Prompts
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="text-[12px] h-[35px] px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--editor-accent)] data-[state=active]:bg-[var(--editor-tab-active)] data-[state=active]:text-[var(--editor-tab-active-foreground)] text-[var(--editor-sidebar-foreground)] hover:bg-[var(--editor-tab-inactive)] transition-colors"
                title="Logs (⌘4)"
              >
                <Terminal className="w-3.5 h-3.5 mr-2" />
                Logs
              </TabsTrigger>
              {worker?.value?.raw?.executionMode === "leader" && (
                <TabsTrigger
                  value="leader"
                  className="text-[12px] h-[35px] px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--editor-accent)] data-[state=active]:bg-[var(--editor-tab-active)] text-[var(--editor-sidebar-foreground)] hover:bg-[var(--editor-tab-inactive)]"
                >
                  <Crown className="w-3.5 h-3.5 mr-2" />
                  Leader
                </TabsTrigger>
              )}
            </TabsList>

            <TooltipProvider>
              <div className="flex items-center gap-1">
                {/* Undo/Redo buttons */}
                {activeTab === "code" && undoFnState && (
                  <>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => undoFnState?.()}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-700 dark:text-amber-400 transition-all duration-200 hover:scale-110 hover:bg-amber-500/10"
                        >
                          <Undo className="w-3 h-3 transition-transform duration-200 hover:-translate-x-0.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Undo (⌘Z)</TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => redoFnState?.()}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-700 dark:text-amber-400 transition-all duration-200 hover:scale-110 hover:bg-amber-500/10 disabled:opacity-30"
                          disabled={!redoFnState}
                        >
                          <Redo className="w-3 h-3 transition-transform duration-200 hover:translate-x-0.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Redo (⌘⇧Z)</TooltipContent>
                    </Tooltip>
                  </>
                )}

                {/* Format button */}
                {activeTab === "code" && formatCodeFnState && (
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => formatCodeFnState?.()}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-700 dark:text-blue-400 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10"
                      >
                        <AlignJustify className="w-3 h-3 transition-transform duration-200 hover:rotate-90" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Format Code (Prettify)
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Save and Reset buttons */}
                {hasUnsavedChanges && (
                  <>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={onReset}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-700 dark:text-amber-400"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Revert Changes</TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={onSave}
                          size="sm"
                          className="h-6 px-2 bg-[var(--editor-accent)] hover:opacity-90 text-white"
                          disabled={saving}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          <span className="text-[10px] font-bold">SAVE</span>
                          <kbd className="ml-1 px-1 py-0.5 text-[9px] bg-muted/50 rounded border border-border/50">
                            ⌘S
                          </kbd>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Save All (⌘S)</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </TooltipProvider>
          </div>
        </div>

        {/* Tab: Code */}
        <TabsContent value="code" className="flex-1 m-0 p-0 min-h-0">
          <Suspense
            fallback={
              <div className="h-full bg-background flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-border border-t-amber-500 rounded-full animate-spin mx-auto mb-3">
                  </div>
                  <p className="text-muted-foreground text-xs font-mono">
                    Loading Editor...
                  </p>
                </div>
              </div>
            }
          >
            <MonacoEditor
              key={worker?.value?.raw?.sid || "no-worker"}
              script={script}
              handleEditorChange={onScriptChange}
              onEditorReady={(formatFn) => {
                setFormatCodeFnState(() => formatFn);
                onFormatCodeReady(formatFn);
              }}
              onUndoRedoReady={(undo, redo) => {
                setUndoFnState(() => undo);
                setRedoFnState(() => redo);
                onUndoRedoReady(undo, redo);
              }}
            />
          </Suspense>
        </TabsContent>

        {/* Tab: Configuration */}
        <TabsContent
          value="config"
          className="flex-1 m-0 p-2 overflow-y-auto bg-surface"
        >
          <ConfigForm
            config={config}
            validationError={validationError}
            onChange={onConfigChange}
            onReset={onReset}
            onMigrateClick={onMigrate}
          />
        </TabsContent>

        {/* Tab: Prompts */}
        <TabsContent value="prompts" className="flex-1 m-0 p-2">
          <PromptsEditor
            value={note}
            onChange={onNoteChange}
            isEditing={isEditingNote}
          />
        </TabsContent>

        {/* Tab: Logs */}
        <TabsContent value="logs" className="flex-1 m-0 p-0 min-h-0 gap-0">
          {worker?.value?.raw?.sid && (
            <WorkerLogsPanel workerId={worker.value.raw.sid} />
          )}
        </TabsContent>

        {/* Tab: Leader Info */}
        {worker?.value?.raw?.executionMode === "leader" && (
          <TabsContent
            value="leader"
            className="flex-1 m-0 p-2 overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto">
              {worker?.value?.raw?.sid && (
                <LeaderInfoCard
                  workerId={worker.value.raw.sid}
                  onRefresh={getLeaderInfo}
                />
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

