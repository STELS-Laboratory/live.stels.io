/**
 * Token Normalizer
 * Converts raw asset data from API to unified Token format
 */

import type { Token, RawAssetData, TokenMetadata, TokenEconomics, TokenIssuer, NetworkInfo, NetworkParameters, ProtocolInfo, SecurityRequirements } from "@/types/token";
import { isGenesisDocument, isValidToken } from "@/types/token";

/**
 * Normalize token metadata from various formats
 */
function normalizeMetadata(
	raw: RawAssetData,
): TokenMetadata {
	// Try legacy format first (raw.genesis.token.metadata)
	if (raw.raw?.genesis?.token?.metadata) {
		const meta = raw.raw.genesis.token.metadata;
		return {
			name: meta.name || "Unknown Token",
			symbol: meta.symbol || "UNKNOWN",
			decimals: meta.decimals ?? 6,
			description: meta.description,
			icon: meta.icon,
			contact: meta.contact,
			website: meta.website,
		};
	}
	
	// Try new format (metadata directly on asset)
	if (raw.metadata) {
		return {
			name: raw.metadata.name || "Unknown Token",
			symbol: raw.metadata.symbol || "UNKNOWN",
			decimals: raw.metadata.decimals ?? 6,
			description: raw.metadata.description,
			icon: raw.metadata.icon,
			contact: raw.metadata.contact,
			website: raw.metadata.website,
		};
	}
	
	// Try to extract from network parameters (for native tokens)
	if (raw.raw?.genesis?.parameters?.currency) {
		const currency = raw.raw.genesis.parameters.currency;
		return {
			name: currency.name || currency.symbol || "Native Token",
			symbol: currency.symbol || "NATIVE",
			decimals: currency.decimals ?? 8,
			description: `Native ${currency.symbol || "token"} for network`,
		};
	}
	
	// Default fallback
	return {
		name: "Unknown Token",
		symbol: "UNKNOWN",
		decimals: 6,
	};
}

/**
 * Normalize token economics
 */
function normalizeEconomics(
	raw: RawAssetData,
): TokenEconomics | undefined {
	const tokenData = raw.raw?.genesis?.token;
	
	if (!tokenData?.economics) {
		return undefined;
	}
	
	const economics = tokenData.economics;
	
	return {
		supply: economics.supply ? {
			initial: economics.supply.initial || "0",
			max: economics.supply.max,
			mintingPolicy: economics.supply.mintingPolicy,
		} : undefined,
		distribution: economics.distribution,
		feeStructure: economics.feeStructure,
		treasury: economics.treasury,
	};
}

/**
 * Normalize token issuer
 */
function normalizeIssuer(
	raw: RawAssetData,
): TokenIssuer | undefined {
	const tokenData = raw.raw?.genesis?.token;
	
	if (!tokenData?.issuer) {
		// Try to extract from genesis issuer for native tokens
		if (raw.raw?.genesis?.genesis?.issuer) {
			const genesisIssuer = raw.raw.genesis.genesis.issuer as {
				org?: string;
				contact?: string;
			};
			return {
				address: raw.raw.address || "",
				public_key: raw.raw.publicKey || "",
				org: genesisIssuer.org,
				contact: genesisIssuer.contact,
			};
		}
		return undefined;
	}
	
	return {
		address: tokenData.issuer.address || raw.raw?.address || "",
		public_key: tokenData.issuer.public_key || raw.raw?.publicKey || "",
		org: tokenData.issuer.org,
		contact: tokenData.issuer.contact,
	};
}

/**
 * Normalize network information
 */
function normalizeNetwork(
	raw: RawAssetData,
): NetworkInfo | undefined {
	if (!raw.raw?.genesis?.network) {
		return undefined;
	}
	
	const network = raw.raw.genesis.network;
	return {
		id: network.id || "",
		name: network.name || "",
		environment: network.environment,
		chain_id: network.chain_id ?? 0,
	};
}

/**
 * Normalize network parameters
 */
function normalizeParameters(
	raw: RawAssetData,
): NetworkParameters | undefined {
	if (!raw.raw?.genesis?.parameters) {
		return undefined;
	}
	
	const params = raw.raw.genesis.parameters;
	return {
		fees: {
			base: params.fees?.base || "0.0001",
			per_byte: params.fees?.per_byte || "0.0000002",
			raw_per_byte: params.fees?.raw_per_byte,
			currency: params.fees?.currency || "SLI",
		},
		currency: {
			symbol: params.currency?.symbol || "SLI",
			decimals: params.currency?.decimals ?? 8,
			fee_unit: params.currency?.fee_unit,
			name: params.currency?.name,
		},
		limits: {
			max_tx_size: params.limits?.max_tx_size ?? 65536,
			max_signatures: params.limits?.max_signatures ?? 8,
		},
		treasury_address: params.treasury_address || "",
		kv_limits: params.kv_limits,
		mempool: params.mempool,
		gate: params.gate,
	};
}

/**
 * Normalize protocol information
 */
function normalizeProtocol(
	raw: RawAssetData,
): ProtocolInfo | undefined {
	if (!raw.raw?.genesis?.protocol) {
		return undefined;
	}
	
	const protocol = raw.raw.genesis.protocol;
	return {
		tx_version: protocol.tx_version || "",
		vm_version: protocol.vm_version,
		canonicalization: protocol.canonicalization,
		encoding: protocol.encoding,
	};
}

/**
 * Normalize security requirements
 */
function normalizeSecurity(
	raw: RawAssetData,
): SecurityRequirements | undefined {
	if (!raw.raw?.genesis?.security) {
		return undefined;
	}
	
	const security = raw.raw.genesis.security;
	return {
		der_requirements: security.der_requirements,
	};
}

/**
 * Get token ID from various formats
 */
function getTokenId(raw: RawAssetData): string {
	// Try legacy format first
	if (raw.raw?.genesis?.token?.id) {
		return raw.raw.genesis.token.id;
	}
	
	// Try new format
	if (raw.id) {
		return raw.id;
	}
	
	// Try to extract from channel
	if (raw.channel) {
		// Extract token ID from channel like "asset.testnet.token:sha256:..."
		const tokenMatch = raw.channel.match(/token:([^.]+)/);
		if (tokenMatch) {
			return tokenMatch[1];
		}
	}
	
	// Fallback: generate from channel or use placeholder
	return raw.channel || `token-${Date.now()}`;
}

/**
 * Normalize raw asset data to unified Token format
 * 
 * @param raw - Raw asset data from API
 * @returns Normalized Token object or null if not a valid token
 */
export function normalizeToken(raw: RawAssetData): Token | null {
	// Skip genesis network documents
	if (isGenesisDocument(raw)) {
		return null;
	}
	
	// Must be a valid token
	if (!isValidToken(raw)) {
		return null;
	}
	
	const tokenId = getTokenId(raw);
	const tokenData = raw.raw?.genesis?.token;
	
	// Build normalized token
	const token: Token = {
		id: tokenId,
		channel: raw.channel,
		module: raw.module,
		widget: raw.widget,
		metadata: normalizeMetadata(raw),
		standard: tokenData?.standard,
		economics: normalizeEconomics(raw),
		issuer: normalizeIssuer(raw),
		created_at: tokenData?.created_at,
		activation_time: tokenData?.activation_time,
		network: normalizeNetwork(raw),
		parameters: normalizeParameters(raw),
		protocol: normalizeProtocol(raw),
		security: normalizeSecurity(raw),
		address: raw.raw?.address,
		signature: raw.raw?.signature,
		publicKey: raw.raw?.publicKey,
		timestamp: raw.timestamp || raw.raw?.timestamp,
		status: raw.raw?.status,
		validation_result: raw.raw?.validation_result,
	};
	
	return token;
}

/**
 * Normalize array of raw assets to tokens
 * Filters out genesis documents and invalid tokens
 * 
 * @param assets - Array of raw asset data
 * @returns Array of normalized Token objects
 */
export function normalizeTokens(assets: RawAssetData[]): Token[] {
	return assets
		.map((asset) => normalizeToken(asset))
		.filter((token): token is Token => token !== null);
}

/**
 * Create native token from genesis document
 * Extracts native token information from network genesis document
 * 
 * @param genesisDoc - Genesis network document
 * @param networkId - Network ID (testnet, mainnet, etc.)
 * @returns Normalized Token object for native token or null
 */
export function createNativeTokenFromGenesis(
	genesisDoc: RawAssetData,
	networkId: string,
): Token | null {
	if (!isGenesisDocument(genesisDoc)) {
		return null;
	}
	
	const parameters = genesisDoc.raw?.genesis?.parameters;
	if (!parameters?.currency) {
		return null;
	}
	
	const currency = parameters.currency;
	const genesis = genesisDoc.raw?.genesis?.genesis;
	const network = genesisDoc.raw?.genesis?.network;
	const state = genesisDoc.raw?.genesis?.state as {
		accounts?: Array<{
			address: string;
			balance: string;
			[key: string]: unknown;
		}>;
		[key: string]: unknown;
	} | undefined;
	const monetary = genesisDoc.raw?.genesis?.monetary as {
		supply_cap?: string;
		minting?: string;
		faucet?: {
			rate_per_request?: string;
			cooldown_ms?: number;
		};
		[key: string]: unknown;
	} | undefined;
	
	const genesisIssuer = genesis?.issuer as {
		org?: string;
		contact?: string;
	} | undefined;
	
	// Calculate initial supply from state.accounts
	// Balances in state.accounts are in smallest units (raw blockchain format)
	// API converts them to main units when returning (e.g., "1000000000.00000000" = 10 SLI)
	// But in genesis document, they remain in smallest units
	const decimals = currency.decimals ?? 8;
	let initialSupply = "0";
	if (state?.accounts && Array.isArray(state.accounts)) {
		const totalBalance = state.accounts.reduce((sum, account) => {
			const balance = account.balance ? parseFloat(account.balance) : 0;
			return sum + (isNaN(balance) ? 0 : balance);
		}, 0);
		// Convert from smallest units to main units
		// formatSupply expects values in main units (human-readable format)
		initialSupply = (totalBalance / Math.pow(10, decimals)).toString();
	}
	
	// Get max supply from monetary.supply_cap
	// supply_cap can be a number (in smallest units) or a special string like "testnet-unbounded"
	let maxSupply: string | undefined;
	if (monetary?.supply_cap) {
		const supplyCapStr = String(monetary.supply_cap).toLowerCase();
		// Check for special unbounded values
		if (
			supplyCapStr === "testnet-unbounded" ||
			supplyCapStr === "unbounded" ||
			supplyCapStr === "infinite" ||
			supplyCapStr === "unlimited"
		) {
			// For unbounded supply, we don't set max (undefined means unlimited)
			maxSupply = undefined;
		} else {
			// Try to parse as number (in smallest units)
			const supplyCap = parseFloat(monetary.supply_cap);
			if (!isNaN(supplyCap) && supplyCap > 0) {
				// Convert from smallest units to main units
				maxSupply = (supplyCap / Math.pow(10, decimals)).toString();
			}
		}
	}
	
	// Determine minting policy
	let mintingPolicy: string | undefined;
	if (monetary?.minting === "disabled") {
		mintingPolicy = "fixed";
	} else if (monetary?.minting === "enabled") {
		mintingPolicy = "infinite";
	} else if (monetary?.faucet) {
		mintingPolicy = "faucet";
	}
	
	// Create distribution from state.accounts
	// Balances are in smallest units, convert to main units for display
	const distribution = state?.accounts?.map((account) => {
		const balance = account.balance ? parseFloat(account.balance) : 0;
		if (isNaN(balance) || balance === 0) return null;
		// Convert from smallest units to main units
		const mainUnits = balance / Math.pow(10, decimals);
		return {
			address: account.address,
			amount: mainUnits.toString(),
		};
	}).filter((dist): dist is { address: string; amount: string } => dist !== null) || [];
	
	return {
		id: `native:${networkId}`,
		channel: `asset.${networkId}.native`,
		module: "asset",
		widget: `widget.asset.${networkId}.native`,
		metadata: {
			name: currency.name || currency.symbol || "Native Token",
			symbol: currency.symbol || "SLI",
			decimals: currency.decimals ?? 8,
			description: `Native ${currency.symbol || "SLI"} token for ${networkId} network`,
		},
		standard: "native",
		economics: {
			supply: {
				initial: initialSupply,
				max: maxSupply,
				mintingPolicy: mintingPolicy,
			},
			distribution: distribution.length > 0 ? distribution : undefined,
		},
		issuer: {
			address: genesisDoc.raw?.address || "",
			public_key: genesisDoc.raw?.publicKey || "",
			org: genesisIssuer?.org || "Network",
			contact: genesisIssuer?.contact,
		},
		created_at: genesis?.created_at,
		activation_time: genesis?.activation_time,
		network: network ? {
			id: network.id || networkId,
			name: network.name || "",
			environment: network.environment,
			chain_id: network.chain_id ?? 0,
		} : undefined,
		parameters: normalizeParameters(genesisDoc),
		protocol: normalizeProtocol(genesisDoc),
		security: normalizeSecurity(genesisDoc),
		address: genesisDoc.raw?.address,
		signature: genesisDoc.raw?.signature,
		publicKey: genesisDoc.raw?.publicKey,
		timestamp: genesisDoc.timestamp || genesisDoc.raw?.timestamp,
		status: genesisDoc.raw?.status || "active",
	};
}

