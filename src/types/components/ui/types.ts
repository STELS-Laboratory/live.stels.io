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
export interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export interface DropdownSeparatorProps {
  className?: string;
}
