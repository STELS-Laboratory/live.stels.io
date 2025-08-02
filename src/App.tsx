import React, { useState } from "react";
import { useAppStore } from "@/stores";
import { ReactFlowProvider } from "reactflow";
import SessionProvider from "@/components/main/Provider";
import { SyncNotification } from "@/components/main/SyncNotification";
import { SyncDemo } from "@/components/main/SyncDemo";
import { SyncErrorClear } from "@/components/main/SyncErrorClear";

import Welcome from "@/routes/main/Welcome.tsx";
import MarketDataViewer from "@/routes/main/Markets.tsx";
import Flow from "@/routes/main/canvas/Flow.tsx";
import HeterogenComponent from "@/routes/main/globe/HeterogenMap.tsx";
import Scanner from "@/routes/main/Scanner.tsx";
import GliesereumWallet from "@/routes/wallet/Wallet.tsx";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
	Globe,
	Home,
	Layers,
	RefreshCw,
	Search,
	TrendingUp,
	Wallet,
} from "lucide-react";
import Graphite from "@/components/ui/vectors/logos/Graphite.tsx";

/**
 * Navigation route configuration with icons and labels
 */
interface NavigationRoute {
	key: string;
	icon: React.ReactElement;
	label: string;
}

/**
 * Professional Dashboard component with fixed layout structure
 */
export default function Dashboard(): React.ReactElement {
	const { currentRoute, setRoute, allowedRoutes, hasUpdates, isSyncing } =
		useAppStore();
	const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

	const navigationRoutes: NavigationRoute[] = [
		{ key: "welcome", icon: <Home size={20} />, label: "Welcome" },
		{ key: "scanner", icon: <Search size={20} />, label: "Scanner" },
		{ key: "markets", icon: <TrendingUp size={20} />, label: "Markets" },
		{ key: "canvas", icon: <Layers size={20} />, label: "Canvas" },
		{ key: "network", icon: <Globe size={20} />, label: "Network" },
		{ key: "wallet", icon: <Wallet size={20} />, label: "Wallet" },
	];

	const renderMainContent = (): React.ReactElement => {
		switch (currentRoute) {
			case "welcome":
				return <Welcome />;
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
				<div className="flex absolute h-[100%] w-[100%] left-0 top-0 bottom-0 right-0 bg-zinc-950">
					{/* Main Content Area */}
					<div className="flex flex-col w-full h-full">
						{/* Fixed Header */}
						<header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<div>
										<Graphite size={2} primary="orange" />
									</div>
									<Separator orientation="vertical" className="h-6" />
									<span className="text-sm text-zinc-400 capitalize">
										{currentRoute}
									</span>
								</div>
							</div>
						</header>

						{/* Content Area */}
						<main className="flex w-full h-full overflow-hidden">
							{renderMainContent()}
						</main>

						{/* Fixed Footer */}
						<footer className="bg-zinc-900 border-t border-zinc-800 px-6 py-3">
							<div className="flex items-center justify-between text-sm text-zinc-400">
								<div className="flex items-center space-x-6">
									<span>© 2025 STELS Labogatory</span>

									<Separator orientation="vertical" className="h-4" />
									<span>Version 1.0.1</span>
								</div>

								<div className="flex items-center space-x-6">
									{/* Sync Modal Icon */}
									<Dialog
										open={isSyncModalOpen}
										onOpenChange={setIsSyncModalOpen}
									>
										<DialogTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className={`w-8 h-8 p-0 transition-all duration-200 ${
													hasUpdates
														? "text-amber-400 hover:text-amber-300 animate-pulse"
														: "text-zinc-400 hover:text-zinc-300"
												}`}
												title={hasUpdates
													? "Updates available - Click to sync"
													: "Data synchronization"}
											>
												<RefreshCw
													className={`h-4 w-4 ${
														isSyncing ? "animate-spin" : ""
													}`}
												/>
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-[500px]">
											<DialogHeader>
												<DialogTitle className="flex items-center gap-2">
													<RefreshCw className="h-5 w-5 text-amber-600" />
													Data Synchronization
												</DialogTitle>
											</DialogHeader>
											<div className="mt-4">
												<SyncDemo />
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</div>
						</footer>
					</div>
				</div>
			</TooltipProvider>
		</SessionProvider>
	);
}
