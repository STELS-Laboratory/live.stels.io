import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

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
import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import MacOSNode from "@/routes/main/Canvas/MacOSNode";
import { Network, Settings, ShoppingBag } from "lucide-react";
import { cleanBrands, cn } from "@/lib/utils";
import Graphite from "@/components/ui/vectors/logos/Graphite";
import {
	type FlowNode,
	type FlowNodeData,
	type SessionStore,
} from "@/lib/canvas-types";
import { useCanvasUIStore } from "@/stores/modules/canvas-ui.store";
import { usePanelStore } from "@/stores/modules/panel.store";
import { PanelTabs } from "@/components/panels/PanelTabs";
import { PanelManager } from "@/components/panels/PanelManager";
import { WidgetStore } from "@/components/widgets/WidgetStore";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DropZoneIndicator } from "@/components/widgets/DragPreview";
import { useAutoConnections } from "@/hooks/useAutoConnections";
import GroupedEdge from "@/components/widgets/GroupedEdge";
import AutoConnectionsSettings from "@/components/widgets/AutoConnectionsSettings";

// Define nodeTypes and edgeTypes outside component to avoid React Flow warnings
const nodeTypes: NodeTypes = {
	custom: MacOSNode,
};

const edgeTypes = {
	grouped: GroupedEdge,
};

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
	/** Callback to open panel manager */
	onOpenPanelManager: () => void;
	/** Whether panel manager is open */
	isPanelManagerOpen: boolean;
	/** Callback to toggle auto connections */
	onToggleAutoConnections?: () => void;
	/** Whether auto connections are enabled */
	isAutoConnectionsEnabled: boolean;
	/** Callback to toggle auto connections settings */
	onToggleAutoConnectionsSettings: () => void;
	/** Whether auto connections settings are open */
	isAutoConnectionsSettingsOpen: boolean;
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
					"absolute bottom-full mb-2 rounded-md bg-popover/95 px-2 py-1 text-xs text-foreground opacity-0 transition-opacity border border-border/50",
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
	{
		onOpenWidgetStore,
		isWidgetStoreOpen,
		onOpenPanelManager,
		isPanelManagerOpen,
		isAutoConnectionsEnabled,
		onToggleAutoConnectionsSettings,
		isAutoConnectionsSettingsOpen,
	}: MacOSDockProps,
): React.ReactElement {
	return (
		<div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-background/80 p-2 backdrop-blur-lg border border-border/30">
			<div className="flex items-center space-x-2">
				<DockItem
					icon={<ShoppingBag className="h-6 w-6" />}
					label="Widget Store"
					isActive={isWidgetStoreOpen}
					onClick={onOpenWidgetStore}
				/>
				<DockItem
					icon={<Network className="h-6 w-6" />}
					label="Auto Connections"
					isActive={isAutoConnectionsEnabled || isAutoConnectionsSettingsOpen}
					onClick={onToggleAutoConnectionsSettings}
				/>
				<DockItem
					icon={<Settings className="h-6 w-6" />}
					label="Panel Manager"
					isActive={isPanelManagerOpen}
					onClick={onOpenPanelManager}
				/>
			</div>
		</div>
	);
}

/**
 * Main Flow Component with Panels
 */
function FlowWithPanels(): React.ReactElement | null {
	const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	// Use UI store for widget store state
	const {
		isOpen: isWidgetStoreOpen,
		toggleWidgetStore,
	} = useCanvasUIStore();

	// Use panel store for panel management
	const {
		panels,
		activePanelId,
		getActivePanel,
		getPanelData,
		updatePanelData,
		createPanel,
	} = usePanelStore();

	const [isPanelManagerOpen, setIsPanelManagerOpen] = useState(false);
	const [isPanelTransitioning, setIsPanelTransitioning] = useState(false);
	const [isAutoConnectionsSettingsOpen, setIsAutoConnectionsSettingsOpen] =
		useState(false);

	// Enhanced drag and drop
	const { dragState, handleDragOver, handleDragLeave } = useDragAndDrop();

	// Auto connections hook
	const {
		isEnabled: isAutoConnectionsEnabled,
		toggleAutoConnections,
		allEdges,
		stats: connectionStats,
		config: autoConnectionsConfig,
		updateConfig: updateAutoConnectionsConfig,
	} = useAutoConnections(nodes, edges);

	const session = useSessionStoreSync() as SessionStore | null;
	const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
	const { screenToFlowPosition } = useReactFlow();
	const viewportSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const nodesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const edgesSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Debounced save functions
	const debouncedSaveViewport = useCallback(
		(viewport: { x: number; y: number; zoom: number }) => {
			if (viewportSaveTimeoutRef.current) {
				clearTimeout(viewportSaveTimeoutRef.current);
			}

			viewportSaveTimeoutRef.current = setTimeout(() => {
				if (activePanelId) {
					updatePanelData(activePanelId, { viewport });
				}
			}, 300);
		},
		[activePanelId, updatePanelData],
	);

	const debouncedSaveNodes = useCallback(
		(currentNodes: FlowNode[]) => {
			if (nodesSaveTimeoutRef.current) {
				clearTimeout(nodesSaveTimeoutRef.current);
			}

			nodesSaveTimeoutRef.current = setTimeout(() => {
				if (activePanelId) {
					updatePanelData(activePanelId, {
						nodes: currentNodes.map((node) => ({
							...node,
							data: {
								...node.data,
								onDelete: undefined as any,
							},
						})),
					});
				}
			}, 300);
		},
		[activePanelId, updatePanelData],
	);

	const debouncedSaveEdges = useCallback((currentEdges: Edge[]) => {
		if (edgesSaveTimeoutRef.current) {
			clearTimeout(edgesSaveTimeoutRef.current);
		}

		edgesSaveTimeoutRef.current = setTimeout(() => {
			if (activePanelId) {
				// Save only manual edges, auto edges are generated dynamically
				const manualEdges = currentEdges.filter((edge) =>
					!edge.id.startsWith("auto-")
				);
				updatePanelData(activePanelId, { edges: manualEdges });
			}
		}, 300);
	}, [activePanelId, updatePanelData]);

	// Cleanup timeouts on unmount
	useEffect(() => {
		return () => {
			if (viewportSaveTimeoutRef.current) {
				clearTimeout(viewportSaveTimeoutRef.current);
			}
			if (nodesSaveTimeoutRef.current) {
				clearTimeout(nodesSaveTimeoutRef.current);
			}
			if (edgesSaveTimeoutRef.current) {
				clearTimeout(edgesSaveTimeoutRef.current);
			}
		};
	}, []);

	// Initialize default panel if none exist
	useEffect(() => {
		if (panels.length === 0) {
			createPanel("Default Panel", "Main workspace panel");
		}
	}, [panels.length, createPanel]);

	// Load panel data when active panel changes with smooth transition
	useEffect(() => {
		if (activePanelId) {
			setIsPanelTransitioning(true);

			// Add a small delay for smooth transition
			const transitionTimeout = setTimeout(() => {
				const panelData = getPanelData(activePanelId);
				if (panelData) {
					// Load nodes and add delete handler with fade-in animation
					const nodesWithFunctions = panelData.nodes.map((
						node: FlowNode,
						index,
					) => ({
						...node,
						style: {
							...node.style,
							opacity: 0,
							transition: `opacity 0.3s ease-in-out ${index * 0.05}s`,
						},
						data: {
							...node.data,
							onDelete: handleDeleteNode,
							// Restore session data from current session
							sessionData: session?.[node.data.channel] ||
								node.data.sessionData,
						},
					}));
					setNodes(nodesWithFunctions);
					setEdges(panelData.edges);

					// Animate nodes fade-in
					setTimeout(() => {
						setNodes((currentNodes) =>
							currentNodes.map((node) => ({
								...node,
								style: {
									...node.style,
									opacity: 1,
								},
							}))
						);
					}, 100);

					// Restore viewport for this panel with smooth animation
					if (panelData.viewport && reactFlowInstance.current) {
						setTimeout(() => {
							reactFlowInstance.current?.setViewport(panelData.viewport, {
								duration: 600, // Smooth animation
							});
							// Complete transition after viewport animation
							setTimeout(() => {
								setIsPanelTransitioning(false);
							}, 650);
						}, 100);
					} else {
						// Complete transition after nodes animation
						setTimeout(() => {
							setIsPanelTransitioning(false);
						}, 400);
					}
				} else {
					// No data for this panel, start with empty state
					setNodes([]);
					setEdges([]);
					// Quick transition for empty panel
					setTimeout(() => {
						setIsPanelTransitioning(false);
					}, 200);
				}
			}, 150); // Small delay for transition

			return () => clearTimeout(transitionTimeout);
		} else {
			// No active panel, start with empty state
			setNodes([]);
			setEdges([]);
			setIsPanelTransitioning(false);
		}
	}, [activePanelId, getPanelData]);

	// Clean brands on mount
	useEffect(() => {
		cleanBrands();
	}, []);

	// Update nodes with fresh session data when session changes
	useEffect(() => {
		if (session && nodes.length > 0) {
			setNodes((currentNodes) =>
				currentNodes.map((node) => {
					const newSessionData = session[node.data.channel];
					// Only update if session data actually changed
					if (newSessionData && newSessionData !== node.data.sessionData) {
						return {
							...node,
							data: {
								...node.data,
								sessionData: newSessionData,
							},
						};
					}
					return node;
				})
			);
		}
	}, [session]);

	const onConnect = useCallback(
		(params: Edge | Connection) => {
			setEdges((eds) => {
				const newEdges = addEdge(params, eds);
				// Save new edges to panel data
				debouncedSaveEdges(newEdges);
				return newEdges;
			});
		},
		[setEdges, debouncedSaveEdges],
	);

	const handleDeleteNode = useCallback(
		(nodeId: string) => {
			setNodes((nds) => {
				const updatedNodes = nds.filter((node) => node.id !== nodeId);
				// Save updated nodes to panel data
				debouncedSaveNodes(updatedNodes);

				// Also remove connected edges (only manual edges)
				setEdges((edges) => {
					const updatedEdges = edges.filter((edge) =>
						edge.source !== nodeId && edge.target !== nodeId
					);
					// Save updated edges to panel data
					debouncedSaveEdges(updatedEdges);
					return updatedEdges;
				});

				return updatedNodes;
			});
		},
		[setNodes, setEdges, debouncedSaveNodes, debouncedSaveEdges],
	);

	const onDragStart = (
		event: React.DragEvent<HTMLDivElement>,
		key: string,
	): void => {
		event.dataTransfer.setData("application/reactflow", key);
		event.dataTransfer.effectAllowed = "move";
	};

	const onTouchStart = (
		_event: React.TouchEvent<HTMLDivElement>,
		key: string,
	): void => {
		// For mobile devices, we'll handle touch events differently
		// This could trigger a modal or different interaction pattern
		console.log("Touch start for widget:", key);
	};

	const onDrop = (event: React.DragEvent<HTMLDivElement>): void => {
		event.preventDefault();

		try {
			// Try to get widget data from enhanced drag
			const widgetData = JSON.parse(
				event.dataTransfer.getData("application/reactflow"),
			);

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
					channel: widgetData.channel || widgetData.widget,
					label: widgetData.module || widgetData.channel,
					onDelete: handleDeleteNode,
					sessionData: session?.[widgetData.channel || widgetData.widget] ||
						widgetData,
				},
				dragHandle: ".drag-handle",
			};

			setNodes((prevNodes) => {
				const updatedNodes = [...prevNodes, newNode];
				// Save new nodes to panel data
				debouncedSaveNodes(updatedNodes);
				return updatedNodes;
			});
		} catch (error) {
			// Fallback to old method
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
					sessionData: session?.[key] || JSON.parse(sessionData),
				},
				dragHandle: ".drag-handle",
			};

			setNodes((prevNodes) => {
				const updatedNodes = [...prevNodes, newNode];
				// Save new nodes to panel data
				debouncedSaveNodes(updatedNodes);
				return updatedNodes;
			});
		}
	};

	const onDragOverEnhanced = (event: React.DragEvent<HTMLDivElement>): void => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
		handleDragOver(event);
	};

	// Get existing widget keys from current panel
	const existingWidgets = useMemo<string[]>(() => {
		return nodes.map((node) => node.data.channel).filter(Boolean);
	}, [nodes]);

	if (!session) return null;

	const activePanel = getActivePanel();

	return (
		<div className="absolute w-[100%] h-[100%] top-0 left-0 flex flex-col transition-all duration-300 ease-in-out">
			{/* Panel tabs */}
			<PanelTabs className="flex-shrink-0" />

			{/* Main Canvas area */}
			<div
				className={cn(
					"flex-1 relative transition-all duration-300 ease-in-out",
					isPanelTransitioning ? "opacity-60" : "opacity-100",
				)}
			>
				{/* Panel transition overlay */}
				{isPanelTransitioning && (
					<div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center">
						<div className="bg-card/95 rounded-lg px-6 py-4 shadow-lg border border-border">
							<div className="flex items-center space-x-3">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500">
								</div>
								<span className="text-sm font-medium text-card-foreground">
									Loading panel...
								</span>
							</div>
						</div>
					</div>
				)}

				<ReactFlow
					nodes={nodes}
					edges={allEdges}
					onNodesChange={(changes) => {
						// Check if changes affect position or size
						const hasPositionOrSizeChanges = changes.some((change) => {
							return (
								change.type === "position" ||
								change.type === "dimensions" ||
								change.type === "select"
							);
						});

						// Debounced save nodes if there are position or size changes
						if (hasPositionOrSizeChanges) {
							debouncedSaveNodes(nodes);
						}

						onNodesChange(changes);
					}}
					onEdgesChange={(changes) => {
						// Filter out auto-generated edges from changes
						const manualChanges = changes.filter((change) => {
							if ("id" in change) {
								return !change.id.startsWith("auto-");
							}
							return true;
						});

						if (manualChanges.length > 0) {
							// Debounced save edges on any manual change
							debouncedSaveEdges(edges);
							onEdgesChange(manualChanges);
						}
					}}
					onConnect={onConnect}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					snapToGrid={true}
					fitView
					onInit={(instance) => {
						reactFlowInstance.current = instance;
						// Viewport will be restored when panel data loads
					}}
					onMove={(_, viewport) => {
						// Debounced save viewport
						debouncedSaveViewport(viewport);
					}}
					onMoveEnd={(_, viewport) => {
						// Save viewport immediately on move end
						if (activePanelId) {
							updatePanelData(activePanelId, { viewport });
						}
					}}
					onDrop={onDrop}
					onDragOver={onDragOverEnhanced}
					onDragLeave={handleDragLeave}
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
						<div className="mt-0 text-sm text-muted-foreground/30">
							Artificial Market Intelligence
						</div>
						{activePanel && (
							<div className="mt-2 text-xs text-muted-foreground/50">
								Panel: {activePanel.name}
							</div>
						)}
						{isAutoConnectionsEnabled && connectionStats && (
							<div className="mt-2 text-xs text-muted-foreground/50">
								Connections: {connectionStats.edgeCount} total,{" "}
								{connectionStats.groupCount} groups
							</div>
						)}
						{/* Debug info */}
						<div className="mt-1 text-xs text-muted-foreground/30">
							Nodes: {nodes.length}, Auto edges:{" "}
							{allEdges.length - edges.length}
						</div>
						{/* Session debug */}
						<div className="mt-1 text-xs text-muted-foreground/30">
							Session keys: {session ? Object.keys(session).length : 0}
						</div>
						{/* Auto connections debug */}
						<div className="mt-1 text-xs text-muted-foreground/30">
							Auto enabled: {isAutoConnectionsEnabled ? "Yes" : "No"}
						</div>
					</div>
				</ReactFlow>

				{/* Drop Zone Indicator */}
				<DropZoneIndicator
					isActive={dragState.dropZoneActive && dragState.isDragging}
					position={dragState.mousePosition
						? {
							x: dragState.mousePosition.x - 50,
							y: dragState.mousePosition.y - 25,
							width: 100,
							height: 50,
						}
						: undefined}
				/>

				<MacOSDock
					onOpenWidgetStore={toggleWidgetStore}
					isWidgetStoreOpen={isWidgetStoreOpen}
					onOpenPanelManager={() => setIsPanelManagerOpen(true)}
					isPanelManagerOpen={isPanelManagerOpen}
					isAutoConnectionsEnabled={isAutoConnectionsEnabled}
					onToggleAutoConnectionsSettings={() =>
						setIsAutoConnectionsSettingsOpen(!isAutoConnectionsSettingsOpen)}
					isAutoConnectionsSettingsOpen={isAutoConnectionsSettingsOpen}
				/>
			</div>

			{/* Panel Manager */}
			<PanelManager
				isOpen={isPanelManagerOpen}
				onClose={() => setIsPanelManagerOpen(false)}
			/>

			{/* Widget Store */}
			<WidgetStore
				isOpen={isWidgetStoreOpen}
				onClose={toggleWidgetStore}
				onDragStart={onDragStart}
				onTouchStart={onTouchStart}
				existingWidgets={existingWidgets}
			/>

			{/* Auto Connections Settings */}
			{isAutoConnectionsSettingsOpen && (
				<div className="absolute top-4 right-4 z-30 space-y-4">
					<AutoConnectionsSettings
						config={autoConnectionsConfig}
						isEnabled={isAutoConnectionsEnabled}
						onToggle={toggleAutoConnections}
						onUpdateConfig={updateAutoConnectionsConfig}
						stats={connectionStats}
						availableKeys={[
							"exchange",
							"market",
							"asset",
							"base",
							"quote",
							"type",
							"module",
						] as any}
					/>
				</div>
			)}
		</div>
	);
}

export default FlowWithPanels;
