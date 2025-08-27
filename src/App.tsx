import React, { useEffect, useMemo } from "react";
import { useAppStore } from "@/stores";
import { ReactFlowProvider } from "reactflow";
import SessionProvider from "@/components/main/Provider";
import { useUrlRouter } from "@/hooks/useUrlRouter";
import { RouteLoader } from "@/components/main/RouteLoader";

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

/**
 * Professional Dashboard component with fixed layout structure
 */
export default function Dashboard(): React.ReactElement {
	const { currentRoute, setRouteLoading } = useAppStore();

	// Initialize URL-based routing
	useUrlRouter();

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

	return (
		<SessionProvider>
			<TooltipProvider>
				<RouteLoader>
					<Layout>
						{renderMainContent()}
					</Layout>
				</RouteLoader>
			</TooltipProvider>
		</SessionProvider>
	);
}
