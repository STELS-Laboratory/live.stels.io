/**
 * Schema Preview Component
 * Live preview of UI schemas with UIRenderer
 * Supports multiple channel data sources
 */

import { type ReactElement, useEffect, useMemo, useState } from "react";
import { UIRenderer } from "@/lib/gui/ui.ts";
import type { UINode } from "@/lib/gui/ui.ts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui";
import type { ChannelData } from "./types.ts";
import {
  collectRequiredChannels,
  resolveSchemaRefs,
} from "@/lib/gui/schema-resolver.ts";
import { getSchemaByWidgetKey } from "./db.ts";
import useSessionStoreSync from "@/hooks/use_session_store_sync.ts";
import ErrorBoundary from "./error_boundary";

interface SchemaPreviewProps {
  schema: UINode | null;
  channelsData: ChannelData[];
  error: string | null;
  isStaticSchema?: boolean; // Optional hint for UI messages
}

/**
 * Real-time preview of the schema with multi-channel session data
 * Merges data from multiple channels into unified context
 */
export default function SchemaPreview({
  schema,
  channelsData,
  error,
}: SchemaPreviewProps): ReactElement {
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const [resolvedSchema, setResolvedSchema] = useState<UINode | null>(null);
  const [nestedChannelAliases, setNestedChannelAliases] = useState<
    Array<{ channelKey: string; alias: string }>
  >([]);
  const [isResolving, setIsResolving] = useState(false);

  // Create stable schema store
  const schemaStore = useMemo(
    () => ({
      getSchemaByWidgetKey: async (widgetKey: string) => {
        const project = await getSchemaByWidgetKey(widgetKey);
        if (!project) return null;

        return {
          schema: project.schema,
          channelKeys: project.channelKeys,
          channelAliases: project.channelAliases,
        };
      },
    }),
    [],
  );

  // Serialize schema for comparison to prevent unnecessary re-resolves
  const schemaString = useMemo(() => {
    return schema ? JSON.stringify(schema) : "";
  }, [schema]);

  // Resolve nested schemas ONLY when schema structure changes
  useEffect(() => {
    if (!schema) {
      setResolvedSchema(null);
      setNestedChannelAliases([]);
      return;
    }

    let cancelled = false;

    const resolveSchemas = async (): Promise<void> => {
      setIsResolving(true);
      try {
        // 1. Resolve schema structure
        const resolved = await resolveSchemaRefs(
          schema,
          schemaStore,
          0, // depth
          10, // maxDepth
          undefined, // No parent self channel for preview
        );

        // 2. Collect required channels and their aliases (already includes all aliases)
        const requiredChannels = await collectRequiredChannels(
          schema,
          schemaStore,
        );

        if (!cancelled) {
          setResolvedSchema(resolved);
          setNestedChannelAliases(requiredChannels);
        }
      } catch (err) {
        console.error("[SchemaPreview] Failed to resolve:", err);
        if (!cancelled) {
          setResolvedSchema(schema);
          setNestedChannelAliases([]);
        }
      } finally {
        if (!cancelled) {
          setIsResolving(false);
        }
      }
    };

    resolveSchemas();

    return () => {
      cancelled = true;
    };
    // schemaString instead of schema to prevent unnecessary re-resolves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaString, schemaStore]);

  // Prepare all channel data (current + nested) - recalculate when session updates
  const allChannelsData = useMemo<ChannelData[]>(() => {
    if (!session) return channelsData;

    const allData: ChannelData[] = [...channelsData];

    // Add data from nested schemas using collected aliases
    nestedChannelAliases.forEach(({ channelKey, alias }) => {
      // Skip if this EXACT alias already exists (not just channel)
      if (allData.some((ch) => ch.key === alias)) {
        return;
      }

      const sessionData = session[channelKey];
      if (!sessionData || typeof sessionData !== "object") return;

      const dataObj = sessionData as Record<string, unknown>;
      if (!("raw" in dataObj)) return;

      // Pass original session data structure as-is, without modifications
      const mergedData: Record<string, unknown> = dataObj;

      // Add under nested schema's alias (e.g., "btc" even if "self" uses same channel)
      allData.push({
        key: alias,
        data: mergedData,
      });
    });

    return allData;
  }, [session, channelsData, nestedChannelAliases]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Schema Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-muted-foreground text-lg">No schema loaded</div>
          <div className="text-muted-foreground text-sm mt-2">
            Create a new schema to get started
          </div>
        </div>
      </div>
    );
  }

  // For dynamic schemas without channels, show hint (but still allow rendering with empty data)
  // Static schemas can have channels for "self" context

  if (isResolving) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <div className="text-muted-foreground text-sm">
            Resolving nested schemas...
          </div>
        </div>
      </div>
    );
  }

  // Merge data from all channels (including nested) into unified context
  const mergedData: Record<string, unknown> = {};

  allChannelsData.forEach((channel) => {
    mergedData[channel.key] = channel.data;
  });

  // Also provide direct access to first channel's data at root level (legacy)
  if (allChannelsData.length > 0 && allChannelsData[0]) {
    Object.assign(mergedData, allChannelsData[0].data);
  }

  return (
    <div className="relative h-full overflow-auto p-2 bg-background">
      <ErrorBoundary key={JSON.stringify(resolvedSchema || schema)}>
        <div className="flex flex-col gap-2">
          {/* Rendered UI */}
          <div className="flex items-center justify-center">
            <UIRenderer schema={resolvedSchema || schema} data={mergedData} />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
