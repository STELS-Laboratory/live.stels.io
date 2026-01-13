import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { initThemeColor } from "@/lib/theme-color";
import {
  freezeNativeAPIs,
  performSecurityCheck,
} from "@/lib/pwa-security";
import { initChunkErrorHandlers } from "@/lib/chunk-error-handler";
import ChunkErrorBoundary from "@/components/main/chunk-error-boundary";
import { createNewSession, initSession } from "@/lib/session-manager";
import { getCurrentVersion } from "@/lib/version-check";

initThemeColor();

initChunkErrorHandlers();

initSession();

// Suppress expected "Canceled" errors from Monaco Editor
// These occur when the editor is disposed while workers are loading via Workbox
if (typeof window !== "undefined") {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    
    // Check various formats of "Canceled" error
    const reasonStr = reason ? String(reason) : "";
    const reasonMessage = 
      reason && typeof reason === "object" && "message" in reason
        ? String(reason.message)
        : "";
    const reasonName = 
      reason && typeof reason === "object" && "name" in reason
        ? String(reason.name)
        : "";
    
    const isCanceledError =
      reasonStr.includes("Canceled") ||
      reasonMessage.includes("Canceled") ||
      reasonName === "Canceled" ||
      reason === "Canceled";
    
    // Check if error originates from Monaco Editor
    const stack = 
      reason && typeof reason === "object" && "stack" in reason
        ? String(reason.stack)
        : "";
    const isMonacoError =
      stack.includes("editor") ||
      stack.includes("monaco") ||
      stack.includes("editor.api") ||
      reasonStr.includes("editor.api");
    
    if (isCanceledError && isMonacoError) {
      // Suppress expected Canceled errors from Monaco Editor cleanup
      event.preventDefault();
      event.stopPropagation();
      if (import.meta.env.DEV) {
        console.debug(
          "Monaco Editor: Suppressed expected Canceled error during cleanup",
        );
      }
      return;
    }
    
    // Also suppress Canceled errors even if we can't detect Monaco origin
    // (they're likely from Monaco Editor cleanup)
    if (isCanceledError) {
      event.preventDefault();
      event.stopPropagation();
      if (import.meta.env.DEV) {
        console.debug(
          "Suppressed Canceled error (likely from Monaco Editor cleanup)",
        );
      }
    }
  });
  
  // Also handle errors through window.onerror as a fallback
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const messageStr = String(message || "");
    if (messageStr.includes("Canceled") && (messageStr.includes("editor") || messageStr.includes("monaco"))) {
      if (import.meta.env.DEV) {
        console.debug("Suppressed Canceled error via window.onerror");
      }
      return true; // Suppress the error
    }
    // Call original handler if exists
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };
}

const currentVersion = getCurrentVersion();
const storedVersion = localStorage.getItem("app-last-version");

if (currentVersion && currentVersion !== storedVersion) {
  const newSessionId = createNewSession();
  document.body.setAttribute("session", newSessionId);

  localStorage.setItem("app-last-version", currentVersion);

  if ("caches" in window) {
    caches.keys().then((cacheNames) => {
      Promise.all(cacheNames.map((name) => caches.delete(name))).then(() => {
        // Caches cleared
      });
    });
  }
}

try {
  freezeNativeAPIs();

  performSecurityCheck();
} catch {
  // Security check failed silently
}

const savedTheme = localStorage.getItem("theme-store");
let themeMode: "light" | "dark" | "system" = "system";
let resolvedTheme: "light" | "dark" = "dark";

if (savedTheme) {
  try {
    const parsed = JSON.parse(savedTheme);
    themeMode = parsed.state?.theme || "system";
  } catch {
    // Invalid theme data, use default
  }
}

if (themeMode === "system") {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  resolvedTheme = prefersDark ? "dark" : "light";
} else {
  resolvedTheme = themeMode;
}

document.documentElement.classList.add(resolvedTheme);
document.documentElement.setAttribute("data-theme", resolvedTheme);

import { initializeNetwork } from "@/stores/modules/network.store";
initializeNetwork();

const rootElement = document.createElement("main");
document.body.setAttribute("stels", "1.12.00");
document.body.setAttribute("module", "web");
rootElement.className = "sonar";
document.body.appendChild(rootElement);

createRoot(rootElement).render(
  <ChunkErrorBoundary>
    <App />
  </ChunkErrorBoundary>,
);
