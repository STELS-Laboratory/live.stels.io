import { useAppStore } from "@/stores";
import { useMobile } from "@/hooks/useMobile.ts";
import {
	Activity,
	BarChart3,
	Code2,
	Globe2,
	Layers3,
	Play,
	Sparkles,
	TrendingUp,
	Wallet,
} from "lucide-react";
import React, { useState } from "react";

/**
 * Application metadata for the app store
 */
interface AppMetadata {
	id: string;
	route: string;
	name: string;
	tagline: string;
	description: string;
	icon: React.ReactNode;
	color: string;
	category:
		| "Analytics"
		| "Trading"
		| "Development"
		| "Network"
		| "Visualization";
	featured?: boolean;
	size?: "large" | "medium" | "small"; // For App Store grid layout
	badge?: string; // Marketing badge like "New", "Popular", "Editor's Choice"
	stats?: string; // Usage stats like "10K+ users"
}

/**
 * Available applications in the SONAR ecosystem
 */
const applications: AppMetadata[] = [
	{
		id: "scanner",
		route: "scanner",
		name: "Liquidity Scanner",
		tagline: "Real-time liquidity analysis",
		description:
			"Professional liquidity analysis system for monitoring trading positions, account balances, and market exposure across multiple exchanges in real-time.",
		icon: <TrendingUp className="w-8 h-8" />,
		color: "from-amber-500/20 to-orange-500/20",
		category: "Analytics",
		featured: true,
		size: "large",
		badge: "Editor's Choice",
		stats: "15K+ traders",
	},
	{
		id: "markets",
		route: "markets",
		name: "Market Data Viewer",
		tagline: "Live market intelligence",
		description:
			"Comprehensive market analysis tool providing real-time data streams, order books, price movements, and trading volumes from all connected exchanges.",
		icon: <BarChart3 className="w-8 h-8" />,
		color: "from-blue-500/20 to-cyan-500/20",
		category: "Trading",
		featured: true,
		size: "medium",
		badge: "Popular",
		stats: "12K+ active",
	},
	{
		id: "canvas",
		route: "canvas",
		name: "Canvas dashboard",
		tagline: "Visual data composition",
		description:
			"Advanced widget store and Canvas for building custom data visualizations. Drag and drop widgets to create your perfect trading dashboard.",
		icon: <Layers3 className="w-8 h-8" />,
		color: "from-purple-500/20 to-pink-500/20",
		category: "Visualization",
		featured: true,
		size: "medium",
		badge: "New",
		stats: "8K+ users",
	},
	{
		id: "network",
		route: "network",
		name: "Network",
		tagline: "Heterogeneous network analysis",
		description:
			"Explore and analyze the SONAR network infrastructure. Monitor nodes, track network health, and visualize global distribution of heterogen nodes.",
		icon: <Globe2 className="w-8 h-8" />,
		color: "from-green-500/20 to-emerald-500/20",
		category: "Network",
		size: "small",
		stats: "5K+ nodes",
	},
	{
		id: "editor",
		route: "editor",
		name: "AMI Editor",
		tagline: "Algorithmic strategy development",
		description:
			"Professional code editor for developing and managing trading algorithms. Create, test, and deploy automated trading strategies (AMI workers).",
		icon: <Code2 className="w-8 h-8" />,
		color: "from-indigo-500/20 to-violet-500/20",
		category: "Development",
		size: "small",
		badge: "Pro Tool",
		stats: "3K+ strategies",
	},
	{
		id: "wallet",
		route: "wallet",
		name: "Wallet",
		tagline: "Secure network wallet",
		description:
			"Native blockchain wallet for the Gliesereum network. Manage your assets, view transactions, and interact with the STELS ecosystem securely.",
		icon: <Wallet className="w-8 h-8" />,
		color: "from-amber-500/20 to-yellow-500/20",
		category: "Trading",
		size: "small",
		stats: "20K+ wallets",
	},
];

/**
 * Application card component
 */
interface AppCardProps {
	app: AppMetadata;
	onLaunch: (route: string) => void;
	isMobile: boolean;
}

function AppCard(
	{ app, onLaunch, isMobile }: AppCardProps,
): React.ReactElement {
	const [isLaunching, setIsLaunching] = useState(false);

	const handleClick = () => {
		setIsLaunching(true);
		// Immediate navigation
		onLaunch(app.route);
	};

	// Mobile card
	if (isMobile) {
		return (
			<button
				onClick={handleClick}
				disabled={isLaunching}
				className={`relative flex flex-col items-center gap-3 focus:outline-none active:scale-90 transition-all duration-200 ${
					isLaunching ? "opacity-60 scale-95" : "opacity-100 scale-100"
				}`}
			>
				{/* App icon */}
				<div className="relative w-[68px] h-[68px]">
					{/* Multi-layer outer glow effect */}
					<div
						className={`absolute -inset-2 bg-gradient-to-br ${app.color} opacity-0 active:opacity-70 transition-opacity duration-300 blur-xl`}
					/>
					<div
						className={`absolute -inset-1 bg-gradient-to-br ${app.color} opacity-0 active:opacity-40 transition-opacity duration-200 blur-md`}
					/>

					{/* Animated corner accents - top left */}
					<div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-muted/60 active:border-amber-500/80 transition-all duration-200" />
					{/* Corner accents - top right */}
					<div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-muted/60 active:border-amber-500/80 transition-all duration-200" />
					{/* Corner accents - bottom left */}
					<div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-muted/60 active:border-amber-500/80 transition-all duration-200" />
					{/* Corner accents - bottom right */}
					<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-muted/60 active:border-amber-500/80 transition-all duration-200" />

					{/* Secondary decorative lines */}
					<div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-border/40 active:border-amber-400/60 transition-all duration-200" />
					<div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-border/40 active:border-amber-400/60 transition-all duration-200" />
					<div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-border/40 active:border-amber-400/60 transition-all duration-200" />
					<div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-border/40 active:border-amber-400/60 transition-all duration-200" />

					{/* Icon container with gradient border */}
					<div className="relative w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 backdrop-blur-sm flex items-center justify-center border border-border/40 active:border-amber-500/70 transition-all duration-200 overflow-hidden">
						{/* Inner gradient highlight */}
						<div className="absolute inset-[1px] bg-gradient-to-br from-zinc-950/80 via-zinc-900/50 to-zinc-950/80" />

						{/* Animated scan line effect */}
						<div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-600/10 to-transparent opacity-50 active:opacity-100 transition-opacity duration-200" />

						{/* Horizontal tech line */}
						<div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />

						{/* Vertical tech line */}
						<div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-zinc-700/20 to-transparent" />

						{/* Active state glow */}
						<div
							className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 active:opacity-20 transition-opacity duration-200`}
						/>

						{/* Icon with enhanced effects */}
						<div className="relative z-10">
							{/* Icon glow ring */}
							<div
								className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 active:opacity-50 blur-md transition-opacity duration-200 scale-150`}
							/>

							<div className="relative text-muted-foreground active:text-amber-300 transition-all duration-200 active:scale-125">
								{app.icon}
							</div>
						</div>
					</div>

					{/* Enhanced badge indicator with pulse */}
					{app.badge && (
						<div className="absolute -top-1.5 -right-1.5 z-10">
							{/* Outer glow rings */}
							<div className="absolute inset-0 w-3 h-3 bg-amber-500/30 rounded-full blur-md animate-pulse" />
							<div className="absolute inset-0.5 w-2 h-2 bg-amber-500/50 rounded-full blur-sm animate-pulse" />
							{/* Main badge */}
							<div className="relative w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300 rounded-full animate-pulse" />
						</div>
					)}
				</div>

				{/* App name with enhanced styling */}
				<span className="text-[11px] font-bold text-muted-foreground active:text-card-foreground text-center max-w-[76px] line-clamp-2 leading-tight tracking-tight transition-colors duration-200">
					{app.name}
				</span>
			</button>
		);
	}

	// Get size-specific classes
	const sizeClasses = {
		large: "md:col-span-2 md:row-span-2 p-8",
		medium: "md:col-span-1 p-6",
		small: "md:col-span-1 p-5",
	}[app.size || "medium"];

	// Desktop card
	return (
		<button
			onClick={handleClick}
			disabled={isLaunching}
			className={`group relative overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] focus:outline-none cursor-pointer ${
				isLaunching ? "opacity-70 scale-95" : "opacity-100 scale-100"
			} ${sizeClasses}`}
		>
			{/* Background with gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />

			{/* Gradient overlay on hover */}
			<div
				className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-15 transition-opacity duration-500`}
			/>

			{/* Scan line effect */}
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-700/5 to-transparent opacity-50" />

			{/* Animated gradient border */}
			<div
				className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-zinc-700 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
				style={{ padding: "1px" }}
			>
				<div className="absolute inset-[1px] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
			</div>

			{/* Default border */}
			<div className="absolute inset-0 border border-border/50 group-hover:border-transparent transition-colors duration-300" />

			{/* Corner accents */}
			<div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-border/50 group-hover:border-amber-500/60 transition-colors duration-300 z-10" />
			<div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-border/50 group-hover:border-amber-500/60 transition-colors duration-300 z-10" />
			<div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-border/50 group-hover:border-amber-500/60 transition-colors duration-300 z-10" />
			<div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-border/50 group-hover:border-amber-500/60 transition-colors duration-300 z-10" />

			{/* Outer glow on hover */}
			<div
				className={`absolute -inset-[2px] bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-500 -z-10`}
			/>

			{/* Header badges */}
			<div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
				{/* Web3 badge */}
				<div className="relative px-3 py-1.5 bg-card/60 backdrop-blur-sm border border-border/40 group-hover:border-cyan-500/50 transition-all duration-300 overflow-hidden">
					{/* Badge glow */}
					<div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors duration-300" />
					<span className="relative text-[9px] font-bold text-muted-foreground group-hover:text-cyan-400 tracking-wider transition-colors duration-300">
						WEB3
					</span>
				</div>

				{/* Marketing badge */}
				{app.badge && (
					<div className="relative px-3 py-1.5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/30 group-hover:border-amber-500/60 transition-all duration-300 overflow-hidden">
						{/* Badge pulse effect */}
						<div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/20 transition-colors duration-300" />
						<span className="relative text-[9px] font-bold text-amber-400/80 group-hover:text-amber-300 tracking-wide transition-colors duration-300">
							{app.badge.toUpperCase()}
						</span>
					</div>
				)}
			</div>

			{/* Blur overlay with launch button on hover */}
			<div className="absolute inset-0 bg-background/0 backdrop-blur-none group-hover:bg-background/80 group-hover:backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 z-30 flex items-center justify-center">
				<div className="relative flex flex-col items-center gap-4">
					{/* Launch button */}
					<div className="relative px-6 py-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 overflow-hidden">
						{/* Button glow */}
						<div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/20 to-amber-500/10 blur-sm" />

						{/* Corner accents */}
						<div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-400/60" />
						<div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-400/60" />
						<div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-400/60" />
						<div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-400/60" />

						<div className="relative flex items-center gap-3">
							<Play className="w-5 h-5 text-amber-400" />
							<span className="text-sm font-bold text-amber-300 tracking-wide">
								Launch Application
							</span>
						</div>
					</div>

					{/* App name */}
					<p className="text-base font-bold text-card-foreground tracking-tight">
						{app.name}
					</p>
				</div>
			</div>

			{/* Icon */}
			<div
				className={`relative z-10 ${app.size === "large" ? "mb-8" : "mb-6"}`}
			>
				{/* Outer neon glow */}
				<div
					className={`absolute -inset-4 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-40 blur-2xl transition-all duration-500 ${
						app.size === "large" ? "scale-150" : ""
					}`}
				/>

				{/* Inner glow ring */}
				<div
					className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-50 blur-md transition-all duration-500 ${
						app.size === "large" ? "scale-150" : ""
					}`}
				/>

				{/* Icon container with geometric accent */}
				<div className="relative inline-block">
					{/* Rotating border accent */}
					<div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
						<div className="w-full h-full border border-amber-500/30 rotate-45" />
					</div>

					<div
						className={`relative text-muted-foreground transition-all duration-300 group-hover:text-card-foreground group-hover:scale-110 ${
							app.size === "large" ? "scale-150" : ""
						}`}
					>
						{app.icon}
					</div>
				</div>
			</div>

			{/* Content - varies by size */}
			<div
				className={`relative z-10 ${
					app.size === "large" ? "space-y-4" : "space-y-3"
				}`}
			>
				<div>
					<h3
						className={`font-bold text-amber-600/70 group-hover:text-foreground mb-2 tracking-tight transition-colors duration-300 ${
							app.size === "large" ? "text-3xl" : "text-2xl"
						}`}
					>
						{app.name}
					</h3>
					<p
						className={`text-muted-foreground group-hover:text-card-foreground font-semibold transition-colors duration-300 ${
							app.size === "large" ? "text-base" : "text-sm"
						}`}
					>
						{app.tagline}
					</p>
				</div>
				<p
					className={`text-muted-foreground group-hover:text-muted-foreground leading-relaxed transition-colors duration-300 ${
						app.size === "large"
							? "text-base line-clamp-4"
							: "text-sm line-clamp-3"
					}`}
				>
					{app.description}
				</p>

				{/* Stats for large cards */}
				{app.size === "large" && app.stats && (
					<div className="flex items-center gap-2 pt-2">
						<div className="relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 backdrop-blur-sm border border-border/50 group-hover:border-amber-500/40 transition-all duration-300 overflow-hidden">
							{/* Glow effect */}
							<div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors duration-300" />
							<TrendingUp className="relative w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-400 transition-colors duration-300" />
							<span className="relative text-xs font-bold text-muted-foreground group-hover:text-card-foreground transition-colors duration-300">
								{app.stats}
							</span>
						</div>
						<div className="relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 backdrop-blur-sm border border-border/50 group-hover:border-green-500/40 transition-all duration-300 overflow-hidden">
							{/* Glow effect */}
							<div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/10 transition-colors duration-300" />
							{/* Pulse indicator */}
							<div className="relative w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
							<Activity className="relative w-3.5 h-3.5 text-muted-foreground group-hover:text-green-400 transition-colors duration-300" />
							<span className="relative text-xs font-bold text-muted-foreground group-hover:text-card-foreground transition-colors duration-300">
								Real-time
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Footer with category and launch CTA */}
			<div
				className={`relative flex items-center justify-between gap-2 z-10 ${
					app.size === "large" ? "mt-8" : "mt-6"
				}`}
			>
				{/* Category and stats */}
				<div className="flex items-center gap-2">
					<div className="relative inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 backdrop-blur-sm border border-border/50 group-hover:border-border transition-all duration-300 overflow-hidden">
						{/* Subtle glow */}
						<div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-300" />
						<Activity className="relative w-3 h-3 text-muted-foreground group-hover:text-muted-foreground transition-colors duration-300" />
						<span className="relative text-xs font-bold text-muted-foreground group-hover:text-card-foreground transition-colors duration-300">
							{app.category}
						</span>
					</div>
					{app.stats && app.size !== "large" && (
						<div className="relative inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 backdrop-blur-sm border border-border/50 group-hover:border-border transition-all duration-300 overflow-hidden">
							{/* Subtle glow */}
							<div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-300" />
							<span className="relative text-xs font-bold text-muted-foreground group-hover:text-card-foreground transition-colors duration-300">
								{app.stats}
							</span>
						</div>
					)}
				</div>

				{/* Launch CTA */}
				<div className="relative inline-flex items-center gap-2 px-4 py-2 overflow-hidden">
					{/* Animated gradient background */}
					<div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 group-hover:from-amber-500/20 group-hover:via-orange-500/20 group-hover:to-amber-500/20 transition-all duration-300" />

					{/* Glow effect */}
					<div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 blur-sm transition-colors duration-300" />

					{/* Border */}
					<div className="absolute inset-0 border border-amber-500/30 group-hover:border-amber-500/60 transition-colors duration-300" />

					{/* Corner accents */}
					<div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-400/50" />
					<div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-400/50" />

					<Play className="relative w-3.5 h-3.5 text-amber-400/70 group-hover:text-amber-300 transition-colors duration-300" />
					<span className="relative text-xs font-bold text-amber-400/90 group-hover:text-amber-300 tracking-wide transition-colors duration-300">
						Launch
					</span>
				</div>
			</div>
		</button>
	);
}

/**
 * Welcome screen - App Store style launcher
 */
function Welcome(): React.ReactElement {
	const { setRoute } = useAppStore();
	const [isExiting, setIsExiting] = useState(false);
	const isMobile = useMobile();

	const handleLaunchApp = (route: string): void => {
		console.log(`[Welcome] Launching app: ${route}`);
		setIsExiting(true);
		// Quick transition
		setTimeout(() => {
			setRoute(route);
		}, 150);
	};

	const featuredApps = applications.filter((app) => app.featured);
	const otherApps = applications.filter((app) => !app.featured);

	return (
		<div
			className={`relative h-full w-full overflow-y-auto  transition-all duration-200 ${
				isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
			}`}
		>
			{/* Loading overlay when launching app */}
			{isExiting && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/98 backdrop-blur-md animate-in fade-in duration-200">
					<div className="flex flex-col items-center gap-8">
						{/* Spinner with futuristic design */}
						<div className="relative w-20 h-20">
							{/* Outer glow ring */}
							<div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-30 blur-2xl rounded-full animate-pulse" />

							{/* Double ring spinner */}
							<div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-border border-t-amber-500 border-r-amber-500 animate-spin" />
							<div
								className="absolute inset-2 w-16 h-16 rounded-full border-2 border-border border-b-orange-500 border-l-orange-500 animate-spin"
								style={{
									animationDirection: "reverse",
									animationDuration: "1s",
								}}
							/>

							{/* Center dot with pulse */}
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
								<div className="absolute w-2 h-2 bg-amber-500 rounded-full blur-sm opacity-50" />
							</div>

							{/* Corner accents */}
							<div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber-500/50" />
							<div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-amber-500/50" />
							<div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-amber-500/50" />
							<div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-amber-500/50" />
						</div>

						{/* Loading text */}
						<div className="text-center space-y-3">
							<p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 tracking-tight animate-pulse">
								Loading Application
							</p>
							<div className="flex items-center gap-2 justify-center">
								<div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-pulse" />
								<p className="text-sm text-muted-foreground font-semibold tracking-wide">
									Please wait
								</p>
								<div
									className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-pulse"
									style={{ animationDelay: "0.2s" }}
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Container with relative positioning */}
			<div
				className={isMobile
					? "pb-8 relative"
					: "container mx-auto px-6 py-12 max-w-7xl relative"}
			>
				{/* Large Title Header - Mobile only */}
				{isMobile && (
					<div className="px-4 pt-6 pb-6 border-b border-border/50 bg-gradient-to-b from-zinc-900/20 to-transparent">
						<h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-300 mb-2 tracking-tight">
							Web3 Applications
						</h1>
						<p className="text-sm text-muted-foreground font-medium">
							{applications.length} professional tools for traders
						</p>
					</div>
				)}

				{/* Featured Apps */}
				{featuredApps.length > 0 && (
					<div className={isMobile ? "mb-10" : "mb-16"}>
						{/* Section header - Mobile */}
						{isMobile
							? (
								<div className="px-4 mb-5 pt-6">
									<div className="flex items-center justify-between mb-2">
										<h2 className="text-xl font-bold text-card-foreground tracking-tight">
											Featured
										</h2>
										<div className="px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
											<span className="text-xs font-bold text-amber-400/80">
												{featuredApps.length}
											</span>
										</div>
									</div>
									<p className="text-xs text-muted-foreground font-medium">
										Most popular applications
									</p>
								</div>
							)
							: (
								<div className="mb-10 pb-6 border-b border-zinc-900/50 relative">
									{/* Gradient underline */}
									<div className="absolute bottom-0 left-0 h-[1px] w-24 bg-gradient-to-r from-amber-500/50 to-transparent" />

									<div className="flex items-center justify-between">
										<div>
											<h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 mb-2 tracking-tight">
												Featured Apps
											</h2>
											<p className="text-sm text-muted-foreground font-medium">
												Most popular applications with active users
											</p>
										</div>

										{/* Badge */}
										<div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
											<span className="text-sm font-bold text-amber-400/90">
												{featuredApps.length} Featured
											</span>
										</div>
									</div>
								</div>
							)}

						{/* App Store style grid with different sizes */}
						<div
							className={isMobile
								? "grid grid-cols-4 gap-4 px-4"
								: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:auto-rows-fr"}
						>
							{featuredApps.map((app) => (
								<AppCard
									key={app.id}
									app={app}
									onLaunch={handleLaunchApp}
									isMobile={isMobile}
								/>
							))}
						</div>
					</div>
				)}

				{/* Other Apps */}
				{otherApps.length > 0 && (
					<div className={isMobile ? "mb-8" : ""}>
						{/* Section header - Mobile */}
						{isMobile
							? (
								<div className="px-4 mb-5 pt-6 border-t border-zinc-900/50">
									<h2 className="text-xl font-bold text-card-foreground mb-2 tracking-tight">
										More Apps
									</h2>
									<p className="text-xs text-muted-foreground font-medium">
										Explore additional tools
									</p>
								</div>
							)
							: (
								<div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-900/50 relative">
									{/* Gradient underline */}
									<div className="absolute bottom-0 left-0 h-[1px] w-24 bg-gradient-to-r from-zinc-600/50 to-transparent" />

									<div>
										<h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 mb-2 tracking-tight">
											More Applications
										</h2>
										<p className="text-sm text-muted-foreground font-medium">
											Explore additional professional tools
										</p>
									</div>

									{/* Stats badge */}
									<div className="px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50">
										<span className="text-sm font-bold text-muted-foreground">
											{applications.length} Apps Total
										</span>
									</div>
								</div>
							)}

						<div
							className={isMobile
								? "grid grid-cols-4 gap-4 px-4"
								: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}
						>
							{otherApps.map((app) => (
								<AppCard
									key={app.id}
									app={app}
									onLaunch={handleLaunchApp}
									isMobile={isMobile}
								/>
							))}
						</div>
					</div>
				)}

				{/* Footer info */}
				{isMobile
					? (
						<div className="mt-12 px-4 pb-8 pt-6 border-t border-zinc-900/50">
							{/* Feature highlights */}
							<div className="space-y-3 mb-6">
								<div className="relative flex items-center gap-3 px-3 py-3.5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 backdrop-blur-sm border border-zinc-900/50 active:border-amber-500/50 active:scale-[0.98] transition-all duration-200 overflow-hidden">
									{/* Background glow on active */}
									<div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/0 active:from-amber-500/5 active:via-amber-500/10 active:to-amber-500/5 transition-all duration-200" />

									{/* Corner accents */}
									<div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-border/50 active:border-amber-500/70 transition-colors duration-200" />
									<div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-border/50 active:border-amber-500/70 transition-colors duration-200" />

									{/* Tech lines */}
									<div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />
									<div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />

									<div className="relative w-9 h-9 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center border-2 border-amber-500/40 active:border-amber-500/70 transition-all duration-200 overflow-hidden">
										{/* Inner gradient */}
										<div className="absolute inset-[2px] bg-gradient-to-br from-zinc-950/80 via-zinc-900/50 to-zinc-950/80" />
										{/* Icon glow */}
										<div className="absolute inset-0 bg-amber-500/0 active:bg-amber-500/20 blur-sm transition-all duration-200" />
										{/* Scan lines */}
										<div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
										<Sparkles className="relative w-4.5 h-4.5 text-amber-400/80 active:text-amber-300 active:scale-110 transition-all duration-200" />
									</div>
									<div className="relative flex-1">
										<p className="text-xs font-bold text-card-foreground active:text-card-foreground mb-1 transition-colors duration-200">
											Web3 Technology
										</p>
										<p className="text-[10px] text-muted-foreground active:text-muted-foreground font-semibold transition-colors duration-200">
											Secure, decentralized
										</p>
									</div>
								</div>

								<div className="relative flex items-center gap-3 px-3 py-3.5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 backdrop-blur-sm border border-zinc-900/50 active:border-green-500/50 active:scale-[0.98] transition-all duration-200 overflow-hidden">
									{/* Background glow on active */}
									<div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/0 to-green-500/0 active:from-green-500/5 active:via-green-500/10 active:to-green-500/5 transition-all duration-200" />

									{/* Corner accents */}
									<div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-border/50 active:border-green-500/70 transition-colors duration-200" />
									<div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-border/50 active:border-green-500/70 transition-colors duration-200" />

									{/* Tech lines */}
									<div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />
									<div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />

									<div className="relative w-9 h-9 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center border-2 border-green-500/40 active:border-green-500/70 transition-all duration-200 overflow-hidden">
										{/* Inner gradient */}
										<div className="absolute inset-[2px] bg-gradient-to-br from-zinc-950/80 via-zinc-900/50 to-zinc-950/80" />
										{/* Icon glow */}
										<div className="absolute inset-0 bg-green-500/0 active:bg-green-500/20 blur-sm transition-all duration-200" />
										{/* Scan lines */}
										<div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent" />
										{/* Pulse indicator */}
										<div className="absolute top-1 right-1 w-1 h-1 bg-green-500 rounded-full animate-pulse" />
										<Activity className="relative w-4.5 h-4.5 text-green-400/80 active:text-green-300 active:scale-110 transition-all duration-200" />
									</div>
									<div className="relative flex-1">
										<p className="text-xs font-bold text-card-foreground active:text-card-foreground mb-1 transition-colors duration-200">
											Real-time Analytics
										</p>
										<p className="text-[10px] text-muted-foreground active:text-muted-foreground font-semibold transition-colors duration-200">
											Live market data
										</p>
									</div>
								</div>

								<div className="relative flex items-center gap-3 px-3 py-3.5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 backdrop-blur-sm border border-zinc-900/50 active:border-blue-500/50 active:scale-[0.98] transition-all duration-200 overflow-hidden">
									{/* Background glow on active */}
									<div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 active:from-blue-500/5 active:via-blue-500/10 active:to-blue-500/5 transition-all duration-200" />

									{/* Corner accents */}
									<div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-border/50 active:border-blue-500/70 transition-colors duration-200" />
									<div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-border/50 active:border-blue-500/70 transition-colors duration-200" />

									{/* Tech lines */}
									<div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />
									<div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />

									<div className="relative w-9 h-9 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center border-2 border-blue-500/40 active:border-blue-500/70 transition-all duration-200 overflow-hidden">
										{/* Inner gradient */}
										<div className="absolute inset-[2px] bg-gradient-to-br from-zinc-950/80 via-zinc-900/50 to-zinc-950/80" />
										{/* Icon glow */}
										<div className="absolute inset-0 bg-blue-500/0 active:bg-blue-500/20 blur-sm transition-all duration-200" />
										{/* Scan lines */}
										<div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent" />
										<TrendingUp className="relative w-4.5 h-4.5 text-blue-400/80 active:text-blue-300 active:scale-110 transition-all duration-200" />
									</div>
									<div className="relative flex-1">
										<p className="text-xs font-bold text-card-foreground active:text-card-foreground mb-1 transition-colors duration-200">
											Professional Tools
										</p>
										<p className="text-[10px] text-muted-foreground active:text-muted-foreground font-semibold transition-colors duration-200">
											Advanced features
										</p>
									</div>
								</div>
							</div>

							{/* Footer text */}
							<div className="text-center pt-4 border-t border-zinc-900/50">
								<p className="text-xs text-muted-foreground font-bold tracking-wider">
									STELS WEB3 OS v0.12.8
								</p>
							</div>
						</div>
					)
					: (
						<div className="mt-16 pt-8 border-t border-zinc-900/50 relative from-transparent to-zinc-900/10">
							{/* Gradient underline */}
							<div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-32 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

							{/* Feature highlights - Desktop */}
							<div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
								<div className="group relative flex flex-col items-center text-center p-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 backdrop-blur-sm border border-zinc-900/50 hover:border-amber-500/30 transition-all duration-300 hover:scale-105 overflow-hidden">
									{/* Corner accents */}
									<div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-border/50 group-hover:border-amber-500/50 transition-colors duration-300" />
									<div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-border/50 group-hover:border-amber-500/50 transition-colors duration-300" />
									<div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-border/50 group-hover:border-amber-500/50 transition-colors duration-300" />
									<div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-border/50 group-hover:border-amber-500/50 transition-colors duration-300" />

									{/* Outer glow */}
									<div className="absolute -inset-[2px] bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />

									<div className="relative mb-6">
										{/* Icon glow rings */}
										<div className="absolute -inset-6 bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500" />
										<div className="absolute -inset-2 bg-amber-500/0 group-hover:bg-amber-500/20 blur-md transition-colors duration-500" />

										<div className="relative w-16 h-16 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center border border-border/50 group-hover:border-amber-500/50 transition-all duration-300">
											{/* Scan line */}
											<div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-700/5 to-transparent" />
											<Sparkles className="relative w-8 h-8 text-muted-foreground group-hover:text-amber-400 transition-all duration-300 group-hover:scale-110" />
										</div>
									</div>
									<p className="relative text-lg font-bold text-card-foreground group-hover:text-foreground mb-2 tracking-tight transition-colors duration-300">
										Web3 Technology
									</p>
									<p className="relative text-sm text-muted-foreground group-hover:text-muted-foreground font-medium transition-colors duration-300">
										Secure, decentralized AI infrastructure
									</p>
								</div>

								<div className="group relative flex flex-col items-center text-center p-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 backdrop-blur-sm border border-zinc-900/50 hover:border-green-500/30 transition-all duration-300 hover:scale-105 overflow-hidden">
									{/* Corner accents */}
									<div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-border/50 group-hover:border-green-500/50 transition-colors duration-300" />
									<div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-border/50 group-hover:border-green-500/50 transition-colors duration-300" />
									<div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-border/50 group-hover:border-green-500/50 transition-colors duration-300" />
									<div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-border/50 group-hover:border-green-500/50 transition-colors duration-300" />

									{/* Outer glow */}
									<div className="absolute -inset-[2px] bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />

									<div className="relative mb-6">
										{/* Icon glow rings */}
										<div className="absolute -inset-6 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500" />
										<div className="absolute -inset-2 bg-green-500/0 group-hover:bg-green-500/20 blur-md transition-colors duration-500" />

										<div className="relative w-16 h-16 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center border border-border/50 group-hover:border-green-500/50 transition-all duration-300">
											{/* Scan line */}
											<div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-700/5 to-transparent" />
											<Activity className="relative w-8 h-8 text-muted-foreground group-hover:text-green-400 transition-all duration-300 group-hover:scale-110" />
										</div>
									</div>
									<p className="relative text-lg font-bold text-card-foreground group-hover:text-foreground mb-2 tracking-tight transition-colors duration-300">
										Real-time Analytics
									</p>
									<p className="relative text-sm text-muted-foreground group-hover:text-muted-foreground font-medium transition-colors duration-300">
										Live market data and professional indicators
									</p>
								</div>

								<div className="group relative flex flex-col items-center text-center p-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 backdrop-blur-sm border border-zinc-900/50 hover:border-blue-500/30 transition-all duration-300 hover:scale-105 overflow-hidden">
									{/* Corner accents */}
									<div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-border/50 group-hover:border-blue-500/50 transition-colors duration-300" />
									<div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-border/50 group-hover:border-blue-500/50 transition-colors duration-300" />
									<div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-border/50 group-hover:border-blue-500/50 transition-colors duration-300" />
									<div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-border/50 group-hover:border-blue-500/50 transition-colors duration-300" />

									{/* Outer glow */}
									<div className="absolute -inset-[2px] bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />

									<div className="relative mb-6">
										{/* Icon glow rings */}
										<div className="absolute -inset-6 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500" />
										<div className="absolute -inset-2 bg-blue-500/0 group-hover:bg-blue-500/20 blur-md transition-colors duration-500" />

										<div className="relative w-16 h-16 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center border border-border/50 group-hover:border-blue-500/50 transition-all duration-300">
											{/* Scan line */}
											<div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-700/5 to-transparent" />
											<TrendingUp className="relative w-8 h-8 text-muted-foreground group-hover:text-blue-400 transition-all duration-300 group-hover:scale-110" />
										</div>
									</div>
									<p className="relative text-lg font-bold text-card-foreground group-hover:text-foreground mb-2 tracking-tight transition-colors duration-300">
										Professional Tools
									</p>
									<p className="relative text-sm text-muted-foreground group-hover:text-muted-foreground font-medium transition-colors duration-300">
										Advanced trading features for professionals
									</p>
								</div>
							</div>

							{/* Footer text - Desktop */}
							<div className="text-center pt-4 border-t border-zinc-900/50">
								<p className="text-xs text-muted-foreground font-bold tracking-wider">
									STELS WEB3 OS v0.12.8
								</p>
							</div>
						</div>
					)}
			</div>
		</div>
	);
}

export default Welcome;
