import {
	BarChart3,
	BookOpen,
	Code2,
	Globe2,
	Layers3,
	TrendingUp,
	Wallet,
} from "lucide-react";
import type { AppMetadata } from "./types.ts";

/**
 * Available applications in the SONAR ecosystem
 */
export const applications: AppMetadata[] = [
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
		name: "Market Aggregator",
		tagline: "Unified multi-exchange terminal",
		description:
			"Professional market aggregator consolidating real-time data from multiple exchanges. Monitor spot markets, compare prices, analyze volumes, and track liquidity across all connected trading venues in one unified interface.",
		icon: <BarChart3 className="w-8 h-8" />,
		color: "from-blue-500/20 to-cyan-500/20",
		category: "Trading",
		featured: true,
		size: "large",
		badge: "Essential",
		stats: "15K+ traders",
	},
	{
		id: "orderbook",
		route: "orderbook",
		name: "Order Book",
		tagline: "Real-time market depth analysis",
		description:
			"Professional order book visualization and analysis tool. Monitor real-time market depth, track bid-ask spreads, analyze liquidity distribution, and identify trading opportunities across multiple exchanges and markets.",
		icon: <BookOpen className="w-8 h-8" />,
		color: "from-emerald-500/20 to-teal-500/20",
		category: "Trading",
		featured: true,
		size: "medium",
		badge: "Pro",
		stats: "10K+ traders",
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
			"Professional code Editor for developing and managing trading algorithms. Create, test, and deploy automated trading strategies (AMI workers).",
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
		tagline: "Secure network Wallet",
		description:
			"Native blockchain Wallet for the Gliesereum network. Manage your assets, view transactions, and interact with the STELS ecosystem securely.",
		icon: <Wallet className="w-8 h-8" />,
		color: "from-amber-500/20 to-yellow-500/20",
		category: "Trading",
		size: "small",
		stats: "20K+ wallets",
	},
];
