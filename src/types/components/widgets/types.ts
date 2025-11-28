/**
 * Widgets components type definitions
 */

import type { SessionWidgetData } from "@/lib/canvas-types";

/**
 * Widget store props
 */
export interface WidgetStoreProps {
	/** Whether the widget store is open */
	isOpen: boolean;
	/** Callback to close the widget store */
	onClose: () => void;
	/** Callback when drag starts */
	onDragStart: (
		event: React.DragEvent<HTMLDivElement>,
		keyStore: string,
	) => void;
	/** Callback when touch starts (for mobile) */
	onTouchStart: (
		event: React.TouchEvent<HTMLDivElement>,
		keyStore: string,
	) => void;
	/** Array of widget keys that are already in the current Canvas */
	existingWidgets?: string[];
}

/**
 * Widget item props
 */
export interface WidgetItemProps {
	/** Key of the widget in session storage */
	keyStore: string;
	/** Widget data */
	widget: SessionWidgetData;
	/** Callback when drag starts */
	onDragStart: (
		event: React.DragEvent<HTMLDivElement>,
		keyStore: string,
	) => void;
	/** Callback when touch starts */
	onTouchStart: (
		event: React.TouchEvent<HTMLDivElement>,
		keyStore: string,
	) => void;
	/** Whether this is a mobile view */
	isMobile: boolean;
	/** Whether this is a compact view */
	isCompact?: boolean;
	/** Whether this widget is already in the Canvas */
	isInCanvas?: boolean;
}

/**
 * Group header props
 */
export interface GroupHeaderProps {
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
	/** Whether this is mobile view */
	isMobile?: boolean;
	/** Whether this is tablet view */
	isTablet?: boolean;
}

/**
 * Filter bar props
 */
export interface FilterBarProps {
	/** Search term */
	searchTerm: string;
	/** Callback when search term changes */
	onSearchChange: (term: string) => void;
	/** Active category */
	activeCategory: string;
	/** Available categories */
	categories: string[];
	/** Callback when category changes */
	onCategoryChange: (category: string) => void;
	/** Whether this is mobile view */
	isMobile?: boolean;
}

/**
 * Auto connections settings props
 */
export interface AutoConnectionsSettingsProps {
	onClose: () => void;
}

/**
 * Drag preview props
 */
export interface DragPreviewProps {
	widget: SessionWidgetData;
	position: { x: number; y: number };
}

/**
 * Drop zone indicator props
 */
export interface DropZoneIndicatorProps {
	isVisible: boolean;
	position: { x: number; y: number };
}

/**
 * Widget status badge props
 */
export interface WidgetStatusBadgeProps {
	status: "active" | "inactive" | "error" | "loading";
	className?: string;
}

/**
 * Grouped edge props (extends ReactFlow EdgeProps)
 */
export interface GroupedEdgeProps {
	id: string;
	source: string;
	target: string;
	[key: string]: unknown;
}

