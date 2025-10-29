/**
 * Session Manager
 * Manages application session ID for cache invalidation
 */

const SESSION_KEY = "app-session-id";

/**
 * Generate unique session ID
 */
export function generateSessionId(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get current session ID
 * Returns existing session or creates new one
 */
export function getSessionId(): string {
  try {
    // Try to get existing session
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      console.log("[SessionManager] Using existing session:", stored);
      return stored;
    }
  } catch (error) {
    console.error("[SessionManager] Error reading session:", error);
  }

  // Create new session
  const newSession = generateSessionId();
  console.log("[SessionManager] Created new session:", newSession);
  
  try {
    localStorage.setItem(SESSION_KEY, newSession);
  } catch (error) {
    console.error("[SessionManager] Error storing session:", error);
  }

  return newSession;
}

/**
 * Force create new session (invalidates cache)
 */
export function createNewSession(): string {
  const newSession = generateSessionId();
  console.log("[SessionManager] Forcing new session:", newSession);
  
  try {
    localStorage.setItem(SESSION_KEY, newSession);
  } catch (error) {
    console.error("[SessionManager] Error storing new session:", error);
  }

  return newSession;
}

/**
 * Get session from body attribute (for compatibility)
 */
export function getBodySessionId(): string | null {
  return document.body.getAttribute("session");
}

/**
 * Set session to body attribute
 */
export function setBodySessionId(sessionId: string): void {
  document.body.setAttribute("session", sessionId);
}

/**
 * Append session to URL for cache busting
 */
export function appendSession(url: string, sessionId?: string): string {
  const session = sessionId || getSessionId();
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}session=${session}`;
}

/**
 * Initialize session management
 * Returns session ID for use in app
 */
export function initSession(): string {
  const sessionId = getSessionId();
  setBodySessionId(sessionId);
  
  console.log("[SessionManager] ═══════════════════════════════════════");
  console.log("[SessionManager] Session initialized");
  console.log("[SessionManager] Session ID:", sessionId);
  console.log("[SessionManager] Body attribute:", getBodySessionId());
  console.log("[SessionManager] localStorage value:", localStorage.getItem("app-session-id"));
  console.log("[SessionManager] ═══════════════════════════════════════");

  return sessionId;
}

