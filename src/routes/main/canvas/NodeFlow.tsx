import type React from "react";
import { memo } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import TradesWidget from "@/components/widgets/TradeWidget.tsx";
import OrderBook from "@/components/widgets/OrderBook.tsx";
import Candles from "@/components/widgets/Candles";
import Ticker from "@/components/widgets/Ticker";
import {FredIndicatorWidget} from "@/components/widgets/FredIndicatorWidget.tsx";
import SonarPortfolio from "@/components/widgets/SonarPortfolio.tsx";
import Ariadna from "@/components/widgets/Ariadna.tsx";

interface WidgetProps {
  widget: string;
  raw: any;
	data?: any;
}

/**
 * Widget component for displaying session data in various formats
 */
const Widget = ({ widget, raw, data }: WidgetProps) => {
  const stopPropagation = (e: React.MouseEvent | React.WheelEvent) => {
    e.stopPropagation();
  };

  switch (widget.split(".").pop()) {
	  case "indicator":
			return <FredIndicatorWidget data={data}/>
    case "trades":
      return (
        <TradesWidget
          exchange={raw.exchange}
          market={raw.market}
          trades={raw.trades}
        />
      );
    case "book":
      return <OrderBook book={raw} />;
	  case "ariadna":
		  return <Ariadna data={data} />;
    case "candles":
      return <Candles raw={raw} />;
	  case "sonar":
		  return <SonarPortfolio />;
    case "ticker":
      return <Ticker raw={raw} />;
    default:
      return (
        <div className="bg-zinc-950 flex flex-col relative">
          <div className="text-zinc-600 text-[8px] p-1">{widget}</div>
          <div
            className="flex-1 flex bg-zinc-900 overflow-y-scroll overflow-x-hidden"
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
              <code className="block text-[6px] whitespace-pre-wrap">
                <pre className="p-2">{JSON.stringify(raw, null, 1)}</pre>
              </code>
            </div>
          </div>
        </div>
      );
  }
};

interface NodeFlowProps {
  data: {
    channel: string;
    label?: string;
    sessionData?: unknown;
  };
}

interface SessionData {
  widget: string;
  raw: unknown;
}

/**
 * NodeFlow component for rendering session data in ReactFlow nodes
 */
const NodeFlow = memo(({ data }: NodeFlowProps) => {
  const session = useSessionStoreSync() as Record<string, SessionData> | null;

  if (!session) return <div>Loading Session</div>;

  const st = session[data.channel];

  if (!st) return <div>Loading RAW</div>;

  return <Widget widget={st.widget} raw={st.raw} data={st} />;
});

NodeFlow.displayName = "NodeFlow";

export default NodeFlow;
