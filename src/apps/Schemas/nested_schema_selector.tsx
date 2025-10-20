/**
 * Nested Schema Selector Component
 * Select schemas to nest inside static container schemas
 */

import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { Checkbox, Input } from "@/components/ui";
import { Layers, Search, X } from "lucide-react";
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">
          Nested Schemas
        </label>
        <div className="flex items-center gap-2">
          {availableSchemas.length > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
              >
                Select All
              </button>
              <span className="text-xs text-zinc-600">•</span>
              <button
                onClick={handleClearAll}
                className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      {availableSchemas.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schemas..."
            className="pl-9 pr-9 h-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
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
          <div className="p-4 bg-zinc-800/50 rounded border border-zinc-700">
            <p className="text-xs text-zinc-500">
              No schemas match "{searchQuery}"
            </p>
          </div>
        )
        : (
          <div className="max-h-60 overflow-y-auto border border-zinc-700 rounded bg-zinc-900/50">
            {Object.entries(groupedSchemas).map(([type, schemasList]) => {
              if (schemasList.length === 0) return null;

              const typeColors: Record<string, string> = {
                static: "text-purple-400",
                dynamic: "text-blue-400",
              };

              const typeIcons: Record<string, string> = {
                static: "📦",
                dynamic: "📊",
              };

              return (
                <div key={type}>
                  <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        typeColors[type]
                      }`}
                    >
                      {typeIcons[type]} {type} ({schemasList.length})
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-800">
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
                          className={`flex items-center gap-3 p-3 transition-colors ${
                            isAutoDetected
                              ? "bg-blue-500/10 cursor-default"
                              : "hover:bg-zinc-800/50 cursor-pointer"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected || isAutoDetected}
                            disabled={isAutoDetected}
                            onCheckedChange={() =>
                              !isAutoDetected && handleToggle(schema.widgetKey)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-zinc-300 font-medium flex items-center gap-2">
                              {schema.name}
                              {isAutoDetected && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded uppercase font-semibold">
                                  Auto
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 font-mono truncate mt-0.5">
                              {schema.widgetKey}
                            </div>
                            {schema.channelKeys.length > 0 && (
                              <div className="text-xs text-zinc-600 mt-0.5">
                                {schema.channelKeys.length} channel
                                {schema.channelKeys.length !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                          {isAutoDetected
                            ? (
                              <span className="text-xs text-blue-400 flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                schemaRef
                              </span>
                            )
                            : isSelected
                            ? (
                              <span className="text-xs text-green-500 flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                Nested
                              </span>
                            )
                            : null}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <div className="flex flex-col gap-2">
        {autoDetectedSchemas.length > 0 && (
          <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
            <div className="text-xs text-blue-400 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {autoDetectedSchemas.length} auto-detected from schemaRef in UI
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            {selectedSchemas.length} manually selected
            {searchQuery && ` (${filteredSchemas.length} shown)`}
          </span>
          {selectedSchemas.length + autoDetectedSchemas.length > 0 && (
            <span className="text-purple-400 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {selectedSchemas.length + autoDetectedSchemas.length} total
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
