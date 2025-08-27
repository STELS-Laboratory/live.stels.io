import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { generateDataHash } from '@/lib/utils'

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
 * Worker interface for the distributed execution platform
 */
export interface Worker {
	key: string[];
	value: {
		raw: {
			sid: string;
			nid: string;
			active: boolean;
			note: string;
			script: string;
			dependencies: string[];
			version: string;
			timestamp: number;
		};
		channel: string;
	};
}

/**
 * Worker management state interface
 */
export interface WorkerState {
	workers: Worker[];
	workersLoading: boolean;
	workersError: string | null;
	worker: {
		isLoading: boolean;
		isEditor: boolean;
	};
}

/**
 * Worker management actions interface
 */
export interface WorkerActions {
	listWorkers: () => Promise<void>;
	setWorker: () => Promise<Worker | null>;
	updateWorker: (workerData: Worker) => Promise<Worker | null>;
	setLocked: (locked: boolean) => void;
	token: string | null;
}

/**
 * Application state interface extending network status, sync functionality, and worker management
 */
export interface AppState extends NetworkStatus, SyncState, SyncActions, WorkerState, WorkerActions {
	version: string
	setVersion: (v: string) => void
	
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
				
				const allowedRoutes = ['welcome', 'scanner', 'markets', 'canvas', 'fred', 'wallet', 'network', 'editor'];
				console.log('[Store] Initializing with allowedRoutes:', allowedRoutes);
				
				return {
					version: '1.0.4',
					setVersion: (v: string) => set({ version: v }),
					...initialNetwork,
					updateStatus: () => set(getNetworkInfo()),
					
					allowedRoutes,
					currentRoute: 'welcome',
					setRoute: (route: string) => {
						const { allowedRoutes } = get()
						console.log('[Store] setRoute called:', { route, allowedRoutes });
						if (allowedRoutes.includes(route)) {
							console.log('[Store] Setting route to:', route);
							set({ currentRoute: route })
						} else {
							console.warn(`[Store] Route "${route}" is not allowed!`)
						}
					},
                  
                  // Route loading state
                  routeLoading: false,
                  setRouteLoading: (value: boolean): void => set({ routeLoading: value }),
					
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
							const { remoteDataVersion } = get()
							
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
							set({ isSyncing: true, syncError: null })
							
							// Simulate sync delay for UX
							await new Promise(resolve => setTimeout(resolve, 1000))
							
							const newDataHash = getCurrentDataHash()
							const { remoteDataVersion } = get()
							
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
						set({ syncError: error })
					},

					// Worker management state
					workers: [],
					workersLoading: false,
					workersError: null,
					worker: {
						isLoading: false,
						isEditor: false,
					},
					token: null,

					// Worker management actions
					setWorker: async (): Promise<Worker | null> => {
						set({ worker: { isLoading: true, isEditor: get().worker.isEditor } });
						try {
							const storage = localStorage.getItem("private");
							if (!storage) throw new Error("Not authenticated");
							const storageJSON = JSON.parse(storage);

							const response = await fetch(storageJSON.raw.info.api, {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									"Stels-Session": get().token as string,
								},
								body: JSON.stringify({
									webfix: "1.0",
									method: "setWorker",
									params: [],
								}),
							});

							if (!response.ok) throw new Error("Network response was not ok");
							const result = await response.json();

							if (result && result.key && result.value && result.value.raw && result.value.raw.sid) {
								set((state) => ({
									workers: [...state.workers, result],
								}));
							}

							set({ worker: { isLoading: false, isEditor: get().worker.isEditor } });
							return result;
						} catch (error) {
							console.error("Error creating worker:", error);
							set({
								worker: { isLoading: false, isEditor: get().worker.isEditor },
							});
							return null;
						}
					},

					updateWorker: async (workerData: Worker): Promise<Worker | null> => {
						set({ worker: { isLoading: true, isEditor: get().worker.isEditor } });
						try {
							const storage = localStorage.getItem("private");
							if (!storage) throw new Error("Not authenticated");
							const storageJSON = JSON.parse(storage);

							const response = await fetch(storageJSON.raw.info.api, {
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									"Stels-Session": get().token as string,
								},
								body: JSON.stringify({
									webfix: "1.0",
									method: "updateWorker",
									params: [],
									body: workerData,
								}),
							});

							if (!response.ok) throw new Error("Network response was not ok");
							const result = await response.json();

							// Update worker in state if server returns updated data
							if (result && result.value && result.value.raw && result.value.raw.sid) {
								const sid = result.value.raw.sid;
								set((state) => ({
									workers: state.workers.map((w) =>
										w.value.raw.sid === sid ? result : w
									),
								}));
							}
							set({ worker: { isLoading: false, isEditor: get().worker.isEditor } });
							return result;
						} catch (error) {
							console.error("Error updating worker:", error);
							set({
								worker: { isLoading: false, isEditor: get().worker.isEditor },
							});
							return null;
						}
					},

					listWorkers: async (): Promise<void> => {
						set({ workersLoading: true, workersError: null });
						try {
							const storage = localStorage.getItem("private");
							if (!storage) {
								throw new Error("Not authenticated");
							}
							const storageJSON = JSON.parse(storage);

							const response = await fetch(storageJSON.raw.info.api, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Stels-Session': get().token as string,
								},
								body: JSON.stringify({
									webfix: "1.0",
									method: "listWorkers",
									params: []
								}),
							});

							if (!response.ok) {
								throw new Error('Network response was not ok');
							}
							const data = await response.json();

							set({
								workers: data,
								workersLoading: false,
								workersError: null
							});
						} catch (error) {
							set({
								workers: [],
								workersLoading: false,
								workersError: error instanceof Error ? error.message : 'Unknown error'
							});
						}
					},

					setLocked: (locked: boolean): void => {
						set({ token: locked ? null : get().token });
					},
				}
			},
			{
				name: 'live_app_genesis_01'
			}
		)
	)
)
