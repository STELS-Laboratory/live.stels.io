function NewsBox({data, type}: { data: any; type: "finance" | "global" | "ukraine" }) {
	const getTypeColor = () => {
		return "from-zinc-800/40 to-zinc-900/40 border-border/30"
	}
	
	const formatTimeAgo = (ageMs: number) => {
		const minutes = Math.floor(ageMs / 60000)
		const hours = Math.floor(minutes / 60)
		const days = Math.floor(hours / 24)
		
		if (days > 0) return `${days}d ago`
		if (hours > 0) return `${hours}h ago`
		return `${minutes}m ago`
	}
	
	const extractSource = (description: string) => {
		const match = description.match(/<font color="#6f6f6f">(.*?)<\/font>/)
		return match ? match[1] : "Trust"
	}
	
	const cleanTitle = (title: string) => {
		// Remove source suffix if present
		return title.replace(/ - [^-]*$/, "")
	}
	
	const getImportanceLevel = (score: number) => {
		if (score >= 50) return "critical"
		if (score >= 40) return "high"
		if (score >= 25) return "medium"
		return "low"
	}
	
	const getImportanceStyles = (score: number) => {
		const level = getImportanceLevel(score)
		
		switch (level) {
			case "critical":
				return {
					border: "border-red-500/60 shadow-red-500/20",
					bg: "bg-red-950/30 hover:bg-red-950/50",
					glow: "shadow-lg shadow-red-500/10",
					ratingBg: "bg-red-900/60 border-red-500/40",
					ratingText: "text-red-300",
					titleText: "text-red-100",
					indicator: "bg-red-500",
				}
			case "high":
				return {
					border: "border-amber-500/60 shadow-amber-500/20",
					bg: "bg-amber-950/30 hover:bg-amber-950/50",
					glow: "shadow-md shadow-amber-500/10",
					ratingBg: "bg-amber-900/60 border-amber-500/40",
					ratingText: "text-amber-300",
					titleText: "text-amber-100",
					indicator: "bg-amber-500",
				}
			case "medium":
				return {
					border: "border-blue-500/40 shadow-blue-500/10",
					bg: "bg-blue-950/20 hover:bg-blue-950/40",
					glow: "shadow-sm shadow-blue-500/5",
					ratingBg: "bg-blue-900/40 border-blue-500/30",
					ratingText: "text-blue-300",
					titleText: "text-blue-100",
					indicator: "bg-blue-500",
				}
			default:
				return {
					border: "border-border/40",
					bg: "bg-card/30 hover:bg-card/50",
					glow: "",
					ratingBg: "bg-muted/60 border-muted/30",
					ratingText: "text-muted-foreground",
					titleText: "text-foreground",
					indicator: "bg-zinc-500",
				}
		}
	}
	
	return (
		<div className={`w-[1044px] bg-gradient-to-br ${getTypeColor()} backdrop-blur-sm border shadow-lg p-6`}>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="w-3 h-3 rounded-full bg-zinc-500 shadow-sm"/>
					<h2 className="text-xl font-medium text-card-foreground uppercase tracking-wide">{type} News</h2>
				</div>
				<div className="text-sm text-muted-foreground font-mono">{data?.raw?.length || 0} articles</div>
			</div>
			
			{/* News Feed */}
			<div
				className="space-y-4 max-h-323 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
				{data?.raw?.map((article: any, index: number) => {
					const styles = getImportanceStyles(article.score)
					const importance = getImportanceLevel(article.score)
					
					return (
						<div
							key={index}
							className={`${styles.bg} rounded-lg p-4 border ${styles.border} ${styles.glow} transition-all duration-300 relative`}
						>
							<div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.indicator} rounded-l-lg`}/>
							
							<div className="absolute top-2 right-2">
								<div
									className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${styles.ratingBg} ${styles.ratingText} border ${styles.border.split(" ")[0]}`}
								>
									{importance}
								</div>
							</div>
							
							{/* Article Header */}
							<div className="flex items-start justify-between gap-4 mb-3 pr-16">
								<div className="flex-1">
									<h3
										className={`${styles.titleText} font-medium text-base leading-tight mb-2 hover:text-foreground transition-colors`}
									>
										<a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
											{cleanTitle(article.title)}
										</a>
									</h3>
									
									<div className="flex items-center gap-4 text-sm">
										<span className="text-muted-foreground font-medium">{extractSource(article.description)}</span>
										<span className="text-muted-foreground">•</span>
										<span className="text-muted-foreground font-mono">{formatTimeAgo(article.ageMs)}</span>
									</div>
								</div>
								
								<div
									className={`flex flex-col items-center ${styles.ratingBg} rounded-lg px-3 py-2 border ${styles.border.split(" ")[0]}`}
								>
									<div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Rating</div>
									<div className={`text-2xl font-bold ${styles.ratingText} font-mono leading-none`}>
										{article.score}
									</div>
									<div className="flex gap-1 mt-1">
										{[...Array(5)].map((_, i) => (
											<div
												key={i}
												className={`w-1.5 h-1.5 rounded-full ${
													i < Math.floor(article.score / 20) ? styles.indicator : "bg-zinc-600"
												}`}
											/>
										))}
									</div>
								</div>
							</div>
							
							{/* Timestamp */}
							<div className="text-xs text-muted-foreground font-mono">{new Date(article.pubDate).toLocaleString()}</div>
						</div>
					)
				})}
			</div>
			
			{/* Footer Stats */}
			{data?.timestamp && (
				<div
					className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground font-mono">
					<span>Last updated: {new Date(data.timestamp).toLocaleTimeString()}</span>
					<span>Source: {data.channel}</span>
				</div>
			)}
		</div>
	)
}

export default NewsBox
