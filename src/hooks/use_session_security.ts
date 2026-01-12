/**
 * Session Security Hook
 * Handles inactivity timeout and session expiry warnings
 * Based on API v2.0.0 security requirements
 */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import {
  INACTIVITY_TIMEOUT_MS,
  SESSION_EXPIRY_WARNING_MS,
  SESSION_MAX_LIFETIME_MS,
} from "@/lib/api-types";

/**
 * Hook for session security features:
 * - Auto-logout after 30 minutes of inactivity
 * - Session expiry warning when session is older than 6 days
 * - Force logout when session exceeds 7 days
 */
export function useSessionSecurity(): void {
  const {
    isAuthenticated,
    connectionSession,
    resetAuth,
    setShowSessionExpiredModal,
  } = useAuthStore();

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update last activity timestamp on user interactions
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check session validity and inactivity
  const checkSession = useCallback(async () => {
    if (!isAuthenticated || !connectionSession) {
      return;
    }

    const now = Date.now();

    // Check absolute session lifetime (7 days max)
    if (connectionSession.createdAt) {
      const sessionAge = now - connectionSession.createdAt;

      if (sessionAge > SESSION_MAX_LIFETIME_MS) {
        console.warn("[SessionSecurity] Session expired (max 7 days). Logging out.");
        await resetAuth();
        return;
      }

      // Show warning if session is older than 6 days
      if (sessionAge > SESSION_EXPIRY_WARNING_MS) {
        setShowSessionExpiredModal(true);
      }
    }

    // Check inactivity (30 minutes)
    const inactiveTime = now - lastActivityRef.current;
    if (inactiveTime > INACTIVITY_TIMEOUT_MS) {
      console.warn("[SessionSecurity] User inactive for 30+ minutes. Logging out.");
      await resetAuth();
    }
  }, [isAuthenticated, connectionSession, resetAuth, setShowSessionExpiredModal]);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Activity events to track
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttled activity update (max once per second)
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 1000) {
        lastUpdate = now;
        updateActivity();
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Check session every 5 minutes
    checkIntervalRef.current = setInterval(checkSession, 5 * 60 * 1000);

    // Initial check
    checkSession();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, throttledUpdate);
      });

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, updateActivity, checkSession]);
}

export default useSessionSecurity;
