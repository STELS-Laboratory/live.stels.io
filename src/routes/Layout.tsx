"use client";

import type * as React from "react";
import { useAppStore } from "@/stores";
import { useAuthStore } from "@/stores/modules/auth.store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Boxes,
	CandlestickChart,
	CircleX,
	Code,
	Globe,
	Home,
	Layers,
	ScanSearch,
	Wallet,
} from "lucide-react";
import Graphite from "@/components/ui/vectors/logos/Graphite";
import { navigateTo } from "@/lib/router";
import { ConnectionStatusSimple } from "@/components/auth/ConnectionStatusSimple";
import { AnimatePresence, motion } from "framer-motion";

interface LayoutProps {
	children: React.ReactNode;
}

interface NavItem {
	key: string;
	label: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Application root layout. Provides a document-oriented shell with a branded sidebar
 * and a content area optimized for trading and analytics screens.
 */
function Layout({ children }: LayoutProps): React.ReactElement {
	const { currentRoute, allowedRoutes, routeLoading } = useAppStore();
	const { connectionSession } = useAuthStore();
	// Wallet info is now handled by ConnectionStatusSimple component

	// Show sidebar only for developers
	const isDeveloper = connectionSession?.developer || false;

	/**
	 * Navigate back to welcome screen (App Store)
	 */
	const handleBackToWelcome = (): void => {
		navigateTo("welcome");
	};

	/**
	 * Check if we should show the back button
	 */
	const showBackButton = currentRoute !== "welcome";

	/**
	 * Get friendly app name for current route
	 */
	const getAppName = (route: string): string => {
		const names: Record<string, string> = {
			welcome: "Welcome",
			scanner: "Liquidity Scanner",
			markets: "Market Data",
			fred: "Indicators",
			network: "Network Explorer",
			editor: "AMI Editor",
			wallet: "Wallet",
			canvas: "Widget Studio",
		};
		return names[route] || route;
	};

	const generalNav: NavItem[] = [
		{ key: "welcome", label: "Welcome", icon: Home },
		{ key: "scanner", label: "Scanner", icon: ScanSearch },
		{ key: "markets", label: "Markets", icon: CandlestickChart },
		{ key: "fred", label: "Indicators", icon: Layers },
	].filter((i) => allowedRoutes.includes(i.key));

	const systemNav: NavItem[] = [
		{ key: "network", label: "Network", icon: Globe },
		{ key: "wallet", label: "Wallet", icon: Wallet },
		{ key: "canvas", label: "Canvas", icon: Boxes },
		{ key: "editor", label: "Editor", icon: Code },
	].filter((i) => allowedRoutes.includes(i.key));

	const renderNavItem = (
		item: NavItem,
		isMobile = false,
	): React.ReactElement => {
		const Icon = item.icon;
		const isActive = currentRoute === item.key;

		if (isMobile) {
			return (
				<motion.div
					key={item.key}
					whileTap={{ scale: 0.95 }}
					transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
				>
					<Button
						variant={isActive ? "default" : "ghost"}
						size="sm"
						className={cn(
							"flex items-center gap-2 w-full justify-start transition-all duration-150",
							isActive
								? "bg-amber-500/20 text-amber-400 border-amber-500/30"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
						)}
						onClick={() => {
							navigateTo(item.key);
						}}
						aria-current={isActive ? "page" : undefined}
					>
						<motion.div
							animate={isActive ? { rotate: [0, -8, 8, 0] } : {}}
							transition={{ duration: 0.5, ease: "easeInOut" }}
						>
							<Icon className="size-4 shrink-0" />
						</motion.div>
						<span className="text-sm">{item.label}</span>
					</Button>
				</motion.div>
			);
		}

		return (
			<motion.div
				className="w-full flex"
				key={item.key}
				initial={{ opacity: 0, x: -30 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
			>
				<TooltipProvider>
					<Tooltip delayDuration={100}>
						<TooltipTrigger asChild>
							<motion.button
								type="button"
								onClick={() => navigateTo(item.key)}
								className={cn(
									"cursor-pointer flex flex-1 items-center p-3 m-1 justify-center text-sm transition-all duration-150 outline-none rounded-lg",
									"hover:bg-amber-500/10 hover:text-amber-400",
									isActive
										? "text-amber-400 bg-amber-500/20 ring-1 ring-amber-500/30 shadow-sm"
										: "text-muted-foreground",
								)}
								aria-current={isActive ? "page" : undefined}
								whileHover={{
									scale: 1.08,
									transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
								}}
								whileTap={{ scale: 0.92 }}
								animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
								transition={{
									scale: isActive
										? {
											duration: 0.4,
											repeat: 0,
											ease: [0.16, 1, 0.3, 1],
										}
										: { duration: 0.2 },
								}}
							>
								<motion.div
									animate={isActive ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
									transition={{
										duration: 0.5,
										ease: "easeInOut",
									}}
								>
									<Icon
										className={cn(
											"size-5 shrink-0 transition-colors",
											isActive ? "text-amber-400" : "",
										)}
									/>
								</motion.div>
							</motion.button>
						</TooltipTrigger>
						<TooltipContent side="right" className="font-medium">
							{item.label}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</motion.div>
		);
	};

	// Wallet info is now handled by ConnectionStatusSimple component

	return (
		<div className="flex flex-col absolute w-[100%] h-[100%] overflow-hidden">
			<div
				className={`grid grid-cols-1 ${
					isDeveloper ? "lg:grid-cols-[80px_1fr]" : ""
				} gap-0 h-full overflow-hidden`}
			>
				{/* Desktop Sidebar - Only for developers */}
				{isDeveloper && (
					<motion.aside
						className="hidden lg:flex lg:flex-col border-r h-full bg-card/50 backdrop-blur-sm overflow-hidden"
						aria-label="Primary navigation"
						initial={{ x: -80, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
					>
						<div className="flex h-30 w-full items-center justify-center border-b border-border/50">
							<motion.button
								onClick={() => navigateTo("welcome")}
								className="flex items-center justify-center p-2 cursor-pointer"
								aria-label="Go to welcome page"
								whileHover={{
									scale: 1.1,
									rotate: 10,
									transition: { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] },
								}}
								whileTap={{ scale: 0.9 }}
							>
								<motion.div
									animate={{
										rotate: [0, 3, -3, 0],
									}}
									transition={{
										duration: 3,
										repeat: Infinity,
										ease: "easeInOut",
									}}
								>
									<Graphite size={3} />
								</motion.div>
							</motion.button>
						</div>

						<div className="flex-1 text-center overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
							<nav className="p-2 space-y-8">
								<div>
									<div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
										Stels
									</div>
									<div className="space-y-1">
										{generalNav.map((item) => renderNavItem(item))}
									</div>
								</div>

								<div>
									<div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
										Apps
									</div>
									<div className="space-y-1">
										{systemNav.map((item) => renderNavItem(item))}
									</div>
								</div>
							</nav>
						</div>

						<motion.div
							className="p-4 h-16"
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: 0.4,
								delay: 0.2,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							<motion.div
								animate={{
									scale: [1, 1.04, 1],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									repeatDelay: 2,
									ease: "easeInOut",
								}}
							>
								<Badge
									variant="outline"
									className="w-full justify-center text-amber-400 border-amber-500/30 bg-amber-500/5"
								>
									<motion.span
										className="font-medium"
										animate={{
											opacity: [0.8, 1, 0.8],
										}}
										transition={{
											duration: 1.8,
											repeat: Infinity,
											ease: "easeInOut",
										}}
									>
										TEST
									</motion.span>
								</Badge>
							</motion.div>
						</motion.div>
					</motion.aside>
				)}

				{/* Main Content Area */}
				<div className="flex flex-col min-w-0 h-[100%] overflow-hidden">
					<header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
						{/* Mobile Header - iOS Style */}
						<div className="lg:hidden">
							<div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800/50">
								<div className="flex items-center gap-2">
									<Graphite size={1.5} />
									<span className="text-sm font-semibold text-white">
										STELS
									</span>
								</div>

								<ConnectionStatusSimple />
							</div>

							{/* iOS-Style Navigation Bar - Simple and clean */}
							{showBackButton && (
								<div className="px-4 py-2">
									<button
										onClick={handleBackToWelcome}
										className="flex items-center gap-1 text-amber-500 active:opacity-60 transition-opacity duration-100"
									>
										<CircleX className="w-10 h-6" strokeWidth={1.5} />
										<span className="text-base font-normal">
											Close
										</span>
									</button>
								</div>
							)}
						</div>

						{/* Desktop Header */}
						<motion.div
							className="hidden lg:block"
							initial={{ y: -30, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{
								duration: 0.4,
								delay: 0.1,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							<div className="flex items-center justify-between px-6 h-16">
								<div className="flex items-center gap-4">
									<Graphite size={2} primary="orange"/> STELS
									{/* iOS-Style Back button */}
									<AnimatePresence mode="wait">
										{showBackButton && (
											<motion.button
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: -20 }}
												transition={{
													duration: 0.3,
													ease: [0.16, 1, 0.3, 1],
												}}
												onClick={handleBackToWelcome}
												className="relative group flex items-center gap-1 -ml-2 px-2 py-1.5 rounded-lg text-amber-500 hover:opacity-80 active:opacity-60 transition-opacity duration-150"
												whileHover={{
													x: -3,
													transition: { duration: 0.2, ease: "easeOut" },
												}}
												whileTap={{ scale: 0.96, x: -4 }}
											>
												<motion.div
													animate={{ x: [0, -2, 0] }}
													transition={{
														duration: 1.5,
														repeat: Infinity,
														repeatDelay: 2,
														ease: "easeInOut",
													}}
												>
													<CircleX className="w-10 h-" strokeWidth={1.5} />
												</motion.div>
												<motion.span
													className="text-base font-normal tracking-tight"
													animate={{
														opacity: [1, 0.9, 1],
													}}
													transition={{
														duration: 2,
														repeat: Infinity,
														ease: "easeInOut",
													}}
												>
													Close
												</motion.span>

												{/* Subtle hover underline */}
												<motion.div
													className="absolute bottom-0.5 left-0 right-0 h-0.5 bg-amber-500/50 rounded-full"
													initial={{ scaleX: 0, opacity: 0 }}
													whileHover={{ scaleX: 0.8, opacity: 1 }}
													transition={{ duration: 0.2, ease: "easeOut" }}
													style={{ transformOrigin: "left" }}
												/>
											</motion.button>
										)}
									</AnimatePresence>

									{/* Separator */}
									{showBackButton && (
										<motion.div
											className="h-6 w-px bg-zinc-800/50"
											initial={{ opacity: 0, scaleY: 0 }}
											animate={{ opacity: 1, scaleY: 1 }}
											exit={{ opacity: 0, scaleY: 0 }}
											transition={{ duration: 0.3, delay: 0.1 }}
										/>
									)}

									{/* iOS-Style App Title - Hidden on welcome screen */}
									{currentRoute !== "welcome" && (
										<motion.div
											className="flex items-center gap-2"
											key={currentRoute}
											initial={{ opacity: 0, y: -5 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												duration: 0.2,
												delay: 0.05,
												ease: [0.16, 1, 0.3, 1],
											}}
										>
											<motion.h1
												className="text-lg font-semibold text-white tracking-tight"
												initial={{ scale: 1.05, opacity: 0 }}
												animate={{ scale: 1, opacity: 1 }}
												transition={{
													duration: 0.2,
													ease: [0.34, 1.56, 0.64, 1],
												}}
											>
												{getAppName(currentRoute)}
											</motion.h1>
										</motion.div>
									)}
								</div>

								<motion.div
									initial={{ x: 30, opacity: 0 }}
									animate={{ x: 0, opacity: 1 }}
									transition={{
										duration: 0.3,
										delay: 0.15,
										ease: [0.16, 1, 0.3, 1],
									}}
								>
									<ConnectionStatusSimple />
								</motion.div>
							</div>
						</motion.div>
					</header>

					<AnimatePresence>
						{routeLoading && (
							<motion.div
								className="w-full border-b"
								initial={{ opacity: 0, scaleX: 0 }}
								animate={{ opacity: 1, scaleX: 1 }}
								exit={{ opacity: 0, scaleX: 0 }}
								transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
								style={{ transformOrigin: "left" }}
							>
								<motion.div
									initial={{ width: "0%" }}
									animate={{ width: "100%" }}
									transition={{
										duration: 0.5,
										ease: [0.16, 1, 0.3, 1],
									}}
								>
									<Progress value={100} className="h-1" />
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>

					<main
						className="flex flex-1 overflow-y-auto overflow-x-hidden bg-background"
						data-route-container
					>
						<div className="w-full mx-auto pt-2 sm:pt-2 lg:pt-2 flex-1 min-h-0 bg-black">
							{children}
						</div>

						{routeLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
								<div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 border shadow-lg">
									<div className="flex items-center gap-3">
										<div className="size-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
										<span className="text-sm text-muted-foreground">
											Loading…
										</span>
									</div>
								</div>
							</div>
						)}
					</main>

					<footer className="h-16 border-t">
						<div className="container mx-auto px-4 py-5">
							<div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
								<span>© 2024 Gliesereum Ukraine. All rights reserved.</span>
							</div>
						</div>
					</footer>
				</div>
			</div>
		</div>
	);
}

export default Layout;
