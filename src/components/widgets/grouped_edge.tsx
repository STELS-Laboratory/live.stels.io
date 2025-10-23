import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "reactflow";
import type { EdgeProps } from "reactflow";
import type { GroupedEdgeData } from "@/lib/canvas-types";

/**
 * Props for the GroupedEdge component
 */
interface GroupedEdgeProps extends EdgeProps {
  data?: GroupedEdgeData;
}

/**
 * Custom edge component for grouped connections
 * Displays connection information and grouping details
 */
function GroupedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: GroupedEdgeProps): React.ReactElement {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Enhanced styling for grouped edges
  const edgeStyle = {
    ...style,
    strokeWidth: (data?.connectionCount || 1) > 2 ? 3 : 2,
    opacity: 0.8,
  };

  // Color intensity based on connection count
  const colorIntensity = Math.min((data?.connectionCount || 1) / 5, 1);
  const baseColor = style.stroke as string || "#c9995a"; // fallback to custom amber
  const adjustedColor = adjustColorOpacity(baseColor, colorIntensity);

  console.log("GroupedEdge rendering:", {
    data,
    baseColor,
    adjustedColor,
    style,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...edgeStyle,
          stroke: adjustedColor,
        }}
      />

      {/* Connection label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform:
              `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: "all",
          }}
          className="group"
        >
          {/* Main label */}
          <div
            className="px-1 py-0.5 rounded text-xs font-medium text-foreground bg-card/90 backdrop-blur-sm border border-border/50 transition-all duration-200 group-hover:bg-card group-hover:scale-105"
            style={{
              color: adjustedColor,
              borderColor: adjustedColor + "40",
            }}
          >
            {data?.groupKey || "Connection"}
          </div>

          {/* Connection count badge */}
          {(data?.connectionCount || 0) > 2 && (
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: adjustedColor,
                color: "white",
              }}
            >
              {data?.connectionCount || 1}
            </div>
          )}

          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-card/95 text-foreground text-xs rounded px-3 py-2 backdrop-blur-sm border border-border/50 whitespace-nowrap">
              <div className="font-medium mb-1">
                {data?.groupType || "Unknown"}: {data?.groupKey || "Connection"}
              </div>
              <div className="text-card-foreground">
                {data?.connectionCount || 1} connected nodes
              </div>
              {(data?.relatedNodes?.length || 0) <= 5 && data?.relatedNodes && (
                <div className="mt-1 text-muted-foreground">
                  Nodes: {data.relatedNodes.join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

/**
 * Adjust color opacity based on connection intensity
 */
function adjustColorOpacity(color: string, intensity: number): string {
  // Convert hex to RGB and adjust opacity
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Increase opacity with intensity
  const opacity = Math.max(0.6, Math.min(1, intensity));

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default GroupedEdge;
