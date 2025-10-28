/**
 * Token Builder Toast Notifications Hook
 * Centralized toast notifications for Token Builder
 */

import { useCallback } from "react";
import { VALIDATION_MESSAGES } from "../utils";
import { toast } from "@/stores";

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
  // Use global toast system
  const showToast = useCallback((title: string, description?: string, isError = false): void => {
    if (isError) {
      toast.error(title, description);
    } else {
      toast.success(title, description);
    }
  }, []);

  const showSuccess = useCallback(
    (message: string, description?: string): void => {
      showToast(message, description, false);
    },
    [showToast],
  );

  const showError = useCallback(
    (message: string, description?: string): void => {
      showToast(message, description, true);
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

