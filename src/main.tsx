import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { initThemeColor } from "@/lib/theme-color";
import {
	freezeNativeAPIs,
	performSecurityCheck,
	validateCryptoOperations,
} from "@/lib/pwa-security";
import { initChunkErrorHandlers } from "@/lib/chunk_error_handler";
import ChunkErrorBoundary from "@/components/main/chunk_error_boundary";
import { createNewSession, initSession } from "@/lib/session_manager";
import { getCurrentVersion } from "@/lib/version_check";
// CodeMirror doesn't need pre-configuration

// Service Worker registration is handled by UpdatePrompt component
// Using registerType: 'prompt' in vite.config.ts

// Initialize dynamic theme color management
initThemeColor();

// Initialize chunk error handlers
initChunkErrorHandlers();

// Initialize session management
// This creates/retrieves a persistent session ID used for cache busting
initSession();

// Check if this is a new version deployment
const currentVersion = getCurrentVersion();
const storedVersion = localStorage.getItem("app-last-version");

if (currentVersion && currentVersion !== storedVersion) {

	// Force new session on version change
	const newSessionId = createNewSession();
	document.body.setAttribute("session", newSessionId);

	// Store new version
	localStorage.setItem("app-last-version", currentVersion);

		// Clear all caches
		if ("caches" in window) {
			caches.keys().then((cacheNames) => {
				Promise.all(cacheNames.map((name) => caches.delete(name))).then(() => {
					// Caches cleared
				});
			});
		}
}

// Initialize security measures
try {
	// Freeze native APIs to prevent extension tampering
	freezeNativeAPIs();

	// Validate crypto operations
	if (!validateCryptoOperations()) {
		// Crypto validation failed
	}

	// Perform security check
	performSecurityCheck();

} catch {
	// Security initialization failed
}

// Initialize theme on startup with system detection
const savedTheme = localStorage.getItem("theme-store");
let themeMode: "light" | "dark" | "system" = "system";
let resolvedTheme: "light" | "dark" = "dark";

if (savedTheme) {
	try {
		const parsed = JSON.parse(savedTheme);
		themeMode = parsed.state?.theme || "system";
	} catch {
			// Error handled silently
		}
}

// Resolve system theme if needed
if (themeMode === "system") {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	resolvedTheme = prefersDark ? "dark" : "light";
} else {
	resolvedTheme = themeMode;
}

document.documentElement.classList.add(resolvedTheme);
document.documentElement.setAttribute("data-theme", resolvedTheme);

// Initialize network store
import { initializeNetwork } from "@/stores/modules/network.store";
initializeNetwork();

const rootElement = document.createElement("main");
document.body.setAttribute("stels", "1.12.00");
document.body.setAttribute("module", "web");
// Network attribute is set by initializeNetwork()
rootElement.className = "sonar";
document.body.appendChild(rootElement);

createRoot(rootElement).render(
	<ChunkErrorBoundary>
		<App />
	</ChunkErrorBoundary>,
);
