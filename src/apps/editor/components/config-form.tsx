/**
 * ConfigForm component
 * Form for editing worker configuration with centralized validation
 */

import {
  Database,
  Server,
  Cpu,
  Zap,
  Layers,
  Hash,
  Code,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateField } from "../services/worker-validator";
import {
  validateAccountId,
  validateDependencies,
  validateNodeId,
  validateVersion,
} from "../utils/validation.ts";
import type { ConfigFormProps } from "../types/editor.types.ts";

/**
 * ConfigForm component
 */
export function ConfigForm({
  config,
  validationError,
  onChange,
  disabled = false,
  onMigrateClick,
}: ConfigFormProps & { onMigrateClick?: () => void }) {
  const handleFieldChange = (
    field: string,
    value: unknown,
    validate: boolean = true,
  ) => {
    if (validate) {
      const validation = validateField(
        field as keyof typeof config,
        value,
        config,
      );
      if (!validation.valid) {
        // Validation error will be set by parent
        return;
      }
    }
    onChange(field, value);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-2 bg-muted p-3 border rounded">
      {/* Validation Error */}
      {validationError && (
        <Alert className="border-red-500/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Row 1: Scope (Read-only) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="w-3 h-3" />
          <span>Scope (Read-only)</span>
        </div>
        <Select value={config.scope} disabled={true}>
          <SelectTrigger className="bg-muted/50 border-border text-card-foreground text-xs h-8 opacity-75 cursor-not-allowed">
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
          Scope cannot be changed after creation.
          {config.scope === "local" && onMigrateClick && (
            <>
              {" "}Use{" "}
              <button
                onClick={onMigrateClick}
                className="text-blue-700 dark:text-blue-400 hover:text-blue-500 underline font-medium"
              >
                Migrate to Network
              </button>{" "}
              to move this worker to network scope with a new ID.
            </>
          )}
        </p>
      </div>

      {/* Local Scope Info */}
      {config.scope === "local" && (
        <Alert className="border-blue-500/30 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-400 text-xs">
            <strong>Local scope:</strong> Worker executes only on this node in
            leader mode. Parallel and exclusive modes are only available for
            network scope.
          </AlertDescription>
        </Alert>
      )}

      {/* Row 2: Execution Mode and Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cpu className="w-3 h-3" />
            <span>Execution Mode</span>
          </div>
          <Select
            value={config.executionMode}
            onValueChange={(value: "parallel" | "leader" | "exclusive") =>
              handleFieldChange("executionMode", value)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parallel" disabled={config.scope === "local"}>
                <div className="flex items-center gap-2">
                  <span>Parallel</span>
                  <span className="text-xs text-muted-foreground">
                    {config.scope === "local" ? "(Network only)" : "(All nodes)"}
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="leader">
                <div className="flex items-center gap-2">
                  <span>Leader</span>
                  <span className="text-xs text-muted-foreground">
                    (Single node)
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="exclusive" disabled={config.scope === "local"}>
                <div className="flex items-center gap-2">
                  <span>Exclusive</span>
                  <span className="text-xs text-muted-foreground">
                    {config.scope === "local"
                      ? "(Network only)"
                      : "(Assigned node)"}
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3 h-3" />
            <span>Priority</span>
          </div>
          <Select
            value={config.priority}
            onValueChange={(value: "critical" | "high" | "normal" | "low") =>
              handleFieldChange("priority", value)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">
                <div className="flex items-center gap-2">
                  <span>Critical</span>
                  <span className="text-xs text-muted-foreground">
                    (50 errors, 1ms)
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <span>High</span>
                  <span className="text-xs text-muted-foreground">
                    (20 errors, 10ms)
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="normal">
                <div className="flex items-center gap-2">
                  <span>Normal</span>
                  <span className="text-xs text-muted-foreground">
                    (10 errors, 100ms)
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
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

      {/* Row 3: Worker Mode and Version */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="w-3 h-3" />
            <span>Worker Mode</span>
          </div>
          <Select
            value={config.mode}
            onValueChange={(value: "loop" | "single") =>
              handleFieldChange("mode", value)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
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

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hash className="w-3 h-3" />
            <span>Version</span>
          </div>
          <Input
            value={config.version}
            onChange={(e) => {
              const validation = validateVersion(e.target.value);
              if (validation.valid) {
                handleFieldChange("version", e.target.value, false);
              }
            }}
            placeholder="1.19.2"
            className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
            aria-label="Version"
            disabled={disabled}
            aria-invalid={validationError?.includes("version") || false}
          />
          {validationError?.includes("version") && (
            <p className="text-xs text-red-700 dark:text-red-400">
              {validationError}
            </p>
          )}
        </div>
      </div>

      {/* Row 4: Node ID and Dependencies */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Server className="w-3 h-3" />
            <span>Node ID</span>
          </div>
          <Input
            value={config.nid}
            onChange={(e) => {
              const validation = validateNodeId(e.target.value);
              if (validation.valid) {
                handleFieldChange("nid", e.target.value, false);
              }
            }}
            placeholder="s-0001"
            className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
            aria-label="Node ID (optional)"
            disabled={disabled}
            aria-invalid={validationError?.includes("node ID") || false}
          />
          {validationError?.includes("node ID") && (
            <p className="text-xs text-red-700 dark:text-red-400">
              {validationError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="w-3 h-3" />
            <span>Dependencies</span>
          </div>
          <Input
            value={config.dependencies.join(", ")}
            onChange={(e) => {
              const deps = e.target.value
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean);
              const validation = validateDependencies(deps);
              if (validation.valid) {
                handleFieldChange("dependencies", deps, false);
              }
            }}
            placeholder="gliesereum"
            className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
            aria-label="Dependencies (comma-separated)"
            disabled={disabled}
            aria-invalid={validationError?.includes("dependencies") || false}
          />
          {validationError?.includes("dependencies") && (
            <p className="text-xs text-red-700 dark:text-red-400">
              {validationError}
            </p>
          )}
        </div>
      </div>

      {/* Row 5: Account ID */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Code className="w-3 h-3" />
            <span>Account ID (Optional)</span>
          </div>
          <Input
            value={config.accountId}
            onChange={(e) => {
              const validation = validateAccountId(e.target.value);
              if (validation.valid) {
                handleFieldChange("accountId", e.target.value, false);
              }
            }}
            placeholder="g-bhts"
            className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
            aria-label="Account ID (optional)"
            disabled={disabled}
            aria-invalid={validationError?.includes("account ID") || false}
          />
          {validationError?.includes("account ID") && (
            <p className="text-xs text-red-700 dark:text-red-400">
              {validationError}
            </p>
          )}
        </div>

        {config.executionMode === "exclusive" && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Server className="w-3 h-3" />
              <span>Assigned Node</span>
            </div>
            <Input
              value={config.assignedNode}
              onChange={(e) =>
                handleFieldChange("assignedNode", e.target.value, false)}
              placeholder="s-0001"
              className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

