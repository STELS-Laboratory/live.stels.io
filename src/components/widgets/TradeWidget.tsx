import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import type {FC} from "react"
import {cn} from "@/lib/utils"

type Trade = {
	id: string
	timestamp: number
	side: "buy" | "sell"
	price: number
	amount: number
}

type TradesWidgetProps = {
	exchange: string
	market: string
	trades: Trade[]
}

const LARGE_ORDER_THRESHOLD = 0.001

const TradesWidget: FC<TradesWidgetProps> = ({exchange, market, trades}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="capitalize">Recent Trades</CardTitle>
				<CardDescription>
					{market} on <span className="capitalize">{exchange}</span>
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Time</TableHead>
							<TableHead>Side</TableHead>
							<TableHead className="text-right">Price (USDT)</TableHead>
							<TableHead className="text-right">Amount (BTC)</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{trades.map((trade) => {
							const isLargeOrder = trade.amount > LARGE_ORDER_THRESHOLD
							return (
								<TableRow
									key={trade.id}
									className={cn(
										"relative",
										isLargeOrder &&
										"before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-amber-400",
									)}
								>
									<TableCell className="font-mono text-sm text-muted-foreground">
										{new Date(trade.timestamp).toLocaleTimeString("en-US", {
											hour12: false,
											hour: "2-digit",
											minute: "2-digit",
											second: "2-digit",
										})}
									</TableCell>
									<TableCell>
                    <span className={`font-medium ${trade.side === "buy" ? "text-green-500" : "text-red-500"}`}>
                      {trade.side.toUpperCase()}
                    </span>
									</TableCell>
									<TableCell
										className={`text-right font-mono text-sm ${trade.side === "buy" ? "text-green-500" : "text-red-500"}`}
									>
										{trade.price.toFixed(2)}
									</TableCell>
									<TableCell className="text-right font-mono text-sm">{trade.amount.toFixed(6)}</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}

export default TradesWidget
