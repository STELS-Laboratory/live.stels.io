import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Header component for consistent page headers across the application
 */
function Header(
	{ title, description }: { title?: string; description?: string },
): React.ReactElement {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center space-x-4">
				<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
					<BarChart3 className="w-6 h-6 " />
				</div>
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						{title || "Title Screen"}
					</h1>
					<p className="text-muted-foreground text-sm">
						{description ||
							"Welcome to the STELS Network, a decentralized exchange platform for trading digital assets."}
					</p>
				</div>
			</div>
			<div className="flex items-center space-x-4">
				<Badge
					variant="outline"
					className={cn(
						"px-3 py-1 border-green-500/30 bg-green-500/10",
						"text-green-700 dark:text-green-600 hover:bg-green-500/20",
					)}
				>
					<div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
					LIVE
				</Badge>
			</div>
		</div>
	);
}

export default Header;
