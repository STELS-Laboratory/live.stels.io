import { AppIcon } from "@/components/ui/app-icon.tsx";
import type { AppMetadata } from "./types.ts";

/**
 * Available applications in the STELS ecosystem
 * Professional Web3 trading platform
 */
export const applications: AppMetadata[] = [
	{
		id: "scanner",
		route: "scanner",
		name: "Liquidity Pool",
		tagline: "Advanced market depth intelligence",
		description:
			"Professional liquidity scanner with real-time order flow analysis. Monitor market depth across multiple venues, track institutional movements, and identify trading opportunities with precision analytics. Features multi-exchange aggregation, volume profiling, and smart alerts.",
		icon: <AppIcon appId="scanner" appName="Liquidity Pool" size="2xl" />,
		color: "from-amber-500/20 to-orange-500/20",
		category: "Analytics",
		featured: true,
		size: "large",
		badge: "Most Popular",
		stats: "Professional",
	},
	{
		id: "markets",
		route: "markets",
		name: "Markets",
		tagline: "Unified multi-exchange trading terminal",
		description:
			"Professional trading dashboard with synchronized data from leading crypto exchanges. Real-time price comparison, advanced charting, volume analysis, and cross-venue arbitrage detection. Execute sophisticated strategies with institutional-grade tools and precision timing.",
		icon: <AppIcon appId="markets" appName="Markets" size="2xl" />,
		color: "from-blue-500/20 to-cyan-500/20",
		category: "Trading",
		featured: true,
		size: "large",
		badge: "Essential",
		stats: "Multi-Exchange",
	},
	{
		id: "orderbook",
		route: "orderbook",
		name: "Aggregator",
		tagline: "Deep market visualization and analysis",
		description:
			"Advanced order book aggregator with microsecond-level precision. Visualize liquidity depth, analyze bid-ask dynamics, track large orders, and detect hidden liquidity patterns. Features include heatmaps, cumulative depth charts, spread analytics, and instant execution impact assessment.",
		icon: <AppIcon appId="orderbook" appName="Aggregator" size="2xl" />,
		color: "from-emerald-500/20 to-teal-500/20",
		category: "Trading",
		featured: true,
		size: "medium",
		badge: "Pro",
		stats: "Real-time",
	},
	{
		id: "canvas",
		route: "canvas",
		name: "Canvas",
		tagline: "Customizable workspace designer",
		description:
			"Intelligent dashboard builder with modular widget system. Create personalized trading environments using drag-and-drop components: live charts, order flow, positions, P&L, alerts, and custom analytics. Save multiple layouts, sync across devices, and optimize your workflow with adaptive design.",
		icon: <AppIcon appId="canvas" appName="Canvas" size="2xl" />,
		color: "from-purple-500/20 to-pink-500/20",
		category: "Visualization",
		featured: true,
		size: "medium",
		badge: "New",
		stats: "Customizable",
	},
	{
		id: "network",
		route: "network",
		name: "Network",
		tagline: "Global infrastructure monitoring",
		description:
			"Interactive 3D visualization of the decentralized STELS network. Real-time node health monitoring, geographic distribution tracking, consensus metrics, and performance analytics. Explore network topology, latency heatmaps, and validator status across global infrastructure.",
		icon: <AppIcon appId="network" appName="Network" size="2xl" />,
		color: "from-green-500/20 to-emerald-500/20",
		category: "Network",
		size: "small",
		stats: "Global",
	},
	{
		id: "editor",
		route: "editor",
		name: "Editor",
		tagline: "Algorithmic strategy development",
		description:
			"Professional IDE for automated trading systems. Write, debug, and backtest strategies with TypeScript support, real-time market simulation, and comprehensive testing framework. Deploy algorithmic workers directly to the blockchain with built-in version control and performance monitoring.",
		icon: <AppIcon appId="editor" appName="Editor" size="2xl" />,
		color: "from-indigo-500/20 to-violet-500/20",
		category: "Development",
		size: "small",
		badge: "Advanced",
		stats: "Developer",
	},
	{
		id: "wallet",
		route: "wallet",
		name: "Wallet",
		tagline: "Enterprise-grade Web3 wallet",
		description:
			"Native Gliesereum blockchain wallet with advanced security features. Hardware wallet support, multi-signature transactions, HD key derivation, and encrypted backup. Manage digital assets, track transaction history, sign messages, and interact seamlessly with smart contracts and dApps.",
		icon: <AppIcon appId="wallet" appName="Wallet" size="2xl" />,
		color: "from-amber-500/20 to-yellow-500/20",
		category: "Trading",
		size: "small",
		stats: "Secure",
	},
];
