/**
 * App Launcher Component
 * Document-oriented launch screen with real progress tracking
 */

import { type ReactElement, useEffect, useState } from "react";
import { Database, Layers } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { LaunchStep, AppLauncherProps } from "@/types/components/main/types";

const LAUNCH_STEPS: LaunchStep[] = [
  { label: "Initializing", progress: 10 },
  { label: "Resolving schema", progress: 30 },
  { label: "Loading channels", progress: 50 },
  { label: "Preparing data", progress: 70 },
  { label: "Rendering UI", progress: 90 },
  { label: "Ready", progress: 100 },
];

/**
 * Document-oriented app launcher with progress bar
 */
export default function AppLauncher({
  appName,
  appType,
  currentStep,
}: AppLauncherProps): ReactElement {
  const [displayedProgress, setDisplayedProgress] = useState(0);

  const currentStepData = LAUNCH_STEPS[currentStep] || LAUNCH_STEPS[0];
  const targetProgress = currentStepData.progress;

  // Smooth progress animation
  useEffect(() => {
    if (displayedProgress < targetProgress) {
      const increment = (targetProgress - displayedProgress) / 10;
      const timer = setTimeout(() => {
        setDisplayedProgress((prev) =>
          Math.min(prev + increment, targetProgress)
        );
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [displayedProgress, targetProgress]);

  // Icon based on app type
  const AppIcon = appType === "static" ? Layers : Database;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -5 }}
          transition={{
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative max-w-md w-full mx-4"
        >
          {/* Main card - document style */}
          <div className="bg-card border border-border rounded shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.2, ease: "easeOut" }}
                  className="w-10 h-10 bg-muted rounded flex items-center justify-center"
                >
                  <AppIcon className="w-5 h-5 text-foreground" />
                </motion.div>
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.08, duration: 0.2 }}
                  className="flex-1 min-w-0"
                >
                  <h2 className="text-base font-semibold text-foreground truncate">
                    {appName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {appType === "static" ? "Container App" : "Dynamic Widget"}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.2 }}
              className="px-6 py-6"
            >
              {/* Progress bar */}
              <div className="mb-4">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-foreground"
                    initial={{ width: "0%" }}
                    animate={{ width: `${displayedProgress}%` }}
                    transition={{
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-sm mb-6">
                <motion.span
                  key={currentStepData.label}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-muted-foreground"
                >
                  {currentStepData.label}
                </motion.span>
                <motion.span
                  className="text-foreground font-mono font-medium tabular-nums"
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {Math.round(displayedProgress)}%
                </motion.span>
              </div>

              {/* Steps list */}
              <div className="space-y-2">
                {LAUNCH_STEPS.map((step, index) => {
                  const isComplete = index < currentStep;
                  const isCurrent = index === currentStep;
                  const isPending = index > currentStep;

                  return (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{
                        opacity: isPending ? 0.4 : 1,
                        x: 0,
                      }}
                      transition={{
                        delay: index * 0.04,
                        duration: 0.2,
                        opacity: { duration: 0.15 },
                      }}
                      className="flex items-center gap-2 text-xs"
                    >
                      <motion.div
                        animate={isCurrent
                          ? {
                            scale: [1, 1.3, 1],
                          }
                          : {}}
                        transition={{
                          duration: 0.6,
                          repeat: isCurrent ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                          isComplete
                            ? "bg-foreground"
                            : isCurrent
                            ? "bg-foreground"
                            : "bg-muted"
                        }`}
                      />
                      <span
                        className={`transition-colors duration-200 ${
                          isComplete || isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
