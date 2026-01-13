/**
 * Global Toast Provider
 * Renders toast notifications from global store
 */

import type { ReactElement } from "react";
import { useToastStore } from "@/stores/modules/toast.store";
import { ToastContainer } from "@/components/ui/toast";

/**
 * Toast provider component
 * Add this to App.tsx root to enable global toasts
 */
export default function ToastProvider(): ReactElement {
  const { toasts, closeToast } = useToastStore();

  return <ToastContainer toasts={toasts} onClose={closeToast} />;
}
