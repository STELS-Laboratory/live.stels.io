/**
 * Skeleton Loaders for Wallet Components
 * Professional loading states for all wallet components
 */

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Wallet Card Skeleton
 */
export function WalletCardSkeleton({
	mobile = false,
}: {
	mobile?: boolean;
}): React.ReactElement {
	return (
		<div
			className={cn(
				"relative bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 dark:from-zinc-800 dark:via-zinc-900 dark:to-black rounded shadow-xl overflow-hidden",
				mobile ? "p-4" : "p-6",
			)}
		>
			{/* Card Background Pattern */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full -translate-y-16 translate-x-16" />
				<div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500 rounded-full translate-y-20 -translate-x-20" />
			</div>

			<div
				className={cn(
					"relative z-10",
					mobile ? "space-y-4" : "space-y-6",
				)}
			>
				{/* Card Header */}
				<div
					className={cn(
						"flex items-start justify-between",
						mobile ? "gap-2" : "gap-4",
					)}
				>
					<Skeleton className={cn("h-5 w-24", mobile && "h-4 w-20")} />
					<div className="flex items-center gap-2">
						<Skeleton className={cn("h-4 w-16", mobile && "h-3 w-12")} />
						<Skeleton className={cn("h-8 w-8 rounded-full", mobile && "h-7 w-7")} />
					</div>
				</div>

				{/* Card Number */}
				<Skeleton className={cn("h-4 w-40", mobile && "h-3 w-32")} />

				{/* Balance Section */}
				<div className="space-y-2">
					<Skeleton className={cn("h-3 w-16", mobile && "h-2.5 w-12")} />
					<div className="flex items-baseline gap-2">
						<Skeleton className={cn("h-9 w-32", mobile && "h-7 w-24")} />
						<Skeleton className={cn("h-4 w-12", mobile && "h-3 w-10")} />
					</div>
					<Skeleton className={cn("h-6 w-28", mobile && "h-5 w-24")} />
				</div>

				{/* Wallet Address */}
				<div className="space-y-2 pt-2 border-t border-white/10">
					<Skeleton className="h-2.5 w-24" />
					<div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded p-2 border border-white/20">
						<Skeleton className="h-3 flex-1" />
						<Skeleton className="h-6 w-6 rounded" />
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Staking/Mining Stats Skeleton
 */
export function StakingMiningStatsSkeleton({
	mobile = false,
}: {
	mobile?: boolean;
}): React.ReactElement {
	return (
		<Card className="bg-card border-border shadow-sm h-full flex flex-col overflow-hidden">
			<CardHeader
				className={cn(
					"shrink-0 flex items-center",
					mobile ? "px-3 py-2 h-10" : "px-4 py-3",
				)}
			>
				<Skeleton className={cn("h-5 w-24", mobile && "h-4 w-20")} />
			</CardHeader>
			<CardContent
				className={cn(
					"flex-1 flex flex-col min-h-0 overflow-hidden",
					mobile && "",
				)}
			>
				{/* Tabs Skeleton */}
				<div className="w-full h-8 mb-2 shrink-0 flex gap-2">
					<Skeleton className="h-8 flex-1 rounded" />
					<Skeleton className="h-8 flex-1 rounded" />
				</div>

				{/* Content Skeleton */}
				<div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 mt-0 pr-1">
					{/* Main Info Grid */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Skeleton className="h-2.5 w-20" />
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-2.5 w-16" />
						</div>
						<div className="space-y-1">
							<Skeleton className="h-2.5 w-16" />
							<Skeleton className="h-6 w-20" />
							<Skeleton className="h-2.5 w-12" />
						</div>
					</div>

					{/* Additional Info */}
					<div className="pt-2 border-t border-border space-y-1.5">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between">
								<Skeleton className="h-2.5 w-20" />
								<Skeleton className="h-3 w-24" />
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Token List Skeleton
 */
export function TokenListSkeleton({
	mobile = false,
}: {
	mobile?: boolean;
}): React.ReactElement {
	return (
		<Card className={cn(mobile && "p-2")}>
			<CardHeader className={cn(mobile && "px-4 py-4")}>
				<CardTitle
					className={cn(
						"flex items-center gap-2",
						mobile && "text-base",
					)}
				>
					<Skeleton className={cn("h-5 w-5", mobile && "h-4 w-4")} />
					<Skeleton className={cn("h-5 w-24", mobile && "h-4 w-20")} />
				</CardTitle>
			</CardHeader>
			<CardContent className={cn(mobile && "px-4 pt-0 pb-4")}>
				<div className={cn(mobile ? "space-y-2" : "space-y-3")}>
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className={cn(
								"flex items-center rounded border border-border bg-card",
								mobile ? "gap-2 p-3" : "gap-4 p-4",
							)}
						>
							{/* Token Icon */}
							<Skeleton
								className={cn(
									"rounded-full flex-shrink-0",
									mobile ? "w-10 h-10" : "w-12 h-12",
								)}
							/>

							{/* Token Info */}
							<div className="flex-1 min-w-0 space-y-2">
								<div className="flex items-center gap-2">
									<Skeleton className={cn("h-4 w-24", mobile && "h-3.5 w-20")} />
									<Skeleton className={cn("h-3 w-12", mobile && "h-2.5 w-10")} />
								</div>
								{!mobile && <Skeleton className="h-3 w-32" />}
							</div>

							{/* Token Balance */}
							<div className="text-right flex-shrink-0 space-y-1">
								<Skeleton className={cn("h-4 w-20", mobile && "h-3.5 w-16")} />
								<Skeleton className={cn("h-3 w-16", mobile && "h-2.5 w-12")} />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Transaction List Skeleton
 */
export function TransactionListSkeleton({
	mobile = false,
}: {
	mobile?: boolean;
}): React.ReactElement {
	return (
		<Card className={cn(mobile && "p-2")}>
			<CardHeader className={cn(mobile && "px-4 py-4")}>
				<CardTitle
					className={cn(
						"flex items-center gap-2",
						mobile && "text-base",
					)}
				>
					<Skeleton className={cn("h-5 w-5", mobile && "h-4 w-4")} />
					<Skeleton className={cn("h-5 w-32", mobile && "h-4 w-28")} />
				</CardTitle>
			</CardHeader>
			<CardContent className={cn(mobile && "px-4 pt-0 pb-4")}>
				<div className={cn(mobile ? "space-y-2" : "space-y-3")}>
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className={cn(
								"flex items-start rounded border border-border bg-card",
								mobile ? "gap-2 p-3" : "gap-4 p-4",
							)}
						>
							{/* Direction Icon */}
							<Skeleton
								className={cn(
									"rounded-full flex-shrink-0",
									mobile ? "w-10 h-10" : "w-12 h-12",
								)}
							/>

							{/* Transaction Info */}
							<div className="flex-1 min-w-0 space-y-2">
								<div className="flex items-center gap-2 flex-wrap">
									<Skeleton className={cn("h-4 w-16", mobile && "h-3.5 w-12")} />
									<Skeleton className={cn("h-3 w-20", mobile && "h-2.5 w-16")} />
									<Skeleton className={cn("h-5 w-16 rounded-full", mobile && "h-4 w-12")} />
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<Skeleton className={cn("h-3 w-32", mobile && "h-2.5 w-24")} />
									<Skeleton className={cn("h-3 w-24", mobile && "h-2.5 w-20")} />
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className={cn("h-2.5 w-40", mobile && "h-2 w-32")} />
									<Skeleton className={cn("h-6 w-6 rounded", mobile && "h-5 w-5")} />
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Account List Skeleton
 */
export function AccountListSkeleton({
	mobile = false,
}: {
	mobile?: boolean;
}): React.ReactElement {
	return (
		<Card className={cn(mobile && "p-2")}>
			<CardHeader className={cn(mobile && "px-4 py-4")}>
				<CardTitle
					className={cn(
						"flex items-center gap-2",
						mobile && "text-base",
					)}
				>
					<Skeleton className={cn("h-5 w-5", mobile && "h-4 w-4")} />
					<Skeleton className={cn("h-5 w-28", mobile && "h-4 w-24")} />
				</CardTitle>
			</CardHeader>
			<CardContent className={cn(mobile && "px-4 pb-4")}>
				<div className={cn(mobile ? "space-y-2" : "space-y-3")}>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className={cn(
								"flex items-center rounded border border-border bg-card",
								mobile ? "gap-2 p-3" : "gap-4 p-4",
							)}
						>
							{/* Account Icon */}
							<Skeleton
								className={cn(
									"rounded-full flex-shrink-0",
									mobile ? "w-10 h-10" : "w-12 h-12",
								)}
							/>

							{/* Account Info */}
							<div className="flex-1 min-w-0 space-y-2">
								<div className="flex items-center gap-2 flex-wrap">
									<Skeleton className={cn("h-4 w-24", mobile && "h-3.5 w-20")} />
									<Skeleton className={cn("h-5 w-16 rounded-full", mobile && "h-4 w-12")} />
									<Skeleton className={cn("h-5 w-16 rounded-full", mobile && "h-4 w-12")} />
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<Skeleton className={cn("h-3 w-20", mobile && "h-2.5 w-16")} />
									<Skeleton className={cn("h-3 w-16", mobile && "h-2.5 w-12")} />
								</div>
								<div className="flex items-center gap-1.5 flex-wrap">
									<Skeleton className={cn("h-4 w-20", mobile && "h-3 w-16")} />
									<Skeleton className={cn("h-4 w-16", mobile && "h-3 w-12")} />
									<Skeleton className={cn("h-4 w-16", mobile && "h-3 w-12")} />
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Wallet Header Skeleton
 */
export function WalletHeaderSkeleton({
	mobile = false,
}: {
	mobile?: boolean;
}): React.ReactElement {
	return (
		<div
			className={cn(
				"flex items-start justify-between",
				mobile ? "flex-col gap-2" : "flex-row",
			)}
		>
			<div className={cn(mobile ? "space-y-1" : "space-y-2")}>
				<Skeleton className={cn("h-7 w-24", mobile && "h-6 w-20")} />
				<Skeleton className={cn("h-4 w-64", mobile && "h-3 w-48")} />
			</div>
			<div className={cn("flex gap-2", mobile && "w-full flex-col")}>
				<Skeleton className={cn("h-10 w-24", mobile && "h-10 w-full")} />
				<Skeleton className={cn("h-10 w-24", mobile && "h-10 w-full")} />
				<Skeleton className={cn("h-10 w-32", mobile && "h-10 w-full")} />
			</div>
		</div>
	);
}


