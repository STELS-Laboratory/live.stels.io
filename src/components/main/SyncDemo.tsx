import React from "react";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSyncActions } from "@/hooks/useDataSync";
import { useAppStore } from "@/stores";

/**
 * Demo component showing sync functionality for testing and demonstration
 * This component can be added to any route to test sync behavior
 */
export const SyncDemo: React.FC = (): React.ReactElement => {
  const { version, lastSyncTimestamp, localDataVersion, remoteDataVersion } =
    useAppStore();
  const { syncData, checkForUpdates, hasUpdates, isSyncing, syncError } =
    useSyncActions();

  const handleManualSync = async (): Promise<void> => {
    await syncData();
  };

  const handleCheckUpdates = async (): Promise<void> => {
    await checkForUpdates();
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-zinc-400">App Version:</span>
          <div className="font-mono">{version}</div>
        </div>
        <div>
          <span className="text-zinc-400">Status:</span>
          <div className="flex items-center gap-2">
            {hasUpdates
              ? (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                >
                  Updates Available
                </Badge>
              )
              : <Badge variant="outline">Up to Date</Badge>}
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-zinc-400">Local Version:</span>
          <div className="font-mono text-xs break-all bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
            {localDataVersion || "Not set"}
          </div>
        </div>
        <div>
          <span className="text-zinc-400">Remote Version:</span>
          <div className="font-mono text-xs break-all bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
            {remoteDataVersion || "Not set"}
          </div>
        </div>
      </div>

      {/* Sync Timestamp */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Clock className="h-4 w-4" />
        <span>Last sync: {formatTimestamp(lastSyncTimestamp)}</span>
      </div>

      {/* Error Display */}
      {syncError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`flex-1 ${
            hasUpdates ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
          }`}
        >
          {isSyncing
            ? <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            : <RefreshCw className="h-4 w-4 mr-2" />}
          {hasUpdates ? "Sync Updates" : "Sync Now"}
        </Button>
        <Button
          variant="outline"
          onClick={handleCheckUpdates}
          disabled={isSyncing}
        >
          Check Updates
        </Button>
      </div>
    </div>
  );
};
