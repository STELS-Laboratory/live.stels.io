/**
 * Trading API Hook
 * Provides trading API service with session management
 */

import { useEffect, useMemo, useRef } from "react";
import { useAuthStore } from "@/stores";
import { TradingApiService } from "../lib/trading-api";

let apiServiceInstance: TradingApiService | null = null;
let lastApiUrl: string | null = null;

/**
 * Get or create TradingApiService instance
 */
function getApiService(apiUrl?: string): TradingApiService {
	// Get API URL from connectionSession or environment or use default
	const authState = useAuthStore.getState();
	const sessionApiUrl = authState.connectionSession?.api;
	const envApiUrl = import.meta.env.VITE_TRADING_API_URL;
	const finalApiUrl = apiUrl || sessionApiUrl || envApiUrl || "http://localhost:8000";

	// Create new instance if URL changed
	if (!apiServiceInstance || lastApiUrl !== finalApiUrl) {
		lastApiUrl = finalApiUrl;
		apiServiceInstance = new TradingApiService(finalApiUrl);

		// Set session immediately if available
		const session = authState.connectionSession?.session || null;
		if (session) {
			apiServiceInstance.setSession(session);

		}
	}

	return apiServiceInstance;
}

/**
 * Hook to use Trading API service
 */
export function useTradingApi(): TradingApiService {
	const { connectionSession } = useAuthStore();
	const sessionRef = useRef<string | null>(null);

	// Get API service instance (without session update to avoid unnecessary re-renders)
	const apiService = useMemo(() => {
		const apiUrl = connectionSession?.api;
		return getApiService(apiUrl);
	}, [connectionSession?.api]);

	// Update session when connectionSession changes (separate effect to avoid re-renders)
	useEffect(() => {
		const session = connectionSession?.session || null;
		
		// Only update if session actually changed
		if (session !== sessionRef.current && apiServiceInstance) {
			sessionRef.current = session;
			apiServiceInstance.setSession(session);
			if (session) {
				// Session set
			} else {
				// Session cleared
			}
		}
	}, [connectionSession?.session]);

	return apiService;
}
