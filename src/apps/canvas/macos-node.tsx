import React, { useCallback, useMemo, useState } from "react";
import { Handle, type NodeProps, Position, useReactFlow } from "reactflow";
import { Minus, Square, X, Activity, BookOpen, BarChart3, Server, Radar, Network, ArrowLeftRight, Wallet, RotateCcw } from "lucide-react";
import NodeFlow from "@/apps/canvas/node-flow";
import type { FlowNodeData, NodeState } from "@/lib/canvas-types.ts";
import { useNodeResize } from "./hooks";

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
  if (lowerChannel.includes(".balance.") || lowerChannel.startsWith("account.balance.")) {
    return { icon: Wallet, color: "text-green-500", title: "Balance" };
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

  // Resize functionality
  const { width, height, isResizing, handleResizeStart, resetSize } = useNodeResize({
    nodeId: props.id,
    initialWidth: nodeState.width,
    initialHeight: nodeState.height,
    minWidth: 250,
    minHeight: 120,
    maxWidth: 1000,
    maxHeight: 700,
  });

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

  // Custom style with dimensions
  const containerStyle = useMemo(() => {
    if (nodeState.maximized) {
      return { width: "100vw", height: "100vh" };
    }
    if (nodeState.minimized) {
      return { width: width ?? "auto", height: 28 };
    }
    return {
      width: width ?? "auto",
      height: height ?? "auto",
    };
  }, [nodeState.maximized, nodeState.minimized, width, height]);

  const hasCustomSize = width !== undefined || height !== undefined;

  return (
    <div
      className={`
        transition-all cursor-auto
        border
        rounded
        shadow-sm hover:shadow-md
        overflow-hidden
        relative
        ${isResizing ? "ring-2 ring-primary/50" : ""}
      `}
      style={containerStyle}
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
          {/* Size indicator */}
          {hasCustomSize && !nodeState.minimized && (
            <span className="text-[8px] text-muted-foreground/50 font-mono ml-1">
              {Math.round(width ?? 0)}×{Math.round(height ?? 0)}
            </span>
          )}
        </div>

        {/* Window Controls - Soft Colors */}
        <div className="flex space-x-1.5">
          {/* Reset size button (only show if custom size) */}
          {hasCustomSize && (
            <button
              onClick={resetSize}
              className="w-3 h-3 cursor-pointer hover:bg-blue-400/90 dark:hover:bg-blue-500/80 rounded-full flex items-center justify-center transition-all duration-200"
              title="Reset size"
            >
              <RotateCcw size={5} />
            </button>
          )}
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

      {/* Content - fills available space */}
      {!nodeState.minimized && (
        <div 
          className="flex-1 overflow-auto"
          style={{ 
            height: height ? `calc(100% - 28px)` : "auto",
            width: "100%",
          }}
        >
          <NodeFlow {...props} containerWidth={width} containerHeight={height ? height - 28 : undefined} />
        </div>
      )}

      {/* Resize Handles - only show when not minimized/maximized */}
      {!nodeState.minimized && !nodeState.maximized && (
        <>
          {/* Right edge - wider hit area for easier grabbing */}
          <div
            className={`absolute top-7 right-0 w-2 bottom-0 cursor-ew-resize transition-colors ${
              isResizing ? "bg-primary/40" : "hover:bg-primary/30"
            }`}
            onMouseDown={handleResizeStart("right")}
          />
          
          {/* Bottom edge - taller hit area for easier grabbing */}
          <div
            className={`absolute bottom-0 left-0 h-2 right-0 cursor-ns-resize transition-colors ${
              isResizing ? "bg-primary/40" : "hover:bg-primary/30"
            }`}
            onMouseDown={handleResizeStart("bottom")}
          />
          
          {/* Bottom-right corner - larger hit area */}
          <div
            className={`absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize group ${
              isResizing ? "bg-primary/20" : ""
            }`}
            onMouseDown={handleResizeStart("bottom-right")}
          >
            {/* Resize grip indicator */}
            <svg
              className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 transition-colors ${
                isResizing 
                  ? "text-primary" 
                  : "text-muted-foreground/40 group-hover:text-primary/60"
              }`}
              viewBox="0 0 6 6"
            >
              <path
                d="M6 6H4.5V4.5H6V6ZM6 3H4.5V1.5H6V3ZM3 6H1.5V4.5H3V6Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default MacOSNode;
