/**
 * Type definitions for Welcome screen
 */

import type React from "react";

/**
 * Application metadata for the app store
 */
export interface AppMetadata {
	id: string;
	route: string;
	name: string;
	tagline: string;
	description: string;
	icon: React.ReactNode;
	color: string;
	category:
		| "Analytics"
		| "Trading"
		| "Development"
		| "Network"
		| "Visualization";
	featured?: boolean;
	size?: "large" | "medium" | "small";
	badge?: string;
	stats?: string;
}
