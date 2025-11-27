/**
 * Trading Empty State Component
 * Welcome screen when no account is selected
 * Note: This component is no longer used as we show the layout in view-only mode
 * Keeping it for potential future use
 */

import React from "react";
import { Eye, Zap } from "lucide-react";
import { TradingVersionBadge } from "./trading-version-badge";
import { useTradingStore } from "../store";

/**
 * Trading Empty State Component
 */
export function TradingEmptyState(): React.ReactElement {
	const { isViewOnly } = useTradingStore();

	return (
		<div className="flex items-center justify-center flex-1 min-h-0">
			<div className="text-center max-w-md px-4">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 relative">
					{isViewOnly
						? <Eye className="icon-xl text-amber-500" />
						: <Zap className="icon-xl text-primary" />}
					<div className="absolute -top-1 -right-1">
						<TradingVersionBadge size="sm" showVersion={false} />
					</div>
				</div>
				<div className="text-xl font-bold text-foreground mb-2">
					{isViewOnly
						? "View-Only Mode"
						: "Welcome to Trading Terminal"}
				</div>
				<div className="text-sm text-muted-foreground mb-1">
					{isViewOnly
						? "You can view market data without an account"
						: "Please select an account to start trading"}
				</div>
				<div className="text-xs text-muted-foreground/70 mb-4">
					{isViewOnly
						? "Add an account in the Wallet app to create orders"
						: "Accounts will be loaded automatically from your session"}
				</div>
				<div className="flex items-center justify-center">
					<TradingVersionBadge size="sm" />
				</div>
			</div>
		</div>
	);
}
