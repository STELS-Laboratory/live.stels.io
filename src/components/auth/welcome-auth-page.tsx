/**
 * Welcome Auth Page
 * Professional dashboard for authenticated users, login for guests
 */

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Lock, Code, Boxes } from "lucide-react";
import { ProfessionalConnectionFlow } from "./professional-connection-flow";
import { useAuthStore } from "@/stores/modules/auth.store";
import { navigateTo } from "@/lib/router";
import { UnifiedHeader } from "@/components/main/unified-header";
import { AppCard } from "@/components/main/app-card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * App configuration for dashboard cards
 */
const APPS = [
  {
    id: "editor",
    title: "Code Editor",
    description:
      "Professional AMI editor with syntax highlighting and code validation",
    icon: Code,
    accentColor: "#3b82f6",
    gradientFrom: "#3b82f6",
    gradientTo: "#1d4ed8",
    route: "editor",
    shortcut: "⌘E",
  },
  {
    id: "canvas",
    title: "Visual Canvas",
    description:
      "Node-based workflow designer for building AI agent pipelines",
    icon: Boxes,
    accentColor: "#8b5cf6",
    gradientFrom: "#8b5cf6",
    gradientTo: "#6d28d9",
    route: "canvas",
    shortcut: "⌘K",
  },
] as const;

/**
 * Container animation variants
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * Authenticated Dashboard Component
 */
function AuthenticatedDashboard(): React.ReactElement {
  const handleAppClick = useCallback((route: string) => {
    navigateTo(route);
  }, []);

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      <UnifiedHeader />

      {/* Dashboard Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="mb-10">
            <div className="flex flex-col gap-2">
              <motion.p
                className="text-sm font-medium text-primary"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome back
              </motion.p>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Command Center
              </h1>
              <p className="text-muted-foreground max-w-lg">
                Build, deploy and manage your AI agents and workflows with STELS
                Web 5 platform.
              </p>
            </div>
          </motion.div>

          {/* Apps Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Applications
              </h2>
              <span className="text-xs text-muted-foreground">
                {APPS.length} available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {APPS.map((app, index) => (
                <motion.div key={app.id} variants={itemVariants} custom={index}>
                  <AppCard
                    id={app.id}
                    title={app.title}
                    description={app.description}
                    icon={app.icon}
                    accentColor={app.accentColor}
                    gradientFrom={app.gradientFrom}
                    gradientTo={app.gradientTo}
                    onClick={() => handleAppClick(app.route)}
                    shortcut={app.shortcut}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="mt-10">
            <div className="rounded border border-border/50 bg-card/30 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Ready to build?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start with the Canvas to design your first AI workflow, or
                    use the Editor for advanced configuration.
                  </p>
                </div>
                <Button
                  onClick={() => handleAppClick("canvas")}
                  className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Boxes className="w-4 h-4 mr-2" />
                  Open Canvas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Footer spacing */}
          <div className="h-8" />
        </motion.div>
      </main>
    </div>
  );
}

/**
 * Guest Login Page Component
 */
function GuestLoginPage({
  onOpenAuth,
}: {
  onOpenAuth: () => void;
}): React.ReactElement {
  return (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center space-y-8 p-8 max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="relative">
            <svg
              width="80"
              height="80"
              viewBox="0 0 77 77"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-20"
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
            {/* Glow effect */}
            <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full scale-150 -z-10" />
          </div>
        </motion.div>

        {/* Title */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-foreground tracking-tight"
          >
            STELS Web 5
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-muted-foreground"
          >
            Next-generation AI agent platform
          </motion.p>
        </div>

        {/* Login Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={onOpenAuth}
            size="lg"
            className={cn(
              "px-8 py-6 text-base font-medium rounded",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
              "transition-all duration-300"
            )}
            aria-label="Private Access"
          >
            <Lock className="h-4 w-4 mr-2" />
            Private Access
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground/60"
        >
          Secure authentication via GitHub OAuth
        </motion.p>
      </motion.div>
    </div>
  );
}

/**
 * Welcome Page
 * Shows authentication for non-authenticated users
 * Shows dashboard for authenticated users
 */
export function WelcomeAuthPage(): React.ReactElement {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { isAuthenticated, selectedNetwork } = useAuthStore();

  // Global GitHub OAuth callback handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const router = urlParams.get("router");

    // If we have GitHub OAuth callback parameters, open dialog and process
    if (code && state) {
      // Verify state
      const storedState = sessionStorage.getItem("github_oauth_state");
      if (storedState && storedState === state) {
        // Store pending OAuth data for processing
        sessionStorage.setItem("github_oauth_pending_code", code);
        sessionStorage.setItem("github_oauth_pending_state", state);

        // Open auth dialog to process callback
        setIsAuthDialogOpen(true);

        // Clean URL parameters and pathname (keep router if present)
        const url = new URL(window.location.href);
        // Remove callback path from pathname
        if (url.pathname.includes("/auth/github/callback")) {
          url.pathname = "/";
        }
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        if (router) {
          url.searchParams.set("router", router);
        }
        window.history.replaceState({}, "", url.toString());
      } else {
        // Invalid state - clean URL and pathname
        const url = new URL(window.location.href);
        // Remove callback path from pathname
        if (url.pathname.includes("/auth/github/callback")) {
          url.pathname = "/";
        }
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        if (router) {
          url.searchParams.set("router", router);
        }
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [selectedNetwork]);

  // Clean URL after successful authentication (only redirect from callback)
  useEffect(() => {
    if (isAuthenticated) {
      // Check if we're on the callback path
      const isOnCallbackPath = window.location.pathname.includes(
        "/auth/github/callback"
      );

      if (
        isOnCallbackPath ||
        window.location.search.includes("code") ||
        window.location.search.includes("state")
      ) {
        // Clean URL parameters and pathname after OAuth callback
        const url = new URL(window.location.href);
        // Remove callback path from pathname
        if (url.pathname.includes("/auth/github/callback")) {
          url.pathname = "/";
        }
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        url.searchParams.set("router", "welcome");
        window.history.replaceState({}, "", url.toString());

        // Navigate to welcome to show dashboard
        navigateTo("welcome");
      }
      // Don't auto-redirect if user is already on welcome - let them see the dashboard
    }
  }, [isAuthenticated]);

  const handleOpenAuth = useCallback((): void => {
    setIsAuthDialogOpen(true);
  }, []);

  const handleAuthSuccess = useCallback((): void => {
    // Close dialog on successful authentication
    setIsAuthDialogOpen(false);
  }, []);

  // If authenticated, show dashboard
  if (isAuthenticated) {
    return <AuthenticatedDashboard />;
  }

  // If not authenticated, show login page
  return (
    <>
      <GuestLoginPage onOpenAuth={handleOpenAuth} />

      {/* Authentication Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0"
          showCloseButton={true}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Authentication</DialogTitle>
            <DialogDescription>
              Complete the authentication process to access STELS Web 5
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 sm:p-6 md:p-8">
            <ProfessionalConnectionFlow onSuccess={handleAuthSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
