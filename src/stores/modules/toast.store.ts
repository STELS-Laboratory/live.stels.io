/**
 * Global Toast Store
 * Manages toast notifications across the application
 */

import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
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
   * Close a toast by ID
   */
  closeToast: (id: string) => void;

  /**
   * Clear all toasts
   */
  clearAll: () => void;
}

export type ToastStore = ToastState & ToastActions;

/**
 * Global toast store
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: (type, title, message, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  success: (title, message) => {
    useToastStore.getState().showToast("success", title, message);
  },

  error: (title, message) => {
    useToastStore.getState().showToast("error", title, message, 5000); // Errors stay longer
  },

  warning: (title, message) => {
    useToastStore.getState().showToast("warning", title, message, 4000);
  },

  info: (title, message) => {
    useToastStore.getState().showToast("info", title, message);
  },

  closeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

/**
 * Convenience functions for toast notifications
 * Can be used anywhere without hooks
 */
export const toast = {
  success: (title: string, message?: string): void => {
    useToastStore.getState().success(title, message);
  },
  error: (title: string, message?: string): void => {
    useToastStore.getState().error(title, message);
  },
  warning: (title: string, message?: string): void => {
    useToastStore.getState().warning(title, message);
  },
  info: (title: string, message?: string): void => {
    useToastStore.getState().info(title, message);
  },
};

