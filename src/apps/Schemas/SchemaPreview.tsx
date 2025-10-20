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
import { findSchemaByChannelKey, getSchemaByWidgetKey } from "./db.ts";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import ErrorBoundary from "./ErrorBoundary.tsx";

interface SchemaPreviewProps {
  schema: UINode | null;
  channelsData: ChannelData[];
  error: string | null;
  isStaticSchema?: boolean;
}

/**
 * Real-time preview of the schema with multi-channel session data
 * Merges data from multiple channels into unified context
 */
export default function SchemaPreview({
  schema,
  channelsData,
  error,
  isStaticSchema = false,
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
        const resolved = await resolveSchemaRefs(schema, schemaStore);

        // 2. Collect required channels and their aliases
        const requiredChannels = await collectRequiredChannels(
          schema,
          schemaStore,
        );

        // 3. Get aliases from owner schemas
        const aliases: Array<{ channelKey: string; alias: string }> = [];
        for (const { channelKey } of requiredChannels) {
          const ownerSchema = await findSchemaByChannelKey(channelKey);
          const aliasObj = ownerSchema?.channelAliases?.find(
            (a) => a.channelKey === channelKey,
          );
          if (aliasObj) {
            aliases.push(aliasObj);
          }
        }

        if (!cancelled) {
          setResolvedSchema(resolved);
          setNestedChannelAliases(aliases);
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
      // Skip if already in current data
      if (channelsData.some((ch) => ch.key === alias)) {
        return;
      }

      const sessionData = session[channelKey];
      if (!sessionData || typeof sessionData !== "object") return;

      const dataObj = sessionData as Record<string, unknown>;
      if (!("raw" in dataObj)) return;

      // Pass original session data structure as-is, without modifications
      const mergedData: Record<string, unknown> = dataObj;

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
          <div className="text-zinc-500 text-lg">No schema loaded</div>
          <div className="text-zinc-600 text-sm mt-2">
            Create a new schema to get started
          </div>
        </div>
      </div>
    );
  }

  // For dynamic schemas, require channels
  if (!isStaticSchema && channelsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="text-zinc-500 text-lg mb-2">No Channels Selected</div>
          <div className="text-zinc-600 text-sm mb-4">
            Select one or more channels to preview with live data
          </div>
          <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
            <div className="text-xs text-blue-400">
              📊 Dynamic schemas need channels. Select channels from the panel
              on the left.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isResolving) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <div className="text-zinc-500 text-sm">
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

  // Also provide direct access to first channel's data at root level
  if (allChannelsData.length > 0 && allChannelsData[0]) {
    Object.assign(mergedData, allChannelsData[0].data);
  }

  return (
    <div className="h-full overflow-auto p-4 bg-zinc-950">
      <ErrorBoundary key={JSON.stringify(resolvedSchema || schema)}>
        <div className="flex flex-col gap-4">
          {/* Channel info - show all data sources */}
          {allChannelsData.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allChannelsData.map((channel, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20 font-mono"
                >
                  {channel.key}
                </span>
              ))}
            </div>
          )}

          {/* Rendered UI */}
          <div className="flex items-center justify-center">
            <UIRenderer schema={resolvedSchema || schema} data={mergedData} />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
