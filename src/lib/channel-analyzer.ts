/**
 * Channel Analyzer - Dynamic channel key parsing system
 * Analyzes session channel keys and extracts blocks for flexible grouping
 */

import type { FlowNode } from "@/lib/canvas-types";

/**
 * Channel block represents a segment in the channel key
 */
export interface ChannelBlock {
	/** Position/index in the channel key */
	position: number;
	/** Name/label for this position */
	label: string;
	/** All unique values found at this position */
	values: Set<string>;
	/** Example channel using this block */
	examples: string[];
}

/**
 * Parsed channel structure
 */
export interface ParsedChannel {
	/** Original channel key */
	original: string;
	/** Blocks extracted from channel */
	blocks: string[];
	/** Node ID this channel belongs to */
	nodeId?: string;
}

/**
 * Channel analysis result
 */
export interface ChannelAnalysis {
	/** All parsed channels */
	channels: ParsedChannel[];
	/** Discovered blocks at each position */
	blocks: ChannelBlock[];
	/** Total unique blocks */
	totalBlocks: number;
	/** Suggested grouping blocks */
	suggestedBlocks: number[];
}

/**
 * Parse channel key into blocks
 */
export function parseChannel(channelKey: string, nodeId?: string): ParsedChannel {
	const blocks = channelKey.split(".");

	return {
		original: channelKey,
		blocks,
		nodeId,
	};
}

/**
 * Analyze all channels and discover available blocks
 */
export function analyzeChannels(nodes: FlowNode[]): ChannelAnalysis {
	console.log("[analyzeChannels] Analyzing nodes:", {
		nodeCount: nodes.length,
		nodesWithChannels: nodes.filter(n => n.data.channel).length,
	});

	const parsedChannels: ParsedChannel[] = [];
	const blockMap: Map<number, ChannelBlock> = new Map();

	// Parse all channels
	nodes.forEach((node) => {
		if (!node.data.channel) {
			console.log("[analyzeChannels] Node without channel:", node.id);
			return;
		}

		console.log("[analyzeChannels] Parsing channel:", node.data.channel);

		const parsed = parseChannel(node.data.channel, node.id);
		parsedChannels.push(parsed);

		// Analyze blocks at each position
		parsed.blocks.forEach((blockValue, position) => {
			if (!blockMap.has(position)) {
				blockMap.set(position, {
					position,
					label: `Block ${position}`,
					values: new Set(),
					examples: [],
				});
			}

			const block = blockMap.get(position)!;
			block.values.add(blockValue);

			// Add example if not too many
			if (block.examples.length < 3 && !block.examples.includes(parsed.original)) {
				block.examples.push(parsed.original);
			}
		});
	});

	// Simple labels - no hardcode, just position
	const blocks = Array.from(blockMap.values()).map((block) => {
		return {
			...block,
			label: `Block ${block.position}`,
		};
	});

	// Suggest blocks with most variety (no hardcode assumptions)
	const suggestedBlocks = blocks
		.filter((b) => b.values.size >= 2) // Only blocks with 2+ variants
		.sort((a, b) => b.values.size - a.values.size) // Sort by variety
		.slice(0, 3) // Top 3
		.map((b) => b.position);

	console.log("[analyzeChannels] Result:", {
		channelsCount: parsedChannels.length,
		blocksCount: blocks.length,
		blocks: blocks.map(b => ({
			pos: b.position,
			label: b.label,
			valueCount: b.values.size,
			values: Array.from(b.values),
		})),
		suggestedBlocks,
	});

	return {
		channels: parsedChannels,
		blocks,
		totalBlocks: blocks.length,
		suggestedBlocks,
	};
}


/**
 * Extract connection key from node using dynamic block positions
 */
export function extractDynamicConnectionKey(
	channelKey: string,
	blockPositions: number[],
): string {
	const blocks = channelKey.split(".");

	const selectedBlocks = blockPositions
		.map((pos) => blocks[pos])
		.filter(Boolean)
		.join(".");

	return selectedBlocks || channelKey;
}

/**
 * Get block value at specific position
 */
export function getBlockValue(channelKey: string, position: number): string | null {
	const blocks = channelKey.split(".");
	return blocks[position] || null;
}

/**
 * Group nodes by selected block positions
 */
export function groupNodesByBlocks(
	nodes: FlowNode[],
	blockPositions: number[],
): Map<string, FlowNode[]> {
	console.log("[groupNodesByBlocks] Input:", {
		nodeCount: nodes.length,
		blockPositions,
	});

	const groups = new Map<string, FlowNode[]>();

	nodes.forEach((node) => {
		if (!node.data.channel) {
			console.log("[groupNodesByBlocks] Node without channel:", node.id);
			return;
		}

		const groupKey = extractDynamicConnectionKey(node.data.channel, blockPositions);

		console.log("[groupNodesByBlocks] Node grouping:", {
			nodeId: node.id,
			channel: node.data.channel,
			blockPositions,
			groupKey,
		});

		if (!groups.has(groupKey)) {
			groups.set(groupKey, []);
		}

		groups.get(groupKey)!.push(node);
	});

	console.log("[groupNodesByBlocks] All groups before filtering:", {
		groupCount: groups.size,
		groups: Array.from(groups.entries()).map(([key, nodes]) => ({
			key,
			nodeCount: nodes.length,
		})),
	});

	// Only return groups with 2+ nodes
	const filtered = new Map<string, FlowNode[]>();
	groups.forEach((nodes, key) => {
		if (nodes.length >= 2) {
			filtered.set(key, nodes);
		} else {
			console.log("[groupNodesByBlocks] Filtering out group (only 1 node):", key);
		}
	});

	console.log("[groupNodesByBlocks] Filtered groups (2+ nodes):", {
		groupCount: filtered.size,
		groups: Array.from(filtered.entries()).map(([key, nodes]) => ({
			key,
			nodeCount: nodes.length,
		})),
	});

	return filtered;
}

/**
 * Get statistics about block usage across channels
 */
export function getBlockStatistics(
	channels: ParsedChannel[],
): {
	maxBlocks: number;
	minBlocks: number;
	avgBlocks: number;
	blockDistribution: Map<number, number>;
} {
	const blockCounts = channels.map((ch) => ch.blocks.length);

	const maxBlocks = Math.max(...blockCounts, 0);
	const minBlocks = Math.min(...blockCounts, 0);
	const avgBlocks =
		blockCounts.reduce((sum, count) => sum + count, 0) / blockCounts.length || 0;

	const blockDistribution = new Map<number, number>();
	channels.forEach((ch) => {
		const count = ch.blocks.length;
		blockDistribution.set(count, (blockDistribution.get(count) || 0) + 1);
	});

	return {
		maxBlocks,
		minBlocks,
		avgBlocks,
		blockDistribution,
	};
}

/**
 * Get all unique values for a specific block position
 */
export function getBlockValues(
	channels: ParsedChannel[],
	position: number,
): string[] {
	const values = new Set<string>();

	channels.forEach((ch) => {
		if (ch.blocks[position]) {
			values.add(ch.blocks[position]);
		}
	});

	return Array.from(values).sort();
}

/**
 * Validate if block positions are valid for grouping
 */
export function validateBlockPositions(
	channels: ParsedChannel[],
	positions: number[],
): {
	valid: boolean;
	reason?: string;
	coverage: number;
} {
	if (positions.length === 0) {
		return {
			valid: false,
			reason: "No block positions selected",
			coverage: 0,
		};
	}

	let validChannels = 0;

	channels.forEach((ch) => {
		const hasAllPositions = positions.every((pos) => ch.blocks[pos] !== undefined);
		if (hasAllPositions) {
			validChannels++;
		}
	});

	const coverage = (validChannels / channels.length) * 100;

	return {
		valid: coverage > 50,
		reason:
			coverage <= 50
				? `Only ${coverage.toFixed(0)}% of channels have all selected blocks`
				: undefined,
		coverage,
	};
}

/**
 * Generate human-readable label for block combination
 */
export function generateGroupLabel(
	blocks: ChannelBlock[],
	positions: number[],
): string {
	const labels = positions
		.map((pos) => blocks.find((b) => b.position === pos)?.label)
		.filter(Boolean);

	return labels.join(" + ") || "Custom Group";
}

/**
 * Get color for block position (for visual differentiation)
 */
export function getBlockColor(position: number): string {
	const colors = [
		"#c9995a", // amber (custom palette)
		"#10b981", // emerald
		"#3b82f6", // blue
		"#8b5cf6", // violet
		"#06b6d4", // cyan
		"#ef4444", // red
		"#84cc16", // lime
		"#f97316", // orange
		"#ec4899", // pink
		"#14b8a6", // teal
	];

	return colors[position % colors.length];
}

/**
 * Get icon for block position - simple numeric indicators
 */
export function getBlockIcon(label: string, position?: number): string {
	// Simple numbered emoji indicators, no hardcode
	const icons = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
	
	if (position !== undefined && position < icons.length) {
		return icons[position];
	}
	
	return "🔗";
}

