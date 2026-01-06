import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use_mobile";
import { useAppStore } from "@/stores";
import { navigateTo } from "@/lib/router";
import { Code, Boxes, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Mobile Menu Component
 * Hamburger menu for mobile navigation
 */
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentRoute } = useAppStore();
  const isMobile = useMobile();

  if (!isMobile) return null;

  const menuItems = [
    {
      id: "welcome",
      label: "Home",
      icon: Home,
      route: "welcome",
    },
    {
      id: "editor",
      label: "Editor",
      icon: Code,
      route: "editor",
    },
    {
      id: "canvas",
      label: "Canvas",
      icon: Boxes,
      route: "canvas",
    },
  ];

  const handleNavigation = (route: string) => {
    navigateTo(route);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        className="md:hidden"
      >
        {isOpen ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Menu */}
            <motion.nav
              id="mobile-menu"
              role="navigation"
              aria-label="Mobile navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-14 right-0 bottom-0 w-64 bg-card border-l border-border shadow-lg z-50 md:hidden overflow-y-auto"
            >
              <div className="flex flex-col p-4 gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.route;

                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      onClick={() => handleNavigation(item.route)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-primary text-primary-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

