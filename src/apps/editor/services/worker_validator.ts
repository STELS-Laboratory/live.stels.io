/**
 * Centralized worker validation service
 * Consolidates all validation logic for worker configurations
 */

import {
  validateAccountId,
  validateDependencies,
  validateNodeId,
  validateVersion,
} from "../utils/validation.ts";
import { validateWorkerConfig } from "../ami_editor/utils/worker_validation.ts";
import type { WorkerConfig, ValidationResult } from "../types/editor.types.ts";

/**
 * Validates and cleans optional fields in worker config
 * Invalid optional fields are cleared instead of blocking
 * @param config - Worker configuration to validate and clean
 * @returns Cleaned config and validation result
 */
export function validateAndCleanConfig(
  config: WorkerConfig,
): { config: WorkerConfig; validation: ValidationResult } {
  const cleanedConfig = { ...config };

  // Validate and clean node ID (optional field)
  if (cleanedConfig.nid) {
    const nidValidation = validateNodeId(cleanedConfig.nid);
    if (!nidValidation.valid) {
      // Node ID is optional - if it's invalid, just clear it
      cleanedConfig.nid = "";
    }
  }

  // Validate and clean account ID (optional field)
  if (cleanedConfig.accountId) {
    const accountValidation = validateAccountId(cleanedConfig.accountId);
    if (!accountValidation.valid) {
      // Account ID is optional - if it's invalid, just clear it
      cleanedConfig.accountId = "";
    }
  }

  // Validate required fields
  const validation = validateWorkerConfig(cleanedConfig);

  return { config: cleanedConfig, validation };
}

/**
 * Validates a worker configuration
 * @param config - Worker configuration to validate
 * @returns Validation result with error message if invalid
 */
export function validateConfig(config: WorkerConfig): ValidationResult {
  return validateWorkerConfig(config);
}

/**
 * Gets validation errors for individual fields
 * @param config - Worker configuration to validate
 * @returns Map of field names to error messages
 */
export function getValidationErrors(
  config: WorkerConfig,
): Map<string, string> {
  const errors = new Map<string, string>();

  // Validate dependencies
  const depsValidation = validateDependencies(config.dependencies);
  if (!depsValidation.valid && depsValidation.error) {
    errors.set("dependencies", depsValidation.error);
  }

  // Validate version
  const versionValidation = validateVersion(config.version);
  if (!versionValidation.valid && versionValidation.error) {
    errors.set("version", versionValidation.error);
  }

  // Validate node ID if provided
  if (config.nid) {
    const nidValidation = validateNodeId(config.nid);
    if (!nidValidation.valid && nidValidation.error) {
      errors.set("nid", nidValidation.error);
    }
  }

  // Validate account ID if provided
  if (config.accountId) {
    const accountIdValidation = validateAccountId(config.accountId);
    if (!accountIdValidation.valid && accountIdValidation.error) {
      errors.set("accountId", accountIdValidation.error);
    }
  }

  // Validate scope and execution mode combination
  if (
    config.scope === "local" &&
    (config.executionMode === "parallel" || config.executionMode === "exclusive")
  ) {
    errors.set(
      "executionMode",
      "Local scope workers can only use leader execution mode",
    );
  }

  return errors;
}

/**
 * Validates a single field in the config
 * @param field - Field name to validate
 * @param value - Field value to validate
 * @param currentConfig - Current full config (for context)
 * @returns Validation result
 */
export function validateField(
  field: keyof WorkerConfig,
  value: unknown,
  currentConfig: WorkerConfig,
): ValidationResult {
  const testConfig = { ...currentConfig, [field]: value };

  // Special handling for scope + executionMode combination
  if (field === "executionMode" || field === "scope") {
    if (
      testConfig.scope === "local" &&
      (testConfig.executionMode === "parallel" ||
        testConfig.executionMode === "exclusive")
    ) {
      return {
        valid: false,
        error:
          "Local scope workers can only use leader execution mode (single node execution)",
      };
    }
  }

  // Validate specific field types
  switch (field) {
    case "dependencies":
      return validateDependencies(value as string[]);
    case "version":
      return validateVersion(value as string);
    case "nid":
      return validateNodeId(value as string);
    case "accountId":
      return validateAccountId(value as string);
    default:
      return { valid: true };
  }
}

/**
 * Auto-corrects invalid configuration combinations
 * @param config - Worker configuration to auto-correct
 * @returns Auto-corrected config
 */
export function autoCorrectConfig(config: WorkerConfig): WorkerConfig {
  const corrected = { ...config };

  // Auto-correct: local scope must use leader mode
  if (
    corrected.scope === "local" &&
    (corrected.executionMode === "parallel" ||
      corrected.executionMode === "exclusive")
  ) {
    corrected.executionMode = "leader";
  }

  return corrected;
}

