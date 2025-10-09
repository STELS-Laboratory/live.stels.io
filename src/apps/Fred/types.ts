/**
 * TypeScript type definitions for Fred (FRED Economic Indicators) module
 */

export interface FredIndicator {
	key: string;
	value: {
		channel: string;
		module: string;
		widget: string;
		raw: {
			source: string;
			groupId: string;
			indicator: string;
			indicatorName: string;
			unit: string;
			scale?: number;
			agg: string;
			invert?: boolean;
			country: string;
			countryName: string;
			date: string;
			value: number;
			decimal: number;
		};
		timestamp: number;
	};
}

export interface CountryData {
	country: string;
	countryName: string;
	indicators: FredIndicator[];
	categories: Record<string, FredIndicator[]>;
}

export interface CategoryData {
	name: string;
	displayName: string;
	color: string;
	icon: React.ReactNode;
}

export interface IndicatorGroup {
	category: string;
	indicators: FredIndicator[];
	total: number;
}

