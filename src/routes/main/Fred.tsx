import { useMemo, useState } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync";
import { filterSession } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Activity,
	BarChart3,
	Globe,
	LineChart,
	PieChart,
	Search,
	TrendingUp,
} from "lucide-react";

interface FredIndicator {
	key: string;
	value: {
		channel: string;
		module: string;
		widget: string;
		raw: {
			source: string;
			groupId: string;
			indicator: string;
			indicatorName: string;
			unit: string;
			scale?: number;
			agg: string;
			invert?: boolean;
			country: string;
			countryName: string;
			date: string;
			value: number;
			decimal: number;
		};
		timestamp: number;
	};
}

interface CountryData {
	country: string;
	countryName: string;
	indicators: FredIndicator[];
	categories: Record<string, FredIndicator[]>;
}

interface CategoryData {
	name: string;
	displayName: string;
	color: string;
	icon: React.ReactNode;
}

const categories: Record<string, CategoryData> = {
	macro: {
		name: "macro",
		displayName: "Macroeconomic",
		color: "bg-blue-500",
		icon: <TrendingUp className="w-4 h-4" />,
	},
	social: {
		name: "social",
		displayName: "Social",
		color: "bg-green-500",
		icon: <Activity className="w-4 h-4" />,
	},
	tech: {
		name: "tech",
		displayName: "Technology",
		color: "bg-purple-500",
		icon: <BarChart3 className="w-4 h-4" />,
	},
	invest: {
		name: "invest",
		displayName: "Investment",
		color: "bg-orange-500",
		icon: <TrendingUp className="w-4 h-4" />,
	},
	external: {
		name: "external",
		displayName: "External Trade",
		color: "bg-red-500",
		icon: <Globe className="w-4 h-4" />,
	},
	fiscal: {
		name: "fiscal",
		displayName: "Fiscal",
		color: "bg-yellow-500",
		icon: <PieChart className="w-4 h-4" />,
	},
	depth: {
		name: "depth",
		displayName: "Financial Depth",
		color: "bg-indigo-500",
		icon: <LineChart className="w-4 h-4" />,
	},
	energy: {
		name: "energy",
		displayName: "Energy",
		color: "bg-teal-500",
		icon: <Activity className="w-4 h-4" />,
	},
};

const formatValue = (
	value: number,
	unit: string,
	decimal: number = 0,
): string => {
	if (unit === "usd") {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: decimal,
			maximumFractionDigits: decimal,
			notation: value > 1e12 ? "compact" : "standard",
		}).format(value);
	}

	if (unit === "pct") {
		return `${value.toFixed(decimal)}%`;
	}

	if (unit === "count") {
		return new Intl.NumberFormat("en-US", {
			notation: value > 1e6 ? "compact" : "standard",
		}).format(value);
	}

	return `${value.toFixed(decimal)} ${unit}`;
};

const getValueColor = (
	value: number,
	unit: string,
	invert?: boolean,
): string => {
	if (unit === "pct") {
		const isGood = invert ? value < 5 : value > 5;
		return isGood ? "text-green-500" : "text-red-500";
	}
	return "text-foreground";
};

const IndicatorCard = ({ indicator }: { indicator: FredIndicator }) => {
	const { raw } = indicator.value;
	const formattedValue = formatValue(raw.value, raw.unit, raw.decimal);
	const valueColor = getValueColor(raw.value, raw.unit, raw.invert);
	const category = categories[raw.groupId];

	return (
		<Card className="h-full hover:shadow-lg transition-all duration-200 border-2 hover:border-amber-500/20">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between mb-3">
					<Badge variant="outline" className="text-xs font-semibold px-2 py-1">
						{raw.country}
					</Badge>
					<div className="flex items-center gap-2">
						{category?.icon}
						<span className="text-xs font-medium text-muted-foreground">
							{category?.displayName}
						</span>
					</div>
				</div>
				<CardTitle className="text-base font-semibold line-clamp-2 leading-tight">
					{raw.indicatorName}
				</CardTitle>
				<CardDescription className="text-xs mt-2">
					{raw.date} • {raw.source}
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-4">
					<div className="text-center">
						<span className="text-xs font-medium text-muted-foreground block mb-2">
							Current Value
						</span>
						<span
							className={`text-3xl font-bold ${valueColor} block leading-none`}
						>
							{formattedValue}
						</span>
					</div>
					<Separator />
					<div className="grid grid-cols-2 gap-3 text-xs">
						<div>
							<span className="text-muted-foreground block">Indicator</span>
							<span className="font-medium">{raw.indicator}</span>
						</div>
						<div>
							<span className="text-muted-foreground block">Unit</span>
							<span className="font-medium">{raw.unit}</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

const CategoryOverview = ({ indicators }: { indicators: FredIndicator[] }) => {
	const categoryStats = useMemo(() => {
		const stats: Record<
			string,
			{ count: number; avgValue: number; countries: Set<string> }
		> = {};

		indicators.forEach((indicator) => {
			const groupId = indicator.value.raw.groupId;
			if (!stats[groupId]) {
				stats[groupId] = { count: 0, avgValue: 0, countries: new Set() };
			}
			stats[groupId].count++;
			stats[groupId].avgValue += indicator.value.raw.value;
			stats[groupId].countries.add(indicator.value.raw.country);
		});

		Object.keys(stats).forEach((key) => {
			stats[key].avgValue /= stats[key].count;
		});

		return stats;
	}, [indicators]);

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
			{Object.entries(categoryStats).map(([category, stats]) => {
				const categoryInfo = categories[category];
				if (!categoryInfo) return null;

				return (
					<Card
						key={category}
						className="text-center hover:shadow-md transition-shadow border-2"
					>
						<CardContent className="pt-8 pb-6">
							<div
								className={`w-12 h-12 mx-auto mb-4 rounded-full ${categoryInfo.color} flex items-center justify-center shadow-lg`}
							>
								<div className="text-foreground">
									{categoryInfo.icon}
								</div>
							</div>
							<h3 className="font-bold text-lg mb-2">
								{categoryInfo.displayName}
							</h3>
							<p className="text-4xl font-black text-amber-500 mb-2">
								{stats.count}
							</p>
							<p className="text-sm text-muted-foreground font-medium">
								{stats.countries.size} countries
							</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
};

const CountryComparison = ({ countries }: { countries: CountryData[] }) => {
	const [selectedIndicator, setSelectedIndicator] = useState<string>("");

	const availableIndicators = useMemo(() => {
		const indicators = new Set<string>();
		countries.forEach((country) => {
			country.indicators.forEach((indicator) => {
				indicators.add(indicator.value.raw.indicatorName);
			});
		});
		return Array.from(indicators).sort();
	}, [countries]);

	const comparisonData = useMemo(() => {
		if (!selectedIndicator) return [];

		return countries.map((country) => {
			const indicator = country.indicators.find(
				(ind) => ind.value.raw.indicatorName === selectedIndicator,
			);
			return {
				country: country.countryName,
				value: indicator?.value.raw.value || 0,
				unit: indicator?.value.raw.unit || "",
				decimal: indicator?.value.raw.decimal || 0,
			};
		}).filter((item) => item.value > 0);
	}, [countries, selectedIndicator]);

	const maxValue = Math.max(...comparisonData.map((d) => d.value));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="w-5 h-5" />
					Country Comparison
				</CardTitle>
				<Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
					<SelectTrigger>
						<SelectValue placeholder="Select indicator to compare" />
					</SelectTrigger>
					<SelectContent>
						{availableIndicators.map((indicator) => (
							<SelectItem key={indicator} value={indicator}>
								{indicator}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</CardHeader>
			<CardContent>
				{selectedIndicator && comparisonData.length > 0
					? (
						<div className="space-y-4">
							{comparisonData.map((item) => (
								<div key={item.country} className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="font-medium">{item.country}</span>
										<span className="text-sm text-muted-foreground">
											{formatValue(item.value, item.unit, item.decimal)}
										</span>
									</div>
									<Progress
										value={(item.value / maxValue) * 100}
										className="h-2"
									/>
								</div>
							))}
						</div>
					)
					: (
						<div className="text-center py-8 text-muted-foreground">
							Select an indicator to view country comparison
						</div>
					)}
			</CardContent>
		</Card>
	);
};

function Fred() {
	const session = useSessionStoreSync() as any;
	const [selectedCountry, setSelectedCountry] = useState<string>("all");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	const fredData = filterSession(
		session || {},
		/\.fred\..*\.indicator$/,
	) as FredIndicator[];

	const countries = useMemo(() => {
		const countryMap = new Map<string, CountryData>();

		fredData.forEach((indicator) => {
			const { country, countryName, groupId } = indicator.value.raw;

			if (!countryMap.has(country)) {
				countryMap.set(country, {
					country,
					countryName,
					indicators: [],
					categories: {},
				});
			}

			const countryData = countryMap.get(country)!;
			countryData.indicators.push(indicator);

			if (!countryData.categories[groupId]) {
				countryData.categories[groupId] = [];
			}
			countryData.categories[groupId].push(indicator);
		});

		return Array.from(countryMap.values()).sort((a, b) =>
			a.countryName.localeCompare(b.countryName)
		);
	}, [fredData]);

	const filteredCountries = useMemo(() => {
		let filtered = countries;

		if (selectedCountry !== "all") {
			filtered = filtered.filter((country) =>
				country.country === selectedCountry
			);
		}

		if (searchTerm) {
			filtered = filtered.map((country) => ({
				...country,
				indicators: country.indicators.filter((indicator) =>
					indicator.value.raw.indicatorName.toLowerCase().includes(
						searchTerm.toLowerCase(),
					) ||
					indicator.value.raw.countryName.toLowerCase().includes(
						searchTerm.toLowerCase(),
					)
				),
			})).filter((country) => country.indicators.length > 0);
		}

		if (selectedCategory !== "all") {
			filtered = filtered.map((country) => ({
				...country,
				indicators: country.indicators.filter((indicator) =>
					indicator.value.raw.groupId === selectedCategory
				),
			})).filter((country) => country.indicators.length > 0);
		}

		return filtered;
	}, [countries, selectedCountry, searchTerm, selectedCategory]);

	const allIndicators = useMemo(() => {
		return filteredCountries.flatMap((country) => country.indicators);
	}, [filteredCountries]);

	return (
		<div className="container mx-auto p-6 space-y-8">
			{/* Header */}
			<div className="flex flex-col gap-6">
				<div className="text-center">
					<h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
						World Bank Group
					</h1>
					<p className="text-lg text-muted-foreground font-medium">
						Real-time economic data from World Development Indicators
					</p>
				</div>

				{/* Filters */}
				<div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
							<Input
								placeholder="Search indicators or countries..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-12 h-12 text-base"
							/>
						</div>
					</div>

					<Select value={selectedCountry} onValueChange={setSelectedCountry}>
						<SelectTrigger className="w-full sm:w-[220px] h-12 text-base">
							<SelectValue placeholder="Select country" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Countries</SelectItem>
							{countries.map((country) => (
								<SelectItem key={country.country} value={country.country}>
									{country.countryName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={selectedCategory} onValueChange={setSelectedCategory}>
						<SelectTrigger className="w-full sm:w-[220px] h-12 text-base">
							<SelectValue placeholder="Select category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{Object.entries(categories).map(([key, category]) => (
								<SelectItem key={key} value={key}>
									{category.displayName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card className="border-2 hover:shadow-lg transition-shadow">
					<CardContent className="pt-8 pb-6">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
								<Globe className="w-6 h-6 text-foreground" />
							</div>
							<div>
								<p className="text-sm font-semibold text-muted-foreground mb-1">
									Countries
								</p>
								<p className="text-3xl font-black text-blue-600">
									{countries.length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 hover:shadow-lg transition-shadow">
					<CardContent className="pt-8 pb-6">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
								<BarChart3 className="w-6 h-6 text-foreground" />
							</div>
							<div>
								<p className="text-sm font-semibold text-muted-foreground mb-1">
									Indicators
								</p>
								<p className="text-3xl font-black text-green-600">
									{allIndicators.length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 hover:shadow-lg transition-shadow">
					<CardContent className="pt-8 pb-6">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
								<PieChart className="w-6 h-6 text-foreground" />
							</div>
							<div>
								<p className="text-sm font-semibold text-muted-foreground mb-1">
									Categories
								</p>
								<p className="text-3xl font-black text-purple-600">
									{Object.keys(categories).length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 hover:shadow-lg transition-shadow">
					<CardContent className="pt-8 pb-6">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
								<Activity className="w-6 h-6 text-foreground" />
							</div>
							<div>
								<p className="text-sm font-semibold text-muted-foreground mb-1">
									Latest Update
								</p>
								<p className="text-lg font-bold text-orange-600">
									{allIndicators.length > 0
										? new Date(allIndicators[0].value.timestamp)
											.toLocaleDateString()
										: "N/A"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3 h-14">
					<TabsTrigger value="overview" className="text-base font-semibold">
						Overview
					</TabsTrigger>
					<TabsTrigger value="indicators" className="text-base font-semibold">
						Indicators
					</TabsTrigger>
					<TabsTrigger value="comparison" className="text-base font-semibold">
						Comparison
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-8">
					<CategoryOverview indicators={allIndicators} />

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<Card className="border-2">
							<CardHeader>
								<CardTitle className="text-xl font-bold">
									Top Indicators by Category
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									{Object.entries(categories).map(([key, category]) => {
										const categoryIndicators = allIndicators.filter(
											(ind) => ind.value.raw.groupId === key,
										);
										if (categoryIndicators.length === 0) return null;

										return (
											<div
												key={key}
												className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
											>
												<div className="flex items-center gap-3">
													<div
														className={`w-4 h-4 rounded-full ${category.color}`}
													/>
													<span className="text-base font-semibold">
														{category.displayName}
													</span>
												</div>
												<Badge
													variant="secondary"
													className="text-lg font-bold px-4 py-2"
												>
													{categoryIndicators.length}
												</Badge>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>

						<Card className="border-2">
							<CardHeader>
								<CardTitle className="text-xl font-bold">
									Countries Coverage
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{countries.map((country) => (
										<div
											key={country.country}
											className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
										>
											<span className="text-base font-semibold">
												{country.countryName}
											</span>
											<Badge
												variant="outline"
												className="text-lg font-bold px-4 py-2"
											>
												{country.indicators.length}
											</Badge>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="indicators" className="space-y-8">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold">
							Economic Indicators ({allIndicators.length})
						</h2>
						<Button variant="outline" size="lg" className="h-12 px-6">
							Export Data
						</Button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{allIndicators.map((indicator, index) => (
							<IndicatorCard
								key={`${indicator.key}-${index}`}
								indicator={indicator}
							/>
						))}
					</div>

					{allIndicators.length === 0 && (
						<div className="text-center py-16">
							<BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
							<h3 className="text-2xl font-bold mb-4">No indicators found</h3>
							<p className="text-lg text-muted-foreground">
								Try adjusting your filters to see more results
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent value="comparison" className="space-y-8">
					<CountryComparison countries={countries} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

export default Fred;
