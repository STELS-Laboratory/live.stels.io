/**
 * Account Details Dialog Component
 * Displays comprehensive account information including balances, protocol, and settings
 */

import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Database,
	Shield,
	Eye,
	Key,
	Wallet,
	TrendingUp,
	Copy,
	Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoredAccount } from "@/stores/modules/accounts.store";
import { Button } from "@/components/ui/button";

interface AccountDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	account: StoredAccount | null;
	mobile?: boolean;
}

interface CoinBalance {
	coin: string;
	free?: number;
	used?: number;
	total?: number;
	debt?: number;
	equity?: string;
	walletBalance?: string;
	usdValue?: string;
}

/**
 * Account Details Dialog Component
 */
export function AccountDetailsDialog({
	open,
	onOpenChange,
	account,
	mobile = false,
}: AccountDetailsDialogProps): React.ReactElement {
	const [copiedField, setCopiedField] = React.useState<string | null>(null);

	if (!account) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Account Details</DialogTitle>
						<DialogDescription>No account selected</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		);
	}

	const rawData = account.rawData;
	const hasCredentials = !!(account.account.apiKey && account.account.secret);
	const isOwner = hasCredentials;

	// Get coin balances from raw data
	const getCoinBalances = (): CoinBalance[] => {
		if (!rawData?.wallet) return [];

		const balances: CoinBalance[] = [];
		const wallet = rawData.wallet;

		// Check if wallet has direct coin properties (BTC, SOL, ETH, etc.)
		Object.keys(wallet).forEach((key) => {
			if (
				key !== "info" &&
				key !== "timestamp" &&
				key !== "datetime" &&
				key !== "free" &&
				key !== "used" &&
				key !== "total" &&
				key !== "debt" &&
				typeof wallet[key] === "object" &&
				wallet[key] !== null &&
				"free" in wallet[key]
			) {
				const coinData = wallet[key] as {
					free?: number;
					used?: number;
					total?: number;
					debt?: number;
				};
				balances.push({
					coin: key,
					free: coinData.free,
					used: coinData.used,
					total: coinData.total,
					debt: coinData.debt,
				});
			}
		});

		// Also check info.result.list[0].coin array
		if (
			wallet.info?.result?.list?.[0]?.coin &&
			Array.isArray(wallet.info.result.list[0].coin)
		) {
			wallet.info.result.list[0].coin.forEach((coin: unknown) => {
				if (
					typeof coin === "object" &&
					coin !== null &&
					"coin" in coin &&
					typeof coin.coin === "string"
				) {
					const coinInfo = coin as {
						coin: string;
						equity?: string;
						walletBalance?: string;
						usdValue?: string;
						[customKey: string]: unknown;
					};

					// Find or update existing balance
					const existingIndex = balances.findIndex(
						(b) => b.coin === coinInfo.coin,
					);
					if (existingIndex >= 0) {
						balances[existingIndex] = {
							...balances[existingIndex],
							equity: coinInfo.equity,
							walletBalance: coinInfo.walletBalance,
							usdValue: coinInfo.usdValue,
						};
					} else {
						balances.push({
							coin: coinInfo.coin,
							equity: coinInfo.equity,
							walletBalance: coinInfo.walletBalance,
							usdValue: coinInfo.usdValue,
						});
					}
				}
			});
		}

		return balances.sort((a, b) => a.coin.localeCompare(b.coin));
	};

	const coinBalances = getCoinBalances();

	// Get account type
	const accountType =
		rawData?.wallet?.info?.result?.list?.[0]?.accountType || "Unknown";

	// Get total equity
	const totalEquity =
		rawData?.wallet?.info?.result?.list?.[0]?.totalEquity || null;
	const totalWalletBalance =
		rawData?.wallet?.info?.result?.list?.[0]?.totalWalletBalance || null;

	const handleCopy = async (text: string, field: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const getStatusBadgeVariant = (
		status: string,
	): "default" | "secondary" | "destructive" | "outline" => {
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"max-w-4xl max-h-[90vh] overflow-y-auto",
					mobile && "max-w-[calc(100vw-2rem)]",
				)}
			>
				<DialogHeader>
					<div className="flex items-center gap-3">
						{isOwner
							 ? <Shield className="size-6 text-foreground" />
							 : <Eye className="size-6 text-muted-foreground" />}
						<div className="flex-1">
							<DialogTitle className="flex items-center gap-2 flex-wrap">
								{account.account.nid}
								<Badge variant={getStatusBadgeVariant(account.account.status || "active")}>
									{account.account.status || "active"}
								</Badge>
								{!isOwner && <Badge variant="outline">Viewer</Badge>}
							</DialogTitle>
							<DialogDescription className="mt-1">
								{account.account.exchange.toUpperCase()} Trading Account
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6 mt-4">
					{/* Basic Information */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Database className="size-4" />
								Basic Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="text-xs text-muted-foreground">Account ID (nid)</label>
									<div className="flex items-center gap-2 mt-1">
										<span className="text-sm font-mono">{account.account.nid}</span>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0"
											onClick={() => handleCopy(account.account.nid, "nid")}
										>
											{copiedField === "nid"
												 ? <Check className="size-3" />
												 : <Copy className="size-3" />}
										</Button>
									</div>
								</div>
								<div>
									<label className="text-xs text-muted-foreground">Exchange</label>
									<p className="text-sm font-medium capitalize mt-1">
										{account.account.exchange}
									</p>
								</div>
								<div>
									<label className="text-xs text-muted-foreground">Wallet Address</label>
									<div className="flex items-center gap-2 mt-1">
										<span className="text-sm font-mono truncate">{account.address}</span>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0"
											onClick={() => handleCopy(account.address, "address")}
										>
											{copiedField === "address"
												 ? <Check className="size-3" />
												 : <Copy className="size-3" />}
										</Button>
									</div>
								</div>
								<div>
									<label className="text-xs text-muted-foreground">Connection</label>
									<p className="text-sm mt-1">
										{account.account.connection
											 ? <Badge variant="default">Connected</Badge>
											 : <Badge variant="outline">Disconnected</Badge>}
									</p>
								</div>
								{account.account.note && (
									<div className="sm:col-span-2">
										<label className="text-xs text-muted-foreground">Note</label>
										<p className="text-sm mt-1">{account.account.note}</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Balance Information */}
					{rawData?.wallet && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Wallet className="size-4" />
									Balance Information
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									{accountType && (
										<div>
											<label className="text-xs text-muted-foreground">Account Type</label>
											<p className="text-sm font-medium mt-1">{accountType}</p>
										</div>
									)}
									{totalEquity && (
										<div>
											<label className="text-xs text-muted-foreground">Total Equity</label>
											<p className="text-sm font-semibold mt-1">
												{Number.parseFloat(totalEquity).toLocaleString(undefined, {
													minimumFractionDigits: 2,
													maximumFractionDigits: 8,
												})}
											</p>
										</div>
									)}
									{totalWalletBalance && (
										<div>
											<label className="text-xs text-muted-foreground">
												Total Wallet Balance
											</label>
											<p className="text-sm font-semibold mt-1">
												{Number.parseFloat(totalWalletBalance).toLocaleString(undefined, {
													minimumFractionDigits: 2,
													maximumFractionDigits: 8,
												})}
											</p>
										</div>
									)}
								</div>

								{coinBalances.length > 0 && (
									<div className="mt-4">
										<label className="text-xs text-muted-foreground mb-2 block">
											Coin Balances
										</label>
										<div className="space-y-2">
											{coinBalances.map((balance) => (
												<div
													key={balance.coin}
													className="flex items-center justify-between p-2 rounded border bg-muted/30"
												>
													<div className="flex items-center gap-2">
														<span className="font-semibold text-sm">{balance.coin}</span>
													</div>
													<div className="flex items-center gap-4 text-xs text-muted-foreground">
														{balance.total !== undefined && (
															<span>
																Total:{" "}
																<span className="font-medium text-foreground">
																	{balance.total.toLocaleString(undefined, {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 8,
																	})}
																</span>
															</span>
														)}
														{balance.free !== undefined && (
															<span>
																Free:{" "}
																<span className="font-medium text-foreground">
																	{balance.free.toLocaleString(undefined, {
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 8,
																	})}
																</span>
															</span>
														)}
														{balance.usdValue && (
															<span className="text-foreground">
																${Number.parseFloat(balance.usdValue).toLocaleString(undefined, {
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																})}
															</span>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Protocol Settings */}
					{account.account.protocol && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<TrendingUp className="size-4" />
									Trading Protocol
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label className="text-xs text-muted-foreground">Strategy</label>
										<p className="text-sm font-medium mt-1">
											{account.account.protocol.strategy}
										</p>
									</div>
									<div>
										<label className="text-xs text-muted-foreground">Trading Style</label>
										<p className="text-sm mt-1">
											{account.account.protocol.tradingStyle}
										</p>
									</div>
									<div>
										<label className="text-xs text-muted-foreground">
											Max Risk Per Trade (%)
										</label>
										<p className="text-sm mt-1">
											{account.account.protocol.maxRiskPerTrade}
										</p>
									</div>
									<div>
										<label className="text-xs text-muted-foreground">Max Leverage</label>
										<p className="text-sm mt-1">
											{account.account.protocol.maxLeverage}x
										</p>
									</div>
									<div>
										<label className="text-xs text-muted-foreground">Stop Loss (%)</label>
										<p className="text-sm mt-1">{account.account.protocol.stopLoss}</p>
									</div>
									<div>
										<label className="text-xs text-muted-foreground">Take Profit (%)</label>
										<p className="text-sm mt-1">{account.account.protocol.takeProfit}</p>
									</div>
									{account.account.protocol.markets && account.account.protocol.markets.length > 0 && (
										<div className="sm:col-span-2">
											<label className="text-xs text-muted-foreground">Markets</label>
											<div className="flex flex-wrap gap-2 mt-1">
												{account.account.protocol.markets.map((market) => (
													<Badge key={market} variant="secondary">
														{market}
													</Badge>
												))}
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Security Information */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<Key className="size-4" />
								Security & Metadata
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{account.publicKey && (
									<div>
										<label className="text-xs text-muted-foreground">Public Key</label>
										<div className="flex items-center gap-2 mt-1">
											<span className="text-xs font-mono truncate">
												{account.publicKey}
											</span>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0"
												onClick={() => handleCopy(account.publicKey, "publicKey")}
											>
												{copiedField === "publicKey"
													 ? <Check className="size-3" />
													 : <Copy className="size-3" />}
											</Button>
										</div>
									</div>
								)}
								{account.signature && (
									<div>
										<label className="text-xs text-muted-foreground">Signature</label>
										<div className="flex items-center gap-2 mt-1">
											<span className="text-xs font-mono truncate">
												{account.signature}
											</span>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0"
												onClick={() => handleCopy(account.signature, "signature")}
											>
												{copiedField === "signature"
													 ? <Check className="size-3" />
													 : <Copy className="size-3" />}
											</Button>
										</div>
									</div>
								)}
								{account.account.workers && account.account.workers.length > 0 && (
									<div>
										<label className="text-xs text-muted-foreground">Workers</label>
										<div className="flex flex-wrap gap-2 mt-1">
											{account.account.workers.map((worker) => (
												<Badge key={worker} variant="outline">
													{worker}
												</Badge>
											))}
										</div>
									</div>
								)}
								{account.account.viewers && account.account.viewers.length > 0 && (
									<div>
										<label className="text-xs text-muted-foreground">Viewers</label>
										<div className="flex flex-wrap gap-2 mt-1">
											{account.account.viewers.map((viewer) => (
												<Badge key={viewer} variant="outline" className="font-mono text-xs">
													{viewer.slice(0, 8)}...
												</Badge>
											))}
										</div>
									</div>
								)}
								{account.createdAt && (
									<div>
										<label className="text-xs text-muted-foreground">Created</label>
										<p className="text-sm mt-1">
											{new Date(account.createdAt).toLocaleString()}
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);
}

