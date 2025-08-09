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
import {
	Activity,
	Bot,
	Boxes,
	CandlestickChart,
	Globe,
	Home,
	ScanSearch,
	Wallet,
} from "lucide-react";

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
	const { currentRoute, setRoute, allowedRoutes } = useAppStore();

	const generalNav: NavItem[] = [
		{ key: "welcome", label: "Sonar", icon: Home },
		{ key: "scanner", label: "Scanner", icon: ScanSearch },
		{ key: "markets", label: "Markets", icon: CandlestickChart },
	].filter((i) => allowedRoutes.includes(i.key));

	const systemNav: NavItem[] = [
		{ key: "network", label: "Network", icon: Globe },
		{ key: "wallet", label: "Wallet", icon: Wallet },
		{ key: "canvas", label: "Canvas", icon: Boxes },
	].filter((i) => allowedRoutes.includes(i.key));

	const renderNavItem = (item: NavItem): React.ReactElement => {
		const Icon = item.icon;
		const isActive = currentRoute === item.key;
		return (
			<li key={item.key}>
				<TooltipProvider>
					<Tooltip delayDuration={200}>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => setRoute(item.key)}
								className={cn(
									"group w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-smooth outline-none",
									"hover:bg-amber-500/10 hover:text-amber-400",
									isActive
										? "text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/30"
										: "text-muted-foreground",
								)}
								aria-current={isActive ? "page" : undefined}
							>
								<Icon
									className={cn(
										"size-4 shrink-0",
										isActive ? "text-amber-400" : "",
									)}
								/>
								<span className="truncate">{item.label}</span>
							</button>
						</TooltipTrigger>
						<TooltipContent side="right">{item.label}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</li>
		);
	};

	return (
		<div className="h-dvh w-full bg-background text-foreground overflow-hidden">
			<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 h-full overflow-hidden">
				<aside
					className="hidden lg:flex lg:flex-col border-r bg-card/40 backdrop-blur-sm overflow-hidden"
					aria-label="Primary navigation"
				>
					<div className="px-4 py-4 border-b shrink-0">
						<div className="flex items-center gap-3">
							<div className="size-9 rounded-md bg-gradient-to-br from-amber-500 to-amber-700/80 flex items-center justify-center">
								<Bot className="size-5 text-background" />
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-medium">STELS</span>
								<span className="text-xs text-muted-foreground">
									Artificial Intelligence
								</span>
							</div>
						</div>
					</div>

					<div className="flex-1 p-4 overflow-hidden">
						<nav className="space-y-6">
							<div>
								<div className="px-2 pb-2 text-xs uppercase tracking-wide text-muted-foreground">
									General
								</div>
								<ul className="space-y-1">{generalNav.map(renderNavItem)}</ul>
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

					<div className="mt-auto px-4 py-3 border-t">
						<div className="flex items-center justify-between">
							<Badge
								variant="outline"
								className="gap-2 px-2 py-1 text-amber-400 border-amber-500/30"
							>
								<span className="size-2 rounded-full bg-amber-400 animate-pulse" />
								LIVE
							</Badge>
							<Button variant="outline" size="sm" className="text-xs">
								<Activity className="size-4" />
								Status
							</Button>
						</div>
					</div>
				</aside>

				<div className="flex flex-col min-w-0 h-full overflow-hidden">
					<header className="z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
						<div className="container-full py-3 flex items-center gap-3">
							<div className="lg:hidden flex items-center gap-2">
								<div className="size-8 rounded-md bg-gradient-to-br from-amber-500 to-amber-700/80 flex items-center justify-center">
									<Bot className="size-4 text-background" />
								</div>
								<span className="text-sm font-medium">STELS</span>
							</div>
							<Separator
								orientation="vertical"
								className="hidden lg:block h-6"
							/>
							<div className="flex items-center gap-3">
								<span className="text-sm text-muted-foreground">
									STELS – Artificial Intelligence Dashboard
								</span>
								<span className="text-xs text-amber-400">{currentRoute}</span>
							</div>
						</div>

						{/* Mobile nav */}
						<div className="container-full pb-3 lg:hidden">
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

					<main
						className="bg-zinc-950 container-full py-6 overflow-y-auto overflow-x-hidden min-h-0 flex-1"
						data-route-container
					>
						{children}
					</main>

					<footer className="border-t shrink-0">
						<div className="container-full py-4 text-xs text-muted-foreground">
							© 2024 STELS / SONAR. All rights reserved.
						</div>
					</footer>
				</div>
			</div>
		</div>
	);
}

export default Layout;
