import {create} from 'zustand'
import {devtools, persist} from 'zustand/middleware'
import {generateDataHash} from '@/lib/utils'

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
 * Data synchronization state interface
 */
export interface SyncState {
	hasUpdates: boolean
	lastSyncTimestamp: number
	localDataVersion: string
	remoteDataVersion: string
	isSyncing: boolean
	syncError: string | null
}

/**
 * Data synchronization actions interface
 */
export interface SyncActions {
	checkForUpdates: () => Promise<boolean>
	syncData: () => Promise<void>
	markDataAsUpdated: (version: string) => void
	dismissUpdates: () => void
	setSyncError: (error: string | null) => void
}

/**
 * Application state interface extending network status and sync functionality
 */


/**
 * Application state interface extending network status and sync functionality
 */
export interface AppState extends NetworkStatus, SyncState, SyncActions {
	version: string
	upgrade: boolean
	setVersion: (v: string) => void
	setUpgrade: (value: boolean) => void
	
	allowedRoutes: string[]
	currentRoute: string
	setRoute: (route: string) => void
	
	/** Indicates that a route (screen) is being loaded via Suspense/lazy. */
	routeLoading: boolean
	setRouteLoading: (value: boolean) => void
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
				
				// Sync functionality helpers
				const getCurrentDataHash = (): string => {
					try {
						const localData: Record<string, unknown> = {}
						for (let i = 0; i < localStorage.length; i++) {
							const key = localStorage.key(i)
							if (key) {
								const value = localStorage.getItem(key)
								if (value) {
									try {
										localData[key] = JSON.parse(value)
									} catch {
										// Store raw string if not JSON
										localData[key] = value
									}
								}
							}
						}
						return generateDataHash(localData)
					} catch (error) {
						console.error('Failed to generate data hash:', error)
						return Date.now().toString(16)
					}
				}
				
				const allowedRoutes = ['welcome', 'scanner', 'canvas', 'network', 'wallet', 'editor'];
				//const allowedRoutes = ['welcome', 'scanner', 'markets', 'canvas', 'fred', 'wallet', 'network', 'editor'];
				console.log('[Store] Initializing with allowedRoutes:', allowedRoutes);
				
				return {
					version: '1.0.6',
					upgrade: false,
					setVersion: (v: string) => set({version: v}),
					setUpgrade: (value: boolean) => set({upgrade: value}),
					...initialNetwork,
					updateStatus: () => set(getNetworkInfo()),
					
					allowedRoutes,
					currentRoute: 'welcome',
					setRoute: (route: string) => {
						const {allowedRoutes} = get()
						console.log('[Store] setRoute called:', {route, allowedRoutes});
						if (allowedRoutes.includes(route)) {
							console.log('[Store] Setting route to:', route);
							set({currentRoute: route})
						} else {
							console.warn(`[Store] Route "${route}" is not allowed!`)
						}
					},
					
					// Route loading state
					routeLoading: false,
					setRouteLoading: (value: boolean): void => set({routeLoading: value}),
					
					// Sync state
					hasUpdates: false,
					lastSyncTimestamp: Date.now(),
					localDataVersion: getCurrentDataHash(),
					remoteDataVersion: '',
					isSyncing: false,
					syncError: null,
					
					// Sync actions
					checkForUpdates: async (): Promise<boolean> => {
						try {
							const currentHash = getCurrentDataHash()
							const {remoteDataVersion} = get()
							
							// If we have a remote version and it differs from local
							if (remoteDataVersion && remoteDataVersion !== currentHash) {
								set({
									hasUpdates: true,
									localDataVersion: currentHash,
									syncError: null,
								})
								return true
							}
							
							return false
						} catch (error) {
							console.error('Error checking for updates:', error)
							set({
								syncError: error instanceof Error ? error.message : 'Unknown error',
							})
							return false
						}
					},
					
					syncData: async (): Promise<void> => {
						try {
							set({isSyncing: true, syncError: null})
							
							// Simulate sync delay for UX
							await new Promise(resolve => setTimeout(resolve, 1000))
							
							const newDataHash = getCurrentDataHash()
							const {remoteDataVersion} = get()
							
							localStorage.clear()
							
							set({
								localDataVersion: newDataHash,
								remoteDataVersion: remoteDataVersion || newDataHash,
								hasUpdates: false,
								lastSyncTimestamp: Date.now(),
								isSyncing: false,
							})
							
							console.log('Data synchronized successfully')
						} catch (error) {
							console.error('Error syncing data:', error)
							set({
								syncError: error instanceof Error ? error.message : 'Sync failed',
								isSyncing: false,
							})
						}
					},
					
					markDataAsUpdated: (version: string): void => {
						const currentHash = getCurrentDataHash()
						const hasNewUpdates = version !== currentHash
						
						set({
							remoteDataVersion: version,
							hasUpdates: hasNewUpdates,
							localDataVersion: currentHash,
						})
					},
					
					dismissUpdates: (): void => {
						set({
							hasUpdates: false,
							syncError: null,
						})
					},
					
					setSyncError: (error: string | null): void => {
						set({syncError: error})
					},
					
					
				}
			},
			{
				name: 'live_app_genesis_04.8'
			}
		)
	)
)
