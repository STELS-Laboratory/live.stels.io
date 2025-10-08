import type React from "react";
import { memo, useCallback } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import TradesWidget from "@/components/widgets/TradeWidget";
import OrderBook from "@/components/widgets/OrderBook";
import Candles from "@/components/widgets/Candles";
import Ticker from "@/components/widgets/Ticker";
import { FredIndicatorWidget } from "@/components/widgets/FredIndicatorWidget";
import SonarPortfolio from "@/components/widgets/SonarPortfolio";
import Ariadna from "@/components/widgets/Ariadna";
import NewsBox from "@/components/widgets/NewsBox";
import TimeZone from "@/components/widgets/TimeZone";
import {
	type SessionStore,
	type SessionWidgetData,
	type WidgetRawData,
	WidgetType,
} from "@/lib/canvas-types";

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
				return <FredIndicatorWidget data={data as any} />;

			case WidgetType.TRADES:
				return (
					<TradesWidget
						exchange={raw.exchange as string}
						market={raw.market as string}
						trades={raw.trades || []}
					/>
				);

			case WidgetType.BOOK:
				return <OrderBook book={raw as any} />;

			case WidgetType.TIMEZONE:
				return <TimeZone data={data} />;

			case WidgetType.ARIADNA:
				return <Ariadna data={data} />;

			case WidgetType.FINANCE:
				return <NewsBox data={data} type={"finance"} />;

			case WidgetType.CANDLES:
				return <Candles raw={raw} />;

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
	};
}

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
