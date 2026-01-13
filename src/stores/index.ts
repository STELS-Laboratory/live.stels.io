/**
 * Global stores exports
 * Application-specific stores are located in their respective app directories
 */

// Global stores
export { useAppStore } from "./modules/app.store.ts";
export { useAuthStore } from "./modules/auth.store.ts";
export { useThemeStore } from "./modules/theme.store.ts";
export { useAccountsStore } from "./modules/accounts.store.ts";
export { useOpenAppsStore } from "./modules/open-apps.store";
export { toast, useToastStore } from "./modules/toast.store.ts";

// Selectors for optimized re-renders
export * from "./selectors";

// Types
export type { ResolvedTheme, ThemeMode } from "./modules/theme.store.ts";
export type { AppState } from "./modules/app.store.ts";
export type {
  AuthStore,
  ConnectionSession,
  NetworkConfig,
} from "./modules/auth.store.ts";
export type { AccountsStore, StoredAccount } from "./modules/accounts.store.ts";
export type { OpenApp, OpenAppsState } from "./modules/open-apps.store";
export type { Toast, ToastStore, ToastType } from "./modules/toast.store.ts";
