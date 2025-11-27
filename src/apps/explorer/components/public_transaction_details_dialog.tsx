/**
 * Public Transaction Details Dialog Component
 * Displays comprehensive transaction information (public version)
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
import { Button } from "@/components/ui/button";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Check,
	CheckCircle2,
	Clock,
	Copy,
	XCircle,
	Hash,
	Calendar,
	Wallet,
	Coins,
	FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicTransactionResult } from "@/hooks/use_public_transactions";
import { toast } from "@/stores";

interface PublicTransactionDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: PublicTransactionResult | null;
	address: string;
	mobile?: boolean;
	tokenMap: Map<string, { symbol: string; name: string; decimals: number }>;
}

/**
 * Format transaction amount with decimals
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
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

/**
 * Format date only
 */
function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

/**
 * Public Transaction Details Dialog Component
 */
export function PublicTransactionDetailsDialog({
	open,
	onOpenChange,
	transaction,
	address,
	mobile = false,
	tokenMap,
}: PublicTransactionDetailsDialogProps): React.ReactElement {
	const [copiedField, setCopiedField] = React.useState<string | null>(null);

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

	if (!transaction) {
		return <></>;
	}

	const tx = transaction.transaction;
	const isOutgoing = tx.from === address;
	const tokenInfo = tokenMap.get(tx.token_id.toLowerCase());
	const tokenSymbol = tokenInfo?.symbol || tx.currency || "UNKNOWN";

	const getStatusIcon = (): React.ReactElement => {
		switch (transaction.status) {
			case "confirmed":
				return <CheckCircle2 className="size-5 text-green-500" />;
			case "pending":
				return <Clock className="size-5 text-amber-500" />;
			case "failed":
				return <XCircle className="size-5 text-red-500" />;
			default:
				return <Clock className="size-5 text-muted-foreground" />;
		}
	};

	const getStatusBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
		switch (transaction.status) {
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					"max-w-3xl max-h-[90vh] overflow-y-auto",
					mobile && "max-w-[calc(100vw-2rem)]",
				)}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{isOutgoing ? (
							<ArrowUpRight className="size-5 text-red-500" />
						) : (
							<ArrowDownLeft className="size-5 text-green-500" />
						)}
						Transaction Details
					</DialogTitle>
					<DialogDescription>
						Complete information about this transaction
					</DialogDescription>
				</DialogHeader>

				<div className={cn("space-y-4", mobile && "space-y-3")}>
					{/* Status Badge */}
					<div className="flex items-center gap-2">
						<Badge
							variant={getStatusBadgeVariant()}
							className="text-sm flex items-center gap-2 px-3 py-1.5"
						>
							{getStatusIcon()}
							{transaction.status.toUpperCase()}
						</Badge>
						<span className="text-sm text-muted-foreground">
							{isOutgoing ? "Outgoing" : "Incoming"} Transaction
						</span>
					</div>

					{/* Amount */}
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Coins className="size-4" />
							<span>Amount</span>
						</div>
						<div className="pl-6">
							<div className="text-2xl font-bold text-foreground">
								{formatAmount(tx.amount, tokenInfo?.decimals || 6)} {tokenSymbol}
							</div>
							{tx.fee && (
								<div className="text-sm text-muted-foreground mt-1">
									Fee: {formatAmount(tx.fee, tokenInfo?.decimals || 6)} {tokenSymbol}
								</div>
							)}
						</div>
					</div>

					{/* Addresses */}
					<div className="space-y-3">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Wallet className="size-4" />
								<span>{isOutgoing ? "Recipient" : "Sender"}</span>
							</div>
							<div className="pl-6 flex items-center gap-2">
								<code className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded border border-border break-all">
									{isOutgoing ? tx.to : tx.from}
								</code>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
									onClick={() =>
										handleCopy(isOutgoing ? tx.to : tx.from, "address")
									}
								>
									{copiedField === "address" ? (
										<Check className="size-4" />
									) : (
										<Copy className="size-4" />
									)}
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Wallet className="size-4" />
								<span>{isOutgoing ? "Sender" : "Recipient"}</span>
							</div>
							<div className="pl-6 flex items-center gap-2">
								<code className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded border border-border break-all">
									{isOutgoing ? tx.from : tx.to}
								</code>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0"
									onClick={() =>
										handleCopy(isOutgoing ? tx.from : tx.to, "address2")
									}
								>
									{copiedField === "address2" ? (
										<Check className="size-4" />
									) : (
										<Copy className="size-4" />
									)}
								</Button>
							</div>
						</div>
					</div>

					{/* Transaction Hash */}
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Hash className="size-4" />
							<span>Transaction Hash</span>
						</div>
						<div className="pl-6 flex items-center gap-2">
							<code className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded border border-border break-all">
								{transaction.tx_hash}
							</code>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={() => handleCopy(transaction.tx_hash, "hash")}
							>
								{copiedField === "hash" ? (
									<Check className="size-4" />
								) : (
									<Copy className="size-4" />
								)}
							</Button>
						</div>
					</div>

					{/* Timestamps */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Calendar className="size-4" />
								<span>Submitted</span>
							</div>
							<div className="pl-6 text-sm text-foreground">
								{formatTimestamp(transaction.submitted_at)}
							</div>
							<div className="pl-6 text-xs text-muted-foreground">
								{formatDate(transaction.submitted_at)}
							</div>
						</div>
						{tx.timestamp && (
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Calendar className="size-4" />
									<span>Transaction Time</span>
								</div>
								<div className="pl-6 text-sm text-foreground">
									{formatTimestamp(tx.timestamp)}
								</div>
								<div className="pl-6 text-xs text-muted-foreground">
									{formatDate(tx.timestamp)}
								</div>
							</div>
						)}
					</div>

					{/* Memo */}
					{tx.memo && (
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<FileText className="size-4" />
								<span>Memo</span>
							</div>
							<div className="pl-6">
								<p className="text-sm text-foreground bg-muted px-3 py-2 rounded border border-border break-words">
									{tx.memo}
								</p>
							</div>
						</div>
					)}

					{/* Transaction Details */}
					<div className="space-y-3 pt-2 border-t border-border">
						<h3 className="text-sm font-semibold text-foreground">
							Transaction Information
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">Token ID</div>
								<div className="flex items-center gap-2">
									<code className="flex-1 font-mono text-xs bg-muted px-2 py-1 rounded border border-border break-all">
										{tx.token_id}
									</code>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 w-7 p-0"
										onClick={() => handleCopy(tx.token_id, "token_id")}
									>
										{copiedField === "token_id" ? (
											<Check className="size-3" />
										) : (
											<Copy className="size-3" />
										)}
									</Button>
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">Network</div>
								<div className="text-sm text-foreground">
									{tx.network.id} (Chain ID: {tx.network.chain_id})
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">Version</div>
								<div className="text-sm text-foreground">{tx.version}</div>
							</div>
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">Type</div>
								<div className="text-sm text-foreground">{tx.type}</div>
							</div>
							{tx.prev_hash && (
								<div className="space-y-1 sm:col-span-2">
									<div className="text-xs text-muted-foreground">
										Previous Hash
									</div>
									<div className="flex items-center gap-2">
										<code className="flex-1 font-mono text-xs bg-muted px-2 py-1 rounded border border-border break-all">
											{tx.prev_hash}
										</code>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0"
											onClick={() => handleCopy(tx.prev_hash!, "prev_hash")}
										>
											{copiedField === "prev_hash" ? (
												<Check className="size-3" />
											) : (
												<Copy className="size-3" />
											)}
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Signatures */}
					{tx.signatures && tx.signatures.length > 0 && (
						<div className="space-y-3 pt-2 border-t border-border">
							<h3 className="text-sm font-semibold text-foreground">
								Signatures ({tx.signatures.length})
							</h3>
							<div className="space-y-2">
								{tx.signatures.map((sig, index) => (
									<div
										key={index}
										className="space-y-1 bg-muted/50 px-3 py-2 rounded border border-border"
									>
										<div className="flex items-center justify-between">
											<div className="text-xs text-muted-foreground">
												Signature {index + 1}
											</div>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0"
												onClick={() =>
													handleCopy(sig.sig, `signature_${index}`)
												}
											>
												{copiedField === `signature_${index}` ? (
													<Check className="size-3" />
												) : (
													<Copy className="size-3" />
												)}
											</Button>
										</div>
										<div className="space-y-1">
											<div className="text-xs text-muted-foreground">
												Key ID: <code className="font-mono">{sig.kid}</code>
											</div>
											<div className="text-xs text-muted-foreground">
												Algorithm: <code className="font-mono">{sig.alg}</code>
											</div>
											<code className="block text-xs font-mono bg-background px-2 py-1 rounded border border-border break-all">
												{sig.sig}
											</code>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Pool Keys */}
					{transaction.pool_key && transaction.pool_key.length > 0 && (
						<div className="space-y-3 pt-2 border-t border-border">
							<h3 className="text-sm font-semibold text-foreground">
								Pool Keys ({transaction.pool_key.length})
							</h3>
							<div className="space-y-2">
								{transaction.pool_key.map((key, index) => (
									<div
										key={index}
										className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded border border-border"
									>
										<code className="flex-1 font-mono text-xs break-all">
											{key}
										</code>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0"
											onClick={() => handleCopy(key, `pool_key_${index}`)}
										>
											{copiedField === `pool_key_${index}` ? (
												<Check className="size-3" />
											) : (
												<Copy className="size-3" />
											)}
										</Button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
