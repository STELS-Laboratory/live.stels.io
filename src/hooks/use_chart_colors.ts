import { useThemeStore } from "@/stores";

/**
 * Chart color configuration for lightweight-charts
 */
export interface ChartColors {
	background: string;
	textColor: string;
	gridColor: string;
	borderColor: string;
	upColor: string;
	downColor: string;
	volumeColor: string;
}

/**
 * Hook to get chart colors based on current theme
 * Returns colors optimized for lightweight-charts library
 */
export function useChartColors(): ChartColors {
	const { resolvedTheme } = useThemeStore();

	if (resolvedTheme === "light") {
		return {
			background: "#ffffff", // white
			textColor: "#18181b", // zinc-900
			gridColor: "#e4e4e7", // zinc-200
			borderColor: "#d4d4d8", // zinc-300
			upColor: "#16a34a", // green-600
			downColor: "#dc2626", // red-600
			volumeColor: "#a1a1aa", // zinc-400
		};
	}

	// Dark theme (default)
	return {
		background: "#0b0b0c", // near black
		textColor: "#e4e4e7", // zinc-200
		gridColor: "#1f1f22", // zinc-900
		borderColor: "#27272a", // zinc-800
		upColor: "#16a34a", // green-600
		downColor: "#dc2626", // red-600
		volumeColor: "#3f3f46", // zinc-700
	};
}
