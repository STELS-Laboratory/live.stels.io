/**
 * Tab Bar Component
 * Browser-style tabs for chat sessions
 */

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useMobile } from "@/hooks/use_mobile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStelsChatStore } from "../store";

/**
 * Tab Bar Component
 */
export function TabBar(): React.ReactElement {
  const isMobile = useMobile();
  const { tabs, activeTabId, createTab, closeTab, setActiveTab } =
    useStelsChatStore();
  const [swipedTabId, setSwipedTabId] = useState<string | null>(null);
  const [longPressTabId, setLongPressTabId] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number; tabId: string } | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCreateTab = (): void => {
    createTab();
  };

  const handleCloseTab = (
    e: React.MouseEvent | React.TouchEvent | any,
    tabId: string,
  ): void => {
    e.stopPropagation();
    e.preventDefault();
    closeTab(tabId);
    setSwipedTabId(null);
    setLongPressTabId(null);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, tabId: string): void => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        tabId,
      };

      // Long press detection for delete
      longPressTimeoutRef.current = setTimeout(() => {
        setLongPressTabId(tabId);
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 500);
    },
    [],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent, tabId: string): void => {
    if (!touchStartRef.current || touchStartRef.current.tabId !== tabId) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if user is swiping
    if (Math.abs(deltaX) > 10 || deltaY > 10) {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      setLongPressTabId(null);
    }

    // Swipe left to reveal delete button
    if (deltaX < -30 && deltaY < 50) {
      setSwipedTabId(tabId);
    } else if (deltaX > 10) {
      // Swipe right to hide delete button
      setSwipedTabId(null);
    }
  }, []);

  const handleTouchEnd = useCallback((tabId: string): void => {
    // Check if this tab was long pressed
    setLongPressTabId((current) => {
      if (current === tabId) {
        // Delete the tab if it was long pressed
        closeTab(tabId);
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
        return null;
      }
      return current;
    });

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    touchStartRef.current = null;
    // Reset states after a short delay to allow animations
    setTimeout(() => {
      setLongPressTabId(null);
      setSwipedTabId(null);
    }, 200);
  }, [closeTab]);

  return (
    <div
      className={cn(
        "flex items-center border-b border-border/60 bg-card/80 backdrop-blur-sm overflow-x-auto scrollbar-thin",
        isMobile ? "gap-1.5 px-2 h-11" : "gap-2 px-3 h-10",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCreateTab}
        className={cn(
          "shrink-0 transition-all duration-200",
          isMobile
            ? "h-9 w-9 hover:bg-primary/10 hover:text-primary active:scale-95"
            : "h-8 w-8",
        )}
        title="New chat"
      >
        <Plus
          className={cn(
            "transition-transform duration-200",
            isMobile ? "w-4 h-4" : "icon-md",
          )}
        />
      </Button>

      <div
        className={cn(
          "flex items-center flex-1 min-w-0",
          isMobile ? "gap-1.5" : "gap-2",
        )}
      >
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isSwiped = swipedTabId === tab.id;
            const isLongPressed = longPressTabId === tab.id;

            return (
              <div
                key={tab.id}
                className="relative shrink-0"
              >
                <motion.button
                  initial={{ opacity: 0, scale: 0.9, x: -10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: isSwiped ? (isMobile ? -36 : 0) : 0,
                  }}
                  exit={{ opacity: 0, scale: 0.9, x: -10 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                  onTouchStart={(e) => handleTouchStart(e, tab.id)}
                  onTouchMove={(e) => handleTouchMove(e, tab.id)}
                  onTouchEnd={() => handleTouchEnd(tab.id)}
                  onClick={() => {
                    if (!isSwiped && !isLongPressed) {
                      setActiveTab(tab.id);
                    }
                    setSwipedTabId(null);
                    setLongPressTabId(null);
                  }}
                  className={cn(
                    "group relative flex items-center rounded-t-xl border-b-2 transition-all duration-200 shrink-0 touch-none overflow-hidden",
                    isMobile
                      ? "gap-2 px-3.5 py-2.5 min-w-[90px] max-w-[160px] h-9"
                      : "gap-2.5 px-4 py-2.5 min-w-[130px] max-w-[220px]",
                    isActive
                      ? "bg-background/95 border-primary text-foreground shadow-sm"
                      : "bg-card/60 border-transparent text-muted-foreground hover:bg-card/80 hover:text-foreground hover:border-border",
                    isLongPressed &&
                      "bg-destructive/15 border-destructive/60 shadow-md",
                    isSwiped &&
                      isMobile &&
                      "bg-destructive/8 border-destructive/30",
                  )}
                >
                  {/* Background gradient for active tab */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-t-xl"
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  <span
                    className={cn(
                      "font-medium truncate flex-1 text-left relative z-10",
                      isMobile ? "text-xs leading-tight" : "text-xs",
                      isActive && "font-semibold",
                    )}
                  >
                    {tab.title}
                  </span>

                  {/* Delete button - always visible on mobile */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleCloseTab(e, tab.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCloseTab(e, tab.id);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-center rounded transition-all duration-200 cursor-pointer relative z-10 select-none",
                      isMobile
                        ? "w-7 h-7 -mr-1 bg-destructive/15 hover:bg-destructive/25 active:bg-destructive/35 active:scale-90 text-destructive touch-manipulation"
                        : "w-6 h-6 hover:bg-destructive/20 hover:text-destructive opacity-0 group-hover:opacity-100",
                      isActive && !isMobile && "opacity-100",
                    )}
                  >
                    <X
                      className={cn(
                        "transition-transform duration-200 pointer-events-none",
                        isMobile ? "w-3.5 h-3.5" : "icon-xs",
                      )}
                    />
                  </motion.div>

                  {/* Long press indicator */}
                  {isLongPressed && isMobile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 flex items-center justify-center bg-destructive/20 rounded-t-xl border-2 border-destructive/60 backdrop-blur-sm z-20"
                    >
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-bold text-destructive uppercase tracking-wide"
                      >
                        Release to delete
                      </motion.span>
                    </motion.div>
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"
                      transition={{
                        duration: 0.25,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  )}

                  {/* Hover effect overlay */}
                  {!isActive && !isMobile && (
                    <motion.div
                      className="absolute inset-0 bg-primary/5 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                  )}
                </motion.button>

                {/* Swipe delete hint */}
                {isSwiped && isMobile && !isLongPressed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.9 }}
                    className="absolute right-0 top-0 bottom-0 flex items-center px-3 bg-destructive/15 rounded-r-xl pointer-events-none z-10 backdrop-blur-sm"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
