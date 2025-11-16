/**
 * Tab Bar Component
 * Browser-style tabs for chat sessions
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStelsChatStore } from "../store";

/**
 * Tab Bar Component
 */
export function TabBar(): React.ReactElement {
  const { tabs, activeTabId, createTab, closeTab, setActiveTab } =
    useStelsChatStore();

  const handleCreateTab = (): void => {
    createTab();
  };

  const handleCloseTab = (
    e: React.MouseEvent,
    tabId: string,
  ): void => {
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <div className="flex items-center gap-1 border-b border-border bg-card/50 px-2 overflow-x-auto scrollbar-thin">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCreateTab}
        className="shrink-0"
        title="New chat"
      >
        <Plus className="icon-md" />
      </Button>

      <div className="flex items-center gap-1 flex-1 min-w-0">
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;

            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group relative flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 transition-colors shrink-0 min-w-[120px] max-w-[200px]",
                  isActive
                    ? "bg-background border-primary text-foreground"
                    : "bg-card/50 border-transparent text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <span className="text-xs font-medium truncate flex-1 text-left">
                  {tab.title}
                </span>

                <div
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCloseTab(e as unknown as React.MouseEvent, tab.id);
                    }
                  }}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/20 hover:text-destructive cursor-pointer",
                    isActive && "opacity-100",
                  )}
                >
                  <X className="icon-xs" />
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

