import { useCallback, useEffect, useRef } from "react";
import type { Node, Edge, NodeChange, EdgeChange } from "reactflow";
import type { FlowNode, FlowNodeData } from "@/lib/canvas-types";

/**
 * Storage keys for persistence
 */
const STORAGE_KEYS = {
  NODES: "stels-canvas-nodes",
  EDGES: "stels-canvas-edges",
  VIEWPORT: "stels-canvas-viewport",
} as const;

/**
 * Debounced save function to prevent excessive localStorage writes
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

/**
 * Custom hook for managing ReactFlow persistence
 */
export function useFlowPersistence() {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Save nodes to localStorage
   */
  const saveNodes = useCallback((nodes: Node<FlowNodeData>[]): void => {
    try {
      const nodesToSave = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          // Remove functions before saving
          onDelete: undefined,
        },
      }));
      
      localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodesToSave));
      console.log(`Saved ${nodes.length} nodes to localStorage`);
    } catch (error) {
      console.error("Failed to save nodes:", error);
    }
  }, []);

  /**
   * Save edges to localStorage
   */
  const saveEdges = useCallback((edges: Edge[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EDGES, JSON.stringify(edges));
      console.log(`Saved ${edges.length} edges to localStorage`);
    } catch (error) {
      console.error("Failed to save edges:", error);
    }
  }, []);

  /**
   * Save viewport state (zoom, pan)
   */
  const saveViewport = useCallback((viewport: { x: number; y: number; zoom: number }): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEWPORT, JSON.stringify(viewport));
    } catch (error) {
      console.error("Failed to save viewport:", error);
    }
  }, []);

  /**
   * Load nodes from localStorage
   */
  const loadNodes = useCallback((): Node<FlowNodeData>[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NODES);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved) as Node<FlowNodeData>[];
      
      // Validate and clean the data
      return parsed.filter((node) => {
        return (
          node &&
          typeof node.id === "string" &&
          node.data &&
          typeof node.data.channel === "string"
        );
      }).map((node) => ({
        ...node,
        data: {
          ...node.data,
          // onDelete will be added by the component
          onDelete: undefined,
        },
      }));
    } catch (error) {
      console.error("Failed to load nodes:", error);
      return [];
    }
  }, []);

  /**
   * Load edges from localStorage
   */
  const loadEdges = useCallback((): Edge[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EDGES);
      if (!saved) return [];
      
      return JSON.parse(saved) as Edge[];
    } catch (error) {
      console.error("Failed to load edges:", error);
      return [];
    }
  }, []);

  /**
   * Load viewport from localStorage
   */
  const loadViewport = useCallback((): { x: number; y: number; zoom: number } | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIEWPORT);
      if (!saved) return null;
      
      return JSON.parse(saved);
    } catch (error) {
      console.error("Failed to load viewport:", error);
      return null;
    }
  }, []);

  /**
   * Debounced save function for nodes
   */
  const debouncedSaveNodes = useCallback(
    debounce(saveNodes, 300),
    [saveNodes],
  );

  /**
   * Debounced save function for edges
   */
  const debouncedSaveEdges = useCallback(
    debounce(saveEdges, 300),
    [saveEdges],
  );

  /**
   * Debounced save function for viewport
   */
  const debouncedSaveViewport = useCallback(
    debounce(saveViewport, 500),
    [saveViewport],
  );

  /**
   * Clear all saved data
   */
  const clearAllData = useCallback((): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.NODES);
      localStorage.removeItem(STORAGE_KEYS.EDGES);
      localStorage.removeItem(STORAGE_KEYS.VIEWPORT);
      console.log("Cleared all flow data from localStorage");
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  }, []);

  /**
   * Handle node changes with automatic saving
   */
  const handleNodeChanges = useCallback(
    (changes: NodeChange[], nodes: Node<FlowNodeData>[]): NodeChange[] => {
      // Check if any changes affect position or size
      const hasPositionOrSizeChanges = changes.some((change) => {
        return (
          change.type === "position" ||
          change.type === "dimensions" ||
          change.type === "select"
        );
      });

      // Save nodes if there are position or size changes
      if (hasPositionOrSizeChanges && nodes.length > 0) {
        debouncedSaveNodes(nodes);
      }

      return changes;
    },
    [debouncedSaveNodes],
  );

  /**
   * Handle edge changes with automatic saving
   */
  const handleEdgeChanges = useCallback(
    (changes: EdgeChange[], edges: Edge[]): EdgeChange[] => {
      // Save edges on any change
      if (edges.length >= 0) {
        debouncedSaveEdges(edges);
      }

      return changes;
    },
    [debouncedSaveEdges],
  );

  /**
   * Handle viewport changes with automatic saving
   */
  const handleViewportChange = useCallback(
    (viewport: { x: number; y: number; zoom: number }): void => {
      debouncedSaveViewport(viewport);
    },
    [debouncedSaveViewport],
  );

  /**
   * Cleanup function
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Load functions
    loadNodes,
    loadEdges,
    loadViewport,
    
    // Save functions
    saveNodes,
    saveEdges,
    saveViewport,
    
    // Auto-save handlers
    handleNodeChanges,
    handleEdgeChanges,
    handleViewportChange,
    
    // Utility
    clearAllData,
  };
}
