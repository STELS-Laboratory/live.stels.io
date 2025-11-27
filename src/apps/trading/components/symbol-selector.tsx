/**
 * Symbol Selector Component
 * Allows user to select trading pair from available symbols in session
 * Shows all available symbols for viewing, but marks which are available for trading
 */

import React, { useEffect } from "react";
import { useTradingStore } from "../store";
import { useAllAvailableSymbols } from "../hooks/use-all-available-symbols";
import { useTradingSymbols } from "../hooks/use-trading-symbols";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Symbol Selector Component
 */
export function SymbolSelector(): React.ReactElement {
	const { selectedSymbol, setSelectedSymbol, selectedAccount } = useTradingStore();
	// Get all available symbols for viewing
	const allAvailableSymbols = useAllAvailableSymbols();
	// Get symbols available for trading (from protocol)
	const tradingSymbols = useTradingSymbols(selectedAccount);

	// Auto-select first available symbol if current symbol is not available
	useEffect(() => {
		if (allAvailableSymbols.length > 0) {
			// If no symbol selected or selected symbol is not in available list
			if (!selectedSymbol || !allAvailableSymbols.includes(selectedSymbol)) {
				// Prefer BTC/USDT, then ETH/USDT, then first available
				const preferredSymbol =
					allAvailableSymbols.find((s) => s === "BTC/USDT") ||
					allAvailableSymbols.find((s) => s === "ETH/USDT") ||
					allAvailableSymbols[0];
				
				if (preferredSymbol) {
					setSelectedSymbol(preferredSymbol);
				}
			}
		}
	}, [allAvailableSymbols, selectedSymbol, setSelectedSymbol]);

	return (
		<div className="flex items-center gap-2">
			{selectedSymbol && (
				<div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30">
			<TrendingUp className="icon-sm text-muted-foreground" />
					<span className="text-sm font-semibold text-foreground">
						{selectedSymbol}
					</span>
					<span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
						Spot
					</span>
				</div>
			)}
			<Select
				value={selectedSymbol || allAvailableSymbols[0] || ""}
				onValueChange={(value) => {
					setSelectedSymbol(value);
				}}
				disabled={allAvailableSymbols.length === 0}
			>
				<SelectTrigger
					className={cn(
						"w-[140px] h-8 text-sm",
						!selectedSymbol && "border-amber-500/50",
						allAvailableSymbols.length === 0 && "opacity-50",
					)}
				>
					<SelectValue 
						placeholder={
							allAvailableSymbols.length === 0
								? "No pairs"
								: "Select pair"
						} 
					/>
				</SelectTrigger>
				<SelectContent>
					{allAvailableSymbols.length === 0 ? (
						<SelectItem value="no-symbols" disabled>
							No trading pairs available
						</SelectItem>
					) : (
						allAvailableSymbols.map((symbol) => {
							const isTradingAllowed = tradingSymbols.includes(symbol);
							return (
								<SelectItem key={symbol} value={symbol}>
									<div className="flex items-center gap-2">
										<span>{symbol}</span>
										{!isTradingAllowed && selectedAccount && (
											<Lock className="icon-xs text-muted-foreground/70" />
										)}
									</div>
								</SelectItem>
							);
						})
					)}
				</SelectContent>
			</Select>
		</div>
	);
}
