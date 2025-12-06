/**
 * Token Detail Modal Component
 * Displays detailed information about a selected token
 */

import * as React from "react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	X,
	Info,
	Coins,
	Building2,
	Wallet,
	Settings,
	TrendingUp,
	Copy,
	ExternalLink,
} from "lucide-react";
import type { Token } from "@/types/token";

interface TokenDetailModalProps {
	token: Token | null;
	price: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Format supply value
 * Values come in human-readable format (already in main units, not smallest units)
 */
function formatSupply(value: string, decimals: number): string {
	const num = parseFloat(value);
	if (isNaN(num)) return "N/A";
	
	// Values are already in main units, no need to divide by 10^decimals
	const adjusted = num;
	
	return adjusted.toLocaleString(undefined, {
		maximumFractionDigits: decimals,
		minimumFractionDigits: 0,
	});
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text: string): void {
	navigator.clipboard.writeText(text).catch(() => {
		// Fallback for older browsers
		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand("copy");
		document.body.removeChild(textArea);
	});
}

/**
 * Format price value
 */
function formatPrice(price: number | null): string {
	if (price === null || price === undefined) return "N/A";
	
	if (price >= 1_000_000) {
		return `$${(price / 1_000_000).toFixed(2)}M`;
	}
	if (price >= 1_000) {
		return `$${(price / 1_000).toFixed(2)}K`;
	}
	if (price >= 1) {
		return `$${price.toFixed(2)}`;
	}
	if (price >= 0.01) {
		return `$${price.toFixed(4)}`;
	}
	return `$${price.toFixed(8)}`;
}

/**
 * Format USD value
 */
function formatUSD(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

/**
 * Token Detail Modal Component
 */
export function TokenDetailModal({
	token,
	price,
	open,
	onOpenChange,
}: TokenDetailModalProps): React.ReactElement | null {
	const [activeTab, setActiveTab] = React.useState<string>("overview");

	if (!token) {
		return null;
	}

	const metadata = token.metadata;
	const economics = token.economics;
	const issuer = token.issuer;
	const supply = economics?.supply;
	const distribution = economics?.distribution || [];
	const hasDistribution = distribution.length > 0;

	// Calculate distribution percentages
	// Values are already in main units, no need to adjust for decimals
	const initialSupplyNum = supply?.initial ? parseFloat(supply.initial) : 0;
	const maxSupplyNum = supply?.max ? parseFloat(supply.max) : null; // null means unlimited
	
	// For USDT, use fixed price of 1
	const symbolUpper = metadata.symbol.toUpperCase();
	const displayPrice = symbolUpper === "USDT" ? 1 : price;
	
	const parameters = token.parameters;
	
	// Calculate market cap (supply * price)
	const marketCap = displayPrice !== null && initialSupplyNum > 0
		? initialSupplyNum * displayPrice
		: null;
	const maxMarketCap = displayPrice !== null && maxSupplyNum !== null && maxSupplyNum > 0
		? maxSupplyNum * displayPrice
		: null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0"
				showCloseButton={false}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Token Details</DialogTitle>
					<DialogDescription>
						Detailed information about the selected token
					</DialogDescription>
					<DialogDescription>
						Detailed information about token
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col">
					{/* Header */}
					<div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
					<div className="flex items-center gap-4 flex-1 min-w-0">
						{/* Token Icon */}
						<div className="w-16 h-16 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
							{metadata.icon
								? (
									<img
										src={metadata.icon}
										alt={metadata.symbol}
										className="w-[70%] h-[70%] object-contain"
									/>
								)
								: (
									<Coins className="w-8 h-8 text-amber-500/50" />
								)}
						</div>
						<div className="flex-1 min-w-0">
							<h2 className="text-xl font-bold text-foreground truncate">
								{metadata.name}
							</h2>
							<div className="flex items-center gap-2 mt-1">
								<Badge
									variant="outline"
									className="text-xs font-mono border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
								>
									{metadata.symbol}
								</Badge>
								{token.standard && (
									<Badge variant="outline" className="text-xs capitalize">
										{token.standard}
									</Badge>
								)}
								{token.status && (
									<Badge
										variant={token.status === "pending" ? "outline" : "default"}
										className="text-xs"
									>
										{token.status}
									</Badge>
								)}
							</div>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onOpenChange(false)}
						className="h-8 w-8 p-0 shrink-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Content */}
				<ScrollArea className="flex-1">
					<div className="p-6">
						<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
							<TabsList className="w-full justify-start">
								<TabsTrigger value="overview" className="flex items-center gap-2">
									<Info className="h-4 w-4" />
									Overview
								</TabsTrigger>
								<TabsTrigger value="economics" className="flex items-center gap-2">
									<TrendingUp className="h-4 w-4" />
									Economics
								</TabsTrigger>
								<TabsTrigger value="parameters" className="flex items-center gap-2">
									<Settings className="h-4 w-4" />
									Parameters
								</TabsTrigger>
								<TabsTrigger value="issuer" className="flex items-center gap-2">
									<Building2 className="h-4 w-4" />
									Issuer
								</TabsTrigger>
							</TabsList>

							{/* Overview Tab */}
							<TabsContent value="overview" className="mt-6 space-y-4">
								{/* Price Card */}
								{displayPrice !== null && (
									<Card>
										<CardHeader>
											<CardTitle className="text-base">Price Information</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="text-xs text-muted-foreground">Current Price</label>
													<p className="text-2xl font-bold text-foreground mt-1">
														{formatPrice(displayPrice)}
													</p>
												</div>
												{marketCap !== null && (
													<div>
														<label className="text-xs text-muted-foreground">Market Cap</label>
														<p className="text-xl font-bold text-foreground mt-1">
															{formatUSD(marketCap)}
														</p>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								)}

								<Card>
									<CardHeader>
										<CardTitle className="text-base">Token Information</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="text-xs text-muted-foreground">Token ID</label>
												<div className="flex items-center gap-2 mt-1">
													<code className="text-xs font-mono text-foreground break-all">
														{token.id || "N/A"}
													</code>
													{token.id && (
														<Button
															variant="ghost"
															size="sm"
															className="h-6 w-6 p-0"
															onClick={() => copyToClipboard(token.id)}
														>
															<Copy className="h-3 w-3" />
														</Button>
													)}
												</div>
											</div>
											<div>
												<label className="text-xs text-muted-foreground">Decimals</label>
												<p className="text-sm font-semibold text-foreground mt-1">
													{metadata.decimals}
												</p>
											</div>
											{token.created_at && (
												<div>
													<label className="text-xs text-muted-foreground">Created At</label>
													<p className="text-sm text-foreground mt-1">
														{new Date(token.created_at).toLocaleString()}
													</p>
												</div>
											)}
											{token.activation_time && (
												<div>
													<label className="text-xs text-muted-foreground">Activation Time</label>
													<p className="text-sm text-foreground mt-1">
														{new Date(token.activation_time).toLocaleString()}
													</p>
												</div>
											)}
										</div>
										{metadata.description && (
											<div>
												<label className="text-xs text-muted-foreground">Description</label>
												<p className="text-sm text-foreground mt-1">
													{metadata.description}
												</p>
											</div>
										)}
										{metadata.website && (
											<div>
												<label className="text-xs text-muted-foreground">Website</label>
												<div className="flex items-center gap-2 mt-1">
													<a
														href={metadata.website}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm text-primary hover:underline flex items-center gap-1"
													>
														{metadata.website}
														<ExternalLink className="h-3 w-3" />
													</a>
												</div>
											</div>
										)}
									</CardContent>
								</Card>

								{/* Network Info */}
								<Card>
									<CardHeader>
										<CardTitle className="text-base">Network</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="text-xs text-muted-foreground">Network ID</label>
												<p className="text-sm font-semibold text-foreground mt-1">
													{token.network?.id || "N/A"}
												</p>
											</div>
											{token.network?.name && (
												<div>
													<label className="text-xs text-muted-foreground">Network Name</label>
													<p className="text-sm text-foreground mt-1">
														{token.network.name}
													</p>
												</div>
											)}
											{token.network?.chain_id !== undefined && (
												<div>
													<label className="text-xs text-muted-foreground">Chain ID</label>
													<p className="text-sm text-foreground mt-1">
														{token.network.chain_id}
													</p>
												</div>
											)}
											{token.network?.environment && (
												<div>
													<label className="text-xs text-muted-foreground">Environment</label>
													<Badge variant="outline" className="text-xs mt-1">
														{token.network.environment}
													</Badge>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							{/* Economics Tab */}
							<TabsContent value="economics" className="mt-6 space-y-4">
								{/* Price and Market Cap */}
								{displayPrice !== null && (
									<Card>
										<CardHeader>
											<CardTitle className="text-base">Price & Market Cap</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="text-xs text-muted-foreground">Current Price</label>
													<p className="text-xl font-bold text-foreground mt-1">
														{formatPrice(displayPrice)}
													</p>
												</div>
												{marketCap !== null && (
													<div>
														<label className="text-xs text-muted-foreground">Market Cap</label>
														<p className="text-xl font-bold text-foreground mt-1">
															{formatUSD(marketCap)}
														</p>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								)}

								<Card>
									<CardHeader>
										<CardTitle className="text-base">Supply Information</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											{supply?.initial && (
												<div>
													<label className="text-xs text-muted-foreground">Initial Supply</label>
													<p className="text-lg font-bold text-foreground mt-1">
														{formatSupply(supply.initial, metadata.decimals)} {metadata.symbol}
													</p>
													{marketCap !== null && (
														<p className="text-sm text-muted-foreground mt-1">
															{formatUSD(marketCap)}
														</p>
													)}
												</div>
											)}
											<div>
												<label className="text-xs text-muted-foreground">Max Supply</label>
												{supply?.max ? (
													<>
														<p className="text-lg font-bold text-foreground mt-1">
															{formatSupply(supply.max, metadata.decimals)} {metadata.symbol}
														</p>
														{maxMarketCap !== null && (
															<p className="text-sm text-muted-foreground mt-1">
																{formatUSD(maxMarketCap)}
															</p>
														)}
													</>
												) : (
													<p className="text-lg font-bold text-foreground mt-1">
														Unlimited
													</p>
												)}
											</div>
											{supply?.mintingPolicy && (
												<div>
													<label className="text-xs text-muted-foreground">Minting Policy</label>
													<Badge variant="outline" className="text-xs mt-1 capitalize">
														{supply.mintingPolicy}
													</Badge>
												</div>
											)}
										</div>
									</CardContent>
								</Card>

								{/* Distribution */}
								{hasDistribution && (
									<Card>
										<CardHeader>
											<CardTitle className="text-base flex items-center gap-2">
												<Wallet className="h-4 w-4" />
												Distribution ({distribution.length} holders)
											</CardTitle>
										</CardHeader>
										<CardContent>
											<ScrollArea className="h-[300px]">
												<div className="space-y-3">
													{distribution.map((holder, index) => {
														const amount = parseFloat(holder.amount);
														const percentage = initialSupplyNum > 0
															? (amount / initialSupplyNum) * 100
															: 0;
														const holderValue = displayPrice !== null && amount > 0
															? amount * displayPrice
															: null;
														return (
															<div
																key={index}
																className="flex items-center justify-between p-3 border border-border rounded"
															>
																<div className="flex-1 min-w-0">
																	<div className="flex items-center gap-2">
																		<code className="text-xs font-mono text-foreground truncate">
																			{holder.address}
																		</code>
																		<Button
																			variant="ghost"
																			size="sm"
																			className="h-5 w-5 p-0"
																			onClick={() => copyToClipboard(holder.address)}
																		>
																			<Copy className="h-3 w-3" />
																		</Button>
																	</div>
																	<div className="mt-1 space-y-0.5">
																		<div className="text-xs text-muted-foreground">
																			{formatSupply(holder.amount, metadata.decimals)} {metadata.symbol} ({percentage.toFixed(2)}%)
																		</div>
																		{holderValue !== null && (
																			<div className="text-xs font-semibold text-foreground">
																				{formatUSD(holderValue)}
																			</div>
																		)}
																	</div>
																</div>
															</div>
														);
													})}
												</div>
											</ScrollArea>
										</CardContent>
									</Card>
								)}

								{/* Fee Structure */}
								{economics?.feeStructure && (
									<Card>
										<CardHeader>
											<CardTitle className="text-base">Fee Structure</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												{economics.feeStructure.transfer && (
													<div className="flex items-center justify-between">
														<span className="text-sm text-muted-foreground">Transfer Fee</span>
														<span className="text-sm font-semibold text-foreground">
															{economics.feeStructure.transfer}
														</span>
													</div>
												)}
												{economics.feeStructure.minting && (
													<div className="flex items-center justify-between">
														<span className="text-sm text-muted-foreground">Minting Fee</span>
														<span className="text-sm font-semibold text-foreground">
															{economics.feeStructure.minting}
														</span>
													</div>
												)}
												{economics.feeStructure.burning && (
													<div className="flex items-center justify-between">
														<span className="text-sm text-muted-foreground">Burning Fee</span>
														<span className="text-sm font-semibold text-foreground">
															{economics.feeStructure.burning}
														</span>
													</div>
												)}
											</div>
										</CardContent>
									</Card>
								)}

								{/* Treasury */}
								{economics?.treasury && (
									<Card>
										<CardHeader>
											<CardTitle className="text-base">Treasury</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="flex items-center gap-2">
												<code className="text-xs font-mono text-foreground">
													{economics.treasury}
												</code>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0"
													onClick={() => copyToClipboard(economics.treasury || "")}
												>
													<Copy className="h-3 w-3" />
												</Button>
											</div>
										</CardContent>
									</Card>
								)}
							</TabsContent>

							{/* Parameters Tab */}
							<TabsContent value="parameters" className="mt-6 space-y-4">
								{parameters && (
									<>
										{parameters.fees && (
											<Card>
												<CardHeader>
													<CardTitle className="text-base">Fees</CardTitle>
												</CardHeader>
												<CardContent>
													<div className="grid grid-cols-2 gap-4">
														{parameters.fees.base && (
															<div>
																<label className="text-xs text-muted-foreground">Base Fee</label>
																<p className="text-sm font-semibold text-foreground mt-1">
																	{parameters.fees.base} {parameters.fees.currency || ""}
																</p>
															</div>
														)}
														{parameters.fees.per_byte && (
															<div>
																<label className="text-xs text-muted-foreground">Per Byte</label>
																<p className="text-sm font-semibold text-foreground mt-1">
																	{parameters.fees.per_byte} {parameters.fees.currency || ""}
																</p>
															</div>
														)}
														{parameters.fees.raw_per_byte && (
															<div>
																<label className="text-xs text-muted-foreground">Raw Per Byte</label>
																<p className="text-sm font-semibold text-foreground mt-1">
																	{parameters.fees.raw_per_byte} {parameters.fees.currency || ""}
																</p>
															</div>
														)}
													</div>
												</CardContent>
											</Card>
										)}

										{parameters.currency && (
											<Card>
												<CardHeader>
													<CardTitle className="text-base">Currency</CardTitle>
												</CardHeader>
												<CardContent>
													<div className="grid grid-cols-2 gap-4">
														{parameters.currency.symbol && (
															<div>
																<label className="text-xs text-muted-foreground">Symbol</label>
																<p className="text-sm font-semibold text-foreground mt-1">
																	{parameters.currency.symbol}
																</p>
															</div>
														)}
														{parameters.currency.decimals !== undefined && (
															<div>
																<label className="text-xs text-muted-foreground">Decimals</label>
																<p className="text-sm font-semibold text-foreground mt-1">
																	{parameters.currency.decimals}
																</p>
															</div>
														)}
										{parameters.currency.name && (
											<div>
												<label className="text-xs text-muted-foreground">Currency Name</label>
												<p className="text-sm font-semibold text-foreground mt-1">
													{parameters.currency.name}
												</p>
											</div>
										)}
										{parameters.currency.fee_unit && (
											<div className="col-span-2">
												<label className="text-xs text-muted-foreground">Fee Unit</label>
												<p className="text-sm text-foreground mt-1">
													{parameters.currency.fee_unit}
												</p>
											</div>
										)}
													</div>
												</CardContent>
											</Card>
										)}

										{parameters.limits && (
											<Card>
												<CardHeader>
													<CardTitle className="text-base">Limits</CardTitle>
												</CardHeader>
												<CardContent>
													<div className="grid grid-cols-2 gap-4">
														{parameters.limits.max_tx_size !== undefined && (
															<div>
																<label className="text-xs text-muted-foreground">Max TX Size</label>
																<p className="text-sm font-semibold text-foreground mt-1">
																	{parameters.limits.max_tx_size.toLocaleString()} bytes
																</p>
															</div>
														)}
														{parameters.limits.max_signatures !== undefined && (
															<div>
																<label className="text-xs text-muted-foreground">Max Signatures</label>
																<p className="text-sm font-semibold text-foreground mt-1">
																	{parameters.limits.max_signatures}
																</p>
															</div>
														)}
													</div>
												</CardContent>
											</Card>
										)}

										{parameters.treasury_address && (
											<Card>
												<CardHeader>
													<CardTitle className="text-base">Treasury Address</CardTitle>
												</CardHeader>
												<CardContent>
													<div className="flex items-center gap-2">
														<code className="text-xs font-mono text-foreground">
															{parameters.treasury_address}
														</code>
														<Button
															variant="ghost"
															size="sm"
															className="h-6 w-6 p-0"
															onClick={() => copyToClipboard(parameters.treasury_address)}
														>
															<Copy className="h-3 w-3" />
														</Button>
													</div>
												</CardContent>
											</Card>
										)}
									</>
								)}
							</TabsContent>

							{/* Issuer Tab */}
							<TabsContent value="issuer" className="mt-6 space-y-4">
								{issuer ? (
									<Card>
										<CardHeader>
											<CardTitle className="text-base">Issuer Information</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											{issuer.org && (
												<div>
													<label className="text-xs text-muted-foreground">Organization</label>
													<p className="text-sm font-semibold text-foreground mt-1">
														{issuer.org}
													</p>
												</div>
											)}
											{issuer.address && (
												<div>
													<label className="text-xs text-muted-foreground">Address</label>
													<div className="flex items-center gap-2 mt-1">
														<code className="text-xs font-mono text-foreground">
															{issuer.address}
														</code>
														<Button
															variant="ghost"
															size="sm"
															className="h-6 w-6 p-0"
															onClick={() => copyToClipboard(issuer.address)}
														>
															<Copy className="h-3 w-3" />
														</Button>
													</div>
												</div>
											)}
											{issuer.public_key && (
												<div>
													<label className="text-xs text-muted-foreground">Public Key</label>
													<div className="flex items-center gap-2 mt-1">
														<code className="text-xs font-mono text-foreground break-all">
															{issuer.public_key}
														</code>
														<Button
															variant="ghost"
															size="sm"
															className="h-6 w-6 p-0"
															onClick={() => copyToClipboard(issuer.public_key)}
														>
															<Copy className="h-3 w-3" />
														</Button>
													</div>
												</div>
											)}
											{issuer.contact && (
												<div>
													<label className="text-xs text-muted-foreground">Contact</label>
													<p className="text-sm text-foreground mt-1">
														{issuer.contact}
													</p>
												</div>
											)}
										</CardContent>
									</Card>
								) : (
									<Card>
										<CardContent className="p-8 text-center text-muted-foreground">
											<p className="text-sm">Issuer information not available</p>
										</CardContent>
									</Card>
								)}
							</TabsContent>
						</Tabs>
					</div>
				</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}

