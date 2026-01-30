/**
 * ToolRegistryPanel component
 * Left panel with MCP tools registry, search, filters, and list
 */

import {
  Search,
  X,
  Plus,
  Server,
  Globe,
  Play,
  Square,
  ArrowUp,
  ArrowDown,
  FileCode,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOL_CATEGORIES, TOOL_SCOPES } from "../ami-editor/constants";
import type { ToolRaw } from "../types/tools.types";

export interface ToolRegistryPanelProps {
  tools: ToolRaw[];
  selectedTool: ToolRaw | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filterCategory: string | null;
  filterScope: string | null;
  filterActive: boolean | null;
  sortOrder: "asc" | "desc";
  newlyCreatedToolId: string | null;
  onSearchChange: (term: string) => void;
  onFilterCategoryChange: (value: string | null) => void;
  onFilterScopeChange: (value: string | null) => void;
  onFilterActiveChange: (value: boolean | null) => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
  onSelectTool: (tool: ToolRaw) => void;
  onCreateTool: () => void;
  onRetry: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  canCreate?: boolean;
}

function filterTools(
  tools: ToolRaw[],
  searchTerm: string,
  filterCategory: string | null,
  filterScope: string | null,
  filterActive: boolean | null,
  sortOrder: "asc" | "desc",
): ToolRaw[] {
  // Filter out invalid tools (missing required fields)
  let result = tools.filter((t) => t && t.name && t.sid);

  if (searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();
    result = result.filter(
      (t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.sid && t.sid.toLowerCase().includes(q)),
    );
  }
  if (filterCategory) {
    result = result.filter((t) => t.category === filterCategory);
  }
  if (filterScope) {
    result = result.filter((t) => (t.scope || "local") === filterScope);
  }
  if (filterActive !== null) {
    result = result.filter((t) => (t.active !== false) === filterActive);
  }

  result.sort((a, b) => {
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();
    const cmp = nameA.localeCompare(nameB);
    return sortOrder === "asc" ? cmp : -cmp;
  });
  return result;
}

export function ToolRegistryPanel({
  tools,
  selectedTool,
  loading,
  error,
  searchTerm,
  filterCategory,
  filterScope,
  filterActive,
  sortOrder,
  newlyCreatedToolId,
  onSearchChange,
  onFilterCategoryChange,
  onFilterScopeChange,
  onFilterActiveChange,
  onSortOrderChange,
  onSelectTool,
  onCreateTool,
  onRetry,
  searchInputRef,
  canCreate = true,
}: ToolRegistryPanelProps) {
  const filteredTools = filterTools(
    tools,
    searchTerm,
    filterCategory,
    filterScope,
    filterActive,
    sortOrder,
  );
  const activeCount = tools.filter((t) => t.active !== false).length;
  const hasActiveFilters =
    !!searchTerm ||
    filterCategory !== null ||
    filterScope !== null ||
    filterActive !== null;

  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-transparent"
      role="complementary"
      aria-labelledby="tool-registry-header"
    >
      <div className="px-3 py-2 border-b border-[var(--editor-sidebar-border)] bg-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2
              className="text-[11px] font-semibold uppercase tracking-wider text-[var(--editor-sidebar-title)]"
              id="tool-registry-header"
            >
              MCP Tools
            </h2>
          </div>
          <TooltipProvider>
            {canCreate && (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={onCreateTool}
                    className="h-6 px-2 bg-[var(--editor-accent)] hover:opacity-90 text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="text-[10px] font-mono font-bold">NEW</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Create Tool</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>

        <div className="space-y-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              ref={searchInputRef as React.RefObject<HTMLInputElement>}
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-7 pr-7 bg-input border-border text-foreground h-6 text-[11px]"
              aria-label="Search tools by name or description"
            />
            {searchTerm && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 p-0"
                onClick={() => onSearchChange("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5 border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
                Status
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterActiveChange(null)}
                className={`h-5 px-1.5 text-[10px] ${
                  filterActive === null ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterActiveChange(true)}
                className={`h-5 px-1.5 text-[10px] ${
                  filterActive === true ? "bg-green-500/20 text-green-700 dark:text-green-600" : "text-muted-foreground"
                }`}
              >
                <Play className="w-2.5 h-2.5 mr-0.5" />
                Active
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterActiveChange(false)}
                className={`h-5 px-1.5 text-[10px] ${
                  filterActive === false ? "bg-red-500/20 text-red-700 dark:text-red-400" : "text-muted-foreground"
                }`}
              >
                <Square className="w-2.5 h-2.5 mr-0.5" />
                Inactive
              </Button>
            </div>

            <div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5 border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
                Scope
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterScopeChange(null)}
                className={`h-5 px-1.5 text-[10px] ${
                  filterScope === null ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                All
              </Button>
              {TOOL_SCOPES.map((scope) => (
                <Button
                  key={scope}
                  size="sm"
                  variant="ghost"
                  onClick={() => onFilterScopeChange(scope)}
                  className={`h-5 px-1.5 text-[10px] ${
                    filterScope === scope ? "bg-blue-500/20 text-blue-700 dark:text-blue-400" : "text-muted-foreground"
                  }`}
                >
                  {scope === "local" ? (
                    <Server className="w-2.5 h-2.5 mr-0.5" />
                  ) : (
                    <Globe className="w-2.5 h-2.5 mr-0.5" />
                  )}
                  {scope}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5 border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
                Category
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onFilterCategoryChange(null)}
                className={`h-5 px-1.5 text-[10px] ${
                  filterCategory === null ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                All
              </Button>
              {TOOL_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant="ghost"
                  onClick={() => onFilterCategoryChange(cat)}
                  className={`h-5 px-1.5 text-[10px] capitalize ${
                    filterCategory === cat ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                  }`}
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
              className="h-6 px-2 text-[10px] text-muted-foreground"
              title={sortOrder === "asc" ? "A–Z" : "Z–A"}
            >
              {sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            </Button>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px]"
                onClick={() => {
                  onSearchChange("");
                  onFilterCategoryChange(null);
                  onFilterScopeChange(null);
                  onFilterActiveChange(null);
                }}
              >
                <X className="w-3 h-3 mr-0.5" />
                Clear
              </Button>
            )}
            <span className="text-[10px] text-[var(--editor-sidebar-foreground)] bg-[var(--editor-tab-inactive)] px-1.5 py-0.5 rounded font-mono">
              {filteredTools.length}/{tools.length}
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto" role="list" aria-label="Tools list">
        <div className="py-1">
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 flex-1 max-w-[200px]" />
                  </div>
                  <Skeleton className="h-3 w-32 ml-5 mt-0.5" />
                </div>
              ))}
            </div>
          ) : error && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <AlertCircle className="w-8 h-8 text-red-500 mb-3" aria-hidden />
              <p className="text-sm text-red-500 dark:text-red-400 mb-3 text-center">{error}</p>
              <Button onClick={onRetry} size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="w-3 h-3" />
                Retry
              </Button>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <FileCode className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">No tools found</h3>
              <p className="text-xs text-muted-foreground text-center max-w-xs mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters or search terms"
                  : "Create your first MCP tool to get started"}
              </p>
              {!hasActiveFilters && canCreate && (
                <Button
                  onClick={onCreateTool}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create Tool
                </Button>
              )}
            </div>
          ) : (
            filteredTools.map((tool) => (
              <div
                key={tool.sid}
                role="listitem"
                aria-selected={selectedTool?.sid === tool.sid}
                className={`group flex flex-col px-2 py-1.5 cursor-pointer transition-all duration-200 ${
                  selectedTool?.sid === tool.sid
                    ? "bg-[var(--editor-accent)]/15 border-l-2 border-[var(--editor-accent)]"
                    : newlyCreatedToolId === tool.sid
                      ? "bg-green-500/10 animate-pulse border-l-2 border-green-500"
                      : "hover:bg-[var(--editor-sidebar)]/80 hover:border-l-2 hover:border-[var(--editor-sidebar-border)]"
                }`}
                onClick={() => onSelectTool(tool)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTool(tool);
                  }
                }}
                tabIndex={0}
              >
                <div className="flex items-center gap-1.5">
                  <FileCode
                    className={`w-4 h-4 shrink-0 ${
                      selectedTool?.sid === tool.sid
                        ? "text-[var(--editor-accent)]"
                        : tool.active !== false
                          ? "text-[var(--editor-sidebar-foreground)]"
                          : "text-[var(--editor-sidebar-foreground)]/60"
                    }`}
                  />
                  <span
                    className={`font-mono text-[11px] font-semibold truncate flex-1 ${
                      selectedTool?.sid === tool.sid
                        ? "text-[var(--editor-sidebar-title)]"
                        : "text-[var(--editor-sidebar-foreground)]"
                    }`}
                  >
                    {tool.name}
                  </span>
                  {tool.category && (
                    <span className="text-[9px] text-muted-foreground capitalize">{tool.category}</span>
                  )}
                </div>
                {tool.description && (
                  <p className="ml-5 mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                    {tool.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="px-2 py-1 border-t border-[var(--editor-sidebar-border)] bg-transparent">
        <div className="flex items-center justify-between text-[9px] font-mono text-[var(--editor-sidebar-foreground)]/80">
          <span>{filteredTools.length} items</span>
          <span className="text-green-700 dark:text-green-600">
            {activeCount} active
          </span>
        </div>
      </div>
    </div>
  );
}
