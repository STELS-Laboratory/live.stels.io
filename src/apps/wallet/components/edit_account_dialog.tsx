/**
 * Edit Account Dialog Component
 * Wizard-based form for editing existing trading accounts
 * Reuses Add Account Dialog logic with pre-filled values
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { PlusIcon, XIcon, AlertCircleIcon, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuthStore, toast } from "@/stores";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import type { AccountRequest, ProtocolData } from "@/lib/api-types";
import type { StoredAccount } from "@/stores/modules/accounts.store";

interface EditAccountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	account: StoredAccount | null;
}

interface FormErrors {
	nid?: string;
	exchange?: string;
	apiKey?: string;
	secret?: string;
	protocol?: {
		strategy?: string;
		maxRiskPerTrade?: string;
		maxLeverage?: string;
		markets?: string;
	};
}

/**
 * Edit Account Dialog Component
 */
export function EditAccountDialog({
	open,
	onOpenChange,
	account,
	mobile = false,
}: EditAccountDialogProps): React.ReactElement {
	const { wallet, connectionSession } = useAuthStore();
	const { updateAccount, sendAccountToServer } = useAccountsStore();

	// Initialize form state from account data
	const initializeForm = useCallback((): void => {
		if (!account) return;

		setNid(account.account.nid || "");
		setConnection(account.account.connection ?? true);
		setExchange(account.account.exchange || "");
		setNote(account.account.note || "");
		setApiKey(account.account.apiKey || "");
		setSecret(account.account.secret || "");
		setStatus(account.account.status || "active");
		setPassword(account.account.password || "");
		setViewers(account.account.viewers || []);
		setViewerInput("");

		// Protocol fields
		if (account.account.protocol) {
			setStrategy(account.account.protocol.strategy || "Anna Ariadna");
			setTradingStyle(account.account.protocol.tradingStyle || "Intelligent Position Trading");
			setMaxRiskPerTrade(account.account.protocol.maxRiskPerTrade || 1);
			setMaxLeverage(account.account.protocol.maxLeverage || 5);
			setMaxDrawdown(account.account.protocol.maxDrawdown || 15);
			setStopLoss(account.account.protocol.stopLoss || 3);
			setTakeProfit(account.account.protocol.takeProfit || 9);
			setRiskRewardRatio(account.account.protocol.riskRewardRatio || 3);
			setPositionSizing(account.account.protocol.positionSizing || "Dynamic Volatility Adjusted");
			setPortfolioAllocation(account.account.protocol.portfolioAllocation || 75);
			setSlippageTolerance(account.account.protocol.slippageTolerance || 0.25);
			setMarkets(account.account.protocol.markets || ["BTC/USDT", "ETH/USDT", "SOL/USDT"]);
			setOrderTypes(account.account.protocol.orderTypes || ["Limit", "Stop-Limit"]);
			setTimeframes(account.account.protocol.timeframes || ["1d", "3d", "1w"]);
			setMarketConditions(account.account.protocol.marketConditions || ["Trending", "High Volume"]);
			setHedgingEnabled(account.account.protocol.hedgingEnabled ?? true);
			setScalingEnabled(account.account.protocol.scalingEnabled ?? true);
			setTrailingStopEnabled(account.account.protocol.trailingStopEnabled ?? true);
			setDynamicPositionSizing(account.account.protocol.dynamicPositionSizing ?? true);
		}
	}, [account]);

	// Initialize form when account changes
	useEffect(() => {
		if (open && account) {
			initializeForm();
			setCurrentStep(0);
		}
	}, [open, account, initializeForm]);

	// Basic account fields
	const [nid, setNid] = useState<string>("");
	const [connection, setConnection] = useState<boolean>(true);
	const [exchange, setExchange] = useState<string>("");
	const [note, setNote] = useState<string>("");
	const [apiKey, setApiKey] = useState<string>("");
	const [secret, setSecret] = useState<string>("");
	const [status, setStatus] = useState<"active" | "learn" | "stopped">("active");
	const [password, setPassword] = useState<string>("");
	const [viewers, setViewers] = useState<string[]>([]);
	const [viewerInput, setViewerInput] = useState<string>("");

	// Protocol fields
	const [strategy, setStrategy] = useState<string>("Anna Ariadna");
	const [tradingStyle, setTradingStyle] = useState<string>("Intelligent Position Trading");
	const [maxRiskPerTrade, setMaxRiskPerTrade] = useState<number>(1);
	const [maxLeverage, setMaxLeverage] = useState<number>(5);
	const [maxDrawdown, setMaxDrawdown] = useState<number>(15);
	const [stopLoss, setStopLoss] = useState<number>(3);
	const [takeProfit, setTakeProfit] = useState<number>(9);
	const [riskRewardRatio, setRiskRewardRatio] = useState<number>(3);
	const [positionSizing, setPositionSizing] = useState<string>("Dynamic Volatility Adjusted");
	const [portfolioAllocation, setPortfolioAllocation] = useState<number>(75);
	const [slippageTolerance, setSlippageTolerance] = useState<number>(0.25);
	const [markets, setMarkets] = useState<string[]>(["BTC/USDT", "ETH/USDT", "SOL/USDT"]);
	const [marketInput, setMarketInput] = useState<string>("");
	const [orderTypes, setOrderTypes] = useState<string[]>(["Limit", "Stop-Limit"]);
	const [orderTypeInput, setOrderTypeInput] = useState<string>("");
	const [timeframes, setTimeframes] = useState<string[]>(["1d", "3d", "1w"]);
	const [timeframeInput, setTimeframeInput] = useState<string>("");
	const [marketConditions, setMarketConditions] = useState<string[]>(["Trending", "High Volume"]);
	const [conditionInput, setConditionInput] = useState<string>("");
	const [hedgingEnabled, setHedgingEnabled] = useState<boolean>(true);
	const [scalingEnabled, setScalingEnabled] = useState<boolean>(true);
	const [trailingStopEnabled, setTrailingStopEnabled] = useState<boolean>(true);
	const [dynamicPositionSizing, setDynamicPositionSizing] = useState<boolean>(true);

	// UI state
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [errors, setErrors] = useState<FormErrors>({});
	
	// Wizard state
	const [currentStep, setCurrentStep] = useState<number>(0);
	const totalSteps = 4;
	const steps = [
		{ id: "basic", title: "Basic Information", description: "Account details and settings" },
		{ id: "credentials", title: "API Credentials", description: "Exchange API keys and security" },
		{ id: "protocol", title: "Trading Protocol", description: "Trading strategy and risk management" },
		{ id: "review", title: "Review & Confirm", description: "Review all changes before saving" },
	];

	// Calculate progress percentage
	const progress = useMemo(() => {
		return ((currentStep + 1) / totalSteps) * 100;
	}, [currentStep, totalSteps]);

	// Helper functions (same as Add Account Dialog)
	const handleAddViewer = useCallback((): void => {
		if (viewerInput.trim() && !viewers.includes(viewerInput.trim())) {
			setViewers([...viewers, viewerInput.trim()]);
			setViewerInput("");
		}
	}, [viewerInput, viewers]);

	const handleRemoveViewer = useCallback(
		(index: number): void => {
			setViewers(viewers.filter((_, i) => i !== index));
		},
		[viewers],
	);

	const handleAddMarket = useCallback((): void => {
		if (marketInput.trim() && !markets.includes(marketInput.trim())) {
			setMarkets([...markets, marketInput.trim()]);
			setMarketInput("");
		}
	}, [marketInput, markets]);

	const handleRemoveMarket = useCallback(
		(index: number): void => {
			setMarkets(markets.filter((_, i) => i !== index));
		},
		[markets],
	);

	const handleAddOrderType = useCallback((): void => {
		if (orderTypeInput.trim() && !orderTypes.includes(orderTypeInput.trim())) {
			setOrderTypes([...orderTypes, orderTypeInput.trim()]);
			setOrderTypeInput("");
		}
	}, [orderTypeInput, orderTypes]);

	const handleRemoveOrderType = useCallback(
		(index: number): void => {
			setOrderTypes(orderTypes.filter((_, i) => i !== index));
		},
		[orderTypes],
	);

	const handleAddTimeframe = useCallback((): void => {
		if (timeframeInput.trim() && !timeframes.includes(timeframeInput.trim())) {
			setTimeframes([...timeframes, timeframeInput.trim()]);
			setTimeframeInput("");
		}
	}, [timeframeInput, timeframes]);

	const handleRemoveTimeframe = useCallback(
		(index: number): void => {
			setTimeframes(timeframes.filter((_, i) => i !== index));
		},
		[timeframes],
	);

	const handleAddCondition = useCallback((): void => {
		if (conditionInput.trim() && !marketConditions.includes(conditionInput.trim())) {
			setMarketConditions([...marketConditions, conditionInput.trim()]);
			setConditionInput("");
		}
	}, [conditionInput, marketConditions]);

	const handleRemoveCondition = useCallback(
		(index: number): void => {
			setMarketConditions(marketConditions.filter((_, i) => i !== index));
		},
		[marketConditions],
	);

	/**
	 * Validate current step
	 */
	const validateCurrentStep = useCallback((): boolean => {
		const newErrors: FormErrors = { ...errors };

		if (currentStep === 0) {
			if (!nid.trim()) {
				newErrors.nid = "Account ID (nid) is required";
			}
			if (!exchange.trim()) {
				newErrors.exchange = "Exchange is required";
			}
		} else if (currentStep === 1) {
			if (!apiKey.trim()) {
				newErrors.apiKey = "API Key is required";
			}
			if (!secret.trim()) {
				newErrors.secret = "Secret is required";
			}
		} else if (currentStep === 2) {
			if (!strategy.trim()) {
				newErrors.protocol = { ...newErrors.protocol, strategy: "Strategy is required" };
			}
			if (maxRiskPerTrade <= 0 || maxRiskPerTrade > 100) {
				newErrors.protocol = {
					...newErrors.protocol,
					maxRiskPerTrade: "Max risk per trade must be between 0 and 100",
				};
			}
			if (maxLeverage <= 0 || maxLeverage > 100) {
				newErrors.protocol = {
					...newErrors.protocol,
					maxLeverage: "Max leverage must be between 0 and 100",
				};
			}
			if (markets.length === 0) {
				newErrors.protocol = {
					...newErrors.protocol,
					markets: "At least one market is required",
				};
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [
		currentStep,
		nid,
		exchange,
		apiKey,
		secret,
		strategy,
		maxRiskPerTrade,
		maxLeverage,
		markets,
		errors,
	]);

	/**
	 * Validate entire form
	 */
	const validateForm = useCallback((): boolean => {
		const newErrors: FormErrors = {};

		if (!nid.trim()) {
			newErrors.nid = "Account ID (nid) is required";
		}
		if (!exchange.trim()) {
			newErrors.exchange = "Exchange is required";
		}
		if (!apiKey.trim()) {
			newErrors.apiKey = "API Key is required";
		}
		if (!secret.trim()) {
			newErrors.secret = "Secret is required";
		}
		if (!strategy.trim()) {
			newErrors.protocol = { ...newErrors.protocol, strategy: "Strategy is required" };
		}
		if (maxRiskPerTrade <= 0 || maxRiskPerTrade > 100) {
			newErrors.protocol = {
				...newErrors.protocol,
				maxRiskPerTrade: "Max risk per trade must be between 0 and 100",
			};
		}
		if (maxLeverage <= 0 || maxLeverage > 100) {
			newErrors.protocol = {
				...newErrors.protocol,
				maxLeverage: "Max leverage must be between 0 and 100",
			};
		}
		if (markets.length === 0) {
			newErrors.protocol = {
				...newErrors.protocol,
				markets: "At least one market is required",
			};
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [
		nid,
		exchange,
		apiKey,
		secret,
		strategy,
		maxRiskPerTrade,
		maxLeverage,
		markets,
	]);

	/**
	 * Handle next step
	 */
	const handleNextStep = useCallback((): void => {
		if (validateCurrentStep() && currentStep < totalSteps - 1) {
			setCurrentStep(currentStep + 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentStep, totalSteps, validateCurrentStep]);

	/**
	 * Handle previous step
	 */
	const handlePreviousStep = useCallback((): void => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentStep]);

	/**
	 * Handle form submission
	 */
	const handleSubmit = useCallback(async (): Promise<void> => {
		if (!wallet) {
			setError("Wallet not found");
			return;
		}

		if (!connectionSession) {
			setError("Not connected to network");
			return;
		}

		if (!account) {
			setError("Account not found");
			return;
		}

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// Protocol is always required
			const protocol: ProtocolData = {
				strategy: strategy.trim(),
				tradingStyle: tradingStyle.trim(),
				maxRiskPerTrade,
				maxLeverage,
				maxDrawdown,
				stopLoss,
				takeProfit,
				riskRewardRatio,
				positionSizing: positionSizing.trim(),
				portfolioAllocation,
				slippageTolerance,
				markets,
				orderTypes,
				timeframes,
				marketConditions,
				hedgingEnabled,
				scalingEnabled,
				trailingStopEnabled,
				dynamicPositionSizing,
			};

			const accountUpdates: Partial<AccountRequest> = {
				nid: nid.trim(),
				connection,
				exchange: exchange.trim(),
				note: note.trim(),
				apiKey: apiKey.trim(),
				secret: secret.trim(),
				status,
				password: password.trim() || undefined,
				viewers: viewers.length > 0 ? viewers : undefined,
				protocol,
			};

			// Update in local store
			const success = updateAccount(account.id, accountUpdates, wallet);
			if (!success) {
				throw new Error("Failed to update account in local store");
			}

			// Send updated account to server
			const fullAccount: AccountRequest = {
				...account.account,
				...accountUpdates,
				id: account.id,
			};

			await sendAccountToServer(
				fullAccount,
				wallet,
				connectionSession.session,
				connectionSession.api,
			);

			// Show success toast
			toast.success(
				"Account updated successfully",
				`Trading account "${nid}" has been updated`,
			);

			// Close dialog
			onOpenChange(false);
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to update account";
			setError(errorMessage);
			toast.error(
				"Failed to update account",
				errorMessage,
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		wallet,
		connectionSession,
		account,
		validateForm,
		updateAccount,
		sendAccountToServer,
		nid,
		connection,
		exchange,
		note,
		apiKey,
		secret,
		status,
		password,
		viewers,
		strategy,
		tradingStyle,
		maxRiskPerTrade,
		maxLeverage,
		maxDrawdown,
		stopLoss,
		takeProfit,
		riskRewardRatio,
		positionSizing,
		portfolioAllocation,
		slippageTolerance,
		markets,
		orderTypes,
		timeframes,
		marketConditions,
		hedgingEnabled,
		scalingEnabled,
		trailingStopEnabled,
		dynamicPositionSizing,
		onOpenChange,
	]);

	/**
	 * Handle dialog close
	 */
	const handleClose = useCallback((): void => {
		if (!isSubmitting) {
			onOpenChange(false);
		}
	}, [isSubmitting, onOpenChange]);

	if (!wallet || !connectionSession) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cannot Edit Account</DialogTitle>
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

	if (!account) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cannot Edit Account</DialogTitle>
						<DialogDescription>No account selected</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={handleClose}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	// Reuse the same form structure as Add Account Dialog
	// Import and reuse the form components from add_account_dialog.tsx
	// For now, return a simplified version that redirects to Add Account Dialog with pre-filled data
	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent
				className={cn(
					"max-w-4xl max-h-[90vh] overflow-y-auto",
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
				<DialogHeader className={cn(mobile && "px-0 pt-0 pb-2")}>
					<DialogTitle className="flex items-center justify-between">
						<span>Edit Trading Account</span>
						<span className="text-sm font-normal text-muted-foreground">
							Step {currentStep + 1} of {totalSteps}
						</span>
					</DialogTitle>
					<DialogDescription>
						{steps[currentStep].description}
					</DialogDescription>
					
					{/* Progress Bar */}
					<div className={cn("mt-4 space-y-2", mobile && "mt-2")}>
						<Progress value={progress} className="h-2" />
						<div className="flex justify-between text-xs text-muted-foreground">
							{steps.map((step, index) => (
								<div
									key={step.id}
									className={cn(
										"flex items-center gap-1",
										index <= currentStep && "text-primary font-medium",
									)}
								>
									{index < currentStep ? (
										<CheckCircle2 className="size-3" />
									) : (
										<div
											className={cn(
												"size-3 rounded-full border-2",
												index === currentStep
													? "border-primary bg-primary"
													: index < currentStep
													? "border-primary bg-primary"
													: "border-muted-foreground/30",
											)}
										/>
									)}
									<span className="hidden sm:inline">{step.title}</span>
								</div>
							))}
						</div>
					</div>
				</DialogHeader>

				{error && (
					<Alert variant="destructive" className={cn("mt-4", mobile && "mx-0")}>
						<AlertCircleIcon className="size-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (currentStep === totalSteps - 1) {
							handleSubmit();
						} else {
							handleNextStep();
						}
					}}
					className={cn("space-y-6", mobile ? "mt-4" : "mt-6")}
				>
					{/* Step 1: Basic Information */}
					{currentStep === 0 && (
						<div className="space-y-4">
							<h3 className="text-sm font-semibold text-foreground">
								Basic Information
							</h3>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="nid">
										Account ID (nid) <span className="text-destructive">*</span>
									</Label>
									<Input
										id="nid"
										value={nid}
										onChange={(e) => setNid(e.target.value)}
										placeholder="bhts"
										aria-invalid={errors.nid ? "true" : "false"}
										disabled={isSubmitting}
									/>
									{errors.nid && (
										<p className="text-xs text-destructive">{errors.nid}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="exchange">
										Exchange <span className="text-destructive">*</span>
									</Label>
									<Select
										value={exchange}
										onValueChange={setExchange}
										disabled={isSubmitting}
									>
										<SelectTrigger id="exchange" aria-invalid={errors.exchange ? "true" : "false"}>
											<SelectValue placeholder="Select exchange" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="bybit">Bybit</SelectItem>
											<SelectItem value="binance">Binance</SelectItem>
											<SelectItem value="okx">OKX</SelectItem>
											<SelectItem value="kraken">Kraken</SelectItem>
											<SelectItem value="coinbase">Coinbase</SelectItem>
										</SelectContent>
									</Select>
									{errors.exchange && (
										<p className="text-xs text-destructive">{errors.exchange}</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="note">Note</Label>
								<Textarea
									id="note"
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder="BHTS primary trading account."
									disabled={isSubmitting}
									className="min-h-[4rem]"
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<div className="space-y-2">
									<Label htmlFor="status">Status</Label>
									<Select
										value={status}
										onValueChange={(value: "active" | "learn" | "stopped") =>
											setStatus(value)
										}
										disabled={isSubmitting}
									>
										<SelectTrigger id="status">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="active">Active</SelectItem>
											<SelectItem value="learn">Learn</SelectItem>
											<SelectItem value="stopped">Stopped</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="flex items-end space-x-2">
									<Switch
										id="connection"
										checked={connection}
										onCheckedChange={setConnection}
										disabled={isSubmitting}
									/>
									<Label htmlFor="connection" className="cursor-pointer">
										Connection enabled
									</Label>
								</div>
							</div>
						</div>
					)}

					{/* Step 2: API Credentials */}
					{currentStep === 1 && (
						<div className="space-y-4">
							<h3 className="text-sm font-semibold text-foreground">
								API Credentials
							</h3>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="apiKey">
										API Key <span className="text-destructive">*</span>
									</Label>
									<Input
										id="apiKey"
										type="password"
										value={apiKey}
										onChange={(e) => setApiKey(e.target.value)}
										placeholder="oR1o2UfHbxeOfdwR2U"
										aria-invalid={errors.apiKey ? "true" : "false"}
										disabled={isSubmitting}
									/>
									{errors.apiKey && (
										<p className="text-xs text-destructive">{errors.apiKey}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="secret">
										Secret <span className="text-destructive">*</span>
									</Label>
									<Input
										id="secret"
										type="password"
										value={secret}
										onChange={(e) => setSecret(e.target.value)}
										placeholder="Enter secret key"
										aria-invalid={errors.secret ? "true" : "false"}
										disabled={isSubmitting}
									/>
									{errors.secret && (
										<p className="text-xs text-destructive">{errors.secret}</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password (optional)</Label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Account password"
									disabled={isSubmitting}
								/>
							</div>

							{/* Viewers */}
							<div className="space-y-2">
								<Label htmlFor="viewer">Viewers (addresses)</Label>
								<div className="flex gap-2">
									<Input
										id="viewer"
										value={viewerInput}
										onChange={(e) => setViewerInput(e.target.value)}
										placeholder="ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv"
										disabled={isSubmitting}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddViewer();
											}
										}}
									/>
									<Button
										type="button"
										variant="outline"
										size="default"
										onClick={handleAddViewer}
										disabled={isSubmitting || !viewerInput.trim()}
									>
										<PlusIcon className="size-4" />
									</Button>
								</div>
								{viewers.length > 0 && (
									<div className="flex flex-wrap gap-2 mt-2">
										{viewers.map((viewer, index) => (
											<div
												key={index}
												className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
											>
												<span className="text-xs">{viewer}</span>
												<button
													type="button"
													onClick={() => handleRemoveViewer(index)}
													disabled={isSubmitting}
													className="text-muted-foreground hover:text-foreground"
												>
													<XIcon className="size-3" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* Step 3: Trading Protocol */}
					{currentStep === 2 && (
						<div className="space-y-4">
							<h3 className="text-sm font-semibold text-foreground">
								Trading Protocol <span className="text-destructive">*</span>
							</h3>

							<div className="space-y-4">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="strategy">
											Strategy <span className="text-destructive">*</span>
										</Label>
										<Input
											id="strategy"
											value={strategy}
											onChange={(e) => setStrategy(e.target.value)}
											placeholder="Anna Ariadna"
											aria-invalid={errors.protocol?.strategy ? "true" : "false"}
											disabled={isSubmitting}
										/>
										{errors.protocol?.strategy && (
											<p className="text-xs text-destructive">
												{errors.protocol.strategy}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="tradingStyle">Trading Style</Label>
										<Input
											id="tradingStyle"
											value={tradingStyle}
											onChange={(e) => setTradingStyle(e.target.value)}
											placeholder="Intelligent Position Trading"
											disabled={isSubmitting}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
									<div className="space-y-2">
										<Label htmlFor="maxRiskPerTrade">Max Risk/Trade (%)</Label>
										<Input
											id="maxRiskPerTrade"
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={maxRiskPerTrade}
											onChange={(e) =>
												setMaxRiskPerTrade(Number.parseFloat(e.target.value))
											}
											aria-invalid={
												errors.protocol?.maxRiskPerTrade ? "true" : "false"
											}
											disabled={isSubmitting}
										/>
										{errors.protocol?.maxRiskPerTrade && (
											<p className="text-xs text-destructive">
												{errors.protocol.maxRiskPerTrade}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="maxLeverage">Max Leverage</Label>
										<Input
											id="maxLeverage"
											type="number"
											min="1"
											max="100"
											step="1"
											value={maxLeverage}
											onChange={(e) => setMaxLeverage(Number.parseInt(e.target.value))}
											aria-invalid={
												errors.protocol?.maxLeverage ? "true" : "false"
											}
											disabled={isSubmitting}
										/>
										{errors.protocol?.maxLeverage && (
											<p className="text-xs text-destructive">
												{errors.protocol.maxLeverage}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
										<Input
											id="maxDrawdown"
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={maxDrawdown}
											onChange={(e) =>
												setMaxDrawdown(Number.parseFloat(e.target.value))
											}
											disabled={isSubmitting}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="stopLoss">Stop Loss (%)</Label>
										<Input
											id="stopLoss"
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={stopLoss}
											onChange={(e) => setStopLoss(Number.parseFloat(e.target.value))}
											disabled={isSubmitting}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
									<div className="space-y-2">
										<Label htmlFor="takeProfit">Take Profit (%)</Label>
										<Input
											id="takeProfit"
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={takeProfit}
											onChange={(e) =>
												setTakeProfit(Number.parseFloat(e.target.value))
											}
											disabled={isSubmitting}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="riskRewardRatio">Risk/Reward Ratio</Label>
										<Input
											id="riskRewardRatio"
											type="number"
											min="0"
											step="0.1"
											value={riskRewardRatio}
											onChange={(e) =>
												setRiskRewardRatio(Number.parseFloat(e.target.value))
											}
											disabled={isSubmitting}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="portfolioAllocation">Portfolio Allocation (%)</Label>
										<Input
											id="portfolioAllocation"
											type="number"
											min="0"
											max="100"
											step="0.1"
											value={portfolioAllocation}
											onChange={(e) =>
												setPortfolioAllocation(Number.parseFloat(e.target.value))
											}
											disabled={isSubmitting}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="slippageTolerance">Slippage Tolerance (%)</Label>
										<Input
											id="slippageTolerance"
											type="number"
											min="0"
											max="100"
											step="0.01"
											value={slippageTolerance}
											onChange={(e) =>
												setSlippageTolerance(Number.parseFloat(e.target.value))
											}
											disabled={isSubmitting}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="positionSizing">Position Sizing</Label>
									<Input
										id="positionSizing"
										value={positionSizing}
										onChange={(e) => setPositionSizing(e.target.value)}
										placeholder="Dynamic Volatility Adjusted"
										disabled={isSubmitting}
									/>
								</div>

								{/* Markets */}
								<div className="space-y-2">
									<Label htmlFor="market">
										Markets <span className="text-destructive">*</span>
									</Label>
									<div className="flex gap-2">
										<Input
											id="market"
											value={marketInput}
											onChange={(e) => setMarketInput(e.target.value)}
											placeholder="BTC/USDT"
											disabled={isSubmitting}
											aria-invalid={errors.protocol?.markets ? "true" : "false"}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddMarket();
												}
											}}
										/>
										<Button
											type="button"
											variant="outline"
											size="default"
											onClick={handleAddMarket}
											disabled={isSubmitting || !marketInput.trim()}
										>
											<PlusIcon className="size-4" />
										</Button>
									</div>
									{errors.protocol?.markets && (
										<p className="text-xs text-destructive">
											{errors.protocol.markets}
										</p>
									)}
									{markets.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2">
											{markets.map((market, index) => (
												<div
													key={index}
													className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
												>
													<span className="text-xs">{market}</span>
													<button
														type="button"
														onClick={() => handleRemoveMarket(index)}
														disabled={isSubmitting}
														className="text-muted-foreground hover:text-foreground"
													>
														<XIcon className="size-3" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Order Types */}
								<div className="space-y-2">
									<Label htmlFor="orderType">Order Types</Label>
									<div className="flex gap-2">
										<Input
											id="orderType"
											value={orderTypeInput}
											onChange={(e) => setOrderTypeInput(e.target.value)}
											placeholder="Limit"
											disabled={isSubmitting}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddOrderType();
												}
											}}
										/>
										<Button
											type="button"
											variant="outline"
											size="default"
											onClick={handleAddOrderType}
											disabled={isSubmitting || !orderTypeInput.trim()}
										>
											<PlusIcon className="size-4" />
										</Button>
									</div>
									{orderTypes.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2">
											{orderTypes.map((orderType, index) => (
												<div
													key={index}
													className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
												>
													<span className="text-xs">{orderType}</span>
													<button
														type="button"
														onClick={() => handleRemoveOrderType(index)}
														disabled={isSubmitting}
														className="text-muted-foreground hover:text-foreground"
													>
														<XIcon className="size-3" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Timeframes */}
								<div className="space-y-2">
									<Label htmlFor="timeframe">Timeframes</Label>
									<div className="flex gap-2">
										<Input
											id="timeframe"
											value={timeframeInput}
											onChange={(e) => setTimeframeInput(e.target.value)}
											placeholder="1d"
											disabled={isSubmitting}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddTimeframe();
												}
											}}
										/>
										<Button
											type="button"
											variant="outline"
											size="default"
											onClick={handleAddTimeframe}
											disabled={isSubmitting || !timeframeInput.trim()}
										>
											<PlusIcon className="size-4" />
										</Button>
									</div>
									{timeframes.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2">
											{timeframes.map((timeframe, index) => (
												<div
													key={index}
													className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
												>
													<span className="text-xs">{timeframe}</span>
													<button
														type="button"
														onClick={() => handleRemoveTimeframe(index)}
														disabled={isSubmitting}
														className="text-muted-foreground hover:text-foreground"
													>
														<XIcon className="size-3" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Market Conditions */}
								<div className="space-y-2">
									<Label htmlFor="condition">Market Conditions</Label>
									<div className="flex gap-2">
										<Input
											id="condition"
											value={conditionInput}
											onChange={(e) => setConditionInput(e.target.value)}
											placeholder="Trending"
											disabled={isSubmitting}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddCondition();
												}
											}}
										/>
										<Button
											type="button"
											variant="outline"
											size="default"
											onClick={handleAddCondition}
											disabled={isSubmitting || !conditionInput.trim()}
										>
											<PlusIcon className="size-4" />
										</Button>
									</div>
									{marketConditions.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2">
											{marketConditions.map((condition, index) => (
												<div
													key={index}
													className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
												>
													<span className="text-xs">{condition}</span>
													<button
														type="button"
														onClick={() => handleRemoveCondition(index)}
														disabled={isSubmitting}
														className="text-muted-foreground hover:text-foreground"
													>
														<XIcon className="size-3" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>

								{/* Protocol Flags */}
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
									<div className="flex items-center space-x-2">
										<Switch
											id="hedgingEnabled"
											checked={hedgingEnabled}
											onCheckedChange={setHedgingEnabled}
											disabled={isSubmitting}
										/>
										<Label htmlFor="hedgingEnabled" className="cursor-pointer text-sm">
											Hedging Enabled
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Switch
											id="scalingEnabled"
											checked={scalingEnabled}
											onCheckedChange={setScalingEnabled}
											disabled={isSubmitting}
										/>
										<Label htmlFor="scalingEnabled" className="cursor-pointer text-sm">
											Scaling Enabled
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Switch
											id="trailingStopEnabled"
											checked={trailingStopEnabled}
											onCheckedChange={setTrailingStopEnabled}
											disabled={isSubmitting}
										/>
										<Label htmlFor="trailingStopEnabled" className="cursor-pointer text-sm">
											Trailing Stop
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Switch
											id="dynamicPositionSizing"
											checked={dynamicPositionSizing}
											onCheckedChange={setDynamicPositionSizing}
											disabled={isSubmitting}
										/>
										<Label
											htmlFor="dynamicPositionSizing"
											className="cursor-pointer text-sm"
										>
											Dynamic Sizing
										</Label>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Step 4: Review & Confirm */}
					{currentStep === 3 && (
						<div className="space-y-4">
							<h3 className="text-sm font-semibold text-foreground">
								Review & Confirm
							</h3>
							<div className="space-y-4 p-4 border rounded-lg bg-muted/30">
								<div className="space-y-3">
									<div>
										<Label className="text-xs text-muted-foreground">Account ID</Label>
										<p className="text-sm font-medium">{nid || "—"}</p>
									</div>
									<div>
										<Label className="text-xs text-muted-foreground">Exchange</Label>
										<p className="text-sm font-medium capitalize">{exchange || "—"}</p>
									</div>
									<div>
										<Label className="text-xs text-muted-foreground">Status</Label>
										<p className="text-sm font-medium capitalize">{status}</p>
									</div>
									<div>
										<Label className="text-xs text-muted-foreground">Strategy</Label>
										<p className="text-sm font-medium">{strategy}</p>
									</div>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className={cn(
						"flex items-center justify-between",
						mobile && "sticky bottom-0 bg-background border-t p-4 mt-4"
					)}>
						<div className="flex gap-2">
							{currentStep > 0 && (
								<Button
									type="button"
									variant="outline"
									onClick={handlePreviousStep}
									disabled={isSubmitting}
									aria-label="Previous step"
								>
									<ChevronLeft className="size-4 mr-2" />
									Previous
								</Button>
							)}
							<Button
								type="button"
								variant="ghost"
								onClick={handleClose}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
						</div>
						<div className="flex gap-2">
							{currentStep < totalSteps - 1 ? (
								<Button
									type="submit"
									onClick={(e) => {
										e.preventDefault();
										handleNextStep();
									}}
									disabled={isSubmitting}
									aria-label="Next step"
								>
									Next
									<ChevronRight className="size-4 ml-2" />
								</Button>
							) : (
								<Button
									type="submit"
									disabled={isSubmitting}
									aria-label="Save changes"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="size-4 mr-2 animate-spin" />
											Saving...
										</>
									) : (
										<>
											<CheckCircle2 className="size-4 mr-2" />
											Save Changes
										</>
									)}
								</Button>
							)}
						</div>
					</DialogFooter>
				</form>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
