/**
 * Validated Input Component
 * Input field with automatic error display and styling
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFieldErrorClasses } from "../hooks/use-field-error";
import { FieldError } from "./field-error";
import { cn } from "@/lib/utils";

interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: string;
  showError?: boolean;
}

interface ValidatedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldName: string;
  showError?: boolean;
}

/**
 * Input field with automatic validation error display
 */
export function ValidatedInput({
  fieldName,
  className,
  showError = true,
  ...props
}: ValidatedInputProps): React.ReactElement {
  const errorClasses = useFieldErrorClasses(fieldName);

  return (
    <div className="w-full">
      <Input {...props} className={cn(className, errorClasses)} />
      {showError && <FieldError fieldName={fieldName} />}
    </div>
  );
}

/**
 * Textarea field with automatic validation error display
 */
export function ValidatedTextarea({
  fieldName,
  className,
  showError = true,
  ...props
}: ValidatedTextareaProps): React.ReactElement {
  const errorClasses = useFieldErrorClasses(fieldName);

  return (
    <div className="w-full">
      <Textarea {...props} className={cn(className, errorClasses)} />
      {showError && <FieldError fieldName={fieldName} />}
    </div>
  );
}
