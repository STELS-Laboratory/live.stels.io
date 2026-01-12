/**
 * Application State Machine Hook
 * Manages app initialization flow and state transitions
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore, useAuthStore } from "@/stores";
import { useHydration } from "@/hooks/use_hydration";
import {
  APP_STATES,
  STATE_TRANSITION_DELAYS,
  TIMING,
  type AppState,
} from "@/lib/constants";
import type { UIState } from "@/types/app/types";

interface AppStateMachineReturn {
  appState: AppState;
  uiState: UIState;
  setUIState: React.Dispatch<React.SetStateAction<UIState>>;
  handleSplashComplete: () => void;
  handleUpgradeComplete: () => void;
  upgradeEndDate: Date;
}

/**
 * Hook for managing application state machine
 */
export function useAppStateMachine(): AppStateMachineReturn {
  const { upgrade, setUpgrade } = useAppStore();
  const { isAuthenticated, isConnected, _hasHydrated } = useAuthStore();
  const hasHydrated = useHydration();

  const [uiState, setUIState] = useState<UIState>({
    showSplash: true,
    forceRender: false,
    transitionProgress: 0,
    storageScanComplete: false,
  });

  const [appState, setAppState] = useState<AppState>(APP_STATES.INITIALIZING);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceRenderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const upgradeEndDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
    const day = tomorrow.getDate().toString().padStart(2, "0");
    const nyDateTime = `${year}-${month}-${day}T21:00:00-04:00`;
    return new Date(nyDateTime);
  }, []);

  const getTransitionDelay = useCallback(
    (fromState: AppState, toState: AppState): number => {
      const key = `${fromState}->${toState}`;
      return STATE_TRANSITION_DELAYS[key] || 250;
    },
    []
  );

  const transitionToState = useCallback(
    async (
      newState: AppState,
      delay: number = 800,
      showProgress: boolean = true
    ): Promise<void> => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }

      if (showProgress) {
        setUIState((prev) => ({ ...prev, transitionProgress: 0 }));

        progressIntervalRef.current = setInterval(() => {
          setUIState((prev) => {
            const newProgress = prev.transitionProgress + 100 / (delay / 50);
            return {
              ...prev,
              transitionProgress: newProgress >= 100 ? 100 : newProgress,
            };
          });
        }, 50);

        await new Promise((resolve) => {
          transitionTimeoutRef.current = setTimeout(resolve, delay);
        });

        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }

        setUIState((prev) => ({ ...prev, transitionProgress: 100 }));

        await new Promise((resolve) => {
          transitionTimeoutRef.current = setTimeout(resolve, 50);
        });

        setUIState((prev) => ({ ...prev, transitionProgress: 0 }));
      } else {
        await new Promise((resolve) => {
          transitionTimeoutRef.current = setTimeout(resolve, delay);
        });
      }

      setAppState(newState);
    },
    []
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (forceRenderTimeoutRef.current) {
        clearTimeout(forceRenderTimeoutRef.current);
      }
    };
  }, []);

  // Session check memoization
  const sessionCheck = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        authStoreData: null,
        privateStoreData: null,
        hasValidSession: false,
      };
    }

    const authStoreData = localStorage.getItem("auth-store");
    const privateStoreData = localStorage.getItem("private-store");
    const hasValidSession =
      (privateStoreData && JSON.parse(privateStoreData)?.raw?.session) || false;

    return { authStoreData, privateStoreData, hasValidSession };
  }, []);

  // Handle auth state changes when ready
  useEffect(() => {
    if (appState === APP_STATES.READY && (!isAuthenticated || !isConnected)) {
      const timeoutId = setTimeout(() => {
        setAppState(APP_STATES.CHECKING_SESSION);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isConnected, appState]);

  // Main state machine effect
  useEffect(() => {
    let isMounted = true;

    const manageAppState = async (): Promise<void> => {
      if (!isMounted) return;

      switch (appState) {
        case APP_STATES.INITIALIZING: {
          if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              registrations.forEach((registration) => {
                registration.update();
              });
            });
          }
          const delay = getTransitionDelay(APP_STATES.INITIALIZING, APP_STATES.HYDRATING);
          await transitionToState(APP_STATES.HYDRATING, delay);
          break;
        }

        case APP_STATES.SCANNING_STORAGE: {
          const delay = getTransitionDelay(APP_STATES.SCANNING_STORAGE, APP_STATES.HYDRATING);
          await transitionToState(APP_STATES.HYDRATING, delay);
          break;
        }

        case APP_STATES.HYDRATING: {
          if (_hasHydrated || uiState.forceRender) {
            const delay = getTransitionDelay(APP_STATES.HYDRATING, APP_STATES.CHECKING_SESSION);
            await transitionToState(APP_STATES.CHECKING_SESSION, delay);
          } else {
            if (forceRenderTimeoutRef.current) {
              clearTimeout(forceRenderTimeoutRef.current);
            }
            forceRenderTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                setUIState((prev) => ({ ...prev, forceRender: true }));
              }
            }, TIMING.FORCE_RENDER_TIMEOUT_MS);
          }
          break;
        }

        case APP_STATES.CHECKING_SESSION: {
          const check = sessionCheck;

          if (upgrade) {
            const delay = getTransitionDelay(APP_STATES.CHECKING_SESSION, APP_STATES.UPGRADING);
            await transitionToState(APP_STATES.UPGRADING, delay, false);
          } else if (isAuthenticated && isConnected && check.hasValidSession) {
            const delay = getTransitionDelay(APP_STATES.CHECKING_SESSION, APP_STATES.LOADING_APP);
            await transitionToState(APP_STATES.LOADING_APP, delay);
          } else if (check.authStoreData && check.hasValidSession && !isAuthenticated) {
            const delay = getTransitionDelay(APP_STATES.CHECKING_SESSION, APP_STATES.LOADING_APP);
            await transitionToState(APP_STATES.LOADING_APP, delay);
          } else if (!isAuthenticated || !isConnected) {
            const delay = getTransitionDelay(APP_STATES.CHECKING_SESSION, APP_STATES.AUTHENTICATING);
            await transitionToState(APP_STATES.AUTHENTICATING, delay);
          } else if (check.authStoreData && !check.hasValidSession) {
            const delay = getTransitionDelay(APP_STATES.CHECKING_SESSION, APP_STATES.AUTHENTICATING);
            await transitionToState(APP_STATES.AUTHENTICATING, delay);
          } else {
            const delay = getTransitionDelay(APP_STATES.CHECKING_SESSION, APP_STATES.AUTHENTICATING);
            await transitionToState(APP_STATES.AUTHENTICATING, delay);
          }
          break;
        }

        case APP_STATES.AUTHENTICATING: {
          if (isAuthenticated && isConnected) {
            const delay = getTransitionDelay(APP_STATES.AUTHENTICATING, APP_STATES.CONNECTING);
            await transitionToState(APP_STATES.CONNECTING, delay);
          }
          break;
        }

        case APP_STATES.CONNECTING: {
          if (isAuthenticated && isConnected) {
            const delay = getTransitionDelay(APP_STATES.CONNECTING, APP_STATES.LOADING_APP);
            await transitionToState(APP_STATES.LOADING_APP, delay);
          }
          break;
        }

        case APP_STATES.LOADING_APP: {
          const delay = getTransitionDelay(APP_STATES.LOADING_APP, APP_STATES.READY);
          await transitionToState(APP_STATES.READY, delay);
          break;
        }

        case APP_STATES.UPGRADING: {
          if (!upgrade) {
            const delay = getTransitionDelay(APP_STATES.UPGRADING, APP_STATES.READY);
            await transitionToState(APP_STATES.READY, delay);
          }
          break;
        }

        case APP_STATES.READY: {
          if (upgrade) {
            const delay = getTransitionDelay(APP_STATES.READY, APP_STATES.UPGRADING);
            await transitionToState(APP_STATES.UPGRADING, delay, false);
          }
          if (uiState.showSplash) {
            setTimeout(() => {
              if (isMounted) {
                setUIState((prev) => ({ ...prev, showSplash: false }));
              }
            }, 300);
          }
          break;
        }
      }
    };

    manageAppState();

    return () => {
      isMounted = false;
    };
  }, [
    appState,
    hasHydrated,
    _hasHydrated,
    uiState.forceRender,
    uiState.storageScanComplete,
    uiState.showSplash,
    isAuthenticated,
    isConnected,
    upgrade,
    transitionToState,
    getTransitionDelay,
    sessionCheck,
  ]);

  const handleSplashComplete = useCallback((): void => {
    setUIState((prev) => ({ ...prev, showSplash: false }));
  }, []);

  const handleUpgradeComplete = useCallback((): void => {
    setUpgrade(false);
  }, [setUpgrade]);

  return {
    appState,
    uiState,
    setUIState,
    handleSplashComplete,
    handleUpgradeComplete,
    upgradeEndDate,
  };
}
