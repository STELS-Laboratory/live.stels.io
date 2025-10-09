import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";

/**
 * Props for ErrorState component
 */
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Enhanced error state component with retry and dismiss actions
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onDismiss,
}) => (
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
