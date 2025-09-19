import React from "react";

import ReactFlow, {
	addEdge,
	Background,
	type Connection,
	type Edge,
	type NodeTypes,
	type ReactFlowInstance,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCallback, useEffect, useMemo, useRef } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
import { useFlowPersistence } from "@/hooks/useFlowPersistence.ts";
import MacOSNode from "@/routes/main/canvas/MacOSNode.tsx";
import { ChevronDown, ChevronRight, Filter, ShoppingBag } from "lucide-react";
import { cleanBrands, cn } from "@/lib/utils";
import Graphite from "@/components/ui/vectors/logos/Graphite.tsx";
import {
	type FlowNode,
	type FlowNodeData,
	type GroupedWidgets,
	type SessionStore,
	type WidgetCategories,
} from "@/lib/canvas-types";
import { useCanvasUIStore } from "@/stores/modules/canvas-ui.store";
import { PersistenceDebug } from "@/components/debug/PersistenceDebug";

const defaultNodes: FlowNode[] = [];

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
	const [isHovered, setIsHovered] = React.useState<boolean>(false);

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

	// Use UI store for widget store state
	const {
		isOpen: isWidgetStoreOpen,
		activeCategory,
		searchTerm,
		expandedExchanges,
		expandedAssets,
		groupingMode,
		toggleWidgetStore,
		setActiveCategory,
		setSearchTerm,
		toggleExchange,
		toggleAsset,
		setGroupingMode,
	} = useCanvasUIStore();

	const session = useSessionStoreSync() as SessionStore | null;
	const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
	const { screenToFlowPosition } = useReactFlow();

	// Flow persistence hook
	const {
		loadNodes,
		loadEdges,
		loadViewport,
		handleNodeChanges,
		handleEdgeChanges,
		handleViewportChange,
	} = useFlowPersistence();

	// Load initial data from localStorage
	useEffect(() => {
		try {
			// Load nodes and add delete handler
			const loadedNodes = loadNodes();
			const nodesWithFunctions = loadedNodes.map((node: FlowNode) => ({
				...node,
				data: {
					...node.data,
					onDelete: handleDeleteNode,
				},
			}));
			setNodes(nodesWithFunctions);

			// Load edges
			const loadedEdges = loadEdges();
			setEdges(loadedEdges);

			// Viewport will be restored in onInit callback
		} catch (error) {
			console.error("Error loading flow data:", error);
			// Fallback to default nodes
			setNodes(defaultNodes.map((node: FlowNode) => ({
				...node,
				data: {
					...node.data,
					onDelete: handleDeleteNode,
				},
			})));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Clean brands on mount
	useEffect(() => {
		cleanBrands();
	}, []);

	const onConnect = useCallback(
		(params: Edge | Connection) => {
			setEdges((eds) => {
				const newEdges = addEdge(params, eds);
				// Edges will be auto-saved by handleEdgeChanges
				return newEdges;
			});
		},
		[setEdges],
	);

	const handleDeleteNode = useCallback(
		(nodeId: string) => {
			setNodes((nds) => {
				const updatedNodes = nds.filter((node) => node.id !== nodeId);
				// Auto-save will handle saving the updated nodes

				// Also remove connected edges
				setEdges((edges) => {
					const updatedEdges = edges.filter((edge) =>
						edge.source !== nodeId && edge.target !== nodeId
					);
					// Auto-save will handle saving the updated edges
					return updatedEdges;
				});

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
			// Auto-save will handle saving the new nodes
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
		});

		return grouped;
	}, [filteredWidgets]);

	const toggleGroupingMode = (): void => {
		setGroupingMode(groupingMode === "exchange" ? "asset" : "exchange");
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
				onNodesChange={(changes) => {
					handleNodeChanges(changes, nodes);
					onNodesChange(changes);
				}}
				onEdgesChange={(changes) => {
					handleEdgeChanges(changes, edges);
					onEdgesChange(changes);
				}}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				snapToGrid={true}
				fitView
				onInit={(instance) => {
					reactFlowInstance.current = instance;
					// Restore viewport after ReactFlow is ready
					const savedViewport = loadViewport();
					if (savedViewport) {
						setTimeout(() => {
							instance.setViewport(savedViewport, { duration: 0 });
						}, 100);
					}
				}}
				onMove={(_, viewport) => {
					handleViewportChange(viewport);
				}}
				onMoveEnd={(_, viewport) => {
					handleViewportChange(viewport);
				}}
				onDrop={onDrop}
				onDragOver={onDragOver}
				minZoom={0.4}
			>
				<Background
					className="stels-canvas"
					color={"#222222"}
					gap={10}
					size={1}
				/>
				<div className="absolute z-1 flex justify-center items-center flex-col w-60 h-60 bottom-0 right-0">
					<div>
						<Graphite size={3} primary="gray" />
					</div>
					<div className="mt-4 text-xl font-semibold text-zinc-800/60">
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

			{/* Debug component for testing persistence */}
			<PersistenceDebug />

			<div
				className={cn(
					"absolute top-4 bottom-20 right-4 z-50 border bg-background/90 overflow-hidden transition-all duration-300 transform backdrop-blur-md",
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
