/**
 * Error Boundary Component
 * Catches and displays errors in Token Builder
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

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
 * Error Boundary for Token Builder
 * Catches React errors and provides graceful fallback
 */
export default class ErrorBoundary extends Component<
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
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);

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
                <CardTitle className="text-red-600 dark:text-red-500">
                  Something went wrong
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  An error occurred while building your token. This is
                  unexpected and we apologize for the inconvenience.
                </p>

                {/* Error details (for development) */}
                {this.state.error && (
                  <details className="mt-3 p-3 bg-background rounded border border-border">
                    <summary className="text-xs font-semibold text-foreground cursor-pointer mb-2">
                      Technical Details
                    </summary>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-semibold text-red-600 dark:text-red-500 mb-1">
                          Error Message:
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {this.state.error.toString()}
                        </div>
                      </div>

                      {this.state.errorInfo && (
                        <div>
                          <div className="text-xs font-semibold text-red-600 dark:text-red-500 mb-1">
                            Component Stack:
                          </div>
                          <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  Reload Page
                </Button>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 <strong>Tip:</strong> If this error persists, try:
                </p>
                <ul className="mt-2 text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Clearing your browser cache</li>
                  <li>Checking your internet connection</li>
                  <li>Refreshing the page</li>
                  <li>Starting with a template</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
