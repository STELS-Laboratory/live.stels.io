/**
 * Global Toast Provider
 * Renders toast notifications using Sonner
 */

import type { ReactElement } from "react";
import { Toaster } from "@/components/ui/sonner";

/**
 * Toast provider component
 * Add this to App.tsx root to enable global toasts
 */
export default function ToastProvider(): ReactElement {
  return <Toaster />;
}
