/**
 * Template App Type Definitions
 * 
 * INSTRUCTIONS:
 * 1. Replace these types with your app's data types
 * 2. Add interfaces for all data structures
 * 3. Export types used across components
 */

/**
 * Template data structure
 * Replace with your actual data type
 */
export interface TemplateData {
	id: string;
	title: string;
	value: number;
	timestamp: number;
	// Add your fields here
}

/**
 * Template store state
 */
export interface TemplateStore {
	data: TemplateData | null;
	isLoading: boolean;
	error: string | null;
	lastUpdate: number | null;
	
	// Actions
	loadData: () => Promise<void>;
	setData: (data: TemplateData) => void;
	clearError: () => void;
	resetData: () => void;
}

/**
 * Template configuration
 */
export interface TemplateConfig {
	refreshInterval?: number;
	autoRefresh?: boolean;
	maxRetries?: number;
}

/**
 * Template API response
 */
export interface TemplateApiResponse {
	success: boolean;
	data: TemplateData;
	message?: string;
}

/**
 * Template filter options
 */
export interface TemplateFilterOptions {
	searchTerm: string;
	sortBy: "name" | "date" | "value";
	sortOrder: "asc" | "desc";
}

