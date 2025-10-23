/**
 * STELS Application Hub
 * Development laboratory for building and launching autonomous AI web agents
 */

import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UIEngineProvider, UIRenderer } from "@/lib/gui/ui.ts";
import type { UINode } from "@/lib/gui/ui.ts";
import { getAllSchemas, getSchemaByWidgetKey } from "@/apps/schemas/db.ts";
import type { SchemaProject } from "@/apps/schemas/types.ts";
import useSessionStoreSync from "@/hooks/use_session_store_sync.ts";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Calendar,
  Code,
  FileText,
  Layers,
  Layout as LayoutIcon,
  Package,
  Play,
} from "lucide-react";
import { navigateTo } from "@/lib/router.ts";
import {
  collectRequiredChannels,
  resolveSchemaRefs,
} from "@/lib/gui/schema-resolver.ts";
import ErrorBoundary from "@/apps/schemas/error_boundary";
import AppLauncher from "@/components/main/app_launcher";
import { useOpenAppsStore } from "@/stores/modules/open_apps.ts";
import { useRestoreOpenApps } from "@/hooks/use_restore_open_apps.ts";

/**
 * STELS Application Hub - Build and launch autonomous AI web agents
 */
function Welcome(): ReactElement {
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const [schemas, setSchemas] = useState<SchemaProject[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<SchemaProject | null>(
    null,
  );
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [resolvedSchema, setResolvedSchema] = useState<UINode | null>(null);
  const [requiredChannelAliases, setRequiredChannelAliases] = useState<
    Array<{ channelKey: string; alias: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [launchStep, setLaunchStep] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const openApp = useOpenAppsStore((state) => state.openApp);
  const apps = useOpenAppsStore((state) => state.apps);
  const activeAppId = useOpenAppsStore((state) => state.activeAppId);

  // Restore open apps from previous session
  useRestoreOpenApps();

  // Auto-open active app on mount or when activeAppId changes
  useEffect(() => {
    // Skip if activeAppId is empty or null (user wants hub view)
    if (!activeAppId || activeAppId === "") {
      // Clear any currently open app
      if (selectedAppId) {
        console.log("[Welcome] Clearing active app, returning to hub");
        setSelectedSchema(null);
        setSelectedAppId(null);
        setResolvedSchema(null);
        setRequiredChannelAliases([]);
      }
      return;
    }

    const activeApp = apps.find((app) => app.id === activeAppId);

    // If there's an active app and it's not currently selected, open it
    if (activeApp && selectedAppId !== activeAppId && !isLaunching) {
      const schema = schemas.find((s) => s.id === activeApp.schemaId);
      if (schema) {
        console.log("[Welcome] Auto-opening active app:", schema.name);

        // Open app immediately without launcher animation
        const openAppImmediately = async (): Promise<void> => {
          try {
            const schemaStore = {
              getSchemaByWidgetKey: async (widgetKey: string) => {
                const project = await getSchemaByWidgetKey(widgetKey);
                if (!project) return null;
                return {
                  schema: project.schema,
                  channelKeys: project.channelKeys,
                  channelAliases: project.channelAliases,
                };
              },
            };

            const resolved = await resolveSchemaRefs(
              schema.schema,
              schemaStore,
            );
            const requiredChannels = await collectRequiredChannels(
              schema.schema,
              schemaStore,
            );

            setResolvedSchema(resolved);
            setRequiredChannelAliases(requiredChannels);
            setSelectedSchema(schema);
            setSelectedAppId(activeAppId);
          } catch (error) {
            console.error("[Welcome] Failed to auto-open app:", error);
          }
        };

        openAppImmediately();
      }
    }
  }, [activeAppId, apps, schemas, selectedAppId, isLaunching]);

  // Watch for app closure from tabs - if current app is closed, return to hub
  useEffect(() => {
    if (!selectedAppId) return;

    // Check if current app still exists
    const appExists = apps.some((app) => app.id === selectedAppId);

    if (!appExists) {
      // App was closed from tab - close it here too
      console.log("[Welcome] App closed from tab, returning to hub");
      setSelectedSchema(null);
      setSelectedAppId(null);
      setResolvedSchema(null);
      setRequiredChannelAliases([]);
    }
  }, [apps, selectedAppId]);

  // Load all schemas from IndexedDB
  useEffect(() => {
    const loadSchemas = async (): Promise<void> => {
      try {
        const allSchemas = await getAllSchemas();
        setSchemas(allSchemas);
      } catch (error) {
        console.error("Failed to load schemas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchemas();
  }, []);

  // Filter static router schemas
  const routerSchemas = useMemo(() => {
    return schemas.filter(
      (schema) =>
        schema.type === "static" &&
        (schema.widgetKey.includes(".router") ||
          schema.widgetKey.includes(".app.") ||
          schema.widgetKey.includes(".apps.")),
    );
  }, [schemas]);

  // Handle launch app with progress tracking
  const handleLaunchApp = useCallback(
    async (schema: SchemaProject): Promise<void> => {
      // Start launch animation
      setIsLaunching(true);
      setLaunchStep(0);

      // Step 0: Initializing
      await new Promise((resolve) => setTimeout(resolve, 300));
      setLaunchStep(1);

      try {
        // Step 1: Resolving schema
        const schemaStore = {
          getSchemaByWidgetKey: async (widgetKey: string) => {
            const project = await getSchemaByWidgetKey(widgetKey);
            if (!project) return null;

            return {
              schema: project.schema,
              channelKeys: project.channelKeys,
              channelAliases: project.channelAliases,
            };
          },
        };

        const resolved = await resolveSchemaRefs(schema.schema, schemaStore);
        setLaunchStep(2);

        // Step 2: Loading channels
        await new Promise((resolve) => setTimeout(resolve, 200));
        const requiredChannels = await collectRequiredChannels(
          schema.schema,
          schemaStore,
        );
        setLaunchStep(3);

        // Step 3: Preparing data
        await new Promise((resolve) => setTimeout(resolve, 200));
        setResolvedSchema(resolved);
        setRequiredChannelAliases(requiredChannels);
        setLaunchStep(4);

        // Step 4: Rendering UI
        await new Promise((resolve) => setTimeout(resolve, 300));
        setLaunchStep(5);

        // Step 5: Ready! - Register app in store
        await new Promise((resolve) => setTimeout(resolve, 200));
        const appId = openApp(schema);
        setSelectedSchema(schema);
        setSelectedAppId(appId); // Track app ID for closure sync

        // Hide launcher
        setTimeout(() => {
          setIsLaunching(false);
          setLaunchStep(0);
        }, 300);
      } catch (error) {
        console.error("Failed to launch app:", error);
        setResolvedSchema(schema.schema);
        setRequiredChannelAliases([]);
        setIsLaunching(false);
        setLaunchStep(0);
      }
    },
    [openApp],
  );

  // Prepare merged data reactively when session updates
  const mergedData = useMemo<Record<string, unknown>>(() => {
    if (!session || !selectedSchema) return {};

    const data: Record<string, unknown> = {};

    // 1. Add "self" using selfChannelKey from schema (set by developer)
    if (
      selectedSchema.selfChannelKey && session[selectedSchema.selfChannelKey]
    ) {
      data["self"] = session[selectedSchema.selfChannelKey];
    } else if (
      selectedSchema.channelKeys &&
      selectedSchema.channelKeys.length > 0 &&
      session[selectedSchema.channelKeys[0]]
    ) {
      // Fallback: use first channel from schema
      data["self"] = session[selectedSchema.channelKeys[0]];
    }

    // 2. Add schema's own channels with their aliases
    if (
      selectedSchema.channelAliases && selectedSchema.channelAliases.length > 0
    ) {
      selectedSchema.channelAliases.forEach(
        ({ channelKey, alias }: { channelKey: string; alias: string }) => {
          const sessionData = session[channelKey];
          if (!sessionData || typeof sessionData !== "object") return;

          const dataObj = sessionData as Record<string, unknown>;
          if (!("raw" in dataObj)) return;

          data[alias] = dataObj;
        },
      );
    }

    // 3. Add nested channels with their aliases
    requiredChannelAliases.forEach(({ channelKey, alias }) => {
      // Skip if this alias already exists (avoid duplicates)
      if (data[alias]) return;

      const sessionData = session[channelKey];
      if (!sessionData || typeof sessionData !== "object") return;

      const dataObj = sessionData as Record<string, unknown>;
      if (!("raw" in dataObj)) return;

      // Pass original session data structure as-is, without modifications
      data[alias] = dataObj;
    });

    return data;
  }, [session, requiredChannelAliases, selectedSchema]);

  // If app is launching, show launcher
  if (isLaunching && selectedSchema) {
    return (
      <AppLauncher
        appName={selectedSchema.name}
        appType={selectedSchema.type}
        currentStep={launchStep}
      />
    );
  }

  // If app is selected, render full-screen
  if (selectedSchema) {
    return (
      <UIEngineProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-background overflow-hidden"
        >
          {/* Render app */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full overflow-auto"
          >
            <ErrorBoundary>
              {resolvedSchema
                ? <UIRenderer schema={resolvedSchema} data={mergedData} />
                : (
                  <div className="flex items-center justify-center h-full">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted-foreground"
                    >
                      Loading app...
                    </motion.div>
                  </div>
                )}
            </ErrorBoundary>
          </motion.div>
        </motion.div>
      </UIEngineProvider>
    );
  }

  // Store view
  return (
    <UIEngineProvider>
      <div className="min-h-screen bg-background p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-foreground">
              STELS Application Hub
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Developer laboratory for Web 5: Build and launch autonomous AI web
            agents using schemas and protocols
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
            <div className="text-muted-foreground">Loading apps...</div>
          </div>
        )}

        {/* System Apps - Always visible */}
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <span>Development Tools</span>
            <span className="text-sm text-muted-foreground font-normal">
              Build Autonomous Web Agents
            </span>
          </h2>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.04,
                },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Canvas */}
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigateTo("canvas")}
              className="group bg-card rounded border border-border overflow-hidden hover:border-blue-500/50 transition-colors duration-200 text-left"
            >
              <div className="aspect-video bg-blue-500/5 border-b border-border flex items-center justify-center">
                <Boxes className="icon-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Visual Workspace
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Compose agent workflows with drag-and-drop interface
                </p>
                <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 font-semibold">
                  Open Canvas <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.button>

            {/* Editor */}
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigateTo("editor")}
              className="group bg-card rounded border border-border overflow-hidden hover:border-amber-500/50 transition-colors duration-200 text-left"
            >
              <div className="aspect-video bg-amber-500/5 border-b border-border flex items-center justify-center">
                <Code className="icon-2xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Protocol Editor
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Write and deploy workers across the heterogeneous network
                </p>
                <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                  Open Editor <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.button>

            {/* Schemas */}
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigateTo("schemas")}
              className="group bg-card rounded border border-border overflow-hidden hover:border-green-500/50 transition-colors duration-200 text-left"
            >
              <div className="aspect-video bg-green-500/5 border-b border-border flex items-center justify-center">
                <LayoutIcon className="icon-2xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Schema Manager
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Define data structures and channels for your web agents
                </p>
                <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-semibold">
                  Open Manager <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.button>

            {/* Documentation */}
            <motion.button
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigateTo("docs")}
              className="group bg-card rounded border border-border overflow-hidden hover:border-zinc-500/50 transition-colors duration-200 text-left"
            >
              <div className="aspect-video bg-zinc-500/5 border-b border-border flex items-center justify-center">
                <FileText className="icon-2xl text-zinc-600 dark:text-zinc-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Documentation
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Platform overview, updates, and technical documentation
                </p>
                <div className="flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-400 font-semibold">
                  Open Docs <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.button>
          </motion.div>
        </div>

        {/* User Apps from Schema Store */}
        {!isLoading && routerSchemas.length === 0 && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Your Web Agents
            </h2>
            <div className="p-12 bg-card rounded border border-dashed border-border text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Custom Agents Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Use Schema Manager to define data structures for your autonomous
                web agents
              </p>
              <button
                onClick={() => navigateTo("schemas")}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded transition-colors inline-flex items-center gap-2"
              >
                <LayoutIcon className="w-5 h-5" />
                Create First Agent
              </button>
              <p className="text-xs text-muted-foreground mt-4">
                Tip: Create a schema with type "static" and widgetKey containing
                "app"
              </p>
            </div>
          </div>
        )}

        {/* User Apps Grid */}
        {!isLoading && routerSchemas.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Your Web Agents
            </h2>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {routerSchemas.map((schema) => (
                <motion.div
                  key={schema.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    },
                  }}
                >
                  <AppCard
                    schema={schema}
                    session={session}
                    onLaunch={handleLaunchApp}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </UIEngineProvider>
  );
}

/**
 * App Card Component
 */
interface AppCardProps {
  schema: SchemaProject;
  session: Record<string, unknown> | null;
  onLaunch: (schema: SchemaProject) => Promise<void>;
}

function AppCard({ schema, session, onLaunch }: AppCardProps): ReactElement {
  const [previewSchema, setPreviewSchema] = useState<UINode | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>>({});
  const [isLaunchingLocal, setIsLaunchingLocal] = useState(false);
  const apps = useOpenAppsStore((state) => state.apps);

  // Check if app is already running
  const runningApp = apps.find((app) => app.schemaId === schema.id);
  const isRunning = !!runningApp;

  // Resolve schema and collect data for preview
  useEffect(() => {
    const resolvePreview = async (): Promise<void> => {
      try {
        const schemaStore = {
          getSchemaByWidgetKey: async (widgetKey: string) => {
            const project = await getSchemaByWidgetKey(widgetKey);
            if (!project) return null;
            return {
              schema: project.schema,
              channelKeys: project.channelKeys,
              channelAliases: project.channelAliases,
            };
          },
        };

        // 1. Resolve schema
        const resolved = await resolveSchemaRefs(schema.schema, schemaStore);

        // 2. Collect required channels
        const requiredChannels = await collectRequiredChannels(
          schema.schema,
          schemaStore,
        );

        // 3. Prepare data with aliases
        const data: Record<string, unknown> = {};

        // 3.1 Add "self" using selfChannelKey from schema (set by developer)
        if (schema.selfChannelKey && session?.[schema.selfChannelKey]) {
          data["self"] = session[schema.selfChannelKey];
        } else if (
          schema.channelKeys &&
          schema.channelKeys.length > 0 &&
          session?.[schema.channelKeys[0]]
        ) {
          // Fallback: use first channel from schema
          data["self"] = session[schema.channelKeys[0]];
        }

        // 3.2 Add schema's own channels with their aliases
        if (
          session && schema.channelAliases && schema.channelAliases.length > 0
        ) {
          for (const { channelKey, alias } of schema.channelAliases) {
            const sessionData = session[channelKey];
            if (!sessionData || typeof sessionData !== "object") continue;

            const dataObj = sessionData as Record<string, unknown>;
            if (!("raw" in dataObj)) continue;

            data[alias] = dataObj;
          }
        }

        // 3.3 Add nested channels with their aliases
        if (session && requiredChannels.length > 0) {
          for (const { channelKey, alias } of requiredChannels) {
            // Skip if this alias already exists (avoid duplicates)
            if (data[alias]) continue;

            const sessionData = session[channelKey];
            if (!sessionData || typeof sessionData !== "object") continue;

            const dataObj = sessionData as Record<string, unknown>;
            if (!("raw" in dataObj)) continue;

            // Add with alias from schema (collectRequiredChannels already provides it)
            data[alias] = dataObj;
          }
        }

        setPreviewSchema(resolved);
        setPreviewData(data);
      } catch (error) {
        console.error("Failed to resolve preview:", error);
        setPreviewSchema(schema.schema);
        setPreviewData({});
      }
    };

    resolvePreview();
  }, [schema, session]);

  const formattedDate = useMemo(() => {
    return new Date(schema.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [schema.updatedAt]);

  const handleLaunchClick = (): void => {
    if (isRunning && runningApp) {
      // App already running - just switch to it
      useOpenAppsStore.getState().setActiveApp(runningApp.id);
      return;
    }

    // App not running - launch it
    setIsLaunchingLocal(true);
    onLaunch(schema).catch(() => {
      setIsLaunchingLocal(false);
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`group bg-card rounded border overflow-hidden transition-all duration-200 relative ${
        isRunning
          ? "border-green-500/50 hover:border-green-500/70 shadow-green-500/20 shadow-md"
          : "border-border hover:border-amber-500/30 hover:shadow-md"
      }`}
    >
      {/* Subtle glow for running apps */}
      {isRunning && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-px bg-green-500/10 rounded -z-10"
        />
      )}
      {/* Preview */}
      <div className="aspect-video bg-background border-b border-border overflow-hidden relative">
        <div className="absolute inset-0 scale-50 overflow-auto">
          <ErrorBoundary>
            {previewSchema
              ? <UIRenderer schema={previewSchema} data={previewData} />
              : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground text-xs">
                    Loading preview...
                  </div>
                </div>
              )}
          </ErrorBoundary>
        </div>

        {/* Running indicator badge */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-lg flex items-center gap-1.5"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
            Running
          </motion.div>
        )}

        {/* Instant loading indicator */}
        {isLaunchingLocal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-center"
            >
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs text-muted-foreground"
              >
                Launching...
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Overlay on hover (document-style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-8 pointer-events-none">
          <motion.button
            onClick={handleLaunchClick}
            initial={{ y: 10, opacity: 0 }}
            animate={{
              y: isLaunchingLocal ? 10 : 0,
              opacity: isLaunchingLocal ? 0 : 1,
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`pointer-events-auto px-4 py-2 font-medium rounded-md flex items-center gap-2 shadow-lg transition-colors duration-150 ${
              isRunning
                ? "bg-green-500 text-white hover:bg-green-400"
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">{isRunning ? "Open" : "Launch"}</span>
          </motion.button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-foreground">
            {schema.name}
          </h3>
          {isRunning && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-500 text-xs font-medium rounded border border-green-500/30"
            >
              Active
            </motion.span>
          )}
        </div>

        {schema.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {schema.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {isRunning
            ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-500 font-medium">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 h-1.5 bg-green-500 rounded-full"
                />
                Running
              </div>
            )
            : (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </div>
            )}

          {schema.nestedSchemas && schema.nestedSchemas.length > 0 && (
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {schema.nestedSchemas.length} nested
            </div>
          )}
        </div>

        {/* Widget Key */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs font-mono text-muted-foreground truncate">
            {schema.widgetKey}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Welcome;
