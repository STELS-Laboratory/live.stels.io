import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Professional Header component for consistent page headers across the application
 */
function Header(
	{ title, description }: { title?: string; description?: string },
): React.ReactElement {
	return (
		<div className="flex items-center justify-between px-6 py-6 border-b border-border bg-card/30 backdrop-blur-sm">
			<div className="flex items-center space-x-4">
				<div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-md">
					<BarChart3 className="w-6 h-6 text-primary-foreground" />
				</div>
				<div className="space-y-1">
					<h1 className="text-2xl font-bold text-foreground tracking-tight">
						{title || "Title Screen"}
					</h1>
					<p className="text-muted-foreground text-sm max-w-2xl">
						{description ||
							"Welcome to the STELS Network, a professional platform for digital assets."}
					</p>
				</div>
			</div>
			<div className="flex items-center space-x-3">
				<Badge
					variant="outline"
					className={cn(
						"px-2 py-1 border-green-600/30 bg-green-500/10",
						"text-green-700 dark:text-green-400 hover:bg-green-500/20",
						"shadow-sm",
					)}
				>
					<div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse shadow-sm shadow-green-500/50" />
					<span className="font-semibold text-xs">LIVE</span>
				</Badge>
			</div>
		</div>
	);
}

export default Header;
