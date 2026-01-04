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
import { AlertCircle, CheckCircle2, Loader2, Send, Maximize2 } from "lucide-react";
import { useAuthStore, toast } from "@/stores";
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
	toHumanReadableBalance,
	convertFeeFromBaseUnits,
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
	
	// Real-time address validation state
	const [addressValid, setAddressValid] = useState<boolean | null>(null);
	const [isValidatingAddress, setIsValidatingAddress] = useState<boolean>(false);
	const addressValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
						// CRITICAL: Convert fee values from base units to SLI
						// Genesis stores fees in base units (e.g., 1000 = 0.00001000 SLI)
						base: parameters.fees?.base
							? (typeof parameters.fees.base === "number" || (typeof parameters.fees.base === "string" && !parameters.fees.base.includes("."))
								? convertFeeFromBaseUnits(parameters.fees.base, currency.decimals ?? 8)
								: String(parameters.fees.base))
							: "0.00001000",
						per_byte: parameters.fees?.per_byte
							? (typeof parameters.fees.per_byte === "number" || (typeof parameters.fees.per_byte === "string" && !parameters.fees.per_byte.includes("."))
								? convertFeeFromBaseUnits(parameters.fees.per_byte, currency.decimals ?? 8)
								: String(parameters.fees.per_byte))
							: "0.00000005",
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
		
		const decimals = tokenGenesis.parameters.currency?.decimals ?? 8;
		
		// CRITICAL: Convert fee values from base units to SLI
		// Genesis documents store fees in base units (e.g., base: 1000 = 0.00001000 SLI)
		// Check if fee is already in decimal format (contains ".") or in base units (integer)
		const baseFeeRaw = tokenGenesis.parameters.fees.base;
		const perByteFeeRaw = tokenGenesis.parameters.fees.per_byte;
		
		// Convert from base units if needed (if value is integer or large number)
		const baseFee = typeof baseFeeRaw === "number" || (typeof baseFeeRaw === "string" && !baseFeeRaw.includes("."))
			? convertFeeFromBaseUnits(baseFeeRaw, decimals)
			: baseFeeRaw || "0.00001000";
		
		const perByteFee = typeof perByteFeeRaw === "number" || (typeof perByteFeeRaw === "string" && !perByteFeeRaw.includes("."))
			? convertFeeFromBaseUnits(perByteFeeRaw, decimals)
			: perByteFeeRaw || "0.00000005";

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

		return totalFee.toFixed(decimals);
	}, [tokenGenesis, to, amount, memo]);

	/**
	 * Handle recipient address change with real-time validation
	 */
	const handleAddressChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>): void => {
			const inputValue = e.target.value;
			setTo(inputValue);

			// Clear previous timeout
			if (addressValidationTimeoutRef.current) {
				clearTimeout(addressValidationTimeoutRef.current);
			}

			// Clear validation state if empty
			if (!inputValue.trim()) {
				setAddressValid(null);
				setIsValidatingAddress(false);
				// Clear address error when user types
				if (errors.to) {
					setErrors((prev) => {
						const newErrors = { ...prev };
						delete newErrors.to;
						return newErrors;
					});
				}
				return;
			}

			// Debounced validation (300ms)
			setIsValidatingAddress(true);
			addressValidationTimeoutRef.current = setTimeout(() => {
				const isValid = validateAddress(inputValue.trim());
				setAddressValid(isValid);
				setIsValidatingAddress(false);

				// Update errors
				if (!isValid) {
					setErrors((prev) => ({
						...prev,
						to: "Invalid recipient address",
					}));
				} else {
					setErrors((prev) => {
						const newErrors = { ...prev };
						delete newErrors.to;
						return newErrors;
					});
				}
			}, 300);
		},
		[errors.to],
	);

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
	 * Handle Max button click - set amount to maximum available (balance - fee)
	 */
	const handleMaxAmount = useCallback((): void => {
		if (!currentBalance || !selectedToken) return;

		const decimals = selectedToken.metadata?.decimals || currentBalance.decimals || 6;
		// Convert balance to human-readable format (auto-detects raw vs human-readable)
		const humanReadableBalance = toHumanReadableBalance(currentBalance.balance, decimals);
		const balanceNum = Number.parseFloat(humanReadableBalance);
		const feeNum = Number.parseFloat(calculatedFee);

		if (isNaN(balanceNum) || isNaN(feeNum)) return;

		// Calculate max amount (balance - fee)
		const maxAmount = Math.max(0, balanceNum - feeNum);

		// Format amount with proper decimals
		const formattedAmount = maxAmount.toFixed(decimals);
		setAmount(formattedAmount);

		// Clear amount error
		if (errors.amount) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors.amount;
				return newErrors;
			});
		}
	}, [currentBalance, selectedToken, calculatedFee, errors.amount]);

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
		setAddressValid(null);
		setIsValidatingAddress(false);
		
		// Clear validation timeout
		if (addressValidationTimeoutRef.current) {
			clearTimeout(addressValidationTimeoutRef.current);
			addressValidationTimeoutRef.current = null;
		}
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
			const decimals = selectedToken?.metadata?.decimals || currentBalance.decimals || 6;
			const normalizedAmount = formatAmountForAPI(amount, decimals);
			const amountNum = Number.parseFloat(normalizedAmount);
			// Convert balance to human-readable format (auto-detects raw vs human-readable)
			const humanReadableBalance = toHumanReadableBalance(currentBalance.balance, decimals);
			const balanceNum = Number.parseFloat(humanReadableBalance);
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

			// Warn if fee significantly exceeds calculated fee (possible conversion error)
			const feeNum = Number.parseFloat(calculatedFee);
			const expectedFeeNum = Number.parseFloat(calculatedFee); // Already calculated correctly
			if (feeNum > expectedFeeNum * 10) {
				console.warn(
					`Fee (${calculatedFee} SLI) significantly exceeds expected fee (${expectedFeeNum.toFixed(8)} SLI). ` +
					`This may indicate a fee conversion error from base units.`,
				);
			}

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

				// Submit transaction with retry mechanism
				let submitResult: Awaited<ReturnType<typeof submitTransaction>>;
				const maxRetries = 3;
				let lastError: Error | null = null;

				for (let attempt = 0; attempt < maxRetries; attempt++) {
					try {
						submitResult = await submitTransaction(transaction);
						break; // Success, exit retry loop
					} catch (err) {
						lastError = err instanceof Error ? err : new Error(String(err));
						
						// Check if it's a network error (retryable)
						const isNetworkError = lastError.message.includes("fetch") ||
							lastError.message.includes("network") ||
							lastError.message.includes("timeout") ||
							lastError.message.includes("Failed to fetch");

						// Don't retry on validation errors or insufficient balance
						const isNonRetryable = lastError.message.includes("Invalid") ||
							lastError.message.includes("Insufficient") ||
							lastError.message.includes("balance");

						if (isNonRetryable || !isNetworkError) {
							throw lastError; // Don't retry, throw immediately
						}

						// If last attempt, throw error
						if (attempt === maxRetries - 1) {
							throw lastError;
						}

						// Exponential backoff: 1s, 2s, 4s
						const delay = Math.pow(2, attempt) * 1000;
						await new Promise((resolve) => setTimeout(resolve, delay));
						
						// Show retry notification
						if (attempt < maxRetries - 1) {
							toast.warning(
								"Retrying transaction",
								`Attempt ${attempt + 2} of ${maxRetries}...`,
							);
						}
					}
				}

				// submitResult is guaranteed to be set here (TypeScript doesn't know this)
				const result = submitResult!;

				// Check if transaction was submitted but failed
				if (result.status === "failed") {
					const consensusStatus = result.consensus_status || "unknown";
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

				// Show success toast
				toast.success(
					"Transaction sent successfully",
					`Sent ${amount} ${selectedToken?.metadata?.symbol || ""} to ${to.slice(0, 8)}...${to.slice(-6)}`,
				);

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
				
				// Show error toast
				toast.error(
					"Transaction failed",
					errorMessage,
				);
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
			selectedToken,
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

	// Cleanup validation timeout on unmount
	React.useEffect(() => {
		return () => {
			if (addressValidationTimeoutRef.current) {
				clearTimeout(addressValidationTimeoutRef.current);
			}
		};
	}, []);

	// Focus management for accessibility
	const addressInputRef = React.useRef<HTMLInputElement>(null);
	const amountInputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		if (open && !submitting) {
			// Focus first input when dialog opens
			setTimeout(() => {
				if (selectedTokenId && addressInputRef.current) {
					addressInputRef.current.focus();
				} else if (!selectedTokenId) {
					// Focus will be on token select
				}
			}, 100);
		}
	}, [open, submitting, selectedTokenId]);

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
					mobile && cn(
						"max-w-[100vw] max-h-[100vh] h-[100vh]",
						"rounded-none border-0 m-0 p-0 gap-0",
						"fixed bottom-0 left-0 right-0 top-0",
						"translate-x-0 translate-y-0",
						"data-[state=open]:animate-in data-[state=closed]:animate-out",
						"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
						"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
						"duration-300 ease-out",
					),
				)}
			>
				{mobile && (
					<div className="shrink-0 flex items-center justify-center pt-3 pb-2 px-4 border-b border-border relative">
						<div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
					</div>
				)}
				<div className={cn("flex flex-col", mobile ? "h-full overflow-hidden" : "")}>
					<div className={cn(mobile ? "flex-1 overflow-y-auto p-4" : "")}>
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
						<div className="relative">
							<Input
								ref={addressInputRef}
								id="to"
								value={to}
								onChange={handleAddressChange}
								onBlur={() => {
									// Final validation on blur
									if (to.trim() && !addressValid && !isValidatingAddress) {
										const isValid = validateAddress(to.trim());
										setAddressValid(isValid);
										if (!isValid) {
											setErrors((prev) => ({
												...prev,
												to: "Invalid recipient address",
											}));
										}
									}
								}}
								placeholder="gYjDnckjrKCw3CYVerH1LMbgTWv3dmg6Hu"
								disabled={submitting}
								aria-invalid={errors.to ? "true" : addressValid === false ? "true" : "false"}
								aria-describedby={
									errors.to
										? "address-error"
										: addressValid === true
										? "address-success"
										: isValidatingAddress
										? "address-validating"
										: "address-help"
								}
								className={cn(
									errors.to || addressValid === false
										? "border-destructive"
										: addressValid === true
										? "border-green-500"
										: "",
								)}
							/>
							{isValidatingAddress && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									<Loader2 className="size-4 animate-spin text-muted-foreground" />
								</div>
							)}
							{!isValidatingAddress && addressValid === true && to.trim() && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2">
									<CheckCircle2 className="size-4 text-green-500" aria-hidden="true" />
								</div>
							)}
						</div>
						{errors.to && (
							<p id="address-error" className="text-xs text-destructive flex items-center gap-1">
								<AlertCircle className="size-3" />
								{errors.to}
							</p>
						)}
						{!errors.to && addressValid === true && to.trim() && (
							<p id="address-success" className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
								<CheckCircle2 className="size-3" />
								Valid address
							</p>
						)}
						{!errors.to && addressValid === null && !isValidatingAddress && (
							<p id="address-help" className="text-xs text-muted-foreground">
								Enter the recipient's wallet address
							</p>
						)}
						{isValidatingAddress && (
							<p id="address-validating" className="text-xs text-muted-foreground">
								Validating address...
							</p>
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
						<div className="relative">
							<Input
								ref={amountInputRef}
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
								className={cn(
									errors.amount && "border-destructive",
									"pr-20",
								)}
							/>
							{selectedTokenId && currentBalance && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleMaxAmount}
									disabled={submitting || balanceLoading}
									className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
									aria-label="Set maximum amount"
									title="Set maximum available amount (balance - fee)"
								>
									<Maximize2 className="size-3 mr-1" />
									Max
								</Button>
							)}
						</div>
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
					{selectedTokenId && currentBalance && selectedToken && (() => {
						const decimals = selectedToken?.metadata?.decimals || currentBalance.decimals || 6;
						// Convert balance to human-readable format (auto-detects raw vs human-readable)
						const humanReadableBalance = toHumanReadableBalance(currentBalance.balance, decimals);
						return (
							<div className="space-y-2">
								<Label>Current Balance</Label>
								<div className="p-3 rounded border bg-muted/30">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold">
											{humanReadableBalance}{" "}
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
												const balanceNum = Number.parseFloat(humanReadableBalance);
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
																decimals,
															)} {tokenSymbol} more
														</span>
													);
												}

												return (
													<span>
														After transaction: {remaining.toFixed(
															decimals,
														)} {tokenSymbol}
													</span>
												);
											})()}
										</div>
									)}
								</div>
							</div>
						);
					})()}

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
							aria-label="Cancel transaction"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={submitting || isValidatingAddress || addressValid === false}
							aria-label="Send transaction"
							aria-describedby={submitting ? "sending-status" : undefined}
						>
							{submitting
								? (
									<>
										<Loader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
										<span id="sending-status">Sending...</span>
									</>
								)
								: (
									<>
										<Send className="size-4 mr-2" aria-hidden="true" />
										Send Transaction
									</>
								)}
						</Button>
					</DialogFooter>
				</form>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
