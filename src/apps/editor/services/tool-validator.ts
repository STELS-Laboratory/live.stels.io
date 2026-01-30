/**
 * Tool validation service
 * Validates MCP tool name, input schema, and SetToolRequest fields per OpenAPI
 */

export const TOOL_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
export const TOOL_NAME_MAX_LENGTH = 100;
export const TOOL_DESCRIPTION_MAX_LENGTH = 1000;
export const TOOL_TIMEOUT_MIN = 1000;
export const TOOL_TIMEOUT_MAX = 300000;
export const TOOL_TIMEOUT_DEFAULT = 30000;

export const TOOL_CATEGORIES_SET = new Set([
  "trading",
  "analysis",
  "notification",
  "data",
  "utility",
  "custom",
]);

export const TOOL_SCOPES_SET = new Set(["local", "network"]);

export interface ToolValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates tool name per OpenAPI: lowercase, start with letter, only letters numbers hyphens
 */
export function validateToolName(name: string): ToolValidationResult {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Name is required" };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: "Name is required" };
  }
  if (trimmed.length > TOOL_NAME_MAX_LENGTH) {
    return { valid: false, error: `Name must be at most ${TOOL_NAME_MAX_LENGTH} characters` };
  }
  if (!TOOL_NAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: "Name must start with a letter and use only lowercase letters, numbers, and hyphens",
    };
  }
  return { valid: true };
}

/**
 * Validates timeout in milliseconds (1000–300000)
 */
export function validateToolTimeout(timeout: number): ToolValidationResult {
  if (typeof timeout !== "number" || Number.isNaN(timeout)) {
    return { valid: false, error: "Timeout must be a number" };
  }
  if (timeout < TOOL_TIMEOUT_MIN || timeout > TOOL_TIMEOUT_MAX) {
    return {
      valid: false,
      error: `Timeout must be between ${TOOL_TIMEOUT_MIN} and ${TOOL_TIMEOUT_MAX} ms`,
    };
  }
  return { valid: true };
}

/**
 * Validates that a string is parseable as JSON object
 */
export function validateJsonObject(value: string): ToolValidationResult {
  if (!value || typeof value !== "string") {
    return { valid: true }; // optional
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { valid: false, error: "Must be a JSON object" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid JSON" };
  }
}
