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
import CollapsibleSection from "./collapsible_section";
import SchemaStats from "./schema_stats";
import SchemaHelp from "./schema_help";
import NestedSchemaSelector from "./nested_schema_selector";
import SchemaTree from "./schema_tree";
import ChannelAliasEditor from "./channel_alias_editor";
import { ToastContainer, useToast } from "../../components/ui/toast.tsx";
import type { ChannelAlias, ChannelData, SchemaProject } from "./types.ts";
import {
  collectNestedSchemasForExport,
  deleteSchema as deleteSchemaFromDB,
  extractSchemaRefsFromNode,
  getAllSchemas,
  saveSchema,
} from "./db.ts";
import {
  Book,
  Copy,
  Download,
  FileJson,
  Plus,
  Save,
  Upload,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
      <div className="flex flex-col h-[100%] overflow-y-scroll bg-background">
        {/* Toolbar - Compact with API Reference */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
          <span className="text-xs font-semibold text-foreground">
            Schema Constructor
          </span>
          <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
            Live
          </span>

          <div className="flex-1" />

          <TooltipProvider>
            <div className="flex items-center gap-1">
              {/* API Reference Button */}
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsHelpOpen(!isHelpOpen)}
                    className={`h-7 w-7 p-0 ${
                      isHelpOpen
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                        : ""
                    }`}
                  >
                    <Book className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">API Reference</TooltipContent>
              </Tooltip>

              {/* Validation status */}
              {isValid
                ? (
                  <span
                    className="w-2 h-2 bg-green-500 rounded-full mx-1"
                    title="Valid JSON"
                  />
                )
                : (
                  <span
                    className="w-2 h-2 bg-red-500 rounded-full animate-pulse mx-1"
                    title="Invalid JSON"
                  />
                )}

              {activeSchema && (
                <>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyJson}
                        disabled={!schemaJson}
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Copy JSON</TooltipContent>
                  </Tooltip>

                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!activeSchema) return;
                          try {
                            const allSchemas =
                              await collectNestedSchemasForExport(
                                activeSchema.widgetKey,
                              );
                            const exportData = {
                              version: "1.0",
                              exportedAt: new Date().toISOString(),
                              mainSchema: activeSchema.widgetKey,
                              schemas: allSchemas,
                            };
                            const dataStr = JSON.stringify(exportData, null, 2);
                            const dataBlob = new Blob([dataStr], {
                              type: "application/json",
                            });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement("a");
                            link.href = url;
                            const schemaCount = allSchemas.length;
                            const suffix = schemaCount > 1
                              ? `+${schemaCount - 1}-nested`
                              : "";
                            link.download = `schema-${
                              activeSchema.name.toLowerCase().replace(
                                /\s+/g,
                                "-",
                              )
                            }${suffix}.json`;
                            link.click();
                            URL.revokeObjectURL(url);
                            handleExport(allSchemas);
                          } catch (error) {
                            console.error("Failed to export:", error);
                            showToast(
                              "error",
                              "Error",
                              "Failed to export schema",
                            );
                          }
                        }}
                        disabled={!activeSchema || !isValid}
                        className="h-7 w-7 p-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Export Schema</TooltipContent>
                  </Tooltip>

                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 w-7 p-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Import Schema</TooltipContent>
                  </Tooltip>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportFile}
                    className="hidden"
                  />

                  <div className="w-px h-4 bg-border mx-0.5" />

                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isSaving ? "ghost" : "default"}
                        size="sm"
                        onClick={handleSaveSchema}
                        disabled={!activeSchema || !isValid || isSaving}
                        className="h-7 px-2"
                      >
                        {isSaving
                          ? (
                            <>
                              <div className="w-3 h-3 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-1.5" />
                              <span className="text-xs">Saving</span>
                            </>
                          )
                          : (
                            <>
                              <Save className="w-3.5 h-3.5 mr-1.5" />
                              <span className="text-xs">Save</span>
                              <kbd className="ml-1.5 px-1 py-0.5 text-[10px] bg-background/50 rounded border border-border">
                                ⌘S
                              </kbd>
                            </>
                          )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Save Schema (⌘S)
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </TooltipProvider>
        </div>

        {/* Schema Manager (Tabs) */}
        <div className="flex-shrink-0 p-2 border-b border-border bg-card/50">
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

            {/* Schema Stats and Tree - compact */}
            {activeSchema && (
              <div className="space-y-1.5">
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
          <div className="flex flex-col w-1/2 border-r border-border">
            <div className="flex-shrink-0 p-2 border-b border-border bg-card space-y-1">
              {/* Dynamic schemas - channel selection */}
              {activeSchema?.type === "dynamic" && (
                <>
                  <CollapsibleSection
                    title="Channel Selection"
                    subtitle="Select data sources"
                    defaultOpen={selectedChannels.length === 0}
                    badge={selectedChannels.length}
                  >
                    <div className="p-2">
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
                      <div className="p-2">
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
                    <div className="p-2">
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
                    <div className="p-2">
                      <MultiChannelSelector
                        selectedChannels={selectedChannels}
                        onChange={setSelectedChannels}
                      />
                      {selectedChannels.length > 0 && (
                        <div className="mt-2">
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

              {/* Help sidebar trigger removed - now in top toolbar */}
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
                              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 border border-border mb-4">
                                <FileJson className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <div className="text-foreground text-xl font-semibold mb-2">
                                Welcome to Schema Constructor
                              </div>
                              <div className="text-muted-foreground text-sm mb-6">
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
                              <div className="text-xs text-blue-700 dark:text-blue-400 text-left">
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
                            <div className="text-muted-foreground text-lg mb-2">
                              No Schema Selected
                            </div>
                            <div className="text-muted-foreground text-sm mb-4">
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
              <div className="flex-shrink-0 p-3 bg-red-500/10 border-t border-red-500/30 rounded-b">
                <div className="text-xs text-red-700 dark:text-red-400 font-mono">
                  {validationErrors.map((error, idx) => (
                    <div key={idx}>• {error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right pane - Preview Only */}
          <div className="flex flex-col w-1/2">
            <div className="flex-1 overflow-hidden">
              <SchemaPreview
                schema={parsedSchema}
                channelsData={channelsData}
                error={errorMessage}
                isStaticSchema={activeSchema?.type === "static"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* API Reference Sidebar */}
      <SchemaHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </UIEngineProvider>
  );
}
