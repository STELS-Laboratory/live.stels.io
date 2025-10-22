/**
 * Dynamic Auto Connections Hook
 * Uses channel analyzer to create flexible, user-defined connections
 */

import { useCallback, useMemo, useState } from "react";
import type { Edge } from "reactflow";
import type { FlowNode, GroupedEdgeData } from "@/lib/canvas-types";
import {
	type DynamicAutoConnectionConfig,
	defaultDynamicAutoConnectionConfig,
	filterDynamicAutoConnections,
	generateDynamicAutoConnections,
	getDynamicConnectionStats,
} from "@/lib/auto-connections-dynamic";

/**
 * Hook for managing dynamic automatic node connections
 */
export function useDynamicAutoConnections(
	nodes: FlowNode[],
	manualEdges: Edge[],
	initialConfig?: Partial<DynamicAutoConnectionConfig>,
) {
	const [config, setConfig] = useState<DynamicAutoConnectionConfig>({
		...defaultDynamicAutoConnectionConfig,
		...initialConfig,
	});

	const [isEnabled, setIsEnabled] = useState<boolean>(config.enabled);

	// Generate automatic connections
	const autoConnections = useMemo(() => {
		console.log("[useDynamicAutoConnections] State:", {
			isEnabled,
			nodeCount: nodes.length,
			selectedBlocks: config.selectedBlocks,
			selectedBlocksLength: config.selectedBlocks.length,
		});

		if (!isEnabled) {
			console.log("[useDynamicAutoConnections] Disabled");
			return [];
		}

		if (nodes.length === 0) {
			console.log("[useDynamicAutoConnections] No nodes");
			return [];
		}

		if (config.selectedBlocks.length === 0) {
			console.log("[useDynamicAutoConnections] No blocks selected");
			return [];
		}

		const autoEdges = generateDynamicAutoConnections(nodes, {
			...config,
			enabled: isEnabled,
		});

		console.log("[useDynamicAutoConnections] Generated edges:", {
			autoEdgesCount: autoEdges.length,
			manualEdgesCount: manualEdges.length,
		});

		const filtered = filterDynamicAutoConnections(autoEdges, manualEdges);

		console.log("[useDynamicAutoConnections] Filtered edges:", filtered.length);

		return filtered;
	}, [nodes, manualEdges, config, isEnabled]);

	// Combine manual and automatic edges
	const allEdges = useMemo(() => {
		const autoEdges = autoConnections as Edge<GroupedEdgeData>[];
		return [...manualEdges, ...autoEdges];
	}, [manualEdges, autoConnections]);

	// Connection statistics
	const stats = useMemo(() => {
		const dynamicStats = getDynamicConnectionStats(nodes, allEdges, {
			...config,
			enabled: isEnabled,
		});

		// Convert to expected format
		return {
			nodeCount: dynamicStats.nodeCount,
			edgeCount: dynamicStats.edgeCount,
			groupCount: dynamicStats.groupCount,
			connectionsByType: dynamicStats.connectionsByBlock,
		};
	}, [nodes, allEdges, config, isEnabled]);

	// Toggle auto connections
	const toggleAutoConnections = useCallback(() => {
		setIsEnabled((prev) => !prev);
	}, []);

	// Update configuration
	const updateConfig = useCallback(
		(newConfig: Partial<DynamicAutoConnectionConfig>) => {
			setConfig((prev) => ({ ...prev, ...newConfig }));
		},
		[],
	);

	// Add block position for grouping
	const addBlock = useCallback(
		(position: number) => {
			if (!config.selectedBlocks.includes(position)) {
				updateConfig({
					selectedBlocks: [...config.selectedBlocks, position],
				});
			}
		},
		[config.selectedBlocks, updateConfig],
	);

	// Remove block position from grouping
	const removeBlock = useCallback(
		(position: number) => {
			updateConfig({
				selectedBlocks: config.selectedBlocks.filter((p) => p !== position),
			});
		},
		[config.selectedBlocks, updateConfig],
	);

	// Toggle block position
	const toggleBlock = useCallback(
		(position: number) => {
			if (config.selectedBlocks.includes(position)) {
				removeBlock(position);
			} else {
				addBlock(position);
			}
		},
		[config.selectedBlocks, addBlock, removeBlock],
	);

	// Clear all selected blocks
	const clearBlocks = useCallback(() => {
		updateConfig({ selectedBlocks: [] });
	}, [updateConfig]);

	// Select suggested blocks
	const selectSuggestedBlocks = useCallback(
		(suggestedPositions: number[]) => {
			updateConfig({ selectedBlocks: suggestedPositions });
		},
		[updateConfig],
	);

	return {
		// State
		config,
		isEnabled,
		autoConnections,
		allEdges,
		stats,

		// Actions
		toggleAutoConnections,
		updateConfig,
		addBlock,
		removeBlock,
		toggleBlock,
		clearBlocks,
		selectSuggestedBlocks,
	};
}

