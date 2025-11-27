/**
 * Trading Version Badge Component
 * Displays component version with SVG indicator
 */

import React from "react";
import { TRADING_TERMINAL_VERSION } from "../constants";
import { cn } from "@/lib/utils";

interface TradingVersionBadgeProps {
	className?: string;
	size?: "sm" | "md" | "lg";
	showVersion?: boolean;
}

/**
 * Trading Version Badge Component
 * Displays version with SVG icon
 */
export function TradingVersionBadge({
	className,
	size = "sm",
	showVersion = true,
}: TradingVersionBadgeProps): React.ReactElement {
	const sizeClasses = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	};

	const textSizeClasses = {
		sm: "text-[8px]",
		md: "text-[10px]",
		lg: "text-xs",
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/30 border border-border/50",
				className,
			)}
			title={`Trading Terminal v${TRADING_TERMINAL_VERSION}`}
		>
			<svg
				className={cn(sizeClasses[size], "text-muted-foreground")}
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M12 2L2 7L12 12L22 7L12 2Z"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M2 17L12 22L22 17"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M2 12L12 17L22 12"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			{showVersion && (
				<span
					className={cn(
						"font-mono font-semibold text-muted-foreground",
						textSizeClasses[size],
					)}
				>
					v{TRADING_TERMINAL_VERSION}
				</span>
			)}
		</div>
	);
}
