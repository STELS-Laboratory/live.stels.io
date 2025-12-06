/**
 * News Feed Component
 * Professional news feed with category tabs, filtering, and importance indicators
 */

import React, { useMemo, useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useNetworkStore } from "@/stores/modules/network.store";
import useSessionStoreSync from "@/hooks/use_session_store_sync";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
	title: string;
	link: string;
	pubDate: string;
	ts: number;
	ageMs: number;
	score: number;
	source: string;
	description: string;
}

interface NewsData {
	channel: string;
	module: string;
	widget: string;
	raw: NewsItem[];
	timestamp: number;
}

interface NewsCategory {
	key: string;
	label: string;
	channel: string;
}

/**
 * Format category key to readable label
 */
function formatCategoryLabel(key: string): string {
	// Convert camelCase or snake_case to Title Case
	return key
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

type SortOption = "score" | "relevance" | "time";
type FilterOption = "all" | "critical" | "high" | "medium" | "low";

/**
 * Format time ago from milliseconds
 */
function formatTimeAgo(ageMs: number): string {
	const seconds = Math.floor(ageMs / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

/**
 * Extract source name from URL or description
 */
function extractSourceName(source: string, description: string): string {
	// Try to extract from description first (Google News format)
	const descMatch = description.match(/<font[^>]*>([^<]+)<\/font>/);
	if (descMatch) {
		return descMatch[1];
	}

	// Try to extract from source URL
	try {
		const url = new URL(source);
		const hostname = url.hostname.replace("www.", "");
		return hostname.split(".")[0] || "News";
	} catch {
		return "News";
	}
}

/**
 * Get importance level based on score
 * Score represents priority/relevance, not criticality
 * Returns color scheme based on rating gradient
 */
function getImportanceLevel(score: number): {
	level: "critical" | "high" | "medium" | "low";
	color: string;
	scoreColor: string;
	borderColor: string;
	titleColor: string;
} {
	// Very high priority (>= 30) - bright primary/amber
	if (score >= 30) {
		return {
			level: "high",
			color: "text-primary",
			scoreColor: "text-primary font-bold",
			borderColor: "border-primary",
			titleColor: "text-foreground group-hover:text-primary",
		};
	}
	// High priority (25-29) - primary
	if (score >= 25) {
		return {
			level: "high",
			color: "text-primary",
			scoreColor: "text-primary",
			borderColor: "border-primary/70",
			titleColor: "text-foreground group-hover:text-primary",
		};
	}
	// Medium-high priority (20-24) - blue
	if (score >= 20) {
		return {
			level: "high",
			color: "text-blue-600 dark:text-blue-400",
			scoreColor: "text-blue-600 dark:text-blue-400",
			borderColor: "border-blue-500/60 dark:border-blue-400/60",
			titleColor: "text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400",
		};
	}
	// Medium priority (15-19) - amber/yellow
	if (score >= 15) {
		return {
			level: "medium",
			color: "text-amber-600 dark:text-amber-500",
			scoreColor: "text-amber-600 dark:text-amber-500",
			borderColor: "border-amber-500/50 dark:border-amber-400/50",
			titleColor: "text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-500",
		};
	}
	// Low-medium priority (10-14) - muted with slight accent
	if (score >= 10) {
		return {
			level: "medium",
			color: "text-muted-foreground",
			scoreColor: "text-muted-foreground",
			borderColor: "border-muted-foreground/30",
			titleColor: "text-foreground group-hover:text-muted-foreground",
		};
	}
	// Low priority (< 10) - very muted
	return {
		level: "low",
		color: "text-muted-foreground/70",
		scoreColor: "text-muted-foreground/60",
		borderColor: "border-border",
		titleColor: "text-muted-foreground group-hover:text-foreground",
	};
}

/**
 * News Feed Component
 */
export function NewsFeed(): React.ReactElement {
	const session = useSessionStoreSync() as Record<string, unknown> | null;
	const { currentNetworkId } = useNetworkStore();
	const newsScrollRef = useRef<HTMLDivElement>(null);
	const [activeCategory, setActiveCategory] = useState<string>("");
	const [sortBy, setSortBy] = useState<SortOption>("score");
	const [filterBy, setFilterBy] = useState<FilterOption>("all");

	// Dynamically discover all news categories from session
	const newsCategories = useMemo((): NewsCategory[] => {
		const categories: NewsCategory[] = [];
		const seen = new Set<string>();

		if (!session) return categories;

		// Scan session for all keys starting with {network}.runtime.news.
		const newsPrefix = `${currentNetworkId}.runtime.news.`;
		Object.keys(session).forEach((key) => {
			if (key.startsWith(newsPrefix)) {
				// Extract category from key: {network}.runtime.news.{category}
				const categoryKey = key.replace(newsPrefix, "");
				
				// Skip if already seen or empty
				if (!categoryKey || seen.has(categoryKey)) return;
				seen.add(categoryKey);

				// Check if data exists and has raw array
				try {
					const data = session[key] as NewsData | undefined;
					if (data && Array.isArray(data.raw) && data.raw.length > 0) {
						categories.push({
							key: categoryKey,
							label: formatCategoryLabel(categoryKey),
							channel: key,
						});
					}
				} catch {
					// Skip invalid data
				}
			}
		});

		// Sort categories alphabetically by label
		return categories.sort((a, b) => a.label.localeCompare(b.label));
	}, [session, currentNetworkId]);

	// Get news data for all discovered categories
	const allNewsData = useMemo((): Record<string, NewsItem[]> => {
		const result: Record<string, NewsItem[]> = {};

		newsCategories.forEach((category) => {
			try {
				const data = session?.[category.channel] as NewsData | undefined;

				if (data && Array.isArray(data.raw)) {
					result[category.key] = data.raw;
				} else {
					result[category.key] = [];
				}
			} catch {
				result[category.key] = [];
			}
		});

		return result;
	}, [session, newsCategories]);

	// Set active category to first available category
	useEffect(() => {
		if (newsCategories.length > 0 && (!activeCategory || !newsCategories.find((c) => c.key === activeCategory))) {
			setActiveCategory(newsCategories[0].key);
		}
	}, [newsCategories, activeCategory]);

	// Get filtered and sorted news for active category
	const filteredNews = useMemo((): NewsItem[] => {
		const news = allNewsData[activeCategory] || [];

		// Filter by importance level
		let filtered = news;
		if (filterBy !== "all") {
			filtered = news.filter((item) => {
				const importance = getImportanceLevel(item.score || 0);
				return importance.level === filterBy;
			});
		}

		// Sort
		const sorted = [...filtered].sort((a, b) => {
			if (sortBy === "score") {
				return (b.score || 0) - (a.score || 0);
			}
			if (sortBy === "relevance") {
				// Relevance = score / age (higher is more relevant)
				const relevanceA = (a.score || 0) / Math.max(a.ageMs || 1, 1);
				const relevanceB = (b.score || 0) / Math.max(b.ageMs || 1, 1);
				return relevanceB - relevanceA;
			}
			// Sort by time (newest first)
			// @ts-expect-error - TypeScript doesn't infer union types for date subtraction
			return (b.ts || b.pubDate) - (a.ts || a.pubDate);
		});

		return sorted;
	}, [allNewsData, activeCategory, sortBy, filterBy]);

	// Auto-scroll to top when news updates
	useEffect(() => {
		if (filteredNews.length > 0 && newsScrollRef.current) {
			const scrollElement = (newsScrollRef.current.querySelector(
				"[data-slot='scroll-area-viewport']",
			) as HTMLElement) ||
				(newsScrollRef.current.querySelector(
					"[data-radix-scroll-area-viewport]",
				) as HTMLElement);

			if (scrollElement) {
				const rafId = requestAnimationFrame(() => {
					scrollElement.scrollTo({
						top: 0,
						behavior: "smooth",
					});
				});
				return () => cancelAnimationFrame(rafId);
			}
		}
	}, [filteredNews.length, activeCategory, sortBy, filterBy]);

	// If no categories have news, show empty state
	if (newsCategories.length === 0) {
		return (
			<div className="flex-1 border-t border-border bg-background flex flex-col overflow-hidden min-h-0">
				<div className="flex items-center justify-between px-3 py-1.5 border-b border-border flex-shrink-0">
					<h3 className="text-xs font-medium text-foreground">
						News Feed
					</h3>
				</div>
				<div className="flex items-center justify-center h-full min-h-[150px]">
					<p className="text-xs text-muted-foreground">
						No news available
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 border-t border-border bg-background flex flex-col overflow-hidden min-h-0">
			{/* Header with tabs and filters */}
			<div className="flex flex-col border-b border-border bg-background flex-shrink-0">
				{/* Category Tabs */}
				<Tabs
					value={activeCategory}
					onValueChange={setActiveCategory}
					className="w-full"
				>
					<TabsList className="w-full h-8 p-0.5 bg-transparent border-b border-border/50 rounded-none">
						{newsCategories.map((category) => (
							<TabsTrigger
								key={category.key}
								value={category.key}
								className="flex-1 h-7 text-xs data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
							>
								{category.label}
								{allNewsData[category.key]?.length > 0 && (
									<Badge
										variant="secondary"
										className="ml-1.5 text-[9px] px-1 py-0 h-4"
									>
										{allNewsData[category.key].length}
									</Badge>
								)}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>

				{/* Filters - Compact */}
				<div className="flex items-center justify-between px-3 py-1.5 gap-2 border-b border-border/30">
					<div className="flex items-center gap-1.5">
						<Filter className="w-3 h-3 text-muted-foreground" />
						<Select
							value={filterBy}
							onValueChange={(value) => {
								setFilterBy(value as FilterOption);
							}}
						>
							<SelectTrigger className="h-6 w-[100px] text-[10px] border-border/50">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="critical">Critical</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="low">Low</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Select
						value={sortBy}
						onValueChange={(value) => {
							setSortBy(value as SortOption);
						}}
					>
						<SelectTrigger className="h-6 w-[100px] text-[10px] border-border/50">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="score">Score</SelectItem>
							<SelectItem value="relevance">Relevance</SelectItem>
							<SelectItem value="time">Time</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* News List - Compact */}
			<div className="flex-1 overflow-hidden min-h-0">
				<ScrollArea className="h-full" ref={newsScrollRef}>
					<div className="px-2 py-1.5 space-y-1">
						{filteredNews.length === 0 ? (
							<div className="flex items-center justify-center h-full min-h-[150px]">
								<div className="text-center">
									<p className="text-xs text-muted-foreground">
										No news match the current filters
									</p>
								</div>
							</div>
						) : (
							filteredNews.map((item, index) => {
								const sourceName = extractSourceName(
									item.source,
									item.description,
								);
								const timeAgo = formatTimeAgo(item.ageMs || 0);
								const score = item.score || 0;
								const importance = getImportanceLevel(score);

								return (
									<a
										key={`${item.link}-${index}`}
										href={item.link}
										target="_blank"
										rel="noopener noreferrer"
										className="group block"
									>
										<div
											className={cn(
												"px-2.5 py-2 border-l-3 transition-all duration-200 cursor-pointer",
												"hover:bg-muted/20 hover:border-l-4",
												importance.borderColor,
											)}
										>
											{/* Compact header */}
											<div className="flex items-center justify-between gap-2 mb-1">
												<div className="flex items-center gap-1.5 min-w-0 flex-1">
													{/* Score - colored by rating */}
													<span
														className={cn(
															"text-[9px] font-bold font-mono tabular-nums shrink-0 px-1 py-0.5 rounded",
															importance.scoreColor,
															score >= 25 && "bg-primary/10 dark:bg-primary/20",
															score >= 20 && score < 25 && "bg-blue-500/10 dark:bg-blue-500/20",
															score >= 15 && score < 20 && "bg-amber-500/10 dark:bg-amber-500/20",
														)}
													>
														{score}
													</span>

													{/* Source */}
													<span className="text-[9px] text-muted-foreground truncate">
														{sourceName}
													</span>
												</div>

												{/* Time */}
												<span className="text-[9px] text-muted-foreground font-mono shrink-0">
													{timeAgo}
												</span>
											</div>

											{/* Title - colored by rating */}
											<h4
												className={cn(
													"text-xs font-medium leading-relaxed line-clamp-2 transition-colors",
													importance.titleColor,
												)}
											>
												{item.title}
											</h4>
										</div>
									</a>
								);
							})
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
}

