/**
 * Toast Notification Component
 * Beautiful notifications for user feedback
 */

import React, {
  type ReactElement,
  useCallback,
  useEffect,
  useState,
} from "react";
import { AlertCircle, Check, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const icons: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: Check,
  error: X,
  warning: AlertCircle,
  info: Info,
};

const colors: Record<
  ToastType,
  { bg: string; border: string; text: string; icon: string }
> = {
  success: {
    bg: "bg-accent",
    border: "border-accent-foreground/30",
    text: "text-accent-foreground",
    icon: "text-accent-foreground",
  },
  error: {
    bg: "bg-destructive/20",
    border: "border-destructive/30",
    text: "text-destructive-foreground",
    icon: "text-destructive",
  },
  warning: {
    bg: "bg-primary/20",
    border: "border-primary/30",
    text: "text-primary-foreground dark:text-primary",
    icon: "text-primary",
  },
  info: {
    bg: "bg-secondary",
    border: "border-secondary-foreground/30",
    text: "text-secondary-foreground",
    icon: "text-secondary-foreground",
  },
};

/**
 * Single toast notification
 */
function ToastItem({ toast, onClose }: ToastProps): ReactElement {
  const Icon = icons[toast.type];
  const colorScheme = colors[toast.type];

  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`
        flex items-start gap-3 p-4 rounded border backdrop-blur-sm
        ${colorScheme.bg} ${colorScheme.border}
        min-w-[320px] max-w-md
      `}
    >
      <div className={`flex-shrink-0 ${colorScheme.icon}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${colorScheme.text}`}>
          {toast.title}
        </div>
        {toast.message && (
          <div className="text-xs text-muted-foreground mt-1">
            {toast.message}
          </div>
        )}
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

/**
 * Toast container with stacked notifications
 */
export function ToastContainer({
  toasts,
  onClose,
}: ToastContainerProps): ReactElement {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Hook for managing toasts
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): {
  toasts: Toast[];
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
  ) => void;
  closeToast: (id: string) => void;
} {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration?: number,
    ): void => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: Toast = {
        id,
        type,
        title,
        message,
        duration: duration || 3000, // Always 3 seconds if not specified
      };

      setToasts((prev) => [...prev, newToast]);
    },
    [],
  );

  const closeToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, closeToast };
}
