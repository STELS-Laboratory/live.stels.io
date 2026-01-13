/**
 * Main Application Component
 * Entry point for the STELS Web OS application
 */

import React, { useEffect } from "react";
import { useUrlRouter } from "@/hooks/use-url-router";
import { useAuthRestore } from "@/hooks/use-auth-restore";
import { useSessionSecurity } from "@/hooks/use-session-security";
import { useTheme } from "@/hooks/use-theme";
import { useAppStateMachine } from "@/hooks/use-app-state-machine";
import { APP_STATES } from "@/lib/constants";
import {
  LoadingScreen,
  AuthViewWrapper,
  getStateMessage,
} from "@/components/main/loading-screens";
import { ReadyView } from "@/components/main/ready-view";
import { LoginPage } from "@/components/auth/login-page";
import SessionProvider from "@/components/main/provider";
import UpgradeScreen from "@/components/main/upgrade-screen";

// Inject app animations CSS
if (
  typeof document !== "undefined" &&
  !document.head.querySelector("style[data-app-animations]")
) {
  const style = document.createElement("style");
  style.setAttribute("data-app-animations", "true");
  style.textContent = `
    .animation-delay-150 {
      animation-delay: 150ms;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Prevent zoom gestures hook
 */
function usePreventZoom(): void {
  useEffect(() => {
    const preventZoom = (e: TouchEvent): void => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventGestures = (e: Event): void => {
      e.preventDefault();
      e.stopPropagation();
    };

    const preventWheel = (e: WheelEvent): void => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("touchmove", preventZoom, { passive: false });
    document.addEventListener("gesturestart", preventGestures, {
      passive: false,
    });
    document.addEventListener("gesturechange", preventGestures, {
      passive: false,
    });
    document.addEventListener("gestureend", preventGestures, {
      passive: false,
    });
    document.addEventListener("wheel", preventWheel, { passive: false });

    document.documentElement.style.touchAction = "manipulation";
    document.body.style.touchAction = "manipulation";

    return () => {
      document.removeEventListener("touchstart", preventZoom);
      document.removeEventListener("touchmove", preventZoom);
      document.removeEventListener("gesturestart", preventGestures);
      document.removeEventListener("gesturechange", preventGestures);
      document.removeEventListener("gestureend", preventGestures);
      document.removeEventListener("wheel", preventWheel);
    };
  }, []);
}

/**
 * Theme synchronization hook
 */
function useThemeSync(): void {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);
}

/**
 * Main Dashboard/App Component
 */
export default function Dashboard(): React.ReactElement {
  const {
    appState,
    uiState,
    handleSplashComplete,
    handleUpgradeComplete,
    upgradeEndDate,
  } = useAppStateMachine();

  // Initialize hooks
  useThemeSync();
  usePreventZoom();
  useUrlRouter();
  useAuthRestore();
  useSessionSecurity();

  // Render based on app state
  switch (appState) {
    case APP_STATES.INITIALIZING:
      return (
        <LoadingScreen
          message={getStateMessage(appState)}
          progress={uiState.transitionProgress}
          appState={appState}
        />
      );

    case APP_STATES.SCANNING_STORAGE:
      return (
        <LoadingScreen
          message={getStateMessage(APP_STATES.HYDRATING)}
          progress={uiState.transitionProgress}
          appState={appState}
        />
      );

    case APP_STATES.HYDRATING:
    case APP_STATES.CHECKING_SESSION:
      return (
        <LoadingScreen
          message={getStateMessage(appState)}
          progress={uiState.transitionProgress}
          appState={appState}
        />
      );

    case APP_STATES.AUTHENTICATING:
      return (
        <AuthViewWrapper>
          <LoginPage />
        </AuthViewWrapper>
      );

    case APP_STATES.CONNECTING:
      return (
        <LoadingScreen
          message={getStateMessage(appState)}
          progress={uiState.transitionProgress}
          appState={appState}
        />
      );

    case APP_STATES.LOADING_APP:
      return (
        <LoadingScreen
          message={getStateMessage(appState)}
          progress={uiState.transitionProgress}
          appState={appState}
        />
      );

    case APP_STATES.UPGRADING:
      return (
        <SessionProvider>
          <UpgradeScreen
            onComplete={handleUpgradeComplete}
            endDate={upgradeEndDate}
          />
        </SessionProvider>
      );

    case APP_STATES.READY:
      return (
        <ReadyView
          showSplash={uiState.showSplash}
          onSplashComplete={handleSplashComplete}
        />
      );

    default:
      return (
        <LoadingScreen
          message="Initializing..."
          progress={0}
          appState={APP_STATES.INITIALIZING}
        />
      );
  }
}
