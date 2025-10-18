import React, { useMemo, useState } from "react";

/**
 * Interface for timezone data structure
 */
// interface TimezoneData {
// 	location: string;
// 	time: string;
// 	date: string;
// 	offset: string;
// 	city: string;
// 	country: string;
// }

// interface TimezoneWidgetData {
// 	channel: string;
// 	module: string;
// 	widget: string;
// 	raw: {
// 		timezone: TimezoneData[];
// 	};
// 	timestamp: number;
// }

/**
 * Analog clock component with SVG graphics
 */
interface AnalogClockProps {
	time: string;
	location: string;
	city: string;
	country: string;
	offset: string;
}

const AnalogClock: React.FC<AnalogClockProps> = (
	{ time, location, city, country, offset },
) => {
	const [hours, minutes, seconds] = time.split(":").map(Number);

	// Calculate angles for clock hands
	const secondAngle = (seconds * 6) - 90; // 6 degrees per second
	const minuteAngle = (minutes * 6 + seconds * 0.1) - 90; // 6 degrees per minute + slight movement from seconds
	const hourAngle = (hours * 30 + minutes * 0.5) - 90; // 30 degrees per hour + slight movement from minutes

	// Determine if it's day or night (6 AM to 6 PM = day)
	const isDay = hours >= 6 && hours < 18;

	// Theme colors based on day/night
	const themeColors = {
		background: isDay ? "bg-card" : "bg-background",
		clockStroke: isDay ? "orange" : "#f59e0b", // Dark for day, amber for night
		handColor: isDay ? "orange" : "#f59e0b", // Dark for day, amber for night
		secondHand: isDay ? "green" : "#ef4444", // Red for both
		centerDot: isDay ? "orange" : "#f59e0b", // Dark for day, amber for night
		numbers: isDay ? "orange" : "#d1d5db", // Dark gray for day, light gray for night
		cityText: isDay ? "text-foreground" : "text-foreground",
		countryText: isDay ? "text-card-foreground" : "text-muted-foreground",
		timeText: isDay ? "text-card-foreground" : "text-amber-500",
		offsetText: isDay ? "text-muted-foreground" : "text-muted-foreground",
		gradientStart: isDay ? "#1f2937" : "#f59e0b",
		gradientEnd: isDay ? "#6b7280" : "#f59e0b",
	};

	return (
		<div
			className={`flex flex-col items-center p-4 ${themeColors.background} rounded-xl transition-all duration-500 group`}
		>
			{/* Clock Face */}
			<div className="relative w-26 h-26 mb-3">
				<svg className="w-full h-full" viewBox="0 0 100 100">
					{/* Clock face */}
					<circle
						cx="50"
						cy="50"
						r="48"
						fill="none"
						stroke={`url(#clockGradient-${city}-${country})`}
						strokeWidth="2"
						className="group-hover:stroke-amber-500/40 transition-colors duration-500"
					/>

					{/* Clock numbers */}
					{[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, index) => {
						const angle = (index * 30) * (Math.PI / 180);
						const x = 50 + 38 * Math.cos(angle - Math.PI / 2);
						const y = 50 + 38 * Math.sin(angle - Math.PI / 2);
						return (
							<text
								key={num}
								x={x}
								y={y}
								textAnchor="middle"
								dominantBaseline="central"
								fill={themeColors.numbers}
								className="text-xs font-medium transition-colors duration-500"
								fontSize="8"
							>
								{num}
							</text>
						);
					})}

					{/* Hour hand */}
					<line
						x1="50"
						y1="50"
						x2={50 + 20 * Math.cos(hourAngle * Math.PI / 180)}
						y2={50 + 20 * Math.sin(hourAngle * Math.PI / 180)}
						stroke="#f59e0b"
						strokeWidth="3"
						strokeLinecap="round"
						className="drop-shadow-sm"
					/>

					{/* Minute hand */}
					<line
						x1="50"
						y1="50"
						x2={50 + 30 * Math.cos(minuteAngle * Math.PI / 180)}
						y2={50 + 30 * Math.sin(minuteAngle * Math.PI / 180)}
						stroke="#f59e0b"
						strokeWidth="2"
						strokeLinecap="round"
						className="drop-shadow-sm"
					/>

					{/* Second hand */}
					<line
						x1="50"
						y1="50"
						x2={50 + 35 * Math.cos(secondAngle * Math.PI / 180)}
						y2={50 + 35 * Math.sin(secondAngle * Math.PI / 180)}
						stroke="#ef4444"
						strokeWidth="1"
						strokeLinecap="round"
						className="drop-shadow-sm"
					/>

					{/* Center dot */}
					<circle
						cx="50"
						cy="50"
						r="3"
						fill="#f59e0b"
						className="drop-shadow-sm"
					/>

					{/* Gradient definitions */}
					<defs>
						<linearGradient
							id="clockGradient"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="100%"
						>
							<stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
							<stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
						</linearGradient>
					</defs>
				</svg>
			</div>

			{/* Location info */}
			<div className="text-center">
				<h3
					className={`text-sm font-semibold ${themeColors.cityText} truncate max-w-32 transition-colors duration-500`}
					title={location}
				>
					{city}
				</h3>
				<p
					className={`text-xs ${themeColors.countryText} truncate max-w-32 transition-colors duration-500`}
					title={country}
				>
					{country}
				</p>
				<p
					className={`text-xs ${themeColors.timeText} font-mono mt-1 transition-colors duration-500`}
				>
					{time}
				</p>
				<p
					className={`text-xs ${themeColors.offsetText} transition-colors duration-500`}
				>
					{offset}
				</p>
			</div>
		</div>
	);
};

/**
 * TimeZone data interface
 */
interface TimezoneData {
	location: string;
	city: string;
	country: string;
	offset: string;
	time: string;
}

interface TimeZoneWidgetData {
	raw?: {
		timezone?: TimezoneData[];
	};
	timestamp?: number;
}

/**
 * Main TimeZone widget component
 */
const TimeZone: React.FC<{ data: TimeZoneWidgetData }> = ({ data }) => {
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [selectedRegion, setSelectedRegion] = useState<string>("all");

	// Extract timezones from data
	const timezones = useMemo(() => data?.raw?.timezone || [], [data]);

	// // Get unique regions for filter
	// const regions = useMemo(() => {
	// 	const regionSet = new Set(timezones.map((tz: any) => tz.country));
	// 	return ["all", ...Array.from(regionSet).sort()];
	// }, [timezones]);

	// Filter timezones based on search and region
	const filteredTimezones = useMemo(() => {
		return timezones.filter((tz: TimezoneData) => {
			const matchesSearch =
				tz.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
				tz.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
				tz.country.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesRegion = selectedRegion === "all" ||
				tz.country === selectedRegion;

			return matchesSearch && matchesRegion;
		});
	}, [timezones, searchTerm, selectedRegion]);

	return (
		<div className="w-[1240px] h-[1270px] bg-background p-6 overflow-hidden">
			{/* Controls */}
			<div className="flex flex-col sm:flex-row gap-4 mb-6">
				{/* Search */}
				<div className="flex-1">
					<input
						type="text"
						placeholder="Search cities or countries..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full px-4 py-2 bg-card border border-border rounded text-foreground placeholder-muted-foreground focus:border-amber-500 focus:outline-none transition-colors"
					/>
				</div>

				{/* Region Filter */}
				<div className="sm:w-48">
					<select
						value={selectedRegion}
						onChange={(e) => setSelectedRegion(e.target.value)}
						className="w-full px-4 py-2 bg-card border border-border rounded text-foreground focus:border-amber-500 focus:outline-none transition-colors"
					>
						{/*{regions.map((region) => (*/}
						{/*	<option key={region} value={region}>*/}
						{/*		{region === "all" ? "All Regions" : region}*/}
						{/*	</option>*/}
						{/*))}*/}
					</select>
				</div>
			</div>

			{/* Stats */}
			<div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
				<span>
					Showing {filteredTimezones.length} of {timezones.length} timezones
				</span>
				<span className="text-amber-500">
					{new Date(data?.timestamp || Date.now()).toLocaleTimeString()}
				</span>
			</div>

			{/* Clocks Horizontal Grid */}
			<div className="grid grid-cols-4 gap-4 overflow-y-auto pr-2">
				{filteredTimezones.map((timezone: TimezoneData, index: number) => (
					<AnalogClock
						key={`${timezone.city}-${timezone.country}-${index}`}
						time={timezone.time}
						location={timezone.location}
						city={timezone.city}
						country={timezone.country}
						offset={timezone.offset}
					/>
				))}
			</div>

			{/* Empty state */}
			{filteredTimezones.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
					<svg
						className="w-16 h-16 mb-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p className="text-lg font-medium mb-2">No timezones found</p>
					<p className="text-sm">
						Try adjusting your search or filter criteria
					</p>
				</div>
			)}
		</div>
	);
};

export default TimeZone;
