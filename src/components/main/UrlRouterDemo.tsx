import React from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {getCurrentRouteFromUrl, navigateTo} from "@/lib/router";
import {useAppStore} from "@/stores";

/**
 * Demo component to showcase URL-based routing functionality
 */
export const UrlRouterDemo: React.FC = () => {
	const {currentRoute, allowedRoutes} = useAppStore();
	const urlRoute = getCurrentRouteFromUrl();
	
	const handleRouteChange = (route: string): void => {
		navigateTo(route);
	};
	
	return (
		<Card className="mt-4 w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					URL Router Query Protocol
					<Badge
						variant="outline"
						className="text-amber-400 border-amber-500/30"
					>
						Live
					</Badge>
				</CardTitle>
				<CardDescription>
					Test URL-based routing by clicking buttons or manually changing the
					URL query parameter
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<h4 className="font-medium text-sm text-muted-foreground mb-2">
							Current State
						</h4>
						<div className="space-y-2 text-sm">
							<div>
								<span className="text-muted-foreground">Store Route:</span>
								<Badge variant="secondary" className="ml-2">
									{currentRoute}
								</Badge>
							</div>
							<div>
								<span className="text-muted-foreground">URL Route:</span>
								<Badge variant="secondary" className="ml-2">
									{urlRoute || "none"}
								</Badge>
							</div>
							<div>
								<span className="text-muted-foreground">Sync Status:</span>
								<Badge
									variant={urlRoute === currentRoute
										? "default"
										: "destructive"}
									className="ml-2"
								>
									{urlRoute === currentRoute ? "Synced" : "Out of sync"}
								</Badge>
							</div>
							<div>
								<span className="text-muted-foreground">URL:</span>
								<code className="ml-2 text-xs bg-muted px-2 py-1 rounded">
									{window.location.href}
								</code>
							</div>
						</div>
					</div>
					
					<div>
						<h4 className="font-medium text-sm text-muted-foreground mb-2">
							Quick Navigation
						</h4>
						<div className="grid grid-cols-2 gap-2">
							{allowedRoutes.slice(0, 4).map((route) => (
								<Button
									key={route}
									variant={currentRoute === route ? "default" : "outline"}
									size="sm"
									onClick={() => handleRouteChange(route)}
									className="text-xs"
								>
									{route}
								</Button>
							))}
						</div>
					</div>
				</div>
				
				<div className="border-t pt-4">
					<h4 className="font-medium text-sm text-muted-foreground mb-2">
						Test URLs
					</h4>
					<div className="space-y-2 text-xs">
						{allowedRoutes.map((route) => (
							<div key={route} className="flex items-center gap-2">
								<code className="bg-muted px-2 py-1 rounded flex-1">
									{window.location.origin}?router={route}
								</code>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										const url = new URL(window.location.href);
										url.searchParams.set("router", route);
										window.open(url.toString(), "_blank");
									}}
									className="text-xs"
								>
									Open
								</Button>
							</div>
						))}
					</div>
				</div>
				
				
				<div className="border-t pt-4">
					<h4 className="font-medium text-sm text-muted-foreground mb-2">
						Invalid Route Test
					</h4>
					<div className="flex items-center gap-2">
						<code className="bg-muted px-2 py-1 rounded flex-1">
							{window.location.origin}?router=invalid
						</code>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								const url = new URL(window.location.href);
								url.searchParams.set("router", "invalid");
								window.open(url.toString(), "_blank");
							}}
							className="text-xs"
						>
							Test
						</Button>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						This should redirect to welcome page
					</p>
				</div>
			</CardContent>
		</Card>
	);
};
