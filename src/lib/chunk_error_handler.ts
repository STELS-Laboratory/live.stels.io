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
  console.log("[ChunkErrorHandler] Chunk loading error detected, preparing reload...");

  try {
    // Clear service worker caches (including schemas)
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      console.log("[ChunkErrorHandler] Found caches:", cacheNames);
      
      // Delete all caches
      await Promise.all(cacheNames.map(async (name) => {
        console.log("[ChunkErrorHandler] Deleting cache:", name);
        await caches.delete(name);
      }));
      
      console.log("[ChunkErrorHandler] All caches cleared (including schemas)");
    }

    // Unregister service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      console.log("[ChunkErrorHandler] Service workers unregistered");
    }
  } catch (error) {
    console.error("[ChunkErrorHandler] Error during cleanup:", error);
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
      console.error("[ChunkErrorHandler] Unhandled chunk load error:", error);
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
      console.error("[ChunkErrorHandler] Chunk load error:", error);
      errorShown = true;
      event.preventDefault(); // Prevent default error handling
      
      // Show user-friendly message and reload
      handleChunkLoadError();
    }
  });

  console.log("[ChunkErrorHandler] Global error handlers initialized");
}

