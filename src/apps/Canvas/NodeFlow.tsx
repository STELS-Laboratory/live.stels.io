import React, { memo, useEffect, useMemo, useState } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import type { SessionStore } from "@/lib/canvas-types.ts";
import { UIEngineProvider, UIRenderer } from "@/lib/gui/ui.ts";
import type { UINode } from "@/lib/gui/ui.ts";
import ErrorBoundary from "@/apps/Schemas/ErrorBoundary.tsx";
import {
	findSchemaByChannelKey,
	getSchemaByWidgetKey,
} from "@/apps/Schemas/db.ts";
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

	// Get session data
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
					// Resolve schema
					const resolved = await resolveSchemaRefs(
						schemaProject.schema,
						schemaStore,
					);

					// Prepare data with aliases from the schema itself
					const data: Record<string, unknown> = {};

					// IMPORTANT: Add current session data as "self" for universal schemas
					// This allows using same schema for different channels
					data["self"] = sessionData;

					// Add data for schema's own channels (with aliases)
					if (
						schemaProject.channelAliases &&
						schemaProject.channelAliases.length > 0
					) {
						schemaProject.channelAliases.forEach(({ channelKey, alias }) => {
							if (session?.[channelKey]) {
								data[alias] = session[channelKey];
							}
						});
					}

					// Collect nested channels and aliases
					const requiredChannels = await collectRequiredChannels(
						schemaProject.schema,
						schemaStore,
					);

					for (const { channelKey } of requiredChannels) {
						const ownerSchema = await findSchemaByChannelKey(channelKey);
						const aliasObj = ownerSchema?.channelAliases?.find(
							(a) => a.channelKey === channelKey,
						);
						const alias = aliasObj?.alias || channelKey;

						if (session?.[channelKey]) {
							data[alias] = session[channelKey];
						}
					}

					if (!cancelled) {
						setSchema(resolved);
						setMergedData(data);
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
	}, [widgetKey, session, schemaStore]);

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
