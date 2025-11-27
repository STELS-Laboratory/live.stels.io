/**
 * Orders List Component
 * Displays list of orders with cancel functionality
 * Optimized with React.memo for performance
 */

import React, { useState, useCallback } from "react";
import { useTradingStore } from "../store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Clock, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingApi } from "../hooks/use-trading-api";
import { toast } from "@/stores";
import type { TradingOrder } from "../types";
import { formatPrice, formatAmount } from "../lib/formatting";

/**
 * Orders List Component
 */
export const OrdersList = React.memo(function OrdersList(): React.ReactElement {
	const {
		orders,
		selectedAccount,
		selectedSymbol,
		removeOrder,
		updateOrder,
		setLoading,
	} = useTradingStore();
	const api = useTradingApi();

	// State for cancel confirmation dialog
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [orderToCancel, setOrderToCancel] = useState<TradingOrder | null>(null);
	const [isCanceling, setIsCanceling] = useState(false);

	// Filter orders by selected symbol
	const filteredOrders = React.useMemo(() => {
		if (!selectedSymbol) return orders;
		return orders.filter((order) => order.symbol === selectedSymbol);
	}, [orders, selectedSymbol]);

	const handleCancelClick = useCallback((order: TradingOrder): void => {
		setOrderToCancel(order);
		setCancelDialogOpen(true);
	}, []);

	const handleCancelConfirm = useCallback(async (): Promise<void> => {
		if (!orderToCancel || !selectedAccount) {
			return;
		}

		try {
			setIsCanceling(true);
			setLoading(true);

			const canceledOrder = await api.cancelOrder(
				selectedAccount.nid,
				orderToCancel.id,
				orderToCancel.symbol,
			);

			// Update order status or remove if fully canceled
			if (canceledOrder.status === "canceled") {
				updateOrder(orderToCancel.id, { status: "canceled" });
				// Optionally remove from list after a delay
				setTimeout(() => {
					removeOrder(orderToCancel.id);
				}, 2000);
			} else {
				updateOrder(orderToCancel.id, canceledOrder);
			}

			toast.success("Order canceled successfully");
			setCancelDialogOpen(false);
			setOrderToCancel(null);
		} catch (error) {
			const message = error instanceof Error
				? error.message
				: "Failed to cancel order";
			toast.error(message);
		} finally {
			setIsCanceling(false);
			setLoading(false);
		}
	}, [orderToCancel, selectedAccount, api, updateOrder, removeOrder, setLoading]);

	const handleCancelDialogClose = useCallback((): void => {
		if (!isCanceling) {
			setCancelDialogOpen(false);
			setOrderToCancel(null);
		}
	}, [isCanceling]);

	// Use centralized formatting functions
	const formatPriceValue = useCallback((price?: number): string => {
		if (!price) return "—";
		return formatPrice(price);
	}, []);

	const formatAmountValue = useCallback((amount?: number): string => {
		if (amount === undefined || amount === null) return "—";
		return formatAmount(amount);
	}, []);

	const getStatusIcon = useCallback((status: string) => {
		switch (status) {
			case "open":
				return <Clock className="icon-sm text-blue-500" />;
			case "filled":
				return <CheckCircle2 className="icon-sm text-green-500" />;
			case "canceled":
				return <XCircle className="icon-sm text-gray-500" />;
			case "partiallyFilled":
				return <Clock className="icon-sm text-yellow-500" />;
		default:
			return <Clock className="icon-sm text-muted-foreground" />;
		}
	}, []);

	const getStatusColor = useCallback((status: string): string => {
		switch (status) {
			case "open":
				return "text-blue-600 dark:text-blue-400";
			case "filled":
				return "text-green-600 dark:text-green-400";
			case "canceled":
				return "text-gray-600 dark:text-gray-400";
			case "partiallyFilled":
				return "text-yellow-600 dark:text-yellow-400";
		default:
			return "text-muted-foreground";
		}
	}, []);

	if (filteredOrders.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="text-sm text-muted-foreground">
						No orders found
					</div>
					{!selectedSymbol && (
						<div className="text-xs text-muted-foreground/70 mt-1">
							Select a trading pair
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Professional Table Header */}
			<div className="flex-shrink-0 grid grid-cols-12 gap-2 px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20">
				<div className="col-span-2">Order ID / Type</div>
				<div className="col-span-2">Side</div>
				<div className="col-span-2">Price</div>
				<div className="col-span-2">Amount</div>
				<div className="col-span-2">Filled</div>
				<div className="col-span-1">Status</div>
				<div className="col-span-1">Action</div>
			</div>

			{/* Orders List */}
			<ScrollArea className="flex-1">
				<div className="divide-y divide-border/50">
					{filteredOrders.map((order) => {
						const isBuy = order.side?.toLowerCase() === "buy";
						const canCancel = order.status === "open" ||
							order.status === "partiallyFilled";
						const orderStatus = order.status || "unknown";

						// Show order ID if available
						const displayId = order.id || order.clientOrderId || "—";

						return (
							<div
								key={order.id}
								className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-muted/30 transition-colors text-xs"
							>
								{/* Type & ID */}
								<div className="col-span-2 flex items-center gap-1 min-w-0">
									{getStatusIcon(orderStatus)}
									<div className="flex flex-col min-w-0">
										{order.type
											? (
												<span className="text-muted-foreground font-mono text-[10px]">
													{order.type}
												</span>
											)
											: (
												<span
													className="text-muted-foreground font-mono text-[10px] truncate"
													title={`Order ID: ${displayId}`}
												>
													{displayId.length > 12
														? `...${displayId.slice(-8)}`
														: displayId}
												</span>
											)}
										{order.symbol && (
											<span className="text-muted-foreground/70 font-mono text-[9px]">
												{order.symbol}
											</span>
										)}
									</div>
								</div>

								{/* Side */}
								<div className="col-span-2">
									<span
										className={cn(
											"font-semibold font-mono",
											isBuy
												? "text-green-600 dark:text-green-400"
												: "text-red-600 dark:text-red-400",
										)}
									>
										{order.side?.toUpperCase() || "—"}
									</span>
								</div>

								{/* Price */}
								<div className="col-span-2 font-mono text-foreground">
									{order.price !== undefined ? formatPriceValue(order.price) : "—"}
								</div>

								{/* Amount */}
								<div className="col-span-2 font-mono text-foreground">
									{order.amount !== undefined
										? formatAmountValue(order.amount)
										: "—"}
								</div>

								{/* Filled */}
								<div className="col-span-2 font-mono text-muted-foreground">
									{formatAmountValue(order.filled ?? 0)} /{" "}
									{formatAmountValue(order.amount ?? 0)}
								</div>

								{/* Status */}
								<div className="col-span-1">
									<span
										className={cn(
											"text-[10px] font-medium",
											getStatusColor(orderStatus),
										)}
									>
										{orderStatus}
									</span>
								</div>

								{/* Action */}
								<div className="col-span-1 flex items-center justify-end">
									{canCancel && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												handleCancelClick(order);
											}}
											disabled={isCanceling}
											className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
											title="Cancel order"
										>
											<X className="icon-sm" />
										</Button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>

			{/* Cancel Order Confirmation Dialog */}
			<Dialog open={cancelDialogOpen} onOpenChange={handleCancelDialogClose}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertTriangle className="icon-sm text-destructive" />
							Cancel Order
						</DialogTitle>
						<DialogDescription className="pt-2">
							Are you sure you want to cancel this order?
						</DialogDescription>
					</DialogHeader>

					{orderToCancel && (
						<div className="py-4 space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Symbol:</span>
								<span className="font-mono font-semibold">
									{orderToCancel.symbol}
								</span>
							</div>
							{orderToCancel.side && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Side:</span>
									<span
										className={cn(
											"font-mono font-semibold",
											orderToCancel.side.toLowerCase() === "buy"
												? "text-green-600 dark:text-green-400"
												: "text-red-600 dark:text-red-400",
										)}
									>
										{orderToCancel.side.toUpperCase()}
									</span>
								</div>
							)}
							{orderToCancel.price !== undefined && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Price:</span>
									<span className="font-mono font-semibold">
										{formatPriceValue(orderToCancel.price)}
									</span>
								</div>
							)}
							{orderToCancel.amount !== undefined && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Amount:</span>
									<span className="font-mono font-semibold">
										{formatAmountValue(orderToCancel.amount)}
									</span>
								</div>
							)}
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Order ID:</span>
								<span className="font-mono text-xs text-muted-foreground">
									{orderToCancel.id}
								</span>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							onClick={handleCancelDialogClose}
							disabled={isCanceling}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleCancelConfirm}
							disabled={isCanceling}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{isCanceling
								? (
									<>
										<div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
										Canceling...
									</>
								)
								: (
									<>
										<X className="icon-sm mr-2" />
										Cancel Order
									</>
								)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
});
