import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-[2.5rem] px-4 has-[>svg]:px-3",
				sm: "h-[2rem] px-3 text-xs has-[>svg]:px-2.5",
				lg: "h-[2.75rem] px-6 has-[>svg]:px-4",
				icon: "size-[2.5rem]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}:
	& React.ComponentProps<"button">
	& VariantProps<typeof buttonVariants>
	& {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
