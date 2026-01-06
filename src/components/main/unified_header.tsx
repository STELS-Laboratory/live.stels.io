import React from "react";
import { useAppStore } from "@/stores";
import { navigateTo } from "@/lib/router";
import { ConnectionStatusSimple } from "@/components/auth/connection_status_simple";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Boxes, Code, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/main/mobile_menu";
import { useMobile } from "@/hooks/use_mobile";

/**
 * Unified Header Component
 * Used in both welcome page and applications (Editor/Canvas)
 */
export function UnifiedHeader(): React.ReactElement {
  const { currentRoute } = useAppStore();
  const isMobile = useMobile();

  return (
    <header 
      role="banner"
      className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo/Home */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo("welcome")}
            className="flex items-center gap-2"
            aria-label="Go to home page"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">STELS</span>
          </Button>

          {/* Navigation - Hidden on mobile, shown in mobile menu */}
          {!isMobile && (
            <nav 
              role="navigation" 
              aria-label="Main navigation"
              className="flex items-center gap-2"
            >
              <Button
                variant={currentRoute === "editor" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigateTo("editor")}
                aria-current={currentRoute === "editor" ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2",
                  currentRoute === "editor" &&
                    "bg-primary text-primary-foreground",
                )}
              >
                <Code className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Editor</span>
              </Button>
              <Button
                variant={currentRoute === "canvas" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigateTo("canvas")}
                aria-current={currentRoute === "canvas" ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2",
                  currentRoute === "canvas" &&
                    "bg-primary text-primary-foreground",
                )}
              >
                <Boxes className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Canvas</span>
              </Button>
            </nav>
          )}
        </div>

        {/* Connection Status, Theme Toggle & Mobile Menu */}
        <div 
          role="toolbar" 
          aria-label="Header actions"
          className="flex items-center gap-2"
        >
          <ThemeToggle />
          <ConnectionStatusSimple />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
