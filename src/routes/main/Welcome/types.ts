/**
 * Welcome module type definitions
 * TypeScript interfaces extracted from Welcome.tsx
 */

import type React from "react";

/**
 * Application metadata structure
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

/**
 * App card component props
 */
export interface AppCardProps {
	app: AppMetadata;
	onLaunch: (route: string) => void;
	isMobile: boolean;
}

