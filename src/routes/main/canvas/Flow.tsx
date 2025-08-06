import type React from "react";

import ReactFlow, {
  addEdge, Background,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import MacOSNode from "@/routes/main/canvas/MacOSNode.tsx";
import { ChevronDown, ChevronRight, Filter, ShoppingBag } from "lucide-react";
import { cleanBrands, cn } from "@/lib/utils";
import Graphite from "@/components/ui/vectors/logos/Graphite.tsx";

const NODES_STORAGE_KEY = "stels-canvas-nodes";
const EDGES_STORAGE_KEY = "stels-canvas-edges";

interface FlowNodeData {
  channel: string;
  label: string;
  onDelete: (nodeId: string) => void;
  sessionData?: unknown;
}

type FlowNode = Node<FlowNodeData>;

const defaultNodes: any[] = [
  {
    "id": "node-1754455771395",
    "type": "custom",
    "position": {
      "x": -1155,
      "y": 1440
    },
    "data": {
      "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.BTC/USDT:USDT.book",
      "label": "testnet.runtime.connector.exchange.crypto.bybit.futures.BTC/USDT:USDT.book",
      "sessionData": {
        "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.BTC/USDT:USDT.book",
        "module": "book",
        "widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.futures.BTC/USDT:USDT.book",
        "raw": {
          "exchange": "bybit",
          "market": "BTC/USDT:USDT",
          "bids": [
            [
              113388,
              4.942
            ],
            [
              113387.8,
              0.002
            ],
            [
              113387.7,
              0.101
            ],
            [
              113386.9,
              0.12
            ],
            [
              113386.5,
              0.009
            ],
            [
              113386.4,
              0.171
            ],
            [
              113386,
              0.001
            ],
            [
              113384.9,
              0.002
            ],
            [
              113384.6,
              0.018
            ],
            [
              113384.5,
              0.021
            ]
          ],
          "asks": [
            [
              113388.1,
              0.39
            ],
            [
              113388.3,
              0.001
            ],
            [
              113389.6,
              0.005
            ],
            [
              113390,
              0.001
            ],
            [
              113392.3,
              0.009
            ],
            [
              113392.5,
              0.061
            ],
            [
              113392.7,
              0.143
            ],
            [
              113393,
              0.001
            ],
            [
              113393.4,
              0.001
            ],
            [
              113393.5,
              0.001
            ]
          ],
          "volume": [
            5.3870000000000005,
            0.613
          ],
          "timestamp": 1754455761121,
          "latency": 5275
        },
        "timestamp": 1754455761121
      }
    },
    "dragHandle": ".drag-handle",
    "width": 452,
    "height": 658,
    "selected": false,
    "positionAbsolute": {
      "x": -1155,
      "y": 1440
    },
    "dragging": false
  },
  {
    "id": "node-1754455954167",
    "type": "custom",
    "position": {
      "x": -690,
      "y": 1440
    },
    "data": {
      "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.XRP/USDT:USDT.book",
      "label": "testnet.runtime.connector.exchange.crypto.bybit.futures.XRP/USDT:USDT.book",
      "sessionData": {
        "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.XRP/USDT:USDT.book",
        "module": "book",
        "widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.futures.XRP/USDT:USDT.book",
        "raw": {
          "exchange": "bybit",
          "market": "XRP/USDT:USDT",
          "bids": [
            [
              2.9102,
              18304
            ],
            [
              2.91,
              8840
            ],
            [
              2.9099,
              8663
            ],
            [
              2.9098,
              18830
            ],
            [
              2.9097,
              22763
            ],
            [
              2.9096,
              37451
            ],
            [
              2.9095,
              16133
            ],
            [
              2.9094,
              35656
            ],
            [
              2.9093,
              22856
            ],
            [
              2.9092,
              32971
            ]
          ],
          "asks": [
            [
              2.9103,
              5523
            ],
            [
              2.9104,
              8140
            ],
            [
              2.9105,
              35858
            ],
            [
              2.9106,
              19018
            ],
            [
              2.9107,
              83828
            ],
            [
              2.9108,
              56206
            ],
            [
              2.9109,
              41962
            ],
            [
              2.911,
              25998
            ],
            [
              2.9111,
              12130
            ],
            [
              2.9112,
              51639
            ]
          ],
          "volume": [
            222467,
            340302
          ],
          "timestamp": 1754455946640,
          "latency": 1684
        },
        "timestamp": 1754455946640
      }
    },
    "dragHandle": ".drag-handle",
    "width": 452,
    "height": 658,
    "selected": false,
    "positionAbsolute": {
      "x": -690,
      "y": 1440
    },
    "dragging": false
  },
  {
    "id": "node-1754455998281",
    "type": "custom",
    "position": {
      "x": -225,
      "y": 1440
    },
    "data": {
      "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.JASMY/USDT:USDT.book",
      "label": "testnet.runtime.connector.exchange.crypto.bybit.futures.JASMY/USDT:USDT.book",
      "sessionData": {
        "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.JASMY/USDT:USDT.book",
        "module": "book",
        "widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.futures.JASMY/USDT:USDT.book",
        "raw": {
          "exchange": "bybit",
          "market": "JASMY/USDT:USDT",
          "bids": [
            [
              0.01422,
              918
            ],
            [
              0.014219,
              5525
            ],
            [
              0.014218,
              8478
            ],
            [
              0.014217,
              65974
            ],
            [
              0.014216,
              67165
            ],
            [
              0.014215,
              66782
            ],
            [
              0.014214,
              71655
            ],
            [
              0.014213,
              74225
            ],
            [
              0.014212,
              95134
            ],
            [
              0.014211,
              89281
            ]
          ],
          "asks": [
            [
              0.014221,
              2644
            ],
            [
              0.014222,
              30467
            ],
            [
              0.014223,
              55842
            ],
            [
              0.014224,
              49898
            ],
            [
              0.014225,
              47047
            ],
            [
              0.014226,
              73197
            ],
            [
              0.014227,
              56733
            ],
            [
              0.014228,
              97143
            ],
            [
              0.014229,
              79416
            ],
            [
              0.01423,
              159641
            ]
          ],
          "volume": [
            545137,
            652028
          ],
          "timestamp": 1754455992784,
          "latency": 1875
        },
        "timestamp": 1754455992784
      }
    },
    "dragHandle": ".drag-handle",
    "width": 452,
    "height": 658,
    "positionAbsolute": {
      "x": -225,
      "y": 1440
    },
    "selected": false,
    "dragging": false
  },
  {
    "id": "node-1754456013118",
    "type": "custom",
    "position": {
      "x": -1155,
      "y": 2115
    },
    "data": {
      "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.ETH/USDT:USDT.book",
      "label": "testnet.runtime.connector.exchange.crypto.bybit.futures.ETH/USDT:USDT.book",
      "sessionData": {
        "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.ETH/USDT:USDT.book",
        "module": "book",
        "widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.futures.ETH/USDT:USDT.book",
        "raw": {
          "exchange": "bybit",
          "market": "ETH/USDT:USDT",
          "bids": [
            [
              3573.89,
              216.85
            ],
            [
              3573.88,
              6.74
            ],
            [
              3573.86,
              72.03
            ],
            [
              3573.85,
              10.09
            ],
            [
              3573.82,
              0.14
            ],
            [
              3573.81,
              0.02
            ],
            [
              3573.8,
              2.31
            ],
            [
              3573.78,
              4.4
            ],
            [
              3573.77,
              0.1
            ],
            [
              3573.76,
              0.4
            ]
          ],
          "asks": [
            [
              3573.9,
              0.01
            ],
            [
              3573.94,
              3.81
            ],
            [
              3573.99,
              0.01
            ],
            [
              3574,
              0.01
            ],
            [
              3574.01,
              0.02
            ],
            [
              3574.04,
              0.01
            ],
            [
              3574.08,
              0.01
            ],
            [
              3574.11,
              1.67
            ],
            [
              3574.12,
              9.02
            ],
            [
              3574.13,
              12.53
            ]
          ],
          "volume": [
            313.0799999999999,
            27.099999999999998
          ],
          "timestamp": 1754456008937,
          "latency": 1237
        },
        "timestamp": 1754456008937
      }
    },
    "dragHandle": ".drag-handle",
    "width": 452,
    "height": 658,
    "selected": false,
    "positionAbsolute": {
      "x": -1155,
      "y": 2115
    },
    "dragging": false
  },
  {
    "id": "node-1754456030840",
    "type": "custom",
    "position": {
      "x": -225,
      "y": 2115
    },
    "data": {
      "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.SOL/USDT:USDT.book",
      "label": "testnet.runtime.connector.exchange.crypto.bybit.futures.SOL/USDT:USDT.book",
      "sessionData": {
        "channel": "testnet.runtime.connector.exchange.crypto.bybit.futures.SOL/USDT:USDT.book",
        "module": "book",
        "widget": "widget.testnet.runtime.connector.exchange.crypto.bybit.futures.SOL/USDT:USDT.book",
        "raw": {
          "exchange": "bybit",
          "market": "SOL/USDT:USDT",
          "bids": [
            [
              162.38,
              114.3
            ],
            [
              162.37,
              271.4
            ],
            [
              162.36,
              553.4
            ],
            [
              162.35,
              1466.3
            ],
            [
              162.34,
              1892
            ],
            [
              162.33,
              1581.3
            ],
            [
              162.32,
              1739.2
            ],
            [
              162.31,
              1474
            ],
            [
              162.3,
              2029.7
            ],
            [
              162.29,
              944.4
            ]
          ],
          "asks": [
            [
              162.39,
              325.1
            ],
            [
              162.4,
              1655.4
            ],
            [
              162.41,
              1809.8
            ],
            [
              162.42,
              1804.1
            ],
            [
              162.43,
              1069.7
            ],
            [
              162.44,
              1437.6
            ],
            [
              162.45,
              1755.9
            ],
            [
              162.46,
              1273.6
            ],
            [
              162.47,
              2108.7
            ],
            [
              162.48,
              1893.3
            ]
          ],
          "volume": [
            12066,
            15133.199999999997
          ],
          "timestamp": 1754456024728,
          "latency": 2349
        },
        "timestamp": 1754456024728
      }
    },
    "dragHandle": ".drag-handle",
    "width": 452,
    "height": 658,
    "selected": false,
    "positionAbsolute": {
      "x": -225,
      "y": 2115
    },
    "dragging": false
  }
];

/**
 * Widget data structure from session storage
 */
export interface WidgetData {
  module: string;
  channel: string;
  timestamp: number | string | object;

  [key: string]: unknown;
}

/**
 * Session storage data structure
 */
export interface SessionStore {
  [key: string]: WidgetData;
}

/**
 * Props for the DockItem component
 */
interface DockItemProps {
  /** Icon to display in the dock */
  icon: React.ReactNode;
  /** Label to display in the tooltip */
  label: string;
  /** Whether the item is currently active */
  isActive?: boolean;
  /** Callback when the item is clicked */
  onClick: () => void;
}

/**
 * Props for the MacOSDock component
 */
interface MacOSDockProps {
  /** Callback to open the widget store */
  onOpenWidgetStore: () => void;
  /** Whether the widget store is currently open */
  isWidgetStoreOpen: boolean;
}

/**
 * Props for the GroupHeader component
 */
interface GroupHeaderProps {
  /** Title of the group */
  title: string;
  /** Number of items in the group */
  count: number;
  /** Whether the group is currently expanded */
  isOpen: boolean;
  /** Callback when the group is toggled */
  onToggle: () => void;
  /** Indentation level (0 for top level) */
  level?: number;
}

/**
 * Props for the ItemStore component
 */
interface ItemStoreProps {
  /** Key of the widget in session storage */
  keyStore: string;
  /** Callback when drag starts */
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    keyStore: string,
  ) => void;
  /** Indentation level for nested items */
  indentLevel?: number;
}

/**
 * Props for the Tab component
 */
interface TabProps {
  /** Label to display in the tab */
  label: string;
  /** Whether the tab is currently active */
  isActive: boolean;
  /** Callback when the tab is clicked */
  onClick: () => void;
  /** Number of items in the tab */
  count: number;
}

/**
 * Type for grouped widgets by exchange and asset
 */
type GroupedWidgets = {
  [exchange: string]: {
    [asset: string]: string[];
  };
};

/**
 * Type for widget categories
 */
type WidgetCategories = Record<string, string[]>;

/**
 * Type for grouping mode
 */
type GroupingMode = "exchange" | "asset";

/**
 * Helper function to extract category from widget key
 */
function extractNetwork(key: string): string {
  const parts = key.split(".");
  return parts[1];
}

/**
 * Dock Item Component
 */
function DockItem(
  { icon, label, isActive = false, onClick }: DockItemProps,
): React.ReactElement {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <div className="group relative flex flex-col items-center">
      <div
        className={cn(
          "absolute bottom-full mb-2 rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity",
          (isHovered || isActive) && "opacity-100",
        )}
      >
        {label}
      </div>

      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white/20",
          isActive && "bg-white/30",
        )}
      >
        {icon}
      </button>
      {isActive && <div className="mt-1 h-1 w-1 rounded-full bg-white" />}
    </div>
  );
}

/**
 * macOS Dock Component
 */
function MacOSDock(
  { onOpenWidgetStore, isWidgetStoreOpen }: MacOSDockProps,
): React.ReactElement {
  return (
    <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-black/20 p-2 backdrop-blur-lg">
      <div className="flex items-center space-x-2">
        <DockItem
          icon={<ShoppingBag className="h-6 w-6" />}
          label="Widget Store"
          isActive={isWidgetStoreOpen}
          onClick={onOpenWidgetStore}
        />
      </div>
    </div>
  );
}

/**
 * Group Header Component
 */
function GroupHeader(
  { title, count, isOpen, onToggle, level = 0 }: GroupHeaderProps,
): React.ReactElement {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
        level === 0
          ? "bg-zinc-200/50 dark:bg-zinc-700/50"
          : "bg-zinc-100/50 dark:bg-zinc-800/50",
        level === 0 ? "sticky top-0" : "",
      )}
      style={{ paddingLeft: `${level * 8 + 8}px` }}
    >
      <div className="flex items-center">
        {isOpen
          ? <ChevronDown className="h-4 w-4 mr-1 text-zinc-500" />
          : <ChevronRight className="h-4 w-4 mr-1 text-zinc-500" />}
        <span
          className={cn("font-medium", level === 0 ? "text-sm" : "text-xs")}
        >
          {title}
        </span>
      </div>
      <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
        {count}
      </span>
    </div>
  );
}

/**
 * Item Store Component
 */
function ItemStore(
  { keyStore, onDragStart, indentLevel = 0 }: ItemStoreProps,
): React.ReactElement {
  const session = useSessionStoreSync() as SessionStore | null;

  if (!session) return <div>Loading Session....</div> as React.ReactElement;

  const widget = session[keyStore];

  if (!widget || !widget.module) {
    return <div>Invalid widget data</div> as React.ReactElement;
  }

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, keyStore)}
      onTouchStart={(event: React.TouchEvent<HTMLDivElement>) => {
        onDragStart(
          event as unknown as React.DragEvent<HTMLDivElement>,
          keyStore,
        );
      }}
      className="flex bg-amber-600 text-black touch-auto text-sm justify-between items-center p-2 border-b cursor-grab"
      style={{ paddingLeft: `${indentLevel * 8 + 8}px` }}
    >
      <div>
        <div>
          <div>Module: {widget.module}</div>
          <div className="text-[10px]">Channel: {widget.channel}</div>
        </div>
        <code>
          <pre>{JSON.stringify(widget.timestamp, null, 2)}</pre>
        </code>
      </div>
    </div>
  );
}

/**
 * Tab Component
 */
function Tab(
  { label, isActive, onClick, count }: TabProps,
): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "border-b-2 border-amber-500 text-amber-500"
          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300",
      )}
    >
      {label}{" "}
      {count > 0 && (
        <span className="ml-1 rounded-full px-2 py-0.5 text-xs dark:bg-zinc-700">
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Main Flow Component
 */
function Flow(): React.ReactElement | null {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [isWidgetStoreOpen, setIsWidgetStoreOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedExchanges, setExpandedExchanges] = useState<
    Record<string, boolean>
  >({});
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>(
    {},
  );
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("exchange");

  const session = useSessionStoreSync() as SessionStore | null;
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    try {
      const savedNodes = localStorage.getItem(NODES_STORAGE_KEY);
      const savedEdges = localStorage.getItem(EDGES_STORAGE_KEY);

      if (savedNodes) {
        const parsedNodes = JSON.parse(savedNodes);
        const nodesWithFunctions = parsedNodes.map((node: FlowNode) => ({
          ...node,
          data: {
            ...node.data,
            onDelete: handleDeleteNode,
          },
        }));
        setNodes(nodesWithFunctions);
      } else {
        localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(defaultNodes));
        const parsedNodes = defaultNodes;
        const nodesWithFunctions = parsedNodes.map((node: FlowNode) => ({
          ...node,
          data: {
            ...node.data,
            onDelete: handleDeleteNode,
          },
        }));
        setNodes(nodesWithFunctions);
      }

      if (savedEdges) {
        setEdges(JSON.parse(savedEdges));
      }
    } catch (error) {
      console.error("Error loading flow data from localStorage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (nodes.length > 0) {
      const nodesToSave = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: undefined,
        },
      }));
      localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodesToSave));
    }
    cleanBrands();
  }, [nodes]);

  useEffect(() => {
    if (edges.length > 0) {
      localStorage.setItem(EDGES_STORAGE_KEY, JSON.stringify(edges));
    }
  }, [edges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        localStorage.setItem(EDGES_STORAGE_KEY, JSON.stringify(newEdges));
        return newEdges;
      });
    },
    [setEdges],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const updatedNodes = nds.filter((node) => node.id !== nodeId);
        setEdges((edges) => {
          const updatedEdges = edges.filter((edge) =>
            edge.source !== nodeId && edge.target !== nodeId
          );
          localStorage.setItem(EDGES_STORAGE_KEY, JSON.stringify(updatedEdges));
          return updatedEdges;
        });

        if (updatedNodes.length === 0) {
          localStorage.removeItem(NODES_STORAGE_KEY);
        } else {
          const nodesToSave = updatedNodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              onDelete: undefined,
            },
          }));
          localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodesToSave));
        }

        return updatedNodes;
      });
    },
    [setNodes, setEdges],
  );

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    key: string,
  ): void => {
    event.dataTransfer.setData("application/reactflow", key);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    const key = event.dataTransfer.getData("application/reactflow");
    const sessionData = sessionStorage.getItem(key);
    if (!sessionData) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNodeId = `node-${Date.now()}`;

    const newNode = {
      id: newNodeId,
      type: "custom",
      position,
      data: {
        channel: key,
        label: key,
        onDelete: handleDeleteNode,
        sessionData: JSON.parse(sessionData),
      },
      dragHandle: ".drag-handle",
    };

    setNodes((prevNodes) => {
      const updatedNodes = [...prevNodes, newNode];
      const nodesToSave = updatedNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: undefined,
        },
      }));
      localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodesToSave));

      return updatedNodes;
    });
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      custom: MacOSNode,
    }),
    [],
  );

  const toggleWidgetStore = (): void => {
    setIsWidgetStoreOpen(!isWidgetStoreOpen);
  };

  const toggleExchange = (exchange: string): void => {
    setExpandedExchanges((prev) => ({
      ...prev,
      [exchange]: !prev[exchange],
    }));
  };

  const toggleAsset = (exchange: string, asset: string): void => {
    const key = `${exchange}:${asset}`;
    setExpandedAssets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const keys = Object.keys(sessionStorage);

  const widgetsByCategory = useMemo<WidgetCategories>(() => {
    const categorized: WidgetCategories = { All: [] };

    if (session) {
      keys.forEach((key) => {
        const widget = session[key];
        if (widget && widget.module) {
          // Add to "All" category
          categorized.All.push(key);

          // Add to specific category
          const category = extractNetwork(key);
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(key);
        }
      });
    }

    return categorized;
  }, [keys, session]);

  const categories = useMemo<string[]>(() => {
    return Object.keys(widgetsByCategory).sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      return a.localeCompare(b);
    });
  }, [widgetsByCategory]);

  const filteredWidgets = useMemo<string[]>(() => {
    const categoryWidgets = widgetsByCategory[activeCategory] || [];

    if (!searchTerm) {
      return categoryWidgets;
    }

    return categoryWidgets.filter((key) => {
      if (!session) return false;
      const widget = session[key];
      const searchLower = searchTerm.toLowerCase();

      return widget.module.toLowerCase().includes(searchLower) ||
        widget.channel.toLowerCase().includes(searchLower);
    });
  }, [activeCategory, searchTerm, widgetsByCategory, session]);

  const groupedWidgets = useMemo<GroupedWidgets>(() => {
    const grouped: GroupedWidgets = {};

    filteredWidgets.forEach((key) => {
      const exchange = extractNetwork(key);
      const asset = extractNetwork(key);

      if (!grouped[exchange]) {
        grouped[exchange] = {};
      }

      if (!grouped[exchange][asset]) {
        grouped[exchange][asset] = [];
      }

      grouped[exchange][asset].push(key);

      if (
        Object.keys(expandedExchanges).length === 0 &&
        Object.keys(grouped).length > 0
      ) {
        setExpandedExchanges({ [exchange]: true });
        setExpandedAssets({ [`${exchange}:${asset}`]: true });
      }
    });

    return grouped;
  }, [filteredWidgets, expandedExchanges]);

  const toggleGroupingMode = (): void => {
    setGroupingMode((prev) => (prev === "exchange" ? "asset" : "exchange"));
  };

  const renderGroupedWidgets = (): React.ReactNode => {
    if (filteredWidgets.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          {searchTerm
            ? "No widgets match your search"
            : "No widgets available in this category"}
        </div>
      );
    }

    if (groupingMode === "exchange") {
      return Object.entries(groupedWidgets).map(([exchange, assets]) => {
        const isExchangeOpen = expandedExchanges[exchange] || false;
        const exchangeWidgetCount = Object.values(assets).flat().length;

        return (
          <div key={exchange} className="border-b last:border-b-0">
            <GroupHeader
              title={`Exchange: ${exchange}`}
              count={exchangeWidgetCount}
              isOpen={isExchangeOpen}
              onToggle={() => toggleExchange(exchange)}
              level={0}
            />

            {isExchangeOpen &&
              Object.entries(assets).map(([asset, assetWidgets]) => {
                const assetKey = `${exchange}:${asset}`;
                const isAssetOpen = expandedAssets[assetKey] || false;

                return (
                  <div
                    key={assetKey}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <GroupHeader
                      title={`${asset}`}
                      count={assetWidgets.length}
                      isOpen={isAssetOpen}
                      onToggle={() => toggleAsset(exchange, asset)}
                      level={1}
                    />

                    {isAssetOpen &&
                      assetWidgets.map((keyStore) => (
                        <ItemStore
                          key={keyStore}
                          keyStore={keyStore}
                          onDragStart={(event) => onDragStart(event, keyStore)}
                          indentLevel={2}
                        />
                      ))}
                  </div>
                );
              })}
          </div>
        );
      });
    } else {
      const assetFirst: Record<string, Record<string, string[]>> = {};

      Object.entries(groupedWidgets).forEach(([exchange, assets]) => {
        Object.entries(assets).forEach(([asset, widgets]) => {
          if (!assetFirst[asset]) {
            assetFirst[asset] = {};
          }
          assetFirst[asset][exchange] = widgets;
        });
      });

      return Object.entries(assetFirst).map(([asset, exchanges]) => {
        const isAssetOpen = expandedAssets[asset] || false;
        const assetWidgetCount = Object.values(exchanges).flat().length;

        return (
          <div key={asset} className="border-b last:border-b-0">
            <GroupHeader
              title={`${asset}`}
              count={assetWidgetCount}
              isOpen={isAssetOpen}
              onToggle={() => toggleAsset("", asset)}
              level={0}
            />

            {isAssetOpen &&
              Object.entries(exchanges).map(([exchange, exchangeWidgets]) => {
                const exchangeKey = `${asset}:${exchange}`;
                const isExchangeOpen = expandedExchanges[exchangeKey] || false;

                return (
                  <div
                    key={exchangeKey}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <GroupHeader
                      title={`${exchange}`}
                      count={exchangeWidgets.length}
                      isOpen={isExchangeOpen}
                      onToggle={() => toggleExchange(exchangeKey)}
                      level={1}
                    />

                    {isExchangeOpen &&
                      exchangeWidgets.map((keyStore) => (
                        <ItemStore
                          key={keyStore}
                          keyStore={keyStore}
                          onDragStart={(event) => onDragStart(event, keyStore)}
                          indentLevel={2}
                        />
                      ))}
                  </div>
                );
              })}
          </div>
        );
      });
    }
  };

  if (!session) return null;

  return (
    <div className="absolute w-[100%] h-[100%] top-0 left-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        snapToGrid={true}
        fitView
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <Background className="stels-canvas" color={"#222222"} gap={10} size={1}/>
        <div className="absolute z-1 flex justify-center items-center flex-col w-60 h-60 bottom-0 right-0">
          <div>
            <Graphite size={4} primary="orange" />
          </div>
          <div className="mt-4 text-2xl font-semibold text-zinc-800/60">
            STELS
          </div>
          <div className="mt-0 text-sm text-zinc-600/30">
            Artificial Market Intelligence
          </div>
        </div>
      </ReactFlow>

      <MacOSDock
        onOpenWidgetStore={toggleWidgetStore}
        isWidgetStoreOpen={isWidgetStoreOpen}
      />

      <div
        className={cn(
          "absolute top-4 bottom-20 right-4 z-50 w-1/3 border bg-background/90 rounded-lg overflow-hidden transition-all duration-300 transform backdrop-blur-md",
          isWidgetStoreOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0",
        )}
      >
        <div className="border-b p-3 flex justify-between items-center bg-muted/80">
          <div className="flex items-center">
            <ShoppingBag className="h-4 w-4 mr-2" />
            <h3 className="font-semibold">Widget Store</h3>
          </div>
          <div className="flex space-x-2">
            <button
              className="h-3 w-3 rounded-full bg-[#febc2e]"
              onClick={() => {
              }}
            />
            <button
              className="h-3 w-3 rounded-full bg-[#ff5f57]"
              onClick={toggleWidgetStore}
            />
          </div>
        </div>

        <div className="p-3 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-9 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            </div>
            <button
              onClick={toggleGroupingMode}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-medium"
            >
              Group by: {groupingMode === "exchange" ? "Exchange" : "Asset"}
            </button>
          </div>
        </div>

        <div className="border-b overflow-x-auto">
          <div className="flex whitespace-nowrap">
            {categories.map((category) => (
              <Tab
                key={category}
                label={category}
                isActive={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                count={widgetsByCategory[category]?.length || 0}
              />
            ))}
          </div>
        </div>

        <div className="h-[calc(100%-144px)] overflow-y-auto">
          {renderGroupedWidgets()}
        </div>
      </div>
    </div>
  );
}

export default Flow;
