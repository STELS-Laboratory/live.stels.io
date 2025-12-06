import { useEffect, useState, useMemo } from "react";
import { useNetworkStore } from "@/stores/modules/network.store";
import type { SonarTransaction } from "@/types/auth/types";

/**
 * Hook to get real-time transactions from sonar data
 * Reads from sessionStorage and updates when new transactions arrive
 */
export function useSonarTransactions(): {
	transactions: SonarTransaction[];
	loading: boolean;
	error: string | null;
} {
	const [transactions, setTransactions] = useState<SonarTransaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { currentNetworkId } = useNetworkStore();

	useEffect(() => {
		const sonarChannel = `${currentNetworkId}.runtime.sonar`;

		const readTransactions = (): void => {
			try {
				const data = sessionStorage.getItem(sonarChannel);
				if (data) {
					const parsed = JSON.parse(data);
					const recentTransactions = parsed?.raw?.recentTransactions || [];
					
					// Sort by received_at (newest first)
					const sorted = [...recentTransactions].sort(
						(a: SonarTransaction, b: SonarTransaction) => 
							b.received_at - a.received_at
					);
					
					setTransactions(sorted);
					setError(null);
				} else {
					setTransactions([]);
				}
				setLoading(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to read transactions");
				setLoading(false);
			}
		};

		// Initial load
		readTransactions();

		// Poll for updates every second
		const interval = setInterval(() => {
			readTransactions();
		}, 1000);

		// Listen to storage events (cross-tab updates)
		const handleStorageChange = (e: StorageEvent): void => {
			if (e.key === sonarChannel) {
				readTransactions();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [currentNetworkId]);

	return { transactions, loading, error };
}
