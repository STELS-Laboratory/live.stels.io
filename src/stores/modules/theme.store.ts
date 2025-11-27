import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Theme types
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Resolved theme type (what is actually applied)
 */
export type ResolvedTheme = "light" | "dark";

/**
 * Theme state interface
 */
export interface ThemeState {
	/** Current theme mode (includes system option) */
	theme: ThemeMode;
	/** Resolved theme (actual theme applied) */
	resolvedTheme: ResolvedTheme;
	/** Whether theme has been hydrated from storage */
	_hasHydrated: boolean;
}

/**
 * Theme actions interface
 */
export interface ThemeActions {
	/** Cycle through themes: system -> light -> dark -> system */
	toggleTheme: () => void;
	/** Set specific theme */
	setTheme: (theme: ThemeMode) => void;
	/** Set resolved theme (internal use) */
	setResolvedTheme: (theme: ResolvedTheme) => void;
	/** Set hydration state */
	setHasHydrated: (state: boolean) => void;
}

/**
 * Combined theme store type
 */
export type ThemeStore = ThemeState & ThemeActions;

/**
 * Get system theme preference
 */
function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") return "dark";
	
	const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	return isDark ? "dark" : "light";
}

/**
 * Resolve theme mode to actual theme
 */
function resolveTheme(theme: ThemeMode): ResolvedTheme {
	if (theme === "system") {
		return getSystemTheme();
	}
	return theme;
}

/**
 * Apply theme to document
 */
function applyTheme(theme: ResolvedTheme): void {
	const root = document.documentElement;
	
	if (theme === "light") {
		root.classList.remove("dark");
		root.classList.add("light");
	} else {
		root.classList.remove("light");
		root.classList.add("dark");
	}
	
	// Set data attribute for CSS selectors
	root.setAttribute("data-theme", theme);
}

/**
 * Theme store with persistence and system theme detection
 */
export const useThemeStore = create<ThemeStore>()(
	persist(
		(set, get) => ({
			// Initial state
			theme: "system",
			resolvedTheme: getSystemTheme(),
			_hasHydrated: false,

			// Actions
			toggleTheme: (): void => {
				const current = get().theme;
				let newTheme: ThemeMode;
				
				// Cycle: system -> light -> dark -> system
				if (current === "system") {
					newTheme = "light";
				} else if (current === "light") {
					newTheme = "dark";
				} else {
					newTheme = "system";
				}
				
				const resolved = resolveTheme(newTheme);
				applyTheme(resolved);
				set({ theme: newTheme, resolvedTheme: resolved });
			},

			setTheme: (theme: ThemeMode): void => {
				const resolved = resolveTheme(theme);
				applyTheme(resolved);
				set({ theme, resolvedTheme: resolved });
			},

			setResolvedTheme: (theme: ResolvedTheme): void => {
				applyTheme(theme);
				set({ resolvedTheme: theme });
			},

			setHasHydrated: (state: boolean): void => {
				set({ _hasHydrated: state });
			},
		}),
		{
			name: "theme-store",
			onRehydrateStorage: () => (state) => {
				if (state) {
					// Apply theme after hydration
					const resolved = resolveTheme(state.theme);
					applyTheme(resolved);
					state.setResolvedTheme(resolved);
					state.setHasHydrated(true);
				}
			},
		},
	),
);

// Initialize system theme listener
if (typeof window !== "undefined") {
	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	
	const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
		const store = useThemeStore.getState();
		
		// Only update if user has selected "system" theme
		if (store.theme === "system") {
			const newResolvedTheme = e.matches ? "dark" : "light";

			// Apply theme immediately
			applyTheme(newResolvedTheme);
			
			// Update store
			store.setResolvedTheme(newResolvedTheme);
		}
	};
	
	// Add listener
	mediaQuery.addEventListener("change", handleSystemThemeChange);
	
	// Also try addListener for older browsers
	if (mediaQuery.addListener) {
		mediaQuery.addListener(handleSystemThemeChange as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
	}
}
