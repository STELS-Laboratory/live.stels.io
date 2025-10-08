import { useEffect } from "react";
import { useThemeStore } from "@/stores";
import type { ResolvedTheme, ThemeMode } from "@/stores";

/**
 * Hook for using theme in components
 * Automatically handles system theme changes with aggressive listening
 */
export function useTheme(): {
	theme: ThemeMode;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: ThemeMode) => void;
	toggleTheme: () => void;
} {
	const { theme, resolvedTheme, setTheme, toggleTheme, setResolvedTheme } =
		useThemeStore();

	// Aggressively listen for system theme changes when theme is set to "system"
	useEffect(() => {
		if (theme !== "system") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		// Function to check and update system theme
		const checkSystemTheme = (): void => {
			const currentSystemTheme = mediaQuery.matches ? "dark" : "light";
			if (currentSystemTheme !== resolvedTheme) {
				setResolvedTheme(currentSystemTheme);
				console.log("[useTheme] System theme changed to:", currentSystemTheme);
			}
		};

		// Check immediately
		checkSystemTheme();

		const handleChange = (e: MediaQueryListEvent | MediaQueryList): void => {
			const matches = "matches" in e ? e.matches : (e as MediaQueryListEvent).matches;
			const newResolvedTheme = matches ? "dark" : "light";
			
			console.log("[useTheme] System theme event triggered:", newResolvedTheme);
			setResolvedTheme(newResolvedTheme);
		};

		// Modern addEventListener
		mediaQuery.addEventListener("change", handleChange as any);

		// Legacy addListener for older browsers
		if (mediaQuery.addListener) {
			mediaQuery.addListener(handleChange as any);
		}

		// Polling fallback - check every 500ms for system theme changes
		// This ensures we catch changes even if event listeners fail
		const pollInterval = setInterval(() => {
			checkSystemTheme();
		}, 500);

		// Cleanup
		return () => {
			mediaQuery.removeEventListener("change", handleChange as any);
			if (mediaQuery.removeListener) {
				mediaQuery.removeListener(handleChange as any);
			}
			clearInterval(pollInterval);
		};
	}, [theme, resolvedTheme, setResolvedTheme]);

	return {
		theme,
		resolvedTheme,
		setTheme,
		toggleTheme,
	};
}
