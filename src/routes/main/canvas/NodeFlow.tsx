import type React from "react";
import { memo } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";

interface WidgetProps {
  widget: string;
  raw: unknown;
}

/**
 * Widget component for displaying session data in various formats
 */
const Widget = ({ widget, raw }: WidgetProps) => {
  const stopPropagation = (e: React.MouseEvent | React.WheelEvent) => {
    e.stopPropagation();
  };

  switch (widget) {
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

  return <Widget widget={st.widget} raw={st.raw} />;
});

NodeFlow.displayName = "NodeFlow";

export default NodeFlow;
