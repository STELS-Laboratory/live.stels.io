/**
 * Agent Control module exports
 */

/* eslint-disable react-refresh/only-export-components */
import { Component, type ReactNode } from "react";
import { AgentControl } from "./agent-control";

/**
 * Error Boundary for Agent Control
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AgentControlErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Agent Control Error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-background p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap AgentControl with Error Boundary
const AgentControlWithErrorBoundary = () => (
  <AgentControlErrorBoundary>
    <AgentControl />
  </AgentControlErrorBoundary>
);

export { AgentControl, AgentControlWithErrorBoundary as default };
export * from "./types";
export { useAgentStore } from "./store";
export {
  AgentListPanel,
  AgentChatPanel,
  CreateAgentDialog,
  DeleteAgentDialog,
} from "./components";
