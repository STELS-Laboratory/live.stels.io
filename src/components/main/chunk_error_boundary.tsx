/**
 * Chunk Error Boundary
 * Handles chunk loading failures (404 errors) that occur when new version is deployed
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface ChunkErrorBoundaryProps {
  children: ReactNode;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

/**
 * Error boundary that specifically handles chunk loading failures
 * Shows a user-friendly message and reload button when chunks fail to load
 */
export default class ChunkErrorBoundary extends Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
    // Check if this is a chunk loading error
    const isChunkError =
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Failed to load resource") ||
      error.message.includes("chunk") ||
      error.message.includes("Loading chunk");

    return {
      hasError: true,
      error,
      isChunkError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ChunkErrorBoundary] Caught error:", {
      error,
      errorInfo,
      isChunkError: this.state.isChunkError,
    });

    // If it's a chunk error, we'll handle it with a reload prompt
    // Otherwise, log it for debugging
    if (!this.state.isChunkError) {
      console.error("[ChunkErrorBoundary] Non-chunk error:", error.message);
    }
  }

  /**
   * Force reload the application
   * Clears service worker cache and reloads
   */
  handleReload = async (): Promise<void> => {
    try {
      // Clear service worker caches if available
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.log("[ChunkErrorBoundary] Service worker caches cleared");
      }

      // Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log("[ChunkErrorBoundary] Service workers unregistered");
      }
    } catch (error) {
      console.error("[ChunkErrorBoundary] Error clearing caches:", error);
    }

    // Force reload (bypass cache)
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.isChunkError) {
      return (
        <div className="fixed inset-0 bg-background flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      New Version Available
                    </h2>
                    <p className="text-sm text-muted-foreground font-normal">
                      Application update detected
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-foreground">
                    A new version of the application has been deployed. Please
                    reload to get the latest updates.
                  </p>
                  <div className="p-3 bg-background/50 rounded border border-border">
                    <p className="text-xs text-muted-foreground">
                      The application will automatically clear cached files and
                      reload with the latest version.
                    </p>
                  </div>
                </div>

                {/* Error details for debugging */}
                {this.state.error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-2 bg-background/50 rounded border border-border">
                      <code className="text-[10px] text-red-600 dark:text-red-400 break-all">
                        {this.state.error.message}
                      </code>
                    </div>
                  </details>
                )}

                <Button
                  onClick={this.handleReload}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Application
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    if (this.state.hasError) {
      // Non-chunk error - show generic error
      return (
        <div className="fixed inset-0 bg-background flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Something Went Wrong
                  </h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    An unexpected error occurred
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                The application encountered an error. Please try reloading the
                page.
              </p>

              {this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Error Details
                  </summary>
                  <div className="mt-2 p-2 bg-background/50 rounded border border-border">
                    <code className="text-[10px] text-red-600 dark:text-red-400 break-all">
                      {this.state.error.message}
                    </code>
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload
                </Button>
                <Button
                  onClick={() =>
                    this.setState({
                      hasError: false,
                      error: null,
                      isChunkError: false,
                    })}
                  className="flex-1"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
