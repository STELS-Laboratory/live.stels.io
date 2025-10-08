import { useAppStore } from "@/stores";
import {
	Activity,
	BarChart3,
	Code2,
	Globe2,
	Layers3,
	Sparkles,
	TrendingUp,
	Wallet,
} from "lucide-react";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
	},
	{
		id: "canvas",
		route: "canvas",
		name: "Widget Studio",
		tagline: "Visual data composition",
		description:
			"Advanced widget store and canvas for building custom data visualizations. Drag and drop widgets to create your perfect trading dashboard.",
		icon: <Layers3 className="w-8 h-8" />,
		color: "from-purple-500/20 to-pink-500/20",
		category: "Visualization",
		featured: true,
	},
	{
		id: "network",
		route: "network",
		name: "Network Explorer",
		tagline: "Heterogeneous network analysis",
		description:
			"Explore and analyze the SONAR network infrastructure. Monitor nodes, track network health, and visualize global distribution of heterogen nodes.",
		icon: <Globe2 className="w-8 h-8" />,
		color: "from-green-500/20 to-emerald-500/20",
		category: "Network",
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
	},
	{
		id: "wallet",
		route: "wallet",
		name: "Gliesereum Wallet",
		tagline: "Secure network wallet",
		description:
			"Native blockchain wallet for the Gliesereum network. Manage your assets, view transactions, and interact with the SONAR ecosystem securely.",
		icon: <Wallet className="w-8 h-8" />,
		color: "from-amber-500/20 to-yellow-500/20",
		category: "Trading",
	},
];

/**
 * Application card component
 */
interface AppCardProps {
	app: AppMetadata;
	onLaunch: (route: string) => void;
	index: number;
}

function AppCard({ app, onLaunch, index }: AppCardProps): React.ReactElement {
	const [isLaunching, setIsLaunching] = useState(false);

	const handleClick = () => {
		setIsLaunching(true);
		// Delay navigation for animation
		setTimeout(() => {
			onLaunch(app.route);
		}, 700);
	};

	return (
		<motion.button
			initial={{ opacity: 0, y: 30, scale: 0.88 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: 0.8,
				delay: index * 0.15,
				ease: [0.16, 1, 0.3, 1],
			}}
			whileHover={{ scale: 1.03, y: -6 }}
			whileTap={{ scale: 0.97 }}
			onClick={handleClick}
			className={`
        group relative overflow-hidden rounded-2xl
        bg-gradient-to-br ${app.color}
        border border-zinc-800/50 hover:border-zinc-700/50
        p-6 text-left transition-all duration-300
        hover:shadow-xl hover:shadow-black/20
        focus:outline-none focus:ring-2 focus:ring-amber-500/50
      `}
		>
			{/* Launch animation overlay */}
			<AnimatePresence>
				{isLaunching && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
						className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-orange-500/30 backdrop-blur-sm z-10 flex items-center justify-center"
					>
						<motion.div
							initial={{ scale: 0, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{
								duration: 0.6,
								ease: [0.34, 1.56, 0.64, 1],
							}}
							className="relative"
						>
							<motion.div
								className="w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent"
								animate={{ rotate: 360 }}
								transition={{
									duration: 1.5,
									repeat: Infinity,
									ease: "linear",
								}}
							/>
							<motion.div
								className="absolute inset-0 bg-amber-500/20 rounded-full"
								animate={{
									scale: [1, 1.3, 1],
									opacity: [0.5, 0, 0.5],
								}}
								transition={{
									duration: 2,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							/>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Featured badge */}
			{app.featured && (
				<motion.div
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{
						delay: index * 0.15 + 0.5,
						duration: 0.8,
						ease: [0.34, 1.56, 0.64, 1],
					}}
					className="absolute top-4 right-4"
				>
					<motion.div
						className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30"
						animate={{
							scale: [1, 1.05, 1],
						}}
						transition={{
							duration: 3,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					>
						<motion.div
							animate={{ rotate: [0, 20, -20, 0] }}
							transition={{
								duration: 3,
								repeat: Infinity,
								repeatDelay: 4,
								ease: "easeInOut",
							}}
						>
							<Sparkles className="w-3 h-3 text-amber-500" />
						</motion.div>
						<span className="text-xs font-medium text-amber-500">Featured</span>
					</motion.div>
				</motion.div>
			)}

			{/* Icon */}
			<motion.div
				className="mb-4 text-amber-500"
				animate={isLaunching
					? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }
					: { scale: 1 }}
				transition={{ duration: 0.6, ease: "easeInOut" }}
				whileHover={{
					scale: 1.15,
					rotate: 8,
					transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
				}}
			>
				{app.icon}
			</motion.div>

			{/* Content */}
			<div className="space-y-2">
				<div>
					<h3 className="text-xl font-bold text-white mb-1">{app.name}</h3>
					<p className="text-sm text-zinc-400 font-medium">{app.tagline}</p>
				</div>
				<p className="text-sm text-zinc-500 leading-relaxed line-clamp-3">
					{app.description}
				</p>
			</div>

			{/* Category badge */}
			<div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800/50">
				<Activity className="w-3 h-3 text-zinc-500" />
				<span className="text-xs font-medium text-zinc-400">
					{app.category}
				</span>
			</div>

			{/* Hover effect overlay */}
			<motion.div
				className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 to-transparent pointer-events-none"
				initial={{ opacity: 0 }}
				whileHover={{ opacity: 1 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			/>

			{/* Animated border */}
			<motion.div
				className="absolute inset-0 rounded-2xl pointer-events-none"
				initial={{ opacity: 0 }}
				whileHover={{ opacity: 1 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				<motion.div
					className="absolute inset-0 rounded-2xl"
					style={{
						background: `linear-gradient(90deg, transparent, ${
							app.color.includes("amber") ? "#f59e0b" : "#3b82f6"
						}40, transparent)`,
					}}
					animate={{
						x: ["-200%", "200%"],
					}}
					transition={{
						duration: 3,
						repeat: Infinity,
						ease: "easeInOut",
					}}
				/>
			</motion.div>
		</motion.button>
	);
}

/**
 * Welcome screen - App Store style launcher
 */
function Welcome(): React.ReactElement {
	const { setRoute } = useAppStore();
	const [isExiting, setIsExiting] = useState(false);

	const handleLaunchApp = (route: string): void => {
		console.log(`[Welcome] Launching app: ${route}`);
		setIsExiting(true);
		// Give time for exit animation
		setTimeout(() => {
			setRoute(route);
		}, 900);
	};

	const featuredApps = applications.filter((app) => app.featured);
	const otherApps = applications.filter((app) => !app.featured);

	return (
		<motion.div
			className="h-full w-full overflow-y-auto"
			initial={{ opacity: 0 }}
			animate={{ opacity: isExiting ? 0 : 1 }}
			transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
		>
			<div className="container mx-auto px-6 py-12 max-w-7xl">
				{/* Header */}
				<div className="mb-12 text-center space-y-4">
					<motion.div
						initial={{ opacity: 0, y: -30, scale: 0.9 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4"
					>
						<motion.div
							animate={{
								rotate: [0, 25, -25, 0],
								scale: [1, 1.15, 1],
							}}
							transition={{
								duration: 3.5,
								repeat: Infinity,
								repeatDelay: 4,
								ease: "easeInOut",
							}}
						>
							<Sparkles className="w-4 h-4 text-amber-500" />
						</motion.div>
						<span className="text-sm font-medium text-amber-500">
							SONAR Trading Platform
						</span>
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 30, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
						className="text-5xl font-bold text-white mb-4"
					>
						Welcome, <span className="text-amber-500">STELS</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
						className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
					>
						Professional trading and analytics suite for cryptocurrency markets.
						Launch any application to get started.
					</motion.p>
				</div>

				{/* Featured Apps */}
				{featuredApps.length > 0 && (
					<motion.div
						className="mb-12"
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
					>
						<motion.div
							className="flex items-center gap-3 mb-6"
							initial={{ opacity: 0, x: -30 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								duration: 0.7,
								delay: 1.1,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							<motion.div
								animate={{
									rotate: [0, 25, -25, 0],
									scale: [1, 1.1, 1],
								}}
								transition={{
									duration: 3.5,
									repeat: Infinity,
									repeatDelay: 3,
									ease: "easeInOut",
								}}
							>
								<Sparkles className="w-5 h-5 text-amber-500" />
							</motion.div>
							<h2 className="text-2xl font-bold text-white">Featured Apps</h2>
						</motion.div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{featuredApps.map((app, index) => (
								<AppCard
									key={app.id}
									app={app}
									onLaunch={handleLaunchApp}
									index={index}
								/>
							))}
						</div>
					</motion.div>
				)}

				{/* Other Apps */}
				{otherApps.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.8,
							delay: 1.3,
							ease: [0.16, 1, 0.3, 1],
						}}
					>
						<motion.div
							className="flex items-center gap-3 mb-6"
							initial={{ opacity: 0, x: -30 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								duration: 0.7,
								delay: 1.5,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							<motion.div
								animate={{
									scale: [1, 1.1, 1],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: "easeInOut",
								}}
							>
								<Activity className="w-5 h-5 text-zinc-400" />
							</motion.div>
							<h2 className="text-2xl font-bold text-white">All Apps</h2>
						</motion.div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{otherApps.map((app, index) => (
								<AppCard
									key={app.id}
									app={app}
									onLaunch={handleLaunchApp}
									index={featuredApps.length + index}
								/>
							))}
						</div>
					</motion.div>
				)}

				{/* Footer info */}
				<motion.div
					className="mt-16 pt-8 border-t border-zinc-800/50 text-center"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
				>
					<motion.p
						className="text-sm text-zinc-500"
						animate={{
							opacity: [0.7, 1, 0.7],
						}}
						transition={{
							duration: 4,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					>
						{applications.length}{" "}
						applications available • Built with SONAR Protocol
					</motion.p>
				</motion.div>
			</div>
		</motion.div>
	);
}

export default Welcome;
