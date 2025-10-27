/**
 * Rate Limit Hook
 * Prevents abuse by limiting action frequency
 */

import { useRef, useCallback } from "react";

/**
 * Hook for rate limiting actions
 * @param cooldownMs - Cooldown period in milliseconds
 * @returns Rate limit utilities
 */
export function useRateLimit(cooldownMs: number): {
  canExecute: () => boolean;
  getRemainingTime: () => number;
  markExecuted: () => void;
} {
  const lastExecutionRef = useRef<number>(0);

  const canExecute = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;
    return timeSinceLastExecution >= cooldownMs;
  }, [cooldownMs]);

  const getRemainingTime = useCallback((): number => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;
    const remaining = cooldownMs - timeSinceLastExecution;
    return Math.max(0, remaining);
  }, [cooldownMs]);

  const markExecuted = useCallback((): void => {
    lastExecutionRef.current = Date.now();
  }, []);

  return { canExecute, getRemainingTime, markExecuted };
}

