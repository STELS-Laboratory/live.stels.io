/**
 * Skeleton Loaders for Trading Terminal
 * Professional loading states for all components
 */

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton for chart
 */
export function ChartSkeleton({ className }: { className?: string }): React.ReactElement {
	return (
		<div className={cn("flex flex-col h-full bg-background", className)}>
			{/* Header skeleton */}
			<div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
				<div className="flex items-center gap-4">
					<div className="h-6 w-24 bg-muted animate-pulse rounded" />
					<div className="h-8 w-32 bg-muted animate-pulse rounded" />
				</div>
				<div className="h-8 w-20 bg-muted animate-pulse rounded" />
			</div>
			{/* Chart area skeleton */}
			<div className="flex-1 relative overflow-hidden p-4">
				<div className="h-full w-full bg-muted/20 animate-pulse rounded" />
			</div>
		</div>
	);
}

/**
 * Skeleton for order book
 */
export function OrderBookSkeleton(): React.ReactElement {
	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header skeleton */}
			<div className="px-4 py-2.5 border-b border-border bg-muted/30">
				<div className="h-6 w-32 bg-muted animate-pulse rounded" />
			</div>
			{/* Rows skeleton */}
			<div className="flex-1 overflow-hidden p-2 space-y-1">
				{Array.from({ length: 10 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center justify-between px-3 py-1"
					>
						<div className="h-4 w-20 bg-muted animate-pulse rounded" />
						<div className="h-4 w-16 bg-muted animate-pulse rounded" />
						<div className="h-4 w-16 bg-muted animate-pulse rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton for orders list
 */
export function OrdersListSkeleton(): React.ReactElement {
	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header skeleton */}
			<div className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-border bg-muted/20">
				{Array.from({ length: 7 }).map((_, i) => (
					<div key={i} className="h-4 bg-muted animate-pulse rounded" />
				))}
			</div>
			{/* Rows skeleton */}
			<div className="flex-1 overflow-hidden p-2 space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="grid grid-cols-12 gap-2 px-3 py-2"
					>
						{Array.from({ length: 7 }).map((_, j) => (
							<div key={j} className="h-4 bg-muted animate-pulse rounded" />
						))}
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton for balance
 */
export function BalanceSkeleton(): React.ReactElement {
	return (
		<div className="flex flex-col h-full bg-background">
			{/* Summary skeleton */}
			<div className="p-4 border-b border-border bg-muted/20">
				<div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
				<div className="grid grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<div className="h-3 w-20 bg-muted animate-pulse rounded" />
							<div className="h-6 w-24 bg-muted animate-pulse rounded" />
						</div>
					))}
				</div>
			</div>
			{/* Coins skeleton */}
			<div className="flex-1 overflow-hidden p-4 space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="h-12 bg-muted animate-pulse rounded" />
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton for order controller
 */
export function OrderControllerSkeleton(): React.ReactElement {
	return (
		<div className="flex flex-col h-full bg-background">
			{/* Header skeleton */}
			<div className="px-4 py-3 border-b border-border bg-muted/20">
				<div className="h-5 w-24 bg-muted animate-pulse rounded" />
			</div>
			{/* Form skeleton */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
				<div className="grid grid-cols-2 gap-2">
					<div className="h-12 bg-muted animate-pulse rounded" />
					<div className="h-12 bg-muted animate-pulse rounded" />
				</div>
				<div className="h-20 bg-muted animate-pulse rounded" />
				<div className="h-20 bg-muted animate-pulse rounded" />
				<div className="h-11 bg-muted animate-pulse rounded" />
				<div className="h-11 bg-muted animate-pulse rounded" />
				<div className="h-14 bg-muted animate-pulse rounded" />
			</div>
		</div>
	);
}
