/**
 * Account Selector Component
 * Allows user to select trading account (exchange)
 */

import React from "react";
import { useTradingStore } from "../store";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Account Selector Component
 */
export function AccountSelector(): React.ReactElement {
	const { selectedAccount, accounts, setSelectedAccount, isViewOnly } = useTradingStore();

	return (
		<TooltipProvider delayDuration={300}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex items-center gap-2">
						{isViewOnly
							? <Eye className="icon-sm text-amber-500" />
							: <Wallet className="icon-sm text-muted-foreground" />}
						<Select
							value={selectedAccount?.nid || ""}
							onValueChange={(value) => {
								const account = accounts.find((acc) => acc.nid === value);
								setSelectedAccount(account || null);
							}}
							disabled={isViewOnly && accounts.length === 0}
						>
							<SelectTrigger
								className={cn(
									"w-[200px] h-[2.5rem]",
									!selectedAccount && "border-amber-500/50",
									isViewOnly && accounts.length === 0 && "opacity-70 cursor-not-allowed",
								)}
							>
								<SelectValue
									placeholder={
										isViewOnly && accounts.length === 0
											? "View-Only Mode"
											: "Select account"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{accounts.length === 0 ? (
									<div className="px-2 py-4">
										<div className="flex flex-col items-center gap-2 text-center">
											<Eye className="icon-lg text-amber-500/70" />
											<div className="text-sm font-semibold text-foreground">
												View-Only Mode
											</div>
											<div className="text-xs text-muted-foreground max-w-[180px]">
												No trading accounts available. You can view market data, but cannot create orders.
											</div>
											<div className="text-xs text-muted-foreground/70 mt-1">
												Add an account in the Wallet app to start trading.
											</div>
										</div>
									</div>
								) : (
									accounts.map((account) => (
										<SelectItem key={account.nid} value={account.nid}>
											<div className="flex items-center gap-2">
												<span className="font-medium capitalize">{account.exchange}</span>
												<span className="text-muted-foreground text-xs font-mono">
													{account.nid}
												</span>
											</div>
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>
				</TooltipTrigger>
				{isViewOnly && accounts.length === 0 && (
					<TooltipContent side="bottom" className="max-w-[250px]">
						<div className="text-xs space-y-1">
							<div className="font-semibold">View-Only Mode</div>
							<div className="text-muted-foreground">
								You can view market data, charts, and order book without an account. To create orders, add a trading account in the Wallet app.
							</div>
						</div>
					</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>
	);
}
