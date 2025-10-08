import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";

function generateId(length = 16): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
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
document.body.setAttribute("module", "sonar");
document.body.setAttribute("network", "testnet");
document.body.setAttribute("session", generateId());
rootElement.className = "sonar";
document.body.appendChild(rootElement);

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
