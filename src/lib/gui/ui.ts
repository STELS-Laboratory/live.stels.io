import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

export interface FormatConfig {
  type: "number" | "volume" | "datetime" | "time";
  decimals?: number;
}

export interface Condition {
  key: string;
  operator: "===" | ">" | "<" | ">=" | "<=";
  value: unknown;
}

export interface IterateConfig {
  source: string;
  limit?: number;
  reverse?: boolean;
}

export interface ActionPayload {
  channel?: string;
  modalId?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  backdrop?: "dark" | "light" | "blur";
  closeOnBackdrop?: boolean;
}

export interface Action {
  type: "openModal" | "closeModal" | "emit";
  payload?: ActionPayload;
}

export interface UINode {
  type: string;
  className?: string;
  style?: Record<string, unknown>;
  children?: UINode[];
  text?: string;
  format?: FormatConfig;
  condition?: Condition;
  iterate?: IterateConfig;
  refreshInterval?: number;
  schemaRef?: string; // Reference to another schema by widget key
  events?: {
    onClick?: Action;
    onDoubleClick?: Action;
    onMouseEnter?: Action;
    onMouseLeave?: Action;
  };
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  channel?: string;
  data?: Record<string, unknown>;
  config?: ActionPayload;
}

export interface UIEngineContext {
  modals: Map<string, ModalState>;
  openModal: (id: string, action: Action) => void;
  closeModal: (id: string) => void;
  getModalData: (channel: string) => Record<string, unknown> | null;
  updateModalData: (id: string, data: Record<string, unknown>) => void;
}


// ============================================================================
// UI Engine Context
// ============================================================================

const UIEngineContextInstance = createContext<UIEngineContext | null>(null);

export const useUIEngine = (): UIEngineContext => {
  const context = useContext(UIEngineContextInstance);
  if (!context) {
    throw new Error("useUIEngine must be used within UIEngineProvider");
  }
  return context;
};

// ============================================================================
// Session Storage Integration
// ============================================================================

class SessionStorageManager {
  private static instance: SessionStorageManager;
  private cache: Map<string, Record<string, unknown>> = new Map();
  private subscribers: Map<string, Set<(data: Record<string, unknown>) => void>> = new Map();

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): SessionStorageManager {
    if (!SessionStorageManager.instance) {
      SessionStorageManager.instance = new SessionStorageManager();
    }
    return SessionStorageManager.instance;
  }

  public getData(channel: string, skipCache = false): Record<string, unknown> | null {
    try {
      // Check cache first (unless skipCache is true)
      if (!skipCache && this.cache.has(channel)) {
        return this.cache.get(channel)!;
      }

      // Read from sessionStorage - try both original and lowercase
      let stored = sessionStorage.getItem(channel);
      if (!stored) {
        stored = sessionStorage.getItem(channel.toLowerCase());
      }
      
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        
        // Always update cache with fresh data
        this.cache.set(channel, parsed);
        
        return parsed;
      }

      return null;
    } catch (error) {
      console.error(`[SessionStorage] Failed to get data for channel: ${channel}`, error);
      return null;
    }
  }

  public subscribe(channel: string, callback: (data: Record<string, unknown>) => void): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    
    this.subscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const channelSubs = this.subscribers.get(channel);
      if (channelSubs) {
        channelSubs.delete(callback);
        if (channelSubs.size === 0) {
          this.subscribers.delete(channel);
        }
      }
    };
  }

  public invalidateCache(channel: string): void {
    this.cache.delete(channel);
    
    // Notify subscribers
    const data = this.getData(channel);
    if (data) {
      const channelSubs = this.subscribers.get(channel);
      if (channelSubs) {
        channelSubs.forEach((callback) => callback(data));
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// UI Engine Provider
// ============================================================================

export const UIEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modals, setModals] = useState<Map<string, ModalState>>(new Map());
  const sessionManager = useMemo(() => SessionStorageManager.getInstance(), []);

  const getModalData = useCallback((channel: string): Record<string, unknown> | null => {
    return sessionManager.getData(channel);
  }, [sessionManager]);

  const updateModalData = useCallback((id: string, data: Record<string, unknown>): void => {
    setModals((prev) => {
      const updated = new Map(prev);
      const modal = updated.get(id);
      if (modal) {
        updated.set(id, { ...modal, data });
      }
      return updated;
    });
  }, []);

  const openModal = useCallback((id: string, action: Action): void => {
    const payload = action.payload;
    if (!payload) return;

    // Get data from session storage if channel is provided
    let modalData: Record<string, unknown> | null = null;
    if (payload.channel) {
      modalData = sessionManager.getData(payload.channel);
    }

    setModals((prev) => {
      const updated = new Map(prev);
      updated.set(id, {
        id,
        isOpen: true,
        channel: payload.channel,
        data: modalData || undefined,
        config: payload,
      });
      return updated;
    });
  }, [sessionManager]);

  const closeModal = useCallback((id: string): void => {
    setModals((prev) => {
      const updated = new Map(prev);
      const modal = updated.get(id);
      if (modal) {
        updated.set(id, { ...modal, isOpen: false });
        // Clean up after animation
        setTimeout(() => {
          setModals((current) => {
            const cleanup = new Map(current);
            cleanup.delete(id);
            return cleanup;
          });
        }, 300); // Animation duration
      }
      return updated;
    });
  }, []);

  const contextValue = useMemo<UIEngineContext>(
    () => ({
      modals,
      openModal,
      closeModal,
      getModalData,
      updateModalData,
    }),
    [modals, openModal, closeModal, getModalData, updateModalData],
  );

  return React.createElement(
    UIEngineContextInstance.Provider,
    { value: contextValue },
    children,
    React.createElement(ModalRenderer, {
      modals: Array.from(modals.values()),
    }),
  );
};

// ============================================================================
// Modal Renderer Component
// ============================================================================

const ModalRenderer: React.FC<{ modals: ModalState[] }> = ({ modals }) => {
  return React.createElement(
    React.Fragment,
    null,
    modals.map((modal) =>
      React.createElement(ModalPortal, { key: modal.id, modal }),
    ),
  );
};

const ModalPortal: React.FC<{ modal: ModalState }> = ({ modal }) => {
  const { closeModal } = useUIEngine();
  const sessionManager = useMemo(() => SessionStorageManager.getInstance(), []);
  const [modalData, setModalData] = useState<Record<string, unknown> | undefined>(modal.data);
  const [updateCounter, setUpdateCounter] = useState(0);

  // Subscribe to session storage updates with aggressive polling
  useEffect(() => {
    if (!modal.channel) return;

    // Load initial data
    const initialData = sessionManager.getData(modal.channel, true);
    if (initialData) {
      setModalData(initialData);
    }

    // Aggressive polling every 100ms - always skip cache for fresh data
    const intervalId = setInterval(() => {
      if (modal.channel) {
        const freshData = sessionManager.getData(modal.channel, true); // Skip cache
        if (freshData) {
          setModalData(freshData);
          setUpdateCounter((prev) => prev + 1);
        }
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [modal.channel, sessionManager]);

  if (!modal.isOpen) return null;

  const handleBackdropClick = (): void => {
    if (modal.config?.closeOnBackdrop) {
      closeModal(modal.id);
    }
  };

  const handleContentClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
  };

  const backdropClass =
    modal.config?.backdrop === "blur"
      ? "backdrop-blur-sm"
      : modal.config?.backdrop === "light"
        ? "bg-white/20"
        : "bg-black/60";

  return React.createElement(
    "div",
    {
      className: `fixed inset-0 z-50 flex items-center justify-center ${backdropClass} animate-in fade-in duration-200`,
      onClick: handleBackdropClick,
    },
    React.createElement(
      "div",
      {
        className:
          "bg-zinc-900 rounded-lg shadow-2xl border border-zinc-700 animate-in zoom-in-95 duration-200",
        style: {
          width: modal.config?.width,
          height: modal.config?.height,
          maxWidth: modal.config?.maxWidth || "90vw",
          maxHeight: modal.config?.maxHeight || "90vh",
          overflow: "auto",
        },
        onClick: handleContentClick,
      },
      modalData && modalData.ui && modalData.raw
        ? React.createElement(UIRenderer, {
            key: `modal-ui-${updateCounter}`, // Force re-render on updates
            schema: modalData.ui as UINode,
            data: modalData.raw as Record<string, unknown>,
          })
        : React.createElement(
            "div",
            { className: "flex items-center justify-center p-8" },
            React.createElement(
              "div",
              { className: "text-zinc-500" },
              modalData
                ? `No UI data available. Keys: ${Object.keys(modalData).join(", ")}`
                : "Loading data from session storage...",
            ),
          ),
    ),
  );
};

// ============================================================================
// Action Dispatcher
// ============================================================================

class ActionDispatcher {
  private static instance: ActionDispatcher;
  private engineContext: UIEngineContext | null = null;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): ActionDispatcher {
    if (!ActionDispatcher.instance) {
      ActionDispatcher.instance = new ActionDispatcher();
    }
    return ActionDispatcher.instance;
  }

  public setEngineContext(context: UIEngineContext): void {
    this.engineContext = context;
  }

  public dispatch(action: Action): void {
    if (!this.engineContext) {
      console.warn("[ActionDispatcher] Engine context not initialized");
      return;
    }

    switch (action.type) {
      case "openModal":
        if (action.payload?.modalId) {
          this.engineContext.openModal(action.payload.modalId, action);
        }
        break;

      case "closeModal":
        if (action.payload?.modalId) {
          this.engineContext.closeModal(action.payload.modalId);
        }
        break;

      case "emit":
        // Custom event emission - can be extended
        if (action.payload?.channel) {
          const event = new CustomEvent("ui-engine-event", {
            detail: action.payload,
          });
          window.dispatchEvent(event);
        }
        break;

      default:
        console.warn(`[ActionDispatcher] Unknown action type: ${action.type}`);
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

const getValue = (obj: unknown, path: string): unknown => {
  if (!path) return obj;

  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc === null || acc === undefined) return undefined;

    if (Array.isArray(acc)) {
      const index = parseInt(part, 10);
      if (!isNaN(index)) {
        return acc[index];
      }
    }

    if (typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }

    return undefined;
  }, obj);
};

const formatValue = (value: unknown, format: FormatConfig): string => {
  const num = parseFloat(String(value));

  switch (format.type) {
    case "number":
      return num.toFixed(format.decimals ?? 0);
    case "volume":
      if (num >= 1e9) return `${(num / 1e9).toFixed(format.decimals)}B`;
      if (num >= 1e6) return `${(num / 1e6).toFixed(format.decimals)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(format.decimals)}K`;
      return num.toFixed(format.decimals);
    case "datetime":
      return new Date(num).toLocaleString();
    case "time":
      return new Date(num).toLocaleTimeString();
    default:
      return String(value);
  }
};

const interpolate = (
  text: string,
  data: Record<string, unknown>,
  item?: unknown,
): string => {
  return text.replace(/\$?\{([^}]+)\}/g, (_match, expression: string) => {
    const hasOperators = /[+\-*/%()]/.test(expression);

    if (hasOperators) {
      // Match: $item, data.x, or any variable name (e.g. btc_ticker.data.last)
      const evaluated = expression.replace(
        /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)*(?:\[[0-9]+\])*|\$item(?:\.[a-zA-Z0-9_]+)*(?:\[[0-9]+\])*)/g,
        (varMatch) => {
          let value: unknown;

          if (varMatch.startsWith("$item")) {
            // Handle $item.field or $item[0]
            let path = varMatch.replace("$item", "");
            path = path.replace(/\[/g, ".").replace(/\]/g, "");
            if (path.startsWith(".")) {
              path = path.slice(1);
            }
            value = getValue(item, path);
          } else {
            // Handle any variable name: btc_ticker.data.last, sol_ticker.data.last, etc.
            const path = varMatch.replace(/\[/g, ".").replace(/\]/g, "");
            value = getValue(data, path);
          }

          return String(value ?? "0");
        },
      );

      try {
        // Validate expression before evaluation
        if (!evaluated.trim() || evaluated.includes("undefined")) {
          return "NaN";
        }
        
        const result = new Function(`return ${evaluated}`)();
        
        // Check for valid result
        if (result === undefined || result === null || !isFinite(Number(result))) {
          return "NaN";
        }
        
        return String(result);
      } catch (error) {
        // Silently handle errors during live editing
        console.warn("[interpolate] Math evaluation error:", {
          error: error instanceof Error ? error.message : String(error),
          expression: evaluated,
        });
        return "NaN";
      }
    } else {
      // No operators - simple variable access
      let result: unknown;

      if (expression.startsWith("$item")) {
        // Handle $item.field or $item[0]
        let path = expression.replace("$item", "");
        path = path.replace(/\[/g, ".").replace(/\]/g, "");
        if (path.startsWith(".")) {
          path = path.slice(1);
        }
        result = getValue(item, path);
      } else {
        // Handle any variable path: btc_ticker.data.last, data.last, etc.
        const path = expression.replace(/\[/g, ".").replace(/\]/g, "");
        result = getValue(data, path);
      }

      return String(result ?? "");
    }
  });
};

const evaluateCondition = (
  condition: Condition,
  data: Record<string, unknown>,
  item?: unknown,
): boolean => {
  let value: unknown;

  if (condition.key.startsWith("$item")) {
    const path = condition.key
      .replace("$item.", "")
      .replace("$item", "");
    value = getValue(item, path);
  } else {
    value = getValue(data, condition.key);
  }

  switch (condition.operator) {
    case "===":
      return value === condition.value;
    case ">":
      return Number(value) > Number(condition.value);
    case "<":
      return Number(value) < Number(condition.value);
    case ">=":
      return Number(value) >= Number(condition.value);
    case "<=":
      return Number(value) <= Number(condition.value);
    default:
      return false;
  }
};

const resolveStyle = (
  style: Record<string, unknown>,
  data: Record<string, unknown>,
  item?: unknown,
): React.CSSProperties => {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(style)) {
    if (
      typeof value === "object" &&
      value !== null &&
      "condition" in value &&
      "true" in value &&
      "false" in value
    ) {
      const condValue = value as {
        condition: Condition;
        true: unknown;
        false: unknown;
      };
      resolved[key] = evaluateCondition(condValue.condition, data, item)
        ? condValue.true
        : condValue.false;
    } else if (
      typeof value === "object" &&
      value !== null &&
      "calculate" in value
    ) {
      const calcValue = value as {
        calculate: string;
        value: string;
        max: string;
      };

      if (calcValue.calculate === "percentage") {
        const valueStr = interpolate(calcValue.value, data, item);
        const maxStr = interpolate(calcValue.max, data, item);
        const numValue = parseFloat(valueStr);
        const numMax = parseFloat(maxStr);

        if (!isNaN(numValue) && !isNaN(numMax) && numMax > 0) {
          const percentage = (numValue / numMax) * 100;
          resolved[key] = `${percentage.toFixed(2)}%`;
        } else {
          resolved[key] = "0%";
        }
      }
    } else {
      resolved[key] = value;
    }
  }

  return resolved as React.CSSProperties;
};

// ============================================================================
// Main UIRenderer Component (Optimized & Professional)
// ============================================================================

export const UIRenderer: React.FC<{
  schema: UINode;
  data: Record<string, unknown>;
}> = ({ schema, data }) => {
  const engineContext = useContext(UIEngineContextInstance);
  const dispatcher = useMemo(() => ActionDispatcher.getInstance(), []);

  // Initialize dispatcher with engine context
  useEffect(() => {
    if (engineContext) {
      dispatcher.setEngineContext(engineContext);
    }
  }, [engineContext, dispatcher]);

  // Memoize render node function for performance
  const renderNode = useCallback(
    (
      node: UINode,
      index: number,
      iterationItem?: unknown,
    ): React.ReactNode => {
      // Conditional rendering check
      if (
        node.condition &&
        !evaluateCondition(node.condition, data, iterationItem)
      ) {
        return null;
      }

      const { type, className, style, children, text, iterate, events } = node;
      const Element = type as keyof React.JSX.IntrinsicElements;

      // Resolve dynamic styles
      const resolvedStyle = style
        ? resolveStyle(style, data, iterationItem)
        : undefined;

      // Process text content with interpolation and formatting
      let content: string | null = null;
      if (text) {
        if (node.format) {
          content = text.replace(
            /\$?\{([^}]+)\}/g,
            (_match, expression: string) => {
              const interpolated = interpolate(
                `{${expression}}`,
                data,
                iterationItem,
              );
              return formatValue(interpolated, node.format!);
            },
          );
        } else {
          content = interpolate(text, data, iterationItem);
        }
      }

      // Handle array iteration
      if (iterate) {
        const items = getValue(data, iterate.source);
        if (!Array.isArray(items)) return null;

        const limited = items.slice(0, iterate.limit || items.length);
        const ordered = iterate.reverse ? [...limited].reverse() : limited;

        return ordered.map((item: unknown, idx: number) =>
          renderNode({ ...node, iterate: undefined }, idx, item),
        );
      }

      // Render child nodes
      const childNodes = children?.map((child: UINode, idx: number) =>
        renderNode(child, idx, iterationItem),
      );

      // Build event handlers with dispatcher integration
      const eventHandlers: Record<string, (e: React.MouseEvent) => void> = {};

      if (events?.onClick) {
        eventHandlers.onClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          dispatcher.dispatch(events.onClick!);
        };
      }

      if (events?.onDoubleClick) {
        eventHandlers.onDoubleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          dispatcher.dispatch(events.onDoubleClick!);
        };
      }

      if (events?.onMouseEnter) {
        eventHandlers.onMouseEnter = () => {
          dispatcher.dispatch(events.onMouseEnter!);
        };
      }

      if (events?.onMouseLeave) {
        eventHandlers.onMouseLeave = () => {
          dispatcher.dispatch(events.onMouseLeave!);
        };
      }

      // Create React element with all props
      return React.createElement(
        Element,
        { key: index, className, style: resolvedStyle, ...eventHandlers },
        content,
        childNodes,
      );
    },
    [data, dispatcher],
  );

  // Render the root node
  return React.createElement(React.Fragment, null, renderNode(schema, 0));
};

// Export with UIEngineProvider wrapper for convenience
export const UIRendererWithEngine: React.FC<{
  schema: UINode;
  data: Record<string, unknown>;
}> = ({ schema, data }) => {
  return React.createElement(
    UIEngineProvider,
    null,
    React.createElement(UIRenderer, { schema, data }),
  );
};

export default UIRenderer;

