/**
 * Network Store
 * Centralized network configuration and management
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { NetworkConfig } from "@/types/auth/types";

/**
 * Available network configurations
 */
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
	testnet: {
		id: "testnet",
		name: "Testnet",
		api: "https://beta.stels.dev",
		socket: "wss://beta.stels.dev",
		developer: false,
		description: "Testnet network for testing and development",
	},
	mainnet: {
		id: "mainnet",
		name: "Mainnet",
		api: "http://10.0.0.238:8088",
		socket: "ws://10.0.0.238:8088",
		developer: false,
		description: "Mainnet Beta Network",
	},
	localnet: {
		id: "localnet",
		name: "Localnet",
		api: "http://10.0.0.238:8088",
		socket: "ws://10.0.0.238:8088",
		developer: true,
		description: "Local development network",
	},
};

/**
 * Get default network from URL parameter or localStorage
 */
function getDefaultNetwork(): string {
	// Check URL parameter first
	if (typeof window !== "undefined") {
		const urlParams = new URLSearchParams(window.location.search);
		const networkParam = urlParams.get("network");
		if (networkParam && NETWORK_CONFIGS[networkParam]) {
			return networkParam;
		}

		// Check localStorage
		const storedNetwork = localStorage.getItem("selected-network");
		if (storedNetwork && NETWORK_CONFIGS[storedNetwork]) {
			return storedNetwork;
		}
	}

	// Default to mainnet
	return "mainnet";
}

/**
 * Network store state
 */
interface NetworkState {
	/**
	 * Current network ID
	 */
	currentNetworkId: string;

	/**
	 * Current network configuration
	 */
	currentNetwork: NetworkConfig;

	/**
	 * Available networks
	 */
	availableNetworks: NetworkConfig[];
}

/**
 * Network store actions
 */
interface NetworkActions {
	/**
	 * Set current network by ID
	 */
	setNetwork: (networkId: string) => void;

	/**
	 * Get network configuration by ID
	 */
	getNetwork: (networkId: string) => NetworkConfig | undefined;

	/**
	 * Check if network is mainnet
	 */
	isMainnet: () => boolean;

	/**
	 * Check if network is testnet
	 */
	isTestnet: () => boolean;

	/**
	 * Check if network is localnet
	 */
	isLocalnet: () => boolean;
}

/**
 * Network store type
 */
export type NetworkStore = NetworkState & NetworkActions;

/**
 * Network store
 */
export const useNetworkStore = create<NetworkStore>()(
	devtools(
		persist(
			(set, get) => {
				const defaultNetworkId = getDefaultNetwork();
				const defaultNetwork = NETWORK_CONFIGS[defaultNetworkId] || NETWORK_CONFIGS.mainnet;

				return {
					// Initial state
					currentNetworkId: defaultNetworkId,
					currentNetwork: defaultNetwork,
					availableNetworks: Object.values(NETWORK_CONFIGS),

					// Actions
					setNetwork: (networkId: string): void => {
						const network = NETWORK_CONFIGS[networkId];
						if (!network) {
							console.warn(`[NetworkStore] Network ${networkId} not found`);
							return;
						}

						set({
							currentNetworkId: networkId,
							currentNetwork: network,
						});

						// Update localStorage
						if (typeof window !== "undefined") {
							localStorage.setItem("selected-network", networkId);
							document.body.setAttribute("network", networkId);
						}
					},

					getNetwork: (networkId: string): NetworkConfig | undefined => {
						return NETWORK_CONFIGS[networkId];
					},

					isMainnet: (): boolean => {
						return get().currentNetworkId === "mainnet";
					},

					isTestnet: (): boolean => {
						return get().currentNetworkId === "testnet";
					},

					isLocalnet: (): boolean => {
						return get().currentNetworkId === "localnet";
					},
				};
			},
			{
				name: "network-store",
				partialize: (state) => ({
					currentNetworkId: state.currentNetworkId,
				}),
			},
		),
		{
			name: "NetworkStore",
		},
	),
);

/**
 * Initialize network on app startup
 */
export function initializeNetwork(): void {
	if (typeof window === "undefined") {
		return;
	}

	const store = useNetworkStore.getState();
	const defaultNetworkId = getDefaultNetwork();

	// Set network if different from stored
	if (store.currentNetworkId !== defaultNetworkId) {
		store.setNetwork(defaultNetworkId);
	} else {
		// Update body attribute
		document.body.setAttribute("network", store.currentNetworkId);
	}
}

