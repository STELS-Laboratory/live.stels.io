/**
 * Chains App Component
 * Main entry point for chains (cross-domain task chains) functionality
 */

import { useEffect, useCallback, useState } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useChainsStore } from "./store";
import type { Chain, CreateChainParams, ChainStatus } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RefreshCw,
  Plus,
  Play,
  Pause,
  Trash2,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ChainsApp() {
  const connectionSession = useAuthStore((s) => s.connectionSession);

  const {
    chains,
    chainsLoading,
    chainsError,
    executionLoading,
    listChains,
    createChain,
    executeChain,
    pauseChain,
    resumeChain,
    deleteChain,
  } = useChainsStore();

  const [statusFilter, setStatusFilter] = useState<ChainStatus | "all">("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newChainName, setNewChainName] = useState("");
  const [newChainDescription, setNewChainDescription] = useState("");

  // Load chains on mount
  useEffect(() => {
    if (!connectionSession) return;
    listChains();
  }, [connectionSession, listChains]);

  // Refresh chains
  const handleRefresh = useCallback(() => {
    const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
    listChains(params);
  }, [listChains, statusFilter]);

  // Create chain
  const handleCreate = useCallback(async () => {
    if (!newChainName.trim()) return;

    const params: CreateChainParams = {
      name: newChainName.trim(),
      description: newChainDescription.trim() || undefined,
      ownerId: connectionSession?.session || "",
      steps: [],
    };

    const chain = await createChain(params);
    if (chain) {
      setCreateDialogOpen(false);
      setNewChainName("");
      setNewChainDescription("");
    }
  }, [newChainName, newChainDescription, connectionSession, createChain]);

  // Execute chain
  const handleExecute = useCallback(
    async (chainId: string) => {
      await executeChain({ chainId });
    },
    [executeChain]
  );

  // Pause chain
  const handlePause = useCallback(
    async (chainId: string) => {
      await pauseChain({ chainId });
    },
    [pauseChain]
  );

  // Resume chain
  const handleResume = useCallback(
    async (chainId: string) => {
      await resumeChain({ chainId });
    },
    [resumeChain]
  );

  // Delete chain
  const handleDelete = useCallback(async () => {
    if (!deleteConfirmId) return;
    await deleteChain({ chainId: deleteConfirmId });
    setDeleteConfirmId(null);
  }, [deleteConfirmId, deleteChain]);

  // Filter chains by status
  const filteredChains = statusFilter === "all"
    ? chains
    : chains.filter((c) => c.status === statusFilter);

  if (!connectionSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please connect to use chains features</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Task Chains
          </h2>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ChainStatus | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={chainsLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", chainsLoading && "animate-spin")} />
            Refresh
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Chain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chain</DialogTitle>
                <DialogDescription>
                  Create a new task chain to orchestrate multiple tasks
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newChainName}
                    onChange={(e) => setNewChainName(e.target.value)}
                    placeholder="Chain name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newChainDescription}
                    onChange={(e) => setNewChainDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newChainName.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error */}
      {chainsError && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{chainsError}</p>
        </div>
      )}

      {/* Chains List */}
      {chainsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filteredChains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No chains found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first chain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChains.map((chain) => (
            <ChainCard
              key={chain.id}
              chain={chain}
              onExecute={handleExecute}
              onPause={handlePause}
              onResume={handleResume}
              onDelete={(id) => setDeleteConfirmId(id)}
              executing={executionLoading}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chain? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ChainCardProps {
  chain: Chain;
  onExecute: (chainId: string) => void;
  onPause: (chainId: string) => void;
  onResume: (chainId: string) => void;
  onDelete: (chainId: string) => void;
  executing: boolean;
}

function ChainCard({ chain, onExecute, onPause, onResume, onDelete, executing }: ChainCardProps) {
  const StatusIcon = getStatusIcon(chain.status);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{chain.name}</CardTitle>
            {chain.description && (
              <CardDescription className="line-clamp-2">{chain.description}</CardDescription>
            )}
          </div>
          <Badge variant={getStatusVariant(chain.status)} className="ml-2">
            <StatusIcon className="h-3 w-3 mr-1" />
            {chain.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{chain.steps.length} steps</span>
            {chain.executionCount !== undefined && (
              <span>{chain.executionCount} executions</span>
            )}
          </div>

          {chain.lastExecutedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last run: {new Date(chain.lastExecutedAt).toLocaleString()}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {chain.status === "running" ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onPause(chain.id)}
                disabled={executing}
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            ) : chain.status === "paused" ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onResume(chain.id)}
                disabled={executing}
              >
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onExecute(chain.id)}
                disabled={executing || chain.status === "running"}
              >
                <Play className="h-3 w-3 mr-1" />
                Execute
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(chain.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusIcon(status: ChainStatus) {
  switch (status) {
    case "completed":
      return CheckCircle;
    case "failed":
    case "cancelled":
      return XCircle;
    case "running":
      return RefreshCw;
    case "paused":
      return Pause;
    default:
      return AlertCircle;
  }
}

function getStatusVariant(status: ChainStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "running":
      return "secondary";
    case "failed":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export default ChainsApp;
