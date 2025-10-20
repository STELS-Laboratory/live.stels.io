import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import TradesWidget from "@/components/widgets/TradeWidget.tsx";
import OrderBook from "@/components/widgets/OrderBook.tsx";
import Ticker from "@/components/widgets/Ticker.tsx";
import { FredIndicatorWidget } from "@/components/widgets/FredIndicatorWidget.tsx";
import SonarPortfolio from "@/components/widgets/SonarPortfolio.tsx";
import Ariadna from "@/components/widgets/Ariadna.tsx";
import NewsBox from "@/components/widgets/NewsBox.tsx";
import TimeZone from "@/components/widgets/TimeZone.tsx";
import {
	type SessionStore,
	type SessionWidgetData,
	type WidgetRawData,
	WidgetType,
} from "@/lib/canvas-types.ts";
import { UIRenderer } from "@/lib/gui/ui.ts";
import type { UINode } from "@/lib/gui/ui.ts";
import {
	findSchemaByChannelKey,
	getSchemaByWidgetKey,
} from "@/apps/Schemas/db.ts";
import {
	collectRequiredChannels,
	resolveSchemaRefs,
} from "@/lib/gui/schema-resolver.ts";
import ErrorBoundary from "@/apps/Schemas/ErrorBoundary.tsx";

interface WidgetProps {
	widget: string;
	raw: WidgetRawData;
	data?: SessionWidgetData;
}

/**
 * Widget component for displaying session data in various formats
 */
const Widget = ({ widget, raw, data }: WidgetProps): React.ReactElement => {
	const stopPropagation = useCallback(
		(e: React.MouseEvent | React.WheelEvent) => {
			e.stopPropagation();
		},
		[],
	);

	// Extract widget type from the widget string
	const widgetType = widget.split(".").pop() as WidgetType | string;

	try {
		switch (widgetType) {
			case WidgetType.INDICATOR:
				return (
					<FredIndicatorWidget
						data={data as unknown as Parameters<
							typeof FredIndicatorWidget
						>[0]["data"]}
					/>
				);

			case WidgetType.TRADES:
				return (
					<TradesWidget
						exchange={raw.exchange as string}
						market={raw.market as string}
						trades={raw.trades || []}
					/>
				);

			case WidgetType.BOOK:
				return (
					<OrderBook
						book={raw as unknown as Parameters<typeof OrderBook>[0]["book"]}
					/>
				);

			case WidgetType.TIMEZONE:
				return (
					<TimeZone
						data={data as unknown as Parameters<typeof TimeZone>[0]["data"]}
					/>
				);

			case WidgetType.ARIADNA:
				return (
					<Ariadna
						data={data as unknown as Parameters<typeof Ariadna>[0]["data"]}
					/>
				);

			case WidgetType.FINANCE:
				return (
					<NewsBox
						data={data as unknown as Parameters<typeof NewsBox>[0]["data"]}
						type={"finance"}
					/>
				);

			case WidgetType.CANDLES:
				// Candles widget removed - migrated to AggregatedCandles
				return (
					<div className="p-4 text-center text-muted-foreground">
						<p className="text-sm">
							Candles widget migrated to AggregatedCandles
						</p>
						<p className="text-xs mt-2">
							Use AggregatedCandles for professional multi-exchange charts
						</p>
					</div>
				);

			case WidgetType.SONAR:
				return <SonarPortfolio />;

			case WidgetType.TICKER:
				return <Ticker raw={raw} />;

			default:
				return (
					<div className="bg-background flex flex-col relative min-h-32">
						<div className="text-muted-foreground text-[8px] p-1 border-b border-border">
							{widget} (Unknown Type)
						</div>
						<div
							className="flex-1 flex bg-card overflow-y-scroll overflow-x-hidden"
							onClick={stopPropagation}
							onMouseDown={stopPropagation}
							onMouseUp={stopPropagation}
							onMouseMove={stopPropagation}
							onWheel={stopPropagation}
							onDoubleClick={stopPropagation}
							onContextMenu={stopPropagation}
							onDragStart={stopPropagation}
						>
							<div className="p-2 overflow-y-scroll">
								<code className="block text-[6px] whitespace-pre-wrap text-card-foreground">
									<pre className="p-2">{JSON.stringify(raw, null, 2)}</pre>
								</code>
							</div>
						</div>
					</div>
				);
		}
	} catch (error) {
		console.error(`Error rendering widget ${widget}:`, error);
		return (
			<div className="bg-red-950 flex flex-col items-center justify-center p-4 min-h-32">
				<div className="text-red-400 text-sm font-medium mb-2">
					Widget Error
				</div>
				<div className="text-red-300 text-xs text-center">
					Failed to render widget: {widget}
				</div>
			</div>
		);
	}
};

interface NodeFlowProps {
	data: {
		channel: string;
		label?: string;
		sessionData?: SessionWidgetData;
		isSchema?: boolean;
		schemaId?: string;
		schemaType?: string;
		channelKeys?: string[];
	};
}

/**
 * Schema Widget Renderer
 */
interface SchemaWidgetProps {
	schemaId: string;
	session: SessionStore | null;
}

const SchemaWidget = memo(
	({ schemaId, session }: SchemaWidgetProps): React.ReactElement => {
		const [resolvedSchema, setResolvedSchema] = useState<UINode | null>(null);
		const [requiredChannelAliases, setRequiredChannelAliases] = useState<
			Array<{ channelKey: string; alias: string }>
		>([]);

		// Load and resolve schema structure (once)
		useEffect(() => {
			const loadAndResolve = async (): Promise<void> => {
				try {
					const schema = await getSchemaByWidgetKey(schemaId);
					if (!schema) {
						console.warn("[SchemaWidget] Schema not found:", schemaId);
						return;
					}

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

					// 1. Resolve schema structure
					const resolved = await resolveSchemaRefs(schema.schema, schemaStore);
					setResolvedSchema(resolved);

					// 2. Collect required channels and aliases
					const requiredChannels = await collectRequiredChannels(
						schema.schema,
						schemaStore,
					);

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

					setRequiredChannelAliases(aliases);
				} catch (error) {
					console.error("[SchemaWidget] Failed to load schema:", error);
				}
			};

			loadAndResolve();
		}, [schemaId]);

		// Prepare data reactively when session updates
		const mergedData = useMemo<Record<string, unknown>>(() => {
			if (!session || requiredChannelAliases.length === 0) return {};

			const data: Record<string, unknown> = {};

			requiredChannelAliases.forEach(({ channelKey, alias }) => {
				const sessionData = session[channelKey];
				if (!sessionData || typeof sessionData !== "object") return;

				const dataObj = sessionData as Record<string, unknown>;
				if (!("raw" in dataObj) && !("data" in dataObj)) return;

				const rawData =
					("raw" in dataObj ? dataObj.raw : dataObj.data) as Record<
						string,
						unknown
					>;
				const channelData: Record<string, unknown> = {
					...rawData,
					active: dataObj.active,
					timestamp: dataObj.timestamp,
				};

				data[alias] = channelData;
			});

			return data;
		}, [session, requiredChannelAliases]);

		if (!resolvedSchema) {
			return (
				<div className="bg-card flex items-center justify-center p-4 min-h-32">
					<div className="text-muted-foreground text-sm">Loading schema...</div>
				</div>
			);
		}

		return (
			<ErrorBoundary>
				<UIRenderer schema={resolvedSchema} data={mergedData} />
			</ErrorBoundary>
		);
	},
);

SchemaWidget.displayName = "SchemaWidget";

/**
 * NodeFlow component for rendering session data in ReactFlow nodes
 */
const NodeFlow = memo(({ data }: NodeFlowProps): React.ReactElement => {
	const session = useSessionStoreSync() as SessionStore | null;

	if (!session) {
		return (
			<div className="bg-card flex items-center justify-center p-4 min-h-32">
				<div className="text-muted-foreground text-sm">Loading Session...</div>
			</div>
		);
	}

	// Check if it's a schema node
	if (data.isSchema && data.schemaId) {
		return <SchemaWidget schemaId={data.schemaId} session={session} />;
	}

	// Regular widget rendering
	const sessionData = session[data.channel];

	if (!sessionData) {
		return (
			<div className="bg-card flex items-center justify-center p-4 min-h-32">
				<div className="text-muted-foreground text-sm">
					Channel not found: {data.channel}
				</div>
			</div>
		);
	}

	return (
		<Widget
			widget={sessionData.widget}
			raw={sessionData.raw}
			data={sessionData}
		/>
	);
});

NodeFlow.displayName = "NodeFlow";

export default NodeFlow;
