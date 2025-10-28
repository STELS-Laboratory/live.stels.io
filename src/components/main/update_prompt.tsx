/**
 * PWA Update Prompt
 * Notifies users about new app updates and allows them to update with one click
 * Preserves user session and all data
 */

import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Update prompt component
 * Shows notification when new version is available
 */
export default function UpdatePrompt(): React.ReactElement | null {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log("[PWA] Service Worker registered:", registration);
    },
    onRegisterError(error) {
      console.error("[PWA] Service Worker registration error:", error);
    },
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Don't show update prompt in development mode
  const isDevelopment = import.meta.env.DEV;

  // Log when update is available
  useEffect(() => {
    if (needRefresh) {
      if (isDevelopment) {
        console.log("[PWA] Update available (hidden in dev mode)");
      } else {
        console.log("[PWA] New version available! Prompting user to update.");
      }
    }
  }, [needRefresh, isDevelopment]);

  // Don't show in development
  if (isDevelopment) {
    return null;
  }

  /**
   * Handle update button click
   * Updates service worker and reloads the app
   * Session data is preserved in localStorage and sessionStorage
   */
  const handleUpdate = async (): Promise<void> => {
    setIsUpdating(true);

    try {
      console.log("[PWA] Updating to new version...");

      // Update service worker
      await updateServiceWorker(true);

      // App will reload automatically
      console.log("[PWA] Update complete, reloading...");
    } catch (error) {
      console.error("[PWA] Update failed:", error);
      setIsUpdating(false);
    }
  };

  /**
   * Handle dismiss button click
   * User can continue using current version
   */
  const handleDismiss = (): void => {
    console.log("[PWA] User dismissed update notification");
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="bg-card border border-amber-500/50 rounded-lg shadow-2xl shadow-amber-500/20 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="p-2 bg-amber-500/20 rounded-full"
                >
                  <Download className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                </motion.div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Update Available
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    New version ready to install
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                disabled={isUpdating}
                className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                title="Dismiss"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-sm text-foreground mb-3">
                A new version of STELS Web 5 is available. Update now to get the
                latest features and improvements.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Your session will be preserved</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center justify-center gap-2"
                >
                  {isUpdating
                    ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="flex-shrink-0"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </motion.div>
                        <span>Updating...</span>
                      </>
                    )
                    : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Update Now</span>
                      </>
                    )}
                </Button>
                <Button
                  onClick={handleDismiss}
                  disabled={isUpdating}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  Later
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
