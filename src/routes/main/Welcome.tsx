import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ArrowRight,
	Shield,
	Wallet,
} from "lucide-react";
import React from "react";
import { UrlRouterDemo } from "@/components/main/UrlRouterDemo";
import { RouterDebug } from "@/components/main/RouterDebug";
import { navigateTo } from "@/lib/router";

/**
 * Welcome dashboard component with professional trading analytics
 */
function Welcome(): React.ReactElement | null {

	return (
		<>
			<div className="container m-auto gap-4 space-y-4">
				{/* Notify Users Block */}
				<Card className="border-amber-500/30 bg-amber-500/5">
					<CardHeader>
						<CardTitle className="flex items-center text-amber-400">
							<Shield className="w-5 h-5 mr-2" />
							IMPORTANT ANNOUNCEMENT
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0">
										<Badge
											variant="outline"
											className="border-amber-500/50 bg-amber-500/20 text-amber-400 px-3 py-1"
										>
											August 21th
										</Badge>
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="text-lg font-semibold text-amber-400 mb-2">
											Wallet System Connected to STELS Network
										</h3>
										<div className="text-sm text-gray-300 space-y-2">
											<p>
												The wallet system is now fully connected to the STELS
												network. Users can manage accounts, view transactions,
												and perform secure operations.
											</p>
											<p>
												<strong className="text-amber-400">
													Upcoming Network Launches:
												</strong>
											</p>
											<ul className="list-disc list-inside space-y-1 ml-4 text-gray-300">
												<li>
													<strong>August 21-22:</strong>{" "}
													Genesis block publication for TestNet, DevNet, MainNet
												</li>
												<li>
													<strong>August 23-24:</strong>{" "}
													Network connections for Solana, Ethereum, Bitcoin
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>

							<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
								<div className="flex items-start space-x-3">
									<div className="flex-shrink-0">
										<Badge
											variant="outline"
											className="border-blue-500/50 bg-blue-500/20 text-blue-400 px-3 py-1"
										>
											Available Now
										</Badge>
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="text-lg font-semibold text-blue-400 mb-2">
											FRED & World Bank Integration
										</h3>
										<div className="text-sm text-gray-300">
											<p>
												We have successfully connected FRED (Federal Reserve
												Economic Data) and World Bank data sources, now
												available in the Canvas system for advanced economic
												analysis and trading strategies.
											</p>
										</div>
									</div>
								</div>
							</div>

							<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
								<div className="flex items-start justify-between">
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0">
											<Badge
												variant="outline"
												className="border-emerald-500/50 bg-emerald-500/20 text-emerald-400 px-3 py-1"
											>
												Connected
											</Badge>
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="text-lg font-semibold text-emerald-400 mb-2">
												Wallet System Connected
											</h3>
											<div className="text-sm text-gray-300">
												<p>
													The wallet system is now fully connected to the
													heterogeneous network. You can manage your accounts,
													view transactions, and perform secure operations
													through the integrated wallet interface.
												</p>
											</div>
										</div>
									</div>
									<div className="flex-shrink-0 ml-4">
										<Button
											onClick={() => navigateTo("wallet")}
											variant="outline"
											size="sm"
											className="border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300"
										>
											<Wallet className="w-4 h-4 mr-2" />
											Open Wallet
											<ArrowRight className="w-4 h-4 ml-2" />
										</Button>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* URL Router Demo */}
				<UrlRouterDemo />

				{/* Router Debug */}
				<RouterDebug />
			</div>
		</>
	);
}

export default Welcome;
