/**
 * Chart legend component for AggregatedCandles
 */

import React from "react";

/**
 * Chart legend showing line types and their meanings
 */
export const ChartLegend: React.FC = React.memo(() => {
	return (
		<div className="w-full mt-2 pt-2 border-t border-border">
			<div className="flex items-center justify-between mb-2">
				<div className="text-[10px] text-muted-foreground uppercase tracking-wider">
					Chart Legend
				</div>
				<div className="flex items-center gap-4 text-[10px]">
					<div className="flex items-center gap-1">
						<div className="w-3 h-0.5 bg-muted" style={{ borderStyle: "dashed" }} />
						<span className="text-muted-foreground">Center (0%)</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-3 h-0.5 bg-amber-500" />
						<span className="text-amber-500">Exchange Lines</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-3 h-0.5 bg-green-500/50" />
						<span className="text-muted-foreground">Volume</span>
					</div>
				</div>
			</div>
		</div>
	);
});

ChartLegend.displayName = "ChartLegend";
