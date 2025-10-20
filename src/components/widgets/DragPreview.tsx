import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

/**
 * Props for the DragPreview component
 */
interface DragPreviewProps {
  /** Whether the drag is active */
  isDragging: boolean;
  /** Widget data being dragged */
  widgetData?: {
    module?: string;
    channel?: string;
    type: string;
    name?: string; // For schemas
    widgetKey?: string; // For schemas
  };
  /** Mouse position */
  mousePosition?: { x: number; y: number };
}

/**
 * Drag Preview Component for visual feedback during drag operations
 */
export function DragPreview({
  isDragging,
  widgetData,
  mousePosition,
}: DragPreviewProps): React.ReactElement | null {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isDragging && mousePosition) {
      setPosition({
        x: mousePosition.x + 10,
        y: mousePosition.y + 10,
      });
    }
  }, [isDragging, mousePosition]);

  if (!isDragging || !widgetData) return null;

  // Determine display text: name for schemas, module for regular widgets
  const displayText = widgetData.type === "schema"
    ? widgetData.name || widgetData.widgetKey || "Schema"
    : widgetData.module || widgetData.channel || "Widget";

  return (
    <div
      className={cn(
        "fixed pointer-events-none transition-all duration-200",
        "bg-amber-500 text-black dark:text-black rounded shadow-lg border-2 border-amber-400",
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="flex items-center space-x-2 p-3">
        <Zap className="h-4 w-4" />
        <div className="text-sm font-medium">
          {displayText}
        </div>
      </div>
    </div>
  );
}

/**
 * Drop Zone Indicator Component
 */
interface DropZoneIndicatorProps {
  /** Whether the drop zone is active */
  isActive: boolean;
  /** Position of the drop zone */
  position?: { x: number; y: number; width: number; height: number };
}

export function DropZoneIndicator({
  isActive,
  position,
}: DropZoneIndicatorProps): React.ReactElement | null {
  if (!isActive || !position) return null;

  return (
    <div
      className="fixed pointer-events-none border-2 border-dashed border-amber-500 bg-amber-500/10 rounded transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-amber-500 text-sm font-medium">
          Drop widget here
        </div>
      </div>
    </div>
  );
}
