import React from "react";
import { useAppStore } from "@/stores";
import { ReactFlowProvider } from "reactflow";
import SessionProvider from "@/components/main/Provider";

import Welcome from "@/routes/main/Welcome.tsx";
import MarketDataViewer from "@/routes/main/Markets.tsx";
import Flow from "@/routes/main/canvas/Flow.tsx";
import HeterogenComponent from "@/routes/main/globe/HeterogenMap.tsx";
import Scanner from "@/routes/main/Scanner.tsx";
import GliesereumWallet from "@/routes/wallet/Wallet.tsx";

import {
	TooltipProvider,
} from "@/components/ui/tooltip";
import DocksWallet from "@/routes/main/docks/DocksWallet.tsx";

/**
 * Professional Dashboard component with fixed layout structure
 */
export default function Dashboard(): React.ReactElement {
	const { currentRoute,
	} =
		useAppStore();

	const renderMainContent = (): React.ReactElement => {
		switch (currentRoute) {
			case "welcome":
				return <Welcome />;
			case "docks":
				return <DocksWallet />;
			case "scanner":
				return <Scanner />;
			case "markets":
				return <MarketDataViewer />;
			case "network":
				return <HeterogenComponent />;
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
				{renderMainContent()}
			</TooltipProvider>
		</SessionProvider>
	);
}
