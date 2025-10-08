/**
 * TypeScript type definitions for HeterogenMap (Globe visualization)
 */

export interface LocationData {
	latitude: number;
	longitude: number;
	name: string;
	ip: string;
	network: string;
	version: string;
	city: string;
	region: string | null;
	region_code: string | null;
	country: string;
	country_name: string;
	country_code: string;
	country_code_iso3: string;
	country_capital: string;
	country_tld: string;
	continent_code: string;
	in_eu: boolean;
	postal: string;
	timezone: string;
	utc_offset: string;
	country_calling_code: string;
	currency: string;
	currency_name: string;
	languages: string;
	country_area: number;
	country_population: number;
	asn: string;
	org: string;
}

export interface ConfigData {
	network: string;
	title: string;
	type: string;
	brain: string;
	tick: number;
	limit: boolean;
	connectors: string[];
	markets: string[];
	dns: {
		public: boolean;
		hetNet: {
			socket: string;
			protocol: string;
		};
	};
}

export interface NodeData {
	name: string;
	location: LocationData;
	config: ConfigData;
}

export interface CountEntry {
	name: string;
	count: number;
}

export interface NetworkStats {
	totalNodes: number;
	uniqueNetworks: number;
	uniqueCountries: number;
	topNetworks: CountEntry[];
	topCountries: CountEntry[];
	publicNodes: number;
	privateNodes: number;
	avgConnectors: number;
	avgMarkets: number;
}

