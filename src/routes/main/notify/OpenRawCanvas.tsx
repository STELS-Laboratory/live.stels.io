import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, ExternalLink, Zap } from "lucide-react";

export default function OpenRawCanvas() {
	return (
		<div className="w-full mt-4 mx-auto">
			<Card className="relative overflow-hidden border border-zinc-800 bg-zinc-950">
				{/* Background decoration */}
				<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-full -translate-y-16 translate-x-16" />
				<div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-zinc-700/20 to-amber-500/10 rounded-full translate-y-12 -translate-x-12" />

				<CardContent className="relative p-6">
					<div className="flex items-start gap-4">
						{/* Icon */}
						<div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
							<Database className="w-6 h-6 text-zinc-950" />
						</div>

						{/* Content */}
						<div className="flex-1 space-y-3">
							<div className="flex items-center gap-2 flex-wrap">
								<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
									<Zap className="w-3 h-3 mr-1" />
									Now Available
								</Badge>
								<Badge
									variant="outline"
									className="text-xs border-zinc-700 text-zinc-400"
								>
									STELS Network
								</Badge>
							</div>

							<div>
								<h3 className="text-xl font-bold text-zinc-100 mb-2">
									Canvas - Raw Data Monitoring
								</h3>
								<p className="text-zinc-300 leading-relaxed">
									Access the new Canvas application for real-time raw data
									monitoring from the STELS network. Get unprocessed, direct
									insights and analytics as they happen.
								</p>
								<p className="text-sm text-zinc-400 mt-2">
									Documentation for the Gliesereum Wallet protocol is available
									at
									<a
										href="https://doc.stels.io"
										target="_blank"
										rel="noopener noreferrer"
										className="text-amber-400 hover:text-amber-300 underline underline-offset-4 ml-1 inline-flex items-center"
									>
										doc.stels.io
										<ExternalLink className="w-3 h-3 ml-1" />
									</a>.
								</p>
							</div>

							{/* Features */}
							<div className="flex items-center gap-4 text-sm text-zinc-400">
								<div className="flex items-center gap-1">
									<Activity className="w-4 h-4 text-amber-500" />
									<span>Real-time</span>
								</div>
								<div className="flex items-center gap-1">
									<Database className="w-4 h-4 text-amber-500" />
									<span>Raw Data</span>
								</div>
							</div>

							{/* Action Button */}
							<div className="pt-2">
								<Button
									asChild
									className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
								>
									<a
										href="https://canvas.stels.io/"
										target="_blank"
										rel="noopener noreferrer"
									>
										<span>Open Test Web3 Canvas</span>
										<ExternalLink className="w-4 h-4 ml-2" />
									</a>
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
