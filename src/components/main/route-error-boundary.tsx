/**
 * Route Error Boundary
 * Catches errors in route components and displays fallback UI
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { navigateTo } from "@/lib/router";

interface RouteErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component for route-level error handling
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error in development
    if (import.meta.env.DEV) {
      console.error("[RouteErrorBoundary] Caught error:", error);
      console.error("[RouteErrorBoundary] Component stack:", errorInfo.componentStack);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    navigateTo("welcome");
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
          >
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold text-foreground mb-2"
          >
            Something went wrong
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-6 max-w-md"
          >
            An unexpected error occurred while loading this page. Please try again or
            return to the home page.
          </motion.p>

          {import.meta.env.DEV && this.state.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded text-left max-w-lg overflow-auto"
            >
              <p className="text-sm font-mono text-destructive">
                {this.state.error.message}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack.slice(0, 500)}
                </pre>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            <Button variant="outline" onClick={this.handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={this.handleGoHome}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </motion.div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper function to create error boundaries with custom handlers
 */
export function withRouteErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

  const WithErrorBoundary: React.FC<P> = (props) => (
    <RouteErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </RouteErrorBoundary>
  );

  WithErrorBoundary.displayName = `withRouteErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

export default RouteErrorBoundary;
