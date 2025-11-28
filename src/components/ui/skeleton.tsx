/**
 * Skeleton Component
 * Loading placeholder component
 */

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
}

/**
 * Skeleton Component
 * Displays a loading placeholder with pulse animation
 */
export function Skeleton({ className, ...props }: SkeletonProps): React.ReactElement {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-muted", className)}
			{...props}
		/>
	);
}

