/**
 * UnifiedHeader Component
 * Professional header with brand identity and navigation
 */

import React from "react";
import { useAppStore } from "@/stores";
import { navigateTo } from "@/lib/router";
import { ConnectionStatusSimple } from "@/components/auth/connection-status-simple";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Boxes, Code } from "lucide-react";
import Graphite from "@/components/ui/vectors/logos/graphite";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/main/mobile-menu";
import { useMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

/**
 * Navigation item configuration
 */
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "editor", label: "Editor", icon: Code, route: "editor" },
  { id: "canvas", label: "Canvas", icon: Boxes, route: "canvas" },
];

/**
 * Logo component with brand identity
 */
function Logo({ onClick }: { onClick: () => void }): React.ReactElement {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 -ml-3 rounded",
        "transition-colors duration-200",
        "hover:bg-muted/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
      aria-label="Go to home page"
    >
      <div className="relative flex items-center justify-center w-8 h-8">
        <Graphite size={2} />
      </div>

      {/* Brand name */}
      <div className="hidden sm:flex flex-col">
        <span className="text-base font-bold tracking-tight text-foreground leading-none">
          STELS
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/70 tracking-wider uppercase">
          Web 5
        </span>
      </div>
    </motion.button>
  );
}

/**
 * Navigation item button
 */
function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}): React.ReactElement {
  const Icon = item.icon;

  return (
    <motion.div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-2 px-3 h-9 rounded",
          "transition-colors duration-200",
          isActive
            ? "text-foreground bg-muted/80"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline text-sm font-medium">
          {item.label}
        </span>
      </Button>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.div>
  );
}

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
      className={cn(
        "flex-shrink-0",
        "border-b border-border/50",
        "bg-background/80 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-1">
          <Logo onClick={() => navigateTo("welcome")} />

          {/* Navigation - Hidden on mobile, shown in mobile menu */}
          {!isMobile && (
            <nav
              role="navigation"
              aria-label="Main navigation"
              className="flex items-center gap-1 ml-4 pl-4 border-l border-border/50"
            >
              {NAV_ITEMS.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={currentRoute === item.route}
                  onClick={() => navigateTo(item.route)}
                />
              ))}
            </nav>
          )}
        </div>

        {/* Right: Theme Toggle & Connection Status */}
        <div
          role="toolbar"
          aria-label="Header actions"
          className="flex items-center gap-1.5"
        >
          <ThemeToggle />
          <ConnectionStatusSimple />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
