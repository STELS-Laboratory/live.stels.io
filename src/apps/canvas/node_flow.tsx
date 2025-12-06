import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { getSessionStorageManager } from "@/lib/gui/ui.ts";
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
	const sessionManager = useMemo(() => getSessionStorageManager(), []);
	const [schema, setSchema] = useState<UINode | null>(null);
	const [mergedData, setMergedData] = useState<Record<string, unknown>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [sessionData, setSessionData] = useState<Record<string, unknown> | null>(null);

	// Get session data for this widget's channel
	// data.channel = "testnet.runtime.ticker.BTC/USDT.bybit.spot" (widget's own channel)
	const widgetKey = sessionData?.widget as string | undefined;

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

	// Track all channels that need to be subscribed to
	const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());

	// Function to update merged data from session
	const updateMergedData = useCallback(
		async (
			currentSchema: UINode | null,
			currentSessionData: Record<string, unknown> | null,
			schemaProject: Awaited<ReturnType<typeof getSchemaByWidgetKey>> | null,
		): Promise<void> => {
			if (!currentSchema || !currentSessionData || !schemaProject) {
				return;
			}

			// Prepare merged data with aliases from the schema itself
			const mergedChannelData: Record<string, unknown> = {};

			// 1. IMPORTANT: In Canvas, "self" should always point to the widget's own data
			// This ensures {self.raw.last} shows the widget's data, not aliases
			if (currentSessionData) {
				// Always use the widget's own channel data as "self"
				mergedChannelData["self"] = currentSessionData;
			}

			// 2. Process nested schemas with their self channels
			// This allows nested schemas to access their own data via {self}
			const processNestedSchemas = (node: UINode): void => {
				if (node.schemaRef && node.selfChannel) {
					const nestedData = sessionManager.getData(node.selfChannel, true);
					if (nestedData) {
						mergedChannelData[node.selfChannel] = nestedData;
					}
				}

				// Recursively process children
				if (node.children) {
					node.children.forEach(processNestedSchemas);
				}
			};

			processNestedSchemas(currentSchema);

			// 3. Add data for schema's own channels (with aliases)
			if (
				schemaProject.channelAliases &&
				schemaProject.channelAliases.length > 0
			) {
				schemaProject.channelAliases.forEach(
					(
						{ channelKey, alias }: { channelKey: string; alias: string },
					) => {
						const channelData = sessionManager.getData(channelKey, true);
						if (channelData) {
							mergedChannelData[alias] = channelData;
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

				const channelData = sessionManager.getData(channelKey, true);
				if (channelData) {
					mergedChannelData[alias] = channelData;
				}
			}

			setMergedData(mergedChannelData);
		},
		[sessionManager, schemaStore],
	);

	// Load initial session data and subscribe to channel updates
	useEffect(() => {
		if (!data.channel) {
			setSessionData(null);
			return;
		}

		// Load initial data
		const initialData = sessionManager.getData(data.channel, true);
		setSessionData(initialData);

		// Subscribe to channel updates
		const unsubscribe = sessionManager.subscribe(data.channel, (updatedData) => {
			setSessionData(updatedData);
		});

		// Also subscribe to lowercase version
		const lowerChannel = data.channel.toLowerCase();
		const unsubscribeLower = sessionManager.subscribe(lowerChannel, (updatedData) => {
			setSessionData(updatedData);
		});

		// Listen to storage events (for cross-tab updates)
		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key === data.channel || e.key === lowerChannel) {
				const freshData = sessionManager.getData(data.channel, true);
				setSessionData(freshData);
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Polling fallback - reduced frequency for better performance
		let lastPollTime = 0;
		const pollInterval = setInterval(() => {
			const now = Date.now();
			// Throttle polling to prevent excessive operations
			if (now - lastPollTime < 2000) {
				return;
			}
			lastPollTime = now;
			requestAnimationFrame(() => {
				const freshData = sessionManager.getData(data.channel, true);
				if (freshData) {
					setSessionData(freshData);
				}
			});
		}, 2000); // Poll every 2 seconds

		return () => {
			unsubscribe();
			unsubscribeLower();
			window.removeEventListener("storage", handleStorageChange);
			clearInterval(pollInterval);
		};
	}, [data.channel, sessionManager]);

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

					if (!cancelled) {
						setSchema(resolved);
						// Update merged data with current session data
						await updateMergedData(resolved, sessionData, schemaProject);
					}
				}
			} catch {
				// Error handled silently
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
	}, [widgetKey, schemaStore, data.channel, updateMergedData, sessionData]);

	// Update merged data when session data changes
	useEffect(() => {
		if (schema && sessionData) {
			// Get schema project to update merged data
			const updateData = async (): Promise<void> => {
				if (!widgetKey) return;
				const schemaProject = await getSchemaByWidgetKey(widgetKey);
				if (schemaProject) {
					await updateMergedData(schema, sessionData, schemaProject);
				}
			};
			updateData();
		}
	}, [schema, sessionData, widgetKey, updateMergedData]);

	// Subscribe to all required channels for real-time updates
	useEffect(() => {
		if (!schema || !widgetKey) {
			return;
		}

		const setupChannelSubscriptions = async (): Promise<void> => {
			const schemaProject = await getSchemaByWidgetKey(widgetKey);
			if (!schemaProject) return;

			// Collect all channels that need subscriptions
			const channelsToSubscribe = new Set<string>([data.channel]);

			// Add nested schema channels
			const processNestedSchemas = (node: UINode): void => {
				if (node.schemaRef && node.selfChannel) {
					channelsToSubscribe.add(node.selfChannel);
				}
				if (node.children) {
					node.children.forEach(processNestedSchemas);
				}
			};
			processNestedSchemas(schema);

			// Add schema's own channels
			if (schemaProject.channelAliases) {
				schemaProject.channelAliases.forEach(({ channelKey }) => {
					channelsToSubscribe.add(channelKey);
				});
			}

			// Add required channels
			const requiredChannels = await collectRequiredChannels(
				schemaProject.schema,
				schemaStore,
			);
			requiredChannels.forEach(({ channelKey }) => {
				channelsToSubscribe.add(channelKey);
			});

			// Subscribe to all channels
			const unsubscribes: (() => void)[] = [];

			channelsToSubscribe.forEach((channel) => {
				const unsubscribe = sessionManager.subscribe(channel, () => {
					// When any channel updates, refresh merged data
					// Get fresh session data for the widget's channel
					const freshSessionData = sessionManager.getData(data.channel, true);
					if (schema && freshSessionData) {
						updateMergedData(schema, freshSessionData, schemaProject);
					}
				});
				unsubscribes.push(unsubscribe);

				// Also subscribe to lowercase version
				const lowerChannel = channel.toLowerCase();
				if (lowerChannel !== channel) {
					const unsubscribeLower = sessionManager.subscribe(lowerChannel, () => {
						const freshSessionData = sessionManager.getData(data.channel, true);
						if (schema && freshSessionData) {
							updateMergedData(schema, freshSessionData, schemaProject);
						}
					});
					unsubscribes.push(unsubscribeLower);
				}
			});

			setSubscribedChannels(channelsToSubscribe);

			return () => {
				unsubscribes.forEach((unsubscribe) => unsubscribe());
			};
		};

		const cleanup = setupChannelSubscriptions();

		return () => {
			cleanup.then((cleanupFn) => cleanupFn?.());
		};
	}, [schema, widgetKey, data.channel, sessionManager, schemaStore, sessionData, updateMergedData]);

	if (!sessionData) {
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
