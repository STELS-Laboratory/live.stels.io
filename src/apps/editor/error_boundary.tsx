/**
 * Error Boundary for Editor
 * Catches React errors and provides graceful fallback
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Code, RefreshCw } from "lucide-react";
import { logError } from "./utils/logger.ts";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Editor
 * Catches React errors and provides graceful fallback
 */
export default class EditorErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError("Editor Error Boundary caught an error:", error, errorInfo);

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-2xl border-red-500/50 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <CardTitle className="text-red-600 dark:text-red-400">
                  Editor Error
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  An error occurred in the Protocol Editor. This might be due
                  to:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                  <li>Invalid worker script syntax</li>
                  <li>Network connection issues</li>
                  <li>Unexpected data format</li>
                </ul>
              </div>

              {this.state.error && (
                <div className="p-3 bg-background rounded border border-border">
                  <div className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                    {this.state.error.message || "Unknown error"}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Code className="w-4 h-4" />
                  Reload Page
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
