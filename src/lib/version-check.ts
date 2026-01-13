/**
 * Version Check Utility
 * Detects when a new version of the application is deployed
 */

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const VERSION_KEY = "app-build-version";
const LAST_NOTIFIED_VERSION_KEY = "app-last-notified-version";

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
  } catch {
    // Error handled silently
  }
}

/**
 * Get last notified version from localStorage
 * This prevents showing the same version prompt multiple times
 */
export function getLastNotifiedVersion(): string | null {
  try {
    return localStorage.getItem(LAST_NOTIFIED_VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Store last notified version in localStorage
 */
export function storeLastNotifiedVersion(version: string): void {
  try {
    localStorage.setItem(LAST_NOTIFIED_VERSION_KEY, version);
  } catch {
    // Error handled silently
  }
}

/**
 * Check if current version differs from stored version
 */
export function hasVersionChanged(): boolean {
  const currentVersion = getCurrentVersion();
  const storedVersion = getStoredVersion();

  // If no version info available, assume no change
  if (!currentVersion || !storedVersion) {
    return false;
  }

  return currentVersion !== storedVersion;
}

/**
 * Fetch latest version from server
 * Uses GET request to a lightweight endpoint to avoid HTTP/2 protocol errors
 * Uses a combination of ETag and Last-Modified for stable version detection
 */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    // First, try to get version from meta tag (most reliable if set during build)
    const metaVersion = getCurrentVersion();
    if (metaVersion && metaVersion !== "BUILD_TIMESTAMP") {
      return metaVersion;
    }

    // Fallback: Use HEAD request to manifest.webmanifest to get headers without downloading content
    // This is more efficient and avoids cache-busting issues
    const response = await fetch("/manifest.webmanifest", {
      method: "HEAD",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      return null;
    }

    // Use ETag or Last-Modified as version identifier
    const etag = response.headers.get("etag");
    const lastModified = response.headers.get("last-modified");

    // Prefer Last-Modified over ETag for stability
    // ETag can vary based on query parameters, but Last-Modified is more stable
    if (lastModified) {
      return `last-modified:${lastModified}`;
    }

    // Fallback to ETag if Last-Modified is not available
    // Normalize ETag by removing quotes if present
    const normalizedEtag = etag ? etag.replace(/^"|"$/g, "") : null;
    return normalizedEtag ? `etag:${normalizedEtag}` : null;
  } catch {
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
  const startTime = Date.now();
  // Don't check for new versions in the first 10 seconds after app start
  // This prevents false positives right after a reload
  const INITIAL_DELAY = 10 * 1000;

  // Initialize stored version if it doesn't exist
  const initializeStoredVersion = async (): Promise<void> => {
    const storedVersion = getStoredVersion();
    if (!storedVersion) {
      // If no stored version, fetch current and store it
      const currentVersion = await fetchLatestVersion();
      if (currentVersion) {
        storeCurrentVersion(currentVersion);
        // Also mark this version as notified to prevent immediate prompt
        storeLastNotifiedVersion(currentVersion);
      }
    }
  };

  const checkVersion = async (): Promise<void> => {
    try {
      // Skip check if we're still in the initial delay period
      if (Date.now() - startTime < INITIAL_DELAY) {
        return;
      }

      // Initialize stored version on first check if needed
      await initializeStoredVersion();

      // Read stored version fresh on each check to avoid stale closure issues
      const storedVersion = getStoredVersion();
      const latestVersion = await fetchLatestVersion();
      const lastNotifiedVersion = getLastNotifiedVersion();

      // Only trigger if:
      // 1. We have both versions
      // 2. They differ (new version detected)
      // 3. We haven't already notified about this specific version
      if (
        latestVersion &&
        storedVersion &&
        latestVersion !== storedVersion &&
        latestVersion !== lastNotifiedVersion
      ) {
        // Mark this version as notified before calling callback
        // This prevents multiple triggers if callback is called multiple times
        storeLastNotifiedVersion(latestVersion);
        onNewVersion(latestVersion);
      }
    } catch {
      // Error handled silently
    }
  };

  // Don't check immediately - wait for initial delay to pass
  // This prevents false positives right after page load/reload
  const initialTimeout = setTimeout(() => {
    checkVersion();
  }, INITIAL_DELAY);

  // Then check periodically
  const intervalId = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

  // Return cleanup function
  return () => {
    clearTimeout(initialTimeout);
    clearInterval(intervalId);
  };
}
