import React from "react";
import { cn } from "@/lib/utils";

interface FormattedNumberProps {
	/**
	 * Number value to display (string or number)
	 */
	value: string | number;
	/**
	 * Number of decimal places to show
	 */
	decimals?: number;
	/**
	 * Custom className for the container
	 */
	className?: string;
	/**
	 * Custom className for the integer part
	 */
	integerClassName?: string;
	/**
	 * Custom className for the decimal part
	 */
	decimalClassName?: string;
	/**
	 * Whether to show thousand separators
	 */
	useGrouping?: boolean;
}

/**
 * Splits a number into integer and decimal parts
 */
function splitNumber(
	value: string | number,
	decimals: number = 2,
	useGrouping: boolean = true,
): { integer: string; decimal: string } {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;

	if (Number.isNaN(num)) {
		return { integer: String(value), decimal: "" };
	}

	// Format with specified decimals
	const formatted = useGrouping
		? new Intl.NumberFormat("en-US", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
			useGrouping: true,
		}).format(num)
		: num.toFixed(decimals);

	// Split by decimal point
	const parts = formatted.split(".");

	return {
		integer: parts[0] || "0",
		decimal: parts[1] || "",
	};
}

/**
 * FormattedNumber Component
 * Displays numbers with smaller, muted decimal part
 *
 * Example: 2,294.00285500
 * - Integer part: "2,294" (normal size, normal color)
 * - Decimal part: ".00285500" (3x smaller, muted color)
 */
export function FormattedNumber({
	value,
	decimals = 2,
	className,
	integerClassName,
	decimalClassName,
	useGrouping = true,
}: FormattedNumberProps): React.ReactElement {
	const { integer, decimal } = splitNumber(value, decimals, useGrouping);

	return (
		<span className={cn("inline-flex items-baseline", className)}>
			<span className={cn("text-foreground", integerClassName)}>
				{integer}
			</span>
			{decimal && (
				<>
					<span className={cn("text-foreground", integerClassName)}>.</span>
					<span
						className={cn(
							"text-muted-foreground",
							"text-[0.80em] leading-none",
							decimalClassName,
						)}
					>
						{decimal}
					</span>
				</>
			)}
		</span>
	);
}
