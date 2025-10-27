/**
 * Field Error Display Component
 * Shows validation errors for form fields
 */

import { AlertCircle } from "lucide-react";
import { useFieldError } from "../hooks/use-field-error";

interface FieldErrorProps {
  fieldName: string;
  className?: string;
}

/**
 * Display validation error for a specific field
 * @param fieldName - Name of the field to show errors for
 * @param className - Additional CSS classes
 */
export function FieldError({
  fieldName,
  className = "",
}: FieldErrorProps): React.ReactElement | null {
  const { hasError, errorMessage } = useFieldError(fieldName);

  if (!hasError || !errorMessage) {
    return null;
  }

  return (
    <div
      className={`flex items-start gap-1.5 mt-1 text-xs text-red-600 dark:text-red-400 ${className}`}
      role="alert"
    >
      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
      <span>{errorMessage}</span>
    </div>
  );
}

/**
 * Display all errors for a field in a list
 * @param fieldName - Name of the field to show errors for
 */
export function FieldErrorList({
  fieldName,
  className = "",
}: FieldErrorProps): React.ReactElement | null {
  const { hasError, errors } = useFieldError(fieldName);

  if (!hasError || errors.length === 0) {
    return null;
  }

  return (
    <div className={`mt-1 space-y-0.5 ${className}`} role="alert">
      {errors.map((error, index) => (
        <div
          key={index}
          className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400"
        >
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error.message}</span>
        </div>
      ))}
    </div>
  );
}
