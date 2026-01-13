/**
 * Global Toast Store
 * Wraps Sonner for toast notifications across the application
 */

import { toast as sonnerToast } from "sonner";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastActions {
  /**
   * Show a toast notification
   */
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
  ) => void;

  /**
   * Show success toast
   */
  success: (title: string, message?: string) => void;

  /**
   * Show error toast
   */
  error: (title: string, message?: string) => void;

  /**
   * Show warning toast
   */
  warning: (title: string, message?: string) => void;

  /**
   * Show info toast
   */
  info: (title: string, message?: string) => void;

  /**
   * Dismiss a toast by ID
   */
  dismiss: (id?: string | number) => void;

  /**
   * Clear all toasts
   */
  clearAll: () => void;
}

export type ToastStore = ToastActions;

/**
 * Show a toast using Sonner
 */
const showToast = (
  type: ToastType,
  title: string,
  message?: string,
  duration?: number,
): void => {
  const options = {
    description: message,
    duration: duration,
  };

  switch (type) {
    case "success":
      sonnerToast.success(title, options);
      break;
    case "error":
      sonnerToast.error(title, { ...options, duration: duration ?? 5000 });
      break;
    case "warning":
      sonnerToast.warning(title, { ...options, duration: duration ?? 4000 });
      break;
    case "info":
      sonnerToast.info(title, options);
      break;
    default:
      sonnerToast(title, options);
  }
};

/**
 * Toast store compatible API (for backward compatibility)
 * Now wraps Sonner instead of using zustand
 */
export const useToastStore = (): ToastStore => ({
  showToast,
  success: (title: string, message?: string) => showToast("success", title, message),
  error: (title: string, message?: string) => showToast("error", title, message),
  warning: (title: string, message?: string) => showToast("warning", title, message),
  info: (title: string, message?: string) => showToast("info", title, message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  clearAll: () => sonnerToast.dismiss(),
});

/**
 * Convenience functions for toast notifications
 * Can be used anywhere without hooks
 */
export const toast = {
  success: (title: string, message?: string): void => {
    showToast("success", title, message);
  },
  error: (title: string, message?: string): void => {
    showToast("error", title, message);
  },
  warning: (title: string, message?: string): void => {
    showToast("warning", title, message);
  },
  info: (title: string, message?: string): void => {
    showToast("info", title, message);
  },
  dismiss: (id?: string | number): void => {
    sonnerToast.dismiss(id);
  },
};
