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
