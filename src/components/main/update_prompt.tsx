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
          className="fixed bottom-6 right-6 left-6 z-50 max-w-md"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="bg-card/95 backdrop-blur-sm border border-amber-500/40 rounded-xl shadow-2xl shadow-amber-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl"
                >
                  <div className="absolute inset-0 bg-amber-500/10 rounded-xl blur-sm" />
                  <Download className="relative w-5 h-5 text-amber-600 dark:text-amber-400" />
                </motion.div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Update Available
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full">
                      NEW
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    New version ready to install
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                disabled={isUpdating}
                className="p-1.5 hover:bg-muted/80 rounded transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                title="Dismiss"
                aria-label="Dismiss update notification"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 bg-gradient-to-b from-transparent to-muted/20">
              <p className="text-sm text-foreground/90 mb-4 leading-relaxed">
                A new version of STELS Web 5 is available. Update now to get the
                latest features and improvements.
              </p>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex-shrink-0"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </motion.div>
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                  Your session will be preserved
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/40"
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
                  className="flex-shrink-0 border-border/50 hover:bg-muted/80 hover:border-border transition-all duration-200"
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
