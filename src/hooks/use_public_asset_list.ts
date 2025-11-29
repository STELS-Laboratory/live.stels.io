/**
 * Hook for loading asset list via HTTP POST request (public, no auth required)
 */

import { useState, useCallback, useEffect, useRef } from "react";

// Asset data can be in two formats:
// 1. Full format with raw.genesis (from session)
// 2. Simplified format from public API (id, metadata directly)
interface AssetData {
	id?: string; // Direct token ID from public API
	channel?: string;
	module?: string;
	widget?: string;
	network?: string;
	address?: string;
	status?: string;
	metadata?: {
		name: string;
		symbol: string;
		decimals: number;
		description: string;
		icon?: string;
		contact?: string;
		website?: string;
	};
	raw?: {
		genesis: {
			token: {
				id: string;
				created_at: string;
				activation_time: string;
				issuer: {
					address: string;
					public_key: string;
					org: string;
					contact?: string;
				};
				standard: string;
				metadata: {
					name: string;
					symbol: string;
					decimals: number;
					description: string;
					icon?: string;
					contact?: string;
					website?: string;
				};
				economics: {
					supply: {
						initial: string;
						mintingPolicy: string;
						max: string;
					};
				};
			};
			[key: string]: unknown;
		};
		address: string;
		signature: string;
		publicKey: string;
		timestamp: number;
		status: string;
	};
	timestamp?: number;
}

interface AssetListResponse {
	webfix: string;
	result: {
		success: boolean;
		assets: AssetData[];
		total: number;
		network: string;
		timestamp: number;
	};
}

export interface UsePublicAssetListParams {
	network?: string;
	nodeType?: string; // "local" or "testnet" - determines API URL
}

export interface UsePublicAssetListReturn {
	assets: AssetData[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Default API URL for public requests
 */
const DEFAULT_NETWORK = "testnet";

/**
 * Get API URL based on node type selection
 */
function getApiUrl(_network: string, nodeType?: string): string {
	// Check localStorage for node type if not provided
	if (typeof window !== "undefined" && !nodeType) {
		nodeType = localStorage.getItem("explorer_node") || "testnet";
	}
	
	if (nodeType === "local") {
		return "http://10.0.0.238:8088/";
	}
	return "https://beta.stels.dev/";
}

/**
 * Get asset list from API (public, no auth required)
 */
export function usePublicAssetList(
	params: UsePublicAssetListParams = {},
): UsePublicAssetListReturn {
	const [assets, setAssets] = useState<AssetData[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const network = params.network || DEFAULT_NETWORK;
	const nodeType = params.nodeType || (typeof window !== "undefined" ? localStorage.getItem("explorer_node") || "testnet" : "testnet");
	const apiUrl = getApiUrl(network, nodeType);

	const fetchAssetList = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const requestBody = {
				webfix: "1.0",
				method: "assetList",
				params: [network],
			};

			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: AssetListResponse = await response.json();

			if (data.result?.success) {
				const assetsList = data.result.assets || [];
				setAssets(assetsList);

				if (assetsList.length > 0) {
					// Assets loaded
				}
			} else {
				throw new Error("Asset list request failed");
			}
		} catch(err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch asset list";

			setError(errorMessage);
			setAssets([]);
		} finally {
			setLoading(false);
		}
	}, [apiUrl, network]);

	// Load asset list on mount and when network changes
	// Use ref to prevent infinite loops
	const fetchRef = useRef(false);
	useEffect(() => {
		// Only fetch once per network/apiUrl combination
		if (!fetchRef.current) {
			fetchRef.current = true;
			fetchAssetList();
		} else {
			// Reset flag when network/apiUrl changes
			fetchRef.current = false;
		}
	}, [network, apiUrl, fetchAssetList]);

	return {
		assets,
		loading,
		error,
		refetch: fetchAssetList,
	};
}
