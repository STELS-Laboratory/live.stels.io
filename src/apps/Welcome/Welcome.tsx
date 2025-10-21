/**
 * Welcome App Store
 * Browse and launch ready-made static router schemas
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
import { Calendar, Layers, Package, Play } from "lucide-react";
import {
  collectRequiredChannels,
  resolveSchemaRefs,
} from "@/lib/gui/schema-resolver.ts";
import ErrorBoundary from "@/apps/schemas/error_boundary.tsx";

/**
 * Web3 App Store - Browse and launch static router schemas
 */
function Welcome(): ReactElement {
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const [schemas, setSchemas] = useState<SchemaProject[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<SchemaProject | null>(
    null,
  );
  const [resolvedSchema, setResolvedSchema] = useState<UINode | null>(null);
  const [requiredChannelAliases, setRequiredChannelAliases] = useState<
    Array<{ channelKey: string; alias: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

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

  // Handle launch app
  const handleLaunchApp = useCallback(
    async (schema: SchemaProject): Promise<void> => {
      setSelectedSchema(schema);
      setIsResolving(true);

      try {
        // Create schema store for resolver
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

        // 1. Resolve schemaRef nodes
        const resolved = await resolveSchemaRefs(schema.schema, schemaStore);

        // 2. Collect all required channels and their aliases
        const requiredChannels = await collectRequiredChannels(
          schema.schema,
          schemaStore,
        );

        // 3. Required channels already include correct aliases from collectRequiredChannels
        setResolvedSchema(resolved);
        setRequiredChannelAliases(requiredChannels);
      } catch (error) {
        console.error("Failed to resolve schema:", error);
        setResolvedSchema(schema.schema);
        setRequiredChannelAliases([]);
      } finally {
        setIsResolving(false);
      }
    },
    [],
  );

  // Prepare merged data reactively when session updates
  const mergedData = useMemo<Record<string, unknown>>(() => {
    if (!session) return {};

    const data: Record<string, unknown> = {};

    // Add "self" using selfChannelKey from schema (set by developer)
    if (
      selectedSchema?.selfChannelKey && session[selectedSchema.selfChannelKey]
    ) {
      data["self"] = session[selectedSchema.selfChannelKey];
    }

    requiredChannelAliases.forEach(({ channelKey, alias }) => {
      const sessionData = session[channelKey];
      if (!sessionData || typeof sessionData !== "object") return;

      const dataObj = sessionData as Record<string, unknown>;
      if (!("raw" in dataObj)) return;

      // Pass original session data structure as-is, without modifications
      data[alias] = dataObj;
    });

    return data;
  }, [session, requiredChannelAliases, selectedSchema?.selfChannelKey]);

  // Handle close app
  const handleCloseApp = useCallback((): void => {
    setSelectedSchema(null);
    setResolvedSchema(null);
    setRequiredChannelAliases([]);
  }, []);

  // If app is selected, render full-screen
  if (selectedSchema) {
    return (
      <UIEngineProvider>
        <div className="h-screen w-screen bg-background relative">
          {/* Close button */}
          <button
            onClick={handleCloseApp}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-card hover:bg-muted text-foreground rounded-lg border border-border transition-colors flex items-center gap-2"
          >
            <span>← Back to Store</span>
          </button>

          {/* Render app */}
          <div className="h-full w-full overflow-auto">
            <ErrorBoundary>
              {isResolving
                ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Loading app...</div>
                  </div>
                )
                : resolvedSchema
                ? <UIRenderer schema={resolvedSchema} data={mergedData} />
                : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-destructive">Failed to load app</div>
                  </div>
                )}
            </ErrorBoundary>
          </div>
        </div>
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
              Web3 App Store
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Browse and launch ready-made applications built with Schema
            Constructor
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
            <div className="text-muted-foreground">Loading apps...</div>
          </div>
        )}

        {/* No apps */}
        {!isLoading && routerSchemas.length === 0 && (
          <div className="max-w-7xl mx-auto">
            <div className="p-12 bg-card rounded-lg border border-border text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                No Apps Available
              </h2>
              <p className="text-muted-foreground mb-4">
                Create static router schemas in Schema Constructor to see them
                here
              </p>
              <p className="text-xs text-muted-foreground">
                Tip: Create a schema with type "static" and widgetKey containing
                "router", "app", or "apps"
              </p>
            </div>
          </div>
        )}

        {/* App Grid */}
        {!isLoading && routerSchemas.length > 0 && (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routerSchemas.map((schema) => (
                <AppCard
                  key={schema.id}
                  schema={schema}
                  session={session}
                  onLaunch={handleLaunchApp}
                />
              ))}
            </div>
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

        // Add "self" using selfChannelKey from schema (set by developer)
        if (schema.selfChannelKey && session?.[schema.selfChannelKey]) {
          data["self"] = session[schema.selfChannelKey];
        }

        if (session && requiredChannels.length > 0) {
          for (const { channelKey, alias } of requiredChannels) {
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

  return (
    <div className="group bg-card rounded-lg border border-border overflow-hidden hover:border-amber-500/50 transition-all">
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

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onLaunch(schema)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Launch App
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {schema.name}
        </h3>

        {schema.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {schema.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </div>

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
    </div>
  );
}

export default Welcome;
