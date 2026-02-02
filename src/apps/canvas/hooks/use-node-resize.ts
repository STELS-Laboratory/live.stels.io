/**
 * Custom hook for resizable ReactFlow nodes
 * Provides resize handlers and state management
 */

import { useCallback, useRef, useState, useEffect } from "react";
import { useReactFlow, useViewport } from "reactflow";
import { DEFAULT_NODE_SIZE } from "@/lib/canvas-types";

interface UseNodeResizeOptions {
  nodeId: string;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (width: number, height: number) => void;
}

interface ResizeState {
  width: number | undefined;
  height: number | undefined;
  isResizing: boolean;
}

type ResizeDirection = 
  | "right" 
  | "bottom" 
  | "bottom-right"
  | "left"
  | "top"
  | "top-left"
  | "top-right"
  | "bottom-left";

export function useNodeResize({
  nodeId,
  initialWidth,
  initialHeight,
  minWidth = DEFAULT_NODE_SIZE.minWidth,
  minHeight = DEFAULT_NODE_SIZE.minHeight,
  maxWidth = DEFAULT_NODE_SIZE.maxWidth,
  maxHeight = DEFAULT_NODE_SIZE.maxHeight,
  onResize,
}: UseNodeResizeOptions) {
  const { setNodes } = useReactFlow();
  const viewport = useViewport();
  
  const [state, setState] = useState<ResizeState>({
    width: initialWidth,
    height: initialHeight,
    isResizing: false,
  });

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    direction: ResizeDirection;
    // Offset from mouse to actual edge (for precise tracking)
    offsetX: number;
    offsetY: number;
    // Zoom level at start of resize (to adjust deltas)
    zoom: number;
  } | null>(null);

  // Sync with external state changes
  useEffect(() => {
    if (initialWidth !== undefined || initialHeight !== undefined) {
      setState(prev => ({
        ...prev,
        width: initialWidth ?? prev.width,
        height: initialHeight ?? prev.height,
      }));
    }
  }, [initialWidth, initialHeight]);

  // Clamp value between min and max
  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback(
    (direction: ResizeDirection) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
      if (!nodeElement) return;

      const rect = nodeElement.getBoundingClientRect();
      const currentWidth = state.width ?? rect.width;
      const currentHeight = state.height ?? rect.height;
      
      // Calculate offset from mouse position to the actual edge
      // This ensures the edge follows the mouse exactly
      let offsetX = 0;
      let offsetY = 0;
      
      if (direction.includes("right")) {
        // Distance from mouse to right edge
        offsetX = rect.right - e.clientX;
      }
      if (direction.includes("left")) {
        // Distance from mouse to left edge
        offsetX = e.clientX - rect.left;
      }
      if (direction.includes("bottom")) {
        // Distance from mouse to bottom edge
        offsetY = rect.bottom - e.clientY;
      }
      if (direction.includes("top")) {
        // Distance from mouse to top edge
        offsetY = e.clientY - rect.top;
      }
      
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: currentWidth,
        startHeight: currentHeight,
        direction,
        offsetX,
        offsetY,
        zoom: viewport.zoom,
      };

      setState(prev => ({ ...prev, isResizing: true }));
    },
    [nodeId, state.width, state.height, viewport.zoom]
  );

  // Handle resize move
  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeRef.current) return;

      const { startX, startY, startWidth, startHeight, direction, zoom } = resizeRef.current;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate delta and adjust for zoom level
      // When zoomed in (zoom > 1), mouse movement is smaller relative to node size
      // When zoomed out (zoom < 1), mouse movement is larger
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;

      // Calculate new dimensions based on direction
      if (direction.includes("right")) {
        newWidth = clamp(startWidth + deltaX, minWidth, maxWidth);
      }
      if (direction.includes("left")) {
        newWidth = clamp(startWidth - deltaX, minWidth, maxWidth);
      }
      if (direction.includes("bottom")) {
        newHeight = clamp(startHeight + deltaY, minHeight, maxHeight);
      }
      if (direction.includes("top")) {
        newHeight = clamp(startHeight - deltaY, minHeight, maxHeight);
      }

      setState(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight,
      }));

      // Update node data in ReactFlow
      setNodes(nds =>
        nds.map(node =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  nodeState: {
                    ...node.data.nodeState,
                    width: newWidth,
                    height: newHeight,
                  },
                },
              }
            : node
        )
      );

      onResize?.(newWidth, newHeight);
    },
    [nodeId, minWidth, minHeight, maxWidth, maxHeight, clamp, setNodes, onResize]
  );

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
    setState(prev => ({ ...prev, isResizing: false }));
  }, []);

  // Get cursor style based on resize direction
  const getCursorStyle = useCallback((direction: ResizeDirection): string => {
    switch (direction) {
      case "right":
      case "left":
        return "ew-resize";
      case "top":
      case "bottom":
        return "ns-resize";
      case "top-left":
      case "bottom-right":
        return "nwse-resize";
      case "top-right":
      case "bottom-left":
        return "nesw-resize";
      default:
        return "nwse-resize";
    }
  }, []);

  // Set up global mouse listeners when resizing
  useEffect(() => {
    if (state.isResizing && resizeRef.current) {
      const cursorStyle = getCursorStyle(resizeRef.current.direction);
      
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      
      // Prevent text selection during resize and set appropriate cursor
      document.body.style.userSelect = "none";
      document.body.style.cursor = cursorStyle;
      
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };
    }
  }, [state.isResizing, handleResizeMove, handleResizeEnd, getCursorStyle]);

  // Reset size to auto
  const resetSize = useCallback(() => {
    setState({ width: undefined, height: undefined, isResizing: false });
    
    setNodes(nds =>
      nds.map(node =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                nodeState: {
                  ...node.data.nodeState,
                  width: undefined,
                  height: undefined,
                },
              },
            }
          : node
      )
    );
  }, [nodeId, setNodes]);

  return {
    width: state.width,
    height: state.height,
    isResizing: state.isResizing,
    handleResizeStart,
    resetSize,
  };
}
