/**
 * Staking and Mining Stats Component
 * Displays staking and mining information for the wallet
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	Award,
	BarChart3,
	Clock,
	Hash,
	Lock,
	Plus,
	Shield,
	TrendingUp,
	Unlock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormattedNumber } from "@/components/ui/formatted-number";
import { cn } from "@/lib/utils";
import type { MiningData, StakingData } from "@/hooks/use_asset_balances";

interface StakingMiningStatsProps {
	staking: StakingData | null;
	mining: MiningData | null;
	mobile?: boolean;
	onBack?: () => void;
	onAddStaking?: () => void;
}

/**
 * Format large numbers
 */
function formatLargeNumber(num: number | string): string {
	const numValue = typeof num === "string" ? Number.parseFloat(num) : num;
	if (Number.isNaN(numValue)) return "0";

	if (numValue >= 1_000_000_000) {
		return `${(numValue / 1_000_000_000).toFixed(2)}B`;
	}
	if (numValue >= 1_000_000) {
		return `${(numValue / 1_000_000).toFixed(2)}M`;
	}
	if (numValue >= 1_000) {
		return `${(numValue / 1_000).toFixed(2)}K`;
	}
	return numValue.toFixed(2);
}

/**
 * Format date with time
 */
function formatDate(dateString: string): string {
	try {
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return dateString;
	}
}

/**
 * Calculate time until unlock
 */
function getTimeUntilUnlock(dateString: string): string {
	try {
		const unlockDate = new Date(dateString);
		const now = new Date();
		const diff = unlockDate.getTime() - now.getTime();

		if (diff <= 0) return "Unlocked";

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (days > 0) {
			return `${days}d ${hours}h`;
		}
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	} catch {
		return "";
	}
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Staking and Mining Stats Component
 */
export function StakingMiningStats({
	staking,
	mining,
	mobile = false,
	onBack,
	onAddStaking,
}: StakingMiningStatsProps): React.ReactElement | null {
	// Check if mining data exists and has meaningful values
	// Show mining section if mining object exists, even if values are zero
	const hasMiningData = mining !== null && mining !== undefined;

	// If no staking and no mining, show empty state with call to action
	if (!staking && !hasMiningData) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="w-full h-full flex flex-col max-h-[300px]"
			>
				<Card className="bg-card border-border shadow-sm h-full flex flex-col overflow-hidden">
					<CardHeader
						className={cn(
							"shrink-0 flex items-center",
							mobile ? "px-3 py-2 h-10" : "px-4 py-3",
						)}
					>
						<div className="flex items-center justify-between gap-2 w-full">
							<CardTitle
								className={cn(
									"text-sm font-semibold flex items-center gap-1.5",
									mobile && "text-xs",
								)}
							>
								<Shield
									className={cn(
										"h-3.5 w-3.5 text-primary",
										mobile && "h-3 w-3",
									)}
								/>
								Staking & Mining
							</CardTitle>
							{mobile && onBack && (
								<Button
									variant="ghost"
									onClick={onBack}
									className="!h-7 !w-7 !p-0 shrink-0 !min-h-0"
								>
									<ArrowLeft className="h-4 w-4" />
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent
						className={cn(
							"flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden p-6",
							mobile && "p-4",
						)}
					>
						<div className="text-center space-y-4 max-w-sm mx-auto">
							<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
								<Shield className="w-8 h-8 text-muted-foreground" />
							</div>
							<div className="space-y-2">
								<h3
									className={cn(
										"font-semibold text-foreground",
										mobile ? "text-base" : "text-lg",
									)}
								>
									No Staking Yet
								</h3>
								<p
									className={cn(
										"text-muted-foreground",
										mobile ? "text-xs" : "text-sm",
									)}
								>
									Start staking your tokens to earn rewards and participate in
									network security.
								</p>
							</div>
							{onAddStaking && (
								<Button
									onClick={onAddStaking}
									variant="default"
									className={cn(
										"w-full",
										mobile && "h-10 text-sm",
									)}
								>
									<Plus
										className={cn("mr-2", mobile ? "h-4 w-4" : "h-4 w-4")}
									/>
									Add Staking
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</motion.div>
		);
	}

	// Determine default tab based on available data
	const defaultTab = staking ? "staking" : "mining";
	const [activeTab, setActiveTab] = useState<string>(defaultTab);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="w-full h-full flex flex-col max-h-[300px]"
		>
			<Card className="bg-card border-border shadow-sm h-full flex flex-col overflow-hidden">
				<CardHeader
					className={cn(
						"shrink-0 flex items-center",
						mobile ? "px-3 py-2 h-10" : "px-4 py-3",
					)}
				>
					<div className="flex items-center justify-between gap-2 w-full">
						<CardTitle
							className={cn(
								"text-sm font-semibold flex items-center gap-1.5",
								mobile && "text-xs",
							)}
						>
							{activeTab === "staking" && (
								<Shield
									className={cn(
										"h-3.5 w-3.5 text-primary",
										mobile && "h-3 w-3",
									)}
								/>
							)}
							{activeTab === "mining" && (
								<Hash
									className={cn(
										"h-3.5 w-3.5 text-primary",
										mobile && "h-3 w-3",
									)}
								/>
							)}
							{activeTab === "staking" ? "Staking" : "Mining"}
							{activeTab === "staking" && staking?.is_notary && (
								<Badge
									variant="default"
									className="ml-1 text-[10px] px-1 py-0 h-4 bg-primary/20 text-primary border-primary/30"
								>
									Notary
								</Badge>
							)}
						</CardTitle>
						{mobile && onBack && (
							<Button
								variant="ghost"
								onClick={onBack}
								className="!h-7 !w-7 !p-0 shrink-0 !min-h-0"
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent
					className={cn(
						"flex-1 flex flex-col min-h-0 overflow-hidden",
						mobile && "",
					)}
				>
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full h-full flex flex-col min-h-0"
					>
						<TabsList
							className={cn("w-full h-8 mb-2 shrink-0", mobile && "h-7")}
						>
							{staking && (
								<TabsTrigger
									value="staking"
									className={cn(
										"flex items-center gap-1.5 flex-1 text-xs px-2 border-0 !border-0 data-[state=active]:!border-0 dark:data-[state=active]:!border-0",
										mobile ? "!h-[1.75rem]" : "!h-8",
									)}
									style={{
										height: mobile ? "1.75rem" : "2rem",
										maxHeight: mobile ? "1.75rem" : "2rem",
										minHeight: mobile ? "1.75rem" : "2rem",
									}}
								>
									<Shield className="h-3.5 w-3.5 shrink-0" />
									<span>Staking</span>
								</TabsTrigger>
							)}
							{hasMiningData && (
								<TabsTrigger
									value="mining"
									className={cn(
										"flex items-center gap-1.5 flex-1 text-xs px-2 border-0 !border-0 data-[state=active]:!border-0 dark:data-[state=active]:!border-0",
										mobile ? "!h-[1.75rem]" : "!h-8",
									)}
									style={{
										height: mobile ? "1.75rem" : "2rem",
										maxHeight: mobile ? "1.75rem" : "2rem",
										minHeight: mobile ? "1.75rem" : "2rem",
									}}
								>
									<Hash className="h-3.5 w-3.5 shrink-0" />
									<span>Mining</span>
								</TabsTrigger>
							)}
						</TabsList>

						{/* Staking Tab Content */}
						{staking && (
							<TabsContent
								value="staking"
								className="flex-1 min-h-0 overflow-y-auto space-y-2.5 mt-0 pr-1"
							>
								{/* Main Staking Info */}
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
											Staked Amount
										</div>
										<div className="text-lg font-bold text-foreground leading-tight">
											<FormattedNumber
												value={staking.amount_sli}
												decimals={3}
												useGrouping={true}
											/>{" "}
											SLI
										</div>
										<div className="text-[10px] text-muted-foreground">
											{formatLargeNumber(staking.amount)} units
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
											Status
										</div>
										<div className="flex items-center gap-1.5">
											{staking.is_locked
												? (
													<>
														<Lock className="h-4 w-4 text-amber-500" />
														<span className="text-sm font-semibold text-amber-500">
															Locked
														</span>
													</>
												)
												: (
													<>
														<Unlock className="h-4 w-4 text-green-500" />
														<span className="text-sm font-semibold text-green-500">
															Unlocked
														</span>
													</>
												)}
										</div>
										{staking.is_locked && staking.locked_until_date && (
											<div className="space-y-0.5">
												<div className="flex items-center gap-1 text-[10px] text-muted-foreground">
													<Clock className="h-3 w-3" />
													<span className="truncate">
														{formatDate(staking.locked_until_date)}
													</span>
												</div>
												<div className="text-[10px] font-semibold text-amber-500">
													{getTimeUntilUnlock(staking.locked_until_date)}{" "}
													remaining
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Additional Info */}
								<div className="pt-2 border-t border-border space-y-1.5">
									{staking.min_stake &&
										Number.parseFloat(staking.min_stake_sli) > 0 && (
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-muted-foreground">
												Min Stake:
											</span>
											<span className="text-xs font-semibold text-foreground">
												<FormattedNumber
													value={staking.min_stake_sli}
													decimals={3}
													useGrouping={true}
												/>{" "}
												SLI
											</span>
										</div>
									)}
									{staking.locked_until && (
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-muted-foreground">
												Locked Until:
											</span>
											<span className="text-[10px] font-mono text-foreground">
												{staking.locked_until}
											</span>
										</div>
									)}
									<div className="flex items-center justify-between">
										<span className="text-[10px] text-muted-foreground">
											Amount (raw):
										</span>
										<span className="text-[10px] font-mono text-foreground">
											{formatLargeNumber(staking.amount)}
										</span>
									</div>
									{staking.amount_sli && (
										<div className="flex items-center justify-between">
											<span className="text-[10px] text-muted-foreground">
												Amount SLI:
											</span>
											<span className="text-xs font-semibold text-foreground">
												<FormattedNumber
													value={staking.amount_sli}
													decimals={6}
													useGrouping={true}
												/>{" "}
												SLI
											</span>
										</div>
									)}
								</div>
							</TabsContent>
						)}

						{/* Mining Tab Content */}
						{hasMiningData && (
							<TabsContent
								value="mining"
								className="flex-1 min-h-0 overflow-y-auto space-y-2.5 mt-0 pr-1"
							>
								{/* Main Mining Info */}
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
											Total Mined
										</div>
										<div className="text-lg font-bold text-foreground leading-tight">
											<FormattedNumber
												value={mining.total_mined_sli || "0"}
												decimals={6}
												useGrouping={true}
											/>{" "}
											SLI
										</div>
										<div className="text-[10px] text-muted-foreground">
											{formatLargeNumber(mining.total_mined || "0")} units
										</div>
									</div>
									<div className="space-y-1">
										<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
											Last Epoch
										</div>
										<div className="text-lg font-bold text-foreground leading-tight">
											{mining.last_reward_epoch || "N/A"}
										</div>
										<div className="text-[10px] text-muted-foreground">
											Epoch number
										</div>
									</div>
								</div>

								{/* Additional Mining Info */}
								{(mining.total_mined || mining.total_mined_sli) && (
									<div className="pt-2 border-t border-border space-y-1.5">
										{mining.total_mined && (
											<div className="flex items-center justify-between">
												<span className="text-[10px] text-muted-foreground">
													Mined (raw):
												</span>
												<span className="text-[10px] font-mono text-foreground">
													{formatLargeNumber(mining.total_mined)}
												</span>
											</div>
										)}
										{mining.total_mined_sli && (
											<div className="flex items-center justify-between">
												<span className="text-[10px] text-muted-foreground">
													Mined SLI:
												</span>
												<span className="text-xs font-semibold text-foreground">
													<FormattedNumber
														value={mining.total_mined_sli}
														decimals={6}
														useGrouping={true}
													/>{" "}
													SLI
												</span>
											</div>
										)}
									</div>
								)}

								{/* Rewards History */}
								{mining.rewards_history && mining.rewards_history.length > 0 &&
									(
										<div className="pt-2 border-t border-border">
											<div className="flex items-center gap-1.5 mb-2">
												<Award className="h-3 w-3 text-muted-foreground" />
												<span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
													Recent Rewards
												</span>
											</div>
											<div className="space-y-1.5">
												{mining.rewards_history.slice(0, 8).map((
													reward,
													index,
												) => (
													<motion.div
														key={reward.epoch}
														initial={{ opacity: 0, x: -10 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{ delay: index * 0.03 }}
														className="flex items-center justify-between p-1.5 bg-muted/50 rounded border border-border/50"
													>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-1.5 mb-0.5">
																<Badge
																	variant="outline"
																	className="text-[10px] font-mono px-1 py-0 h-4"
																>
																	E{reward.epoch}
																</Badge>
																<span className="text-[10px] text-muted-foreground">
																	{formatTimestamp(reward.timestamp)}
																</span>
															</div>
															<div className="flex items-center gap-2 text-[10px]">
																<div className="flex items-center gap-0.5">
																	<TrendingUp className="h-2.5 w-2.5 text-green-500" />
																	<span className="font-semibold text-foreground">
																		<FormattedNumber
																			value={reward.amount_sli}
																			decimals={4}
																			useGrouping={true}
																		/>{" "}
																		SLI
																	</span>
																</div>
																<div className="flex items-center gap-0.5">
																	<BarChart3 className="h-2.5 w-2.5 text-muted-foreground" />
																	<span className="text-muted-foreground">
																		{reward.operation_count}
																	</span>
																</div>
																<div className="flex items-center gap-0.5">
																	<Award className="h-2.5 w-2.5 text-amber-500" />
																	<span className="text-muted-foreground">
																		{reward.rating_score}
																	</span>
																</div>
															</div>
														</div>
													</motion.div>
												))}
											</div>
										</div>
									)}
							</TabsContent>
						)}
					</Tabs>
				</CardContent>
			</Card>
		</motion.div>
	);
}
