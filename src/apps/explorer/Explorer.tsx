/**
 * Blockchain Explorer Component
 * Professional document-oriented design for public blockchain exploration
 */

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
	Search,
	Hash,
	Wallet,
	ArrowUpRight,
	ArrowDownLeft,
	Copy,
	Check,
	Loader2,
	AlertCircle,
	FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { usePublicTransaction } from "@/hooks/use_public_transaction";
import { usePublicTransactions } from "@/hooks/use_public_transactions";
import { usePublicAssetList } from "@/hooks/use_public_asset_list";
import { useMobile } from "@/hooks/use_mobile";
import { toast } from "@/stores";
import { PublicTransactionDetailsDialog } from "./components/public_transaction_details_dialog";
import type { PublicTransactionResult } from "@/hooks/use_public_transactions";

/**
 * Format transaction amount
 */
function formatAmount(amount: string, decimals: number = 6): string {
	const num = Number.parseFloat(amount);
	return num.toFixed(decimals);
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Blockchain Explorer Component
 */
export default function Explorer(): React.ReactElement {
	const mobile = useMobile();
	const [activeTab, setActiveTab] = useState<"transaction" | "address">("transaction");
	const [copiedField, setCopiedField] = useState<string | null>(null);
	
	// Search states
	const [txHash, setTxHash] = useState<string>("");
	const [address, setAddress] = useState<string>("");
	
	// Network/Node selection - determines API URL
	// Network parameter in API is always "testnet" regardless of selection
	const [nodeType, setNodeType] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("explorer_node") || "testnet";
		}
		return "testnet";
	});
	
	// Network parameter is always "testnet" as per API requirements
	const network = "testnet";
	
	// Update localStorage when node type changes
	const handleNodeTypeChange = (value: string): void => {
		setNodeType(value);
		if (typeof window !== "undefined") {
			localStorage.setItem("explorer_node", value);
		}
	};
	
	// Selected transaction for details dialog
	const [selectedTransaction, setSelectedTransaction] = useState<PublicTransactionResult | null>(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

	// Get asset list for token selection (public, no auth required)
	const { assets } = usePublicAssetList({
		network,
		nodeType,
	});

	// Create token map for quick lookup
	// Supports both formats: raw.genesis (session) and direct metadata (public API)
	const tokenMap = useMemo(() => {
		const map = new Map<string, { symbol: string; name: string; decimals: number }>();
		if (assets && assets.length > 0) {
			assets.forEach((asset) => {
				let tokenId: string | undefined;
				let symbol: string | undefined;
				let name: string | undefined;
				let decimals: number = 6;

				// Check if it's the full format with raw.genesis
				if (asset.raw?.genesis?.token) {
					tokenId = asset.raw.genesis.token.id;
					symbol = asset.raw.genesis.token.metadata.symbol;
					name = asset.raw.genesis.token.metadata.name;
					decimals = asset.raw.genesis.token.metadata.decimals || 6;
				}
				// Check if it's the simplified format from public API
				else if (asset.id && asset.metadata) {
					tokenId = asset.id;
					symbol = asset.metadata.symbol;
					name = asset.metadata.name;
					decimals = asset.metadata.decimals || 6;
				}

				if (tokenId && symbol) {
					map.set(tokenId.toLowerCase(), { symbol, name: name || symbol, decimals });

				}
			});

		}
		return map;
	}, [assets]);

	// Hooks for data fetching
	const {
		transaction: txResult,
		loading: txLoading,
		error: txError,
		hasSearched: txHasSearched,
		refetch: refetchTransaction,
	} = usePublicTransaction({
		tx_hash: txHash,
		network,
		nodeType,
	});

	const {
		transactions: addressTransactions,
		loading: transactionsLoading,
		error: transactionsError,
		total: transactionsTotal,
		hasSearched: transactionsHasSearched,
		refetch: refetchTransactions,
	} = usePublicTransactions({
		address: address,
		network,
		nodeType,
	});

	const handleCopy = async (text: string, field: string): Promise<void> => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
			toast.success("Copied!", `${field} copied to clipboard`);
		} catch {

			toast.error("Copy failed", "Failed to copy to clipboard");
		}
	};

	const handleSearchTransaction = (): void => {
		if (txHash.trim().length === 0) {
			toast.error("Invalid input", "Please enter a transaction hash");
			return;
		}
		refetchTransaction();
	};

	const handleSearchAddress = (): void => {
		if (address.trim().length === 0) {
			toast.error("Invalid input", "Please enter an address");
			return;
		}
		refetchTransactions();
	};

	const getStatusIcon = (status: string): React.ReactElement => {
		switch (status) {
			case "confirmed":
				return <Check className="size-4 text-green-500" />;
			case "pending":
				return <Loader2 className="size-4 text-amber-500 animate-spin" />;
			case "failed":
				return <AlertCircle className="size-4 text-red-500" />;
			default:
				return <AlertCircle className="size-4 text-muted-foreground" />;
		}
	};

	const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
		switch (status) {
			case "confirmed":
				return "default";
			case "pending":
				return "secondary";
			case "failed":
				return "destructive";
			default:
				return "outline";
		}
	};

	return (
		<div className="h-full w-full overflow-y-auto bg-background">
			<div className="container-responsive py-6 sm:py-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
					className="mb-8"
				>
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded bg-primary/10">
							<Search className="size-6 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl sm:text-4xl font-bold text-foreground">
								Blockchain Explorer
							</h1>
							<p className="text-muted-foreground text-sm sm:text-base mt-1">
								Search transactions, addresses, and balances on the Gliesereum network
							</p>
						</div>
					</div>
					
					{/* Network selector */}
					<div className="mt-4 flex items-center gap-2">
						<Label htmlFor="network" className="text-sm text-muted-foreground">
							Network:
						</Label>
						<select
							id="network"
							value={nodeType}
							onChange={(e) => handleNodeTypeChange(e.target.value)}
							className="px-3 py-1.5 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						>
							<option value="testnet">Testnet</option>
							<option value="local">Local</option>
						</select>
						{nodeType === "local" && (
							<span className="text-xs text-amber-500">
								(10.0.0.238:8088)
							</span>
						)}
					</div>
				</motion.div>

				{/* Search Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as typeof activeTab)}
					className="w-full"
				>
					<TabsList className="grid w-full grid-cols-2 mb-6">
						<TabsTrigger value="transaction" className="flex items-center gap-2">
							<Hash className="size-4" />
							Transaction
						</TabsTrigger>
						<TabsTrigger value="address" className="flex items-center gap-2">
							<Wallet className="size-4" />
							Address
						</TabsTrigger>
					</TabsList>

					{/* Transaction Search Tab */}
					<TabsContent value="transaction" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Hash className="size-5" />
									Search Transaction by Hash
								</CardTitle>
								<CardDescription>
									Enter a transaction hash to view detailed information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex gap-2">
									<Input
										placeholder="Enter transaction hash..."
										value={txHash}
										onChange={(e) => setTxHash(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleSearchTransaction();
											}
										}}
										className="font-mono text-sm"
									/>
									<Button
										onClick={handleSearchTransaction}
										disabled={txLoading || txHash.trim().length === 0}
									>
										{txLoading ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											<Search className="size-4" />
										)}
									</Button>
								</div>

								{txError && (
									<Alert variant="destructive">
										<AlertCircle className="size-4" />
										<AlertDescription>{txError}</AlertDescription>
									</Alert>
								)}

								{!txLoading && !txError && txHasSearched && !txResult && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
										className="text-center py-8"
									>
										<div className="flex flex-col items-center gap-3">
											<Hash className="size-12 text-muted-foreground/50" />
											<div>
												<p className="text-sm font-medium text-foreground">
													Transaction not found
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													No transaction found with this hash
												</p>
											</div>
										</div>
									</motion.div>
								)}

								{txResult && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
										className="space-y-4"
									>
										<Card className="bg-muted/50">
											<CardHeader>
												<div className="flex items-center justify-between">
													<CardTitle className="text-lg">Transaction Details</CardTitle>
													<Badge
														variant={getStatusBadgeVariant(txResult.status)}
														className="flex items-center gap-1"
													>
														{getStatusIcon(txResult.status)}
														{txResult.status}
													</Badge>
												</div>
											</CardHeader>
											<CardContent className="space-y-4">
												{/* Transaction Hash */}
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">Transaction Hash</Label>
													<div className="flex items-center gap-2">
														<code className="flex-1 font-mono text-sm bg-background px-3 py-2 rounded border border-border break-all">
															{txResult.tx_hash}
														</code>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleCopy(txResult.tx_hash, "tx_hash")}
														>
															{copiedField === "tx_hash" ? (
																<Check className="size-4" />
															) : (
																<Copy className="size-4" />
															)}
														</Button>
													</div>
												</div>

												{/* Amount */}
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">Amount</Label>
													<div className="text-2xl font-bold text-foreground">
														{formatAmount(txResult.transaction.amount, 6)}{" "}
														{tokenMap.get(txResult.transaction.token_id.toLowerCase())?.symbol ||
															txResult.transaction.currency ||
															"UNKNOWN"}
													</div>
												</div>

												{/* Addresses */}
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label className="text-sm text-muted-foreground">From</Label>
														<div className="flex items-center gap-2">
															<code className="flex-1 font-mono text-xs bg-background px-2 py-1.5 rounded border border-border break-all">
																{txResult.transaction.from}
															</code>
															<Button
																variant="ghost"
																size="sm"
																className="h-8 w-8 p-0"
																onClick={() => handleCopy(txResult.transaction.from, "from")}
															>
																{copiedField === "from" ? (
																	<Check className="size-3" />
																) : (
																	<Copy className="size-3" />
																)}
															</Button>
														</div>
													</div>
													<div className="space-y-2">
														<Label className="text-sm text-muted-foreground">To</Label>
														<div className="flex items-center gap-2">
															<code className="flex-1 font-mono text-xs bg-background px-2 py-1.5 rounded border border-border break-all">
																{txResult.transaction.to}
															</code>
															<Button
																variant="ghost"
																size="sm"
																className="h-8 w-8 p-0"
																onClick={() => handleCopy(txResult.transaction.to, "to")}
															>
																{copiedField === "to" ? (
																	<Check className="size-3" />
																) : (
																	<Copy className="size-3" />
																)}
															</Button>
														</div>
													</div>
												</div>

												{/* Timestamp */}
												<div className="space-y-2">
													<Label className="text-sm text-muted-foreground">Submitted</Label>
													<div className="text-sm text-foreground">
														{formatTimestamp(txResult.submitted_at)}
													</div>
												</div>

												{/* View Full Details Button */}
												<Button
													variant="outline"
													className="w-full"
													onClick={() => {
														setSelectedTransaction(txResult);
														setIsDetailsOpen(true);
													}}
												>
													<FileText className="size-4 mr-2" />
													View Full Details
												</Button>
											</CardContent>
										</Card>
									</motion.div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* Address Search Tab */}
					<TabsContent value="address" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Wallet className="size-5" />
									Search Transactions by Address
								</CardTitle>
								<CardDescription>
									Enter an address to view all transactions
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex gap-2">
									<Input
										placeholder="Enter address..."
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleSearchAddress();
											}
										}}
										className="font-mono text-sm"
									/>
									<Button
										onClick={handleSearchAddress}
										disabled={transactionsLoading || address.trim().length === 0}
									>
										{transactionsLoading ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											<Search className="size-4" />
										)}
									</Button>
								</div>

								{transactionsError && (
									<Alert variant="destructive">
										<AlertCircle className="size-4" />
										<AlertDescription>{transactionsError}</AlertDescription>
									</Alert>
								)}

								{!transactionsLoading && 
								 !transactionsError && 
								 transactionsHasSearched &&
								 addressTransactions.length === 0 && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
										className="text-center py-8"
									>
										<div className="flex flex-col items-center gap-3">
											<Wallet className="size-12 text-muted-foreground/50" />
											<div>
												<p className="text-sm font-medium text-foreground">
													No transactions found
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													This address has no transaction history
												</p>
											</div>
										</div>
									</motion.div>
								)}

								{addressTransactions.length > 0 && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
										className="space-y-3"
									>
										<div className="flex items-center justify-between">
											<p className="text-sm text-muted-foreground">
												Found {transactionsTotal} transaction{transactionsTotal !== 1 ? "s" : ""}
											</p>
										</div>

										{addressTransactions.map((tx, index) => {
											const isOutgoing = tx.transaction.from === address;
											const tokenInfo = tokenMap.get(tx.transaction.token_id.toLowerCase());

											return (
												<motion.div
													key={tx.tx_hash}
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{ duration: 0.3, delay: index * 0.05 }}
													onClick={() => {
														setSelectedTransaction(tx);
														setIsDetailsOpen(true);
													}}
													className="p-4 rounded border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
												>
													<div className="flex items-start gap-4">
														<div
															className={cn(
																"rounded-full p-2 flex-shrink-0",
																isOutgoing
																	? "bg-red-500/10 text-red-500"
																	: "bg-green-500/10 text-green-500",
															)}
														>
															{isOutgoing ? (
																<ArrowUpRight className="size-5" />
															) : (
																<ArrowDownLeft className="size-5" />
															)}
														</div>
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 mb-2 flex-wrap">
																<span className="font-semibold text-foreground">
																	{isOutgoing ? "Sent" : "Received"}
																</span>
																<span className="font-mono text-sm text-muted-foreground">
																	{formatAmount(tx.transaction.amount, 6)}{" "}
																	{tokenInfo?.symbol || tx.transaction.currency || "UNKNOWN"}
																</span>
																<Badge
																	variant={getStatusBadgeVariant(tx.status)}
																	className="text-xs"
																>
																	{tx.status}
																</Badge>
															</div>
															<div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
																<span className="font-mono">
																	{isOutgoing
																		? `To: ${tx.transaction.to.slice(0, 8)}...${tx.transaction.to.slice(-6)}`
																		: `From: ${tx.transaction.from.slice(0, 8)}...${tx.transaction.from.slice(-6)}`}
																</span>
																<span>•</span>
																<span>{formatTimestamp(tx.submitted_at)}</span>
															</div>
															<div className="mt-2">
																<code className="text-xs font-mono text-muted-foreground">
																	{tx.tx_hash.slice(0, 16)}...{tx.tx_hash.slice(-8)}
																</code>
															</div>
														</div>
													</div>
												</motion.div>
											);
										})}
									</motion.div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

				</Tabs>

				{/* Transaction Details Dialog - using public transaction type */}
				{selectedTransaction && (
					<PublicTransactionDetailsDialog
						open={isDetailsOpen}
						onOpenChange={setIsDetailsOpen}
						transaction={selectedTransaction}
						address={address}
						mobile={mobile}
						tokenMap={tokenMap}
					/>
				)}
			</div>
		</div>
	);
}
