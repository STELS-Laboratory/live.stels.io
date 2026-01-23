/**
 * Template List Panel Component
 * Displays a grid of strategy templates with filtering
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Star,
  AlertTriangle,
  Loader2,
  LayoutGrid,
  List,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useStrategyStore } from "../store";
import {
  DIFFICULTY_CONFIG,
  RISK_LEVEL_CONFIG,
  type StrategyTemplateSummary,
  type StrategyDifficulty,
  type StrategyRiskLevel,
} from "../types";

interface TemplateListPanelProps {
  onSelectTemplate: (template: StrategyTemplateSummary) => void;
}

export function TemplateListPanel({ onSelectTemplate }: TemplateListPanelProps) {
  const {
    templates,
    templatesLoading,
    templatesError,
    filters,
    listTemplates,
    setFilters,
    clearFilters,
  } = useStrategyStore();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Load templates on mount
  useEffect(() => {
    listTemplates();
  }, [listTemplates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.domain) {
      result = result.filter((t) => t.domain === filters.domain);
    }
    if (filters.difficulty) {
      result = result.filter((t) => t.difficulty === filters.difficulty);
    }
    if (filters.riskLevel) {
      result = result.filter((t) => t.riskLevel === filters.riskLevel);
    }

    return result;
  }, [templates, searchQuery, filters]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    listTemplates();
  }, [listTemplates]);

  // Check if any filters are active
  const hasActiveFilters = filters.domain || filters.difficulty || filters.riskLevel;

  // Count active filters
  const activeFilterCount = [
    filters.domain,
    filters.difficulty,
    filters.riskLevel,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold">Strategy Templates</h2>
          <p className="text-sm text-muted-foreground">
            {filteredTemplates.length} of {templates.length} templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={templatesLoading}
          >
            <RefreshCw
              className={cn("w-4 h-4", templatesLoading && "animate-spin")}
            />
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-border flex-shrink-0 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={hasActiveFilters ? "secondary" : "outline"}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto py-1 px-2 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Domain</label>
                    <Select
                      value={filters.domain || "all"}
                      onValueChange={(v) =>
                        setFilters({ domain: v === "all" ? undefined : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All domains" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All domains</SelectItem>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="iot">IoT</SelectItem>
                        <SelectItem value="drone">Drone</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Difficulty</label>
                    <Select
                      value={filters.difficulty || "all"}
                      onValueChange={(v) =>
                        setFilters({
                          difficulty:
                            v === "all" ? undefined : (v as StrategyDifficulty),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All difficulties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All difficulties</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Risk Level</label>
                    <Select
                      value={filters.riskLevel || "all"}
                      onValueChange={(v) =>
                        setFilters({
                          riskLevel:
                            v === "all" ? undefined : (v as StrategyRiskLevel),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All risk levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All risk levels</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="very_high">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {templatesLoading && templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Loading templates...</p>
            </div>
          ) : templatesError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
              <p className="text-sm text-destructive">{templatesError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh}>
                Try again
              </Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No templates found</p>
              {(searchQuery || hasActiveFilters) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSearchQuery("");
                    clearFilters();
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => onSelectTemplate(template)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <TemplateListItem
                  key={template.id}
                  template={template}
                  onClick={() => onSelectTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Template Card Component
// ============================================================================

interface TemplateCardProps {
  template: StrategyTemplateSummary;
  onClick: () => void;
}

function TemplateCard({ template, onClick }: TemplateCardProps) {
  const difficultyConfig = DIFFICULTY_CONFIG[template.difficulty];
  const riskConfig = RISK_LEVEL_CONFIG[template.riskLevel];

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {template.icon && (
              <span className="text-2xl">{template.icon}</span>
            )}
            <div>
              <h3 className="font-semibold leading-tight">{template.name}</h3>
              <Badge variant="outline" className="mt-1 text-xs">
                {template.domain}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>

        {/* Difficulty and Risk */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Difficulty:</span>
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
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Risk:</span>
            <span className={`w-2 h-2 rounded-full ${riskConfig.bgColor}`} />
            <span className={riskConfig.color}>{riskConfig.label}</span>
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Template List Item Component
// ============================================================================

interface TemplateListItemProps {
  template: StrategyTemplateSummary;
  onClick: () => void;
}

function TemplateListItem({ template, onClick }: TemplateListItemProps) {
  const difficultyConfig = DIFFICULTY_CONFIG[template.difficulty];
  const riskConfig = RISK_LEVEL_CONFIG[template.riskLevel];

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {template.icon && (
            <span className="text-xl flex-shrink-0">{template.icon}</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{template.name}</h3>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {template.domain}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {template.description}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-xs">
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
            <span className={`w-2 h-2 rounded-full ${riskConfig.bgColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
