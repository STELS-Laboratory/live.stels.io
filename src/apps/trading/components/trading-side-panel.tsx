/**
 * Trading Side Panel Component
 * Document-oriented design with vertical icon tabs and tooltips
 * Side panel with tabs for Order Book, Market Trades, Balance, Order Controller, and Orders/Trades
 */

import React, { useMemo } from "react";
import {
	Activity,
	BookOpen,
	ClipboardList,
	Sliders,
	Wallet,
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { OrderBook } from "./order-book";
import { MarketTrades } from "./market-trades";
import { AccountBalance } from "./account-balance";
import { OrderController } from "./order-controller";
import { OrdersList } from "./orders-list";
import { TradesList } from "./trades-list";
import {
	BalanceSkeleton,
	OrderBookSkeleton,
	OrderControllerSkeleton,
	OrdersListSkeleton,
} from "./skeleton-loaders";
import { useTradingStore } from "../store";
import {
	useAccountBalanceFromSession,
	useOrderBookFromSession,
} from "../hooks/use-trading-session-data";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";

/**
 * Tab configuration interface for extensibility
 */
interface TabConfig {
	value: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	description?: string;
}

/**
 * Main tabs configuration
 * Easy to extend with new tabs in the future
 */
const MAIN_TABS: TabConfig[] = [
	{
		value: "orderbook",
		label: "Order Book",
		icon: BookOpen,
		description: "View real-time order book with bids and asks",
	},
	{
		value: "market-trades",
		label: "Market Trades",
		icon: Activity,
		description: "Recent market trades and transaction history",
	},
	{
		value: "balance",
		label: "Account Balance",
		icon: Wallet,
		description: "View account balances and available funds",
	},
	{
		value: "controller",
		label: "Order Controller",
		icon: Sliders,
		description: "Create and manage trading orders",
	},
	{
		value: "orders-trades",
		label: "Orders & Trades",
		icon: ClipboardList,
		description: "View your orders and trade history",
	},
];

/**
 * Trading Side Panel Component
 * Document-oriented design with vertical icon tabs
 */
export function TradingSidePanel(): React.ReactElement {
	const {
		selectedAccount,
		selectedSymbol,
		selectedExchange,
		activeTab,
		setActiveTab,
		activeOrdersTradesTab,
		setActiveOrdersTradesTab,
		orders,
		loading,
		isViewOnly,
		accounts,
	} = useTradingStore();

	const { wallet } = useAuthStore();
	
	// Check if user has account for selected exchange
	const hasAccountForSelectedExchange = useMemo(() => {
		if (!selectedExchange) return false;
		return accounts.some(
			(acc) => acc.exchange.toLowerCase() === selectedExchange.toLowerCase(),
		);
	}, [selectedExchange, accounts]);

	// Use selectedAccount exchange if available, otherwise use selectedExchange (view-only mode)
	const currentExchange = selectedAccount?.exchange || selectedExchange || "bybit";

	const sessionOrderBook = useOrderBookFromSession(
		selectedSymbol,
		currentExchange,
	);
	const sessionBalance = useAccountBalanceFromSession(
		selectedAccount,
		wallet?.address || null,
	);

	return (
		<div className="w-1/3 border-l overflow-hidden bg-card flex">
			{/* Vertical Icon Tabs - Document-oriented design */}
			<TooltipProvider delayDuration={300}>
				<div className="flex flex-col items-center gap-1 p-2 border-r border-border bg-muted/20 flex-shrink-0">
					{MAIN_TABS.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.value;
						// In view-only mode, disable tabs that require account
						const requiresAccount = ["balance", "controller", "orders-trades"].includes(tab.value);
						// Disable if view-only OR if no account for selected exchange
						const isDisabled = (isViewOnly || !hasAccountForSelectedExchange) && requiresAccount;

						return (
							<Tooltip key={tab.value} delayDuration={300}>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={() => {
											if (!isDisabled) {
												setActiveTab(tab.value);
											}
										}}
										disabled={isDisabled}
										className={cn(
											"relative flex items-center justify-center w-10 h-10 rounded transition-all duration-150",
											"hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
											isActive
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground",
											isDisabled && "opacity-50 cursor-not-allowed",
										)}
										aria-label={tab.label}
										aria-selected={isActive}
										aria-disabled={isDisabled}
									>
										<Icon className="w-5 h-5" />
										{/* Active indicator */}
										{isActive && (
											<div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-500 rounded-r" />
										)}
									</button>
								</TooltipTrigger>
								<TooltipContent side="right" className="max-w-[200px]">
									<div className="flex flex-col gap-1">
										<span className="font-semibold">{tab.label}</span>
										{tab.description && (
											<span className="text-xs text-muted-foreground">
												{tab.description}
											</span>
										)}
										{isDisabled && (
											<span className="text-xs text-amber-500 mt-1">
												Requires account
											</span>
										)}
									</div>
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</TooltipProvider>

			{/* Content Area */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					defaultValue="orderbook"
					className="h-full w-full flex flex-col"
				>
					<TabsContent
						value="orderbook"
						className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 m-0"
					>
						{!sessionOrderBook || !selectedSymbol
							? <OrderBookSkeleton />
							: <OrderBook />}
					</TabsContent>

					<TabsContent
						value="market-trades"
						className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 m-0"
					>
						<MarketTrades />
					</TabsContent>

					<TabsContent
						value="balance"
						className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 m-0"
					>
						{isViewOnly || !sessionBalance || !selectedAccount
							? <BalanceSkeleton />
							: <AccountBalance />}
					</TabsContent>

					<TabsContent
						value="controller"
						className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 m-0"
					>
						{isViewOnly || !selectedAccount || !selectedSymbol
							? <OrderControllerSkeleton />
							: <OrderController />}
					</TabsContent>

					<TabsContent
						value="orders-trades"
						className="flex-1 overflow-hidden min-h-0 m-0"
					>
						<Tabs
							value={activeOrdersTradesTab}
							onValueChange={setActiveOrdersTradesTab}
							defaultValue="orders"
							className="h-full w-full flex flex-col"
						>
							{/* Nested tabs header for Orders/Trades */}
							<div className="flex-shrink-0 border-b border-border bg-muted/10">
								<div className="flex items-center gap-1 p-2">
									<button
										type="button"
										onClick={() => setActiveOrdersTradesTab("orders")}
										className={cn(
											"flex-1 px-3 py-2 text-xs font-medium rounded transition-colors",
											"hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											activeOrdersTradesTab === "orders"
												? "bg-background text-foreground"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										Current Orders
									</button>
									<button
										type="button"
										onClick={() => setActiveOrdersTradesTab("trades")}
										className={cn(
											"flex-1 px-3 py-2 text-xs font-medium rounded transition-colors",
											"hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											activeOrdersTradesTab === "trades"
												? "bg-background text-foreground"
												: "text-muted-foreground hover:text-foreground",
										)}
									>
										Trade History
									</button>
								</div>
							</div>

							<TabsContent
								value="orders"
								className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 m-0"
							>
								{loading && orders.length === 0
									? <OrdersListSkeleton />
									: <OrdersList />}
							</TabsContent>
							<TabsContent
								value="trades"
								className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 m-0"
							>
								<TradesList />
							</TabsContent>
						</Tabs>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
