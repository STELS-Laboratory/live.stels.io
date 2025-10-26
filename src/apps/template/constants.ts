/**
 * Template App Constants
 * 
 * INSTRUCTIONS:
 * 1. Add your app-specific constants here
 * 2. Use TypeScript const assertions for type safety
 * 3. Group related constants together
 */

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
	refreshInterval: 5000, // 5 seconds
	autoRefresh: false,
	maxRetries: 3,
} as const;

/**
 * Status types and their colors
 */
export const STATUS_COLORS = {
	active: "bg-green-500",
	inactive: "bg-muted",
	error: "bg-red-500",
	pending: "bg-yellow-500",
} as const;

/**
 * Example categories
 */
export const CATEGORIES = [
	"category-1",
	"category-2",
	"category-3",
] as const;

/**
 * API endpoints (example)
 */
export const API_ENDPOINTS = {
	getData: "/api/template/data",
	updateData: "/api/template/update",
	deleteData: "/api/template/delete",
} as const;

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
	refresh: "r",
	save: "s",
	close: "Escape",
} as const;

