/**
 * Token Builder Toast Notifications Hook
 * Centralized toast notifications for Token Builder
 */

import { useCallback } from "react";
import { VALIDATION_MESSAGES } from "../utils";

/**
 * Custom toast notification type
 */
interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

/**
 * Hook for Token Builder specific toast notifications
 * Provides type-safe, consistent notifications
 * @returns Toast utilities
 */
export function useTokenToast(): {
  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showIconUploaded: () => void;
  showCertificateCreated: () => void;
  showCertificateExported: () => void;
  showSigningError: (error: Error | string) => void;
  showRateLimitError: (seconds: number) => void;
} {
  // Simple toast implementation - replace with your toast system
  const showToast = useCallback((options: ToastOptions): void => {
    // TODO: Replace with actual toast implementation from @/hooks/use-toast
    // For now, use console for demonstration
    const level = options.variant === "destructive" ? "error" : "log";
    console[level](`[Toast] ${options.title}`, options.description || "");
    
    // Fallback to alert for critical errors
    if (options.variant === "destructive") {
      alert(`${options.title}\n${options.description || ""}`);
    }
  }, []);

  const showSuccess = useCallback(
    (message: string, description?: string): void => {
      showToast({
        title: message,
        description,
        variant: "default",
      });
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string, description?: string): void => {
      showToast({
        title: message,
        description,
        variant: "destructive",
      });
    },
    [showToast],
  );

  const showIconUploaded = useCallback((): void => {
    showSuccess(VALIDATION_MESSAGES.ICON_UPLOADED);
  }, [showSuccess]);

  const showCertificateCreated = useCallback((): void => {
    showSuccess(VALIDATION_MESSAGES.CERTIFICATE_CREATED);
  }, [showSuccess]);

  const showCertificateExported = useCallback((): void => {
    showSuccess(VALIDATION_MESSAGES.CERTIFICATE_EXPORTED);
  }, [showSuccess]);

  const showSigningError = useCallback(
    (error: Error | string): void => {
      const message =
        error instanceof Error ? error.message : String(error);
      showError(VALIDATION_MESSAGES.SIGNING_FAILED, message);
    },
    [showError],
  );

  const showRateLimitError = useCallback(
    (seconds: number): void => {
      showError(VALIDATION_MESSAGES.SIGNING_COOLDOWN(seconds));
    },
    [showError],
  );

  return {
    showSuccess,
    showError,
    showIconUploaded,
    showCertificateCreated,
    showCertificateExported,
    showSigningError,
    showRateLimitError,
  };
}

