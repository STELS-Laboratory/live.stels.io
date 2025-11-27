/**
 * Order Controller Component
 * Controls for creating new orders
 */

import React, { useEffect, useMemo, useState } from "react";
import { useTradingStore } from "../store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CardTitle } from "@/components/ui/card";
import { useTradingApi } from "../hooks/use-trading-api";
import { useTradingSymbols } from "../hooks/use-trading-symbols";
import { toast } from "@/stores";
import { cn } from "@/lib/utils";
import {
	formatBalance,
	formatCost,
	formatPercentage,
	formatPrice,
	formatUSD,
	getPricePrecision,
} from "../lib/formatting";
import type { CreateOrderParams, TradingOrder } from "../types";
import {
	AlertCircle,
	ArrowDownRight,
	ArrowUpRight,
	CheckCircle2,
	Loader2,
	XCircle,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

/**
 * Order Controller Component
 */
export function OrderController(): React.ReactElement {
	const {
		selectedAccount,
		selectedSymbol,
		ticker,
		balance,
		loading,
		setLoading,
		addOrder,
		removeOrder,
		refreshOrders,
		refreshBalance,
		selectedPrice,
		setSelectedPrice,
		isViewOnly,
	} = useTradingStore();
	const api = useTradingApi();
	const tradingSymbols = useTradingSymbols(selectedAccount);
	
	// Check if selected symbol is allowed for trading
	const isTradingAllowed = useMemo(() => {
		if (!selectedSymbol || !selectedAccount) return false;
		return tradingSymbols.includes(selectedSymbol);
	}, [selectedSymbol, selectedAccount, tradingSymbols]);

	const [side, setSide] = useState<"buy" | "sell">("buy");
	const [type, setType] = useState<"market" | "limit" | "stop" | "stopLimit">(
		"limit",
	);
	const [amount, setAmount] = useState<string>("");
	const [price, setPrice] = useState<string>("");
	const [stopPrice, setStopPrice] = useState<string>("");
	const [timeInForce, setTimeInForce] = useState<"GTC" | "IOC" | "FOK">("GTC");
	const [reduceOnly, setReduceOnly] = useState<boolean>(false);
	const [orderStatus, setOrderStatus] = useState<
		"idle" | "processing" | "success" | "error"
	>("idle");
	const [orderMessage, setOrderMessage] = useState<string>("");
	const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [pendingOrder, setPendingOrder] = useState<TradingOrder | null>(null);

	// Update price when selectedPrice changes from order book
	useEffect(() => {
		if (selectedPrice !== null && type === "limit") {
			// Format price for input (without commas, with proper precision)
			const precision = getPricePrecision(selectedPrice);
			const formattedPrice = selectedPrice.toFixed(precision);
			setPrice(formattedPrice);
			setSelectedPrice(null); // Clear after using
		}
	}, [selectedPrice, type, setSelectedPrice]);

	// Parse symbol to get base and quote currencies
	const { baseCurrency, quoteCurrency } = useMemo(() => {
		if (!selectedSymbol) return { baseCurrency: null, quoteCurrency: null };
		const [base, quote] = selectedSymbol.split("/");
		// Ensure uppercase for consistency with balance keys (USDT, not usdt)
		return {
			baseCurrency: base?.toUpperCase() || null,
			quoteCurrency: quote?.toUpperCase() || null,
		};
	}, [selectedSymbol]);

	// Get available balance for current side
	const availableBalance = useMemo(() => {
		if (!balance || !baseCurrency || !quoteCurrency) {
			return null;
		}

		const currency = side === "buy" ? quoteCurrency : baseCurrency;
		const currencyBalance = balance.balances[currency];

		if (!currencyBalance) {
			return null;
		}

		return {
			currency,
			free: currencyBalance.free || 0,
			used: currencyBalance.used || 0,
			total: currencyBalance.total || 0,
		};
	}, [
		balance,
		baseCurrency,
		quoteCurrency,
		side,
	]);

	// Calculate maximum amount that can be bought/sold
	const maxAmount = useMemo(() => {
		if (!availableBalance || !ticker) return 0;

		if (side === "buy") {
			// For buy: available balance in quote currency (USDT) / price
			const orderPrice = price && price.trim() !== ""
				? Number.parseFloat(price)
				: ticker.last;
			if (!orderPrice || orderPrice <= 0 || isNaN(orderPrice)) return 0;
			const max = availableBalance.free / orderPrice;
			return isNaN(max) || max <= 0 ? 0 : max;
		} else {
			// For sell: available balance in base currency (SOL)
			return availableBalance.free;
		}
	}, [availableBalance, ticker, side, price]);

	// Calculate total cost/value
	const totalCost = useMemo(() => {
		if (!amount || !ticker) return 0;

		const amountNum = Number.parseFloat(amount);
		if (isNaN(amountNum) || amountNum <= 0) return 0;

		const orderPrice = price && price.trim() !== ""
			? Number.parseFloat(price)
			: ticker.last;
		if (!orderPrice || orderPrice <= 0 || isNaN(orderPrice)) return 0;

		const cost = amountNum * orderPrice;
		return isNaN(cost) || cost <= 0 ? 0 : cost;
	}, [amount, price, ticker]);

	// Helper function to check if a string represents a valid positive number
	const isValidPositiveNumber = (value: string): boolean => {
		if (!value || value.trim() === "") return false;
		const num = Number.parseFloat(value.trim());
		return !isNaN(num) && num > 0;
	};

	// Calculate safe maximum amount that won't exceed balance after rounding
	const safeMaxAmount = useMemo(() => {
		if (!availableBalance || !ticker || maxAmount <= 0) return 0;

		if (side === "buy") {
			// For buy: need to ensure that rounded amount * price <= available balance
			const orderPrice = price && price.trim() !== ""
				? Number.parseFloat(price)
				: ticker.last;
			if (!orderPrice || orderPrice <= 0 || isNaN(orderPrice)) return 0;

			// Round down to 4 decimal places
			let safeAmount = Math.floor(maxAmount * 10000) / 10000;

			// Verify that this amount doesn't exceed balance
			// If it does, reduce by one step (0.0001)
			while (
				safeAmount > 0 && safeAmount * orderPrice > availableBalance.free
			) {
				safeAmount = Math.max(0, safeAmount - 0.0001);
			}

			return safeAmount;
		} else {
			// For sell: just round down the available balance to 4 decimal places
			return Math.floor(availableBalance.free * 10000) / 10000;
		}
	}, [availableBalance, ticker, side, price, maxAmount]);

	// Validation errors with proper floating point comparison
	const validationErrors = useMemo(() => {
		const errors: string[] = [];
		const EPSILON = 0.0001; // Small epsilon for floating point comparison

		// Validate amount - only show error if field was touched or form is being submitted
		if (!amount || amount.trim() === "" || !isValidPositiveNumber(amount)) {
			if (touchedFields.has("amount") || orderStatus === "error") {
				errors.push("Amount is required");
			}
		} else {
			const amountNum = Number.parseFloat(amount.trim());
			if (isNaN(amountNum) || amountNum <= 0) {
				if (touchedFields.has("amount") || orderStatus === "error") {
					errors.push("Amount must be a positive number");
				}
			} else {
				// Check balance with epsilon tolerance
				if (availableBalance) {
					if (side === "buy") {
						// For buy: check if total cost exceeds available quote currency
						// Allow small rounding differences (use >= with epsilon)
						if (totalCost > availableBalance.free + EPSILON) {
							errors.push(
								`Insufficient ${quoteCurrency} balance. Available: ${
									formatBalance(availableBalance.free)
								} ${quoteCurrency}`,
							);
						}
					} else {
						// For sell: check if amount exceeds available base currency
						// Allow small rounding differences (use >= with epsilon)
						if (amountNum > availableBalance.free + EPSILON) {
							errors.push(
								`Insufficient ${baseCurrency} balance. Available: ${
									formatBalance(availableBalance.free)
								} ${baseCurrency}`,
							);
						}
					}
				}

				// Check if amount exceeds maximum (with epsilon tolerance)
				// Allow using exactly the maximum amount
				if (safeMaxAmount > 0 && amountNum > safeMaxAmount + EPSILON) {
					errors.push(
						`Amount exceeds maximum available. Max: ${
							formatBalance(safeMaxAmount)
						} ${baseCurrency}`,
					);
				}
			}
		}

		// Validate price for limit and stopLimit orders
		if (type === "limit" || type === "stopLimit") {
			if (!price || price.trim() === "" || !isValidPositiveNumber(price)) {
				if (touchedFields.has("price") || orderStatus === "error") {
					errors.push("Price is required for limit orders");
				}
			} else {
				const priceNum = Number.parseFloat(price.trim());
				if (isNaN(priceNum) || priceNum <= 0) {
					if (touchedFields.has("price") || orderStatus === "error") {
						errors.push("Price must be a positive number");
					}
				}
			}
		}

		// Validate stop price for stop and stopLimit orders
		if (type === "stop" || type === "stopLimit") {
			if (
				!stopPrice || stopPrice.trim() === "" ||
				!isValidPositiveNumber(stopPrice)
			) {
				if (touchedFields.has("stopPrice") || orderStatus === "error") {
					errors.push("Stop price is required");
				}
			} else {
				const stopPriceNum = Number.parseFloat(stopPrice.trim());
				if (isNaN(stopPriceNum) || stopPriceNum <= 0) {
					if (touchedFields.has("stopPrice") || orderStatus === "error") {
						errors.push("Stop price must be a positive number");
					}
				}
			}
		}

		return errors;
	}, [
		amount,
		price,
		stopPrice,
		type,
		side,
		availableBalance,
		totalCost,
		safeMaxAmount,
		baseCurrency,
		quoteCurrency,
		touchedFields,
		orderStatus,
	]);

	const handleCreateOrder = async (): Promise<void> => {
		if (isViewOnly) {
			toast.info("View-only mode", "Please add an account to create orders");
			return;
		}

		if (!selectedAccount) {
			toast.error("Please select an account");
			setOrderStatus("error");
			setOrderMessage("Account not selected");
			return;
		}

		if (!selectedSymbol) {
			toast.error("Please select a trading pair");
			setOrderStatus("error");
			setOrderMessage("Trading pair not selected");
			return;
		}

		// Check if symbol is allowed for trading
		if (!isTradingAllowed) {
			toast.error(
				"Trading not allowed",
				`${selectedSymbol} is not in your trading protocol. You can view market data but cannot create orders.`,
			);
			setOrderStatus("error");
			setOrderMessage(`${selectedSymbol} is not allowed for trading`);
			return;
		}

		// Mark all fields as touched when submitting
		const allFieldsTouched = new Set(["amount", "price", "stopPrice"]);
		setTouchedFields(allFieldsTouched);

		// Re-validate with all fields touched
		const submitErrors: string[] = [];
		const EPSILON = 0.0001;

		// Validate amount
		if (!amount || amount.trim() === "" || !isValidPositiveNumber(amount)) {
			submitErrors.push("Amount is required");
		} else {
			const amountNum = Number.parseFloat(amount.trim());
			if (isNaN(amountNum) || amountNum <= 0) {
				submitErrors.push("Amount must be a positive number");
			} else if (availableBalance) {
				if (side === "buy") {
					if (totalCost > availableBalance.free + EPSILON) {
						submitErrors.push(
							`Insufficient ${quoteCurrency} balance. Available: ${
								formatBalance(availableBalance.free)
							} ${quoteCurrency}`,
						);
					}
				} else {
					if (amountNum > availableBalance.free + EPSILON) {
						submitErrors.push(
							`Insufficient ${baseCurrency} balance. Available: ${
								formatBalance(availableBalance.free)
							} ${baseCurrency}`,
						);
					}
				}
			}
			if (safeMaxAmount > 0 && amountNum > safeMaxAmount + EPSILON) {
				submitErrors.push(
					`Amount exceeds maximum available. Max: ${
						formatBalance(safeMaxAmount)
					} ${baseCurrency}`,
				);
			}
		}

		// Validate price
		if (type === "limit" || type === "stopLimit") {
			if (!price || price.trim() === "" || !isValidPositiveNumber(price)) {
				submitErrors.push("Price is required for limit orders");
			} else {
				const priceNum = Number.parseFloat(price.trim());
				if (isNaN(priceNum) || priceNum <= 0) {
					submitErrors.push("Price must be a positive number");
				}
			}
		}

		// Validate stop price
		if (type === "stop" || type === "stopLimit") {
			if (
				!stopPrice || stopPrice.trim() === "" ||
				!isValidPositiveNumber(stopPrice)
			) {
				submitErrors.push("Stop price is required");
			} else {
				const stopPriceNum = Number.parseFloat(stopPrice.trim());
				if (isNaN(stopPriceNum) || stopPriceNum <= 0) {
					submitErrors.push("Stop price must be a positive number");
				}
			}
		}

		if (submitErrors.length > 0) {
			const firstError = submitErrors[0];
			toast.error(firstError);
			setOrderStatus("error");
			setOrderMessage(firstError);
			return;
		}

		// Check if order is large (>10% of balance) and requires confirmation
		const amountNum = Number.parseFloat(amount.trim());
		let requiresConfirmation = false;
		if (availableBalance) {
			if (side === "buy") {
				const balancePercent = (totalCost / availableBalance.total) * 100;
				requiresConfirmation = balancePercent > 10;
			} else {
				const balancePercent = (amountNum / availableBalance.total) * 100;
				requiresConfirmation = balancePercent > 10;
			}
		}

		// If large order, show confirmation dialog
		if (requiresConfirmation) {
			const tempOrder: TradingOrder = {
				id: `pending-${Date.now()}`,
				symbol: selectedSymbol,
				type,
				side,
				amount: amountNum,
				price: price ? Number.parseFloat(price) : undefined,
				stopPrice: stopPrice ? Number.parseFloat(stopPrice) : undefined,
				status: "open",
				timestamp: Date.now(),
			};
			setPendingOrder(tempOrder);
			setConfirmDialogOpen(true);
			return;
		}

		// Proceed with order creation
		await createOrderInternal();
	};

	const createOrderInternal = async (): Promise<void> => {
		if (!selectedAccount || !selectedSymbol || !amount) return;

		const amountNum = Number.parseFloat(amount.trim());
		const params: CreateOrderParams = {
			nid: selectedAccount.nid,
			symbol: selectedSymbol,
			type,
			side,
			amount: amountNum,
			timeInForce,
			reduceOnly,
		};

		if (price) {
			params.price = Number.parseFloat(price);
		}

		if (stopPrice) {
			params.stopPrice = Number.parseFloat(stopPrice);
		}

		// Create optimistic order with pending status
		const optimisticOrder: TradingOrder = {
			id: `pending-${Date.now()}`,
			clientOrderId: `optimistic-${Date.now()}`,
			symbol: selectedSymbol,
			type,
			side,
			amount: amountNum,
			price: params.price,
			stopPrice: params.stopPrice,
			status: "open", // Will be updated when real order is created
			timestamp: Date.now(),
			datetime: new Date().toISOString(),
		};

		// Add optimistic order immediately
		addOrder(optimisticOrder);

		// Optimistically update balance
		if (balance && availableBalance) {
			const updatedBalance = { ...balance };
			if (side === "buy") {
				const currency = quoteCurrency || "";
				if (updatedBalance.balances[currency]) {
					updatedBalance.balances[currency] = {
						...updatedBalance.balances[currency],
						free: updatedBalance.balances[currency].free -
							(params.price || 0) * amountNum,
						used: updatedBalance.balances[currency].used +
							(params.price || 0) * amountNum,
					};
				}
			} else {
				const currency = baseCurrency || "";
				if (updatedBalance.balances[currency]) {
					updatedBalance.balances[currency] = {
						...updatedBalance.balances[currency],
						free: updatedBalance.balances[currency].free - amountNum,
						used: updatedBalance.balances[currency].used + amountNum,
					};
				}
			}
			// Note: We don't update balance in store here to avoid conflicts with real-time updates
		}

		try {
			setLoading(true);
			setOrderStatus("processing");
			setOrderMessage(`Creating ${side.toUpperCase()} ${type} order...`);

			const order = await api.createOrder(params);

			// Replace optimistic order with real order
			removeOrder(optimisticOrder.id);
			addOrder(order);

			setOrderStatus("success");
			setOrderMessage(
				`Order created successfully! ID: ${order.id.slice(0, 8)}...`,
			);
			toast.success(
				`Order created: ${side.toUpperCase()} ${amount} ${
					selectedSymbol.split("/")[0]
				}`,
			);

			// Reset form after short delay to show success message
			setTimeout(() => {
				setAmount("");
				setPrice("");
				setStopPrice("");
				setOrderStatus("idle");
				setOrderMessage("");
			}, 2000);

			// Refresh orders and balance
			await refreshOrders();
			await refreshBalance();
		} catch (error: unknown) {
			// Rollback optimistic order on error
			removeOrder(optimisticOrder.id);

			const message = error instanceof Error
				? error.message
				: "Failed to create order";
			setOrderStatus("error");
			setOrderMessage(message);
			toast.error("Order creation failed", message);
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmOrder = async (): Promise<void> => {
		setConfirmDialogOpen(false);
		await createOrderInternal();
		setPendingOrder(null);
	};

	const handleCancelConfirm = (): void => {
		setConfirmDialogOpen(false);
		setPendingOrder(null);
	};

	const isBuy = side === "buy";
	const isLimit = type === "limit";
	const isStop = type === "stop" || type === "stopLimit";

	// Show view-only message if no account
	if (isViewOnly || !selectedAccount) {
		return (
			<div className="h-full flex flex-col overflow-hidden bg-background">
				{/* Professional Header */}
				<div className="flex-shrink-0 px-4 py-3 border-b border-border bg-muted/20">
					<CardTitle className="text-sm font-bold uppercase tracking-wider">
						Place Order
					</CardTitle>
					{selectedSymbol && (
						<div className="text-xs text-muted-foreground mt-0.5 font-mono">
							{selectedSymbol}
						</div>
					)}
				</div>

				{/* View-only mode message */}
				<div className="flex-1 flex items-center justify-center px-4 py-8">
					<div className="text-center max-w-md space-y-3">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-2">
							<AlertCircle className="icon-lg text-amber-500" />
						</div>
						<div className="text-sm font-semibold text-foreground">
							View-Only Mode
						</div>
						<div className="text-xs text-muted-foreground space-y-1">
							<p>
								You can view market data, order book, and trades without an account.
							</p>
							<p>
								To create orders, please add a trading account in the Wallet app.
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col overflow-hidden bg-background">
			{/* Professional Header */}
			<div className="flex-shrink-0 px-4 py-3 border-b border-border bg-muted/20">
				<CardTitle className="text-sm font-bold uppercase tracking-wider">
					Place Order
				</CardTitle>
				{selectedSymbol && (
					<div className="text-xs text-muted-foreground mt-0.5 font-mono">
						{selectedSymbol}
					</div>
				)}
			</div>

			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
				{/* Warning if symbol is not allowed for trading */}
				{selectedAccount && selectedSymbol && !isTradingAllowed && (
					<div className="flex items-start gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/30">
						<AlertCircle className="size-4 text-amber-500 mt-0.5 flex-shrink-0" />
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold text-amber-500">
								Trading Not Allowed
							</span>
							<span className="text-xs text-amber-500/90">
								{selectedSymbol} is not in your trading protocol. You can view market data but cannot create orders for this pair.
							</span>
						</div>
					</div>
				)}

				{/* Side Selection - Prominent */}
				<div className="grid grid-cols-2 gap-2">
					<Button
						variant={isBuy ? "default" : "outline"}
						size="lg"
						onClick={() => {
							setSide("buy");
						}}
						className={cn(
							"h-12 font-semibold text-base transition-all",
							isBuy
								? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
								: "border-2 hover:border-green-500/50",
						)}
					>
						Buy
					</Button>
					<Button
						variant={!isBuy ? "default" : "outline"}
						size="lg"
						onClick={() => {
							setSide("sell");
						}}
						className={cn(
							"h-12 font-semibold text-base transition-all",
							!isBuy
								? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
								: "border-2 hover:border-red-500/50",
						)}
					>
						Sell
					</Button>
				</div>

				{/* Available Balance Display */}
				{selectedAccount && selectedSymbol && (
					<div className="p-3 rounded bg-muted/50 border border-border/50">
						<div className="flex items-center justify-between mb-2">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
								Available Balance
							</span>
							{availableBalance && safeMaxAmount > 0 && (
								<button
									type="button"
									onClick={() => {
										setAmount(formatBalance(safeMaxAmount));
									}}
									className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
								>
									Use Max
								</button>
							)}
						</div>
						{availableBalance
							? (
								<>
									<div className="flex items-baseline gap-2">
										<span className="text-lg font-bold font-mono text-foreground">
											{formatBalance(availableBalance.free)}
										</span>
										<span className="text-sm font-medium text-muted-foreground">
											{availableBalance.currency}
										</span>
									</div>
									{side === "buy" && ticker && (
										<div className="text-xs text-muted-foreground mt-1">
											Max: {formatBalance(safeMaxAmount)} {baseCurrency} @{" "}
											{price || formatPrice(ticker.last)} {quoteCurrency}
										</div>
									)}
									{side === "sell" && (
										<div className="text-xs text-muted-foreground mt-1">
											Max: {formatBalance(safeMaxAmount)} {baseCurrency}
										</div>
									)}
								</>
							)
							: (
								<div className="flex flex-col gap-1">
									<div className="text-sm text-muted-foreground">
										{balance
											? `No ${
												side === "buy" ? quoteCurrency : baseCurrency
											} balance available`
											: !selectedAccount
											? "Select an account to view balance"
											: "Loading balance..."}
									</div>
									{balance && baseCurrency && quoteCurrency && (() => {
										try {
											if (
												!balance.balances ||
												typeof balance.balances !== "object" ||
												Array.isArray(balance.balances)
											) {
												return null;
											}

											// Get all currency keys that have valid balance objects
											const currencies: string[] = [];
											const allKeys = Object.keys(balance.balances);

											for (const key of allKeys) {
												// Explicitly convert to string
												const keyStr = String(key);
												const bal = balance.balances[keyStr];

												if (
													bal &&
													typeof bal === "object" &&
													!Array.isArray(bal) &&
													("free" in bal || "used" in bal || "total" in bal)
												) {
													currencies.push(keyStr);
												}
											}

											if (currencies.length === 0) {
												return null;
											}

											// Ensure all items are strings before joining
											const currencyStrings = currencies.map((c) => String(c));

											return (
												<div className="text-xs text-muted-foreground/70">
													Available currencies: {currencyStrings.join(", ")}
												</div>
											);
										} catch {
											return null;
										}
									})()}
								</div>
							)}
					</div>
				)}

				{/* Current Price Display - Enhanced */}
				{ticker && (
					<div className="flex items-center justify-between p-3 rounded bg-muted/50 border border-border/50">
						<div className="flex flex-col">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
								Market Price
							</span>
							<span
								className={cn(
									"text-xl font-bold font-mono",
									ticker.change >= 0
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400",
								)}
							>
								{formatPrice(ticker.last)}
							</span>
							<span className="text-xs text-green-600 dark:text-green-400 font-mono mt-0.5">
								≈${formatUSD(ticker.last)} USD
							</span>
						</div>
						<div className="flex flex-col items-end">
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
								24h Change
							</span>
							<span
								className={cn(
									"text-sm font-bold font-mono",
									ticker.change >= 0
										? "text-green-600 dark:text-green-400"
										: "text-red-600 dark:text-red-400",
								)}
							>
								{ticker.change >= 0 ? "+" : ""}
								{formatPercentage(ticker.percentage ?? 0)}%
							</span>
						</div>
					</div>
				)}

				{/* Order Type - Enhanced */}
				<div className="space-y-2">
					<Label
						htmlFor="order-type"
						className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
					>
						Order Type
					</Label>
					<Select
						value={type}
						onValueChange={(value) => {
							setType(value as typeof type);
						}}
					>
						<SelectTrigger id="order-type" className="h-11 font-medium">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="market">Market</SelectItem>
							<SelectItem value="limit">Limit</SelectItem>
							<SelectItem value="stop">Stop</SelectItem>
							<SelectItem value="stopLimit">Stop Limit</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Amount - Enhanced with Validation */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label
							htmlFor="amount"
							className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
						>
							Amount ({baseCurrency})
						</Label>
						{totalCost > 0 && side === "buy" && (
							<span className="text-[10px] text-muted-foreground font-mono">
								≈ {formatCost(totalCost)} {quoteCurrency}
							</span>
						)}
					</div>
					<Input
						id="amount"
						type="number"
						step="0.0001"
						min="0"
						value={amount}
						onChange={(e) => {
							setAmount(e.target.value);
							setOrderStatus("idle");
							setOrderMessage("");
						}}
						onBlur={() => {
							setTouchedFields((prev) => new Set(prev).add("amount"));
						}}
						placeholder="0.0000"
						className={cn(
							"h-11 font-mono text-base font-semibold",
							validationErrors.some((e) =>
									e.includes("Amount") || e.includes("balance") ||
									e.includes("maximum")
								)
								? "border-destructive focus-visible:ring-destructive"
								: "",
						)}
						aria-invalid={validationErrors.some((e) =>
							e.includes("Amount") || e.includes("balance") ||
							e.includes("maximum")
						)}
					/>
					{(touchedFields.has("amount") || orderStatus === "error") &&
						validationErrors.some((e) =>
							e.includes("Amount") || e.includes("balance") ||
							e.includes("maximum")
						) && (
						<div className="flex items-center gap-1.5 text-xs text-destructive">
							<AlertCircle className="size-3" />
							<span>
								{validationErrors.find((e) =>
									e.includes("Amount") || e.includes("balance") ||
									e.includes("maximum")
								)}
							</span>
						</div>
					)}
				</div>

				{/* Price (for limit and stopLimit) - Enhanced with Validation */}
				{(isLimit || type === "stopLimit") && (
					<div className="space-y-2">
						<Label
							htmlFor="price"
							className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
						>
							Price ({quoteCurrency})
						</Label>
						<div className="flex items-center gap-2">
							<Input
								id="price"
								type="number"
								step="0.01"
								min="0"
								value={price}
								onChange={(e) => {
									setPrice(e.target.value);
									setOrderStatus("idle");
									setOrderMessage("");
								}}
								onBlur={() => {
									setTouchedFields((prev) => new Set(prev).add("price"));
								}}
								placeholder={ticker?.last
									? formatPrice(ticker.last)
									: "0.00000"}
								className={cn(
									"h-11 font-mono text-base font-semibold flex-1",
									validationErrors.some((e) => e.includes("Price"))
										? "border-destructive focus-visible:ring-destructive"
										: "",
								)}
								aria-invalid={validationErrors.some((e) => e.includes("Price"))}
							/>
							{ticker && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										// Format price for input (without commas, with proper precision)
										const precision = getPricePrecision(ticker.last);
										setPrice(ticker.last.toFixed(precision));
									}}
									className="h-11 px-3 text-xs font-medium"
								>
									Market
								</Button>
							)}
						</div>
						{(touchedFields.has("price") || orderStatus === "error") &&
							validationErrors.some((e) => e.includes("Price")) && (
							<div className="flex items-center gap-1.5 text-xs text-destructive">
								<AlertCircle className="size-3" />
								<span>{validationErrors.find((e) => e.includes("Price"))}</span>
							</div>
						)}
					</div>
				)}

				{/* Stop Price (for stop and stopLimit) - Enhanced with Validation */}
				{isStop && (
					<div className="space-y-2">
						<Label
							htmlFor="stop-price"
							className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
						>
							Stop Price ({quoteCurrency})
						</Label>
						<Input
							id="stop-price"
							type="number"
							step="0.01"
							min="0"
							value={stopPrice}
							onChange={(e) => {
								setStopPrice(e.target.value);
								setOrderStatus("idle");
								setOrderMessage("");
							}}
							onBlur={() => {
								setTouchedFields((prev) => new Set(prev).add("stopPrice"));
							}}
							placeholder="0.00000"
							className={cn(
								"h-11 font-mono text-base font-semibold",
								validationErrors.some((e) => e.includes("Stop"))
									? "border-destructive focus-visible:ring-destructive"
									: "",
							)}
							aria-invalid={validationErrors.some((e) => e.includes("Stop"))}
						/>
						{(touchedFields.has("stopPrice") || orderStatus === "error") &&
							validationErrors.some((e) => e.includes("Stop")) && (
							<div className="flex items-center gap-1.5 text-xs text-destructive">
								<AlertCircle className="size-3" />
								<span>{validationErrors.find((e) => e.includes("Stop"))}</span>
							</div>
						)}
					</div>
				)}

				{/* Time In Force (for limit orders) - Enhanced */}
				{isLimit && (
					<div className="space-y-2">
						<Label
							htmlFor="time-in-force"
							className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
						>
							Time In Force
						</Label>
						<Select
							value={timeInForce}
							onValueChange={(value) => {
								setTimeInForce(value as typeof timeInForce);
							}}
						>
							<SelectTrigger id="time-in-force" className="h-11 font-medium">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="GTC">GTC (Good Till Cancel)</SelectItem>
								<SelectItem value="IOC">IOC (Immediate Or Cancel)</SelectItem>
								<SelectItem value="FOK">FOK (Fill Or Kill)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Reduce Only */}
				<div className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-border/50">
					<input
						type="checkbox"
						id="reduce-only"
						checked={reduceOnly}
						onChange={(e) => {
							setReduceOnly(e.target.checked);
						}}
						className="rounded border-border size-4 cursor-pointer"
					/>
					<Label
						htmlFor="reduce-only"
						className="text-xs font-medium cursor-pointer"
					>
						Reduce Only
					</Label>
				</div>

				{/* Order Status Message */}
				{orderStatus !== "idle" && orderMessage && (
					<div
						className={cn(
							"flex items-center gap-2 p-3 rounded border transition-all",
							orderStatus === "processing"
								? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
								: orderStatus === "success"
								? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
								: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
						)}
					>
						{orderStatus === "processing" && (
							<Loader2 className="size-4 animate-spin" />
						)}
						{orderStatus === "success" && <CheckCircle2 className="size-4" />}
						{orderStatus === "error" && <XCircle className="size-4" />}
						<span className="text-xs font-medium">{orderMessage}</span>
					</div>
				)}

				{/* Validation Errors Summary - Only show if fields were touched or form was submitted */}
				{validationErrors.length > 0 &&
					(touchedFields.size > 0 || orderStatus === "error") && (
					<div className="flex items-start gap-2 p-3 rounded bg-destructive/10 border border-destructive/30">
						<AlertCircle className="size-4 text-destructive mt-0.5 flex-shrink-0" />
						<div className="flex flex-col gap-1">
							<span className="text-xs font-semibold text-destructive">
								Please fix the following errors:
							</span>
							<ul className="text-xs text-destructive/90 list-disc list-inside space-y-0.5">
								{validationErrors.map((error, index) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Create Order Button - Professional with Status Feedback */}
				<Button
					onClick={handleCreateOrder}
					disabled={isViewOnly || !selectedAccount || !selectedSymbol || !isTradingAllowed || loading ||
						validationErrors.length > 0}
					className={cn(
						"w-full h-14 font-bold text-lg shadow-sm transition-all uppercase tracking-wider relative overflow-hidden",
						isBuy
							? "bg-green-600 hover:bg-green-700 text-white active:scale-[0.98] disabled:bg-green-600/50 disabled:cursor-not-allowed"
							: "bg-red-600 hover:bg-red-700 text-white active:scale-[0.98] disabled:bg-red-600/50 disabled:cursor-not-allowed",
						orderStatus === "processing" && "opacity-90",
						orderStatus === "success" && "bg-green-600",
						orderStatus === "error" && "bg-red-600",
					)}
				>
					{loading || orderStatus === "processing"
						? (
							<div className="flex items-center justify-center gap-2">
								<Loader2 className="size-5 animate-spin" />
								<span>Processing...</span>
							</div>
						)
						: orderStatus === "success"
						? (
							<div className="flex items-center justify-center gap-2">
								<CheckCircle2 className="size-5" />
								<span>Order Created!</span>
							</div>
						)
						: orderStatus === "error"
						? (
							<div className="flex items-center justify-center gap-2">
								<XCircle className="size-5" />
								<span>Error - Try Again</span>
							</div>
						)
						: (
							<div className="flex items-center justify-center gap-2">
								{isBuy
									? <ArrowUpRight className="size-5" />
									: <ArrowDownRight className="size-5" />}
								<span>
									{isBuy ? "Buy" : "Sell"} {selectedSymbol || ""}
								</span>
							</div>
						)}
				</Button>
			</div>

			{/* Confirmation Dialog for Large Orders */}
			<Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Large Order</DialogTitle>
						<DialogDescription>
							This order is larger than 10% of your available balance. Please
							confirm to proceed.
						</DialogDescription>
					</DialogHeader>
					{pendingOrder && (
						<div className="space-y-2 py-4">
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">Side:</span>
								<span className="text-sm font-semibold uppercase">
									{pendingOrder.side}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">Type:</span>
								<span className="text-sm font-semibold">
									{pendingOrder.type}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-sm text-muted-foreground">Amount:</span>
								<span className="text-sm font-semibold font-mono">
									{pendingOrder.amount} {selectedSymbol?.split("/")[0]}
								</span>
							</div>
							{pendingOrder.price && (
								<div className="flex justify-between">
									<span className="text-sm text-muted-foreground">Price:</span>
									<span className="text-sm font-semibold font-mono">
										{pendingOrder.price} {selectedSymbol?.split("/")[1]}
									</span>
								</div>
							)}
							{availableBalance && (
								<div className="flex justify-between pt-2 border-t">
									<span className="text-sm text-muted-foreground">
										Available Balance:
									</span>
									<span className="text-sm font-semibold font-mono">
										{side === "buy"
											? `${
												formatBalance(availableBalance.free)
											} ${quoteCurrency}`
											: `${
												formatBalance(availableBalance.free)
											} ${baseCurrency}`}
									</span>
								</div>
							)}
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCancelConfirm}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmOrder}
							disabled={loading}
							className={cn(
								side === "buy"
									? "bg-green-600 hover:bg-green-700"
									: "bg-red-600 hover:bg-red-700",
							)}
						>
							Confirm Order
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
