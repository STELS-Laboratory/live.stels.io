/**
 * Panels components type definitions
 */

/**
 * Panel tabs props
 */
export interface PanelTabsProps {
	panels: Array<{ id: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
	activePanelId: string | null;
	onPanelChange: (panelId: string) => void;
	onPanelClose?: (panelId: string) => void;
}

/**
 * Panel tab props
 */
export interface PanelTabProps {
	panel: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> };
	isActive: boolean;
	onClick: () => void;
	onClose?: () => void;
}

/**
 * Panel manager props
 */
export interface PanelManagerProps {
	onClose: () => void;
}

/**
 * Panel card props
 */
export interface PanelCardProps {
	panel: { id: string; name: string; description?: string };
	onSelect: (panelId: string) => void;
	onDelete?: (panelId: string) => void;
}

