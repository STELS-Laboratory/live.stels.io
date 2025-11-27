/**
 * Global Chunk Loading Error Handler
 * Detects and handles chunk loading failures across the application
 */

/**
 * Check if an error is a chunk loading error
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  
  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("failed to load resource") ||
    message.includes("loading chunk") ||
    message.includes("chunk") ||
    message.includes("import()") ||
    (error.name === "TypeError" && message.includes("fetch"))
  );
}

/**
 * Handle chunk loading error by reloading the page
 */
export async function handleChunkLoadError(): Promise<void> {

  try {
    // Clear service worker caches (including schemas)
    if ("caches" in window) {
      const cacheNames = await caches.keys();

      // Delete all caches
      await Promise.all(cacheNames.map(async (name) => {

        await caches.delete(name);
      }));

    }

    // Unregister service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));

    }
  } catch {
			// Error handled silently
		}

  // Small delay to ensure cleanup completes
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Force reload
  window.location.reload();
}

/**
 * Initialize global error handlers for chunk loading
 */
export function initChunkErrorHandlers(): void {
  // Track if we've already shown the error to prevent loops
  let errorShown = false;

  // Handle unhandled promise rejections (for dynamic imports)
  window.addEventListener("unhandledrejection", (event) => {
    if (errorShown) return;

    const error = event.reason;
    
    if (isChunkLoadError(error)) {

      errorShown = true;
      event.preventDefault(); // Prevent default error handling
      
      // Show user-friendly message and reload
      handleChunkLoadError();
    }
  });

  // Handle regular errors
  window.addEventListener("error", (event) => {
    if (errorShown) return;

    const error = event.error;
    
    if (isChunkLoadError(error)) {

      errorShown = true;
      event.preventDefault(); // Prevent default error handling
      
      // Show user-friendly message and reload
      handleChunkLoadError();
    }
  });

}
