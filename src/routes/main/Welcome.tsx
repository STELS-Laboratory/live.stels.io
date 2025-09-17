import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	ArrowRight,
	BarChart3,
	Brain,
	Eye,
	Globe,
	Lock,
	Network,
	Shield,
	TrendingUp,
	Users,
	Wallet,
	//Zap,
} from "lucide-react";
import React from "react";
import { UrlRouterDemo } from "@/components/main/UrlRouterDemo";
import { RouterDebug } from "@/components/main/RouterDebug";
import NetworkReport from "@/components/main/NetworkReport";
import SystemUpdateNotification from "@/components/main/SystemUpdateNotification";
import { navigateTo } from "@/lib/router";

/**
 * Welcome dashboard component with professional Web3 trading platform introduction
 */
function Welcome(): React.ReactElement | null {
	return (
		<>
			<div className="container m-auto gap-6 space-y-8">
				{/* System Update Notification */}
				<SystemUpdateNotification />

				{/* Network Report */}
				<NetworkReport />

				{/* What is STELS Section */}
				<Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
					<CardHeader className="text-center">
						<CardTitle className="text-3xl font-bold text-amber-400 flex items-center justify-center">
							<Globe className="w-8 h-8 mr-3" />
							What is STELS?
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<h3 className="text-xl font-semibold text-white">
									Decentralized Trading Platform
								</h3>
								<p className="text-gray-300 leading-relaxed">
									The revolutionary Web3 client that connects to the
									heterogeneous STELS network, enabling seamless trading across
									multiple blockchain networks and traditional financial
									markets. Unlike centralized platforms, STELS operates on a
									fully transparent, decentralized infrastructure.
								</p>
							</div>
							<div className="space-y-4">
								<h3 className="text-xl font-semibold text-white">
									Heterogens Operational Framework
								</h3>
								<p className="text-gray-300 leading-relaxed">
									The STELS heterogeneous network combines multiple blockchain
									protocols, traditional financial systems, and AI-powered
									liquidity pools into a unified trading ecosystem that ensures
									maximum efficiency and transparency.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Competitive Advantage Section */}
				<Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
					<CardHeader className="text-center">
						<CardTitle className="text-xl font-bold text-blue-400 flex items-center justify-center">
							<Shield className="w-8 h-8 mr-3" />
							The Decentralized Alternative to Aladdin
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
							<div className="grid md:grid-cols-2 gap-8">
								<div className="space-y-4">
									<h3 className="text-xl font-semibold text-blue-400 flex items-center">
										<Lock className="w-5 h-5 mr-2" />
										Full Transparency
									</h3>
									<p className="text-gray-300">
										Unlike traditional platforms, every transaction, strategy,
										and liquidity pool is visible on the blockchain. No hidden
										fees, no opaque operations - complete transparency through
										cryptographic verification.
									</p>
								</div>
								<div className="space-y-4">
									<h3 className="text-xl font-semibold text-blue-400 flex items-center">
										<Users className="w-5 h-5 mr-2" />
										Community-Driven
									</h3>
									<p className="text-gray-300">
										STELS is governed by its community of users and liquidity
										providers, not by a centralized corporation. Decisions are
										made transparently through decentralized governance
										mechanisms.
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* AI-Powered Features Section */}
				<Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
					<CardHeader className="text-center">
						<CardTitle className="text-xl font-bold text-emerald-400 flex items-center justify-center">
							<Brain className="w-8 h-8 mr-3" />
							AI-Powered Liquidity Management
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid md:grid-cols-3 gap-6">
							<div className="text-center space-y-3">
								<div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
									<TrendingUp className="w-8 h-8 text-emerald-400" />
								</div>
								<h3 className="text-lg font-semibold text-white">
									Portfolio Optimization
								</h3>
								<p className="text-gray-300 text-sm">
									Advanced AI algorithms continuously optimize your portfolio
									allocation across multiple assets and strategies for maximum
									returns.
								</p>
							</div>
							<div className="text-center space-y-3">
								<div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
									<Network className="w-8 h-8 text-emerald-400" />
								</div>
								<h3 className="text-lg font-semibold text-white">
									Liquidity Pools
								</h3>
								<p className="text-gray-300 text-sm">
									Intelligent liquidity management across multiple pools with
									automated rebalancing and risk mitigation strategies.
								</p>
							</div>
							<div className="text-center space-y-3">
								<div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
									<BarChart3 className="w-8 h-8 text-emerald-400" />
								</div>
								<h3 className="text-lg font-semibold text-white">
									Strategy Automation
								</h3>
								<p className="text-gray-300 text-sm">
									Deploy and manage sophisticated trading strategies with
									AI-driven execution and real-time market analysis.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Key Features Grid */}
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					<Card className="bg-zinc-900/80 border-zinc-700/50 hover:border-amber-500/30 transition-colors">
						<CardHeader>
							<CardTitle className="text-amber-400 flex items-center">
								<Globe className="w-5 h-5 mr-2" />
								Multi-Chain Support
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-300">
								Trade across Ethereum, Solana, Bitcoin, and traditional markets
								through a single, unified interface.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-zinc-900/80 border-zinc-700/50 hover:border-amber-500/30 transition-colors">
						<CardHeader>
							<CardTitle className="text-amber-400 flex items-center">
								<Eye className="w-5 h-5 mr-2" />
								Real-Time Analytics
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-300">
								Advanced charts, order books, and market data with sub-second
								latency for optimal trading decisions.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-zinc-900/80 border-zinc-700/50 hover:border-amber-500/30 transition-colors">
						<CardHeader>
							<CardTitle className="text-amber-400 flex items-center">
								<Shield className="w-5 h-5 mr-2" />
								Enterprise Security
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-300">
								Military-grade cryptography, multi-signature wallets, and
								decentralized custody solutions.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-zinc-900/80 border-zinc-700/50 hover:border-amber-500/30 transition-colors">
						<CardHeader>
							<CardTitle className="text-amber-400 flex items-center">
								<Brain className="w-5 h-5 mr-2" />
								AI Strategies
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-300">
								Access to institutional-grade AI trading strategies and
								automated portfolio management.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-zinc-900/80 border-zinc-700/50 hover:border-amber-500/30 transition-colors">
						<CardHeader>
							<CardTitle className="text-amber-400 flex items-center">
								<Network className="w-5 h-5 mr-2" />
								Liquidity Aggregation
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-300">
								Deep liquidity from multiple sources with best execution and
								minimal slippage.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-zinc-900/80 border-zinc-700/50 hover:border-amber-500/30 transition-colors">
						<CardHeader>
							<CardTitle className="text-amber-400 flex items-center">
								<Users className="w-5 h-5 mr-2" />
								Community Governance
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-gray-300">
								Participate in platform decisions through decentralized
								governance and voting mechanisms.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Call to Action */}
				<Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
					<CardContent className="text-center py-12">
						<h2 className="text-3xl font-bold text-white mb-4">
							Ready to Experience the Future of Trading?
						</h2>
						<p className="text-gray-300 mb-8 max-w-2xl mx-auto">
							Join thousands of traders who have already discovered the power of
							decentralized, AI-powered trading on the STELS platform.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button
								onClick={() => navigateTo("canvas")}
								className="bg-amber-500 hover:bg-amber-600 text-zinc-900 px-8 py-3 text-lg font-semibold"
							>
								Start Monitoring
								<ArrowRight className="w-5 h-5 ml-2" />
							</Button>
							<Button
								onClick={() => navigateTo("wallet")}
								variant="outline"
								className="border-amber-500/50 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-8 py-3 text-lg font-semibold"
							>
								<Wallet className="w-5 h-5 mr-2" />
								Connect Your Wallet
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Development Tools (Optional) */}
				<div className="space-y-4">
					<UrlRouterDemo />
					<RouterDebug />
				</div>
			</div>
		</>
	);
}

export default Welcome;
