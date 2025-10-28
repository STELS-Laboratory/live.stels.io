/**
 * Developer Guide Panel Component
 * Compact documentation-oriented step-by-step guide
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  Book,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Code,
  Copy,
  FileCode,
  RefreshCw,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/hooks/use_theme";

interface DeveloperGuidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Step {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  codeExample?: CodeExample;
}

interface Task {
  id: string;
  text: string;
  file?: string;
  line?: string;
}

interface CodeExample {
  title: string;
  language: string;
  code: string;
}

const INTEGRATION_STEPS: Step[] = [
  {
    id: "rename",
    title: "Step 1: Rename Files",
    description: "Rename template files to match your app name",
    tasks: [
      {
        id: "rename-1",
        text: "Rename template-app.tsx → your-app.tsx",
      },
      {
        id: "rename-2",
        text: "Update component name: TemplateApp → YourApp",
      },
      {
        id: "rename-3",
        text: "Update interface: TemplateAppProps → YourAppProps",
      },
      {
        id: "rename-4",
        text: "Update index.ts exports",
        file: "index.ts",
      },
    ],
    codeExample: {
      title: "index.ts",
      language: "typescript",
      code: `export { default } from "./your-app";
export type { YourAppProps } from "./your-app";
export { useYourAppStore } from "./store";
export type { YourAppData, YourAppStore } from "./types";`,
    },
  },
  {
    id: "store",
    title: "Step 2: Update Store",
    description: "Configure Zustand store for your app",
    tasks: [
      {
        id: "store-1",
        text: "Rename store name: template-app-store → your-app-store",
        file: "store.ts",
        line: "45",
      },
      {
        id: "store-2",
        text: "Update devtools name: Template App Store → Your App Store",
        file: "store.ts",
        line: "55",
      },
      {
        id: "store-3",
        text: "Update types: TemplateData → YourAppData",
        file: "types.ts",
      },
      {
        id: "store-4",
        text: "Implement your loadData() logic",
        file: "store.ts",
        line: "30-65",
      },
    ],
    codeExample: {
      title: "store.ts - Custom Logic",
      language: "typescript",
      code: `loadData: async (): Promise<void> => {
  set({ isLoading: true, error: null });
  try {
    const response = await fetch('/api/your-endpoint');
    const data = await response.json();
    set({ data, isLoading: false });
  } catch (err) {
    set({ error: err instanceof Error ? err.message : "Failed", isLoading: false });
  }
},`,
    },
  },
  {
    id: "register",
    title: "Step 3: Register in allowedRoutes",
    description: "Add your app to the routing system",
    tasks: [
      {
        id: "register-1",
        text: "Open src/stores/modules/app.store.ts",
        file: "app.store.ts",
        line: "147",
      },
      {
        id: "register-2",
        text: "Add 'your-app' to allowedRoutes array",
      },
    ],
    codeExample: {
      title: "app.store.ts (Line 147)",
      language: "typescript",
      code: `const allowedRoutes = [
  'welcome', 'canvas', 'editor', 'schemas', 'docs',
  'your-app',  // ← Add here
];`,
    },
  },
  {
    id: "devtools",
    title: "Step 4: Add to Development Tools",
    description: "Register in app tabs for quick access",
    tasks: [
      {
        id: "devtools-1",
        text: "Open src/components/main/app_tabs.tsx",
        file: "app_tabs.tsx",
      },
      {
        id: "devtools-2",
        text: "Import icon: import { YourIcon } from 'lucide-react'",
        line: "1-16",
      },
      {
        id: "devtools-3",
        text: "Add to DEV_TOOLS array (line 35-40)",
        line: "35-40",
      },
      {
        id: "devtools-4",
        text: "Choose keyboard shortcut (A-Z, unused)",
      },
    ],
    codeExample: {
      title: "app_tabs.tsx - DEV_TOOLS",
      language: "typescript",
      code: `const DEV_TOOLS: DevTool[] = [
  { key: "editor", name: "Editor", icon: Code, shortcut: "E" },
  { key: "your-app", name: "Your App", icon: BarChart3, shortcut: "A" },
];`,
    },
  },
  {
    id: "layout",
    title: "Step 5: Add to Layout Navigation",
    description: "Add sidebar navigation and app name",
    tasks: [
      {
        id: "layout-1",
        text: "Open src/apps/layout.tsx",
        file: "layout.tsx",
      },
      {
        id: "layout-2",
        text: "Import icon from lucide-react",
        line: "1-26",
      },
      {
        id: "layout-3",
        text: "Add to systemNav array (line 120-125)",
        line: "120-125",
      },
      {
        id: "layout-4",
        text: "Add friendly name in getAppName() (line 105-114)",
        line: "105-114",
      },
    ],
    codeExample: {
      title: "layout.tsx - Navigation Setup",
      language: "typescript",
      code: `const systemNav: NavItem[] = [
  { key: "your-app", label: "Your App", icon: BarChart3 },
];

const getAppName = (route: string): string => {
  const names = { "your-app": "Your App Name" };
  return names[route] || route;
};`,
    },
  },
  {
    id: "routing",
    title: "Step 6: Configure App Routing",
    description: "Add lazy loading and route handling",
    tasks: [
      {
        id: "routing-1",
        text: "Open src/App.tsx",
        file: "App.tsx",
      },
      {
        id: "routing-2",
        text: "Add lazy import after line 36",
        line: "36",
      },
      {
        id: "routing-3",
        text: "Add case in renderMainContent() after line 641",
        line: "641",
      },
    ],
    codeExample: {
      title: "App.tsx - Routing",
      language: "typescript",
      code: `const YourApp = lazy(() => import("@/apps/your-app"));

case "your-app":
  return <Suspense fallback={<div>Loading...</div>}><YourApp /></Suspense>;`,
    },
  },
  {
    id: "shortcuts",
    title: "Step 7: Add Keyboard Shortcuts",
    description: "Enable Cmd+Shift+Letter navigation",
    tasks: [
      {
        id: "shortcuts-1",
        text: "Open src/components/main/app_shortcuts.tsx",
        file: "app_shortcuts.tsx",
      },
      {
        id: "shortcuts-2",
        text: "Add shortcut handler after line 74",
        line: "74",
      },
      {
        id: "shortcuts-3",
        text: "Choose unused letter (E, C, S, D taken)",
      },
    ],
    codeExample: {
      title: "app_shortcuts.tsx",
      language: "typescript",
      code: `if (e.key === "A" || e.key === "a") {
  e.preventDefault();
  navigateTo("your-app");
}`,
    },
  },
  {
    id: "test",
    title: "Step 8: Test Integration",
    description: "Verify everything works correctly",
    tasks: [
      {
        id: "test-1",
        text: "Run npm run dev and open browser",
      },
      {
        id: "test-2",
        text: "Test sidebar navigation (desktop)",
      },
      {
        id: "test-3",
        text: "Test app tab in header",
      },
      {
        id: "test-4",
        text: "Test keyboard shortcut (⌘⇧Letter)",
      },
      {
        id: "test-5",
        text: "Test mobile warning",
      },
      {
        id: "test-6",
        text: "Test store persistence (reload)",
      },
      {
        id: "test-7",
        text: "Check console for errors",
      },
    ],
  },
];

/**
 * Developer Guide Panel - Compact documentation style
 */
export function DeveloperGuidePanel({
  isOpen,
  onClose,
}: DeveloperGuidePanelProps): React.ReactElement | null {
  const { resolvedTheme } = useTheme();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set(["rename"]),
  );
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleStep = (stepId: string): void => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const toggleTask = (taskId: string): void => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const copyCode = async (code: string, id: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getStepProgress = (step: Step): number => {
    const completed = step.tasks.filter((t) => completedTasks.has(t.id))
      .length;
    return (completed / step.tasks.length) * 100;
  };

  const getTotalProgress = (): number => {
    const totalTasks = INTEGRATION_STEPS.reduce(
      (sum, step) => sum + step.tasks.length,
      0,
    );
    return (completedTasks.size / totalTasks) * 100;
  };

  if (!isOpen) return null;

  const totalProgress = getTotalProgress();

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[92vh] flex flex-col bg-card border border-border rounded shadow-xl overflow-hidden">
        {/* Compact Header */}
        <div className="border-b border-border bg-muted/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-foreground">
              STELS App Integration Guide
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Compact Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  totalProgress === 100 ? "bg-green-500" : "bg-amber-500",
                )}
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {completedTasks.size}/{INTEGRATION_STEPS.reduce(
                (sum, step) => sum + step.tasks.length,
                0,
              )} ({Math.round(totalProgress)}%)
            </span>
          </div>
        </div>

        {/* Compact Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3 relative">
            {/* Thin vertical line */}
            <div className="absolute left-[14px] top-[18px] bottom-[18px] w-[1px] bg-border" />

            {INTEGRATION_STEPS.map((step, stepIndex) => {
              const isExpanded = expandedSteps.has(step.id);
              const progress = getStepProgress(step);
              const isComplete = progress === 100;
              const completedCount = step.tasks.filter((t) =>
                completedTasks.has(t.id)
              ).length;

              return (
                <div key={step.id} className="relative">
                  {/* Compact Step Card */}
                  <Card
                    className={cn(
                      "border transition-all duration-200 ml-10",
                      isComplete
                        ? "border-green-500/40 bg-green-500/5"
                        : isExpanded
                        ? "border-amber-500/40 bg-card"
                        : "border-border bg-card/50",
                    )}
                  >
                    {/* Compact Circle */}
                    <div className="absolute -left-10 top-3">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background transition-all",
                          isComplete
                            ? "bg-green-500 border-green-500"
                            : isExpanded
                            ? "bg-amber-500 border-amber-500"
                            : "border-border",
                        )}
                      >
                        {isComplete
                          ? <Check className="w-4 h-4 text-white" />
                          : (
                            <span
                              className={cn(
                                "text-xs font-bold",
                                isExpanded
                                  ? "text-white"
                                  : "text-muted-foreground",
                              )}
                            >
                              {stepIndex + 1}
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Compact Header */}
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                          {step.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground font-mono px-1.5 py-0.5 bg-muted rounded">
                          {completedCount}/{step.tasks.length}
                        </span>
                        {isExpanded
                          ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )
                          : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                      </div>
                    </button>

                    {/* Compact Content */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        {/* Compact Tasks */}
                        <div className="px-3 py-2 space-y-1 bg-muted/10">
                          {step.tasks.map((task) => {
                            const isTaskComplete = completedTasks.has(task.id);

                            return (
                              <label
                                key={task.id}
                                className={cn(
                                  "flex items-start gap-2 px-2 py-1.5 rounded border transition-all cursor-pointer",
                                  isTaskComplete
                                    ? "bg-green-500/10 border-green-500/30"
                                    : "bg-background border-border hover:bg-muted/50",
                                )}
                              >
                                <Checkbox
                                  checked={isTaskComplete}
                                  onCheckedChange={() => toggleTask(task.id)}
                                  className="mt-0.5 h-3.5 w-3.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={cn(
                                      "text-xs leading-snug",
                                      isTaskComplete
                                        ? "text-muted-foreground line-through"
                                        : "text-foreground",
                                    )}
                                  >
                                    {task.text}
                                  </p>
                                  {(task.file || task.line) && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      {task.file && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] px-1 py-0 h-4 bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
                                        >
                                          <FileCode className="w-2 h-2 mr-0.5" />
                                          {task.file}
                                        </Badge>
                                      )}
                                      {task.line && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] px-1 py-0 h-4 bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400"
                                        >
                                          <Terminal className="w-2 h-2 mr-0.5" />
                                          {task.line}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        {/* Compact Code Example */}
                        {step.codeExample && (
                          <div className="border-t border-border px-3 py-2 bg-background">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Code className="w-3 h-3 text-amber-500" />
                                <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">
                                  {step.codeExample.title}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  copyCode(step.codeExample!.code, step.id)}
                                className="h-6 px-1.5 gap-1"
                              >
                                {copiedCode === step.id
                                  ? (
                                    <>
                                      <Check className="w-3 h-3 text-green-500" />
                                      <span className="text-[10px]">
                                        Copied
                                      </span>
                                    </>
                                  )
                                  : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span className="text-[10px]">Copy</span>
                                    </>
                                  )}
                              </Button>
                            </div>
                            <div className="rounded border border-border overflow-hidden">
                              <SyntaxHighlighter
                                language={step.codeExample.language}
                                style={resolvedTheme === "dark"
                                  ? oneDark
                                  : oneLight}
                                customStyle={{
                                  margin: 0,
                                  padding: "8px",
                                  fontSize: "11px",
                                  lineHeight: "1.5",
                                  background: resolvedTheme === "dark"
                                    ? "#1a1a1a"
                                    : "#fafafa",
                                }}
                                wrapLongLines={true}
                              >
                                {step.codeExample.code}
                              </SyntaxHighlighter>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              );
            })}

            {/* Compact Success */}
            {totalProgress === 100 && (
              <Card className="border border-green-500/40 bg-green-500/5 ml-10">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-green-600 dark:text-green-500 mb-1">
                        🎉 Integration Complete!
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        Your app is fully integrated. Start building!
                      </p>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white"
                          onClick={onClose}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Start Building
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setCompletedTasks(new Set());
                            setExpandedSteps(new Set(["rename"]));
                          }}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compact Quick Reference */}
            <Card className="border border-blue-500/30 bg-blue-500/5 ml-10">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Book className="w-3.5 h-3.5 text-blue-500" />
                  <h4 className="text-xs font-semibold text-foreground">
                    Quick Reference
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="p-2 bg-background rounded border border-border">
                    <div className="text-[10px] font-semibold text-muted-foreground mb-1">
                      Files to Edit
                    </div>
                    <div className="text-[10px] font-mono text-foreground space-y-0.5">
                      <div>app.store.ts:147</div>
                      <div>app_tabs.tsx:35</div>
                      <div>layout.tsx:120</div>
                      <div>App.tsx:36,641</div>
                      <div>app_shortcuts.tsx:74</div>
                    </div>
                  </div>

                  <div className="p-2 bg-background rounded border border-border">
                    <div className="text-[10px] font-semibold text-muted-foreground mb-1">
                      Shortcuts
                    </div>
                    <div className="text-[10px] font-mono text-foreground space-y-0.5">
                      <div>⌘0 - Home</div>
                      <div>⌘⇧E - Editor</div>
                      <div>⌘⇧C - Canvas</div>
                      <div>⌘⇧S - Schemas</div>
                      <div>⌘⇧D - Docs</div>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 mb-0.5">
                        Important
                      </p>
                      <ul className="text-[10px] text-muted-foreground space-y-0.5">
                        <li>• Route keys must match exactly</li>
                        <li>• Choose unused keyboard shortcut</li>
                        <li>• Test on desktop and mobile</li>
                        <li>• Use Lucide icons (lucide.dev)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Compact Footer */}
        <div className="border-t border-border bg-muted/20 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded border text-xs",
                totalProgress === 100
                  ? "bg-green-500/20 border-green-500/40"
                  : "bg-muted border-border",
              )}
            >
              {totalProgress === 100
                ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                : <Zap className="w-3.5 h-3.5 text-amber-500" />}
              <span className="font-medium text-foreground">
                {totalProgress === 100
                  ? "Ready!"
                  : `${Math.round(totalProgress)}%`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-7 text-xs"
            >
              Close
            </Button>
            {totalProgress < 100 && (
              <Button
                size="sm"
                className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold"
                onClick={() => {
                  const firstIncomplete = INTEGRATION_STEPS.find(
                    (step) => getStepProgress(step) < 100,
                  );
                  if (firstIncomplete) {
                    setExpandedSteps(new Set([firstIncomplete.id]));
                  }
                }}
              >
                <Zap className="w-3 h-3 mr-1" />
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeveloperGuidePanel;
