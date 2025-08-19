import * as React from "react";
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
	Globe,
	Home,
	Layers,
	ScanSearch,
	// Wallet,
} from "lucide-react";
import Graphite from "@/components/ui/vectors/logos/Graphite.tsx";

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
	const { currentRoute, setRoute, allowedRoutes, routeLoading } = useAppStore();

	const generalNav: NavItem[] = [
		{ key: "welcome", label: "Sonar", icon: Home },
		{ key: "scanner", label: "Scanner", icon: ScanSearch },
		{ key: "markets", label: "Markets", icon: CandlestickChart },
		{ key: "fred", label: "Fred", icon: Layers },
	].filter((i) => allowedRoutes.includes(i.key));

	const systemNav: NavItem[] = [
		{ key: "network", label: "Network", icon: Globe },
		// { key: "wallet", label: "Wallet", icon: Wallet },
		{ key: "canvas", label: "Canvas", icon: Boxes },
	].filter((i) => allowedRoutes.includes(i.key));

	const renderNavItem = (item: NavItem): React.ReactElement => {
		const Icon = item.icon;
		const isActive = currentRoute === item.key;
		return (
			<div className="w-[100%] flex" key={item.key}>
				<TooltipProvider>
					<Tooltip delayDuration={200}>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => setRoute(item.key)}
								className={cn(
									"cursor-pointer flex flex-1 items-center p-4 m-2 justify-center text-sm transition-smooth outline-none",
									"hover:bg-amber-500/10 hover:text-amber-400",
									isActive
										? "text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/30"
										: "text-muted-foreground",
								)}
								aria-current={isActive ? "page" : undefined}
							>
								<Icon
									className={cn(
										"size-6 shrink-0",
										isActive ? "text-amber-400" : "",
									)}
								/>
								{/*<span className="truncate">{item.label}</span>*/}
							</button>
						</TooltipTrigger>
						<TooltipContent side="right">{item.label}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		);
	};

	return (
		<div className="h-dvh w-full bg-background text-foreground overflow-hidden">
			<div className="grid grid-cols-1 lg:grid-cols-[70px_1fr] gap-0 h-full overflow-hidden">
				<aside
					className="text-center hidden lg:flex lg:flex-col border-r bg-card/80 overflow-hidden"
					aria-label="Primary navigation"
				>
					<div className="px-4 py-12 shrink-0">
						<div className="flex items-center gap-2">
							<div
								onClick={() => setRoute("welcome")}
								className="flex items-center justify-center"
							>
								<Graphite size={3} />
							</div>
						</div>
					</div>

					<div className="flex-1 overflow-hidden">
						<nav className="space-y-6">
							<Separator className="my-2" />

							<div>
								<div className="px-2 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
									General
								</div>
								<div className="space-y-1">{generalNav.map(renderNavItem)}</div>
							</div>

							<Separator className="my-2" />

							<div>
								<div className="px-2 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
									System
								</div>
								<ul className="space-y-1">{systemNav.map(renderNavItem)}</ul>
							</div>
						</nav>
					</div>

					<div className="mt-auto p-3">
						<div className="flex items-center justify-between">
							<Badge
								variant="outline"
								className="text-amber-400 border-amber-500/30"
							>
								<span className="size-2 rounded-full bg-amber-400 animate-pulse" />
								LIVE
							</Badge>
						</div>
					</div>
				</aside>

				<div className="flex flex-col min-w-0 h-full overflow-hidden">
					<header className="py-4 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
						<div className="container-full">
							<div className="lg:hidden flex gap-2">
								<div
									onClick={() => setRoute("welcome")}
									className="size-9 flex items-center justify-center"
								>
									<Graphite size={2} />
								</div>
								<span className="text-sm font-medium">STELS</span>
							</div>
							<Separator
								orientation="vertical"
								className="hidden lg:block h-6"
							/>
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">
									MODULE:
								</span>
								<span className="text-xs text-amber-700 uppercase">
									{currentRoute}
								</span>
							</div>
						</div>

						{/* Mobile nav */}
						<div className="container-full lg:hidden">
							<div className="w-full overflow-x-auto">
								<ul
									className="flex items-center gap-1.5 min-w-max"
									role="navigation"
									aria-label="Mobile navigation"
								>
									{[...generalNav, ...systemNav].map((item) => {
										const Icon = item.icon;
										const isActive = currentRoute === item.key;
										return (
											<li key={`m-${item.key}`} className="shrink-0">
												<Button
													variant={isActive ? "outline" : "ghost"}
													size="sm"
													className={cn(
														"px-3 py-1.5",
														isActive
															? "text-amber-400 border-amber-500/30"
															: "text-muted-foreground",
													)}
													onClick={() => setRoute(item.key)}
													aria-current={isActive ? "page" : undefined}
												>
													<Icon className="size-4" />
													<span className="text-xs">{item.label}</span>
												</Button>
											</li>
										);
									})}
								</ul>
							</div>
						</div>
					</header>

					{routeLoading
						? (
							<div className="w-full border-b">
								<Progress value={60} />
							</div>
						)
						: null}

					<main
						className="bg-black container-full py-6 overflow-y-auto overflow-x-hidden min-h-0 flex-1 relative"
						data-route-container
					>
						{children}
						{routeLoading
							? (
								<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
									<div className="bg-background/60 backdrop-blur-sm rounded-md p-3 border">
										<span className="text-xs text-muted-foreground">
											Loading…
										</span>
									</div>
								</div>
							)
							: null}
					</main>

					<footer className="border-t shrink-0">
						<div className="container-full py-4 text-xs text-muted-foreground flex items-center justify-between gap-3">
							<span>© 2024 Gliesereum Ukraine. All rights reserved.</span>
							<a
								href="https://doc.stels.io"
								target="_blank"
								rel="noopener noreferrer"
								className="text-amber-400 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-sm"
							>
								Documentation
							</a>
						</div>
					</footer>
				</div>
			</div>
		</div>
	);
}

export default Layout;
