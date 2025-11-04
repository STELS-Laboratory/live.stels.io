import React, { memo, useEffect, useMemo, useState } from "react";
import useSessionStoreSync from "@/hooks/use_session_store_sync.ts";
import type { SessionStore } from "@/lib/canvas-types.ts";
import { UIEngineProvider, UIRenderer } from "@/lib/gui/ui.ts";
import type { UINode } from "@/lib/gui/ui.ts";
import ErrorBoundary from "@/apps/schemas/error_boundary";
import { getSchemaByWidgetKey } from "@/apps/schemas/db";
import {
	collectRequiredChannels,
	resolveSchemaRefs,
} from "@/lib/gui/schema-resolver.ts";

interface NodeFlowProps {
	data: {
		channel: string;
		label?: string;
	};
}

/**
 * NodeFlow component - renders widget by checking schema in IndexedDB
 */
const NodeFlow = memo(({ data }: NodeFlowProps): React.ReactElement => {
	const session = useSessionStoreSync() as SessionStore | null;
	const [schema, setSchema] = useState<UINode | null>(null);
	const [mergedData, setMergedData] = useState<Record<string, unknown>>({});
	const [isLoading, setIsLoading] = useState(true);

	// Get session data for this widget's channel
	// data.channel = "testnet.runtime.ticker.BTC/USDT.bybit.spot" (widget's own channel)
	const sessionData = session?.[data.channel];
	const widgetKey = sessionData?.widget;

	// Schema store
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

	// Load schema if widget key exists
	useEffect(() => {
		if (!widgetKey) {
			setIsLoading(false);
			return;
		}

		let cancelled = false;

		const loadSchema = async (): Promise<void> => {
			try {
				const schemaProject = await getSchemaByWidgetKey(widgetKey);

				if (cancelled) return;

				if (schemaProject) {
					// Resolve schema with self channel context
					const resolved = await resolveSchemaRefs(
						schemaProject.schema,
						schemaStore,
						0, // depth
						10, // maxDepth
						data.channel, // Pass current channel as parent self channel
					);

					// Prepare merged data with aliases from the schema itself
					const mergedChannelData: Record<string, unknown> = {};

					// 1. IMPORTANT: In Canvas, "self" should always point to the widget's own data
					// This ensures {self.raw.data.last} shows the widget's data, not aliases
					if (sessionData) {
						// Always use the widget's own channel data as "self"
						mergedChannelData["self"] = sessionData;
					}

					// 2. Process nested schemas with their self channels
					// This allows nested schemas to access their own data via {self}
					const processNestedSchemas = (node: UINode): void => {
						if (
							node.schemaRef && node.selfChannel && session?.[node.selfChannel]
						) {
							// Add self channel data for nested schema
							mergedChannelData[node.selfChannel] = session[node.selfChannel];
						}

						// Recursively process children
						if (node.children) {
							node.children.forEach(processNestedSchemas);
						}
					};

					processNestedSchemas(resolved);

					// 3. Add data for schema's own channels (with aliases)
					if (
						schemaProject.channelAliases &&
						schemaProject.channelAliases.length > 0
					) {
						schemaProject.channelAliases.forEach(
							(
								{ channelKey, alias }: { channelKey: string; alias: string },
							) => {
								if (session?.[channelKey]) {
									mergedChannelData[alias] = session[channelKey];
								}
							},
						);
					}

					// 4. Collect nested channels and aliases from all nested schemas
					// collectRequiredChannels already returns correct aliases!
					const requiredChannels = await collectRequiredChannels(
						schemaProject.schema,
						schemaStore,
					);

					// Add all nested channel data using their proper aliases
					for (const { channelKey, alias } of requiredChannels) {
						// Skip if this alias already exists (avoid duplicates)
						if (mergedChannelData[alias]) {
							continue;
						}

						if (session?.[channelKey]) {
							mergedChannelData[alias] = session[channelKey];
						}
					}

					if (!cancelled) {
						setSchema(resolved);
						setMergedData(mergedChannelData);
					}
				}
			} catch (error) {
				console.error("[NodeFlow] Schema load error:", error);
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		loadSchema();

		return () => {
			cancelled = true;
		};
	}, [widgetKey, session, sessionData, schemaStore, data.channel]);

	if (!session || !sessionData) {
		return (
			<div className="bg-card flex items-center justify-center p-4 min-h-32">
				<div className="text-muted-foreground text-sm">Loading...</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="bg-card flex items-center justify-center p-4 min-h-32">
				<div className="text-muted-foreground text-sm">Loading...</div>
			</div>
		);
	}

	// Schema exists - render with UIRenderer
	if (schema) {
		return (
			<UIEngineProvider>
				<ErrorBoundary>
					<UIRenderer schema={schema} data={mergedData} />
				</ErrorBoundary>
			</UIEngineProvider>
		);
	}

	// No schema - render JSON
	return (
		<div className="bg-card overflow-auto">
			<div className="p-2">
				<code className="block text-[8px] whitespace-pre-wrap text-card-foreground">
					{JSON.stringify(sessionData, null, 2)}
				</code>
			</div>
		</div>
	);
});

NodeFlow.displayName = "NodeFlow";

export default NodeFlow;
