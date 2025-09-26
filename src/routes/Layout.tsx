"use client";

import type * as React from "react";
import { useState } from "react";
import { useAppStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
	Code,
	Globe,
	Home,
	Layers,
	Menu,
	ScanSearch,
	Wallet,
	X,
} from "lucide-react";
import Graphite from "@/components/ui/vectors/logos/Graphite";
import { navigateTo } from "@/lib/router";
import { ConnectionStatusSimple } from "@/components/auth/ConnectionStatusSimple";

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
	// Wallet info is now handled by ConnectionStatusSimple component
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
				<Button
					key={item.key}
					variant={isActive ? "default" : "ghost"}
					size="sm"
					className={cn(
						"flex items-center gap-2 w-full justify-start",
						isActive
							? "bg-amber-500/20 text-amber-400 border-amber-500/30"
							: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
					)}
					onClick={() => {
						navigateTo(item.key);
						setIsMobileMenuOpen(false);
					}}
					aria-current={isActive ? "page" : undefined}
				>
					<Icon className="size-4 shrink-0" />
					<span className="text-sm">{item.label}</span>
				</Button>
			);
		}

		return (
			<div className="w-full flex" key={item.key}>
				<TooltipProvider>
					<Tooltip delayDuration={200}>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => navigateTo(item.key)}
								className={cn(
									"cursor-pointer flex flex-1 items-center p-3 m-1 justify-center text-sm transition-all duration-200 outline-none rounded-lg",
									"hover:bg-amber-500/10 hover:text-amber-400 hover:scale-105",
									isActive
										? "text-amber-400 bg-amber-500/20 ring-1 ring-amber-500/30 shadow-sm"
										: "text-muted-foreground",
								)}
								aria-current={isActive ? "page" : undefined}
							>
								<Icon
									className={cn(
										"size-5 shrink-0 transition-colors",
										isActive ? "text-amber-400" : "",
									)}
								/>
							</button>
						</TooltipTrigger>
						<TooltipContent side="right" className="font-medium">
							{item.label}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		);
	};

	// Wallet info is now handled by ConnectionStatusSimple component

	return (
		<div className="flex flex-col absolute w-[100%] h-[100%] overflow-hidden">
			<div className="grid grid-cols-1 lg:grid-cols-[80px_1fr] gap-0 h-full overflow-hidden">
				{/* Desktop Sidebar */}
				<aside
					className="hidden lg:flex lg:flex-col border-r h-full bg-card/50 backdrop-blur-sm overflow-hidden"
					aria-label="Primary navigation"
				>
					<div className="flex h-30 w-full items-center justify-center border-b border-border/50">
						<button
							onClick={() => navigateTo("welcome")}
							className="flex items-center justify-center p-2 cursor-pointer"
							aria-label="Go to welcome page"
						>
							<Graphite size={3} />
						</button>
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

					<div className="p-4 h-16">
						<Badge
							variant="outline"
							className="w-full justify-center text-amber-400 border-amber-500/30 bg-amber-500/5"
						>
							<span className="font-medium">TEST</span>
						</Badge>
					</div>
				</aside>

				{/* Main Content Area */}
				<div className="flex flex-col min-w-0 h-[100%] overflow-hidden">
					<header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
						{/* Mobile Header */}
						<div className="lg:hidden">
							<div className="flex items-center justify-between p-4 h-16">
								<div className="flex items-center gap-3">
									<button
										onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
										className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
										aria-label="Toggle mobile menu"
									>
										{isMobileMenuOpen
											? <X className="size-5" />
											: <Menu className="size-5" />}
									</button>
									<div className="flex items-center gap-2">
										<Graphite size={1.5} />
										<span className="text-sm font-semibold">STELS</span>
									</div>
								</div>

								<ConnectionStatusSimple />
							</div>

							{/* Route indicator */}
							<div className="px-4 pb-3">
								<div className="flex items-center gap-2 text-xs">
									<span className="text-muted-foreground">ROUTE:</span>
									<span className="text-amber-400 font-medium uppercase">
										{currentRoute}
									</span>
								</div>
							</div>
						</div>

						{/* Desktop Header */}
						<div className="hidden lg:block">
							<div className="flex items-center justify-between px-6 h-16">
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-2 text-sm">
										<span className="text-muted-foreground">:</span>
										<span className="text-amber-400 font-medium uppercase">
											{currentRoute}
										</span>
									</div>
								</div>
							</div>
						</div>
					</header>

					{isMobileMenuOpen && (
						<div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
							<div className="flex flex-col h-full">
								<div className="flex items-center justify-between p-4 border-b">
									<div className="flex items-center gap-2">
										<Graphite size={1.5} />
										<span className="text-sm font-semibold">STELS</span>
									</div>
									<button
										onClick={() => setIsMobileMenuOpen(false)}
										className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
									>
										<X className="size-5" />
									</button>
								</div>

								<div className="flex-1 overflow-y-auto p-4">
									<nav className="space-y-6">
										<div>
											<div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3">
												Stels
											</div>
											<div className="space-y-2">
												{generalNav.map((item) => renderNavItem(item, true))}
											</div>
										</div>

										<Separator />

										<div>
											<div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3">
												Apps
											</div>
											<div className="space-y-2">
												{systemNav.map((item) => renderNavItem(item, true))}
											</div>
										</div>
									</nav>
								</div>

								<div className="p-4 border-t">
									<Badge
										variant="outline"
										className="w-full justify-center text-amber-400 border-amber-500/30 bg-amber-500/5"
									>
										<span className="size-2 rounded-full bg-amber-400 animate-pulse mr-2" />
										<span className="font-medium">LIVE</span>
									</Badge>
								</div>
							</div>
						</div>
					)}

					{routeLoading && (
						<div className="w-full border-b">
							<Progress value={60} className="h-1" />
						</div>
					)}

					<main
						className="flex flex-1 overflow-y-auto overflow-x-hidden bg-background"
						data-route-container
					>
						<div className="w-full mx-auto px-4 py-6">
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
