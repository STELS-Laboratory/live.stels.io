/**
 * Account List Component
 * Displays list of trading accounts
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Database, Loader2, Shield, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoredAccount } from "@/stores/modules/accounts.store";

interface AccountListProps {
	accounts: StoredAccount[];
	loading: boolean;
	mobile?: boolean;
	onAccountClick?: (account: StoredAccount) => void;
}

/**
 * Account List Component
 */
export function AccountList({
	accounts,
	loading,
	mobile = false,
	onAccountClick,
}: AccountListProps): React.ReactElement {
	const sortedAccounts = useMemo((): StoredAccount[] => {
		return [...accounts].sort((a, b) => {
			// Sort by status: active > learn > stopped
			const statusOrder = { active: 0, learn: 1, stopped: 2 };
			const aStatus = a.account.status || "active";
			const bStatus = b.account.status || "active";
			const statusDiff = (statusOrder[aStatus as keyof typeof statusOrder] ?? 3) -
				(statusOrder[bStatus as keyof typeof statusOrder] ?? 3);
			
			if (statusDiff !== 0) return statusDiff;
			
			// Then sort by exchange name
			return a.account.exchange.localeCompare(b.account.exchange);
		});
	}, [accounts]);

	// Determine if account has credentials (is owner vs viewer)
	const hasCredentials = (account: StoredAccount): boolean => {
		return !!(account.account.apiKey && account.account.secret);
	};

	// Get status badge variant
	const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
		switch (status) {
			case "active":
				return "default";
			case "learn":
				return "secondary";
			case "stopped":
				return "destructive";
			default:
				return "outline";
		}
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="w-5 h-5" />
						Accounts
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (sortedAccounts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="w-5 h-5" />
						Accounts
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
						<p className="text-sm">No trading accounts found</p>
						<p className="text-xs mt-1">Add an account to start trading</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={cn(mobile && "p-2")}>
			<CardHeader className={cn(mobile && "px-4 py-4")}>
				<CardTitle
					className={cn(
						"flex items-center gap-2",
						mobile && "text-base",
					)}
				>
					<Database className={cn(mobile ? "w-4 h-4" : "w-5 h-5")} />
					Accounts ({sortedAccounts.length})
				</CardTitle>
			</CardHeader>
			<CardContent className={cn(mobile && "px-4 pb-4")}>
				<div className={cn(mobile ? "space-y-2" : "space-y-3")}>
					{sortedAccounts.map((account, index) => {
						const isOwner = hasCredentials(account);
						const status = account.account.status || "active";

						return (
							<motion.div
								key={account.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.2,
									delay: index * 0.05,
									ease: [0.16, 1, 0.3, 1],
								}}
								onClick={() => onAccountClick?.(account)}
								className={cn(
									"flex items-center rounded border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer",
									mobile ? "gap-2 p-3" : "gap-4 p-4",
								)}
							>
								{/* Account Icon/Indicator */}
								<div
									className={cn(
										"rounded-full bg-muted flex items-center justify-center flex-shrink-0",
										mobile ? "w-10 h-10" : "w-12 h-12",
									)}
								>
									{isOwner
										 ? (
											<Shield
												className={cn(
													"text-foreground",
													mobile ? "w-5 h-5" : "w-6 h-6",
												)}
											/>
										)
										 : (
											<Eye
												className={cn(
													"text-muted-foreground",
													mobile ? "w-5 h-5" : "w-6 h-6",
												)}
											/>
										)}
								</div>

								{/* Account Info */}
								<div className="flex-1 min-w-0">
									<div
										className={cn(
											"flex items-center mb-1 gap-2 flex-wrap",
											mobile && "gap-1.5",
										)}
									>
										<span
											className={cn(
												"font-semibold text-foreground",
												mobile ? "text-sm" : "text-base",
											)}
										>
											{account.account.nid}
										</span>
										<Badge
											variant={getStatusBadgeVariant(status)}
											className={cn(
												"text-xs",
												mobile && "text-[10px] px-1.5 py-0",
											)}
										>
											{status}
										</Badge>
										{!isOwner && (
											<Badge
												variant="outline"
												className={cn(
													"text-xs",
													mobile && "text-[10px] px-1.5 py-0",
												)}
											>
												Viewer
											</Badge>
										)}
									</div>
									<div
										className={cn(
											"flex items-center gap-2 flex-wrap",
											mobile && "gap-1.5",
										)}
									>
										<span
											className={cn(
												"text-muted-foreground font-medium capitalize",
												mobile ? "text-xs" : "text-sm",
											)}
										>
											{account.account.exchange}
										</span>
										{account.account.connection && (
											<span
												className={cn(
													"text-xs text-muted-foreground",
													mobile && "text-[10px]",
												)}
											>
												• Connected
											</span>
										)}
									</div>
									{account.account.note && !mobile && (
										<p className="text-xs text-muted-foreground line-clamp-1 mt-1">
											{account.account.note}
										</p>
									)}
									{account.account.viewers && account.account.viewers.length > 0 && (
										<div className="mt-1.5">
											<span
												className={cn(
													"text-xs text-muted-foreground",
													mobile && "text-[10px]",
												)}
											>
												{account.account.viewers.length} viewer
												{account.account.viewers.length !== 1 ? "s" : ""}
											</span>
										</div>
									)}
								</div>
							</motion.div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

