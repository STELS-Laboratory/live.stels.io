/**
 * Loading Screen Components
 * Displays various loading states during app initialization
 */

import React from "react";
import { motion } from "framer-motion";
import { STATE_MESSAGES, type AppState } from "@/lib/constants";

interface LoadingScreenProps {
  message: string;
  progress: number;
  appState: AppState;
}

/**
 * Get state message for display
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getStateMessage(state: AppState): string {
  return STATE_MESSAGES[state] || "Loading...";
}

/**
 * Main loading screen component
 */
export function LoadingScreen({
  message,
  progress,
  appState,
}: LoadingScreenProps): React.ReactElement {
  return (
    <motion.div
      className="absolute max-w-[500px] mx-auto w-full h-full overflow-hidden left-0 right-0 top-0 bottom-0 bg-background flex items-center justify-center p-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="w-full max-w-md space-y-6 text-center"
        initial={{ scale: 0.92, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Animated spinner */}
        <motion.div
          className="relative mx-auto w-20 h-20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 1,
            delay: 0.3,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          <motion.div
            className="absolute inset-0 border-4 border-amber-500/20 rounded-full"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute inset-2 border-2 border-transparent border-t-blue-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>

        {/* Title and message */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.h2
            className="text-2xl font-bold text-foreground mb-2"
            animate={{
              opacity: [1, 0.95, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            STELS
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-lg"
            key={message}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {message}
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.7,
            delay: 0.6,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <motion.p
            className="text-xs text-muted-foreground"
            key={Math.round(progress)}
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {Math.round(progress)}% complete
          </motion.p>
        </motion.div>

        {/* State indicator */}
        <motion.div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.div
            className="w-2 h-2 bg-amber-400 rounded-full"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [1, 0.4, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.span
            key={appState}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            State: {appState.replace("_", " ")}
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Auth view wrapper with animation
 */
export function AuthViewWrapper({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
