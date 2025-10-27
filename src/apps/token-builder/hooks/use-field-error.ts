/**
 * Hook for accessing field-specific validation errors
 * Provides error state and helper functions for field validation
 */

import { useTokenBuilderStore } from "../store";
import type { ValidationError } from "../types";

interface FieldErrorResult {
  hasError: boolean;
  errorMessage: string | undefined;
  errorCode: string | undefined;
  errors: ValidationError[];
}

/**
 * Get validation errors for a specific field
 * @param fieldName - Field name to check for errors (supports nested paths like "metadata.name")
 * @returns Field error state and messages
 */
export function useFieldError(fieldName: string): FieldErrorResult {
  const errors = useTokenBuilderStore((state) => state.errors);

  // Get all errors for this field
  const fieldErrors: ValidationError[] = [];

  // Check direct match
  if (errors[fieldName]) {
    fieldErrors.push(
      ...errors[fieldName].map((msg) => ({
        field: fieldName,
        message: msg,
        code: "VALIDATION_ERROR",
      })),
    );
  }

  // Check for nested field matches (e.g., "metadata.name" should match "metadata")
  const fieldParts = fieldName.split(".");
  if (fieldParts.length > 1) {
    const parentField = fieldParts[0];
    if (errors[parentField]) {
      errors[parentField].forEach((msg) => {
        if (msg.toLowerCase().includes(fieldParts[1].toLowerCase())) {
          fieldErrors.push({
            field: fieldName,
            message: msg,
            code: "VALIDATION_ERROR",
          });
        }
      });
    }
  }

  return {
    hasError: fieldErrors.length > 0,
    errorMessage: fieldErrors[0]?.message,
    errorCode: fieldErrors[0]?.code,
    errors: fieldErrors,
  };
}

/**
 * Get CSS classes for input field based on error state
 * @param fieldName - Field name to check
 * @param baseClasses - Base CSS classes for the input
 * @returns Combined CSS classes with error styling
 */
export function useFieldErrorClasses(
  fieldName: string,
  baseClasses: string = "",
): string {
  const { hasError } = useFieldError(fieldName);

  const errorClasses = hasError
    ? "border-red-500 dark:border-red-500 focus-visible:ring-red-500"
    : "";

  return `${baseClasses} ${errorClasses}`.trim();
}

/**
 * Check if any field has errors
 * @param fieldNames - Array of field names to check
 * @returns True if any field has errors
 */
export function useHasAnyError(fieldNames: string[]): boolean {
  const errors = useTokenBuilderStore((state) => state.errors);

  return fieldNames.some((fieldName) => {
    if (errors[fieldName] && errors[fieldName].length > 0) {
      return true;
    }

    // Check nested fields
    const fieldParts = fieldName.split(".");
    if (fieldParts.length > 1) {
      const parentField = fieldParts[0];
      if (errors[parentField] && errors[parentField].length > 0) {
        return true;
      }
    }

    return false;
  });
}

