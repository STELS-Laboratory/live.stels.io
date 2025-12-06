/**
 * Unified Token Type Definition
 * Standard interface for all token data in the application
 */

/**
 * Token metadata
 */
export interface TokenMetadata {
	name: string;
	symbol: string;
	decimals: number;
	description?: string;
	icon?: string;
	contact?: string;
	website?: string;
}

/**
 * Token supply information
 */
export interface TokenSupply {
	initial: string;
	max?: string;
	mintingPolicy?: string;
}

/**
 * Token distribution entry
 */
export interface TokenDistribution {
	address: string;
	amount: string;
}

/**
 * Token fee structure
 */
export interface TokenFeeStructure {
	transfer?: string;
	minting?: string;
	burning?: string;
}

/**
 * Token economics
 */
export interface TokenEconomics {
	supply?: TokenSupply;
	distribution?: TokenDistribution[];
	feeStructure?: TokenFeeStructure;
	treasury?: string;
}

/**
 * Token issuer information
 */
export interface TokenIssuer {
	address: string;
	public_key: string;
	org?: string;
	contact?: string;
}

/**
 * Network parameters
 */
export interface NetworkParameters {
	fees: {
		base: string;
		per_byte: string;
		raw_per_byte?: string;
		currency: string;
	};
	currency: {
		symbol: string;
		decimals: number;
		fee_unit?: string;
		name?: string;
	};
	limits: {
		max_tx_size: number;
		max_signatures: number;
	};
	treasury_address: string;
	kv_limits?: {
		value_max_bytes?: number;
		raw_soft_cap_bytes?: number;
		tx_raw_ttl_ms?: number;
	};
	mempool?: {
		max_pending_per_address?: number;
		max_pending_bytes_per_address?: number;
		reject_siblings_on_prev_hash?: boolean;
		reject_duplicate_prev_hash?: boolean;
		priority?: string;
		ttl_ms?: number;
	};
	gate?: {
		ttl_ms?: number;
		max_per_address?: number;
		max_total?: number;
		eviction?: string;
		on_expire?: string;
	};
}

/**
 * Network information
 */
export interface NetworkInfo {
	id: string;
	name: string;
	environment?: string;
	chain_id: number;
}

/**
 * Protocol information
 */
export interface ProtocolInfo {
	tx_version: string;
	vm_version?: string;
	canonicalization?: string;
	encoding?: string;
}

/**
 * Security requirements
 */
export interface SecurityRequirements {
	der_requirements?: {
		lowS: boolean;
		canonical_DER: boolean;
	};
}

/**
 * Unified Token Type
 * This is the standard format for all tokens in the application
 */
export interface Token {
	// Core identification
	id: string;
	channel?: string;
	module?: string;
	widget?: string;
	
	// Token metadata
	metadata: TokenMetadata;
	
	// Token standard
	standard?: string;
	
	// Token economics
	economics?: TokenEconomics;
	
	// Issuer information
	issuer?: TokenIssuer;
	
	// Timestamps
	created_at?: string;
	activation_time?: string;
	
	// Network information
	network?: NetworkInfo;
	
	// Network parameters (for native tokens and network configuration)
	parameters?: NetworkParameters;
	
	// Protocol information
	protocol?: ProtocolInfo;
	
	// Security requirements
	security?: SecurityRequirements;
	
	// Document metadata
	address?: string;
	signature?: string;
	publicKey?: string;
	timestamp?: number;
	status?: string;
	
	// Validation
	validation_result?: {
		structure_valid?: boolean;
		signatures_valid?: boolean;
		schema_valid?: boolean;
	};
}

/**
 * Raw asset data from API (before normalization)
 */
export interface RawAssetData {
	id?: string;
	channel?: string;
	module?: string;
	widget?: string;
	metadata?: TokenMetadata;
	raw?: {
		genesis?: {
			token?: {
				id: string;
				created_at?: string;
				activation_time?: string;
				issuer?: TokenIssuer;
				standard?: string;
				metadata?: TokenMetadata;
				economics?: TokenEconomics;
			};
			genesis?: Record<string, unknown>;
			network?: NetworkInfo;
			parameters?: NetworkParameters;
			protocol?: ProtocolInfo;
			security?: SecurityRequirements;
			[key: string]: unknown;
		};
		address?: string;
		signature?: string;
		publicKey?: string;
		timestamp?: number;
		status?: string;
		validation_result?: {
			structure_valid?: boolean;
			signatures_valid?: boolean;
			schema_valid?: boolean;
		};
		[key: string]: unknown;
	};
	timestamp?: number;
	[key: string]: unknown;
}

/**
 * Check if asset is a genesis network document (not a token)
 */
export function isGenesisDocument(asset: RawAssetData): boolean {
	if (!asset.raw?.genesis) return false;
	
	// Check if it's a genesis network document
	const isGenesisDoc = asset.channel?.includes(".genesis:") || 
		(asset.raw.genesis.genesis && !asset.raw.genesis.token);
	
	return isGenesisDoc;
}

/**
 * Check if asset is a valid token
 */
export function isValidToken(asset: RawAssetData): boolean {
	if (isGenesisDocument(asset)) return false;
	
	// Must have token data in either format
	return !!(asset.raw?.genesis?.token || asset.metadata);
}

