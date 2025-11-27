/**
 * Add Account Dialog Component
 * Professional form for adding trading accounts to the wallet
 */

import React, { useState, useCallback } from "react";
import { PlusIcon, XIcon, AlertCircleIcon } from "lucide-react";
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
import { useAuthStore } from "@/stores";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import type { AccountRequest, ProtocolData } from "@/lib/api-types";

interface AddAccountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
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
 * Add Account Dialog Component
 */
export function AddAccountDialog({
	open,
	onOpenChange,
}: AddAccountDialogProps): React.ReactElement {
	const { wallet, connectionSession } = useAuthStore();
	const { sendAccountToServer } = useAccountsStore();

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

	// Protocol fields - always required with default values
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

	/**
	 * Reset form to initial state
	 */
	const resetForm = useCallback((): void => {
		setNid("");
		setConnection(true);
		setExchange("");
		setNote("");
		setApiKey("");
		setSecret("");
		setStatus("active");
		setPassword("");
		setViewers([]);
		setViewerInput("");
		setStrategy("Anna Ariadna");
		setTradingStyle("Intelligent Position Trading");
		setMaxRiskPerTrade(1);
		setMaxLeverage(5);
		setMaxDrawdown(15);
		setStopLoss(3);
		setTakeProfit(9);
		setRiskRewardRatio(3);
		setPositionSizing("Dynamic Volatility Adjusted");
		setPortfolioAllocation(75);
		setSlippageTolerance(0.25);
		setMarkets(["BTC/USDT", "ETH/USDT", "SOL/USDT"]);
		setMarketInput("");
		setOrderTypes(["Limit", "Stop-Limit"]);
		setOrderTypeInput("");
		setTimeframes(["1d", "3d", "1w"]);
		setTimeframeInput("");
		setMarketConditions(["Trending", "High Volume"]);
		setConditionInput("");
		setHedgingEnabled(true);
		setScalingEnabled(true);
		setTrailingStopEnabled(true);
		setDynamicPositionSizing(true);
		setError(null);
		setErrors({});
	}, []);

	/**
	 * Validate form data
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

		// Protocol is always required
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
	 * Add viewer address
	 */
	const handleAddViewer = useCallback((): void => {
		if (viewerInput.trim() && !viewers.includes(viewerInput.trim())) {
			setViewers([...viewers, viewerInput.trim()]);
			setViewerInput("");
		}
	}, [viewerInput, viewers]);

	/**
	 * Remove viewer address
	 */
	const handleRemoveViewer = useCallback(
		(index: number): void => {
			setViewers(viewers.filter((_, i) => i !== index));
		},
		[viewers],
	);

	/**
	 * Add market
	 */
	const handleAddMarket = useCallback((): void => {
		if (marketInput.trim() && !markets.includes(marketInput.trim())) {
			setMarkets([...markets, marketInput.trim()]);
			setMarketInput("");
		}
	}, [marketInput, markets]);

	/**
	 * Remove market
	 */
	const handleRemoveMarket = useCallback(
		(index: number): void => {
			setMarkets(markets.filter((_, i) => i !== index));
		},
		[markets],
	);

	/**
	 * Add order type
	 */
	const handleAddOrderType = useCallback((): void => {
		if (orderTypeInput.trim() && !orderTypes.includes(orderTypeInput.trim())) {
			setOrderTypes([...orderTypes, orderTypeInput.trim()]);
			setOrderTypeInput("");
		}
	}, [orderTypeInput, orderTypes]);

	/**
	 * Remove order type
	 */
	const handleRemoveOrderType = useCallback(
		(index: number): void => {
			setOrderTypes(orderTypes.filter((_, i) => i !== index));
		},
		[orderTypes],
	);

	/**
	 * Add timeframe
	 */
	const handleAddTimeframe = useCallback((): void => {
		if (timeframeInput.trim() && !timeframes.includes(timeframeInput.trim())) {
			setTimeframes([...timeframes, timeframeInput.trim()]);
			setTimeframeInput("");
		}
	}, [timeframeInput, timeframes]);

	/**
	 * Remove timeframe
	 */
	const handleRemoveTimeframe = useCallback(
		(index: number): void => {
			setTimeframes(timeframes.filter((_, i) => i !== index));
		},
		[timeframes],
	);

	/**
	 * Add market condition
	 */
	const handleAddCondition = useCallback((): void => {
		if (conditionInput.trim() && !marketConditions.includes(conditionInput.trim())) {
			setMarketConditions([...marketConditions, conditionInput.trim()]);
			setConditionInput("");
		}
	}, [conditionInput, marketConditions]);

	/**
	 * Remove market condition
	 */
	const handleRemoveCondition = useCallback(
		(index: number): void => {
			setMarketConditions(marketConditions.filter((_, i) => i !== index));
		},
		[marketConditions],
	);

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

			const account: AccountRequest = {
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

			// Send to server - use compressed public key as per example
			// Example shows compressed public key (66 chars starting with 03/02)
			// Use accounts store method which handles signing correctly
			await sendAccountToServer(
				account,
				wallet,
				connectionSession.session,
				connectionSession.api,
			);

			// Close dialog and reset form
			resetForm();
			onOpenChange(false);
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to add account";
			setError(errorMessage);

		} finally {
			setIsSubmitting(false);
		}
	}, [
		wallet,
		connectionSession,
		validateForm,
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
		resetForm,
		onOpenChange,
	]);

	/**
	 * Handle dialog close
	 */
	const handleClose = useCallback((): void => {
		if (!isSubmitting) {
			resetForm();
			onOpenChange(false);
		}
	}, [isSubmitting, resetForm, onOpenChange]);

	if (!wallet || !connectionSession) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cannot Add Account</DialogTitle>
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
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add Trading Account</DialogTitle>
					<DialogDescription>
						Add a new trading account to your wallet with API credentials and trading
						protocol settings.
					</DialogDescription>
				</DialogHeader>

				{error && (
					<Alert variant="destructive">
						<AlertCircleIcon className="size-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
					className="space-y-6"
				>
					{/* Basic Account Information */}
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

					{/* Protocol Settings */}
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

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Adding..." : "Add Account"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
