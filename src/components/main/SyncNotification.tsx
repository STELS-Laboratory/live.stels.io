import React from "react";
import { AlertCircle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore } from "@/stores";

/**
 * SyncNotification component displays data synchronization status and controls
 * Shows notifications when new updates are available and allows manual sync
 */
export const SyncNotification: React.FC = (): React.ReactElement | null => {
  const {
    hasUpdates,
    isSyncing,
    syncError,
    lastSyncTimestamp,
    syncData,
    dismissUpdates,
    setSyncError,
  } = useAppStore();

  // Don't render if no updates or sync activity
  if (!hasUpdates && !isSyncing && !syncError) {
    return null;
  }

  const handleSync = async (): Promise<void> => {
    try {
      await syncData();
    } catch (error) {
      console.error("Failed to sync data:", error);
    }
  };

  const handleDismiss = (): void => {
    dismissUpdates();
    setSyncError(null);
  };

  const handleDismissError = (): void => {
    setSyncError(null);
  };

  const formatLastSync = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Error notification
  if (syncError) {
    return (
      <div className="fixed top-4 right-4 z-50 w-80">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">Sync error: {syncError}</span>
            <div className="flex gap-2 ml-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-6 px-2 text-xs"
              >
                {isSyncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : (
                  "Retry"
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismissError}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Syncing in progress
  if (isSyncing) {
    return (
      <div className="fixed top-4 right-4 z-50 w-80">
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <span className="text-sm">Synchronizing data...</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Updates available notification
  if (hasUpdates) {
    return (
      <div className="fixed top-4 right-4 z-50 w-80">
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium">New data available</div>
              <div className="text-xs opacity-75 mt-1">
                Last sync: {formatLastSync(lastSyncTimestamp)}
              </div>
            </div>
            <div className="flex gap-2 ml-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-6 px-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
};
