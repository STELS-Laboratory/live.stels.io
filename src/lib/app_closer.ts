import { useAuthStore } from "@/stores";

/**
 * Global function to close the application
 * Clears all data and attempts to close the window/tab
 * 
 * Usage:
 * - From console: window.closeApp()
 * - From code: closeApp()
 */
export async function closeApp(): Promise<void> {
	try {
		// Get auth store and reset all data
		const authStore = useAuthStore.getState();
		await authStore.resetAuth();

		// Small delay to ensure cleanup completes
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Attempt multiple methods to close the app
		// Method 1: Try window.close() if window was opened by script
		if (window.opener || window.history.length <= 1) {
			window.close();
			// Give it a moment to close
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Method 2: If still open, try to navigate away
		// Check if window is still open by trying to access window.closed
		if (!window.closed) {
			// Try to go back in history (if possible)
			if (window.history.length > 1) {
				window.history.go(-window.history.length);
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Method 3: Redirect to blank page as last resort
			if (!window.closed) {
				window.location.href = "about:blank";
			}
		}
	} catch (error) {
		console.error("Error closing app:", error);
		// Even if there's an error, try to close/redirect
		try {
			if (window.opener || window.history.length <= 1) {
				window.close();
			} else {
				window.location.href = "about:blank";
			}
		} catch {
			// Final fallback - redirect to blank page
			window.location.href = "about:blank";
		}
	}
}

/**
 * Initialize global closeApp function on window object
 */
export function initGlobalCloseApp(): void {
	if (typeof window !== "undefined") {
		(window as Window & { closeApp: () => Promise<void> }).closeApp = closeApp;
	}
}
