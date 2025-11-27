/**
 * Exchange Selector Component
 * Allows user to select exchange
 * Shows always, defaults to account exchange if available
 */

import React, { useEffect } from "react";
import { useTradingStore } from "../store";
import { useAvailableExchanges } from "../hooks/use-available-exchanges";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Exchange Selector Component
 * Always shown, defaults to account exchange if available
 */
export function ExchangeSelector(): React.ReactElement {
	const {
		selectedSymbol,
		selectedExchange,
		setSelectedExchange,
		selectedAccount,
		setSelectedAccount,
	} = useTradingStore();
	const availableExchanges = useAvailableExchanges(selectedSymbol);

	// Set default exchange from account if available (only on initial load, not when user changes symbol)
	// Don't auto-update exchange when account changes - let user choose exchange manually
	useEffect(() => {
		// Only set exchange from account if no exchange is selected yet
		if (selectedAccount && selectedAccount.exchange && !selectedExchange) {
			const accountExchange = selectedAccount.exchange.toLowerCase();
			if (availableExchanges.includes(accountExchange)) {
				setSelectedExchange(accountExchange);
			}
		}
	}, [selectedAccount, availableExchanges, selectedExchange, setSelectedExchange]);

	// Auto-select first available exchange if none selected
	useEffect(() => {
		if (availableExchanges.length > 0 && !selectedExchange) {
			// If user has account, prefer account exchange
			if (selectedAccount && selectedAccount.exchange) {
				const accountExchange = selectedAccount.exchange.toLowerCase();
				if (availableExchanges.includes(accountExchange)) {
					setSelectedExchange(accountExchange);
					return;
				}
			}
			
			// Otherwise prefer bybit, then binance, then first available
			const preferredExchange =
				availableExchanges.find((e) => e === "bybit") ||
				availableExchanges.find((e) => e === "binance") ||
				availableExchanges[0];

			if (preferredExchange) {
				setSelectedExchange(preferredExchange);
			}
		}
	}, [availableExchanges, selectedExchange, selectedAccount, setSelectedExchange]);

	// Reset exchange when symbol changes (only if current exchange is not available for new symbol)
	useEffect(() => {
		if (selectedSymbol && availableExchanges.length > 0) {
			// Check if current exchange is available for new symbol
			if (!selectedExchange || !availableExchanges.includes(selectedExchange)) {
				// If user has account and account exchange is available, prefer it
				if (selectedAccount && selectedAccount.exchange) {
					const accountExchange = selectedAccount.exchange.toLowerCase();
					if (availableExchanges.includes(accountExchange)) {
						setSelectedExchange(accountExchange);
						return;
					}
				}
				
				// Otherwise prefer bybit, then binance, then first available
				const preferredExchange =
					availableExchanges.find((e) => e === "bybit") ||
					availableExchanges.find((e) => e === "binance") ||
					availableExchanges[0];

				if (preferredExchange) {
					setSelectedExchange(preferredExchange);
				}
			}
		}
	}, [selectedSymbol, availableExchanges, selectedExchange, selectedAccount, setSelectedExchange]);

	// Handle exchange change - don't auto-select account, let user choose
	const handleExchangeChange = (exchange: string): void => {
		setSelectedExchange(exchange);
		
		// If current account doesn't match selected exchange, clear it
		// Don't auto-select account - let user choose manually
		if (selectedAccount) {
			const accountMatchesExchange = selectedAccount.exchange.toLowerCase() === exchange.toLowerCase();
			if (!accountMatchesExchange) {
				setSelectedAccount(null);
			}
		}
	};

	return (
		<div className="flex items-center gap-2">
			<Building2 className="icon-sm text-muted-foreground" />
			<Select
				value={selectedExchange || ""}
				onValueChange={handleExchangeChange}
				disabled={availableExchanges.length === 0 || !selectedSymbol}
			>
				<SelectTrigger
					className={cn(
						"w-[140px] h-8 text-sm",
						!selectedExchange && "border-amber-500/50",
						availableExchanges.length === 0 && "opacity-50",
					)}
				>
					<SelectValue
						placeholder={
							availableExchanges.length === 0
								? "No exchanges"
								: "Select exchange"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{availableExchanges.length === 0 ? (
						<SelectItem value="no-exchanges" disabled>
							No exchanges available
						</SelectItem>
					) : (
						availableExchanges.map((exchange) => (
							<SelectItem key={exchange} value={exchange}>
								<span className="capitalize">{exchange}</span>
							</SelectItem>
						))
					)}
				</SelectContent>
			</Select>
		</div>
	);
}

