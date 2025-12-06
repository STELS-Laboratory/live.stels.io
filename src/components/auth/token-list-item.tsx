/**
 * Token List Item Component
 * Displays a single token in list view
 */

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import type { Token } from "@/types/token";

interface TokenListItemProps {
	token: Token;
	price: number | null;
	isSelected: boolean;
	onClick: () => void;
}

/**
 * Format supply value
 * Values come in human-readable format (already in main units, not smallest units)
 */
function formatSupply(value: string, decimals: number): string {
	const num = parseFloat(value);
	if (isNaN(num)) return "N/A";
	
	// Values are already in main units, no need to divide by 10^decimals
	const adjusted = num;
	
	if (adjusted >= 1_000_000_000) {
		return `${(adjusted / 1_000_000_000).toFixed(2)}B`;
	}
	if (adjusted >= 1_000_000) {
		return `${(adjusted / 1_000_000).toFixed(2)}M`;
	}
	if (adjusted >= 1_000) {
		return `${(adjusted / 1_000).toFixed(2)}K`;
	}
	return adjusted.toLocaleString(undefined, {
		maximumFractionDigits: decimals,
		minimumFractionDigits: 0,
	});
}

/**
 * Format price value
 */
function formatPrice(price: number | null): string {
	if (price === null || price === undefined) return "N/A";
	
	if (price >= 1_000_000) {
		return `$${(price / 1_000_000).toFixed(2)}M`;
	}
	if (price >= 1_000) {
		return `$${(price / 1_000).toFixed(2)}K`;
	}
	if (price >= 1) {
		return `$${price.toFixed(2)}`;
	}
	if (price >= 0.01) {
		return `$${price.toFixed(4)}`;
	}
	return `$${price.toFixed(8)}`;
}

/**
 * Token List Item Component
 */
export function TokenListItem({
	token,
	price,
	isSelected,
	onClick,
}: TokenListItemProps): React.ReactElement {
	const metadata = token.metadata;
	const supply = token.economics?.supply;
	
	const formattedSupply = supply?.initial 
		? formatSupply(supply.initial, metadata.decimals)
		: "N/A";
	const formattedMaxSupply = supply?.max
		? formatSupply(supply.max, metadata.decimals)
		: supply?.max === undefined ? "Unlimited" : "N/A";
	const hasDistribution = token.economics?.distribution && token.economics.distribution.length > 0;
	
	// For USDT, use fixed price of 1
	const symbolUpper = metadata.symbol.toUpperCase();
	const displayPrice = symbolUpper === "USDT" ? 1 : price;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
			className={cn(
				"flex items-center gap-4 rounded border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer p-4",
				isSelected && "border-amber-500 bg-amber-500/5",
			)}
			onClick={onClick}
		>
			{/* Token Icon */}
			<div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
				{metadata.icon
					? (
						<img
							src={metadata.icon}
							alt={metadata.symbol}
							className="w-[70%] h-[70%] object-contain"
						/>
					)
					: (
						<Coins className="w-6 h-6 text-amber-500/50" />
					)}
			</div>

			{/* Token Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1 flex-wrap">
					<span className="font-semibold text-foreground text-base">
						{metadata.name}
					</span>
					<Badge
						variant="outline"
						className="text-xs font-mono border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 shrink-0"
					>
						{metadata.symbol}
					</Badge>
					{token.standard && (
						<Badge
							variant="outline"
							className="text-xs capitalize shrink-0"
						>
							{token.standard}
						</Badge>
					)}
				</div>
				{metadata.description && (
					<p className="text-xs text-muted-foreground line-clamp-1">
						{metadata.description}
					</p>
				)}
			</div>

			{/* Price */}
			<div className="text-right flex-shrink-0 min-w-[100px]">
				<div className="font-semibold text-foreground text-base">
					{formatPrice(displayPrice)}
				</div>
				<div className="text-xs text-muted-foreground mt-0.5">
					Price
				</div>
			</div>

			{/* Supply Info */}
			<div className="text-right flex-shrink-0 min-w-[120px] hidden md:block">
				<div className="font-semibold text-foreground text-sm">
					{formattedSupply}
				</div>
				<div className="text-xs text-muted-foreground mt-0.5">
					Initial Supply
				</div>
			</div>

			{/* Max Supply */}
			<div className="text-right flex-shrink-0 min-w-[120px] hidden lg:block">
				<div className="font-semibold text-foreground text-sm">
					{formattedMaxSupply}
				</div>
				<div className="text-xs text-muted-foreground mt-0.5">
					Max Supply
				</div>
			</div>

			{/* Policy & Distribution */}
			<div className="text-right flex-shrink-0 min-w-[100px] hidden lg:block">
				{supply?.mintingPolicy && (
					<Badge
						variant="outline"
						className="text-xs capitalize mb-1"
					>
						{supply.mintingPolicy}
					</Badge>
				)}
				{hasDistribution && (
					<div className="text-xs text-muted-foreground">
						{token.economics.distribution?.length} holder{token.economics.distribution?.length === 1 ? "" : "s"}
					</div>
				)}
			</div>

			{/* Status */}
			{token.status && (
				<div className="flex-shrink-0">
					<Badge
						variant={token.status === "pending" ? "outline" : "default"}
						className="text-xs"
					>
						{token.status}
					</Badge>
				</div>
			)}
		</motion.div>
	);
}

