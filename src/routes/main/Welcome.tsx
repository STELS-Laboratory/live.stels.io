import { useAppStore } from "@/stores";
import { useMobile } from "@/hooks/useMobile";
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
			"Advanced widget store and canvas for building custom data visualizations. Drag and drop widgets to create your perfect trading dashboard.",
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
			"Explore and analyze the STELS network infrastructure. Monitor nodes, track network health, and visualize global distribution of heterogen nodes.",
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
		// Quick navigation with loading indication
		setTimeout(() => {
			onLaunch(app.route);
		}, 200);
	};

	// iOS-style mobile card
	if (isMobile) {
		return (
			<button
				onClick={handleClick}
				disabled={isLaunching}
				className={`relative flex flex-col items-center gap-2 focus:outline-none active:scale-90 transition-all duration-100 ${
					isLaunching ? "opacity-60" : "opacity-100"
				}`}
			>
				{/* iOS 18 style app icon - Lighter than background */}
				<div
					className="relative w-[68px] h-[68px] rounded-[16px] overflow-hidden bg-zinc-900 flex items-center justify-center shadow-md border border-zinc-800"
					style={{
						boxShadow:
							"0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
					}}
				>
					{/* Launch overlay */}
					{isLaunching && (
						<div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-[16px]">
							<div className="w-8 h-8 rounded-full border-3 border-white border-t-transparent animate-spin" />
						</div>
					)}

					{/* Icon - lighter than background */}
					<div className="relative z-10 text-amber-500 scale-110">
						{app.icon}
					</div>
				</div>

				{/* App name - iOS style */}
				<span className="text-[11px] font-medium text-white text-center max-w-[76px] line-clamp-2 leading-tight">
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
			className={`group relative overflow-hidden rounded-3xl text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.96] focus:outline-none ${
				isLaunching ? "opacity-80 scale-[0.98]" : "opacity-100"
			} ${sizeClasses}`}
		>
			{/* Background - lighter than bg */}
			<div className="absolute inset-0 bg-zinc-900" />

			{/* Border */}
			<div className="absolute inset-0 rounded-3xl border border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-200" />
			{/* Launch animation overlay */}
			{isLaunching && (
				<div className="absolute inset-0 bg-gradient-to-br from-amber-500/40 to-orange-500/40 z-50 flex items-center justify-center rounded-3xl backdrop-blur-sm">
					<div className="flex flex-col items-center gap-2">
						<div className="w-16 h-16 rounded-full border-4 border-white border-t-transparent animate-spin" />
						<span className="text-xs font-semibold text-white">Loading...</span>
					</div>
				</div>
			)}

			{/* Header badges */}
			<div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
				{/* Web3 badge */}
				<div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/50">
					<span className="text-[9px] font-bold text-amber-400 tracking-widest">
						WEB3
					</span>
				</div>

				{/* Marketing badge */}
				{app.badge && (
					<div className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/50">
						<span className="text-[9px] font-bold text-blue-400 tracking-wide">
							{app.badge.toUpperCase()}
						</span>
					</div>
				)}
			</div>

			{/* Icon - size varies by card size */}
			<div
				className={`relative z-10 ${app.size === "large" ? "mb-8" : "mb-6"}`}
			>
				<div
					className={`text-amber-500 relative z-10 transition-transform duration-200 group-hover:scale-110 ${
						app.size === "large" ? "scale-150" : ""
					}`}
				>
					{app.icon}
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
						className={`font-bold text-white mb-2 tracking-tight ${
							app.size === "large" ? "text-3xl" : "text-2xl"
						}`}
					>
						{app.name}
					</h3>
					<p
						className={`text-amber-400 font-semibold ${
							app.size === "large" ? "text-base" : "text-sm"
						}`}
					>
						{app.tagline}
					</p>
				</div>
				<p
					className={`text-zinc-400 leading-relaxed ${
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
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
							<TrendingUp className="w-3.5 h-3.5 text-green-400" />
							<span className="text-xs font-semibold text-zinc-300">
								{app.stats}
							</span>
						</div>
						<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
							<Activity className="w-3.5 h-3.5 text-blue-400" />
							<span className="text-xs font-semibold text-zinc-300">
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
					<div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm">
						<Activity className="w-3 h-3 text-zinc-500" />
						<span className="text-xs font-medium text-zinc-400">
							{app.category}
						</span>
					</div>
					{app.stats && app.size !== "large" && (
						<div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm">
							<span className="text-xs font-medium text-zinc-400">
								{app.stats}
							</span>
						</div>
					)}
				</div>

				{/* Launch CTA */}
				<div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 group-hover:border-amber-500/60 transition-colors duration-200">
					<Play className="w-3 h-3 text-amber-400 group-hover:text-amber-300 transition-colors" />
					<span className="text-xs font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
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
		}, 300);
	};

	const featuredApps = applications.filter((app) => app.featured);
	const otherApps = applications.filter((app) => !app.featured);

	return (
		<div
			className={`relative h-full w-full overflow-y-auto bg-zinc-950 transition-opacity duration-200 ${
				isExiting ? "opacity-0" : "opacity-100"
			}`}
		>
			{/* Loading overlay when launching app */}
			{isExiting && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl">
					<div className="flex flex-col items-center gap-4">
						{/* Spinner */}
						<div className="relative">
							<div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-amber-500 animate-spin" />
							<div
								className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-amber-500/30 animate-spin"
								style={{
									animationDirection: "reverse",
									animationDuration: "1s",
								}}
							/>
						</div>
						{/* Loading text */}
						<div className="text-center">
							<p className="text-lg font-semibold text-white mb-1">
								Launching App
							</p>
							<p className="text-sm text-zinc-500">Please wait...</p>
						</div>
					</div>
				</div>
			)}

			{/* iOS-style container */}
			<div
				className={isMobile ? "pb-8" : "container mx-auto px-6 py-12 max-w-7xl"}
			>
				{/* iOS-style Large Title Header - Mobile only */}
				{isMobile && (
					<div className="px-4 pt-4 pb-6">
						{/* Marketing banner */}

						<h1 className="text-4xl font-bold text-zinc-300 tracking-tight mb-2">
							Web3 Applications
						</h1>
						<p className="text-base text-zinc-400">
							{applications.length} professional tools for traders
						</p>
					</div>
				)}

				{/* Featured Apps */}
				{featuredApps.length > 0 && (
					<div className={isMobile ? "mb-10" : "mb-16"}>
						{/* iOS-style section header - Mobile */}
						{isMobile
							? (
								<div className="px-4 mb-4">
									<div className="flex items-center justify-between mb-3">
										<h2 className="text-2xl font-bold text-white tracking-tight">
											Featured
										</h2>
										<div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40">
											<Sparkles className="w-3 h-3 text-blue-400" />
											<span className="text-xs font-bold text-blue-400">
												{featuredApps.length}
											</span>
										</div>
									</div>
									<p className="text-sm text-zinc-500">
										Most popular apps with 30K+ active users
									</p>
								</div>
							)
							: (
								<div className="mb-8">
									<div className="flex items-center justify-between mb-6">
										<div className="flex items-center gap-3">
											<div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
												<Sparkles className="w-6 h-6 text-amber-500" />
											</div>
											<div>
												<h2 className="text-3xl font-black text-zinc-300 tracking-tight">
													Featured Apps
												</h2>
												<p className="text-sm text-zinc-500 mt-1">
													Most popular apps with 30K+ active users
												</p>
											</div>
										</div>

										{/* Marketing badge */}
										<div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20">
											<Sparkles className="w-4 h-4 text-blue-400" />
											<span className="text-sm font-semibold text-blue-400">
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
						{/* iOS-style section header - Mobile */}
						{isMobile
							? (
								<div className="px-4 mb-4">
									<h2 className="text-2xl font-bold text-zinc-300 tracking-tight mb-2">
										More Apps
									</h2>
									<p className="text-sm text-zinc-500">
										Explore additional tools and features
									</p>
								</div>
							)
							: (
								<div className="flex items-center justify-between mb-8">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 rounded-2xl bg-zinc-500/10 border border-zinc-500/30 flex items-center justify-center">
											<Activity className="w-6 h-6 text-zinc-400" />
										</div>
										<div>
											<h2 className="text-3xl font-black text-white tracking-tight">
												More Applications
											</h2>
											<p className="text-sm text-zinc-500 mt-1">
												Explore additional professional tools
											</p>
										</div>
									</div>

									{/* Stats badge */}
									<div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-500/10 border border-zinc-500/20">
										<span className="text-sm font-semibold text-zinc-400">
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
						<div className="mt-12 px-4 pb-8">
							{/* iOS-style feature highlights */}
							<div className="space-y-3 mb-8">
								<div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
									<div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
										<Sparkles className="w-5 h-5 text-amber-500" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-white">
											Web3 Technology
										</p>
										<p className="text-xs text-zinc-500">
											Secure, decentralized AI
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
									<div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
										<Activity className="w-5 h-5 text-green-500" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-white">
											Real-time Analytics
										</p>
										<p className="text-xs text-zinc-500">
											Live market data & indicators
										</p>
									</div>
								</div>

								<div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
									<div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
										<TrendingUp className="w-5 h-5 text-blue-500" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-white">
											Professional Tools
										</p>
										<p className="text-xs text-zinc-500">
											Advanced trading features
										</p>
									</div>
								</div>
							</div>

							{/* iOS-style footer text */}
							<div className="text-center space-y-3 pt-4 border-t border-zinc-800/50">
								<p className="text-xs text-zinc-600 font-medium">
									STELS Web3 OS v0.12.8
								</p>
							</div>
						</div>
					)
					: (
						<div className="mt-20 pt-10 border-t border-zinc-800/30">
							{/* Marketing stats - Desktop */}

							{/* Feature highlights - Desktop */}
							<div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
								<div className="flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
									<div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
										<Sparkles className="w-7 h-7 text-amber-500" />
									</div>
									<p className="text-base font-bold text-white mb-2">
										Web3 Technology
									</p>
									<p className="text-xs text-zinc-500">
										Secure, decentralized AI infrastructure
									</p>
								</div>

								<div className="flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
									<div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
										<Activity className="w-7 h-7 text-green-500" />
									</div>
									<p className="text-base font-bold text-white mb-2">
										Real-time Analytics
									</p>
									<p className="text-xs text-zinc-500">
										Live market data and professional indicators
									</p>
								</div>

								<div className="flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
									<div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
										<TrendingUp className="w-7 h-7 text-blue-500" />
									</div>
									<p className="text-base font-bold text-white mb-2">
										Professional Tools
									</p>
									<p className="text-xs text-zinc-500">
										Advanced trading features for professionals
									</p>
								</div>
							</div>

							{/* Footer text */}
							<div className="text-center">
								<p className="text-sm text-zinc-600 mb-2">
									STELS Web3 OS v0.12.8
								</p>
							</div>
						</div>
					)}
			</div>
		</div>
	);
}

export default Welcome;
