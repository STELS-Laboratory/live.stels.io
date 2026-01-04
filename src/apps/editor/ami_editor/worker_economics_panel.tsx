/**
 * Worker Economics Panel Component
 * Displays payment information and fee calculations according to WORKER_PAYMENT_API.md
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Coins,
	Database,
	Zap,
	TrendingUp,
	Percent,
	Info,
	Calculator,
} from "lucide-react";
import type { Worker } from "../store.ts";

interface WorkerEconomicsPanelProps {
	worker: Worker | null;
}

/**
 * Fee parameters from genesis.json (according to documentation)
 */
const FEE_PARAMS = {
	baseFee: "0.00001", // SLI
	perByteFee: "0.00000005", // SLI per byte
	perMsFee: "0.000000001", // SLI per millisecond
	currency: "SLI",
	decimals: 8,
	treasuryAddress: "ghJejxMRW5V5ZyFyxsn9tqQ4BNcSvmqMrv",
} as const;

/**
 * Calculate storage fee based on script size
 */
function calculateStorageFee(scriptSizeBytes: number): string {
	const baseFee = parseFloat(FEE_PARAMS.baseFee);
	const perByteFee = parseFloat(FEE_PARAMS.perByteFee);
	const fee = baseFee + scriptSizeBytes * perByteFee;
	return fee.toFixed(FEE_PARAMS.decimals);
}

/**
 * Calculate execution fee based on execution time
 */
function calculateExecutionFee(executionTimeMs: number): {
	total: string;
	networkFee: string;
	minerFee: string;
} {
	const baseFee = parseFloat(FEE_PARAMS.baseFee);
	const perMsFee = parseFloat(FEE_PARAMS.perMsFee);
	const total = baseFee + executionTimeMs * perMsFee;
	const networkFee = total * 0.1; // 10% to treasury
	const minerFee = total * 0.9; // 90% to miner

	return {
		total: total.toFixed(FEE_PARAMS.decimals),
		networkFee: networkFee.toFixed(FEE_PARAMS.decimals),
		minerFee: minerFee.toFixed(FEE_PARAMS.decimals),
	};
}

/**
 * Format SLI amount with proper decimals
 */
function formatSLI(amount: string): string {
	const num = parseFloat(amount);
	return num.toFixed(FEE_PARAMS.decimals);
}

/**
 * Worker Economics Panel Component
 */
export function WorkerEconomicsPanel({
	worker,
}: WorkerEconomicsPanelProps): React.ReactElement {
	const scriptSize = useMemo(() => {
		if (!worker?.value?.raw?.script) return 0;
		return new Blob([worker.value.raw.script]).size;
	}, [worker]);

	const storageFee = useMemo(() => {
		return calculateStorageFee(scriptSize);
	}, [scriptSize]);

	// Example execution fee calculation (100ms as example)
	const exampleExecutionFee = useMemo(() => {
		return calculateExecutionFee(100);
	}, []);

	return (
		<div className="space-y-4 max-w-2xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-2 mb-4">
				<Coins className="h-5 w-5 text-amber-500" />
				<h3 className="text-lg font-semibold text-foreground">
					Worker Economics
				</h3>
			</div>

			{/* Current Worker Storage Fee */}
			{worker && (
				<Card className="bg-card border-border">
					<CardHeader className="pb-2 pt-3 px-4">
						<div className="flex items-center gap-2">
							<Database className="h-4 w-4 text-amber-500" />
							<CardTitle className="text-sm font-semibold">
								Current Worker Storage Fee
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="px-4 pb-4 space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<div className="p-3 bg-muted/30 border border-border rounded">
								<div className="text-xs text-muted-foreground mb-1">
									Script Size
								</div>
								<div className="text-sm font-mono font-semibold text-foreground">
									{scriptSize.toLocaleString()} bytes
								</div>
							</div>
							<div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded">
								<div className="text-xs text-muted-foreground mb-1">
									Storage Fee
								</div>
								<div className="text-sm font-mono font-semibold text-amber-700 dark:text-amber-400">
									{formatSLI(storageFee)} {FEE_PARAMS.currency}
								</div>
							</div>
						</div>
						<div className="p-2 bg-muted/20 border border-border rounded text-xs text-muted-foreground">
							<Calculator className="h-3 w-3 inline mr-1" />
							Formula: {FEE_PARAMS.baseFee} + ({scriptSize.toLocaleString()} ×{" "}
							{FEE_PARAMS.perByteFee}) = {formatSLI(storageFee)} {FEE_PARAMS.currency}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Storage Fee Information */}
			<Card className="bg-card border-border">
				<CardHeader className="pb-2 pt-3 px-4">
					<div className="flex items-center gap-2">
						<Database className="h-4 w-4 text-blue-500" />
						<CardTitle className="text-sm font-semibold">
							Storage Fee
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4 space-y-3">
					<div className="p-3 bg-muted/30 border border-border rounded">
						<div className="text-xs font-mono text-foreground mb-2">
							storageFee = baseFee + (scriptSizeBytes × perByteFee)
						</div>
						<div className="space-y-1.5 text-xs text-muted-foreground">
							<div className="flex items-center justify-between">
								<span>Base Fee:</span>
								<span className="font-mono text-foreground">
									{FEE_PARAMS.baseFee} {FEE_PARAMS.currency}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Per Byte Fee:</span>
								<span className="font-mono text-foreground">
									{FEE_PARAMS.perByteFee} {FEE_PARAMS.currency}/byte
								</span>
							</div>
						</div>
					</div>
					<div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded text-xs text-muted-foreground">
						<Info className="h-3 w-3 inline mr-1" />
						Charged when creating or updating a worker (if script changes)
					</div>
				</CardContent>
			</Card>

			{/* Execution Fee Information */}
			<Card className="bg-card border-border">
				<CardHeader className="pb-2 pt-3 px-4">
					<div className="flex items-center gap-2">
						<Zap className="h-4 w-4 text-green-500" />
						<CardTitle className="text-sm font-semibold">
							Execution Fee
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4 space-y-3">
					<div className="p-3 bg-muted/30 border border-border rounded">
						<div className="text-xs font-mono text-foreground mb-2">
							executionFee = baseFee + (executionTimeMs × perMsFee)
						</div>
						<div className="space-y-1.5 text-xs text-muted-foreground mb-3">
							<div className="flex items-center justify-between">
								<span>Base Fee:</span>
								<span className="font-mono text-foreground">
									{FEE_PARAMS.baseFee} {FEE_PARAMS.currency}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Per Millisecond Fee:</span>
								<span className="font-mono text-foreground">
									{FEE_PARAMS.perMsFee} {FEE_PARAMS.currency}/ms
								</span>
							</div>
						</div>
						<div className="pt-2 border-t border-border">
							<div className="text-xs text-muted-foreground mb-2">
								Example (100ms execution):
							</div>
							<div className="space-y-1 text-xs">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Total Fee:</span>
									<span className="font-mono font-semibold text-foreground">
										{exampleExecutionFee.total} {FEE_PARAMS.currency}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										→ Network (10%):
									</span>
									<span className="font-mono text-blue-500">
										{exampleExecutionFee.networkFee} {FEE_PARAMS.currency}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										→ Miner (90%):
									</span>
									<span className="font-mono text-green-500">
										{exampleExecutionFee.minerFee} {FEE_PARAMS.currency}
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className="p-2 bg-green-500/5 border border-green-500/20 rounded text-xs text-muted-foreground">
						<Info className="h-3 w-3 inline mr-1" />
						Charged automatically for each worker execution
					</div>
				</CardContent>
			</Card>

			{/* Fee Distribution */}
			<Card className="bg-card border-border">
				<CardHeader className="pb-2 pt-3 px-4">
					<div className="flex items-center gap-2">
						<TrendingUp className="h-4 w-4 text-purple-500" />
						<CardTitle className="text-sm font-semibold">
							Execution Fee Distribution
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4 space-y-3">
					<div className="grid grid-cols-2 gap-3">
						<div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
							<div className="flex items-center gap-2 mb-2">
								<Percent className="h-4 w-4 text-blue-500" />
								<div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
									Network (Treasury)
								</div>
							</div>
							<div className="text-lg font-bold text-blue-700 dark:text-blue-400">
								10%
							</div>
							<div className="text-xs text-muted-foreground mt-1">
								→ {FEE_PARAMS.treasuryAddress.slice(0, 8)}...
							</div>
						</div>
						<div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
							<div className="flex items-center gap-2 mb-2">
								<Zap className="h-4 w-4 text-green-500" />
								<div className="text-xs font-semibold text-green-700 dark:text-green-400">
									Miner (Node)
								</div>
							</div>
							<div className="text-lg font-bold text-green-700 dark:text-green-400">
								90%
							</div>
							<div className="text-xs text-muted-foreground mt-1">
								→ Node that executed the worker
							</div>
						</div>
					</div>
					<div className="p-2 bg-muted/20 border border-border rounded text-xs text-muted-foreground">
						<Info className="h-3 w-3 inline mr-1" />
						For parallel execution: each node receives its own 90% share
					</div>
				</CardContent>
			</Card>

			{/* Constants */}
			<Card className="bg-card border-border">
				<CardHeader className="pb-2 pt-3 px-4">
					<div className="flex items-center gap-2">
						<Info className="h-4 w-4 text-amber-500" />
						<CardTitle className="text-sm font-semibold">Constants</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4 space-y-2">
					<div className="space-y-2 text-xs">
						<div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded">
							<span className="text-muted-foreground">Currency:</span>
							<span className="font-mono font-semibold text-foreground">
								{FEE_PARAMS.currency} (Stels Liq Index)
							</span>
						</div>
						<div className="flex items-center justify-between p-2 bg-muted/30 border border-border rounded">
							<span className="text-muted-foreground">Decimals:</span>
							<span className="font-mono font-semibold text-foreground">
								{FEE_PARAMS.decimals}
							</span>
						</div>
						<div className="p-2 bg-muted/30 border border-border rounded">
							<div className="text-muted-foreground mb-1">Treasury Address:</div>
							<div className="font-mono text-xs text-foreground break-all">
								{FEE_PARAMS.treasuryAddress}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Payment Requirements */}
			<Card className="bg-card border-amber-500/30">
				<CardHeader className="pb-2 pt-3 px-4">
					<div className="flex items-center gap-2">
						<Info className="h-4 w-4 text-amber-500" />
						<CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400">
							Payment Requirements
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4 space-y-2 text-xs text-muted-foreground">
					<div className="space-y-1.5">
						<div className="flex items-start gap-2">
							<span className="text-amber-500">•</span>
							<span>
								All worker operations require signed payment transactions
							</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-amber-500">•</span>
							<span>
								Transactions must be signed with domain separation
							</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-amber-500">•</span>
							<span>
								Storage fee is charged when creating or updating worker script
							</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-amber-500">•</span>
							<span>
								Execution fee is charged automatically for each execution
							</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-amber-500">•</span>
							<span>
								Treasury address can create system workers without payment
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
