/**
 * Centralized Timer Manager
 * Provides centralized management of timers to prevent memory leaks
 * and improve performance monitoring
 */

import React from "react";

interface TimerInfo {
  id: NodeJS.Timeout | number;
  type: "timeout" | "interval";
  createdAt: number;
  description?: string;
}

class TimerManager {
  private static instance: TimerManager;
  private timers: Map<string, TimerInfo> = new Map();
  private nextId = 0;

  private constructor() {
    // Cleanup all timers on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.clearAll();
      });
    }
  }

  public static getInstance(): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager();
    }
    return TimerManager.instance;
  }

  /**
   * Create a timeout with automatic tracking
   */
  public setTimeout(
    callback: () => void,
    delay: number,
    description?: string,
  ): string {
    const id = `timeout-${this.nextId++}`;
    const timerId = setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);

    this.timers.set(id, {
      id: timerId,
      type: "timeout",
      createdAt: Date.now(),
      description,
    });

    return id;
  }

  /**
   * Create an interval with automatic tracking
   */
  public setInterval(
    callback: () => void,
    delay: number,
    description?: string,
  ): string {
    const id = `interval-${this.nextId++}`;
    const timerId = setInterval(() => {
      callback();
    }, delay);

    this.timers.set(id, {
      id: timerId,
      type: "interval",
      createdAt: Date.now(),
      description,
    });

    return id;
  }

  /**
   * Clear a specific timer
   */
  public clear(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      if (timer.type === "interval") {
        clearInterval(timer.id as NodeJS.Timeout);
      } else {
        clearTimeout(timer.id as NodeJS.Timeout);
      }
      this.timers.delete(id);
    }
  }

  /**
   * Clear all timers
   */
  public clearAll(): void {
    for (const [, timer] of this.timers) {
      if (timer.type === "interval") {
        clearInterval(timer.id as NodeJS.Timeout);
      } else {
        clearTimeout(timer.id as NodeJS.Timeout);
      }
    }
    this.timers.clear();
  }

  /**
   * Get all active timers (for debugging)
   */
  public getActiveTimers(): Array<
    { id: string; type: string; description?: string; age: number }
  > {
    const now = Date.now();
    return Array.from(this.timers.entries()).map(([id, timer]) => ({
      id,
      type: timer.type,
      description: timer.description,
      age: now - timer.createdAt,
    }));
  }

  /**
   * Get count of active timers
   */
  public getActiveCount(): number {
    return this.timers.size;
  }
}

export const timerManager = TimerManager.getInstance();

/**
 * React hook for managing timers with automatic cleanup
 */
export function useTimerManager() {
  const timerRefs = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const currentTimerRefs = timerRefs.current;
    return () => {
      // Cleanup all timers created by this hook
      for (const id of currentTimerRefs) {
        timerManager.clear(id);
      }
      currentTimerRefs.clear();
    };
  }, []);

  const setTimeout = React.useCallback(
    (callback: () => void, delay: number, description?: string): string => {
      const id = timerManager.setTimeout(callback, delay, description);
      timerRefs.current.add(id);
      return id;
    },
    [],
  );

  const setInterval = React.useCallback(
    (callback: () => void, delay: number, description?: string): string => {
      const id = timerManager.setInterval(callback, delay, description);
      timerRefs.current.add(id);
      return id;
    },
    [],
  );

  const clear = React.useCallback((id: string): void => {
    timerManager.clear(id);
    timerRefs.current.delete(id);
  }, []);

  return { setTimeout, setInterval, clear };
}
