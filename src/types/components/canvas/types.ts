/**
 * Canvas components type definitions
 */

/**
 * Auto connections panel props
 */
export interface AutoConnectionsPanelProps {
	onClose: () => void;
}

/**
 * Canvas controls props
 */
export interface CanvasControlsProps {
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFitView: () => void;
	onResetView: () => void;
	zoomLevel: number;
}

/**
 * Control button props
 */
export interface ControlButtonProps {
	onClick: () => void;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	disabled?: boolean;
}

/**
 * Keyboard shortcuts overlay props
 */
export interface KeyboardShortcutsOverlayProps {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Enhanced drop zone props
 */
export interface EnhancedDropZoneProps {
	onDrop: (event: React.DragEvent) => void;
	onDragOver: (event: React.DragEvent) => void;
	isActive: boolean;
}

/**
 * Panel transition overlay props
 */
export interface PanelTransitionOverlayProps {
	isVisible: boolean;
	panelId: string;
}

/**
 * Empty canvas state props
 */
export interface EmptyCanvasStateProps {
	onAddWidget: () => void;
}

/**
 * Loading spinner props
 */
export interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

/**
 * Node flow props
 */
export interface NodeFlowProps {
	nodeId: string;
	data: Record<string, unknown>;
}

