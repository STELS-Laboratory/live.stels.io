import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
				"flex h-[2.5rem] w-full min-w-0 rounded-md border border-input bg-input-background px-3 text-sm",
				"transition-all duration-150 outline-none shadow-sm",
				"file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
				"focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
