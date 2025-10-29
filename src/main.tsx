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
const appSessionId = initSession();
console.log("[Main] Application session:", appSessionId);

// Check if this is a new version deployment
const currentVersion = getCurrentVersion();
const storedVersion = localStorage.getItem("app-last-version");

if (currentVersion && currentVersion !== storedVersion) {
	console.log("[Main] New version detected, creating new session...", {
		current: currentVersion,
		stored: storedVersion,
	});

	// Force new session on version change
	const newSessionId = createNewSession();
	document.body.setAttribute("session", newSessionId);

	// Store new version
	localStorage.setItem("app-last-version", currentVersion);

	// Clear all caches
	if ("caches" in window) {
		caches.keys().then((cacheNames) => {
			Promise.all(cacheNames.map((name) => caches.delete(name))).then(() => {
				console.log("[Main] All caches cleared for new version");
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
		console.error("[Security] Crypto operations validation failed!");
	}

	// Perform security check
	const securityCheck = performSecurityCheck();
	console.log("[Security] Security check:", {
		standalone: securityCheck.isStandalone,
		trusted: securityCheck.isTrustedContext,
		extensions: securityCheck.suspiciousExtensions.length,
	});
} catch (error) {
	console.error("[Security] Security initialization failed:", error);
}

// Initialize theme on startup with system detection
const savedTheme = localStorage.getItem("theme-store");
let themeMode: "light" | "dark" | "system" = "system";
let resolvedTheme: "light" | "dark" = "dark";

if (savedTheme) {
	try {
		const parsed = JSON.parse(savedTheme);
		themeMode = parsed.state?.theme || "system";
	} catch (e) {
		console.error("[Theme] Failed to parse saved theme:", e);
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

const rootElement = document.createElement("main");
document.body.setAttribute("stels", "1.12.00");
document.body.setAttribute("module", "web");
document.body.setAttribute("network", "testnet");
// Session is already set by initSession() above
rootElement.className = "sonar";
document.body.appendChild(rootElement);

createRoot(rootElement).render(
	<ChunkErrorBoundary>
		<App />
	</ChunkErrorBoundary>,
);
