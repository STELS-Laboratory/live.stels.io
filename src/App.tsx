import React, {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useAppStore, useAuthStore } from "@/stores";
import { ReactFlowProvider } from "reactflow";
import SessionProvider from "@/components/main/provider";
import { useUrlRouter } from "@/hooks/use_url_router";
import { RouteLoader } from "@/components/main/route_loader";
import { useAuthRestore } from "@/hooks/use_auth_restore";
import { useAssetList } from "@/hooks/use_asset_list";
import { useHydration } from "@/hooks/use_hydration";
import { useTheme } from "@/hooks/use_theme";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "./components/main/splash_screen";
import UpgradeScreen from "./components/main/upgrade_screen";
import { WelcomeAuthPage } from "@/components/auth/welcome_auth_page";
import { SecurityWarningDialog } from "@/components/auth/security_warning_dialog";
import { SecurityWarningExtensions } from "@/components/auth/security_warning_extensions";
import { SessionExpiredModal } from "@/components/auth/session_expired_modal";
import UpdatePrompt from "@/components/main/update_prompt";
import VersionCheckPrompt from "@/components/main/version_check_prompt";
import ToastProvider from "@/components/main/toast_provider";

// Lazy-loaded app modules
const Trading = lazy(() => import("@/apps/trading"));
const Welcome = lazy(() => import("@/apps/welcome"));
const Flow = lazy(() => import("@/apps/canvas/flow"));
const Schemas = lazy(() => import("@/apps/schemas"));
const Docs = lazy(() =>
	import("@/apps/docs").then((m) => ({ default: m.Docs }))
);
const TokenBuilder = lazy(() => import("@/apps/token-builder"));
const WalletApp = lazy(() => import("@/apps/wallet"));
const Explorer = lazy(() => import("@/apps/explorer"));
const StelsChat = lazy(() => import("@/apps/stels-chat"));
const Indexes = lazy(() => import("@/apps/indexes"));
import { TooltipProvider } from "@/components/ui/tooltip";
const Layout = lazy(() => import("@/apps/layout"));
const AMIEditor = lazy(() =>
	import("@/apps/editor/ami_editor").then((m) => ({ default: m.AMIEditor }))
);

import type { AppState, UIState } from "@/types/app/types";

/**
 * Animation variants for route transitions
 * Extracted outside component to prevent recreation
 */
const pageVariants = {
	initial: {
		opacity: 0,
		scale: 0.98,
		y: 10,
	},
	animate: {
		opacity: 1,
		scale: 1,
		y: 0,
	},
	exit: {
		opacity: 0,
		scale: 0.98,
		y: -10,
	},
};

/**
 * State messages map - extracted to prevent recreation
 */
const STATE_MESSAGES: Record<AppState, string> = {
	initializing: "Starting up...",
	scanning_storage: "Checking storage...",
	hydrating: "Loading your data...",
	checking_session: "Checking authentication...",
	authenticating: "Authenticating...",
	connecting: "Establishing connection...",
	loading_app: "Preparing interface...",
	ready: "Ready!",
	upgrading: "System upgrade in progress...",
};

/**
 * Transition delays map - extracted to prevent recreation
 */
const TRANSITION_DELAYS: Record<string, number> = {
	"initializing->scanning_storage": 200,
	"scanning_storage->hydrating": 200,
	"initializing->hydrating": 200,
	"hydrating->checking_session": 300,
	"checking_session->authenticating": 150,
	"checking_session->loading_app": 250,
	"authenticating->connecting": 200,
	"connecting->loading_app": 400,
	"loading_app->ready": 300,
	"ready->upgrading": 150,
	"upgrading->ready": 200,
};

/**
 * Initialize global styles once
 */
if (
	typeof document !== "undefined" &&
	!document.head.querySelector("style[data-app-animations]")
) {
	const style = document.createElement("style");
	style.setAttribute("data-app-animations", "true");
	style.textContent = `
		.animation-delay-150 {
			animation-delay: 150ms;
		}
		
		@keyframes fadeInUp {
			from {
				opacity: 0;
				transform: translateY(15px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		.animate-fade-in-up {
			animation: fadeInUp 0.3s ease-out forwards;
		}
	`;
	document.head.appendChild(style);
}

/**
 * Professional Dashboard component with enhanced state management and artificial delays
 */
export default function Dashboard(): React.ReactElement {
	const { currentRoute, setRouteLoading, upgrade, setUpgrade } = useAppStore();
	const { isAuthenticated, isConnected, _hasHydrated } = useAuthStore();
	const { resolvedTheme } = useTheme();
	const hasHydrated = useHydration();

	// Apply resolved theme to document (will update automatically when system theme changes)
	useEffect(() => {
		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
		root.setAttribute("data-theme", resolvedTheme);
	}, [resolvedTheme]);

	// Prevent zoom and touch behaviors
	// Optimized to avoid blocking main thread - use CSS touch-action for most cases
	useEffect(() => {
		const preventZoom = (e: TouchEvent): void => {
			if (e.touches.length > 1) {
				e.preventDefault();
			}
		};

		const preventGestures = (e: Event): void => {
			e.preventDefault();
			e.stopPropagation();
		};

		const preventWheel = (e: WheelEvent): void => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		document.addEventListener("touchstart", preventZoom, { passive: false });
		document.addEventListener("touchmove", preventZoom, { passive: false });
		document.addEventListener("gesturestart", preventGestures, {
			passive: false,
		});
		document.addEventListener("gesturechange", preventGestures, {
			passive: false,
		});
		document.addEventListener("gestureend", preventGestures, {
			passive: false,
		});
		document.addEventListener("wheel", preventWheel, { passive: false });

		document.documentElement.style.touchAction = "manipulation";
		document.body.style.touchAction = "manipulation";

		return () => {
			document.removeEventListener("touchstart", preventZoom);
			document.removeEventListener("touchmove", preventZoom);
			document.removeEventListener("gesturestart", preventGestures);
			document.removeEventListener("gesturechange", preventGestures);
			document.removeEventListener("gestureend", preventGestures);
			document.removeEventListener("wheel", preventWheel);
		};
	}, []);

	// Combined UI state - reduces number of state updates
	const [uiState, setUIState] = useState<UIState>({
		showSplash: true,
		forceRender: false,
		transitionProgress: 0,
		storageScanComplete: false,
	});

	// App state management
	const [appState, setAppState] = useState<AppState>("initializing");

	// Refs for cleanup and stable references
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const forceRenderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const sessionCheckRef = useRef<
		{
			authStoreData: string | null;
			privateStoreData: string | null;
			hasValidSession: boolean;
		} | null
	>(null);

	// Set upgrade end date - memoized
	const upgradeEndDate = useMemo(() => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const year = tomorrow.getFullYear();
		const month = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
		const day = tomorrow.getDate().toString().padStart(2, "0");
		const nyDateTime = `${year}-${month}-${day}T21:00:00-04:00`;
		return new Date(nyDateTime);
	}, []);

	/**
	 * Get delay duration based on state transition
	 * Memoized callback
	 */
	const getTransitionDelay = useCallback(
		(fromState: AppState, toState: AppState): number => {
			const key = `${fromState}->${toState}`;
			return TRANSITION_DELAYS[key] || 250;
		},
		[],
	);

	/**
	 * Smooth state transition with artificial delay and progress animation
	 * Optimized with proper cleanup
	 */
	const transitionToState = useCallback(async (
		newState: AppState,
		delay: number = 800,
		showProgress: boolean = true,
	): Promise<void> => {
		// Clear any existing intervals/timeouts
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
			progressIntervalRef.current = null;
		}
		if (transitionTimeoutRef.current) {
			clearTimeout(transitionTimeoutRef.current);
			transitionTimeoutRef.current = null;
		}

		if (showProgress) {
			setUIState((prev) => ({ ...prev, transitionProgress: 0 }));

			// Animate progress bar
			progressIntervalRef.current = setInterval(() => {
				setUIState((prev) => {
					const newProgress = prev.transitionProgress + (100 / (delay / 50));
					return {
						...prev,
						transitionProgress: newProgress >= 100 ? 100 : newProgress,
					};
				});
			}, 50);

			// Wait for the delay
			await new Promise((resolve) => {
				transitionTimeoutRef.current = setTimeout(resolve, delay);
			});

			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
				progressIntervalRef.current = null;
			}

			setUIState((prev) => ({ ...prev, transitionProgress: 100 }));

			// Small additional delay to show completed progress
			await new Promise((resolve) => {
				transitionTimeoutRef.current = setTimeout(resolve, 50);
			});

			setUIState((prev) => ({ ...prev, transitionProgress: 0 }));
		} else {
			await new Promise((resolve) => {
				transitionTimeoutRef.current = setTimeout(resolve, delay);
			});
		}

		setAppState(newState);
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}
			if (forceRenderTimeoutRef.current) {
				clearTimeout(forceRenderTimeoutRef.current);
			}
		};
	}, []);

	// Initialize URL-based routing
	useUrlRouter();

	// Initialize automatic authentication restoration
	useAuthRestore();

	// Load asset list after authentication
	useAssetList();

	// Memoize session check to avoid repeated localStorage reads
	// Update when authentication state changes to reflect logout
	const sessionCheck = useMemo(() => {
		if (typeof window === "undefined") {
			return {
				authStoreData: null,
				privateStoreData: null,
				hasValidSession: false,
			};
		}

		const authStoreData = localStorage.getItem("auth-store");
		const privateStoreData = localStorage.getItem("private-store");
		const hasValidSession = privateStoreData &&
				JSON.parse(privateStoreData)?.raw?.session || false;

		return { authStoreData, privateStoreData, hasValidSession };
	}, []);

	// Update ref when session check changes
	// This ensures we always have the latest session data
	useEffect(() => {
		sessionCheckRef.current = sessionCheck;
	}, [sessionCheck, isAuthenticated, isConnected]);

	// Authentication state monitoring effect
	// Only transition if we're not already in a transition state
	useEffect(() => {
		if (
			appState === "ready" &&
			(!isAuthenticated || !isConnected) &&
			currentRoute !== "explorer"
		) {
			// Prevent rapid state changes - use a small delay
			const timeoutId = setTimeout(() => {
				setAppState("checking_session");
			}, 100);
			return () => clearTimeout(timeoutId);
		}
	}, [isAuthenticated, isConnected, appState, currentRoute]);

	// Main state management effect - optimized with refs
	useEffect(() => {
		let isMounted = true;

		const manageAppState = async (): Promise<void> => {
			if (!isMounted) return;

			switch (appState) {
				case "initializing": {
					if (typeof window !== "undefined" && "serviceWorker" in navigator) {
						navigator.serviceWorker.getRegistrations().then((registrations) => {
							registrations.forEach((registration) => {
								registration.update();
							});
						});
					}
					// Skip storage scanning - go directly to hydrating
					const delay = getTransitionDelay("initializing", "hydrating");
					await transitionToState("hydrating", delay);
					break;
				}

				case "scanning_storage": {
					// Skip storage scanning - go directly to hydrating
					const delay = getTransitionDelay("scanning_storage", "hydrating");
					await transitionToState("hydrating", delay);
					break;
				}

				case "hydrating": {
					if (_hasHydrated || uiState.forceRender) {
						const delay = getTransitionDelay("hydrating", "checking_session");
						await transitionToState("checking_session", delay);
					} else {
						if (forceRenderTimeoutRef.current) {
							clearTimeout(forceRenderTimeoutRef.current);
						}
						forceRenderTimeoutRef.current = setTimeout(() => {
							if (isMounted) {
								setUIState((prev) => ({ ...prev, forceRender: true }));
							}
						}, 800);
					}
					break;
				}

				case "checking_session": {
					// Always use fresh session check data
					const check = sessionCheck;

					if (currentRoute === "explorer") {
						const delay = getTransitionDelay("checking_session", "loading_app");
						await transitionToState("loading_app", delay);
					} else if (upgrade) {
						const delay = getTransitionDelay("checking_session", "upgrading");
						await transitionToState("upgrading", delay, false);
					} else if (isAuthenticated && isConnected && check.hasValidSession) {
						const delay = getTransitionDelay("checking_session", "loading_app");
						await transitionToState("loading_app", delay);
					} else if (
						check.authStoreData && check.hasValidSession && !isAuthenticated
					) {
						const delay = getTransitionDelay("checking_session", "loading_app");
						await transitionToState("loading_app", delay);
					} else if (!isAuthenticated || !isConnected) {
						// User is logged out - go to authenticating state
						const delay = getTransitionDelay(
							"checking_session",
							"authenticating",
						);
						await transitionToState("authenticating", delay);
					} else if (check.authStoreData && !check.hasValidSession) {
						const delay = getTransitionDelay(
							"checking_session",
							"authenticating",
						);
						await transitionToState("authenticating", delay);
					} else {
						const delay = getTransitionDelay(
							"checking_session",
							"authenticating",
						);
						await transitionToState("authenticating", delay);
					}
					break;
				}

				case "authenticating": {
					if (currentRoute === "explorer") {
						const delay = getTransitionDelay("authenticating", "loading_app");
						await transitionToState("loading_app", delay);
					} else if (isAuthenticated && isConnected) {
						const delay = getTransitionDelay("authenticating", "connecting");
						await transitionToState("connecting", delay);
					}
					break;
				}

				case "connecting": {
					if (isAuthenticated && isConnected) {
						const delay = getTransitionDelay("connecting", "loading_app");
						await transitionToState("loading_app", delay);
					}
					break;
				}

				case "loading_app": {
					const delay = getTransitionDelay("loading_app", "ready");
					await transitionToState("ready", delay);
					break;
				}

				case "upgrading": {
					if (!upgrade) {
						const delay = getTransitionDelay("upgrading", "ready");
						await transitionToState("ready", delay);
					}
					break;
				}

				case "ready": {
					if (upgrade) {
						const delay = getTransitionDelay("ready", "upgrading");
						await transitionToState("upgrading", delay, false);
					}
					if (uiState.showSplash) {
						setTimeout(() => {
							if (isMounted) {
								setUIState((prev) => ({ ...prev, showSplash: false }));
							}
						}, 300);
					}
					break;
				}
			}
		};

		manageAppState();

		return () => {
			isMounted = false;
		};
	}, [
		appState,
		hasHydrated,
		_hasHydrated,
		uiState.forceRender,
		uiState.storageScanComplete,
		uiState.showSplash,
		isAuthenticated,
		isConnected,
		upgrade,
		currentRoute,
		transitionToState,
		getTransitionDelay,
		sessionCheck,
	]);

	// Mark heavy routes as loading during mount and when route changes
	const isHeavyRoute = useMemo(() => currentRoute === "canvas", [currentRoute]);

	useEffect(() => {
		if (isHeavyRoute && appState === "ready") {
			setRouteLoading(true);
			const timeout = setTimeout(() => setRouteLoading(false), 500);
			return () => clearTimeout(timeout);
		} else {
			setRouteLoading(false);
		}
	}, [isHeavyRoute, setRouteLoading, appState]);

	const handleSplashComplete = useCallback((): void => {
		setUIState((prev) => ({ ...prev, showSplash: false }));
	}, []);

	const handleUpgradeComplete = useCallback((): void => {
		setUpgrade(false);
	}, [setUpgrade]);

	/**
	 * Get loading message based on current state
	 * Memoized
	 */
	const getStateMessage = useCallback((state: AppState): string => {
		return STATE_MESSAGES[state] || "Loading...";
	}, []);

	/**
	 * Loading screen component - memoized
	 */
	const renderLoadingScreen = useCallback(
		(message: string): React.ReactElement => {
			return (
				<motion.div
					className="absolute max-w-[500px] mx-auto w-full h-full overflow-hidden left-0 right-0 top-0 bottom-0 bg-background flex items-center justify-center p-32"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
				>
					<motion.div
						className="w-full max-w-md space-y-6 text-center"
						initial={{ scale: 0.92, y: 30 }}
						animate={{ scale: 1, y: 0 }}
						transition={{
							duration: 0.8,
							delay: 0.2,
							ease: [0.16, 1, 0.3, 1],
						}}
					>
						{/* Loading Animation */}
						<motion.div
							className="relative mx-auto w-20 h-20"
							initial={{ scale: 0, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{
								duration: 1,
								delay: 0.3,
								ease: [0.34, 1.56, 0.64, 1],
							}}
						>
							<motion.div
								className="absolute inset-0 border-4 border-amber-500/20 rounded-full"
								animate={{
									scale: [1, 1.05, 1],
									opacity: [0.2, 0.3, 0.2],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							/>
							<motion.div
								className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full"
								animate={{ rotate: 360 }}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: "linear",
								}}
							/>
							<motion.div
								className="absolute inset-2 border-2 border-transparent border-t-blue-400 rounded-full"
								animate={{ rotate: 360 }}
								transition={{
									duration: 1.4,
									repeat: Infinity,
									ease: "linear",
								}}
							/>
						</motion.div>

						{/* State Message */}
						<motion.div
							initial={{ opacity: 0, y: 15 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.6,
								delay: 0.5,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							<motion.h2
								className="text-2xl font-bold text-foreground mb-2"
								animate={{
									opacity: [1, 0.95, 1],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							>
								STELS
							</motion.h2>
							<motion.p
								className="text-muted-foreground text-lg"
								key={message}
								initial={{ opacity: 0, y: 5 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
							>
								{message}
							</motion.p>
						</motion.div>

						{/* Progress Bar */}
						<motion.div
							className="space-y-2"
							initial={{ opacity: 0, scale: 0.93 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								duration: 0.7,
								delay: 0.6,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							<div className="w-full bg-muted rounded-full h-2 overflow-hidden">
								<motion.div
									className="bg-primary h-2 rounded-full"
									initial={{ width: "0%" }}
									animate={{ width: `${uiState.transitionProgress}%` }}
									transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
								/>
							</div>
							<motion.p
								className="text-xs text-muted-foreground"
								key={Math.round(uiState.transitionProgress)}
								initial={{ scale: 1.15, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
							>
								{Math.round(uiState.transitionProgress)}% complete
							</motion.p>
						</motion.div>

						{/* State Indicator */}
						<motion.div
							className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{
								duration: 0.6,
								delay: 0.8,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							<motion.div
								className="w-2 h-2 bg-amber-400 rounded-full"
								animate={{
									scale: [1, 1.4, 1],
									opacity: [1, 0.4, 1],
								}}
								transition={{
									duration: 2.5,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							/>
							<motion.span
								key={appState}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
							>
								State: {appState.replace("_", " ")}
							</motion.span>
						</motion.div>
					</motion.div>
				</motion.div>
			);
		},
		[uiState.transitionProgress, appState],
	);

	/**
	 * Route component mapping - memoized
	 */
	const routeComponents = useMemo(() => {
		const components: Record<string, React.ReactElement> = {
			trading: (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">
							Loading trading terminal...
						</div>
					}
				>
					<Trading />
				</Suspense>
			),
			welcome: (
				<Suspense
					fallback={<div className="p-4 text-muted-foreground">Loading...</div>}
				>
					<Welcome />
				</Suspense>
			),
			editor: (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">Loading editor...</div>
					}
				>
					<AMIEditor />
				</Suspense>
			),
			canvas: (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">Loading canvas...</div>
					}
				>
					<ReactFlowProvider>
						<Flow />
					</ReactFlowProvider>
				</Suspense>
			),
			schemas: (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">
							Loading schemas...
						</div>
					}
				>
					<Schemas />
				</Suspense>
			),
			docs: (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">
							Loading documentation...
						</div>
					}
				>
					<Docs />
				</Suspense>
			),
			"token-builder": (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">
							Loading token builder...
						</div>
					}
				>
					<TokenBuilder />
				</Suspense>
			),
			wallet: (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">
							Loading wallet...
						</div>
					}
				>
					<WalletApp />
				</Suspense>
			),
			explorer: (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">
							Loading explorer...
						</div>
					}
				>
					<Explorer />
				</Suspense>
			),
			"stels-chat": (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">
							Loading Stels Chat...
						</div>
					}
				>
					<StelsChat />
				</Suspense>
			),
			indexes: (
				<Suspense
					fallback={
						<div className="p-4 text-muted-foreground">
							Loading indexes...
						</div>
					}
				>
					<Indexes />
				</Suspense>
			),
		};

		return components;
	}, []);

	/**
	 * Render main content - memoized
	 */
	const renderMainContent = useCallback((): React.ReactElement => {
		return routeComponents[currentRoute] || routeComponents.trading;
	}, [currentRoute, routeComponents]);

	// Memoize common layout structure
	const commonLayout = useMemo(() => (
		<Layout>
			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={currentRoute}
					variants={pageVariants}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={{
						duration: 0.2,
						ease: [0.22, 1, 0.36, 1],
					}}
					className="h-full w-full"
				>
					{renderMainContent()}
				</motion.div>
			</AnimatePresence>
		</Layout>
	), [currentRoute, renderMainContent]);

	// Render based on app state
	switch (appState) {
		case "initializing":
			return renderLoadingScreen(getStateMessage(appState));

		case "scanning_storage":
			// Skip storage scan dialog - show loading screen instead
			return renderLoadingScreen(getStateMessage("hydrating"));

		case "hydrating":
		case "checking_session":
			return renderLoadingScreen(getStateMessage(appState));

		case "authenticating":
			if (currentRoute === "explorer") {
				return (
					<SessionProvider>
						<TooltipProvider>
							<div className="absolute w-full h-full top-0 bottom-0 overflow-hidden">
								<RouteLoader>
									<Suspense
										fallback={
											<div className="p-4 text-muted-foreground">
												Loading explorer...
											</div>
										}
									>
										{commonLayout}
									</Suspense>
								</RouteLoader>
							</div>
							<ToastProvider />
						</TooltipProvider>
					</SessionProvider>
				);
			}
			return (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					className="w-full h-full"
				>
					<WelcomeAuthPage />
				</motion.div>
			);

		case "connecting":
			return renderLoadingScreen(getStateMessage(appState));

		case "loading_app":
			return renderLoadingScreen(getStateMessage(appState));

		case "upgrading":
			return (
				<SessionProvider>
					<UpgradeScreen
						onComplete={handleUpgradeComplete}
						endDate={upgradeEndDate}
					/>
				</SessionProvider>
			);

		case "ready":
			return (
				<SessionProvider>
					<TooltipProvider>
						{uiState.showSplash
							? (
								<SplashScreen
									onComplete={handleSplashComplete}
									duration={1200}
								/>
							)
							: (
								<div className="absolute w-full h-full top-0 bottom-0 overflow-hidden">
									<RouteLoader>
										<Suspense
											fallback={
												<div className="p-4 text-muted-foreground">
													Loading layout...
												</div>
											}
										>
											{commonLayout}
										</Suspense>
									</RouteLoader>
								</div>
							)}
						<SecurityWarningDialog />
						<SecurityWarningExtensions />
						<SessionExpiredModal />
						<UpdatePrompt />
						<VersionCheckPrompt />
						<ToastProvider />
					</TooltipProvider>
				</SessionProvider>
			);

		default:
			return renderLoadingScreen("Initializing...");
	}
}
