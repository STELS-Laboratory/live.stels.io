import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowDownLeft,
	ArrowUpRight,
	CheckCircle2,
	Clock,
	Copy,
	XCircle,
	Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormattedNumber } from "@/components/ui/formatted-number";
import { cn } from "@/lib/utils";
import { useSonarTransactions } from "@/hooks/use-sonar-transactions";


/**
 * Format relative time (e.g., "2 seconds ago", "1 minute ago")
 */
function formatRelativeTime(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (seconds < 10) return "just now";
	if (seconds < 60) return `${seconds}s ago`;
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;

	const date = new Date(timestamp);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Truncate address for display
 */
function truncateAddress(
	address: string,
	start: number = 6,
	end: number = 4,
): string {
	if (address.length <= start + end) return address;
	return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Get status badge variant
 */
function getStatusVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "confirmed":
			return "default";
		case "failed":
			return "destructive";
		case "pending":
			return "secondary";
		default:
			return "outline";
	}
}

/**
 * Real-time transaction feed component
 * Displays new transactions from sonar with beautiful animations
 */
export function RealtimeTransactionFeed(): React.ReactElement {
	const { transactions, loading } = useSonarTransactions();
	const [seenHashes, setSeenHashes] = useState<Set<string>>(new Set());
	const [copiedHash, setCopiedHash] = useState<string | null>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	// Track new transactions for animation
	const newTransactions = useMemo(() => {
		return transactions.filter((tx) => !seenHashes.has(tx.tx_hash));
	}, [transactions, seenHashes]);

	// Update seen hashes when new transactions arrive
	useEffect(() => {
		if (newTransactions.length > 0) {
			setSeenHashes((prev) => {
				const updated = new Set(prev);
				newTransactions.forEach((tx) => updated.add(tx.tx_hash));
				return updated;
			});
		}
	}, [newTransactions]);

	// Auto-scroll to top when new transaction arrives
	useEffect(() => {
		if (newTransactions.length > 0 && scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				"[data-radix-scroll-area-viewport]",
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = 0;
			}
		}
	}, [newTransactions.length]);

	const handleCopyHash = async (hash: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(hash);
			setCopiedHash(hash);
			setTimeout(() => setCopiedHash(null), 2000);
		} catch {
			// Error handled silently
		}
	};

	if (loading && transactions.length === 0) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="size-5 text-amber-500" />
						Live Transactions
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-12 text-muted-foreground">
						<Clock className="size-6 animate-pulse mr-2" />
						Loading transactions...
					</div>
				</CardContent>
			</Card>
		);
	}

	if (transactions.length === 0) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="size-5 text-amber-500" />
						Live Transactions
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-12 text-muted-foreground">
						<Clock className="size-6 mr-2" />
						No transactions yet
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Zap className="size-5 text-amber-500 animate-pulse" />
					Live Transactions
					{newTransactions.length > 0 && (
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							className="ml-2"
						>
							<Badge variant="default" className="bg-amber-500 text-white">
								{newTransactions.length} new
							</Badge>
						</motion.div>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[600px]" ref={scrollAreaRef}>
					<div className="space-y-3 pr-4">
						<AnimatePresence mode="popLayout">
							{transactions.slice(0, 50).map((tx, index) => {
								const isNew = newTransactions.some((nt) =>
									nt.tx_hash === tx.tx_hash
								);
								const isConfirmed = tx.status === "confirmed";
								const isFailed = tx.status === "failed";

								return (
									<motion.div
										key={tx.tx_hash}
										initial={isNew
											? { opacity: 0, y: -20, scale: 0.95 }
											: { opacity: 1 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, scale: 0.95 }}
										transition={{
											duration: 0.3,
											delay: isNew ? index * 0.05 : 0,
											ease: [0.16, 1, 0.3, 1],
										}}
										className={cn(
											"relative rounded-lg border bg-card p-4 transition-all",
											isNew && "ring-2 ring-amber-500/50 shadow-lg",
											"hover:bg-muted/50",
										)}
									>
										{/* New transaction indicator */}
										{isNew && (
											<motion.div
												initial={{ width: 0 }}
												animate={{ width: 4 }}
												className="absolute left-0 top-0 bottom-0 bg-amber-500 rounded-l-lg"
											/>
										)}

										<div className="flex items-start gap-4">
											{/* Status Icon */}
											<motion.div
												initial={isNew
													? { scale: 0, rotate: -180 }
													: { scale: 1 }}
												animate={{ scale: 1, rotate: 0 }}
												transition={{ delay: isNew ? 0.2 : 0, type: "spring" }}
												className={cn(
													"rounded-full p-2.5 flex-shrink-0",
													isConfirmed && "bg-green-500/10 text-green-500",
													isFailed && "bg-red-500/10 text-red-500",
													!isConfirmed && !isFailed &&
														"bg-amber-500/10 text-amber-500",
												)}
											>
												{isConfirmed
													? <CheckCircle2 className="size-5" />
													: isFailed
													? <XCircle className="size-5" />
													: <Clock className="size-5" />}
											</motion.div>

											{/* Transaction Details */}
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-2 flex-wrap">
													<span className="font-semibold text-foreground flex items-baseline gap-1">
														<FormattedNumber
															value={tx.amount}
															decimals={8}
															useGrouping={true}
														/>
														<span>{tx.currency}</span>
													</span>
													<Badge
														variant={getStatusVariant(tx.status)}
														className="text-xs"
													>
														{tx.status}
													</Badge>
													{isNew && (
														<motion.span
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															className="text-xs text-amber-500 font-medium"
														>
															NEW
														</motion.span>
													)}
												</div>

												{/* Addresses */}
												<div className="flex items-center gap-3 mb-2 text-sm text-muted-foreground">
													<div className="flex items-center gap-1.5">
														<ArrowUpRight className="size-3.5" />
														<span className="font-mono">
															{truncateAddress(tx.from)}
														</span>
													</div>
													<span>→</span>
													<div className="flex items-center gap-1.5">
														<ArrowDownLeft className="size-3.5" />
														<span className="font-mono">
															{truncateAddress(tx.to)}
														</span>
													</div>
												</div>

												{/* Hash and Time */}
												<div className="flex items-center justify-between gap-2 flex-wrap">
													<div className="flex items-center gap-2">
														<code className="text-xs font-mono text-muted-foreground">
															{truncateAddress(tx.tx_hash, 8, 8)}
														</code>
														<Button
															variant="ghost"
															size="sm"
															className="h-6 w-6 p-0"
															onClick={() => handleCopyHash(tx.tx_hash)}
														>
															{copiedHash === tx.tx_hash
																? (
																	<CheckCircle2 className="size-3.5 text-green-500" />
																)
																: <Copy className="size-3.5" />}
														</Button>
													</div>
													<span className="text-xs text-muted-foreground">
														{formatRelativeTime(tx.received_at)}
													</span>
												</div>
											</div>
										</div>

										{/* Pulse animation for new transactions */}
										{isNew && (
											<motion.div
												initial={{ opacity: 0.5 }}
												animate={{ opacity: [0.5, 1, 0.5] }}
												transition={{
													duration: 2,
													repeat: Infinity,
													ease: "easeInOut",
												}}
												className="absolute inset-0 rounded-lg bg-amber-500/5 pointer-events-none"
											/>
										)}
									</motion.div>
								);
							})}
						</AnimatePresence>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
