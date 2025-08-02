import React, { useEffect } from "react";
import { useAppStore } from "@/stores";
import { ReactFlowProvider } from "reactflow";
import SessionProvider from "@/components/main/Provider";
import { SyncNotification } from "@/components/main/SyncNotification";
import { useDataSync } from "@/hooks/useDataSync";
import Welcome from "@/routes/main/Welcome.tsx";
import MarketDataViewer from "@/routes/main/Markets.tsx";
import Flow from "@/routes/main/canvas/Flow.tsx";
import HeterogenComponent from "@/routes/main/globe/HeterogenMap.tsx";
import Scanner from "@/routes/main/Scanner.tsx";
import GliesereumWallet from "@/routes/wallet/Wallet.tsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Globe, Home, Layers, Search, TrendingUp, Wallet } from "lucide-react";
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
	const { currentRoute, setRoute, allowedRoutes } = useAppStore();

	// Initialize data synchronization
	const { checkForUpdates, isOnline } = useDataSync();

	// Check for updates on app start and periodically
	useEffect(() => {
		const performInitialCheck = async (): Promise<void> => {
			if (isOnline) {
				await checkForUpdates();
			}
		};

		performInitialCheck();

		// Set up periodic check for updates every 30 seconds
		const interval = setInterval(() => {
			if (isOnline) {
				checkForUpdates();
			}
		}, 30000);

		return (): void => {
			clearInterval(interval);
		};
	}, [checkForUpdates, isOnline]);

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
					{/* Fixed Sidebar Navigation */}
					<nav className="w-[60px] bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4">
						{/* Logo */}
						<div className="mb-8">
							<Graphite size={2} primary="orange" />
						</div>

						{/* Navigation Items */}
						<div className="flex flex-col space-y-2">
							{navigationRoutes
								.filter((route) => allowedRoutes.includes(route.key))
								.map((route) => (
									<Tooltip key={route.key}>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className={`w-12 h-12 p-0 ${
													currentRoute === route.key
														? "bg-amber-600 text-zinc-900 hover:bg-amber-700"
														: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
												}`}
												onClick={() => setRoute(route.key)}
											>
												{route.icon}
											</Button>
										</TooltipTrigger>
										<TooltipContent side="right">
											<p>{route.label}</p>
										</TooltipContent>
									</Tooltip>
								))}
						</div>
					</nav>

					{/* Main Content Area */}
					<div className="flex flex-col w-full h-full">
						{/* Fixed Header */}
						<header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<h1 className="text-xl font-semibold text-zinc-100">
										SONAR Web3 Platform
									</h1>
									<Separator orientation="vertical" className="h-6" />
									<span className="text-sm text-zinc-400 capitalize">
										{currentRoute}
									</span>
								</div>

								{/* Global Search */}
								<div className="flex items-center space-x-4">
									<div className="relative">
										<Search
											className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
											size={16}
										/>
										<Input
											placeholder="Search across platform..."
											className="pl-10 w-64 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-400"
										/>
									</div>
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
									<span>© 2024 SONAR Technologies</span>
									<Separator orientation="vertical" className="h-4" />
									<span>Web3 Trading Platform</span>
									<Separator orientation="vertical" className="h-4" />
									<span>Version 1.0.1</span>
								</div>

								<div className="flex items-center space-x-6">
									<a href="#" className="hover:text-zinc-300 transition-colors">
										Documentation
									</a>
									<a href="#" className="hover:text-zinc-300 transition-colors">
										Support
									</a>
									<a href="#" className="hover:text-zinc-300 transition-colors">
										Privacy Policy
									</a>
								</div>
							</div>
						</footer>
					</div>

					{/* Sync Notifications */}
					<SyncNotification />
				</div>
			</TooltipProvider>
		</SessionProvider>
	);
}
