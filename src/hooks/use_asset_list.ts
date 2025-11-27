/**
 * Hook for loading asset list via HTTP POST request
 */

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores";

interface AssetListRequest {
	webfix: string;
	method: string;
	params: string[];
}

interface AssetData {
	channel: string;
	module: string;
	widget: string;
	raw: {
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
	timestamp: number;
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

export function useAssetList(): {
	assets: AssetData[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
} {
	const [assets, setAssets] = useState<AssetData[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { connectionSession, isAuthenticated, isConnected } = useAuthStore();

	const fetchAssetList = useCallback(async (): Promise<void> => {
		if (!isAuthenticated || !isConnected || !connectionSession) {

			return;
		}

		const apiUrl = connectionSession.api;
		const network = connectionSession.network;

		if (!apiUrl || !network) {

			return;
		}

		setLoading(true);
		setError(null);

		try {
			const requestBody: AssetListRequest = {
				webfix: "1.0",
				method: "assetList",
				params: [network], // Use current network (localnet, testnet, mainnet)
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

			if (data.result.success) {
				setAssets(data.result.assets);

			} else {
				throw new Error("Asset list request failed");
			}
		} catch {
			const errorMessage = err instanceof Error
				? err.message
				: "Failed to fetch asset list";

			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [isAuthenticated, isConnected, connectionSession]);

	// Load asset list when authenticated and connected
	useEffect(() => {
		if (isAuthenticated && isConnected && connectionSession) {

			fetchAssetList();
		}
	}, [isAuthenticated, isConnected, connectionSession, fetchAssetList]);

	return {
		assets,
		loading,
		error,
		refetch: fetchAssetList,
	};
}
