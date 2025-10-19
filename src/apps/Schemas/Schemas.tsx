/**
 * Schema Constructor Application
 * IndexedDB-based schema builder with multi-channel support
 */

import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import { UIEngineProvider } from "@/lib/gui/ui.ts";
import type { UINode } from "@/lib/gui/ui.ts";
import { Button } from "@/components/ui";
import SchemaEditor from "./SchemaEditor.tsx";
import SchemaPreview from "./SchemaPreview.tsx";
import SchemaManager from "./SchemaManager.tsx";
import MultiChannelSelector from "./MultiChannelSelector.tsx";
import SessionDataViewer from "./SessionDataViewer.tsx";
import SchemaActions from "./SchemaActions.tsx";
import CollapsibleSection from "./CollapsibleSection.tsx";
import SchemaStats from "./SchemaStats.tsx";
import SchemaHelp from "./SchemaHelp.tsx";
import NestedSchemaSelector from "./NestedSchemaSelector.tsx";
import SchemaTree from "./SchemaTree.tsx";
import ChannelAliasEditor from "./ChannelAliasEditor.tsx";
import { ToastContainer, useToast } from "./Toast.tsx";
import type { ChannelAlias, ChannelData, SchemaProject } from "./types.ts";
import {
  deleteSchema as deleteSchemaFromDB,
  getAllSchemas,
  saveSchema,
} from "./db.ts";

/**
 * Main Schema Constructor Component
 * CRUD operations with IndexedDB storage
 */
export default function Schemas(): ReactElement {
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const { toasts, showToast, closeToast } = useToast();

  // State
  const [schemas, setSchemas] = useState<SchemaProject[]>([]);
  const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null);
  const [schemaJson, setSchemaJson] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedNestedSchemas, setSelectedNestedSchemas] = useState<string[]>(
    [],
  );
  const [channelAliases, setChannelAliases] = useState<ChannelAlias[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load schemas callback
  const loadSchemas = useCallback(async (): Promise<void> => {
    try {
      const loadedSchemas = await getAllSchemas();
      setSchemas(loadedSchemas);

      // Select first schema by default
      if (loadedSchemas.length > 0 && !activeSchemaId && loadedSchemas[0]) {
        setActiveSchemaId(loadedSchemas[0].id);
      }
    } catch (error) {
      console.error("Failed to load schemas:", error);
    }
  }, [activeSchemaId]);

  // Load schemas from IndexedDB on mount
  useEffect(() => {
    loadSchemas();
  }, [loadSchemas]);

  // Get active schema
  const activeSchema = useMemo(() => {
    return schemas.find((s) => s.id === activeSchemaId) || null;
  }, [schemas, activeSchemaId]);

  // Auto-generate aliases for channels without them
  const autoGenerateAliases = useCallback(
    (channels: string[]): ChannelAlias[] => {
      const extractSymbol = (key: string): string => {
        const match = key.match(
          /\.([A-Z]{3,10})(?:\/[A-Z]{3,10}|USDT|USD|USDC)\./i,
        );
        return match?.[1]?.toLowerCase() || "";
      };

      const extractType = (key: string): string => {
        if (key.includes(".ticker.")) return "ticker";
        if (key.includes(".book.")) return "book";
        if (key.includes(".trades.")) return "trades";
        return "channel";
      };

      return channels.map((channelKey, idx) => {
        const symbol = extractSymbol(channelKey);
        const type = extractType(channelKey);
        const alias = symbol ? `${symbol}_${type}` : `${type}${idx + 1}`;

        return { channelKey, alias };
      });
    },
    [],
  );

  // Load active schema into editor
  useEffect(() => {
    if (activeSchema) {
      setSchemaJson(JSON.stringify(activeSchema.schema, null, 2));
      setSelectedChannels(activeSchema.channelKeys);
      setSelectedNestedSchemas(activeSchema.nestedSchemas || []);

      // Auto-generate aliases if not set
      const existingAliases = activeSchema.channelAliases || [];
      if (existingAliases.length === 0 && activeSchema.channelKeys.length > 0) {
        const generated = autoGenerateAliases(activeSchema.channelKeys);
        setChannelAliases(generated);
      } else {
        setChannelAliases(existingAliases);
      }
    } else {
      setSchemaJson("");
      setSelectedChannels([]);
      setSelectedNestedSchemas([]);
      setChannelAliases([]);
    }
  }, [activeSchema, autoGenerateAliases]);

  // Parse schema from JSON
  const parsedSchema = useMemo<UINode | null>(() => {
    if (!schemaJson || !isValid) return null;

    try {
      const parsed = JSON.parse(schemaJson) as UINode;
      return parsed;
    } catch {
      return null;
    }
  }, [schemaJson, isValid]);

  // Get channels data for preview - use aliases as keys (safe for interpolation)
  const channelsData = useMemo<ChannelData[]>(() => {
    if (!session || selectedChannels.length === 0) return [];

    const result: ChannelData[] = [];

    selectedChannels.forEach((channelKey) => {
      const data = session[channelKey];
      if (!data || typeof data !== "object") return;

      const dataObj = data as Record<string, unknown>;
      if (!("raw" in dataObj)) return;

      const rawData = dataObj.raw as Record<string, unknown>;
      const mergedData: Record<string, unknown> = {
        ...rawData,
        active: dataObj.active,
        timestamp: dataObj.timestamp,
      };

      // Find alias for this channel (required for data access)
      const aliasObj = channelAliases.find((a) => a.channelKey === channelKey);
      const alias = aliasObj?.alias ||
        `channel_${selectedChannels.indexOf(channelKey)}`;

      result.push({
        key: alias, // Use safe alias for data access
        data: mergedData,
      });
    });

    return result;
  }, [session, selectedChannels, channelAliases]);

  // Error message
  const errorMessage = useMemo<string | null>(() => {
    if (!isValid && validationErrors.length > 0) {
      return validationErrors[0] || "Invalid JSON";
    }
    return null;
  }, [isValid, validationErrors]);

  // Handle validation
  const handleValidation = useCallback(
    (valid: boolean, errors: string[]): void => {
      setIsValid(valid);
      setValidationErrors(errors);
    },
    [],
  );

  // Handle create schema
  const handleCreateSchema = useCallback(
    async (schema: SchemaProject): Promise<void> => {
      try {
        await saveSchema(schema);
        await loadSchemas();
        setActiveSchemaId(schema.id);
        showToast(
          "success",
          "Schema Created",
          `${schema.name} has been created successfully`,
        );
      } catch (error) {
        console.error("Failed to create schema:", error);
        showToast(
          "error",
          "Creation Failed",
          "Failed to create schema. Please try again.",
        );
      }
    },
    [loadSchemas, showToast],
  );

  // Handle update schema info
  const handleUpdateSchemaInfo = useCallback(
    async (schema: SchemaProject): Promise<void> => {
      try {
        await saveSchema(schema);
        await loadSchemas();
        showToast(
          "success",
          "Schema Updated",
          `${schema.name} information has been updated`,
        );
      } catch (error) {
        console.error("Failed to update schema:", error);
        showToast(
          "error",
          "Update Failed",
          "Failed to update schema. Please try again.",
        );
      }
    },
    [loadSchemas, showToast],
  );

  // Handle save schema content
  const handleSaveSchema = useCallback(async (): Promise<void> => {
    if (!activeSchema || !parsedSchema || !isValid) {
      showToast("warning", "Cannot Save", "Please fix schema errors first");
      return;
    }

    setIsSaving(true);
    try {
      const updatedSchema: SchemaProject = {
        ...activeSchema,
        schema: parsedSchema,
        channelKeys: selectedChannels,
        channelAliases: channelAliases,
        nestedSchemas: selectedNestedSchemas,
        updatedAt: Date.now(),
      };

      await saveSchema(updatedSchema);
      await loadSchemas();
      showToast(
        "success",
        "Schema Saved",
        `${activeSchema.name} has been saved successfully`,
      );
    } catch (error) {
      console.error("Failed to save schema:", error);
      showToast(
        "error",
        "Save Failed",
        "Failed to save schema. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    activeSchema,
    parsedSchema,
    isValid,
    selectedChannels,
    channelAliases,
    selectedNestedSchemas,
    loadSchemas,
    showToast,
  ]);

  // Handle delete schema
  const handleDeleteSchema = useCallback(
    async (id: string): Promise<void> => {
      try {
        const schemaName = schemas.find((s) => s.id === id)?.name || "Schema";
        await deleteSchemaFromDB(id);
        await loadSchemas();
        if (activeSchemaId === id) {
          setActiveSchemaId(null);
        }
        showToast(
          "success",
          "Schema Deleted",
          `${schemaName} has been removed`,
        );
      } catch (error) {
        console.error("Failed to delete schema:", error);
        showToast(
          "error",
          "Delete Failed",
          "Failed to delete schema. Please try again.",
        );
      }
    },
    [activeSchemaId, loadSchemas, schemas, showToast],
  );

  // Handle copy JSON
  const handleCopyJson = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(schemaJson);
      showToast("success", "Copied", "Schema JSON copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("error", "Copy Failed", "Failed to copy JSON to clipboard");
    }
  }, [schemaJson, showToast]);

  // Handle export
  const handleExport = useCallback((): void => {
    // Success notification handled in SchemaActions
  }, []);

  // Handle import
  const handleImport = useCallback(
    async (imported: SchemaProject): Promise<void> => {
      try {
        // Generate new ID to avoid conflicts
        const newSchema: SchemaProject = {
          ...imported,
          id: `schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await saveSchema(newSchema);
        await loadSchemas();
        setActiveSchemaId(newSchema.id);
        showToast(
          "success",
          "Schema Imported",
          `${newSchema.name} has been imported successfully`,
        );
      } catch (error) {
        console.error("Failed to import schema:", error);
        showToast(
          "error",
          "Import Failed",
          "Failed to import schema. Check the file format.",
        );
      }
    },
    [loadSchemas, showToast],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeSchema && isValid) {
          handleSaveSchema();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSchema, isValid, handleSaveSchema]);

  return (
    <UIEngineProvider>
      <ToastContainer toasts={toasts} onClose={closeToast} />
      <div className="flex flex-col h-[100%] bg-zinc-950">
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-300">
              Schema Constructor
            </span>
            <span className="text-xs text-zinc-600">•</span>
            <span className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Real Session Data Only
            </span>
          </div>

          <div className="flex-1" />

          {/* Quick Actions */}
          {activeSchema && (
            <SchemaActions
              activeSchema={activeSchema}
              schemaJson={schemaJson}
              isValid={isValid}
              onExport={handleExport}
              onImport={handleImport}
              onCopyJson={handleCopyJson}
            />
          )}

          {/* Validation status */}
          <div className="flex items-center gap-2">
            {isValid
              ? (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Valid
                </span>
              )
              : (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Invalid
                </span>
              )}
          </div>

          {/* Save button */}
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveSchema}
            disabled={!activeSchema || !isValid || isSaving}
          >
            {isSaving ? "Saving..." : "Save Schema"}
          </Button>
        </div>

        {/* Schema Manager (Tabs) */}
        <div className="flex-shrink-0 p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="space-y-3">
            <SchemaManager
              schemas={schemas}
              activeSchemaId={activeSchemaId}
              onSelectSchema={setActiveSchemaId}
              onCreateSchema={handleCreateSchema}
              onUpdateSchema={handleUpdateSchemaInfo}
              onDeleteSchema={handleDeleteSchema}
            />

            {/* Schema Stats and Tree */}
            {activeSchema && (
              <div className="space-y-2">
                <SchemaStats
                  schema={activeSchema}
                  jsonLength={schemaJson.length}
                />
                <SchemaTree schema={activeSchema} allSchemas={schemas} />
              </div>
            )}
          </div>
        </div>

        {/* Main content - split pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left pane - Editor */}
          <div className="flex flex-col w-1/2 border-r border-zinc-800">
            <div className="flex-shrink-0 p-3 border-b border-zinc-800 bg-zinc-900 space-y-2">
              {/* Dynamic schemas - channel selection */}
              {activeSchema?.type === "dynamic" && (
                <>
                  <CollapsibleSection
                    title="Channel Selection"
                    subtitle="Select data sources"
                    defaultOpen={selectedChannels.length === 0}
                    badge={selectedChannels.length}
                  >
                    <div className="p-4">
                      <MultiChannelSelector
                        selectedChannels={selectedChannels}
                        onChange={setSelectedChannels}
                      />
                    </div>
                  </CollapsibleSection>

                  {selectedChannels.length >= 1 && (
                    <CollapsibleSection
                      title="Data Access Reference"
                      subtitle="How to use channel data"
                      defaultOpen={true}
                      badge={selectedChannels.length}
                    >
                      <div className="p-4">
                        <ChannelAliasEditor
                          channelKeys={selectedChannels}
                          aliases={channelAliases}
                          onChange={setChannelAliases}
                        />
                      </div>
                    </CollapsibleSection>
                  )}
                </>
              )}

              {/* Static schemas - nested schema selection */}
              {activeSchema?.type === "static" && (
                <CollapsibleSection
                  title="Nested Schemas"
                  subtitle="Compose schemas"
                  defaultOpen={selectedNestedSchemas.length === 0}
                  badge={selectedNestedSchemas.length}
                >
                  <div className="p-4">
                    <NestedSchemaSelector
                      schemas={schemas}
                      currentSchemaId={activeSchemaId}
                      selectedSchemas={selectedNestedSchemas}
                      onChange={setSelectedNestedSchemas}
                    />
                  </div>
                </CollapsibleSection>
              )}

              {/* Help panel */}
              <SchemaHelp />
            </div>

            <div className="flex-1 relative">
              {activeSchema
                ? (
                  <SchemaEditor
                    value={schemaJson}
                    onChange={setSchemaJson}
                    onValidation={handleValidation}
                  />
                )
                : (
                  <div className="flex items-center justify-center h-full p-8">
                    <div className="text-center max-w-md">
                      <div className="text-zinc-500 text-lg mb-2">
                        No Schema Selected
                      </div>
                      <div className="text-zinc-600 text-sm mb-4">
                        Create a new schema or select an existing one from the
                        tabs above
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Validation errors */}
            {!isValid && validationErrors.length > 0 && (
              <div className="flex-shrink-0 p-3 bg-red-500/10 border-t border-red-500/20">
                <div className="text-xs text-red-400 font-mono">
                  {validationErrors.map((error, idx) => (
                    <div key={idx}>• {error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right pane - Preview */}
          <div className="flex flex-col w-1/2">
            <div className="flex-shrink-0 p-3 border-b border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-300">
                    Live Preview
                  </span>
                  {channelsData.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      {channelsData.length}{" "}
                      channel{channelsData.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {activeSchema && (
                  <span className="text-xs text-zinc-500">
                    {activeSchema.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <SchemaPreview
                schema={parsedSchema}
                channelsData={channelsData}
                error={errorMessage}
                isStaticSchema={activeSchema?.type === "static"}
              />
            </div>

            {/* Session Data Viewer - only for dynamic schemas */}
            {activeSchema?.type === "dynamic" && channelsData.length > 0 && (
              <SessionDataViewer
                channelsData={channelsData}
                channelAliases={channelAliases}
              />
            )}

            {/* Info for static schemas */}
            {activeSchema?.type === "static" && (
              <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/50 p-4">
                <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                  <div className="text-xs text-purple-400 mb-2 font-semibold">
                    📦 Static Schema (Container)
                  </div>
                  <div className="text-xs text-zinc-400">
                    This is a static container schema. It doesn't bind to
                    channels directly. Use{" "}
                    <code className="text-amber-400 font-mono">schemaRef</code>
                    {" "}
                    to nest other schemas.
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Selected nested schemas:{" "}
                    {activeSchema.nestedSchemas?.length || 0}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UIEngineProvider>
  );
}
