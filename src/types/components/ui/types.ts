/**
 * UI components type definitions
 */

/**
 * Toast notification types
 */
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
	id: string;
	type: ToastType;
	title: string;
	message?: string;
	duration?: number;
}

export interface ToastProps {
	toast: Toast;
	onClose: (id: string) => void;
}

export interface ToastContainerProps {
	toasts: Toast[];
	onClose: (id: string) => void;
}

/**
 * Simple dropdown types
 */
export interface DropdownProps {
	children: React.ReactNode;
	trigger: React.ReactNode;
	align?: "start" | "center" | "end";
	className?: string;
}

export interface DropdownItemProps {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}

export interface DropdownSeparatorProps {
	className?: string;
}

/**
 * App icon props
 */
export interface AppIconProps {
	appKey: string;
	className?: string;
	size?: "sm" | "md" | "lg";
}

/**
 * Graphite logo props
 */
export interface GraphiteProps {
	className?: string;
}

