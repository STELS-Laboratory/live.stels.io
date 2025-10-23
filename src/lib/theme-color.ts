/**
 * Theme Color Manager
 * 
 * Utility for dynamically managing PWA theme color (browser header, status bar).
 * Supports different colors for light/dark themes and per-route customization.
 */

export interface ThemeColorConfig {
  light: string;
  dark: string;
}

/**
 * Default theme colors for light and dark modes
 */
const DEFAULT_THEME_COLORS: ThemeColorConfig = {
  light: '#f59e0b', // amber-500
  dark: '#33312f',  // warm dark brown
};

/**
 * Route-specific theme colors (optional customization per route)
 */
const ROUTE_THEME_COLORS: Record<string, ThemeColorConfig> = {
  '/app/welcome': {
    light: '#f59e0b',
    dark: '#33312f',
  },
  '/app/markets': {
    light: '#10b981', // emerald-500
    dark: '#064e3b',  // emerald-950
  },
  '/app/wallet': {
    light: '#8b5cf6', // violet-500
    dark: '#2e1065',  // violet-950
  },
  // Add more routes as needed
};

/**
 * Updates the theme-color meta tag
 */
function updateMetaThemeColor(color: string): void {
  let meta = document.querySelector('meta[name="theme-color"]');
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', color);
}

/**
 * Updates the Apple status bar style
 */
function updateAppleStatusBar(isDark: boolean): void {
  let meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(meta);
  }
  
  // Options: 'default', 'black', 'black-translucent'
  meta.setAttribute('content', isDark ? 'black-translucent' : 'default');
}

/**
 * Gets the current theme (light or dark)
 */
function getCurrentTheme(): 'light' | 'dark' {
  const htmlElement = document.documentElement;
  
  if (htmlElement.classList.contains('dark')) {
    return 'dark';
  }
  
  if (htmlElement.classList.contains('light')) {
    return 'light';
  }
  
  // Fallback to system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Sets the theme color based on current theme mode
 */
export function setThemeColor(config?: ThemeColorConfig): void {
  const theme = getCurrentTheme();
  const colors = config || DEFAULT_THEME_COLORS;
  const color = theme === 'dark' ? colors.dark : colors.light;
  
  updateMetaThemeColor(color);
  updateAppleStatusBar(theme === 'dark');
}

/**
 * Sets theme color for a specific route
 */
export function setThemeColorForRoute(route: string): void {
  const routeColors = ROUTE_THEME_COLORS[route];
  setThemeColor(routeColors);
}

/**
 * Sets a custom theme color (overrides theme-based colors)
 */
export function setCustomThemeColor(color: string): void {
  updateMetaThemeColor(color);
}

/**
 * Resets to default theme colors
 */
export function resetThemeColor(): void {
  setThemeColor(DEFAULT_THEME_COLORS);
}

/**
 * Observes theme changes and updates theme color automatically
 */
export function observeThemeChanges(): () => void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        setThemeColor();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  
  // Return cleanup function
  return (): void => {
    observer.disconnect();
  };
}

/**
 * Observes system theme preference changes
 */
export function observeSystemThemeChanges(): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (): void => {
    setThemeColor();
  };
  
  // Modern API
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return (): void => {
      mediaQuery.removeEventListener('change', handler);
    };
  }
  
  // Legacy API fallback
  mediaQuery.addListener(handler);
  return (): void => {
    mediaQuery.removeListener(handler);
  };
}

/**
 * Initialize theme color management with auto-observation
 */
export function initThemeColor(): () => void {
  // Set initial color
  setThemeColor();
  
  // Observe theme changes
  const cleanupThemeObserver = observeThemeChanges();
  const cleanupSystemObserver = observeSystemThemeChanges();
  
  // Return combined cleanup function
  return (): void => {
    cleanupThemeObserver();
    cleanupSystemObserver();
  };
}

