/**
 * Migrate Worker Dialog Component
 * Allows migrating a local worker to network scope with a new SID
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Globe,
  Server,
} from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import type { Worker } from "../store.ts";

interface MigrateWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
  onMigrate: (worker: Worker) => Promise<Worker | null>;
}

/**
 * Migrate Worker Dialog Component
 */
export function MigrateWorkerDialog({
  open,
  onOpenChange,
  worker,
  onMigrate,
}: MigrateWorkerDialogProps): React.ReactElement {
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Worker | null>(null);

  const handleMigrate = async (): Promise<void> => {
    if (!worker) return;

    setIsMigrating(true);
    setError(null);

    try {
      const migratedWorker = await onMigrate(worker);
      setResult(migratedWorker);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to migrate worker",
      );
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClose = (): void => {
    setError(null);
    setResult(null);
    onOpenChange(false);
  };

  const currentScope = worker?.value.raw.scope || "local";
  const showConfirmation = !result && !error;
  const showResult = result !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={`relative p-2 border ${
                error
                  ? "border-red-500/30 bg-red-500/10"
                  : showResult
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-blue-500/30 bg-blue-500/10"
              }`}
            >
              <div
                className={`absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l ${
                  error
                    ? "border-red-500/50"
                    : showResult
                    ? "border-green-500/50"
                    : "border-blue-500/50"
                }`}
              />
              {error
                ? <AlertCircle className="h-5 w-5 text-red-500" />
                : showResult
                ? <CheckCircle className="h-5 w-5 text-green-500" />
                : <Globe className="h-5 w-5 text-blue-500" />}
            </div>
            <span className="text-foreground">
              {showResult
                ? "Migration Complete"
                : error
                ? "Migration Failed"
                : "Migrate to Network"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {showConfirmation &&
              "Move this worker from local to network scope with a new ID"}
            {showResult && "Worker successfully migrated to network scope"}
            {error && "An error occurred during migration"}
          </DialogDescription>
        </DialogHeader>

        {/* Confirmation State */}
        {showConfirmation && worker && (
          <div className="space-y-4 py-4">
            {/* Current Worker Info */}
            <div className="relative p-3 bg-muted/50 border border-border rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">
                Current Worker
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">ID:</span>
                  <span className="text-xs text-foreground font-mono">
                    {worker.value.raw.sid}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Scope:</span>
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-400/50 bg-blue-400/10 text-blue-400"
                  >
                    <Server className="w-3 h-3 mr-1" />
                    {currentScope}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      worker.value.raw.active
                        ? "border-green-400/50 bg-green-400/10 text-green-400"
                        : "border-red-400/50 bg-red-400/10 text-red-400"
                    }`}
                  >
                    {worker.value.raw.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-amber-400" />
            </div>

            {/* New Worker Info */}
            <div className="relative p-3 bg-green-500/5 border border-green-500/30 rounded-lg">
              <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-green-500/50" />
              <div className="text-xs text-green-400 mb-2 font-bold">
                New Worker (Network)
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">ID:</span>
                  <span className="text-xs text-green-400 font-mono">
                    New UUID (generated)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Scope:</span>
                  <Badge
                    variant="outline"
                    className="text-xs border-green-400/50 bg-green-400/10 text-green-400"
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    network
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className="text-xs border-red-400/50 bg-red-400/10 text-red-400"
                  >
                    Inactive (requires activation)
                  </Badge>
                </div>
              </div>
            </div>

            {/* Warning */}
            <Alert className="border-orange-500/30 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-400 text-xs">
                <strong>Important:</strong>{" "}
                The worker will be created with a new ID and inactive status.
                The original local worker will remain unchanged. You can delete
                it manually after verifying the migration.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Result State */}
        {showResult && result && (
          <div className="space-y-4 py-4">
            <Alert className="border-green-500/30 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-400">
                Worker successfully migrated to network scope!
              </AlertDescription>
            </Alert>

            <div className="relative p-3 bg-muted/50 border border-border rounded-lg">
              <div className="text-xs text-muted-foreground mb-2">
                New Worker Details
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">New ID:</span>
                  <span className="text-xs text-green-400 font-mono">
                    {result.value.raw.sid}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Scope:</span>
                  <Badge
                    variant="outline"
                    className="text-xs border-green-400/50 bg-green-400/10 text-green-400"
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    network
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-4">
            <Alert className="border-red-500/30 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {showConfirmation
            ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isMigrating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold"
                >
                  {isMigrating
                    ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Migrating...
                      </>
                    )
                    : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Migrate to Network
                      </>
                    )}
                </Button>
              </>
            )
            : (
              <Button
                onClick={handleClose}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
