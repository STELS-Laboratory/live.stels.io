/**
 * Hook for fetching wallet balance via transactions API
 */

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/stores";

interface TransactionsRequest {
	webfix: string;
	method: string;
	params: string[];
}

interface Transaction {
	hash: string;
	from: {
		address: string;
		publicKey: string;
		number: string;
	};
	to: string;
	amount: number;
	fee: number;
	timestamp: number;
	status?: "pending" | "confirmed" | "failed";
}

interface TransactionsResponse {
	webfix: string;
	result: {
		success: boolean;
		transactions?: Transaction[];
		balance?: number;
		totalReceived?: number;
		totalSent?: number;
		[key: string]: unknown;
	};
}

interface BalanceData {
	total: number;
	available: number;
	received: number;
	sent: number;
}

export function useWalletBalance(): {
	balance: BalanceData | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
} {
	const [balance, setBalance] = useState<BalanceData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { wallet, connectionSession, isAuthenticated, isConnected } =
		useAuthStore();

	const fetchBalance = useCallback(async (): Promise<void> => {
		if (!isAuthenticated || !isConnected || !connectionSession || !wallet) {

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
			const requestBody: TransactionsRequest = {
				webfix: "1.0",
				method: "transactions",
				params: [network, wallet.address],
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

			const data: TransactionsResponse = await response.json();

			if (data.result.success) {
				// Calculate balance from transactions
				let totalReceived = 0;
				let totalSent = 0;

				if (data.result.transactions) {
					for (const tx of data.result.transactions) {
						if (tx.to === wallet.address && tx.status === "confirmed") {
							totalReceived += tx.amount;
						}
						if (
							tx.from.address === wallet.address &&
							tx.status === "confirmed"
						) {
							totalSent += tx.amount + tx.fee;
						}
					}
				}

				// Use balance from response if available, otherwise calculate
				const totalBalance =
					data.result.balance !== undefined
						? data.result.balance
						: totalReceived - totalSent;

				const balanceData: BalanceData = {
					total: Math.max(0, totalBalance),
					available: Math.max(0, totalBalance),
					received: totalReceived,
					sent: totalSent,
				};

				setBalance(balanceData);

			} else {
				throw new Error("Balance request failed");
			}
		} catch {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to fetch wallet balance";

			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [isAuthenticated, isConnected, connectionSession, wallet]);

	// Load balance when authenticated and connected
	useEffect(() => {
		if (isAuthenticated && isConnected && connectionSession && wallet) {

			fetchBalance();
		}
	}, [isAuthenticated, isConnected, connectionSession, fetchBalance, wallet]);

	return {
		balance,
		loading,
		error,
		refetch: fetchBalance,
	};
}
