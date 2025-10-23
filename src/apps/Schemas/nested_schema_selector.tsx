/**
 * Nested Schema Selector Component
 * Select schemas to nest inside static container schemas
 */

import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { Button, Checkbox, Input } from "@/components/ui";
import { Search, X } from "lucide-react";
import type { SchemaProject } from "./types.ts";

interface NestedSchemaSelectorProps {
  schemas: SchemaProject[];
  currentSchemaId: string | null;
  selectedSchemas: string[];
  autoDetectedSchemas?: string[]; // Schemas found via schemaRef
  onChange: (widgetKeys: string[]) => void;
}

/**
 * Multi-select component for nesting schemas
 * Prevents circular references
 */
export default function NestedSchemaSelector({
  schemas,
  currentSchemaId,
  selectedSchemas,
  autoDetectedSchemas = [],
  onChange,
}: NestedSchemaSelectorProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out current schema to prevent self-reference
  const availableSchemas = useMemo(() => {
    return schemas
      .filter((s) => s.id !== currentSchemaId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [schemas, currentSchemaId]);

  // Filtered schemas based on search
  const filteredSchemas = useMemo(() => {
    if (!searchQuery) return availableSchemas;

    const query = searchQuery.toLowerCase();
    return availableSchemas.filter(
      (schema) =>
        schema.name.toLowerCase().includes(query) ||
        schema.widgetKey.toLowerCase().includes(query),
    );
  }, [availableSchemas, searchQuery]);

  // Group by type
  const groupedSchemas = useMemo(() => {
    const groups: Record<string, SchemaProject[]> = {
      static: [],
      dynamic: [],
    };

    filteredSchemas.forEach((schema) => {
      if (schema.type === "static") {
        groups.static!.push(schema);
      } else {
        groups.dynamic!.push(schema);
      }
    });

    return groups;
  }, [filteredSchemas]);

  const handleToggle = (widgetKey: string): void => {
    if (selectedSchemas.includes(widgetKey)) {
      onChange(selectedSchemas.filter((k) => k !== widgetKey));
    } else {
      onChange([...selectedSchemas, widgetKey]);
    }
  };

  const handleSelectAll = (): void => {
    onChange(availableSchemas.map((s) => s.widgetKey));
  };

  const handleClearAll = (): void => {
    onChange([]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-foreground font-semibold uppercase tracking-wide">
          Nested Schemas
        </span>
        <div className="flex items-center gap-1">
          {availableSchemas.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-5 px-1.5 text-[10px]"
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-5 px-1.5 text-[10px]"
              >
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search - compact */}
      {availableSchemas.length > 3 && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter..."
            className="pl-7 pr-7 h-6 text-[11px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {availableSchemas.length === 0
        ? (
          <div className="p-4 bg-amber-500/10 rounded border border-amber-500/20">
            <p className="text-xs text-amber-500">
              No schemas available. Create schemas first to nest them here.
            </p>
          </div>
        )
        : filteredSchemas.length === 0
        ? (
          <div className="p-4 bg-muted/50 rounded border border-border">
            <p className="text-xs text-muted-foreground">
              No schemas match "{searchQuery}"
            </p>
          </div>
        )
        : (
          <div className="max-h-60 overflow-y-auto border border-border rounded bg-card/10">
            {Object.entries(groupedSchemas).map(([type, schemasList]) => {
              if (schemasList.length === 0) return null;

              const typeColors: Record<string, string> = {
                static: "text-purple-700 dark:text-purple-400",
                dynamic: "text-blue-700 dark:text-blue-400",
              };

              const typeIcons: Record<string, string> = {
                static: "📦",
                dynamic: "📊",
              };

              return (
                <div key={type}>
                  <div className="px-2 py-1 bg-card border-b border-border">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        typeColors[type]
                      }`}
                    >
                      {typeIcons[type]} {type} ({schemasList.length})
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {schemasList.map((schema) => {
                      const isSelected = selectedSchemas.includes(
                        schema.widgetKey,
                      );
                      const isAutoDetected = autoDetectedSchemas.includes(
                        schema.widgetKey,
                      );

                      return (
                        <label
                          key={schema.id}
                          className={`flex items-center gap-2 px-2 py-1.5 transition-colors ${
                            isAutoDetected
                              ? "bg-blue-500/10 cursor-default"
                              : "hover:bg-muted/50 cursor-pointer"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected || isAutoDetected}
                            disabled={isAutoDetected}
                            onCheckedChange={() =>
                              !isAutoDetected && handleToggle(schema.widgetKey)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-foreground font-medium flex items-center gap-1.5">
                              {schema.name}
                              {isAutoDetected && (
                                <span className="text-[9px] px-1 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded uppercase font-semibold">
                                  Auto
                                </span>
                              )}
                              {schema.channelKeys.length > 0 && (
                                <span className="text-[9px] text-muted-foreground">
                                  ({schema.channelKeys.length})
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && !isAutoDetected && (
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {selectedSchemas.length}/{availableSchemas.length}
          {searchQuery && ` (${filteredSchemas.length})`}
        </span>
        <span className="flex items-center gap-1.5">
          {autoDetectedSchemas.length > 0 && (
            <span className="text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <span className="w-1 h-1 bg-blue-400 rounded-full" />
              {autoDetectedSchemas.length} auto
            </span>
          )}
          {selectedSchemas.length > 0 && (
            <span className="text-purple-700 dark:text-purple-400 flex items-center gap-1">
              <span className="w-1 h-1 bg-purple-400 rounded-full" />
              {selectedSchemas.length + autoDetectedSchemas.length}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
