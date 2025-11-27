import { useCallback, useMemo, useState } from "react";
import type { Edge } from "reactflow";
import type {
	FlowNode,
	AutoConnectionConfig,
	GroupedEdgeData, ConnectionKeys,
} from "@/lib/canvas-types";
import {
	generateAutoConnections,
	filterAutoConnections,
	defaultAutoConnectionConfig,
	getConnectionStats,
	extractConnectionKeys,
} from "@/lib/auto-connections";

/**
 * Hook for managing automatic node connections based on grouping keys
 */
export function useAutoConnections(
	nodes: FlowNode[],
	manualEdges: Edge[],
	initialConfig?: Partial<AutoConnectionConfig>,
) {
	const [config, setConfig] = useState<AutoConnectionConfig>({
		...defaultAutoConnectionConfig,
		...initialConfig,
	});

	const [isEnabled, setIsEnabled] = useState<boolean>(config.enabled);

	// Generate automatic connections based on current nodes and config
	const autoConnections = useMemo(() => {
		if (!isEnabled || nodes.length === 0) {

			return [];
		}

		const autoEdges = generateAutoConnections(nodes, config);
		const filteredEdges = filterAutoConnections(autoEdges, manualEdges);

		return filteredEdges;
	}, [nodes, manualEdges, config, isEnabled]);

	// Combine manual and automatic edges
	const allEdges = useMemo(() => {
		const autoEdges = autoConnections as Edge<GroupedEdgeData>[];
		return [...manualEdges, ...autoEdges];
	}, [manualEdges, autoConnections]);

	// Connection statistics
	const stats = useMemo(() => {
		return getConnectionStats(nodes, allEdges);
	}, [nodes, allEdges]);

	// Toggle auto connections
	const toggleAutoConnections = useCallback(() => {
		setIsEnabled((prev) => !prev);
	}, []);

	// Update configuration
	const updateConfig = useCallback((newConfig: Partial<AutoConnectionConfig>) => {
		setConfig((prev) => ({ ...prev, ...newConfig }));
	}, []);

	// Add grouping key
	const addGroupingKey = useCallback((key: string) => {
		const typedKey = key as keyof ConnectionKeys;
		if (!config.groupByKeys.includes(typedKey)) {
			updateConfig({
				groupByKeys: [...config.groupByKeys, typedKey],
			});
		}
	}, [config.groupByKeys, updateConfig]);

	// Remove grouping key
	const removeGroupingKey = useCallback((key: string) => {
		updateConfig({
			groupByKeys: config.groupByKeys.filter((k) => k !== key),
		});
	}, [config.groupByKeys, updateConfig]);

	// Toggle grouping key
	const toggleGroupingKey = useCallback((key: keyof ConnectionKeys) => {
		if (config.groupByKeys.includes(key)) {
			removeGroupingKey(key);
		} else {
			addGroupingKey(key);
		}
	}, [config.groupByKeys, addGroupingKey, removeGroupingKey]);

	// Get nodes grouped by a specific key
	const getNodesByGroup = useCallback((groupKey: string, groupType: string) => {
		return nodes.filter((node) => {
			const keys = extractConnectionKeys(node.data);
			return keys[groupType as keyof typeof keys] === groupKey;
		});
	}, [nodes]);

	// Get connection groups information
	const getConnectionGroups = useCallback(() => {
		if (!isEnabled) return [];

		const groups = new Map<string, {
			key: string;
			type: string;
			nodes: FlowNode[];
			edgeCount: number;
		}>();

		autoConnections.forEach((edge) => {
			const edgeData = edge.data as GroupedEdgeData;
			const groupId = `${edgeData.groupType}:${edgeData.groupKey}`;
			
			if (!groups.has(groupId)) {
				groups.set(groupId, {
					key: edgeData.groupKey,
					type: edgeData.groupType,
					nodes: getNodesByGroup(edgeData.groupKey, edgeData.groupType),
					edgeCount: 0,
				});
			}

			const group = groups.get(groupId);
			if (group) {
				group.edgeCount++;
			}
		});

		return Array.from(groups.values());
	}, [autoConnections, getNodesByGroup, isEnabled]);

	// Debug information
	const debugInfo = useMemo(() => {
		return {
			config,
			isEnabled,
			nodeCount: nodes.length,
			manualEdgeCount: manualEdges.length,
			autoEdgeCount: autoConnections.length,
			totalEdgeCount: allEdges.length,
			stats,
			groups: getConnectionGroups(),
		};
	}, [
		config,
		isEnabled,
		nodes.length,
		manualEdges.length,
		autoConnections.length,
		allEdges.length,
		stats,
		getConnectionGroups,
	]);

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
		addGroupingKey,
		removeGroupingKey,
		toggleGroupingKey,
		
		// Utilities
		getNodesByGroup,
		getConnectionGroups,
		
		// Debug
		debugInfo,
	};
}
