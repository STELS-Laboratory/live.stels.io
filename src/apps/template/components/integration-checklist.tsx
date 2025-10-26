/**
 * Integration Checklist Component
 * Visual checklist for tracking app integration progress
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  FileCode,
  Keyboard,
  Layout,
  RefreshCw,
  Rocket,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  file: string;
  detail?: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Rename Files
  {
    id: "rename-1",
    category: "rename",
    task: "Rename template-app.tsx to your-app.tsx",
    file: "template-app.tsx",
  },
  {
    id: "rename-2",
    category: "rename",
    task: "Update component name: TemplateApp → YourApp",
    file: "your-app.tsx",
  },
  {
    id: "rename-3",
    category: "rename",
    task: "Update interface: TemplateAppProps → YourAppProps",
    file: "your-app.tsx",
  },
  {
    id: "rename-4",
    category: "rename",
    task: "Update index.ts exports",
    file: "index.ts",
  },
  {
    id: "rename-5",
    category: "rename",
    task: "Update store name and types",
    file: "store.ts",
  },

  // System Registration
  {
    id: "register-1",
    category: "register",
    task: "Add to allowedRoutes array",
    file: "app.store.ts",
    detail: "Line 147",
  },
  {
    id: "register-2",
    category: "register",
    task: "Add to DEV_TOOLS array",
    file: "app_tabs.tsx",
    detail: "Line 35-40",
  },
  {
    id: "register-3",
    category: "register",
    task: "Add to systemNav array",
    file: "layout.tsx",
    detail: "Line 120-125",
  },
  {
    id: "register-4",
    category: "register",
    task: "Add friendly name in getAppName()",
    file: "layout.tsx",
    detail: "Line 105-114",
  },

  // Routing
  {
    id: "routing-1",
    category: "routing",
    task: "Add lazy import",
    file: "App.tsx",
    detail: "After line 36",
  },
  {
    id: "routing-2",
    category: "routing",
    task: "Add case in renderMainContent()",
    file: "App.tsx",
    detail: "After line 641",
  },
  {
    id: "routing-3",
    category: "routing",
    task: "Import Lucide icon",
    file: "app_tabs.tsx, layout.tsx",
  },

  // Keyboard Shortcuts
  {
    id: "shortcuts-1",
    category: "shortcuts",
    task: "Add keyboard shortcut handler",
    file: "app_shortcuts.tsx",
    detail: "After line 74",
  },
  {
    id: "shortcuts-2",
    category: "shortcuts",
    task: "Choose unused letter (A-Z)",
    file: "app_shortcuts.tsx",
    detail: "E, C, S, D taken",
  },

  // Testing
  {
    id: "test-1",
    category: "test",
    task: "Test sidebar navigation (desktop)",
    file: "Browser",
  },
  {
    id: "test-2",
    category: "test",
    task: "Test app tabs in header",
    file: "Browser",
  },
  {
    id: "test-3",
    category: "test",
    task: "Test keyboard shortcut (⌘⇧Letter)",
    file: "Browser",
  },
  {
    id: "test-4",
    category: "test",
    task: "Verify mobile warning displays",
    file: "Mobile Browser",
  },
  {
    id: "test-5",
    category: "test",
    task: "Test store persistence (reload page)",
    file: "Browser",
  },
  {
    id: "test-6",
    category: "test",
    task: "Check console for errors",
    file: "DevTools",
  },
];

const CATEGORY_INFO = {
  rename: {
    title: "Rename Files",
    icon: FileCode,
    color: "blue",
  },
  register: {
    title: "System Registration",
    icon: Layout,
    color: "purple",
  },
  routing: {
    title: "Configure Routing",
    icon: Terminal,
    color: "amber",
  },
  shortcuts: {
    title: "Keyboard Shortcuts",
    icon: Keyboard,
    color: "green",
  },
  test: {
    title: "Testing",
    icon: Rocket,
    color: "orange",
  },
};

export interface IntegrationChecklistProps {
  className?: string;
}

/**
 * Visual checklist for tracking integration progress
 */
export function IntegrationChecklist({
  className,
}: IntegrationChecklistProps): React.ReactElement {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggleItem = (id: string): void => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resetProgress = (): void => {
    setCompleted(new Set());
  };

  const categories = Array.from(
    new Set(CHECKLIST_ITEMS.map((item) => item.category)),
  );

  const getCategoryProgress = (category: string): number => {
    const categoryItems = CHECKLIST_ITEMS.filter(
      (item) => item.category === category,
    );
    const completedItems = categoryItems.filter((item) =>
      completed.has(item.id)
    );
    return (completedItems.length / categoryItems.length) * 100;
  };

  const totalProgress = (completed.size / CHECKLIST_ITEMS.length) * 100;

  const isComplete = totalProgress === 100;

  const getColorClasses = (
    color: string,
  ): { bg: string; border: string; text: string } => {
    const colors: Record<string, { bg: string; border: string; text: string }> =
      {
        blue: {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          text: "text-blue-700 dark:text-blue-400",
        },
        purple: {
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
          text: "text-purple-700 dark:text-purple-400",
        },
        amber: {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-700 dark:text-amber-400",
        },
        green: {
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          text: "text-green-700 dark:text-green-600",
        },
        orange: {
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          text: "text-orange-700 dark:text-orange-400",
        },
      };
    return (
      colors[color] || {
        bg: "bg-muted",
        border: "border-border",
        text: "text-foreground",
      }
    );
  };

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle
              className={cn(
                "w-5 h-5",
                isComplete ? "text-green-500" : "text-amber-500",
              )}
            />
            Integration Checklist
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono",
                isComplete
                  ? "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-600"
                  : "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-400",
              )}
            >
              {completed.size}/{CHECKLIST_ITEMS.length} ({Math.round(
                totalProgress,
              )}%)
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetProgress}
              className="h-7 px-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-3">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                isComplete
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-amber-500 to-blue-500",
              )}
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {categories.map((category) => {
          const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
          const Icon = info.icon;
          const colors = getColorClasses(info.color);
          const items = CHECKLIST_ITEMS.filter(
            (item) => item.category === category,
          );
          const categoryProgress = getCategoryProgress(category);
          const isCategoryComplete = categoryProgress === 100;

          return (
            <div
              key={category}
              className={cn(
                "p-3 rounded border transition-all",
                isCategoryComplete
                  ? "bg-green-500/5 border-green-500/30"
                  : `${colors.bg} ${colors.border}`,
              )}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isCategoryComplete ? "text-green-500" : colors.text,
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isCategoryComplete
                        ? "text-green-700 dark:text-green-600"
                        : colors.text,
                    )}
                  >
                    {info.title}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    isCategoryComplete
                      ? "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-600"
                      : `${colors.bg} ${colors.border} ${colors.text}`,
                  )}
                >
                  {items.filter((i) => completed.has(i.id)).length}/{items
                    .length}
                </Badge>
              </div>

              {/* Category Progress */}
              <div className="h-1 bg-muted/50 rounded-full overflow-hidden mb-3">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    isCategoryComplete ? "bg-green-500" : "bg-amber-500",
                  )}
                  style={{ width: `${categoryProgress}%` }}
                />
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {items.map((item) => {
                  const isItemComplete = completed.has(item.id);

                  return (
                    <label
                      key={item.id}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded transition-all cursor-pointer",
                        isItemComplete
                          ? "bg-green-500/10 hover:bg-green-500/15"
                          : "bg-background/50 hover:bg-muted/50",
                      )}
                    >
                      <Checkbox
                        checked={isItemComplete}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs",
                            isItemComplete
                              ? "text-green-700 dark:text-green-600 line-through"
                              : "text-foreground",
                          )}
                        >
                          {item.task}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {item.file}
                          </span>
                          {item.detail && (
                            <span className="text-[10px] text-muted-foreground">
                              • {item.detail}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Success Message */}
        {isComplete && (
          <div className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded border border-green-500/40">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-green-700 dark:text-green-600 mb-1">
                  🎉 Integration Complete!
                </h4>
                <p className="text-xs text-muted-foreground">
                  Your app is ready! Start building your features and test
                  thoroughly before deployment.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IntegrationChecklist;
