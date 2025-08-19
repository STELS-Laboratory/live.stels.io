import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WidgetData {
	channel: string
	module: string
	widget: string
	raw: {
		source: string
		groupId: string
		indicator: string
		indicatorName: string
		unit: string
		scale?: number
		agg: string
		country: string
		countryName: string
		date: string
		value: number
		decimal: number
	}
	timestamp: number
}

interface MonitoringWidgetProps {
	data: WidgetData
}

export function FredIndicatorWidget({ data }: MonitoringWidgetProps) {
	const { raw } = data
	
	const formatValue = () => {
		let displayValue = raw.value
		
		if (raw.scale) {
			displayValue = raw.value * raw.scale
		}
		
		const formatted = displayValue.toFixed(raw.decimal)
		
		switch (raw.unit) {
			case "pct":
				return `${formatted}%`
			case "per100":
				return `${formatted}/100`
			case "years":
				return `${formatted} yrs`
			case "ratio":
				// Handle different ratio types based on indicator
				if (raw.indicator.includes("EG.USE")) {
					return `${Math.round(displayValue)} kg`
				}
				return formatted
			default:
				return formatted
		}
	}
	
	const getStatusColor = () => {
		const value = raw.scale ? raw.value * raw.scale : raw.value
		
		// Forest coverage
		if (raw.indicator.includes("FRST")) {
			return value > 20 ? "bg-green-500" : value > 10 ? "bg-yellow-500" : "bg-red-500"
		}
		// Internet users
		if (raw.indicator.includes("NET.USER")) {
			return value > 70 ? "bg-green-500" : value > 50 ? "bg-yellow-500" : "bg-red-500"
		}
		// Life expectancy
		if (raw.indicator.includes("LE00")) {
			return value > 70 ? "bg-green-500" : value > 65 ? "bg-yellow-500" : "bg-red-500"
		}
		// Mobile subscriptions
		if (raw.indicator.includes("CEL.SETS")) {
			return value > 100 ? "bg-green-500" : value > 80 ? "bg-yellow-500" : "bg-red-500"
		}
		// R&D expenditure
		if (raw.indicator.includes("XPD.RSDV")) {
			return value > 2 ? "bg-green-500" : value > 1 ? "bg-yellow-500" : "bg-red-500"
		}
		// High-tech exports
		if (raw.indicator.includes("TECH.MF")) {
			return value > 10 ? "bg-green-500" : value > 5 ? "bg-yellow-500" : "bg-red-500"
		}
		// Energy use
		if (raw.indicator.includes("EG.USE")) {
			return value < 2000 ? "bg-green-500" : value < 3000 ? "bg-yellow-500" : "bg-red-500"
		}
		return "bg-blue-500"
	}
	
	const getShortName = () => {
		const name = raw.indicatorName
		if (name.length > 100) {
			return name.substring(0, 100) + "..."
		}
		return name
	}
	
	const formatTimestamp = () => {
		const date = new Date(data.timestamp)
		return date.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
		})
	}
	
	return (
		<Card className="w-120 h-32 relative overflow-hidden hover:shadow-md transition-shadow">
			<CardContent className="p-3 h-full flex flex-col justify-between">
				{/* Header */}
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<h3 className="text-sm font-medium text-foreground truncate leading-tight">{getShortName()}</h3>
						<p className="text-xs text-muted-foreground mt-0.5">
							{raw.countryName} • {raw.date}
						</p>
					</div>
					<div className={`w-2 h-2 rounded-full ${getStatusColor()} ml-2 mt-1 flex-shrink-0`} />
				</div>
				
				{/* Value and metadata */}
				<div className="flex items-end justify-between">
					<div className="flex-1">
						<div className="text-2xl font-bold text-foreground leading-none">{formatValue()}</div>
						<div className="text-xs text-muted-foreground mt-1">Updated {formatTimestamp()}</div>
					</div>
					<div className="flex flex-col items-end gap-1 ml-2">
						<Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-mono">
							{raw.groupId}
						</Badge>
						<span className="text-xs text-muted-foreground font-mono">{raw.source}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
