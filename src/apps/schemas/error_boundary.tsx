/**
 * Error Boundary Component
 * Prevents crashes during live schema editing
 */

import React, { Component, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for safe live preview
 * Catches render errors without crashing the app
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(): void {
    // Error boundary - errors are handled by render method
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                Render Error
              </h3>
            </div>

            <div className="p-4 bg-red-500/10 rounded border border-red-500/20">
              <div className="text-sm text-red-700 dark:text-red-400 mb-2">
                The schema contains errors and cannot be rendered:
              </div>
              <div className="text-xs text-muted-foreground font-mono bg-background p-3 rounded overflow-auto max-h-40">
                {this.state.error?.message || "Unknown error"}
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 rounded border border-blue-500/20">
              <div className="text-xs text-blue-700 dark:text-blue-400">
                💡 <strong>Fix the error in the editor</strong>{" "}
                and the preview will update automatically
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
