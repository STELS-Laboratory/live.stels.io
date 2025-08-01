import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function filterSession(
	session: Record<string, any>,
	pattern: string | RegExp
) {
	const result: { key: string; value: any }[] = [];
	
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

export function cleanBrands(){
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
