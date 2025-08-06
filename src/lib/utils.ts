import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

/**
 * Combines and merges CSS classes using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs))
}

interface SessionValue {
	key: string;
	value: unknown;
}

/**
 * Filters session data by pattern matching on keys
 */
export function filterSession(
	session: Record<string, unknown>,
	pattern: string | RegExp
): SessionValue[] {
	const result: SessionValue[] = [];
	
	const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
	
	for (const key in session) {
		if (regex.test(key)) {
			result.push({
				key,
				value: session[key]
			});
		}
	}
	
	return result;
}

export function parseTradingPair(pair: string): { base: string; quote: string } | null {
	const match = pair.match(/^([A-Z0-9]+)\/([A-Z0-9]+)(?::[A-Z0-9]+)?$/);
	if (!match) return null;
	
	const [, base, quote] = match;
	return { base, quote };
}

/**
 * Removes ReactFlow branding links from the DOM
 */
export function cleanBrands(): void {
	const links = document.querySelectorAll('a');
	
	links.forEach(link => {
		if (link.href === 'https://reactflow.dev/') {
			const parent = link.parentElement;
			
			if (parent) {
				parent.remove();
			}
		}
	});
}

/**
 * Generate a UTF-8 safe hash from any data
 * Uses a simple djb2-style string hash algorithm that works with Unicode characters
 */
export function generateDataHash(data: unknown): string {
	try {
		const jsonString = JSON.stringify(data);
		// Simple djb2-style hash function that works with UTF-8
		let hash = 0;
		for (let i = 0; i < jsonString.length; i++) {
			const char = jsonString.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return Math.abs(hash).toString(16).slice(0, 16);
	} catch (error) {
		console.error("Failed to generate data hash:", error);
		return Date.now().toString(16);
	}
}
