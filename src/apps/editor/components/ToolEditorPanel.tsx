/**
 * ToolEditorPanel component
 * Right panel for editing MCP tool with tabs: Code | Config | Schema
 */

import { lazy, Suspense, useState } from "react";
import { FileCode, Code, Settings, Braces, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ToolRaw } from "../types/tools.types";

const MonacoEditor = lazy(() => import("@/components/editor/monaco-editor"));

export interface ToolEditorPanelProps {
  tool: ToolRaw | null;
  name: string;
  description: string;
  script: string;
  inputSchemaJson: string;
  outputSchemaJson: string;
  category: string;
  scope: string;
  timeout: number;
  active: boolean;
  validationError: string | null;
  saving: boolean;
  loading?: boolean;
  hasUnsavedChanges?: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onScriptChange: (value: string | undefined) => void;
  onInputSchemaChange: (value: string) => void;
  onOutputSchemaChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onScopeChange: (value: string) => void;
  onTimeoutChange: (value: number) => void;
  onActiveChange: (value: boolean) => void;
  onSave: () => void;
  onReset: () => void;
  onDelete?: () => void;
  onCallTool?: () => void;
  /** When false, Save and Reset are disabled (developer view-only) */
  canEdit?: boolean;
}

export function ToolEditorPanel({
  tool,
  name,
  description,
  script,
  inputSchemaJson,
  outputSchemaJson,
  category,
  scope,
  timeout,
  active,
  validationError,
  saving,
  loading = false,
  hasUnsavedChanges = false,
  onNameChange,
  onDescriptionChange,
  onScriptChange,
  onInputSchemaChange,
  onOutputSchemaChange,
  onCategoryChange,
  onScopeChange,
  onTimeoutChange,
  onActiveChange,
  onSave,
  onReset,
  onDelete,
  onCallTool,
  canEdit = true,
}: ToolEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("code");

  if (!tool) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background text-muted-foreground p-8">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <FileCode className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium">Select a tool</p>
        <p className="text-xs mt-1">Choose a tool from the list or create a new one</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background text-muted-foreground p-8">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-border border-t-amber-500 rounded-full animate-spin" />
          <Loader2 className="w-6 h-6 text-amber-700 dark:text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm font-medium">Loading tool...</p>
        <p className="text-xs mt-1">Fetching script and schema</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--editor-main)]">
      <div className="px-4 py-2 border-b border-[var(--editor-tab-border)] bg-[var(--editor-tab-bar)] flex items-center justify-between shrink-0 min-h-[40px]">
        <h2 className="text-[13px] font-medium text-[var(--editor-main-foreground)] flex items-center gap-2">
          {tool.name}
          {hasUnsavedChanges && (
            <span
              className="w-2 h-2 rounded-full bg-[var(--editor-accent)] animate-pulse"
              title="Unsaved changes"
              aria-label="Unsaved changes"
            />
          )}
        </h2>
        <div className="flex items-center gap-2">
          {onCallTool && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCallTool}
              className="text-xs h-7 px-2"
            >
              Test run
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onReset}
            disabled={!canEdit}
            className="text-xs h-7 px-2"
          >
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSave}
            disabled={saving || !canEdit}
            className="text-xs h-7 px-2 bg-[var(--editor-accent)] hover:opacity-90 text-white font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-xs h-7 px-2 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      {validationError && (
        <div className="px-4 py-2 bg-red-500/10 text-red-700 dark:text-red-400 text-xs shrink-0">
          {validationError}
        </div>
      )}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="bg-[var(--editor-tab-bar)] border-b border-[var(--editor-tab-border)] px-1 py-0 flex items-end min-h-[35px] shrink-0">
          <TabsList className="bg-transparent p-0 h-full gap-0 rounded-none border-0 flex">
            <TabsTrigger
              value="code"
              className="text-[12px] h-[35px] px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--editor-accent)] data-[state=active]:bg-[var(--editor-tab-active)] data-[state=active]:text-[var(--editor-tab-active-foreground)] text-[var(--editor-sidebar-foreground)] hover:bg-[var(--editor-tab-inactive)]"
            >
              <Code className="w-3.5 h-3.5 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="text-[12px] h-[35px] px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--editor-accent)] data-[state=active]:bg-[var(--editor-tab-active)] data-[state=active]:text-[var(--editor-tab-active-foreground)] text-[var(--editor-sidebar-foreground)] hover:bg-[var(--editor-tab-inactive)]"
            >
              <Settings className="w-3.5 h-3.5 mr-2" />
              Config
            </TabsTrigger>
            <TabsTrigger
              value="schema"
              className="text-[12px] h-[35px] px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--editor-accent)] data-[state=active]:bg-[var(--editor-tab-active)] data-[state=active]:text-[var(--editor-tab-active-foreground)] text-[var(--editor-sidebar-foreground)] hover:bg-[var(--editor-tab-inactive)]"
            >
              <Braces className="w-3.5 h-3.5 mr-2" />
              Schema
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="code" className="flex-1 m-0 p-0 min-h-0">
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center bg-background">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-border border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-muted-foreground text-xs font-mono">Loading editor...</p>
                </div>
              </div>
            }
          >
            <div className="h-full min-h-[200px]">
              <MonacoEditor
                key={`script-${tool.sid}`}
                script={script}
                handleEditorChange={onScriptChange}
              />
            </div>
          </Suspense>
        </TabsContent>

        <TabsContent value="config" className="flex-1 m-0 overflow-auto">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-input text-sm font-mono"
                placeholder="tool-name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-input text-sm min-h-[60px]"
                placeholder="Tool description for LLM"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-input text-sm"
              >
                <option value="trading">trading</option>
                <option value="analysis">analysis</option>
                <option value="notification">notification</option>
                <option value="data">data</option>
                <option value="utility">utility</option>
                <option value="custom">custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Scope</label>
              <select
                value={scope}
                onChange={(e) => onScopeChange(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-input text-sm"
              >
                <option value="local">local</option>
                <option value="network">network</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Timeout (ms)</label>
              <input
                type="number"
                min={1000}
                max={300000}
                value={timeout}
                onChange={(e) => onTimeoutChange(Number(e.target.value) || 30000)}
                className="w-full px-3 py-2 rounded border border-border bg-input text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tool-active"
                checked={active}
                onChange={(e) => onActiveChange(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="tool-active" className="text-xs">Active</label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="flex-1 m-0 p-0 min-h-0 flex flex-col">
          <div className="flex-1 flex flex-col min-h-0 p-2">
            <div className="flex-1 min-h-0 flex flex-col mb-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1 shrink-0">Input schema (JSON)</label>
              <div className="flex-1 min-h-[120px] border border-border rounded overflow-hidden">
                <Suspense
                  fallback={
                    <div className="h-full flex items-center justify-center bg-muted/30">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <MonacoEditor
                    key={`input-schema-${tool.sid}`}
                    script={inputSchemaJson}
                    handleEditorChange={(v) => onInputSchemaChange(v ?? "{}")}
                  />
                </Suspense>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="block text-xs font-medium text-muted-foreground mb-1 shrink-0">Output schema (JSON, optional)</label>
              <div className="flex-1 min-h-[100px] border border-border rounded overflow-hidden">
                <Suspense
                  fallback={
                    <div className="h-full flex items-center justify-center bg-muted/30">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <MonacoEditor
                    key={`output-schema-${tool.sid}`}
                    script={outputSchemaJson}
                    handleEditorChange={(v) => onOutputSchemaChange(v ?? "{}")}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
