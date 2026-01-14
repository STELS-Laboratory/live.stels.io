/**
 * Ready View Component
 * Main application shell when user is authenticated and app is ready
 */

import React, { lazy, Suspense, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ReactFlowProvider } from "reactflow";
import { useAppStore } from "@/stores";
import SessionProvider from "@/components/main/provider";
import { RouteLoader } from "@/components/main/route-loader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WelcomeDashboard } from "@/components/main/welcome-dashboard";
import { SecurityWarningDialog } from "@/components/auth/security-warning-dialog";
import { SecurityWarningExtensions } from "@/components/auth/security-warning-extensions";
import { SessionExpiredModal } from "@/components/auth/session-expired-modal";
import UpdatePrompt from "@/components/main/update-prompt";
import VersionCheckPrompt from "@/components/main/version-check-prompt";
import ToastProvider from "@/components/main/toast-provider";
import SplashScreen from "@/components/main/splash-screen";
import { TIMING } from "@/lib/constants";

const Flow = lazy(() => import("@/apps/canvas/flow"));
const AMIEditor = lazy(() =>
  import("@/apps/editor/ami-editor").then((m) => ({ default: m.AMIEditor }))
);
const SimpleLayout = lazy(() =>
  import("@/apps/layout").then((m) => ({ default: m.Layout }))
);

const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -10,
  },
};

interface ReadyViewProps {
  showSplash: boolean;
  onSplashComplete: () => void;
}

/**
 * Ready view - main application content when authenticated
 */
export function ReadyView({
  showSplash,
  onSplashComplete,
}: ReadyViewProps): React.ReactElement {
  const { currentRoute, setRouteLoading } = useAppStore();

  const isHeavyRoute = useMemo(() => currentRoute === "canvas", [currentRoute]);

  useEffect(() => {
    if (isHeavyRoute) {
      setRouteLoading(true);
      const timeout = setTimeout(() => setRouteLoading(false), 500);
      return () => clearTimeout(timeout);
    } else {
      setRouteLoading(false);
    }
  }, [isHeavyRoute, setRouteLoading]);

  const routeComponents = useMemo(() => {
    const components: Record<string, React.ReactElement> = {
      welcome: <WelcomeDashboard />,
      editor: (
        <Suspense
          fallback={
            <div className="p-4 text-muted-foreground">Loading editor...</div>
          }
        >
          <AMIEditor />
        </Suspense>
      ),
      canvas: (
        <Suspense
          fallback={
            <div className="p-4 text-muted-foreground">Loading canvas...</div>
          }
        >
          <ReactFlowProvider>
            <Flow />
          </ReactFlowProvider>
        </Suspense>
      ),
    };

    return components;
  }, []);

  const renderMainContent = useCallback((): React.ReactElement => {
    return routeComponents[currentRoute] || routeComponents.canvas;
  }, [currentRoute, routeComponents]);

  const commonLayout = useMemo(() => {
    const content = (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentRoute}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: TIMING.ROUTE_TRANSITION_MS / 1000,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="h-full w-full"
        >
          {renderMainContent()}
        </motion.div>
      </AnimatePresence>
    );

    // All routes now use the sidebar layout
    return (
      <Suspense
        fallback={
          <div className="p-4 text-muted-foreground">Loading layout...</div>
        }
      >
        <SimpleLayout>{content}</SimpleLayout>
      </Suspense>
    );
  }, [currentRoute, renderMainContent]);

  return (
    <SessionProvider>
      <TooltipProvider>
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:shadow-lg"
        >
          Skip to main content
        </a>
        {showSplash ? (
          <SplashScreen
            onComplete={onSplashComplete}
            duration={TIMING.SPLASH_DURATION_MS}
          />
        ) : (
          <RouteLoader>
            <Suspense
              fallback={
                <div className="p-4 text-muted-foreground">
                  Loading layout...
                </div>
              }
            >
              {commonLayout}
            </Suspense>
          </RouteLoader>
        )}
        <SecurityWarningDialog />
        <SecurityWarningExtensions />
        <SessionExpiredModal />
        <UpdatePrompt />
        <VersionCheckPrompt />
        <ToastProvider />
      </TooltipProvider>
    </SessionProvider>
  );
}
