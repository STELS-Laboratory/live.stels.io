import React, {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {useAppStore} from "@/stores";
import {getCurrentRouteFromUrl, isValidRoute} from "@/lib/router";

/**
 * Debug component for troubleshooting routing issues
 */
export const RouterDebug: React.FC = () => {
	const {currentRoute, allowedRoutes} = useAppStore();
	const [debugInfo, setDebugInfo] = useState({
		urlRoute: "",
		isValid: false,
		storeReady: false,
		timestamp: Date.now(),
	});
	
	useEffect(() => {
		const urlRoute = getCurrentRouteFromUrl();
		const isValid = urlRoute ? isValidRoute(urlRoute) : false;
		const storeReady = allowedRoutes && allowedRoutes.length > 0;
		
		setDebugInfo({
			urlRoute: urlRoute || "none",
			isValid,
			storeReady,
			timestamp: Date.now(),
		});
	}, [currentRoute, allowedRoutes]);
	
	return (
		<Card className="w-full max-w-2xl mx-auto mt-4">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					Router Debug
					<Badge variant="outline" className="text-red-400 border-red-500/30">
						Debug
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<h4 className="font-medium text-muted-foreground mb-2">
							Store State
						</h4>
						<div className="space-y-2">
							<div>
								<span className="text-muted-foreground">Current Route:</span>
								<Badge variant="secondary" className="ml-2">
									{currentRoute}
								</Badge>
							</div>
							<div>
								<span className="text-muted-foreground">Store Ready:</span>
								<Badge
									variant={debugInfo.storeReady ? "default" : "destructive"}
									className="ml-2"
								>
									{debugInfo.storeReady ? "Yes" : "No"}
								</Badge>
							</div>
							<div>
								<span className="text-muted-foreground">Allowed Routes:</span>
								<div className="mt-1">
									{allowedRoutes.map((route) => (
										<Badge
											key={route}
											variant="outline"
											className="mr-1 mb-1 text-xs"
										>
											{route}
										</Badge>
									))}
								</div>
							</div>
						</div>
					</div>
					
					<div>
						<h4 className="font-medium text-muted-foreground mb-2">
							URL State
						</h4>
						<div className="space-y-2">
							<div>
								<span className="text-muted-foreground">URL Route:</span>
								<Badge variant="secondary" className="ml-2">
									{debugInfo.urlRoute}
								</Badge>
							</div>
							<div>
								<span className="text-muted-foreground">Valid Route:</span>
								<Badge
									variant={debugInfo.isValid ? "default" : "destructive"}
									className="ml-2"
								>
									{debugInfo.isValid ? "Yes" : "No"}
								</Badge>
							</div>
							<div>
								<span className="text-muted-foreground">Full URL:</span>
								<code className="block mt-1 text-xs bg-muted px-2 py-1 rounded">
									{window.location.href}
								</code>
							</div>
						</div>
					</div>
				</div>
				
				<div className="border-t pt-4">
					<h4 className="font-medium text-sm text-muted-foreground mb-2">
						Test Actions
					</h4>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								const url = new URL(window.location.href);
								url.searchParams.set("router", "canvas");
								window.location.href = url.toString();
							}}
						>
							Test Canvas Direct
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								const url = new URL(window.location.href);
								url.searchParams.set("router", "markets");
								window.location.href = url.toString();
							}}
						>
							Test Markets Direct
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								window.location.reload();
							}}
						>
							Reload Page
						</Button>
					</div>
				</div>
				
				<div className="border-t pt-4">
					<h4 className="font-medium text-sm text-muted-foreground mb-2">
						Debug Info
					</h4>
					<div className="text-xs text-muted-foreground">
						<p>
							Timestamp: {new Date(debugInfo.timestamp).toLocaleTimeString()}
						</p>
						<p>User Agent: {navigator.userAgent}</p>
						<p>Local Storage: {localStorage ? "Available" : "Not Available"}</p>
						<p>
							Session Storage: {sessionStorage ? "Available" : "Not Available"}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
