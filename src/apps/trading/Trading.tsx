/**
 * Trading Terminal Application
 * Professional trading terminal with charts, order book, and order management
 */

import React, { startTransition, useCallback, useEffect } from "react";
import { useTradingStore } from "./store";
import { useTradingApi } from "./hooks/use-trading-api";
import {
	useAccountBalanceFromSession,
	useOrderBookFromSession,
	useTickerFromSession,
} from "./hooks/use-trading-session-data";
import { useTradingAccounts } from "./hooks/use-trading-accounts";
import { TradingHeader } from "./components/trading-header";
import { TradingMobileLayout } from "./components/trading-mobile-layout";
import { TradingTabletLayout } from "./components/trading-tablet-layout";
import { TradingDesktopLayout } from "./components/trading-desktop-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useDeviceType } from "@/hooks/use_mobile";
import { useAuthStore } from "@/stores";
import { toast } from "@/stores";

/**
 * Trading Terminal Component
 */
function Trading(): React.ReactElement {
	const { isTablet, isMobile } = useDeviceType();
	const { wallet } = useAuthStore();

	const {
		selectedAccount,
		selectedSymbol,
		selectedExchange,
		accounts,
		setOrders,
		setTrades,
		setOrderBook,
		setTicker,
		setBalance,
		setError,
		setLoading,
		setLastUpdateTime,
		setActiveTab,
		setAutoRefreshEnabled,
		isViewOnly,
		setIsViewOnly,
		activeTab,
		loading,
		error,
		autoRefreshEnabled,
		autoRefreshInterval,
		lastUpdateTime,
	} = useTradingStore();
	const api = useTradingApi();

	// Load accounts from session
	useTradingAccounts();

	// Update selectedExchange when account changes
	useEffect(() => {
		if (selectedAccount && selectedAccount.exchange) {
			const accountExchange = selectedAccount.exchange.toLowerCase();
			// Update exchange to match account exchange
			if (selectedExchange !== accountExchange) {
				useTradingStore.getState().setSelectedExchange(accountExchange);
			}
		}
	}, [selectedAccount, selectedExchange]);

	// Determine view-only mode: user has no accounts but can view markets
	// Also check if selectedAccount is valid (exists in accounts list)
	// If user selected exchange manually and has no account for that exchange, also view-only
	useEffect(() => {
		const hasNoAccounts = accounts.length === 0;
		const hasNoSelectedAccount = !selectedAccount;
		
		// Check if selectedAccount is valid (exists in accounts list)
		const isSelectedAccountValid = selectedAccount
			? accounts.some(
					(acc) =>
						acc.nid === selectedAccount.nid &&
						acc.exchange === selectedAccount.exchange,
				)
			: false;
		
		// Check if selected exchange has an account
		// If user manually selected exchange and has no account for it, view-only
		let hasAccountForSelectedExchange = true;
		if (selectedExchange) {
			hasAccountForSelectedExchange = accounts.some(
				(acc) => acc.exchange.toLowerCase() === selectedExchange.toLowerCase(),
			);
			
			// Don't auto-select account - let user choose manually
			// Only reset account if it doesn't match selected exchange
			if (selectedAccount) {
				const accountMatchesExchange = selectedAccount.exchange.toLowerCase() === selectedExchange.toLowerCase();
				if (!accountMatchesExchange) {
					// Account doesn't match selected exchange - check if user has account for it
					const accountForExchange = accounts.find(
						(acc) => acc.exchange.toLowerCase() === selectedExchange.toLowerCase(),
					);
					if (!accountForExchange) {
						// No account for selected exchange - reset account to enable view-only
						useTradingStore.getState().setSelectedAccount(null);
					}
					// If account exists for exchange, don't auto-select - let user choose
				}
			}
		}
		
		// Reset invalid selected account
		if (selectedAccount && !isSelectedAccountValid && accounts.length > 0) {
			// Account is invalid but we have other accounts - reset to null
			// This will trigger auto-selection of first account in useTradingAccounts
			useTradingStore.getState().setSelectedAccount(null);
		}
		
		// View-only mode: no accounts OR selected account is invalid OR no account for selected exchange
		setIsViewOnly(
			hasNoAccounts ||
			(hasNoSelectedAccount || !isSelectedAccountValid) ||
			!hasAccountForSelectedExchange,
		);
	}, [accounts, selectedAccount, selectedExchange, setIsViewOnly]);

	// Auto-switch to orderbook tab if user switches exchange without account and is on restricted tab
	useEffect(() => {
		// Tabs that require account
		const restrictedTabs = ["balance", "controller", "orders-trades"];
		
		// If in view-only mode and on restricted tab, switch to orderbook
		if (isViewOnly && restrictedTabs.includes(activeTab)) {
			setActiveTab("orderbook");
		}
	}, [isViewOnly, activeTab, setActiveTab]);

	// Get real-time data from session
	// Use selectedAccount exchange if available, otherwise use selectedExchange (view-only mode)
	const currentExchange = selectedAccount?.exchange || selectedExchange || "bybit";
	const sessionOrderBook = useOrderBookFromSession(
		selectedSymbol,
		currentExchange,
	);
	const sessionTicker = useTickerFromSession(
		selectedSymbol,
		currentExchange,
	);
	const sessionBalance = useAccountBalanceFromSession(
		selectedAccount,
		wallet?.address || null,
	);

	// Update store with session data - use startTransition for non-critical updates
	useEffect(() => {
		if (sessionOrderBook) {
			startTransition(() => {
				setOrderBook(sessionOrderBook);
			});
		}
	}, [sessionOrderBook, setOrderBook]);

	useEffect(() => {
		if (sessionTicker) {
			// Ticker updates are critical, keep synchronous
			setTicker(sessionTicker);
		}
	}, [sessionTicker, setTicker]);

	useEffect(() => {
		// Update balance in store when session balance changes
		// Reset to null if sessionBalance is null (e.g., when account changes)
		startTransition(() => {
			setBalance(sessionBalance);
		});
	}, [sessionBalance, setBalance]);

	// Implement refresh functions with toast notifications
	const handleRefreshOrders = useCallback(async (): Promise<void> => {
		// Don't make API calls in view-only mode or without valid account
		if (isViewOnly || !selectedAccount || !selectedSymbol) return;
		
		// Double-check that account is valid (exists in accounts list)
		const isAccountValid = accounts.some(
			(acc) =>
				acc.nid === selectedAccount.nid &&
				acc.exchange === selectedAccount.exchange,
		);
		if (!isAccountValid) return;

		try {
			setLoading(true);
			const result = await api.listOrders({
				nid: selectedAccount.nid,
				symbol: selectedSymbol,
				status: "all",
			});
			// Use startTransition for non-critical order updates
			startTransition(() => {
				setOrders(result.orders);
				setError(null);
				setLastUpdateTime(Date.now());
			});
		} catch (err) {
			const message = err instanceof Error
				? err.message
				: "Failed to fetch orders";
			setError(message);
			toast.error("Failed to refresh orders", message);
		} finally {
			setLoading(false);
		}
	}, [
		selectedAccount,
		selectedSymbol,
		isViewOnly,
		accounts,
		api,
		setOrders,
		setError,
		setLoading,
		setLastUpdateTime,
	]);

	const handleRefreshTrades = useCallback(async (): Promise<void> => {
		// Don't make API calls in view-only mode or without valid account
		if (isViewOnly || !selectedAccount || !selectedSymbol) return;
		
		// Double-check that account is valid (exists in accounts list)
		const isAccountValid = accounts.some(
			(acc) =>
				acc.nid === selectedAccount.nid &&
				acc.exchange === selectedAccount.exchange,
		);
		if (!isAccountValid) return;

		try {
			setLoading(true);
			const result = await api.listTrades({
				nid: selectedAccount.nid,
				symbol: selectedSymbol,
				limit: 100,
			});
			// Use startTransition for non-critical trade updates
			startTransition(() => {
				setTrades(result.trades);
				setError(null);
				setLastUpdateTime(Date.now());
			});
		} catch (err) {
			const message = err instanceof Error
				? err.message
				: "Failed to fetch trades";
			setError(message);
			toast.error("Failed to refresh trades", message);
		} finally {
			setLoading(false);
		}
	}, [
		selectedAccount,
		selectedSymbol,
		isViewOnly,
		accounts,
		api,
		setTrades,
		setError,
		setLoading,
		setLastUpdateTime,
	]);

	const handleRefreshOrderBook = useCallback(async (): Promise<void> => {
		if (!selectedAccount || !selectedSymbol || isViewOnly) return;

		try {
			setLoading(true);
			const orderBook = await api.getOrderBook(
				selectedAccount.nid,
				selectedSymbol,
				20,
			);
			setOrderBook(orderBook);
			setError(null);
			setLastUpdateTime(Date.now());
		} catch (err) {
			const message = err instanceof Error
				? err.message
				: "Failed to fetch order book";
			setError(message);
			toast.error("Failed to refresh order book", message);
		} finally {
			setLoading(false);
		}
	}, [
		selectedAccount,
		selectedSymbol,
		isViewOnly,
		api,
		setOrderBook,
		setError,
		setLoading,
		setLastUpdateTime,
	]);

	const handleRefreshTicker = useCallback(async (): Promise<void> => {
		if (!selectedAccount || !selectedSymbol || isViewOnly) return;

		try {
			setLoading(true);
			const ticker = await api.getTicker(selectedAccount.nid, selectedSymbol);
			setTicker(ticker);
			setError(null);
			setLastUpdateTime(Date.now());
		} catch (err) {
			const message = err instanceof Error
				? err.message
				: "Failed to fetch ticker";
			setError(message);
			toast.error("Failed to refresh ticker", message);
		} finally {
			setLoading(false);
		}
	}, [
		selectedAccount,
		selectedSymbol,
		isViewOnly,
		api,
		setTicker,
		setError,
		setLoading,
		setLastUpdateTime,
	]);

	const handleRefreshBalance = useCallback(async (): Promise<void> => {
		if (!selectedAccount) return;

		try {
			setLoading(true);
			const balance = await api.getBalance(selectedAccount.nid);
			setBalance(balance);
			setError(null);
			setLastUpdateTime(Date.now());
		} catch (err) {
			const message = err instanceof Error
				? err.message
				: "Failed to fetch balance";
			setError(message);
			toast.error("Failed to refresh balance", message);
		} finally {
			setLoading(false);
		}
	}, [
		selectedAccount,
		api,
		setBalance,
		setError,
		setLoading,
		setLastUpdateTime,
	]);

	// Update store refresh functions
	useEffect(() => {
		useTradingStore.setState({
			refreshOrders: handleRefreshOrders,
			refreshTrades: handleRefreshTrades,
			refreshOrderBook: handleRefreshOrderBook,
			refreshTicker: handleRefreshTicker,
			refreshBalance: handleRefreshBalance,
		});
	}, [
		handleRefreshOrders,
		handleRefreshTrades,
		handleRefreshOrderBook,
		handleRefreshTicker,
		handleRefreshBalance,
	]);

	// Auto-refresh orders and trades when account or symbol changes
	// Order book, ticker, and balance are updated from session in real-time
	// Only fetch orders and trades if we have a valid API connection
	// Skip in view-only mode
	useEffect(() => {
		if (!selectedAccount || !selectedSymbol || !autoRefreshEnabled || isViewOnly) return;

		// Check if we have API connection
		const { connectionSession } = useAuthStore.getState();
		if (!connectionSession?.api || !connectionSession?.session) {
			return;
		}

		// Initial load for orders and trades (these are not in session)
		handleRefreshOrders().catch(() => {
			// Failed to refresh orders
		});
		handleRefreshTrades().catch(() => {
			// Failed to refresh trades
		});

		// Set up auto-refresh interval with debouncing to avoid performance violations
		// Use requestAnimationFrame to batch operations and prevent blocking
		let lastRefreshTime = 0;
		const interval = setInterval(() => {
			const now = Date.now();
			// Throttle to prevent overlapping refresh operations
			if (now - lastRefreshTime < autoRefreshInterval * 0.8) {
				return;
			}
			lastRefreshTime = now;

			// Use requestAnimationFrame to batch async operations
			requestAnimationFrame(() => {
				handleRefreshOrders().catch(() => {
					// Failed to refresh orders
				});
				handleRefreshTrades().catch(() => {
					// Failed to refresh trades
				});
			});
		}, autoRefreshInterval);

		return () => {
			clearInterval(interval);
		};
	}, [
		selectedAccount,
		selectedSymbol,
		autoRefreshEnabled,
		autoRefreshInterval,
		isViewOnly,
		handleRefreshOrders,
		handleRefreshTrades,
	]);

	// Manual refresh handler
	const handleManualRefresh = useCallback((): void => {
		if (!selectedAccount || !selectedSymbol || isViewOnly) return;
		// Only refresh orders and trades via API
		// Order book, ticker, and balance are updated from session in real-time
		handleRefreshOrders().catch(() => {
			// Failed to refresh orders
		});
		handleRefreshTrades().catch(() => {
			// Failed to refresh trades
		});
	}, [
		selectedAccount,
		selectedSymbol,
		handleRefreshOrders,
		handleRefreshTrades,
		isViewOnly,
	]);

	// Toggle auto-refresh
	const handleToggleAutoRefresh = useCallback((): void => {
		setAutoRefreshEnabled(!autoRefreshEnabled);
		toast.info(
			autoRefreshEnabled ? "Auto-refresh disabled" : "Auto-refresh enabled",
			autoRefreshEnabled
				? "Data will not update automatically"
				: `Data will update every ${autoRefreshInterval / 1000}s`,
		);
	}, [autoRefreshEnabled, autoRefreshInterval, setAutoRefreshEnabled]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent): void => {
			// Only handle shortcuts when not typing in input fields
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target instanceof HTMLElement && e.target.isContentEditable)
			) {
				return;
			}

			const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
			const modKey = isMac ? e.metaKey : e.ctrlKey;

			if (modKey) {
				// Refresh: Cmd/Ctrl + R
				if (e.key === "r" || e.key === "R") {
					e.preventDefault();
					handleManualRefresh();
					return;
				}

				// Tab shortcuts: Cmd/Ctrl + 1-5 (only on desktop)
				if (!isMobile && !isTablet) {
					if (e.key >= "1" && e.key <= "5") {
						e.preventDefault();
						const tabIndex = parseInt(e.key, 10);
						const tabs = [
							"orderbook",
							"market-trades",
							"balance",
							"controller",
							"orders-trades",
						];
						if (tabs[tabIndex - 1]) {
							setActiveTab(tabs[tabIndex - 1]);
						}
						return;
					}
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isMobile, isTablet, handleManualRefresh, setActiveTab]);

	return (
		<div className="flex flex-1 flex-col h-full w-full bg-background overflow-hidden max-h-full">
			{/* Professional Trading Terminal Header */}
			<TradingHeader
				sessionTicker={sessionTicker}
				sessionBalance={sessionBalance}
				selectedSymbol={selectedSymbol}
				selectedAccount={selectedAccount}
				loading={loading}
				lastUpdateTime={lastUpdateTime}
				autoRefreshEnabled={autoRefreshEnabled}
				onRefresh={handleManualRefresh}
				onToggleAutoRefresh={handleToggleAutoRefresh}
			/>

			{/* Error Alert */}
			{error && (
				<Alert variant="destructive" className="mx-4 mt-2 mb-0">
					<AlertCircle className="icon-sm" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Main Content - Professional Resizable Layout */}
			{/* Show layout even in view-only mode (no account) for market viewing */}
			<div className="flex overflow-hidden w-full flex-1 min-h-0">
				{isMobile
					? <TradingMobileLayout />
					: isTablet
					? <TradingTabletLayout />
					: <TradingDesktopLayout />}
			</div>
		</div>
	);
}

export default Trading;
