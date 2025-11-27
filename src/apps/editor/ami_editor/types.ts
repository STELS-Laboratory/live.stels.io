/**
 * TypeScript type definitions for AMIEditor module
 */

import type { Worker } from "../store.ts";

export interface WorkerFormData {
	title: string;
	type: string;
	brain: string;
	interval: string;
	connectors: string;
	markets: string;
	script: string;
	note: string;
}

export interface WorkerStats {
	total: number;
	active: number;
	inactive: number;
	byBrain: Record<string, number>;
	byType: Record<string, number>;
}

export interface FilterOptions {
	searchTerm: string;
	filterActive: boolean | null;
}

export type { Worker };
