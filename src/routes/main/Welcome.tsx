import { useAppStore } from "@/stores";
import { useMobile } from "@/hooks/useMobile.ts";
import { Activity, Sparkles, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import {
	AppCard,
	FeatureHighlight,
	LoadingOverlay,
	SectionHeader,
} from "./Welcome/index";
import { applications } from "./Welcome/applications.tsx";

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
			className={`relative h-full w-full overflow-y-auto transition-all duration-200 ${
				isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
			}`}
		>
			{/* Loading overlay when launching app */}
			{isExiting && <LoadingOverlay />}

			{/* Container with relative positioning */}
			<div
				className={isMobile
					? "pb-8 relative"
					: "container mx-auto px-6 py-12 max-w-7xl relative"}
			>
				{/* Large Title Header - Mobile only */}
				{isMobile && (
					<div className="px-4 pt-6 pb-6 border-b border-border/50 bg-gradient-to-b from-card/20 to-transparent">
						<h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-card-foreground mb-2 tracking-tight">
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
						{/* Section header */}
						{isMobile
							? (
								<SectionHeader
									title="Featured"
									description="Most popular applications"
									badge={featuredApps.length}
									isMobile={isMobile}
								/>
							)
							: (
								<SectionHeader
									title="Featured Apps"
									description="Most popular applications with active users"
									badge={`${featuredApps.length} Featured`}
									isMobile={isMobile}
								/>
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
						{/* Section header */}
						{isMobile
							? (
								<div className="px-4 mb-5 pt-6 border-t border-border/50">
									<h2 className="text-xl font-bold text-card-foreground mb-2 tracking-tight">
										More Apps
									</h2>
									<p className="text-xs text-muted-foreground font-medium">
										Explore additional tools
									</p>
								</div>
							)
							: (
								<div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50 relative">
									{/* Gradient underline */}
									<div className="absolute bottom-0 left-0 h-[1px] w-24 bg-gradient-to-r from-muted/50 to-transparent" />

									<div>
										<h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground mb-2 tracking-tight">
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
						<div className="mt-12 px-4 pb-8 pt-6 border-t border-border/50">
							{/* Feature highlights */}
							<div className="space-y-3 mb-6">
								<FeatureHighlight
									icon={Sparkles}
									title="Web3 Technology"
									description="Secure, decentralized"
									color="amber"
									isMobile={isMobile}
								/>
								<FeatureHighlight
									icon={Activity}
									title="Real-time Analytics"
									description="Live market data"
									color="green"
									isMobile={isMobile}
								/>
								<FeatureHighlight
									icon={TrendingUp}
									title="Professional Tools"
									description="Advanced features"
									color="blue"
									isMobile={isMobile}
								/>
							</div>

							{/* Footer text */}
							<div className="text-center pt-4 border-t border-border/50">
								<p className="text-xs text-muted-foreground font-bold tracking-wider">
									STELS WEB3 OS v0.12.8
								</p>
							</div>
						</div>
					)
					: (
						<div className="mt-16 pt-8 border-t border-border/50 relative from-transparent to-card/10">
							{/* Gradient underline */}
							<div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-32 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

							{/* Feature highlights - Desktop */}
							<div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
								<FeatureHighlight
									icon={Sparkles}
									title="Web3 Technology"
									description="Secure, decentralized AI infrastructure"
									color="amber"
									isMobile={isMobile}
								/>
								<FeatureHighlight
									icon={Activity}
									title="Real-time Analytics"
									description="Live market data and professional indicators"
									color="green"
									isMobile={isMobile}
								/>
								<FeatureHighlight
									icon={TrendingUp}
									title="Professional Tools"
									description="Advanced trading features for professionals"
									color="blue"
									isMobile={isMobile}
								/>
							</div>

							{/* Footer text - Desktop */}
							<div className="text-center pt-4 border-t border-border/50">
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
