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
      {/* Logo icon */}
      <div className="relative flex items-center justify-center w-6 h-6">
        <svg
          width="22"
          height="22"
          viewBox="0 0 77 77"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M65.3526 21.3089C65.5598 20.5571 64.6851 19.9593 64.009 20.3906L39.706 35.8937C39.4604 36.0504 39.3129 36.3142 39.3129 36.5966V73.1666C39.3129 73.8678 40.1543 74.2638 40.7348 73.8357L44.862 70.7926C45.0399 70.6614 45.1589 70.4703 45.1947 70.2581L49.3343 45.728C49.3743 45.4909 49.518 45.2812 49.7293 45.1516L60.334 38.6442C60.5202 38.53 60.6547 38.3531 60.7111 38.1485L65.3526 21.3089ZM59.4067 42.826C59.602 42.0881 58.7577 41.4989 58.083 41.9022L50.9866 46.1436C50.7712 46.2723 50.6242 46.4836 50.5831 46.7234L48.9582 56.2061C48.8353 56.9233 49.6535 57.4444 50.2976 57.0591L56.3434 53.4424C56.5364 53.327 56.6754 53.1447 56.7312 52.9335L59.4067 42.826ZM11.6473 21.309C11.4401 20.5572 12.3148 19.9594 12.9909 20.3907L37.2939 35.8938C37.5395 36.0505 37.687 36.3142 37.687 36.5966V73.1666C37.687 73.8678 36.8457 74.2638 36.2651 73.8357L32.138 70.7926C31.96 70.6614 31.8411 70.4703 31.8053 70.2581L27.6656 45.728C27.6256 45.4909 27.482 45.2813 27.2706 45.1516L16.6659 38.6442C16.4797 38.53 16.3452 38.3531 16.2888 38.1486L11.6473 21.309ZM17.5932 42.826C17.3978 42.0881 18.2421 41.4989 18.9169 41.9022L26.0132 46.1436C26.2286 46.2723 26.3756 46.4836 26.4167 46.7234L28.0417 56.2061C28.1647 56.9233 27.3464 57.4444 26.7024 57.0591L20.6566 53.4424C20.4636 53.327 20.3246 53.1447 20.2687 52.9336L17.5932 42.826Z"
            className="fill-primary"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M76.9556 1.52265C77.2524 0.445997 75.9998 -0.410097 75.0315 0.207581L40.2272 22.4095C39.8755 22.6339 39.6642 23.0116 39.6642 23.4161V75.788C39.6642 76.7922 40.8691 77.3592 41.7005 76.7462L47.6111 72.3881C47.8659 72.2003 48.0363 71.9266 48.0876 71.6227L54.0159 36.4932C54.0732 36.1536 54.2789 35.8534 54.5815 35.6677L69.7686 26.3485C70.0351 26.1849 70.2279 25.9316 70.3086 25.6386L76.9556 1.52265ZM68.4405 32.3372C68.7202 31.2805 67.5111 30.4366 66.5448 31.0142L56.3822 37.0883C56.0737 37.2727 55.8632 37.5752 55.8043 37.9187L53.4772 51.4989C53.3012 52.526 54.473 53.2722 55.3954 52.7204L64.0536 47.541C64.33 47.3757 64.529 47.1146 64.609 46.8122L68.4405 32.3372ZM0.0443952 1.52271C-0.252359 0.446054 1.00021 -0.410041 1.96849 0.207636L36.7728 22.4096C37.1246 22.634 37.3358 23.0117 37.3358 23.4162V75.788C37.3358 76.7922 36.1309 77.3592 35.2995 76.7462L29.389 72.3881C29.1342 72.2003 28.9638 71.9266 28.9126 71.6227L22.9842 36.4932C22.9269 36.1536 22.7212 35.8534 22.4185 35.6677L7.23142 26.3485C6.96486 26.185 6.77215 25.9316 6.6914 25.6387L0.0443952 1.52271ZM8.55943 32.3373C8.27969 31.2805 9.48878 30.4366 10.4551 31.0142L20.6178 37.0883C20.9262 37.2727 21.1368 37.5752 21.1956 37.9186L23.5228 51.4989C23.6988 52.526 22.5271 53.2722 21.6047 52.7204L12.9465 47.541C12.6701 47.3757 12.4711 47.1146 12.3911 46.8122L8.55943 32.3373Z"
            className="fill-foreground"
          />
        </svg>
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
