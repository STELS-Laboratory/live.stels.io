/**
 * App Tabs Component
 * macOS-style tabs in header for open applications
 */

import type { ReactElement } from "react";
import {
  Activity,
  Boxes,
  Code,
  Coins,
  Database,
  FileCode,
  FileText,
  Home,
  Layers,
  Layout as LayoutIcon,
  MessageSquare,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useOpenAppsStore } from "@/stores/modules/open_apps.ts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navigateTo } from "@/lib/router.ts";
import { useAppStore } from "@/stores";
import { useMobile } from "@/hooks/use_mobile";

interface DevTool {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

const DEV_TOOLS: DevTool[] = [
  { key: "trading", name: "Trading", icon: TrendingUp, shortcut: "T" },
  { key: "editor", name: "Editor", icon: Code, shortcut: "E" },
  { key: "canvas", name: "Canvas", icon: Boxes, shortcut: "C" },
  { key: "schemas", name: "Schemas", icon: LayoutIcon, shortcut: "S" },
  { key: "docs", name: "Docs", icon: FileText, shortcut: "D" },
  { key: "template", name: "Template", icon: FileCode, shortcut: "M" },
  { key: "token-builder", name: "Token Builder", icon: Coins, shortcut: "B" },
  { key: "wallet", name: "Wallet", icon: Wallet, shortcut: "W" },
  { key: "stels-chat", name: "Stels Chat", icon: MessageSquare, shortcut: "O" },
  { key: "indexes", name: "Indexes", icon: Activity, shortcut: "I" },
];

/**
 * Tabs bar for managing open applications and development tools
 */
export default function AppTabs(): ReactElement {
  const { apps, activeAppId, setActiveApp, closeApp } = useOpenAppsStore();
  const { currentRoute, allowedRoutes } = useAppStore();
  const mobile = useMobile();

  const handleTabClick = (appId: string): void => {
    // Set as active - Welcome will auto-open it
    setActiveApp(appId);

    // Navigate to welcome if not already there
    if (currentRoute !== "welcome") {
      navigateTo("welcome");
    }
  };

  const handleHomeClick = (): void => {
    // Clear active app to return to hub view
    setActiveApp("");
    navigateTo("welcome");
  };

  const isOnWelcome = currentRoute === "welcome";

  // Filter available dev tools based on allowed routes
  const availableDevTools = DEV_TOOLS.filter((tool) =>
    allowedRoutes.includes(tool.key)
  );

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 px-2 h-12 border-b border-border bg-card/30 overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {/* Home button - Widget Store */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <motion.button
              onClick={handleHomeClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`
                flex items-center justify-center w-8 h-8 rounded transition-colors duration-200 flex-shrink-0
                ${
                isOnWelcome
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
              `}
            >
              <Home className="w-4 h-4" />
            </motion.button>
          </TooltipTrigger>
          {!mobile && (
            <TooltipContent side="bottom">
              <div className="flex flex-col gap-1">
                <span className="font-semibold">Widget Store</span>
                <span className="text-muted-foreground">
                  Browse and launch apps · ⌘0
                </span>
              </div>
            </TooltipContent>
          )}
        </Tooltip>

        {/* Development Tools - Available for all users in tabs */}
        {availableDevTools.length > 0 && (
          <>
            <div className="h-6 w-px bg-border mx-1 flex-shrink-0" />

            {availableDevTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = currentRoute === tool.key;

              return (
                <Tooltip key={tool.key} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => navigateTo(tool.key)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className={`
                        relative flex items-center justify-center w-8 h-8 rounded transition-colors duration-200 flex-shrink-0
                        ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="devtool-indicator"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-foreground rounded-full"
                          transition={{
                            duration: 0.2,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  {!mobile && (
                    <TooltipContent side="bottom">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{tool.name}</span>
                        {tool.shortcut && (
                          <span className="text-muted-foreground">
                            Development Tool · ⌘⇧{tool.shortcut}
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </>
        )}

        {/* Separator before user agents */}
        {apps.length > 0 && (
          <div className="h-6 w-px bg-border mx-1 flex-shrink-0" />
        )}

        {/* User Agent tabs */}
        {apps.map((app, index) => {
          const isActive = app.id === activeAppId;
          const Icon = app.type === "static" ? Layers : Database;

          // Keyboard shortcut (Cmd+1, Cmd+2, etc.)
          const shortcut = index < 9 ? `⌘${index + 1}` : undefined;

          return (
            <Tooltip key={app.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <motion.div
                  onClick={() => handleTabClick(app.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`
                    group relative flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 cursor-pointer flex-shrink-0
                    ${
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                  `}
                >
                  {/* Icon */}
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />

                  {/* App name */}
                  <span className="text-xs font-medium max-w-[100px] truncate">
                    {app.displayName || app.name}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="agent-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-500 rounded-full"
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}

                  {/* Close button */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeApp(app.id);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-0.5 rounded transition-opacity duration-150 hover:bg-red-500/20 hover:text-red-500 ${
                      mobile
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                    title="Close agent"
                  >
                    <X className="w-3 h-3" />
                  </motion.button>

                  {/* Keyboard shortcut badge - hide on mobile */}
                  {!mobile && shortcut && !isActive && (
                    <span className="text-[9px] text-muted-foreground font-mono opacity-0 group-hover:opacity-50 transition-opacity duration-150">
                      {shortcut}
                    </span>
                  )}
                </motion.div>
              </TooltipTrigger>
              {!mobile && (
                <TooltipContent side="bottom" className="text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">
                      {app.displayName || app.name}
                    </span>
                    <span className="text-muted-foreground">
                      User Agent ·{" "}
                      {app.type === "static" ? "Container" : "Widget"}
                      {shortcut && ` · ${shortcut}`}
                    </span>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}

        {/* Close all user apps button */}
        {apps.length > 1 && (
          <>
            <div className="flex-1" />
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    // Close all apps without confirmation
                    useOpenAppsStore.getState().closeAllApps();
                  }}
                  className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
                >
                  Close All Agents
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Close all open user agents
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
