/**
 * Error state component
 * Displays error messages with retry and dismiss options
 */

import type React from "react";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ErrorStateProps } from "../types";

/**
 * Enhanced error display component
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onDismiss,
}): React.ReactElement => (
  <Alert variant="destructive" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="font-medium flex items-center justify-between">
      <span className="flex-1">{error}</span>
      <div className="flex gap-2 ml-4">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 px-2 text-xs"
          >
            <XCircle className="w-3 h-3" />
          </Button>
        )}
      </div>
    </AlertDescription>
  </Alert>
);
