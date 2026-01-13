/**
 * Worker configuration validation utilities
 * Consolidates all validation logic for worker configs
 */

import {
  validateAccountId,
  validateDependencies,
  validateNodeId,
  validateVersion,
} from "../../utils/validation.ts";

export interface WorkerConfig {
  scope: "local" | "network";
  executionMode: "parallel" | "leader" | "exclusive";
  priority: "critical" | "high" | "normal" | "low";
  mode: "loop" | "single";
  version: string;
  dependencies: string[];
  accountId: string;
  assignedNode: string;
  nid: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a complete worker configuration
 * @param config - Worker configuration to validate
 * @returns Validation result with error message if invalid
 */
export function validateWorkerConfig(config: WorkerConfig): ValidationResult {
  // Validation: local scope can only use leader mode
  if (
    config.scope === "local" &&
    (config.executionMode === "parallel" ||
      config.executionMode === "exclusive")
  ) {
    return {
      valid: false,
      error:
        "Invalid configuration: Local scope workers can only use leader execution mode (single node execution)",
    };
  }

  // Validate dependencies
  const depsValidation = validateDependencies(config.dependencies);
  if (!depsValidation.valid) {
    return {
      valid: false,
      error: depsValidation.error || "Invalid dependencies",
    };
  }

  // Validate version
  const versionValidation = validateVersion(config.version);
  if (!versionValidation.valid) {
    return {
      valid: false,
      error: versionValidation.error || "Invalid version",
    };
  }

  // Validate node ID if provided (optional field - clear if invalid instead of blocking)
  if (config.nid) {
    const nidValidation = validateNodeId(config.nid);
    if (!nidValidation.valid) {
      return {
        valid: false,
        error: nidValidation.error || "Invalid node ID",
      };
    }
  }

  // Validate account ID if provided (optional field)
  if (config.accountId) {
    const accountIdValidation = validateAccountId(config.accountId);
    if (!accountIdValidation.valid) {
      return {
        valid: false,
        error: accountIdValidation.error || "Invalid account ID",
      };
    }
  }

  return { valid: true };
}

