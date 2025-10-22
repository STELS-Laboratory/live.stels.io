import React, {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useAppStore, useAuthStore } from "@/stores";
import { ReactFlowProvider } from "reactflow";
import SessionProvider from "@/components/main/provider";
import { useUrlRouter } from "@/hooks/use_url_router";
import { RouteLoader } from "@/components/main/route_loader";
import { useAuthRestore } from "@/hooks/use_auth_restore";
import { useHydration } from "@/hooks/use_hydration";
import { useTheme } from "@/hooks/use_theme";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "./components/main/splash_screen";
import UpgradeScreen from "./components/main/upgrade_screen";
import { ProfessionalConnectionFlow } from "@/components/auth/professional_connection_flow";
import { SecurityWarningDialog } from "@/components/auth/security_warning_dialog";
import { SessionExpiredModal } from "@/components/auth/session_expired_modal";

// Lazy-loaded app modules
const Welcome = lazy(() => import("@/apps/welcome"));
const Flow = lazy(() => import("@/apps/canvas/flow"));
const Schemas = lazy(() => import("@/apps/schemas"));
const Docs = lazy(() =>
	import("@/apps/docs").then((m) => ({ default: m.Docs }))
);
import { TooltipProvider } from "@/components/ui/tooltip";
const Layout = lazy(() => import("@/apps/layout.tsx"));
const AMIEditor = lazy(() =>
	import("@/apps/editor/ami_editor").then((m) => ({ default: m.AMIEditor }))
);

/**
 * App states for managing transitions
 */
type AppState =
	| "initializing"
	| "hydrating"
	| "checking_session"
	| "authenticating"
	| "connecting"
	| "loading_app"
	| "ready"
	| "upgrading";

/**
 * Professional Dashboard component with enhanced state management and artificial delays
 */
export default function Dashboard(): React.ReactElement {
	const { currentRoute, setRouteLoading, upgrade, setUpgrade } = useAppStore();
	const { isAuthenticated, isConnected, _hasHydrated } = useAuthStore();
	const { resolvedTheme } = useTheme(); // Use hook for automatic system theme detection
	const hasHydrated = useHydration();

	// Apply resolved theme to document (will update automatically when system theme changes)
	useEffect(() => {
		// Apply theme class to document root
		const root = document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
		root.setAttribute("data-theme", resolvedTheme);
	}, [resolvedTheme]);

	// Prevent zoom and touch behaviors
	useEffect(() => {
		const preventZoom = (e: TouchEvent) => {
			if (e.touches.length > 1) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		const preventGestures = (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
		};

		const preventWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				e.stopPropagation();
			}
		};

		// Add event listeners
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

		// Set CSS properties programmatically
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

	// State management with artificial delays
	const [appState, setAppState] = useState<AppState>("initializing");
	const [showSplash, setShowSplash] = useState(true);
	const [forceRender, setForceRender] = useState(false);
	const [transitionProgress, setTransitionProgress] = useState(0);
	const [isTransitioning, setIsTransitioning] = useState(false);

	// Set upgrade end date - you can modify this date as needed
	const upgradeEndDate = useMemo(() => {
		// Set to complete tomorrow at 9 PM New York time
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const year = tomorrow.getFullYear();
		const month = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
		const day = tomorrow.getDate().toString().padStart(2, "0");
		const nyDateTime = `${year}-${month}-${day}T21:00:00-04:00`;

		return new Date(nyDateTime);
	}, []);

	/**
	 * Smooth state transition with artificial delay and progress animation
	 */
	const transitionToState = useCallback(async (
		newState: AppState,
		delay: number = 800,
		showProgress: boolean = true,
	): Promise<void> => {
		console.log(
			`[App] Transitioning from ${appState} to ${newState} with ${delay}ms delay`,
		);

		if (showProgress) {
			setIsTransitioning(true);
			setTransitionProgress(0);

			// Animate progress bar
			const progressInterval = setInterval(() => {
				setTransitionProgress((prev) => {
					const newProgress = prev + (100 / (delay / 50));
					return newProgress >= 100 ? 100 : newProgress;
				});
			}, 50);

			// Wait for the delay
			await new Promise((resolve) => setTimeout(resolve, delay));

			clearInterval(progressInterval);
			setTransitionProgress(100);

			// Small additional delay to show completed progress
			await new Promise((resolve) => setTimeout(resolve, 50));

			setIsTransitioning(false);
			setTransitionProgress(0);
		} else {
			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		setAppState(newState);
	}, [appState]);

	/**
	 * Get delay duration based on state transition
	 */
	const getTransitionDelay = useCallback(
		(fromState: AppState, toState: AppState): number => {
			const delays: Record<string, number> = {
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

			const key = `${fromState}->${toState}`;
			return delays[key] || 250;
		},
		[],
	);

	// Initialize URL-based routing
	useUrlRouter();

	// Initialize automatic authentication restoration
	useAuthRestore();

	// Authentication state monitoring effect
	// This effect specifically monitors for authentication changes and forces re-authentication
	useEffect(() => {
		// Only monitor auth changes when app is ready and we're not in transition states
		if (appState === "ready" && (!isAuthenticated || !isConnected)) {
			console.log(
				"[App] Authentication lost while app was ready - forcing re-authentication",
			);
			// Force transition back to checking session to re-evaluate auth state
			setAppState("checking_session");
		}
	}, [isAuthenticated, isConnected, appState]);

	// Main state management effect
	useEffect(() => {
		const manageAppState = async () => {
			console.log(`[App] Current state: ${appState}`, {
				hasHydrated,
				_hasHydrated,
				isAuthenticated,
				isConnected,
				upgrade,
			});

			switch (appState) {
				case "initializing":
					if (hasHydrated) {
						const delay = getTransitionDelay("initializing", "hydrating");
						await transitionToState("hydrating", delay);
					}
					break;

				case "hydrating":
					if (_hasHydrated || forceRender) {
						const delay = getTransitionDelay("hydrating", "checking_session");
						await transitionToState("checking_session", delay);
					} else {
						// Set timeout for forced render if hydration takes too long
						const timer = setTimeout(() => {
							console.log("[App] Store hydration timeout - forcing render");
							setForceRender(true);
						}, 800);
						return () => clearTimeout(timer);
					}
					break;

				case "checking_session": {
					const authStoreData = localStorage.getItem("auth-store");
					const privateStoreData = localStorage.getItem("private-store");
					const hasValidSession = privateStoreData &&
						JSON.parse(privateStoreData)?.raw?.session;

					if (upgrade) {
						const delay = getTransitionDelay("checking_session", "upgrading");
						await transitionToState("upgrading", delay, false);
					} else if (isAuthenticated && isConnected && hasValidSession) {
						// Best case: both store and localStorage confirm authentication
						console.log(
							"[App] Authenticated and connected with valid session, loading app",
						);
						const delay = getTransitionDelay("checking_session", "loading_app");
						await transitionToState("loading_app", delay);
					} else if (authStoreData && hasValidSession && !isAuthenticated) {
						// Store has data and valid session exists, but not marked as authenticated
						// This happens on page reload - give auth restoration a chance
						console.log(
							"[App] Store data and session found but not authenticated - allowing auth restoration",
						);
						const delay = getTransitionDelay("checking_session", "loading_app");
						await transitionToState("loading_app", delay);
					} else if (!isAuthenticated || !isConnected) {
						// No authentication or connection - show auth flow
						console.log(
							"[App] Not authenticated or not connected, showing auth flow",
						);
						const delay = getTransitionDelay(
							"checking_session",
							"authenticating",
						);
						await transitionToState("authenticating", delay);
					} else if (authStoreData && !hasValidSession) {
						console.log(
							"[App] Auth store found but no session, need to reconnect",
						);
						const delay = getTransitionDelay(
							"checking_session",
							"authenticating",
						);
						await transitionToState("authenticating", delay);
					} else {
						// Fallback: if we can't determine state clearly, show auth flow
						console.log(
							"[App] Unable to determine auth state, showing auth flow",
						);
						const delay = getTransitionDelay(
							"checking_session",
							"authenticating",
						);
						await transitionToState("authenticating", delay);
					}
					break;
				}

				case "authenticating":
					// This state is handled by the auth flow component
					// We'll transition out of this when auth is complete
					if (isAuthenticated && isConnected) {
						const delay = getTransitionDelay("authenticating", "connecting");
						await transitionToState("connecting", delay);
					}
					break;

				case "connecting":
					if (isAuthenticated && isConnected) {
						const delay = getTransitionDelay("connecting", "loading_app");
						await transitionToState("loading_app", delay);
					}
					break;

				case "loading_app": {
					// Handle splash screen and final app loading
					const delay = getTransitionDelay("loading_app", "ready");
					await transitionToState("ready", delay);
					break;
				}

				case "upgrading":
					if (!upgrade) {
						const delay = getTransitionDelay("upgrading", "ready");
						await transitionToState("ready", delay);
					}
					break;

				case "ready":
					if (upgrade) {
						const delay = getTransitionDelay("ready", "upgrading");
						await transitionToState("upgrading", delay, false);
					}
					// Handle splash screen completion
					if (showSplash) {
						setTimeout(() => setShowSplash(false), 300);
					}
					break;
			}
		};

		manageAppState();
	}, [
		appState,
		hasHydrated,
		_hasHydrated,
		forceRender,
		isAuthenticated,
		isConnected,
		upgrade,
		showSplash,
		transitionToState,
		getTransitionDelay,
	]);

	// Mark heavy routes as loading during mount and when route changes
	const isHeavyRoute = useMemo(() => currentRoute === "canvas", [currentRoute]);

	useEffect(() => {
		if (isHeavyRoute && appState === "ready") {
			setRouteLoading(true);
			// Fallback timeout in case component doesn't signal readiness
			const timeout = setTimeout(() => setRouteLoading(false), 500);
			return () => clearTimeout(timeout);
		} else {
			setRouteLoading(false);
		}
	}, [isHeavyRoute, setRouteLoading, appState]);

	const handleSplashComplete = (): void => {
		setShowSplash(false);
	};

	const handleUpgradeComplete = (): void => {
		// Set upgrade to false in store when upgrade is complete
		setUpgrade(false);
	};

	/**
	 * Loading screen with state information and progress bar
	 */
	const renderLoadingScreen = (message: string): React.ReactElement => {
		return (
			<motion.div
				className="absolute max-w-[500px] mx-auto w-[100%] h-[100%] overflow-hidden left-0 right-0 top-0 bottom-0 bg-background flex items-center justify-center p-32"
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
						transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
						transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
					>
						<div className="w-full bg-muted rounded-full h-2 overflow-hidden">
							<motion.div
								className="bg-primary h-2 rounded-full"
								initial={{ width: "0%" }}
								animate={{ width: `${transitionProgress}%` }}
								transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
							/>
						</div>
						<motion.p
							className="text-xs text-muted-foreground"
							key={Math.round(transitionProgress)}
							initial={{ scale: 1.15, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
						>
							{Math.round(transitionProgress)}% complete
						</motion.p>
					</motion.div>

					{/* State Indicator */}
					<motion.div
						className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
	};

	/**
	 * Get loading message based on current state
	 */
	const getStateMessage = (state: AppState): string => {
		const messages: Record<AppState, string> = {
			initializing: "Starting up...",
			hydrating: "Loading your data...",
			checking_session: "Checking authentication...",
			authenticating: "Authenticating...",
			connecting: "Establishing connection...",
			loading_app: "Preparing interface...",
			ready: "Ready!",
			upgrading: "System upgrade in progress...",
		};
		return messages[state] || "Loading...";
	};

	/**
	 * Animation variants for route transitions
	 * Fast and responsive timing for instant feel
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

	const renderMainContent = (): React.ReactElement => {
		switch (currentRoute) {
			case "welcome":
				return (
					<Suspense
						fallback={
							<div className="p-4 text-muted-foreground">Loading...</div>
						}
					>
						<Welcome />
					</Suspense>
				);
			case "editor":
				return (
					<Suspense
						fallback={
							<div className="p-4 text-muted-foreground">Loading editor...</div>
						}
					>
						<AMIEditor />
					</Suspense>
				);
			case "canvas":
				return (
					<Suspense
						fallback={
							<div className="p-4 text-muted-foreground">Loading canvas...</div>
						}
					>
						<ReactFlowProvider>
							<Flow />
						</ReactFlowProvider>
					</Suspense>
				);
			case "schemas":
				return (
					<Suspense
						fallback={
							<div className="p-4 text-muted-foreground">
								Loading schemas...
							</div>
						}
					>
						<Schemas />
					</Suspense>
				);
			case "docs":
				return (
					<Suspense
						fallback={
							<div className="p-4 text-muted-foreground">
								Loading documentation...
							</div>
						}
					>
						<Docs />
					</Suspense>
				);
			default:
				return (
					<Suspense
						fallback={
							<div className="p-4 text-muted-foreground">Loading...</div>
						}
					>
						<Welcome />
					</Suspense>
				);
		}
	};

	// Debug logging with enhanced state information
	console.log("[App] Enhanced render state:", {
		appState,
		hasHydrated,
		_hasHydrated,
		isAuthenticated,
		isConnected,
		currentRoute,
		upgrade,
		showSplash,
		isTransitioning,
		transitionProgress,
	});

	// Render based on app state
	switch (appState) {
		case "initializing":
		case "hydrating":
		case "checking_session":
			return renderLoadingScreen(getStateMessage(appState));

		case "authenticating":
			// Show authentication flow with smooth transition
			return (
				<motion.div
					className="bg-background"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
				>
					<ProfessionalConnectionFlow />
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
						{showSplash
							? (
								<SplashScreen
									onComplete={handleSplashComplete}
									duration={1200}
								/>
							)
							: (
								<div className="absolute w-[100%] h-[100%] top-0 bottom-0 overflow-hidden">
									<RouteLoader>
										<Suspense
											fallback={
												<div className="p-4 text-muted-foreground">
													Loading layout...
												</div>
											}
										>
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
										</Suspense>
									</RouteLoader>
								</div>
							)}
						<SecurityWarningDialog />
						{/* Session expired blocking modal */}
						<SessionExpiredModal />
					</TooltipProvider>
				</SessionProvider>
			);

		default:
			return renderLoadingScreen("Initializing...");
	}
}

// Add CSS for animation delays
const style = document.createElement("style");
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

if (!document.head.querySelector("style[data-app-animations]")) {
	style.setAttribute("data-app-animations", "true");
	document.head.appendChild(style);
}
