/**
 * Version Check Utility
 * Detects when a new version of the application is deployed
 */

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const VERSION_KEY = "app-build-version";

/**
 * Get current build version from meta tag
 */
export function getCurrentVersion(): string | null {
  const metaTag = document.querySelector('meta[name="build-version"]');
  return metaTag?.getAttribute("content") || null;
}

/**
 * Get stored version from localStorage
 */
export function getStoredVersion(): string | null {
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Store current version in localStorage
 */
export function storeCurrentVersion(version: string): void {
  try {
    localStorage.setItem(VERSION_KEY, version);
  } catch (error) {
    console.error("[VersionCheck] Failed to store version:", error);
  }
}

/**
 * Check if current version differs from stored version
 */
export function hasVersionChanged(): boolean {
  const currentVersion = getCurrentVersion();
  const storedVersion = getStoredVersion();

  console.log("[VersionCheck] Version comparison:", {
    currentVersion,
    storedVersion,
  });

  // If no version info available, assume no change
  if (!currentVersion || !storedVersion) {
    return false;
  }

  return currentVersion !== storedVersion;
}

/**
 * Fetch latest version from server
 * This checks if index.html has a new build-version meta tag
 */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    // Fetch index.html with cache-busting
    const response = await fetch(`/?t=${Date.now()}`, {
      method: "HEAD",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });

    if (!response.ok) {
      console.warn("[VersionCheck] Failed to fetch version:", response.status);
      return null;
    }

    // Try to get version from ETag or custom header
    const etag = response.headers.get("etag");
    const lastModified = response.headers.get("last-modified");
    
    // Use ETag as version identifier
    return etag || lastModified;
  } catch (error) {
    console.error("[VersionCheck] Error fetching version:", error);
    return null;
  }
}

/**
 * Initialize version tracking
 * Stores current version on first load
 */
export function initVersionTracking(): void {
  const currentVersion = getCurrentVersion();
  
  if (currentVersion && !getStoredVersion()) {
    console.log("[VersionCheck] Initializing version tracking:", currentVersion);
    storeCurrentVersion(currentVersion);
  }
}

/**
 * Start periodic version checking
 * Calls callback when new version is detected
 */
export function startVersionCheck(
  onNewVersion: (newVersion: string) => void,
): () => void {
  console.log("[VersionCheck] Starting periodic version check...");

  const storedVersion = getStoredVersion();

  const checkVersion = async (): Promise<void> => {
    try {
      const latestVersion = await fetchLatestVersion();
      
      if (latestVersion && storedVersion && latestVersion !== storedVersion) {
        console.log("[VersionCheck] New version detected:", {
          stored: storedVersion,
          latest: latestVersion,
        });
        onNewVersion(latestVersion);
      }
    } catch (error) {
      console.error("[VersionCheck] Version check failed:", error);
    }
  };

  // Check immediately
  checkVersion();

  // Then check periodically
  const intervalId = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

  // Return cleanup function
  return () => {
    console.log("[VersionCheck] Stopping version check");
    clearInterval(intervalId);
  };
}

