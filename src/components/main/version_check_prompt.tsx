/**
 * Version Check Prompt
 * Shows a notification when a new version is detected
 */

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { startVersionCheck, storeCurrentVersion } from "@/lib/version_check";
import { createNewSession } from "@/lib/session_manager";

/**
 * Version Check Prompt Component
 * Periodically checks for new versions and prompts user to reload
 */
export default function VersionCheckPrompt(): React.ReactElement | null {
  const [showPrompt, setShowPrompt] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);

  useEffect(() => {
    console.log("[VersionCheckPrompt] Starting version monitoring...");

    // Start version checking
    const stopChecking = startVersionCheck((version) => {
      console.log("[VersionCheckPrompt] New version detected:", version);
      setNewVersion(version);
      setShowPrompt(true);
    });

    // Cleanup on unmount
    return () => {
      stopChecking();
    };
  }, []);

  /**
   * Handle reload
   */
  const handleReload = async (): Promise<void> => {
    // Store new version and create new session
    if (newVersion) {
      storeCurrentVersion(newVersion);
      localStorage.setItem("app-last-version", newVersion);
    }

    // Force new session to invalidate all cached resources
    const newSessionId = createNewSession();
    console.log("[VersionCheckPrompt] Created new session:", newSessionId);

    // Clear service worker caches (including schemas)
    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        console.log("[VersionCheckPrompt] Found caches:", cacheNames);

        await Promise.all(cacheNames.map(async (name) => {
          console.log("[VersionCheckPrompt] Deleting cache:", name);
          await caches.delete(name);
        }));

        console.log(
          "[VersionCheckPrompt] All caches cleared (including schemas)",
        );
      }

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log("[VersionCheckPrompt] Service workers unregistered");
      }
    } catch (error) {
      console.error("[VersionCheckPrompt] Error clearing caches:", error);
    }

    // Reload
    window.location.reload();
  };

  /**
   * Handle dismiss
   */
  const handleDismiss = (): void => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur-sm shadow-lg">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    New Version Available
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    A new version of the application is available. Reload to get
                    the latest features and improvements.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReload}
                      size="sm"
                      className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reload Now
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                    >
                      Later
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
