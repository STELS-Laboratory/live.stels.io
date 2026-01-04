/**
 * Create Worker Dialog Component
 * Professional form for creating new worker scripts
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Boxes,
  CheckCircle,
  Cpu,
  Layers,
  Rocket,
  Sparkles,
  Server,
  Zap,
} from "lucide-react";
import type { WorkerCreateRequest } from "../store.ts";

interface CreateWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: WorkerCreateRequest) => Promise<void>;
}

/**
 * Create Worker Dialog Component
 */
export function CreateWorkerDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateWorkerDialogProps): React.ReactElement {
  const [formData, setFormData] = useState<WorkerCreateRequest>({
    scriptContent: "",
    dependencies: ["gliesereum"],
    version: "1.19.2",
    scope: "local",
    executionMode: "leader",
    priority: "normal",
    mode: "loop",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    setError(null);

    // Validation
    if (!formData.scriptContent.trim()) {
      setError("Script content is required");
      return;
    }

    if (
      formData.executionMode === "exclusive" &&
      !formData.assignedNode
    ) {
      setError("Assigned node is required for exclusive mode");
      return;
    }

    if (
      formData.scope === "local" &&
      (formData.executionMode === "parallel" ||
        formData.executionMode === "exclusive")
    ) {
      setError(
        "Local scope workers can only use leader execution mode (single node)",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create worker",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setFormData({
      scriptContent: "",
      dependencies: ["gliesereum"],
      version: "1.19.2",
      scope: "local",
      executionMode: "leader",
      priority: "normal",
      mode: "loop",
      note: "",
    });
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="relative p-2 border border-amber-500/30 bg-amber-500/10">
              <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-foreground">
              Create New Worker
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure execution mode, priority, and script details
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert
            variant="destructive"
            className="border-red-500/30 bg-red-500/10"
          >
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
              {/* Row 1: Scope */}
              <div className="space-y-2">
                <Label>Scope *</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value: "local" | "network") => {
                    const newFormData = {
                      ...formData,
                      scope: value,
                    };
                    // Local scope = only leader mode (single node execution)
                    if (value === "local") {
                      newFormData.executionMode = "leader";
                    }
                    setFormData(newFormData);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        <span>Local</span>
                        <span className="text-xs text-muted-foreground">
                          (This node only)
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="network">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-green-700 dark:text-green-700 dark:text-green-600" />
                        <span>Network</span>
                        <span className="text-xs text-muted-foreground">
                          (All nodes in network)
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose where this worker will be stored and visible
                  {formData.scope === "local" &&
                    " (Only leader mode available for single-node execution)"}
                </p>
              </div>

              {/* Row 2: Execution Mode & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Execution Mode</Label>
                  <Select
                    value={formData.executionMode}
                    onValueChange={(
                      value: "parallel" | "leader" | "exclusive",
                    ) =>
                      setFormData({
                        ...formData,
                        executionMode: value,
                      })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="parallel"
                        disabled={formData.scope === "local"}
                      >
                        <div className="flex items-center gap-2">
                          <Boxes className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                          <span>Parallel</span>
                          <span className="text-xs text-muted-foreground">
                            {formData.scope === "local"
                              ? "(Network only)"
                              : "(All nodes)"}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="leader">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                          <span>Leader</span>
                          <span className="text-xs text-muted-foreground">
                            (Single node)
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="exclusive"
                        disabled={formData.scope === "local"}
                      >
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                          <span>Exclusive</span>
                          <span className="text-xs text-muted-foreground">
                            {formData.scope === "local"
                              ? "(Network only)"
                              : "(Assigned node)"}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(
                      value: "critical" | "high" | "normal" | "low",
                    ) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">
                        <div className="flex items-center gap-2">
                          <Rocket className="w-4 h-4 text-red-700 dark:text-red-400" />
                          <span>Critical</span>
                          <span className="text-xs text-muted-foreground">
                            (50 errors, 1ms)
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                          <span>High</span>
                          <span className="text-xs text-muted-foreground">
                            (20 errors, 10ms)
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-green-700 dark:text-green-700 dark:text-green-600" />
                          <span>Normal</span>
                          <span className="text-xs text-muted-foreground">
                            (10 errors, 100ms)
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                          <span>Low</span>
                          <span className="text-xs text-muted-foreground">
                            (5 errors, 1s)
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Worker Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Worker Mode</Label>
                  <Select
                    value={formData.mode || "loop"}
                    onValueChange={(value: "loop" | "single") =>
                      setFormData({ ...formData, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loop">
                        <div className="flex items-center gap-2">
                          <span>Loop</span>
                          <span className="text-xs text-muted-foreground">
                            (Engine repeats)
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="single">
                        <div className="flex items-center gap-2">
                          <span>Single</span>
                          <span className="text-xs text-muted-foreground">
                            (Self-managed)
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Version */}
                <div className="space-y-2">
                  <Label>Dependencies Version</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })}
                    placeholder="1.19.2"
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Conditional fields for exclusive mode */}
              {formData.executionMode === "exclusive" && (
                <div className="space-y-2">
                  <Label>Assigned Node</Label>
                  <Input
                    value={formData.assignedNode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignedNode: e.target.value,
                      })}
                    placeholder="s-0001"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Node ID where this worker will execute
                  </p>
                </div>
              )}

              {/* Optional fields */}
              <div className="space-y-2">
                <Label>Account ID (Optional)</Label>
                <Input
                  value={formData.accountId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, accountId: e.target.value })}
                  placeholder="g-bhts"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Gliesereum account for trading operations
                </p>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.note || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })}
                  placeholder="Brief description of this worker"
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Dependencies */}
              <div className="space-y-2">
                <Label>Dependencies (comma-separated)</Label>
                <Input
                  value={formData.dependencies.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dependencies: e.target.value.split(",").map((d) =>
                        d.trim()
                      ).filter(Boolean),
                    })}
                  placeholder="gliesereum"
                  className="font-mono"
                />
              </div>

              {/* Script Content */}
              <div className="space-y-2">
                <Label>Script Content *</Label>
                <Textarea
                  value={formData.scriptContent}
                  onChange={(e) =>
                    setFormData({ ...formData, scriptContent: e.target.value })}
                  placeholder="Enter your worker script code here..."
                  rows={12}
                  className="font-mono text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Write your worker script code
                </p>
              </div>

              {/* Configuration Summary */}
              <div className="relative p-3 bg-blue-500/5 border border-blue-500/30">
                <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-blue-500/50" />
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="text-foreground font-bold">
                      Configuration Summary
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Scope:</span>{" "}
                      <span
                        className={formData.scope === "network"
                          ? "text-green-700 dark:text-green-700 dark:text-green-600"
                          : "text-blue-700 dark:text-blue-400"}
                      >
                        {formData.scope}
                      </span>{" "}
                      ({formData.scope === "local"
                        ? "this node only"
                        : "all nodes in network"})
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Mode:</span>{" "}
                      {formData.executionMode}
                      {formData.executionMode === "exclusive" &&
                        ` on ${formData.assignedNode || "unspecified"}`}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Priority:</span>{" "}
                      {formData.priority} (
                      {formData.priority === "critical" && "50 errors, 1ms"}
                      {formData.priority === "high" && "20 errors, 10ms"}
                      {formData.priority === "normal" && "10 errors, 100ms"}
                      {formData.priority === "low" && "5 errors, 1s"}
                      )
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Worker Mode:</span>{" "}
                      {formData.mode || "loop"}
                    </p>
                  </div>
                </div>
              </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.scriptContent.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            {isSubmitting
              ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2" />
                  Creating...
                </>
              )
              : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Create Worker
                </>
              )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
