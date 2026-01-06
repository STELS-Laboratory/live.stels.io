import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  "aria-required"?: boolean;
  "aria-describedby"?: string;
}

function Input({
  className,
  type,
  "aria-required": ariaRequired,
  "aria-describedby": ariaDescribedBy,
  required,
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      aria-required={ariaRequired ?? required}
      aria-describedby={ariaDescribedBy}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "flex h-[2.5rem] w-full min-w-0 rounded border border-input bg-input-background px-3 text-sm",
        "transition-all duration-150 outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className,
      )}
      required={required}
      {...props}
    />
  );
}

export { Input };
