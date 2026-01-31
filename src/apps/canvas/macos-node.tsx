import React, { useCallback, useMemo, useState } from "react";
import { Handle, type NodeProps, Position, useReactFlow } from "reactflow";
import { Minus, Square, X, Activity, BookOpen, BarChart3, Server, Radar, Network, ArrowLeftRight } from "lucide-react";
import NodeFlow from "@/apps/canvas/node-flow";
import type { FlowNodeData, NodeState } from "@/lib/canvas-types.ts";

interface MacOSNodeProps extends NodeProps {
  data: FlowNodeData;
}

/**
 * Get icon and color based on channel/module type
 */
function getWidgetMeta(channel: string): { icon: React.ElementType; color: string; title: string } {
  const lowerChannel = channel.toLowerCase();
  
  if (lowerChannel.includes(".ticker.")) {
    return { icon: Activity, color: "text-emerald-500", title: "Ticker" };
  }
  if (lowerChannel.includes(".book.")) {
    return { icon: BookOpen, color: "text-blue-500", title: "Order Book" };
  }
  if (lowerChannel.includes(".candles.")) {
    return { icon: BarChart3, color: "text-amber-500", title: "Candles" };
  }
  if (lowerChannel.includes(".peer.") || lowerChannel.includes("network.peer")) {
    return { icon: Server, color: "text-purple-500", title: "Peer" };
  }
  if (lowerChannel.includes(".sonar")) {
    return { icon: Radar, color: "text-cyan-500", title: "Sonar" };
  }
  if (lowerChannel.includes(".connections")) {
    return { icon: Network, color: "text-indigo-500", title: "Connections" };
  }
  if (lowerChannel.includes(".trades.")) {
    return { icon: ArrowLeftRight, color: "text-orange-500", title: "Trades" };
  }
  
  return { icon: Activity, color: "text-muted-foreground", title: "Widget" };
}

const MacOSNode: React.FC<MacOSNodeProps> = (props) => {
  const { setNodes } = useReactFlow();
  const [nodeState, setNodeState] = useState<NodeState>(
    props.data.nodeState || {
      minimized: false,
      maximized: false,
    },
  );

  // Get widget metadata for icon and styling
  const widgetMeta = useMemo(() => {
    return getWidgetMeta(props.data.channel || "");
  }, [props.data.channel]);

  const WidgetIcon = widgetMeta.icon;

  const handleClose = useCallback(() => {
    if (props.data.onDelete) {
      props.data.onDelete(props.id);
    }
  }, [props.data, props.id]);

  const handleMinimize = useCallback(() => {
    setNodeState((prev) => {
      const newState = {
        ...prev,
        minimized: !prev.minimized,
      };

      // Update node data with new state
      setNodes((nds) =>
        nds.map((node) =>
          node.id === props.id
            ? {
              ...node,
              data: {
                ...node.data,
                nodeState: newState,
              },
            }
            : node
        )
      );

      return newState;
    });
  }, [setNodes, props.id]);

  const handleMaximize = useCallback(() => {
    setNodeState((prev) => {
      const newMaximized = !prev.maximized;
      const newState = {
        ...prev,
        maximized: newMaximized,
      };

      // Update node size and state in ReactFlow
      setNodes((nds) =>
        nds.map((node) =>
          node.id === props.id
            ? {
              ...node,
              style: {
                ...node.style,
                width: newMaximized ? "100vw" : "auto",
                height: newMaximized ? "100vh" : "auto",
                zIndex: newMaximized ? 1000 : 1,
              },
              position: newMaximized ? { x: 0, y: 0 } : node.position,
              data: {
                ...node.data,
                nodeState: newState,
              },
            }
            : node
        )
      );

      return newState;
    });
  }, [setNodes, props.id]);

  return (
    <div
      className={`
        transition-all cursor-auto
        border
        rounded
        shadow-sm hover:shadow-md
        overflow-hidden
        ${nodeState.maximized ? "w-full h-full" : "w-auto h-auto"} 
        ${nodeState.minimized ? "h-10" : ""}
      `}
    >
      {/* Auto connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="auto-source"
        className="opacity-0 w-0 h-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="auto-target"
        className="opacity-0 w-0 h-0"
      />

      {/* Header - Document Style */}
      <div className="flex min-w-[250px] bg-card h-7 relative items-center justify-between px-2 py-1 border-b cursor-move drag-handle">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <WidgetIcon className={`h-3 w-3 ${widgetMeta.color} flex-shrink-0`} />
          <span className="text-[10px] font-medium truncate text-muted-foreground">
            {widgetMeta.title}
          </span>
        </div>

        {/* Window Controls - Soft Colors */}
        <div className="flex space-x-1.5">
          <button
            onClick={handleClose}
            className="w-3 h-3 cursor-pointer hover:bg-red-400/90 dark:hover:bg-red-500/80 rounded-full flex items-center justify-center transition-all duration-200"
            title="Close"
          >
            <X size={6} />
          </button>
          <button
            onClick={handleMinimize}
            className={`w-3 h-3 cursor-pointer transition-all duration-200 rounded-full flex items-center justify-center ${
              !nodeState.minimized
                ? "hover:bg-amber-500/90 dark:hover:bg-amber-600/90"
                : "bg-amber-500/90 dark:bg-amber-600/90"
            }`}
            title={nodeState.minimized ? "Restore" : "Minimize"}
          >
            <Minus
              size={6}
              className={nodeState.minimized ? "text-white" : ""}
            />
          </button>
          <button
            onClick={handleMaximize}
            className={`w-3 h-3 cursor-pointer transition-all duration-200 rounded-full flex items-center justify-center ${
              !nodeState.maximized
                ? "hover:bg-emerald-500/90 "
                : "bg-emerald-500/90"
            }`}
            title={nodeState.maximized ? "Restore" : "Maximize"}
          >
            <Square
              size={6}
              className={nodeState.maximized ? "text-white" : ""}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      {!nodeState.minimized && <NodeFlow {...props} />}
    </div>
  );
};

export default MacOSNode;
