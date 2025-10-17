"use client";

import { useEffect, useState } from "react";
import { PulsingBorder } from "@paper-design/shaders-react";

interface AriadnaData {
	raw: {
		name: string;
		description: string;
		status: string;
		info: string;
		plugins: string[];
		accounts: unknown[];
		timestamp: number;
	};
}

function Ariadna({ data }: { data: AriadnaData }) {
	const [isAnimating, setIsAnimating] = useState(false);
	const [pulseActive, setPulseActive] = useState(false);

	const strategyData = data.raw;

	const isActive = strategyData.status === "training";

	useEffect(() => {
		const interval = setInterval(() => {
			setIsAnimating(true);
			setPulseActive(!pulseActive);
			setTimeout(() => setIsAnimating(false), 1000);
		}, 3000);

		return () => clearInterval(interval);
	}, [pulseActive]);

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="relative w-[1044px] h-[330px] bg-background ">
			{/* Animated background grid */}
			<div className="absolute inset-0 opacity-10">
				<div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.05)_25px,rgba(255,255,255,0.05)_26px,transparent_27px,transparent_49px,rgba(255,255,255,0.05)_50px,rgba(255,255,255,0.05)_51px,transparent_52px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[50px_50px]">
				</div>
			</div>

			{/* Status indicator glow */}
			{/*<div*/}
			{/*	className={`absolute top-12 left-6 w-6 h-6 rounded-full transition-all duration-1000 ${*/}
			{/*		isActive*/}
			{/*			? "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]"*/}
			{/*			: "bg-red-400 shadow-[0_0_20px_rgba(248,113,113,0.6)]"*/}
			{/*	} ${pulseActive ? "scale-125" : "scale-100"}`}*/}
			{/*></div>*/}

			{/* Main content */}
			<div className="relative z-10 p-8 h-full flex flex-col">
				{/* Header */}
				<div className="flex items-start justify-between mb-6">
					<div className="flex items-center space-x-4">
						<div>
							<div>
								<PulsingBorder
									colors={["#ff9102", "#104eb9"]}
									colorBack="#272727a"
									speed={1.5}
									roundness={18}
									thickness={1.1}
									softness={0.2}
									intensity={3}
									spotSize={2.1}
									pulse={1.1}
									smoke={1.1}
									smokeSize={2}
									scale={0.5}
									rotation={2}
									frame={10}
									style={{
										width: "50px",
										height: "50px",
										borderRadius: "50%",
										padding: "0px",
									}}
								/>
							</div>
						</div>
						<div>
							<h1 className="text-2xl font-bold text-foreground mb-1">
								{strategyData.name}
							</h1>
							<p className="text-muted-foreground text-sm">
								{strategyData.description}
							</p>
						</div>
					</div>

					<div
						className={`px-4 py-2 text-sm uppercase font-semibold transition-all duration-300 ${
							isActive
								? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
								: "bg-red-500/20 text-red-300 border border-red-500/30"
						}`}
					>
						{isActive ? "● " + strategyData.status : "● " + strategyData.status}
					</div>
				</div>

				{/* Info section */}
				<div className="mb-6">
					<p className="text-card-foreground text-base leading-relaxed">
						{strategyData.info}
					</p>
				</div>

				{/* Plugins grid */}
				<div className="flex-1 flex flex-col">
					<h3 className="zinc text-sm font-semibold mb-3 uppercase tracking-wider">
						Active Plugins
					</h3>
					<div className="grid grid-cols-3 gap-4 mb-6">
						{strategyData.plugins.map((plugin: string, index: number) => (
							<div
								key={plugin}
								className={`bg-muted/50 border border-border/50 rounded-xl p-4 transition-all duration-500 hover:bg-secondary/50 hover:border-muted/50 ${
									isAnimating ? "translate-y-[-2px] shadow-lg" : "translate-y-0"
								}`}
								style={{ transitionDelay: `${index * 100}ms` }}
							>
								<div className="flex items-center space-x-3">
									<div
										className={`w-2 h-2 rounded-full transition-all duration-300 ${
											isActive
												? "bg-emerald-400 dark:bg-emerald-400"
												: "bg-muted-foreground dark:bg-zinc-500"
										} ${pulseActive && isActive ? "animate-pulse" : ""}`}
									>
									</div>
									<span className="text-card-foreground font-medium capitalize">
										{plugin.replace("-", " ")}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Footer stats */}
				<div className="flex items-center justify-between pt-4 border-t border-border/50">
					<div className="flex items-center space-x-6">
						<div className="text-muted-foreground text-sm">
							<span className="text-muted-foreground">Accounts:</span>
							<span className="text-card-foreground ml-1">
								{strategyData.accounts.length}
							</span>
						</div>
						<div className="text-muted-foreground text-sm">
							<span className="text-muted-foreground">Last Update:</span>
							<span className="text-card-foreground ml-1">
								{formatTimestamp(strategyData.timestamp)}
							</span>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<div className="w-2 h-2 bg-muted-foreground dark:bg-zinc-600 rounded-full animate-pulse">
						</div>
						<div
							className="w-2 h-2 bg-muted-foreground dark:bg-zinc-600 rounded-full animate-pulse"
							style={{ animationDelay: "0.2s" }}
						>
						</div>
						<div
							className="w-2 h-2 bg-muted-foreground dark:bg-zinc-600 rounded-full animate-pulse"
							style={{ animationDelay: "0.4s" }}
						>
						</div>
					</div>
				</div>
			</div>

			{/* Animated particles for active state */}
			{isActive && (
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-1/4 left-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-ping opacity-75">
					</div>
					<div
						className="absolute top-3/4 right-1/3 w-1 h-1 bg-teal-400 rounded-full animate-ping opacity-50"
						style={{ animationDelay: "1s" }}
					>
					</div>
					<div
						className="absolute bottom-1/4 left-2/3 w-1 h-1 bg-emerald-300 rounded-full animate-ping opacity-60"
						style={{ animationDelay: "2s" }}
					>
					</div>
				</div>
			)}
		</div>
	);
}

export default Ariadna;
