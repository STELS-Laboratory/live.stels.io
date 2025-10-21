import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

/**
 * Get theme label for tooltip
 */
function getThemeLabel(theme: "light" | "dark" | "system"): string {
  const labels = {
    system: "System theme",
    light: "Light theme",
    dark: "Dark theme",
  };
  return labels[theme];
}

/**
 * Get next theme in cycle
 */
function getNextTheme(current: "light" | "dark" | "system"): string {
  if (current === "system") return "Light";
  if (current === "light") return "Dark";
  return "System";
}

/**
 * Theme toggle component with smooth animations and three modes
 */
export function ThemeToggle(): React.ReactElement {
  const { theme, resolvedTheme, toggleTheme } = useThemeStore();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-full"
            aria-label={`Current: ${getThemeLabel(theme)}. Click for ${
              getNextTheme(theme)
            }`}
          >
            {/* Sun icon for light theme */}
            <motion.div
              initial={false}
              animate={{
                scale: theme === "light" ? 1 : 0,
                opacity: theme === "light" ? 1 : 0,
                rotate: theme === "light" ? 0 : 90,
              }}
              transition={{
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun className="h-4 w-4 text-amber-500" />
            </motion.div>

            {/* Moon icon for dark theme */}
            <motion.div
              initial={false}
              animate={{
                scale: theme === "dark" ? 1 : 0,
                opacity: theme === "dark" ? 1 : 0,
                rotate: theme === "dark" ? 0 : -90,
              }}
              transition={{
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon className="h-4 w-4 text-amber-500" />
            </motion.div>

            {/* Monitor icon for system theme */}
            <motion.div
              initial={false}
              animate={{
                scale: theme === "system" ? 1 : 0,
                opacity: theme === "system" ? 1 : 0,
                rotate: theme === "system" ? 0 : 180,
              }}
              transition={{
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Monitor className="h-4 w-4 text-amber-500" />
            </motion.div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{getThemeLabel(theme)}</p>
          {theme === "system" && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Using {resolvedTheme} (from system)
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Click for {getNextTheme(theme)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact theme toggle for mobile with three modes
 */
export function ThemeToggleCompact(): React.ReactElement {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition-colors"
      aria-label={`Current: ${getThemeLabel(theme)}. Click for ${
        getNextTheme(theme)
      }`}
    >
      {/* Sun icon for light theme */}
      <motion.div
        initial={false}
        animate={{
          scale: theme === "light" ? 1 : 0,
          opacity: theme === "light" ? 1 : 0,
          rotate: theme === "light" ? 0 : 90,
        }}
        transition={{
          duration: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute"
      >
        <Sun className="h-4 w-4 text-amber-500" />
      </motion.div>

      {/* Moon icon for dark theme */}
      <motion.div
        initial={false}
        animate={{
          scale: theme === "dark" ? 1 : 0,
          opacity: theme === "dark" ? 1 : 0,
          rotate: theme === "dark" ? 0 : -90,
        }}
        transition={{
          duration: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute"
      >
        <Moon className="h-4 w-4 text-amber-500" />
      </motion.div>

      {/* Monitor icon for system theme */}
      <motion.div
        initial={false}
        animate={{
          scale: theme === "system" ? 1 : 0,
          opacity: theme === "system" ? 1 : 0,
          rotate: theme === "system" ? 0 : 180,
        }}
        transition={{
          duration: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute"
      >
        <Monitor className="h-4 w-4 text-amber-500" />
      </motion.div>
    </button>
  );
}
