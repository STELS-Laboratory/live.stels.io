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
import useSessionStoreSync from "@/hooks/use_session_store_sync.ts";
import MacOSNode from "@/apps/canvas/macos_node";
import { Boxes } from "lucide-react";
import { cleanBrands } from "@/lib/utils.ts";
import Graphite from "@/components/ui/vectors/logos/graphite";
import {
	type FlowNode,
	type FlowNodeData,
	type SessionStore,
} from "@/lib/canvas-types.ts";
import { useCanvasStore } from "./store.ts";
import PanelTabsPro from "@/components/panels/panel_tabs_pro";
import { PanelManager } from "@/components/panels/panel_manager";
import { WidgetStore } from "@/components/widgets/widget_store";
import { useDragAndDrop } from "@/hooks/use_drag_and_drop.ts";
import { useDynamicAutoConnections } from "@/hooks/use_dynamic_auto_connections.ts";
import GroupedEdge from "@/components/widgets/grouped_edge";
import { AutoConnectionsPanel } from "@/components/canvas/auto_connections_panel";
import { analyzeNodeChannels } from "@/lib/auto-connections-dynamic.ts";
import { useMobile } from "@/hooks/use_mobile.ts";
import { CanvasControls } from "@/components/canvas/canvas_controls";
import {
	EmptyCanvasState,
	EnhancedDropZone,
} from "@/components/canvas/canvas_overlays";

// Define nodeTypes and edgeTypes outside component to avoid React Flow warnings
const nodeTypes: NodeTypes = {
	custom: MacOSNode,
};

const edgeTypes = {
	grouped: GroupedEdge,
};

/**
 * Main Flow Component with Panels
 */
function FlowWithPanels(): React.ReactElement | null {
	const mobile = useMobile();
	const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	// Use Canvas store for UI and panel management
	const isWidgetStoreOpen = useCanvasStore((state) => state.ui.isOpen);
	const toggleWidgetStore = useCanvasStore((state) => state.toggleWidgetStore);
	const panels = useCanvasStore((state) => state.panels.panels);
	const activePanelId = useCanvasStore((state) => state.panels.activePanelId);
	const getPanelData = useCanvasStore((state) => state.getPanelData);
	const updatePanelData = useCanvasStore((state) => state.updatePanelData);
	const createPanel = useCanvasStore((state) => state.createPanel);

	const [isPanelManagerOpen, setIsPanelManagerOpen] = useState(false);
	const [isPanelTransitioning, setIsPanelTransitioning] = useState(false);
	const [isAutoConnectionsSettingsOpen, setIsAutoConnectionsSettingsOpen] =
		useState(false);

	// Enhanced drag and drop
	const { dragState, handleDragOver, handleDragLeave } = useDragAndDrop();

	// Dynamic auto connections hook
	const {
		isEnabled: isAutoConnectionsEnabled,
		toggleAutoConnections,
		allEdges,
		stats: connectionStats,
		config: autoConnectionsConfig,
		updateConfig: updateAutoConnectionsConfig,
	} = useDynamicAutoConnections(nodes, edges);

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
								onDelete: undefined as unknown as (nodeId: string) => void,
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activePanelId, getPanelData]);

	// Clean brands on mount
	useEffect(() => {
		cleanBrands();
	}, []);

	// Keyboard shortcuts for canvas controls
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent): void => {
			// Ignore if user is typing in input field
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			switch (event.key.toLowerCase()) {
				case "s":
					toggleWidgetStore();
					break;
				case "a":
					toggleAutoConnections();
					break;
				case "p":
					setIsPanelManagerOpen((prev) => !prev);
					break;
				case "?":
					// Keyboard shortcuts help is handled in CanvasControls
					break;
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, [toggleWidgetStore, toggleAutoConnections]);

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

			// Simple: just use channel/widget key - NodeFlow will check schema
			const channelKey = widgetData.type === "schema"
				? widgetData.widgetKey
				: (widgetData.channel || widgetData.widget);

			const label = widgetData.type === "schema"
				? (widgetData.name || widgetData.widgetKey)
				: (widgetData.module || widgetData.channel);

			const newNode = {
				id: newNodeId,
				type: "custom",
				position,
				data: {
					channel: channelKey,
					label: label,
					onDelete: handleDeleteNode,
				},
				dragHandle: ".drag-handle",
			};

			setNodes((prevNodes) => {
				const updatedNodes = [...prevNodes, newNode];
				debouncedSaveNodes(updatedNodes);
				return updatedNodes;
			});
		} catch {
			// Fallback to old method
			const key = event.dataTransfer.getData("application/reactflow");
			if (!session?.[key]) return;

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
				},
				dragHandle: ".drag-handle",
			};

			setNodes((prevNodes) => {
				const updatedNodes = [...prevNodes, newNode];
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

	// Analyze channels for dynamic grouping
	const channelAnalysis = useMemo(() => {
		const analysis = analyzeNodeChannels(nodes);

		// Debug: log channel analysis
		console.log("[Canvas] Channel Analysis:", {
			nodeCount: nodes.length,
			blocksDetected: analysis.blocks.length,
			blocks: analysis.blocks.map((b) => ({
				position: b.position,
				label: b.label,
				valueCount: b.values.size,
				values: Array.from(b.values),
			})),
			suggestedBlocks: analysis.suggestedBlocks,
			channels: nodes.map((n) => n.data.channel),
		});

		return analysis;
	}, [nodes]);

	if (!session) return null;

	// Mobile warning - desktop interface required
	if (mobile) {
		return (
			<div className="h-full bg-background p-4 flex items-center justify-center">
				<div className="text-center max-w-sm mx-auto">
					<div className="w-16 h-16 bg-card rounded flex items-center justify-center mb-4 mx-auto">
						<Boxes className="w-8 h-8 text-amber-700 dark:text-amber-400" />
					</div>
					<h2 className="text-amber-700 dark:text-amber-400 font-mono text-lg font-bold mb-2">
						VISUAL WORKSPACE
					</h2>
					<p className="text-muted-foreground font-mono text-sm mb-6">
						Desktop interface required
					</p>
					<div className="p-4 bg-card/10 border border-border rounded text-left">
						<p className="text-xs text-muted-foreground mb-3">
							The Visual Workspace requires a desktop display for optimal
							workflow:
						</p>
						<ul className="text-xs text-muted-foreground space-y-2">
							<li className="flex items-start gap-2">
								<span className="text-amber-500">•</span>
								<span>Drag-and-drop canvas with ReactFlow</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-amber-500">•</span>
								<span>Multi-panel support for complex workflows</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-amber-500">•</span>
								<span>100+ widgets with real-time visualization</span>
							</li>
						</ul>
					</div>
					<p className="text-xs text-muted-foreground mt-4">
						Please open STELS on a desktop browser to access the Visual
						Workspace
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="absolute w-[100%] h-[100%] top-0 left-0 flex flex-col">
			{/* Panel tabs - Professional */}
			<PanelTabsPro className="flex-shrink-0" />

			{/* Main Canvas area - Document Style Background */}
			<div className="flex-1 relative">
				{/* Panel transition overlay - Professional design */}
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
						<div className="mt-4 text-xl font-semibold text-muted-foreground/60">
							STELS
						</div>
						<div className="mt-0 text-sm text-muted-foreground/30">
							Artificial Market Intelligence
						</div>
					</div>
				</ReactFlow>

				<EnhancedDropZone
					isActive={dragState.dropZoneActive && dragState.isDragging}
					mousePosition={dragState.mousePosition || undefined}
				/>

				{/* Empty Canvas State - Professional */}
				{nodes.length === 0 && !isPanelTransitioning && (
					<EmptyCanvasState onAddWidget={toggleWidgetStore} />
				)}

				{/* Canvas Controls - Professional Design */}
				<CanvasControls
					isWidgetStoreOpen={isWidgetStoreOpen}
					onToggleWidgetStore={toggleWidgetStore}
					isPanelManagerOpen={isPanelManagerOpen}
					onTogglePanelManager={() =>
						setIsPanelManagerOpen(!isPanelManagerOpen)}
					isAutoConnectionsEnabled={isAutoConnectionsEnabled}
					onToggleAutoConnections={toggleAutoConnections}
					isAutoConnectionsSettingsOpen={isAutoConnectionsSettingsOpen}
					onToggleAutoConnectionsSettings={() =>
						setIsAutoConnectionsSettingsOpen(!isAutoConnectionsSettingsOpen)}
					connectionStats={connectionStats}
					nodeCount={nodes.length}
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

			{/* Auto Connections Settings Panel - Professional */}
			{isAutoConnectionsSettingsOpen && (
				<div className="absolute top-14 right-4 z-30">
					<AutoConnectionsPanel
						config={autoConnectionsConfig}
						isEnabled={isAutoConnectionsEnabled}
						onToggle={toggleAutoConnections}
						onUpdateConfig={updateAutoConnectionsConfig}
						stats={connectionStats}
						availableBlocks={channelAnalysis.blocks}
						onClose={() => setIsAutoConnectionsSettingsOpen(false)}
					/>
				</div>
			)}
		</div>
	);
}

export default FlowWithPanels;
