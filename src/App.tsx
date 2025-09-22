import React, { useEffect, useMemo, useState } from "react";
import { useAppStore, useAuthStore } from "@/stores";
import { ReactFlowProvider } from "reactflow";
import SessionProvider from "@/components/main/Provider";
import { useUrlRouter } from "@/hooks/useUrlRouter";
import { RouteLoader } from "@/components/main/RouteLoader";
import { useAuthRestore } from "@/hooks/useAuthRestore";

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
	const { isAuthenticated, isConnected } = useAuthStore();
	const [showSplash, setShowSplash] = useState(true);

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

	// Show authentication flow if user is not authenticated
	if (!isAuthenticated || !isConnected) {
		return <ProfessionalConnectionFlow />;
	}

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
