/**
 * App Shortcuts Component
 * Global keyboard shortcuts for app management (Cmd+0-9, Cmd+Tab, etc.)
 */

import { useCallback, useEffect } from "react";
import { useOpenAppsStore } from "@/stores/modules/open_apps.ts";
import { navigateTo } from "@/lib/router.ts";
import { useAppStore } from "@/stores";

/**
 * Global keyboard shortcuts handler for app navigation
 * - Cmd/Ctrl + 0: Go to Widget Store (Welcome)
 * - Cmd/Ctrl + Shift + E/C/S/D: Development Tools
 * - Cmd/Ctrl + 1-9: Switch to user agent by index
 * - Cmd/Ctrl + Tab: Switch to next app
 * - Cmd/Ctrl + Shift + Tab: Switch to previous app
 */
export default function AppShortcuts(): null {
  const { apps, activeAppId, setActiveApp } = useOpenAppsStore();
  const currentRoute = useAppStore((state) => state.currentRoute);

  const goToHome = useCallback((): void => {
    // Clear active app to return to hub view
    setActiveApp("");
    navigateTo("welcome");
  }, [setActiveApp]);

  const switchToApp = useCallback(
    (appId: string): void => {
      // Set as active - Welcome will auto-open it
      setActiveApp(appId);

      // Navigate to welcome if not already there
      if (currentRoute !== "welcome") {
        navigateTo("welcome");
      }
    },
    [currentRoute, setActiveApp],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Only handle shortcuts when Cmd/Ctrl is pressed
      if (!e.metaKey && !e.ctrlKey) return;

      // Cmd/Ctrl + 0: Go to Widget Store (Welcome)
      if (e.key === "0") {
        e.preventDefault();
        goToHome();
        return;
      }

      // Cmd/Ctrl + Shift + Letter: Development Tools
      if (e.shiftKey) {
        if (e.key === "E" || e.key === "e") {
          e.preventDefault();
          navigateTo("editor");
          return;
        }
        if (e.key === "C" || e.key === "c") {
          e.preventDefault();
          navigateTo("canvas");
          return;
        }
        if (e.key === "S" || e.key === "s") {
          e.preventDefault();
          navigateTo("schemas");
          return;
        }
        if (e.key === "D" || e.key === "d") {
          e.preventDefault();
          navigateTo("docs");
          return;
        }
        if (e.key === "T" || e.key === "t") {
          e.preventDefault();
          navigateTo("template");
          return;
        }
        if (e.key === "B" || e.key === "b") {
          e.preventDefault();
          navigateTo("token-builder");
          return;
        }
      }

      // Cmd/Ctrl + 1-9: Switch to user agent by index
      if (e.key >= "1" && e.key <= "9" && !e.shiftKey) {
        const index = parseInt(e.key) - 1;
        if (apps[index]) {
          e.preventDefault();
          switchToApp(apps[index].id);
        }
        return;
      }

      // Cmd/Ctrl + Tab: Switch to next/previous app
      if (e.key === "Tab" && apps.length > 0) {
        e.preventDefault();

        const currentIndex = apps.findIndex((app) => app.id === activeAppId);

        if (currentIndex === -1) {
          // No active app, activate first
          switchToApp(apps[0].id);
          return;
        }

        if (e.shiftKey) {
          // Previous app
          const prevIndex = currentIndex === 0
            ? apps.length - 1
            : currentIndex - 1;
          switchToApp(apps[prevIndex].id);
        } else {
          // Next app
          const nextIndex = currentIndex === apps.length - 1
            ? 0
            : currentIndex + 1;
          switchToApp(apps[nextIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [apps, activeAppId, goToHome, switchToApp]);

  return null;
}
