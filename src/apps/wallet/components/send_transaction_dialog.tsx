/**
 * Send Transaction Dialog Component
 * Form for creating and submitting asset transfer transactions
 */

import React, { useState, useCallback, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Send, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useCreateTransaction } from "@/hooks/use_create_transaction";
import { useAssetList } from "@/hooks/use_asset_list";
import { useAssetBalance } from "@/hooks/use_asset_balance";
import { validateAddress } from "@/lib/gliesereum";
import type { TokenGenesisDocument } from "@/hooks/use_create_transaction";
import { cn } from "@/lib/utils";

interface SendTransactionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mobile?: boolean;
	onTransactionSent?: () => void;
}

interface FormErrors {
	to?: string;
	amount?: string;
	token?: string;
	fee?: string;
}

/**
 * Send Transaction Dialog Component
 */
export function SendTransactionDialog({
	open,
	onOpenChange,
	mobile = false,
	onTransactionSent,
}: SendTransactionDialogProps): React.ReactElement {
	const { wallet, connectionSession } = useAuthStore();
	const { createTransaction, submitTransaction, submitting, error } =
		useCreateTransaction();
	const { assets } = useAssetList();

	// Form state - must be declared before useAssetBalance hook
	const [selectedTokenId, setSelectedTokenId] = useState<string>("");
	const [to, setTo] = useState<string>("");
	const [amount, setAmount] = useState<string>("");
	const [memo, setMemo] = useState<string>("");
	const [errors, setErrors] = useState<FormErrors>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	// Check balance for selected token - refetch after transaction
	const {
		balance: currentBalance,
		loading: balanceLoading,
		refetch: refetchBalance,
	} = useAssetBalance({
		address: wallet?.address || "",
		token_id: selectedTokenId,
		network: connectionSession?.network,
	});

	// Get selected token genesis
	const selectedToken = useMemo(() => {
		if (!selectedTokenId || !assets) return null;
		return assets.find((asset) => asset.raw.genesis.token.id === selectedTokenId);
	}, [selectedTokenId, assets]);

	const tokenGenesis: TokenGenesisDocument | null = useMemo(() => {
		if (!selectedToken) return null;
		return selectedToken.raw.genesis as unknown as TokenGenesisDocument;
	}, [selectedToken]);

	// Calculate fee based on transaction size
	const calculatedFee = useMemo((): string => {
		if (!tokenGenesis) return "0.000100";
		const baseFee = tokenGenesis.parameters.fees.base;
		const perByteFee = tokenGenesis.parameters.fees.per_byte;

		// Estimate transaction size
		const estimatedSize = JSON.stringify({
			type: "asset.transfer",
			to,
			amount,
			memo,
		}).length;

		const base = Number.parseFloat(baseFee);
		const perByte = Number.parseFloat(perByteFee);
		const totalFee = base + estimatedSize * perByte;

		return totalFee.toFixed(6);
	}, [tokenGenesis, to, amount, memo]);

	/**
	 * Validate form
	 */
	const validateForm = useCallback((): boolean => {
		const newErrors: FormErrors = {};

		if (!selectedTokenId) {
			newErrors.token = "Please select a token";
		}

		if (!to.trim()) {
			newErrors.to = "Recipient address is required";
		} else if (!validateAddress(to.trim())) {
			newErrors.to = "Invalid recipient address";
		}

		if (!amount.trim()) {
			newErrors.amount = "Amount is required";
		} else {
			const decimals = tokenGenesis?.token.metadata.decimals || 6;
			const amountRegex = new RegExp(`^\\d+\\.\\d{1,${decimals}}$`);
			if (!amountRegex.test(amount.trim())) {
				newErrors.amount = `Invalid amount format (must match ${decimals} decimals)`;
			} else {
				const amountNum = Number.parseFloat(amount.trim());
				if (amountNum <= 0) {
					newErrors.amount = "Amount must be greater than 0";
				}
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [selectedTokenId, to, amount, tokenGenesis]);

	/**
	 * Reset form
	 */
	const resetForm = useCallback((): void => {
		setSelectedTokenId("");
		setTo("");
		setAmount("");
		setMemo("");
		setErrors({});
		setSubmitError(null);
	}, []);

	/**
	 * Handle form submission
	 */
	const handleSubmit = useCallback(
		async (e: React.FormEvent): Promise<void> => {
			e.preventDefault();

			if (!wallet || !tokenGenesis || !connectionSession) {
				setSubmitError("Wallet or token not available");
				return;
			}

			if (!validateForm()) {
				return;
			}

			// Check balance before transfer
			if (currentBalance) {
				const balanceNum = Number.parseFloat(currentBalance.balance);
				const amountNum = Number.parseFloat(amount.trim());
				const feeNum = Number.parseFloat(calculatedFee);
				const required = amountNum + feeNum;

				if (balanceNum < required) {
					setSubmitError(
						`Insufficient balance. Required: ${required.toFixed(
							currentBalance.decimals,
						)} ${currentBalance.currency}, Available: ${currentBalance.balance} ${currentBalance.currency}`,
					);
					return;
				}
			}

			setSubmitError(null);

			try {
				// Create transaction (prevHash will be null for now, can be fetched separately if needed)
				const transaction = createTransaction({
					wallet,
					tokenGenesis,
					to: to.trim(),
					amount: amount.trim(),
					fee: calculatedFee,
					prevHash: null,
					memo: memo.trim() || undefined,
				});

				// Submit transaction
				const result = await submitTransaction(transaction);

				console.log("[SendTransaction] Transaction submitted:", result.tx_hash);

				// Refresh balance after successful transaction
				if (selectedTokenId) {
					await refetchBalance();
				}

				// Notify parent component
				onTransactionSent?.();

				// Reset form and close
				resetForm();
				onOpenChange(false);
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to send transaction";
				setSubmitError(errorMessage);
				console.error("[SendTransaction] Error:", err);
			}
		},
		[
			wallet,
			tokenGenesis,
			connectionSession,
			validateForm,
			to,
			amount,
			calculatedFee,
			memo,
			selectedTokenId,
			currentBalance,
			refetchBalance,
			createTransaction,
			submitTransaction,
			resetForm,
			onOpenChange,
		],
	);

	/**
	 * Handle dialog close
	 */
	const handleClose = useCallback((): void => {
		if (!submitting) {
			resetForm();
			onOpenChange(false);
		}
	}, [submitting, resetForm, onOpenChange]);

	if (!wallet || !connectionSession) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cannot Send Transaction</DialogTitle>
						<DialogDescription>
							{!wallet
								? "Wallet not found. Please create or import a wallet first."
								: "Not connected to network. Please connect to a network first."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={handleClose}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent
				className={cn(
					"max-w-2xl max-h-[90vh] overflow-y-auto",
					mobile && "max-w-[calc(100vw-2rem)]",
				)}
			>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Send className="size-5" />
						Send Transaction
					</DialogTitle>
					<DialogDescription>
						Create and submit an asset transfer transaction
					</DialogDescription>
				</DialogHeader>

				{(error || submitError) && (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>{error || submitError}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Token Selection */}
					<div className="space-y-2">
						<Label htmlFor="token">
							Token <span className="text-destructive">*</span>
						</Label>
						<Select
							value={selectedTokenId}
							onValueChange={setSelectedTokenId}
							disabled={submitting}
						>
							<SelectTrigger
								id="token"
								aria-invalid={errors.token ? "true" : "false"}
							>
								<SelectValue placeholder="Select token" />
							</SelectTrigger>
							<SelectContent>
								{assets?.map((asset) => (
									<SelectItem
										key={asset.raw.genesis.token.id}
										value={asset.raw.genesis.token.id}
									>
										{asset.raw.genesis.token.metadata.name} (
										{asset.raw.genesis.token.metadata.symbol})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.token && (
							<p className="text-xs text-destructive">{errors.token}</p>
						)}
					</div>

					{/* Recipient Address */}
					<div className="space-y-2">
						<Label htmlFor="to">
							Recipient Address <span className="text-destructive">*</span>
						</Label>
						<Input
							id="to"
							value={to}
							onChange={(e) => setTo(e.target.value)}
							placeholder="gYjDnckjrKCw3CYVerH1LMbgTWv3dmg6Hu"
							disabled={submitting}
							aria-invalid={errors.to ? "true" : "false"}
						/>
						{errors.to && (
							<p className="text-xs text-destructive">{errors.to}</p>
						)}
					</div>

					{/* Amount */}
					<div className="space-y-2">
						<Label htmlFor="amount">
							Amount <span className="text-destructive">*</span>
							{tokenGenesis && (
								<span className="text-muted-foreground text-xs ml-2">
									(Decimals: {tokenGenesis.token.metadata.decimals})
								</span>
							)}
						</Label>
						<Input
							id="amount"
							type="text"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder={
								tokenGenesis
									? `0.${"0".repeat(tokenGenesis.token.metadata.decimals)}`
									: "0.000000"
							}
							disabled={submitting}
							aria-invalid={errors.amount ? "true" : "false"}
						/>
						{errors.amount && (
							<p className="text-xs text-destructive">{errors.amount}</p>
						)}
						{selectedToken && (
							<p className="text-xs text-muted-foreground">
								{selectedToken.raw.genesis.token.metadata.symbol}
							</p>
						)}
					</div>

					{/* Balance Info */}
					{selectedTokenId && currentBalance && (
						<div className="space-y-2">
							<Label>Current Balance</Label>
							<div className="p-3 rounded-lg border bg-muted/30">
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold">
										{currentBalance.balance} {currentBalance.currency}
									</span>
									{balanceLoading && (
										<span className="text-xs text-muted-foreground">
											Loading...
										</span>
									)}
								</div>
								{amount && !balanceLoading && (
									<div className="mt-2 text-xs text-muted-foreground">
										{(() => {
											const balanceNum = Number.parseFloat(
												currentBalance.balance,
											);
											const amountNum = Number.parseFloat(amount.trim());
											const feeNum = Number.parseFloat(calculatedFee);
											const required = amountNum + feeNum;
											const remaining = balanceNum - required;

											if (isNaN(amountNum) || amountNum <= 0) {
												return null;
											}

											if (remaining < 0) {
												return (
													<span className="text-destructive">
														Insufficient balance. Need{" "}
														{Math.abs(remaining).toFixed(
															currentBalance.decimals,
														)}{" "}
														{currentBalance.currency} more
													</span>
												);
											}

											return (
												<span>
													After transaction: {remaining.toFixed(
														currentBalance.decimals,
													)}{" "}
													{currentBalance.currency}
												</span>
											);
										})()}
									</div>
								)}
							</div>
						</div>
					)}

					{/* Fee */}
					<div className="space-y-2">
						<Label htmlFor="fee">Transaction Fee</Label>
						<Input
							id="fee"
							type="text"
							value={calculatedFee}
							disabled
							className="bg-muted"
						/>
						<p className="text-xs text-muted-foreground">
							Fee is calculated based on transaction size
						</p>
					</div>

					{/* Memo */}
					<div className="space-y-2">
						<Label htmlFor="memo">Memo (Optional)</Label>
						<Textarea
							id="memo"
							value={memo}
							onChange={(e) => setMemo(e.target.value)}
							placeholder="Transaction memo"
							disabled={submitting}
							className="min-h-[4rem]"
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={submitting}>
							{submitting
								? (
									<>
										<Loader2 className="size-4 mr-2 animate-spin" />
										Sending...
									</>
								)
								: (
									<>
										<Send className="size-4 mr-2" />
										Send Transaction
									</>
								)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

