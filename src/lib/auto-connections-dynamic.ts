/**
 * Dynamic Auto Connections System
 * Analyzes channel keys and creates connections based on user-selected blocks
 */

import type { Edge } from "reactflow";
import type {
	FlowNode,
	GroupedEdgeData,
	ConnectionKeys,
	AutoConnectionConfig,
} from "@/lib/canvas-types";
import {
	analyzeChannels,
	extractDynamicConnectionKey,
	getBlockColor,
	getBlockValue,
	groupNodesByBlocks,
	type ChannelAnalysis,
	type ChannelBlock,
} from "./channel-analyzer";

/**
 * Dynamic auto connection configuration (extends AutoConnectionConfig for compatibility)
 */
export interface DynamicAutoConnectionConfig extends AutoConnectionConfig {
	/** Selected block positions for grouping (e.g., [0, 4] for positions 0 and 4) */
	selectedBlocks: number[];
}

/**
 * Edge group for dynamic connections
 */
interface DynamicEdgeGroup {
	/** Unique group key (combination of selected block values) */
	key: string;
	/** Selected block positions */
	positions: number[];
	/** Nodes in this group */
	nodes: FlowNode[];
	/** Color for edges */
	color: string;
	/** Label for edges */
	label: string;
}

/**
 * Analyze channels from nodes
 */
export function analyzeNodeChannels(nodes: FlowNode[]): ChannelAnalysis {
	return analyzeChannels(nodes);
}

/**
 * Group nodes by selected block positions
 */
export function groupNodesBySelectedBlocks(
	nodes: FlowNode[],
	selectedBlocks: number[],
): DynamicEdgeGroup[] {
	console.log("[groupNodesBySelectedBlocks] Input:", {
		nodeCount: nodes.length,
		selectedBlocks,
		nodeChannels: nodes.map(n => n.data.channel),
	});

	if (selectedBlocks.length === 0) {
		console.log("[groupNodesBySelectedBlocks] No blocks selected");
		return [];
	}

	const groups = groupNodesByBlocks(nodes, selectedBlocks);

	console.log("[groupNodesBySelectedBlocks] Groups from groupNodesByBlocks:", {
		groupCount: groups.size,
		groups: Array.from(groups.entries()).map(([key, nodes]) => ({
			key,
			nodeCount: nodes.length,
			nodeIds: nodes.map(n => n.id),
		})),
	});

	const edgeGroups: DynamicEdgeGroup[] = [];

	groups.forEach((groupNodes, groupKey) => {
		console.log("[groupNodesBySelectedBlocks] Processing group:", {
			groupKey,
			nodeCount: groupNodes.length,
		});

		if (groupNodes.length < 2) {
			console.log("[groupNodesBySelectedBlocks] Skipping group (< 2 nodes):", groupKey);
			return; // Need at least 2 nodes to connect
		}

		// Use first selected block position for color
		const primaryPosition = selectedBlocks[0];
		const color = getBlockColor(primaryPosition);

		// Generate label from selected blocks
		const firstNode = groupNodes[0];
		if (!firstNode.data.channel) return;

		const labelParts = selectedBlocks
			.map((pos) => {
				const value = getBlockValue(firstNode.data.channel, pos);
				return value;
			})
			.filter(Boolean);

		const edgeGroup = {
			key: groupKey,
			positions: selectedBlocks,
			nodes: groupNodes,
			color,
			label: labelParts.join(" • "),
		};

		console.log("[groupNodesBySelectedBlocks] Created edge group:", edgeGroup);

		edgeGroups.push(edgeGroup);
	});

	console.log("[groupNodesBySelectedBlocks] Final edge groups:", {
		count: edgeGroups.length,
		groups: edgeGroups.map(g => ({
			key: g.key,
			nodeCount: g.nodes.length,
			label: g.label,
		})),
	});

	return edgeGroups;
}

/**
 * Generate automatic edges based on dynamic grouping
 */
export function generateDynamicAutoConnections(
	nodes: FlowNode[],
	config: DynamicAutoConnectionConfig,
): Edge<GroupedEdgeData>[] {
	console.log("[generateDynamicAutoConnections] Input:", {
		nodeCount: nodes.length,
		selectedBlocks: config.selectedBlocks,
		enabled: config.enabled,
	});

	if (!config.enabled || config.selectedBlocks.length === 0) {
		console.log("[generateDynamicAutoConnections] Disabled or no blocks");
		return [];
	}

	const edges: Edge<GroupedEdgeData>[] = [];
	const edgeGroups = groupNodesBySelectedBlocks(nodes, config.selectedBlocks);

	console.log("[generateDynamicAutoConnections] Edge groups:", {
		groupCount: edgeGroups.length,
		groups: edgeGroups.map(g => ({
			key: g.key,
			nodeCount: g.nodes.length,
			label: g.label,
		})),
	});

	edgeGroups.forEach((group, groupIndex) => {
		// Create connections between all nodes in the group (full mesh)
		for (let i = 0; i < group.nodes.length; i++) {
			for (let j = i + 1; j < group.nodes.length; j++) {
				const sourceNode = group.nodes[i];
				const targetNode = group.nodes[j];

				const edge: Edge<GroupedEdgeData> = {
					id: `auto-${groupIndex}-${sourceNode.id}-${targetNode.id}`,
					source: sourceNode.id,
					target: targetNode.id,
					sourceHandle: "auto-source",
					targetHandle: "auto-target",
					type: "grouped",
					data: {
						groupKey: group.key,
						groupType: `block-${config.selectedBlocks.join("-")}` as never,
						connectionCount: group.nodes.length,
						relatedNodes: group.nodes.map((n) => n.id),
					},
					style: {
						stroke: group.color,
						strokeWidth: 2,
						strokeDasharray: getDashArrayForGroup(groupIndex),
					},
					label: config.showLabels ? group.label : undefined,
					labelStyle: {
						fill: group.color,
						fontSize: 10,
						fontWeight: "bold",
					},
					animated: false,
				};

				edges.push(edge);
			}
		}
	});

	return edges;
}

/**
 * Get dash array pattern based on group index
 */
function getDashArrayForGroup(groupIndex: number): string {
	const patterns = [
		"5,5",    // Dashed
		"10,5",   // Long dash
		"15,5",   // Extra long
		"5,10",   // Short dash, long gap
		"3,3",    // Dotted
		"10,10",  // Balanced
		"20,5",   // Very long
		"2,8",    // Morse-like
	];

	return patterns[groupIndex % patterns.length];
}

/**
 * Filter auto edges to avoid duplicates with manual edges
 */
export function filterDynamicAutoConnections(
	autoEdges: Edge<GroupedEdgeData>[],
	manualEdges: Edge[],
): Edge<GroupedEdgeData>[] {
	return autoEdges.filter((autoEdge) => {
		return !manualEdges.some((manualEdge) => {
			return (
				(manualEdge.source === autoEdge.source &&
					manualEdge.target === autoEdge.target) ||
				(manualEdge.source === autoEdge.target &&
					manualEdge.target === autoEdge.source)
			);
		});
	});
}

/**
 * Get connection statistics
 */
export function getDynamicConnectionStats(
	nodes: FlowNode[],
	edges: Edge[],
	config: DynamicAutoConnectionConfig,
): {
	nodeCount: number;
	edgeCount: number;
	groupCount: number;
	connectionsByBlock: Record<number, number>;
} {
	const edgeGroups = groupNodesBySelectedBlocks(nodes, config.selectedBlocks);

	const connectionsByBlock: Record<number, number> = {};

	config.selectedBlocks.forEach((position) => {
		connectionsByBlock[position] = 0;
	});

	// Count connections per block
	edgeGroups.forEach((group) => {
		const edgeCountForGroup = (group.nodes.length * (group.nodes.length - 1)) / 2;

		group.positions.forEach((pos) => {
			connectionsByBlock[pos] = (connectionsByBlock[pos] || 0) + edgeCountForGroup;
		});
	});

	return {
		nodeCount: nodes.length,
		edgeCount: edges.length,
		groupCount: edgeGroups.length,
		connectionsByBlock,
	};
}

/**
 * Get available blocks from nodes for UI display
 */
export function getAvailableBlocksFromNodes(nodes: FlowNode[]): ChannelBlock[] {
	const analysis = analyzeNodeChannels(nodes);
	return analysis.blocks;
}

/**
 * Default dynamic configuration
 */
export const defaultDynamicAutoConnectionConfig: DynamicAutoConnectionConfig = {
	enabled: false,
	selectedBlocks: [],
	showLabels: true,
	groupByKeys: [], // Legacy compatibility
	edgeStyles: {}, // Legacy compatibility
};

