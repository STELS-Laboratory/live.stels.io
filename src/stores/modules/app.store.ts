import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Network connection interface extending Navigator
 */
interface NetworkConnection {
	effectiveType?: string;
	downlink?: number;
	rtt?: number;
	saveData?: boolean;
	type?: string;
	addEventListener?: (type: string, listener: () => void) => void;
}

/**
 * Extended Navigator interface with network connection properties
 */
interface ExtendedNavigator extends Navigator {
	connection?: NetworkConnection;
	mozConnection?: NetworkConnection;
	webkitConnection?: NetworkConnection;
}

/**
 * Network status interface with connection information
 */
export interface NetworkStatus {
	online: boolean
	effectiveType: string | null
	downlink: number | null
	rtt: number | null
	saveData: boolean | null
	type: string | null
	updateStatus: () => void
}

/**
 * Application state interface extending network status
 */
export interface AppState extends NetworkStatus {
	version: string
	setVersion: (v: string) => void
	
	allowedRoutes: string[]
	currentRoute: string
	setRoute: (route: string) => void
}

/**
 * Zustand store for application state management
 * Includes network monitoring, routing, and persistence
 */
export const useAppStore = create<AppState>()(
	devtools(
		persist(
			(set, get) => {
				const getNetworkInfo = () => {
					const extendedNavigator = navigator as ExtendedNavigator
					const connection =
						extendedNavigator.connection ||
						extendedNavigator.mozConnection ||
						extendedNavigator.webkitConnection
					
					return {
						online: navigator.onLine,
						effectiveType: connection?.effectiveType || null,
						downlink: connection?.downlink || null,
						rtt: connection?.rtt || null,
						saveData: connection?.saveData || null,
						type: connection?.type || null,
					}
				}
				
				const initialNetwork = getNetworkInfo()
				
				if (typeof window !== 'undefined') {
					window.addEventListener('online', () => set(getNetworkInfo()))
					window.addEventListener('offline', () => set(getNetworkInfo()))
					
					const connection = (navigator as ExtendedNavigator).connection
					if (connection && connection.addEventListener) {
						connection.addEventListener('change', () => set(getNetworkInfo()))
					}
				}
				
				return {
					version: '1.0.1',
					setVersion: (v: string) => set({ version: v }),
					...initialNetwork,
					updateStatus: () => set(getNetworkInfo()),
					
					allowedRoutes: ['welcome', 'scanner', 'markets', 'canvas', 'network', 'wallet'],
					currentRoute: 'welcome',
					setRoute: (route: string) => {
						const { allowedRoutes } = get()
						if (allowedRoutes.includes(route)) {
							set({ currentRoute: route })
						} else {
							console.warn(`Route "${route}" is not allowed!`)
						}
					},
				}
			},
			{
				name: 'app-storage',
			}
		)
	)
)
