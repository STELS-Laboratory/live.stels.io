import { useEffect } from "react";
import { setThemeColorForRoute, setCustomThemeColor, resetThemeColor } from "@/lib/theme-color";

/**
 * Hook for managing PWA theme color
 * 
 * Automatically updates theme color based on current route
 * 
 * @param route - Optional route path to set specific theme color
 * @param customColor - Optional custom color to override theme-based colors
 * 
 * @example
 * ```tsx
 * // Auto theme color based on system/app theme
 * useThemeColor();
 * 
 * // Set color for specific route
 * useThemeColor('/app/markets');
 * 
 * // Set custom color
 * useThemeColor(undefined, '#10b981');
 * ```
 */
export function useThemeColor(route?: string, customColor?: string): void {
  useEffect(() => {
    if (customColor) {
      setCustomThemeColor(customColor);
    } else if (route) {
      setThemeColorForRoute(route);
    } else {
      resetThemeColor();
    }
  }, [route, customColor]);
}
