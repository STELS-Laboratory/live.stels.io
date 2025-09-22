import React, { useEffect, useMemo, useState } from "react";
import { useAppStore, useAuthStore } from "@/stores";
import { ReactFlowProvider } from "reactflow";
import SessionProvider from "@/components/main/Provider";
import { useUrlRouter } from "@/hooks/useUrlRouter";
import { RouteLoader } from "@/components/main/RouteLoader";
import { useAuthRestore } from "@/hooks/useAuthRestore";
import { useHydration } from "@/hooks/useHydration";

import Welcome from "@/routes/main/Welcome";
import MarketDataViewer from "@/routes/main/Markets";
import Flow from "@/routes/main/canvas/Flow";
import HeterogenComponent from "@/routes/main/globe/HeterogenMap";
import Scanner from "@/routes/main/Scanner";
import GliesereumWallet from "@/routes/wallet/Wallet";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/routes/Layout";
import Fred from "@/routes/main/Fred";
import { AMIEditor } from "@/routes/editor/AMIEditor";
import SplashScreen from "./components/main/SplashScreen";
import UpgradeScreen from "./components/main/UpgradeScreen";
import { ProfessionalConnectionFlow } from "@/components/auth/ProfessionalConnectionFlow";

/**
 * Professional Dashboard component with fixed layout structure
 */
export default function Dashboard(): React.ReactElement {
	const { currentRoute, setRouteLoading, upgrade, setUpgrade } = useAppStore();
	const { isAuthenticated, isConnected, _hasHydrated } = useAuthStore();
	const hasHydrated = useHydration();
	const [showSplash, setShowSplash] = useState(true);
	const [forceRender, setForceRender] = useState(false);

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

	// Initialize URL-based routing
	useUrlRouter();

	// Initialize automatic authentication restoration
	useAuthRestore();

	// Check if store is hydrated after a delay
	useEffect(() => {
		if (!_hasHydrated) {
			const timer = setTimeout(() => {
				console.log("[App] Store hydration timeout - forcing render");
				setForceRender(true);
			}, 2000); // 2 seconds timeout
			return () => clearTimeout(timer);
		}
	}, [_hasHydrated]);

	// Mark heavy routes as loading during mount and when route changes
	const isHeavyRoute = useMemo(() => currentRoute === "canvas", [currentRoute]);

	useEffect(() => {
		if (isHeavyRoute) {
			setRouteLoading(true);
			// Fallback timeout in case component doesn't signal readiness
			const timeout = setTimeout(() => setRouteLoading(false), 2500);
			return () => clearTimeout(timeout);
		} else {
			setRouteLoading(false);
		}
	}, [isHeavyRoute, setRouteLoading]);

	const handleSplashComplete = (): void => {
		setShowSplash(false);
	};

	const handleUpgradeComplete = (): void => {
		// Set upgrade to false in store when upgrade is complete
		setUpgrade(false);
	};

	const renderMainContent = (): React.ReactElement => {
		switch (currentRoute) {
			case "welcome":
				return <Welcome />;
			case "scanner":
				return <Scanner />;
			case "fred":
				return <Fred />;
			case "markets":
				return <MarketDataViewer />;
			case "network":
				return <HeterogenComponent />;
			case "editor":
				return <AMIEditor />;
			case "wallet":
				return <GliesereumWallet />;
			case "canvas":
				return (
					<ReactFlowProvider>
						<Flow />
					</ReactFlowProvider>
				);
			default:
				return <Welcome />;
		}
	};

	// Debug logging
	const authStoreData = localStorage.getItem("auth-store");
	const privateStoreData = localStorage.getItem("private-store");

	// Check if we have a valid session in localStorage
	const hasValidSession = privateStoreData &&
		JSON.parse(privateStoreData)?.raw?.session;

	console.log("[App] Render state:", {
		_hasHydrated,
		isAuthenticated,
		isConnected,
		currentRoute,
		hasAuthStore: !!authStoreData,
		hasPrivateStore: !!privateStoreData,
		hasValidSession: !!hasValidSession,
	});

	if (authStoreData) {
		console.log("[App] Auth store data:", JSON.parse(authStoreData));
	}

	// Show loading while store is hydrating (only for a short time)
	if (!hasHydrated) {
		console.log("[App] Browser not hydrated, showing splash screen");
		return <SplashScreen onComplete={handleSplashComplete} />;
	}

	// Give store a moment to hydrate, but don't wait forever
	if (!_hasHydrated && authStoreData && !forceRender) {
		console.log("[App] Store not hydrated but has data, waiting briefly...");
		return <SplashScreen onComplete={handleSplashComplete} />;
	}

	// If we have a valid session in localStorage, skip authentication completely
	if (hasValidSession) {
		console.log(
			"[App] Found valid session in localStorage, skipping authentication",
		);
		// Skip authentication and go directly to main app
		console.log("[App] Authenticated and connected, showing main app");
		return (
			<SessionProvider>
				{upgrade
					? (
						<UpgradeScreen
							onComplete={handleUpgradeComplete}
							endDate={upgradeEndDate}
						/>
					)
					: (
						<TooltipProvider>
							{showSplash
								? (
									<SplashScreen
										onComplete={handleSplashComplete}
										duration={4000}
									/>
								)
								: (
									<RouteLoader>
										<Layout>
											{renderMainContent()}
										</Layout>
									</RouteLoader>
								)}
						</TooltipProvider>
					)}
			</SessionProvider>
		);
	}

	// Show authentication flow if user is not authenticated
	if (!isAuthenticated || !isConnected) {
		console.log("[App] Not authenticated or not connected, showing auth flow");
		console.log("[App] Auth state details:", {
			isAuthenticated,
			isConnected,
			hasValidSession,
			authStoreData: !!authStoreData,
			privateStoreData: !!privateStoreData,
		});
		return <ProfessionalConnectionFlow />;
	}

	console.log("[App] Authenticated and connected, showing main app");

	return (
		<SessionProvider>
			{upgrade
				? (
					<UpgradeScreen
						onComplete={handleUpgradeComplete}
						endDate={upgradeEndDate}
					/>
				)
				: (
					<TooltipProvider>
						{showSplash
							? (
								<SplashScreen
									onComplete={handleSplashComplete}
									duration={4000}
								/>
							)
							: (
								<RouteLoader>
									<Layout>
										{renderMainContent()}
									</Layout>
								</RouteLoader>
							)}
					</TooltipProvider>
				)}
		</SessionProvider>
	);
}
