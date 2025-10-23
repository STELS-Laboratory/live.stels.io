import * as React from "react";
import { useAppStore } from "@/stores";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { cn } from "@/lib/utils.ts";
import { Badge } from "@/components/ui/badge.tsx";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import {
	Activity,
	Boxes,
	CircleX,
	Code,
	FileText,
	Home,
	Layout as LayoutIcon,
	MoreHorizontal,
	Play,
	Server,
	Square,
} from "lucide-react";
import Graphite from "@/components/ui/vectors/logos/graphite.tsx";
import { navigateTo } from "@/lib/router.ts";
import { ConnectionStatusSimple } from "@/components/auth/connection_status_simple.tsx";
import {
	ThemeToggle,
	ThemeToggleCompact,
} from "@/components/ui/theme-toggle.tsx";
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
	const [showNodeInfo, setShowNodeInfo] = React.useState(false);
	const [systemStats, setSystemStats] = React.useState<
		Record<string, unknown> | null
	>(null);
	// Wallet info is now handled by ConnectionStatusSimple component

	// Show sidebar only for developers
	const isDeveloper = connectionSession?.developer || false;

	// Get system stats from session storage
	const getSystemStats = React.useCallback(
		(): Record<string, unknown> | null => {
			try {
				const sonarData = sessionStorage.getItem("testnet.runtime.sonar");
				if (sonarData) {
					return JSON.parse(sonarData) as Record<string, unknown>;
				}
			} catch (error) {
				console.error("Failed to get system stats:", error);
			}
			return null;
		},
		[],
	);

	// Auto-update system stats from sessionStorage
	React.useEffect(() => {
		// Initial load
		setSystemStats(getSystemStats());

		// Update every second
		const interval = setInterval(() => {
			setSystemStats(getSystemStats());
		}, 1000);

		return () => clearInterval(interval);
	}, [getSystemStats]);

	/**
	 * Navigate back to STELS Application Hub
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
			editor: "Editor",
			canvas: "Canvas",
			schemas: "Schemas",
			docs: "Documentation",
		};
		return names[route] || route;
	};

	const generalNav: NavItem[] = [
		{ key: "welcome", label: "Welcome", icon: Home },
	].filter((i) => allowedRoutes.includes(i.key));

	const systemNav: NavItem[] = [
		{ key: "canvas", label: "Canvas", icon: Boxes },
		{ key: "editor", label: "Editor", icon: Code },
		{ key: "schemas", label: "Schemas", icon: LayoutIcon },
		{ key: "docs", label: "Docs", icon: FileText },
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
								? "bg-zinc-200 dark:bg-zinc-700 text-amber-700 dark:text-amber-400"
								: "text-zinc-700 dark:text-zinc-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-muted/50",
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
							<Icon className="icon-md shrink-0" />
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
									"cursor-pointer flex flex-1 items-center p-3 m-1 justify-center text-sm transition-all duration-150 outline-none rounded",
									"hover:bg-amber-500/10",
									isActive
										? "text-amber-700 dark:text-amber-400 bg-zinc-200 dark:bg-zinc-800"
										: "text-zinc-700 dark:text-zinc-400 hover:text-amber-700 dark:hover:text-amber-400",
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
											isActive ? "text-amber-700 dark:text-amber-400" : "",
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
					isDeveloper ? "lg:grid-cols-[60px_1fr]" : ""
				} gap-0 h-full overflow-hidden`}
			>
				{/* Desktop Sidebar - Only for developers */}
				{isDeveloper && (
					<motion.aside
						className="hidden lg:flex lg:flex-col border-r border-border h-full bg-card/30 backdrop-blur-md overflow-hidden shadow-sm"
						aria-label="Primary navigation"
						initial={{ x: -80, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
					>
						<div className="flex h-16 w-full items-center justify-center">
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
									<Graphite size={2.8} primary="orange" />
								</motion.div>
							</motion.button>
						</div>

						<div className="flex-1 text-center overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
							<nav className="p-2 space-y-6">
								<div>
									<div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
										Stels
									</div>
									<div className="space-y-1">
										{generalNav.map((item) => renderNavItem(item))}
									</div>
								</div>

								<div>
									<div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
										Apps
									</div>
									<div className="space-y-1">
										{systemNav.map((item) => renderNavItem(item))}
									</div>
								</div>
							</nav>
						</div>

						<motion.div
							className="p-3 h-14"
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
									className="w-full justify-center text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/5"
								>
									<motion.span
										className="font-medium text-foreground"
										animate={{
											opacity: [0.8, 1, 0.8],
										}}
										transition={{
											duration: 1.8,
											repeat: Infinity,
											ease: "easeInOut",
										}}
									>
										DEV
									</motion.span>
								</Badge>
							</motion.div>
						</motion.div>
					</motion.aside>
				)}

				{/* Main Content Area */}
				<div className="flex flex-col min-w-0 h-[100%] overflow-hidden">
					<header className="shrink-0 border-b border-border bg-card/50 backdrop-blur-md shadow-sm">
						{/* Mobile Header - iOS Style */}
						<div className="lg:hidden">
							<div className="flex items-center justify-between px-4 h-16 border-b border-border/50">
								<div className="flex items-center gap-2">
									<Graphite size={1.5} />
									<span className="text-sm font-semibold text-foreground">
										STELS
									</span>
								</div>

								<div className="flex items-center gap-2">
									<ThemeToggleCompact />
									<ConnectionStatusSimple />
								</div>
							</div>

							{/* iOS-Style Navigation Bar - Simple and clean */}
							{showBackButton && (
								<div className="px-4 py-2">
									<button
										onClick={handleBackToWelcome}
										className="flex items-center gap-1 text-amber-500 active:opacity-60 transition-opacity duration-100"
									>
										<CircleX className="icon-lg" strokeWidth={1.5} />
										<span className="text-sm font-medium">
											Close
										</span>
									</button>
								</div>
							)}

							{/* Mobile Navigation Menu for Developers */}
							{isDeveloper && currentRoute === "welcome" && (
								<div className="px-4 py-2 border-t border-border/50">
									<div className="grid grid-cols-3 gap-3">
										{systemNav.map((item) => {
											const Icon = item.icon;
											return (
												<button
													key={item.key}
													onClick={() => navigateTo(item.key)}
													className="flex flex-col items-center gap-2 p-3 rounded border border-border bg-card/50 hover:bg-card active:scale-95 transition-all"
												>
													<Icon className="icon-lg text-amber-500" />
													<span className="text-xs font-medium text-foreground">
														{item.label}
													</span>
												</button>
											);
										})}
									</div>
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
							<div className="flex items-center justify-between px-6 h-12">
								<div className="flex items-center gap-4">
									{!isDeveloper && (
										<div className="flex items-center gap-2">
											<Graphite size={2} primary="orange" /> STELS
										</div>
									)}
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
												className="relative group flex items-center gap-1 -ml-2 px-2 py-1.5 rounded text-amber-500 hover:opacity-80 active:opacity-60 transition-opacity duration-150"
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
													<CircleX className="icon-lg" strokeWidth={1.5} />
												</motion.div>
												<motion.span
													className="text-sm font-medium tracking-tight"
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
											className="h-6 w-px bg-muted/50"
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
												className="text-lg font-semibold text-foreground tracking-tight"
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
									className="flex items-center gap-2"
								>
									<ThemeToggle />
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
						<div className="w-full mx-auto flex-1 min-h-0 bg-background">
							{children}
						</div>

						{routeLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
								<div className="bg-card backdrop-blur-sm rounded p-4 border border-border">
									<div className="flex items-center gap-3">
										<div className="icon-md border-2 border-primary border-t-transparent rounded-full animate-spin" />
										<span className="text-sm text-muted-foreground">
											Loading...
										</span>
									</div>
								</div>
							</div>
						)}
					</main>

					<footer className="h-[3rem] border-t border-border bg-card/50 backdrop-blur-sm shadow-inner">
						<div className="h-full px-6 flex items-center justify-between">
							<span className="text-[10px] text-muted-foreground">
								© 2025 Gliesereum Ukraine
							</span>

							{/* System Stats */}
							{systemStats && (() => {
								const raw = systemStats.raw as Record<string, unknown>;
								const workers = raw.workers as Record<string, number>;
								const node = raw.node as Record<string, unknown>;
								const operations = node?.operations as Record<string, number>;

								return (
									<div className="flex items-center gap-3 relative">
										<div className="flex items-center gap-1.5 text-xs">
											<Activity className="icon-xs text-blue-600 dark:text-blue-400" />
											<span className="text-foreground font-semibold">
												{operations?.total.toLocaleString()}
											</span>
											<span className="text-muted-foreground">
												ops
											</span>
										</div>

										<div className="flex items-center gap-1.5 text-xs">
											<Play className="icon-xs text-green-600 dark:text-green-400" />
											<span className="text-green-600 dark:text-green-400 font-semibold">
												{workers?.active || 0}
											</span>
										</div>

										<div className="flex items-center gap-1.5 text-xs">
											<Square className="icon-xs text-red-600 dark:text-red-400" />
											<span className="text-red-600 dark:text-red-400 font-semibold">
												{Math.abs(workers?.stopped || 0)}
											</span>
										</div>

										{isDeveloper && (
											<TooltipProvider>
												<Tooltip delayDuration={100}>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => setShowNodeInfo(!showNodeInfo)}
															className={`h-5 w-5 p-0 ${
																showNodeInfo ? "bg-muted" : ""
															}`}
														>
															<MoreHorizontal className="icon-xs" />
														</Button>
													</TooltipTrigger>
													<TooltipContent side="top">Node Info</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										)}

										{/* Node Info Dropdown */}
										{showNodeInfo && isDeveloper && (
											<div className="absolute bottom-6 right-0 w-64 bg-popover border border-border rounded shadow-lg p-3 z-50">
												<div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
													<div className="flex items-center gap-2">
														<Server className="icon-sm text-blue-600 dark:text-blue-400" />
														<span className="text-xs font-semibold text-foreground">
															Node Information
														</span>
													</div>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setShowNodeInfo(false)}
														className="h-auto w-auto p-1"
													>
														<CircleX className="icon-xs" />
													</Button>
												</div>

												<div className="space-y-1.5 text-[10px]">
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															Node ID:
														</span>
														<span className="font-mono text-foreground">
															{String(node?.id || "")}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															Total Operations:
														</span>
														<span className="font-semibold text-blue-700 dark:text-blue-400">
															{operations?.total.toLocaleString()}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															Errors:
														</span>
														<span className="font-semibold text-red-700 dark:text-red-400">
															{operations?.errors || 0}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															Success Rate:
														</span>
														<span className="font-semibold text-green-700 dark:text-green-400">
															{operations?.successRate || 0}%
														</span>
													</div>
													<div className="h-px bg-border my-1.5" />
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															Active Workers:
														</span>
														<span className="font-semibold text-green-700 dark:text-green-400">
															{workers?.active || 0}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															Stopped:
														</span>
														<span className="font-semibold text-red-700 dark:text-red-400">
															{Math.abs(workers?.stopped || 0)}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">
															Local / Network:
														</span>
														<span className="font-mono text-foreground">
															{workers?.local || 0} / {workers?.network || 0}
														</span>
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})()}
						</div>
					</footer>
				</div>
			</div>
		</div>
	);
}

export default Layout;
