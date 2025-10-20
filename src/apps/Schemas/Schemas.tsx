/**
 * Schema Constructor Application
 * IndexedDB-based schema builder with multi-channel support
 */

import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSessionStoreSync from "@/hooks/use_session_store_sync.ts";
import { UIEngineProvider } from "@/lib/gui/ui.ts";
import type { UINode } from "@/lib/gui/ui.ts";
import { Button } from "@/components/ui";
import SchemaEditor from "./schema_editor";
import SchemaPreview from "./schema_preview";
import SchemaManager from "./schema_manager";
import MultiChannelSelector from "./multi_channel_selector";
import SessionDataViewer from "./session_data_viewer";
import SchemaActions from "./schema_actions";
import CollapsibleSection from "./collapsible_section";
import SchemaStats from "./schema_stats";
import SchemaHelp from "./schema_help";
import NestedSchemaSelector from "./nested_schema_selector";
import SchemaTree from "./schema_tree";
import ChannelAliasEditor from "./channel_alias_editor";
import { ToastContainer, useToast } from "../../components/ui/toast.tsx";
import type { ChannelAlias, ChannelData, SchemaProject } from "./types.ts";
import {
  deleteSchema as deleteSchemaFromDB,
  extractSchemaRefsFromNode,
  getAllSchemas,
  saveSchema,
} from "./db.ts";
import { FileJson, Plus, Upload } from "lucide-react";

/**
 * Main Schema Constructor Component
 * CRUD operations with IndexedDB storage
 */
export default function Schemas(): ReactElement {
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const { toasts, showToast, closeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [selfChannelKey, setSelfChannelKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [triggerCreateDialog, setTriggerCreateDialog] = useState(false);
  const [lastLoadedSchemaId, setLastLoadedSchemaId] = useState<string | null>(
    null,
  );

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
      // Only reload if this is a different schema (ID changed)
      const schemaIdChanged = lastLoadedSchemaId !== activeSchema.id;

      if (schemaIdChanged) {
        console.log("[Schemas] Loading new schema:", activeSchema.name);
        setSchemaJson(JSON.stringify(activeSchema.schema, null, 2));
        setSelectedChannels(activeSchema.channelKeys);
        setSelectedNestedSchemas(activeSchema.nestedSchemas || []);

        // Auto-generate aliases if not set
        const existingAliases = activeSchema.channelAliases || [];
        if (
          existingAliases.length === 0 && activeSchema.channelKeys.length > 0
        ) {
          const generated = autoGenerateAliases(activeSchema.channelKeys);
          setChannelAliases(generated);
        } else {
          setChannelAliases(existingAliases);
        }

        // Restore self channel from schema or use first channel as default
        const restoredSelfKey = activeSchema.selfChannelKey ||
          (activeSchema.channelKeys.length > 0
            ? activeSchema.channelKeys[0]
            : null);

        console.log("[Schemas] Restoring selfChannelKey:", {
          saved: activeSchema.selfChannelKey,
          restored: restoredSelfKey,
          schemaName: activeSchema.name,
        });

        setSelfChannelKey(restoredSelfKey);
        setLastLoadedSchemaId(activeSchema.id);
      } else {
        console.log("[Schemas] Same schema reloaded, preserving state");
        // Schema reloaded but ID same - preserve user's current state
        // Don't reset selfChannelKey or other fields
      }
    } else {
      setSchemaJson("");
      setSelectedChannels([]);
      setSelectedNestedSchemas([]);
      setChannelAliases([]);
      setSelfChannelKey(null);
      setLastLoadedSchemaId(null);
    }
  }, [activeSchema, autoGenerateAliases, lastLoadedSchemaId]);

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

  // Auto-detect nested schemas from schemaRef in UINode tree
  const autoDetectedSchemas = useMemo<string[]>(() => {
    if (!parsedSchema) return [];
    const refs = extractSchemaRefsFromNode(parsedSchema);
    return Array.from(refs);
  }, [parsedSchema]);

  // Get channels data for preview - use aliases as keys (safe for interpolation)
  const channelsData = useMemo<ChannelData[]>(() => {
    if (!session || selectedChannels.length === 0) return [];

    const result: ChannelData[] = [];

    // Add "self" channel if selfChannelKey is set
    const selfKey = selfChannelKey || selectedChannels[0];
    if (selfKey) {
      const selfData = session[selfKey];
      if (selfData && typeof selfData === "object") {
        const selfDataObj = selfData as Record<string, unknown>;
        if ("raw" in selfDataObj) {
          result.push({
            key: "self",
            data: selfDataObj,
          });
        }
      }
    }

    selectedChannels.forEach((channelKey) => {
      const data = session[channelKey];
      if (!data || typeof data !== "object") return;

      const dataObj = data as Record<string, unknown>;
      if (!("raw" in dataObj)) return;

      // Pass original session data structure as-is, without modifications
      const mergedData: Record<string, unknown> = dataObj;

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
  }, [session, selectedChannels, channelAliases, selfChannelKey]);

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

    console.log("[Schemas] handleSaveSchema called with current state:", {
      schemaName: activeSchema.name,
      currentSelfChannelKey: selfChannelKey,
      selectedChannels: selectedChannels,
      channelAliases: channelAliases,
    });

    setIsSaving(true);
    try {
      // Automatically extract schemaRef from UINode tree
      const schemaRefs = extractSchemaRefsFromNode(parsedSchema);
      const autoDetectedSchemas = Array.from(schemaRefs);

      // Merge auto-detected with manually selected (remove duplicates)
      const allNestedSchemas = Array.from(
        new Set([...autoDetectedSchemas, ...selectedNestedSchemas]),
      );

      const updatedSchema: SchemaProject = {
        ...activeSchema,
        schema: parsedSchema,
        channelKeys: selectedChannels,
        channelAliases: channelAliases,
        selfChannelKey: selfChannelKey,
        nestedSchemas: allNestedSchemas,
        updatedAt: Date.now(),
      };

      console.log("[Schemas] About to save schema:", {
        id: updatedSchema.id,
        name: updatedSchema.name,
        selfChannelKey: updatedSchema.selfChannelKey,
        channelKeys: updatedSchema.channelKeys,
      });

      await saveSchema(updatedSchema);

      console.log("[Schemas] Schema saved, reloading schemas...");
      await loadSchemas();

      console.log("[Schemas] Schemas reloaded");

      // Show info about auto-detected schemas
      if (autoDetectedSchemas.length > 0) {
        showToast(
          "success",
          "Schema Saved",
          `${activeSchema.name} saved with ${autoDetectedSchemas.length} auto-detected nested schema${
            autoDetectedSchemas.length > 1 ? "s" : ""
          }`,
        );
      } else {
        showToast(
          "success",
          "Schema Saved",
          `${activeSchema.name} has been saved successfully`,
        );
      }
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
    selfChannelKey,
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
  const handleExport = useCallback(
    (schemas: SchemaProject[]): void => {
      const count = schemas.length;
      if (count > 1) {
        showToast(
          "success",
          "Schemas Exported",
          `Exported ${count} schemas (${count - 1} nested dependencies)`,
        );
      } else {
        showToast("success", "Schema Exported", "Schema exported successfully");
      }
    },
    [showToast],
  );

  // Handle import
  const handleImport = useCallback(
    async (importedSchemas: SchemaProject[]): Promise<void> => {
      try {
        let mainSchemaId: string | null = null;
        let replacedCount = 0;

        // Save schemas preserving original widgetKeys
        for (const imported of importedSchemas) {
          // Check if schema with this widgetKey already exists
          const existing = schemas.find(
            (s) => s.widgetKey === imported.widgetKey,
          );

          if (existing) {
            // Replace existing schema (keep same ID)
            const updatedSchema: SchemaProject = {
              ...imported,
              id: existing.id, // Keep existing ID
              widgetKey: imported.widgetKey, // Keep original widgetKey
              createdAt: existing.createdAt, // Keep original creation date
              updatedAt: Date.now(), // Update modification date
            };

            await saveSchema(updatedSchema);
            replacedCount++;

            if (!mainSchemaId) {
              mainSchemaId = existing.id;
            }
          } else {
            // New schema - generate new ID only
            const newSchema: SchemaProject = {
              ...imported,
              id: `schema-${Date.now()}-${
                Math.random()
                  .toString(36)
                  .substr(2, 9)
              }-${Math.random().toString(36).substr(2, 5)}`,
              widgetKey: imported.widgetKey, // Keep original widgetKey!
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            await saveSchema(newSchema);

            if (!mainSchemaId) {
              mainSchemaId = newSchema.id;
            }
          }
        }

        await loadSchemas();
        if (mainSchemaId) {
          setActiveSchemaId(mainSchemaId);
        }

        const count = importedSchemas.length;
        if (replacedCount > 0) {
          showToast(
            "success",
            "Schemas Imported",
            `Imported ${count} schemas (${replacedCount} replaced existing)`,
          );
        } else if (count > 1) {
          showToast(
            "success",
            "Schemas Imported",
            `Imported ${count} schemas (${count - 1} nested dependencies)`,
          );
        } else {
          showToast(
            "success",
            "Schema Imported",
            `${importedSchemas[0].name} has been imported successfully`,
          );
        }
      } catch (error) {
        console.error("Failed to import schemas:", error);
        showToast(
          "error",
          "Import Failed",
          "Failed to import schemas. Check the file format.",
        );
      }
    },
    [loadSchemas, showToast, schemas],
  );

  // Handle import from file input
  const handleImportFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const imported = JSON.parse(content) as
            | SchemaProject
            | { version?: string; schemas: SchemaProject[] };

          let schemasToImport: SchemaProject[] = [];

          // Check format
          if (
            typeof imported === "object" &&
            "schemas" in imported &&
            Array.isArray(imported.schemas)
          ) {
            schemasToImport = imported.schemas;
          } else if (
            typeof imported === "object" &&
            "id" in imported &&
            "name" in imported &&
            "schema" in imported
          ) {
            schemasToImport = [imported as SchemaProject];
          } else {
            throw new Error("Invalid schema format");
          }

          // Validate
          for (const schema of schemasToImport) {
            if (!schema.id || !schema.name || !schema.schema) {
              throw new Error("Invalid schema structure");
            }
          }

          await handleImport(schemasToImport);
        } catch (error) {
          console.error("Import error:", error);
          showToast(
            "error",
            "Import Failed",
            "Failed to import schema. Please check the file format.",
          );
        }
      };
      reader.readAsText(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleImport, showToast],
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
              onError={(message) => showToast("error", "Error", message)}
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
              triggerCreateDialog={triggerCreateDialog}
              onCreateDialogOpen={() => setTriggerCreateDialog(false)}
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
                          selfChannelKey={selfChannelKey}
                          onSelfChannelChange={(key) => {
                            console.log(
                              "[Schemas] User changed selfChannelKey to:",
                              key,
                            );
                            setSelfChannelKey(key);
                          }}
                        />
                      </div>
                    </CollapsibleSection>
                  )}
                </>
              )}

              {/* Static schemas - nested schema selection and self channel */}
              {activeSchema?.type === "static" && (
                <>
                  <CollapsibleSection
                    title="Nested Schemas"
                    subtitle="Compose schemas"
                    defaultOpen={selectedNestedSchemas.length === 0 &&
                      autoDetectedSchemas.length === 0}
                    badge={selectedNestedSchemas.length +
                      autoDetectedSchemas.length}
                  >
                    <div className="p-4">
                      <NestedSchemaSelector
                        schemas={schemas}
                        currentSchemaId={activeSchemaId}
                        selectedSchemas={selectedNestedSchemas}
                        autoDetectedSchemas={autoDetectedSchemas}
                        onChange={setSelectedNestedSchemas}
                      />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Context Channel (self)"
                    subtitle="Override 'self' for nested schemas"
                    defaultOpen={false}
                  >
                    <div className="p-4">
                      <MultiChannelSelector
                        selectedChannels={selectedChannels}
                        onChange={setSelectedChannels}
                      />
                      {selectedChannels.length > 0 && (
                        <div className="mt-3">
                          <ChannelAliasEditor
                            channelKeys={selectedChannels}
                            aliases={[]}
                            onChange={() => {}}
                            selfChannelKey={selfChannelKey}
                            onSelfChannelChange={(key) => {
                              console.log(
                                "[Schemas] Static schema - User changed selfChannelKey to:",
                                key,
                              );
                              setSelfChannelKey(key);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                </>
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
                    <div className="text-center max-w-lg">
                      {schemas.length === 0
                        ? (
                          // Empty state - no schemas at all
                          <>
                            <div className="mb-6">
                              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800/50 border border-zinc-700 mb-4">
                                <FileJson className="w-8 h-8 text-zinc-600" />
                              </div>
                              <div className="text-zinc-400 text-xl font-semibold mb-2">
                                Welcome to Schema Constructor
                              </div>
                              <div className="text-zinc-500 text-sm mb-6">
                                Create UI schemas and bind them to real-time
                                session data.
                                <br />
                                Get started by creating your first schema or
                                importing an existing one.
                              </div>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                              <Button
                                variant="default"
                                size="lg"
                                onClick={() => setTriggerCreateDialog(true)}
                                className="flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Create First Schema
                              </Button>

                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                Import Schema
                              </Button>

                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/json,.json"
                                onChange={handleImportFile}
                                className="hidden"
                              />
                            </div>

                            <div className="mt-8 p-4 bg-blue-500/10 rounded border border-blue-500/20">
                              <div className="text-xs text-blue-400 text-left">
                                <div className="font-semibold mb-2">
                                  💡 Quick Start Tips
                                </div>
                                <ul className="space-y-1 list-disc list-inside">
                                  <li>
                                    Dynamic schemas bind to session channels
                                  </li>
                                  <li>
                                    Static schemas can compose multiple widgets
                                  </li>
                                  <li>
                                    Use aliases to access channel data in
                                    schemas
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </>
                        )
                        : (
                          // Schema exists but none selected
                          <div>
                            <div className="text-zinc-500 text-lg mb-2">
                              No Schema Selected
                            </div>
                            <div className="text-zinc-600 text-sm mb-4">
                              Select a schema from the tabs above to start
                              editing
                            </div>
                          </div>
                        )}
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

            {/* Session Data Viewer */}
            {channelsData.length > 0 && (
              <SessionDataViewer
                channelsData={channelsData}
                channelAliases={channelAliases}
                selfChannelKey={selfChannelKey}
              />
            )}

            {/* Info for static schemas without channels */}
            {activeSchema?.type === "static" && channelsData.length === 0 && (
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
                  <div className="mt-2 text-xs text-blue-400">
                    💡 Tip: Set a context channel to provide "self" for nested
                    schemas
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
