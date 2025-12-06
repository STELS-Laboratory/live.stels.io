/**
 * Send Transaction Dialog Component
 * Form for creating and submitting asset transfer transactions
 */

import React, { useCallback, useMemo, useState } from "react";
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
import { AlertCircle, Loader2, Send } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useCreateTransaction } from "@/hooks/use_create_transaction";
import { usePublicAssetList } from "@/hooks/use_public_asset_list";
import { useAssetBalance } from "@/hooks/use_asset_balance";
import { validateAddress } from "@/lib/gliesereum";
import type { TokenGenesisDocument } from "@/hooks/use_create_transaction";
import {
	createNativeTokenFromGenesis,
	normalizeTokens,
} from "@/lib/token-normalizer";
import type { RawAssetData, Token } from "@/types/token";
import { cn } from "@/lib/utils";
import {
	handleAmountInputChange,
	validateAmount as validateAmountInput,
	formatAmountForAPI,
} from "@/lib/amount-parser";

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

	// Get network ID
	const networkId = connectionSession?.network || "testnet";

	// Get raw assets from API
	const { assets: rawAssets } = usePublicAssetList({
		network: networkId,
	});

	// Normalize tokens to unified format
	const normalizedTokens = React.useMemo(() => {
		return normalizeTokens(rawAssets as RawAssetData[]);
	}, [rawAssets]);

	// Find genesis document for native token
	const genesisDoc = React.useMemo(() => {
		return rawAssets?.find((asset) => {
			const isGenesisDoc = asset.channel?.includes(".genesis:") ||
				(asset.raw?.genesis && !asset.raw.genesis.token &&
					asset.raw.genesis.genesis);
			return isGenesisDoc;
		}) as RawAssetData | undefined;
	}, [rawAssets]);

	// Create native token from genesis document
	const nativeToken = React.useMemo(() => {
		if (!genesisDoc) return null;
		return createNativeTokenFromGenesis(genesisDoc, networkId);
	}, [genesisDoc, networkId]);

	// Combine normalized tokens with native token
	const allTokens = React.useMemo(() => {
		const tokens: Token[] = [...normalizedTokens];
		if (nativeToken && !tokens.find((t) => t.id === nativeToken.id)) {
			tokens.unshift(nativeToken); // Add native token at the beginning
		}
		return tokens;
	}, [normalizedTokens, nativeToken]);

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

	// Get selected token from normalized tokens
	const selectedToken = useMemo(() => {
		if (!selectedTokenId || !allTokens) return null;
		return allTokens.find((token) => token.id === selectedTokenId);
	}, [selectedTokenId, allTokens]);

	const tokenGenesis: TokenGenesisDocument | null = useMemo(() => {
		if (!selectedToken) return null;

		// For normalized tokens, we need to reconstruct genesis document structure
		// Find the original raw asset data
		const rawAsset = rawAssets?.find((asset) => {
			if (selectedToken.standard === "native") {
				// For native token, find genesis document
				const isGenesisDoc = asset.channel?.includes(".genesis:") ||
					(asset.raw?.genesis && !asset.raw.genesis.token &&
						asset.raw.genesis.genesis);
				return isGenesisDoc;
			} else {
				// For regular tokens, find by token ID
				const tokenId = asset.raw?.genesis?.token?.id || asset.id || "";
				return tokenId === selectedToken.id;
			}
		}) as RawAssetData | undefined;

		if (!rawAsset?.raw?.genesis) {
			return null;
		}

		const genesis = rawAsset.raw.genesis;

		// For native tokens, we need to construct TokenGenesisDocument from network genesis
		if (selectedToken.standard === "native") {
			const network = genesis.network;
			const protocol = genesis.protocol;
			const parameters = genesis.parameters;
			const currency = parameters?.currency;

			if (!network || !protocol || !currency) {
				return null;
			}

			// Construct TokenGenesisDocument for native token
			// Use protocol.sign_domains.tx for transactions (per genesis-smart-1.0.json)
			const tokenGenesisDoc: TokenGenesisDocument = {
				$schema: rawAsset.raw.$schema || "",
				version: rawAsset.raw.version || "",
				network: {
					id: network.id || networkId,
					name: network.name || "",
					environment: network.environment || "",
					chain_id: network.chain_id ?? 1,
				},
				protocol: {
					tx_version: protocol.tx_version || "smart-1.0",
					vm_version: protocol.vm_version || "",
					canonicalization: protocol.canonicalization || "gls-det-1",
					encoding: protocol.encoding || "utf-8",
					sign_domains: {
						// Use tx domain for asset transactions (per protocol)
						tx: (protocol.sign_domains?.tx ||
							protocol.sign_domains?.token ||
							[]) as (string | number)[],
						// Include other domains for completeness
						...(protocol.sign_domains?.cosign && {
							cosign: protocol.sign_domains.cosign,
						}),
						...(protocol.sign_domains?.notary && {
							notary: protocol.sign_domains.notary,
						}),
						...(protocol.sign_domains?.genesis && {
							genesis: protocol.sign_domains.genesis,
						}),
						...(protocol.sign_domains?.crl && {
							crl: protocol.sign_domains.crl,
						}),
						// Legacy support
						...(protocol.sign_domains?.token && {
							token: protocol.sign_domains.token,
						}),
					},
				},
				token: {
					id: selectedToken.id || `native:${networkId}`,
					metadata: {
						name: currency.name || currency.symbol || "Native Token",
						symbol: currency.symbol || "SLI",
						decimals: currency.decimals ?? 8,
					},
				},
				parameters: {
					currency: {
						symbol: currency.symbol || "SLI",
						decimals: currency.decimals ?? 8,
					},
					fees: {
						base: parameters.fees?.base || "0.00001",
						per_byte: parameters.fees?.per_byte || "0.00000005",
						currency: parameters.fees?.currency || "SLI",
					},
				},
			};

			return tokenGenesisDoc;
		}

		// For regular tokens, use the genesis document as-is
		// But ensure sign_domains structure is correct
		const tokenGenesisDoc = genesis as unknown as TokenGenesisDocument;

		// Ensure sign_domains has tx field (for new protocol) or token field (for legacy)
		if (
			!tokenGenesisDoc.protocol.sign_domains.tx &&
			!tokenGenesisDoc.protocol.sign_domains.token
		) {
			// Try to get from protocol if available
			if (genesis.protocol?.sign_domains?.tx) {
				tokenGenesisDoc.protocol.sign_domains.tx = genesis.protocol.sign_domains
					.tx as (string | number)[];
			} else if (genesis.protocol?.sign_domains?.token) {
				tokenGenesisDoc.protocol.sign_domains.token = genesis.protocol.sign_domains
					.token as (string | number)[];
			}
		}

		return tokenGenesisDoc;
	}, [selectedToken, rawAssets, networkId]);

	// Calculate fee based on transaction size
	const calculatedFee = useMemo((): string => {
		if (!tokenGenesis || !tokenGenesis.parameters?.fees) return "0.000100";
		const baseFee = tokenGenesis.parameters.fees.base || "0.0001";
		const perByteFee = tokenGenesis.parameters.fees.per_byte || "0.0000002";

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
	 * Handle amount input change with smart parsing
	 */
	const handleAmountChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>): void => {
			const inputValue = e.target.value;
			const decimals = selectedToken?.metadata?.decimals || 6;
			const parsed = handleAmountInputChange(inputValue, decimals);
			setAmount(parsed);

			// Clear amount error when user types
			if (errors.amount) {
				setErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors.amount;
					return newErrors;
				});
			}
		},
		[selectedToken?.metadata?.decimals, errors.amount],
	);

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

		// Validate amount using new parser
		const decimals = selectedToken?.metadata?.decimals || 6;
		const amountError = validateAmountInput(amount, decimals);
		if (amountError) {
			newErrors.amount = amountError;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [selectedTokenId, to, amount, selectedToken]);

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

			if (!wallet || !connectionSession) {
				setSubmitError("Wallet or connection not available");
				return;
			}

			if (!tokenGenesis) {
				setSubmitError(
					`Token genesis document not available for ${
						selectedToken?.metadata?.symbol || "selected token"
					}. ` +
						"Please select a valid token or try again later.",
				);
				return;
			}

			// Validate sign_domains structure
			const signDomain = tokenGenesis.protocol.sign_domains.tx ||
				tokenGenesis.protocol.sign_domains.token;
			if (!Array.isArray(signDomain) || signDomain.length === 0) {
				setSubmitError(
					`Invalid sign_domains in token genesis for ${
						selectedToken?.metadata?.symbol || "selected token"
					}. ` +
						"Token genesis document is missing required sign_domains.tx or sign_domains.token.",
				);
				return;
			}

			if (!selectedToken) {
				setSubmitError("Selected token not found");
				return;
			}

			if (!validateForm()) {
				return;
			}

			// Check balance before transfer
			if (!currentBalance) {
				setSubmitError("Balance not loaded. Please wait and try again.");
				return;
			}

			// Normalize amount for comparison
			const decimals = selectedToken?.metadata?.decimals || 6;
			const normalizedAmount = formatAmountForAPI(amount, decimals);
			const amountNum = Number.parseFloat(normalizedAmount);
			const balanceNum = Number.parseFloat(currentBalance.balance);
			const feeNum = Number.parseFloat(calculatedFee);
			const required = amountNum + feeNum;

			if (isNaN(balanceNum) || isNaN(amountNum) || isNaN(feeNum)) {
				setSubmitError("Invalid balance or amount values");
				return;
			}

			if (balanceNum < required) {
				setSubmitError(
					`Insufficient balance. Required: ${
						required.toFixed(
							currentBalance.decimals,
						)
					} ${currentBalance.currency}, Available: ${currentBalance.balance} ${currentBalance.currency}`,
				);
				return;
			}

			setSubmitError(null);

			try {
				// Normalize amount to proper format for API
				const decimals = selectedToken?.metadata?.decimals || 6;
				const normalizedAmount = formatAmountForAPI(amount, decimals);

				// Create transaction (prevHash will be null for now, can be fetched separately if needed)
				const transaction = createTransaction({
					wallet,
					tokenGenesis,
					to: to.trim(),
					amount: normalizedAmount,
					fee: calculatedFee,
					prevHash: null,
					memo: memo.trim() || undefined,
				});

				// Submit transaction
				const submitResult = await submitTransaction(transaction);

				// Check if transaction was submitted but failed
				if (submitResult.status === "failed") {
					const consensusStatus = submitResult.consensus_status || "unknown";
					let warningMessage = "Transaction was submitted but failed.";
					
					if (consensusStatus === "not_found") {
						warningMessage = 
							"Transaction was submitted but not found in consensus. " +
							"It may be pending validation or rejected by the network. " +
							"Check the transaction list for details.";
					} else {
						warningMessage = 
							"Transaction was submitted but failed. " +
							"This may be due to insufficient balance, invalid signature, or network issues. " +
							"Check the transaction list for details.";
					}
					
					setSubmitError(warningMessage);
					// Don't close dialog, let user see the error
					return;
				}

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
				let errorMessage = "Failed to send transaction";
				
				if (err instanceof Error) {
					errorMessage = err.message;
				}
				
				setSubmitError(errorMessage);
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
			onTransactionSent,
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
								{allTokens?.map((token) => {
									return (
										<SelectItem
											key={token.id}
											value={token.id}
										>
											{token.metadata.name} ({token.metadata.symbol})
										</SelectItem>
									);
								})}
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
							{selectedToken?.metadata?.decimals
								? (
									<span className="text-muted-foreground text-xs ml-2">
										(Max {selectedToken.metadata.decimals} decimals)
									</span>
								)
								: null}
						</Label>
						<Input
							id="amount"
							type="text"
							inputMode="decimal"
							value={amount}
							onChange={handleAmountChange}
							placeholder={selectedToken?.metadata?.decimals
								? `0.${"0".repeat(selectedToken.metadata.decimals)}`
								: "0.000000"}
							disabled={submitting}
							aria-invalid={errors.amount ? "true" : "false"}
							aria-describedby={
								errors.amount
									? "amount-error"
									: amount
									? "amount-hint"
									: "amount-help"
							}
							className={cn(errors.amount && "border-destructive")}
						/>
						{errors.amount && (
							<p
								id="amount-error"
								className="text-xs text-destructive flex items-center gap-1"
							>
								{errors.amount}
							</p>
						)}
						{!errors.amount && amount && selectedToken?.metadata?.symbol && (
							<p
								id="amount-hint"
								className="text-xs text-muted-foreground"
							>
								You're sending {amount} {selectedToken.metadata.symbol}
							</p>
						)}
						{!errors.amount && !amount && (
							<p
								id="amount-help"
								className="text-xs text-muted-foreground"
							>
								{selectedToken?.metadata?.symbol
									? (
										<>
											Enter amount in {selectedToken.metadata.symbol}. Formats:{" "}
											<span className="font-mono">1000</span>,{" "}
											<span className="font-mono">1,000</span>,{" "}
											<span className="font-mono">1 000</span>, or{" "}
											<span className="font-mono">1.000</span>
										</>
									)
									: "Enter amount. Supports: 1000, 1,000, 1 000, or 1.000"}
							</p>
						)}
					</div>

					{/* Balance Info */}
					{selectedTokenId && currentBalance && selectedToken && (
						<div className="space-y-2">
							<Label>Current Balance</Label>
							<div className="p-3 rounded border bg-muted/30">
								<div className="flex items-center justify-between">
									<span className="text-sm font-semibold">
										{currentBalance.balance}{" "}
										{selectedToken?.metadata?.symbol || ""}
									</span>
									{balanceLoading && (
										<span className="text-xs text-muted-foreground">
											Loading...
										</span>
									)}
								</div>
								{amount && !balanceLoading && !errors.amount && (
									<div className="mt-2 text-xs text-muted-foreground">
										{(() => {
											const balanceNum = Number.parseFloat(
												currentBalance.balance,
											);
											const decimals = selectedToken?.metadata?.decimals || 6;
											const normalizedAmount = formatAmountForAPI(amount, decimals);
											const amountNum = Number.parseFloat(normalizedAmount);
											const feeNum = Number.parseFloat(calculatedFee);
											const required = amountNum + feeNum;
											const remaining = balanceNum - required;
											const tokenSymbol = selectedToken?.metadata?.symbol || "";

											if (isNaN(amountNum) || amountNum <= 0) {
												return null;
											}

											if (remaining < 0) {
												return (
													<span className="text-destructive">
														Insufficient balance. Need{" "}
														{Math.abs(remaining).toFixed(
															currentBalance.decimals,
														)} {tokenSymbol} more
													</span>
												);
											}

											return (
												<span>
													After transaction: {remaining.toFixed(
														currentBalance.decimals,
													)} {tokenSymbol}
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
