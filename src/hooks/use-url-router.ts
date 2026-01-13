import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores";
import { useAuthStore } from "@/stores/modules/auth.store";
import { ROUTES, getDefaultRoute } from "@/lib/constants";

/**
 * Hook for synchronizing application routing with URL query parameters
 * Reads the 'router' query parameter and syncs it with the app store
 * Handles direct link navigation and ensures proper store synchronization
 */
export const useUrlRouter = (): void => {
  const { currentRoute, setRoute, allowedRoutes } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    // Function to get router parameter from URL
    const getRouterFromUrl = (): string | null => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("router");
    };

    // Function to update URL with router parameter
    const updateUrl = (route: string): void => {
      const url = new URL(window.location.href);
      url.searchParams.set("router", route);
      window.history.replaceState({}, "", url.toString());
    };

    // Wait for store to be fully initialized
    if (!allowedRoutes || allowedRoutes.length === 0) {
      return;
    }

    // Initialize route from URL on mount (only once)
    if (!isInitialized.current) {
      const urlRouter = getRouterFromUrl();

      if (urlRouter && allowedRoutes.includes(urlRouter)) {
        // Valid route in URL - sync store with URL
        setRoute(urlRouter);
      } else if (urlRouter && !allowedRoutes.includes(urlRouter)) {
        // Invalid route in URL - redirect to default based on auth
        const defaultRoute = getDefaultRoute(isAuthenticated);
        updateUrl(defaultRoute);
        setRoute(defaultRoute);
      } else if (!urlRouter) {
        // No router parameter - use current route or default based on auth
        if (currentRoute) {
          updateUrl(currentRoute);
        } else {
          const defaultRoute = getDefaultRoute(isAuthenticated);
          updateUrl(defaultRoute);
          setRoute(defaultRoute);
        }
      }

      isInitialized.current = true;
    }

    // Listen for popstate events (browser back/forward)
    const handlePopState = (): void => {
      const urlRouter = getRouterFromUrl();

      if (urlRouter && allowedRoutes.includes(urlRouter)) {
        setRoute(urlRouter);
      } else if (urlRouter && !allowedRoutes.includes(urlRouter)) {
        const defaultRoute = getDefaultRoute(isAuthenticated);
        updateUrl(defaultRoute);
        setRoute(defaultRoute);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [allowedRoutes, setRoute, currentRoute, isAuthenticated]);

  // Update URL when route changes in store (but not during initialization)
  useEffect(() => {
    if (isInitialized.current) {
      const updateUrl = (route: string): void => {
        const url = new URL(window.location.href);
        url.searchParams.set("router", route);
        window.history.replaceState({}, "", url.toString());
      };

      updateUrl(currentRoute);
    }
  }, [currentRoute]);
};
