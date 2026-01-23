/**
 * Order List Component
 * Displays orders or trades list with date filtering
 */

import { useCallback, useMemo, useState } from "react";
import { useTradingStore } from "../store";
import type { Order, Trade } from "../types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, List, History, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface OrderListProps {
  nid: string;
  type: "orders" | "trades";
}

type DateFilter = "today" | "7d" | "30d" | "all";

// ============================================
// Date Filter Options
// ============================================

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All" },
];

// ============================================
// Helper Functions
// ============================================

function getFilterStartTime(filter: DateFilter): number {
  const now = Date.now();
  switch (filter) {
    case "today":
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.getTime();
    case "7d":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "all":
    default:
      return 0;
  }
}

function formatDateTime(timestamp: number): string {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ============================================
// Main Component
// ============================================

export function OrderList({ nid, type }: OrderListProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  
  const {
    orders,
    trades,
    ordersLoading,
    tradesLoading,
    ordersError,
    tradesError,
    cancelOrder,
    orderCancelling,
  } = useTradingStore();

  const isLoading = type === "orders" ? ordersLoading : tradesLoading;
  const error = type === "orders" ? ordersError : tradesError;

  // Filter and sort data by date
  const filteredData = useMemo(() => {
    const startTime = getFilterStartTime(dateFilter);
    
    if (type === "orders") {
      return orders
        .filter((order) => (order.createdAt || 0) >= startTime)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else {
      return trades
        .filter((trade) => (trade.timestamp || 0) >= startTime)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
  }, [type, orders, trades, dateFilter]);

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      await cancelOrder({ nid, orderId });
    },
    [nid, cancelOrder]
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-2 py-1 border-b">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex-1 p-2 space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-2 py-1 border-b">
          {type === "orders" ? <List className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
          <span className="text-xs font-medium">{type === "orders" ? "Orders" : "Trades"}</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with date filter */}
      <div className="flex items-center justify-between px-2 py-1 border-b shrink-0">
        <div className="flex items-center gap-1.5">
          {type === "orders" ? <List className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
          <span className="text-xs font-medium">
            {type === "orders" ? "Orders" : "Trades"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            ({filteredData.length})
          </span>
        </div>
        
        {/* Date Filter */}
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="h-5 w-[70px] text-[10px] rounded-sm">
            <Calendar className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value} className="text-xs">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {filteredData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            No {type} found
          </div>
        ) : type === "orders" ? (
          <OrdersTable
            orders={filteredData as Order[]}
            onCancel={handleCancelOrder}
            cancelling={orderCancelling}
          />
        ) : (
          <TradesTable trades={filteredData as Trade[]} />
        )}
      </div>
    </div>
  );
}

// ============================================
// Orders Table
// ============================================

interface OrdersTableProps {
  orders: Order[];
  onCancel: (orderId: string) => void;
  cancelling: boolean;
}

function OrdersTable({ orders, onCancel, cancelling }: OrdersTableProps) {
  return (
    <div className="relative">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <TableRow className="h-7 border-b-2">
            <TableHead className="text-[10px] py-1 px-2 font-semibold">Time</TableHead>
            <TableHead className="text-[10px] py-1 px-1 font-semibold">Symbol</TableHead>
            <TableHead className="text-[10px] py-1 px-1 font-semibold">Side</TableHead>
            <TableHead className="text-[10px] py-1 px-1 font-semibold">Type</TableHead>
            <TableHead className="text-right text-[10px] py-1 px-1 font-semibold">Price</TableHead>
            <TableHead className="text-right text-[10px] py-1 px-1 font-semibold">Amt</TableHead>
            <TableHead className="text-right text-[10px] py-1 px-1 font-semibold">Filled</TableHead>
            <TableHead className="w-6 py-1 px-1"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow 
              key={order.id} 
              className={cn(
                "h-7 hover:bg-muted/50 transition-colors group",
                index % 2 === 1 && "bg-muted/20",
                // Left border indicator for side
                "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5",
                order.side === "buy" ? "before:bg-trading-buy" : "before:bg-trading-sell"
              )}
            >
              <TableCell className="text-[10px] py-1 px-2 text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </TableCell>
              <TableCell className="font-mono text-[10px] py-1 px-1 font-medium">
                {order.symbol?.split("/")[0] || "-"}
              </TableCell>
              <TableCell className="py-1 px-1">
                <span
                  className={cn(
                    "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-semibold",
                    order.side === "buy" 
                      ? "bg-trading-buy/15 text-trading-buy" 
                      : "bg-trading-sell/15 text-trading-sell"
                  )}
                >
                  {order.side?.toUpperCase() || "-"}
                </span>
              </TableCell>
              <TableCell className="capitalize text-[10px] py-1 px-1 text-muted-foreground">
                {order.type || "-"}
              </TableCell>
              <TableCell className="text-right font-mono text-[10px] py-1 px-1">
                {typeof order.price === "number" ? order.price.toLocaleString() : "MKT"}
              </TableCell>
              <TableCell className="text-right font-mono text-[10px] py-1 px-1">
                {typeof order.amount === "number" ? order.amount.toFixed(4) : "-"}
              </TableCell>
              <TableCell className="text-right font-mono text-[10px] py-1 px-1">
                <span className={cn(
                  order.filled > 0 && order.filled < order.amount && "text-amber-500",
                  order.filled >= order.amount && "text-trading-buy"
                )}>
                  {order.filled?.toFixed(4) || "0"}
                </span>
              </TableCell>
              <TableCell className="py-1 px-1">
                {order.status === "open" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onCancel(order.id)}
                    disabled={cancelling}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================
// Trades Table
// ============================================

interface TradesTableProps {
  trades: Trade[];
}

function TradesTable({ trades }: TradesTableProps) {
  return (
    <div className="relative">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <TableRow className="h-7 border-b-2">
            <TableHead className="text-[10px] py-1 px-2 font-semibold">Time</TableHead>
            <TableHead className="text-[10px] py-1 px-1 font-semibold">Symbol</TableHead>
            <TableHead className="text-[10px] py-1 px-1 font-semibold">Side</TableHead>
            <TableHead className="text-right text-[10px] py-1 px-1 font-semibold">Price</TableHead>
            <TableHead className="text-right text-[10px] py-1 px-1 font-semibold">Amt</TableHead>
            <TableHead className="text-right text-[10px] py-1 px-1 font-semibold">Cost</TableHead>
            <TableHead className="text-right text-[10px] py-1 px-1 font-semibold">Fee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade, index) => (
            <TableRow 
              key={trade.id} 
              className={cn(
                "h-7 hover:bg-muted/50 transition-colors",
                index % 2 === 1 && "bg-muted/20",
                // Left border indicator for side
                "relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5",
                trade.side === "buy" ? "before:bg-trading-buy" : "before:bg-trading-sell"
              )}
            >
              <TableCell className="text-[10px] py-1 px-2 text-muted-foreground">
                {formatDateTime(trade.timestamp)}
              </TableCell>
              <TableCell className="font-mono text-[10px] py-1 px-1 font-medium">
                {trade.symbol?.split("/")[0] || "-"}
              </TableCell>
              <TableCell className="py-1 px-1">
                <span
                  className={cn(
                    "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-semibold",
                    trade.side === "buy" 
                      ? "bg-trading-buy/15 text-trading-buy" 
                      : "bg-trading-sell/15 text-trading-sell"
                  )}
                >
                  {trade.side?.toUpperCase() || "-"}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono text-[10px] py-1 px-1">
                {typeof trade.price === "number" ? trade.price.toLocaleString() : "-"}
              </TableCell>
              <TableCell className="text-right font-mono text-[10px] py-1 px-1">
                {typeof trade.amount === "number" ? trade.amount.toFixed(4) : "-"}
              </TableCell>
              <TableCell className="text-right font-mono text-[10px] py-1 px-1 font-medium">
                ${typeof trade.cost === "number" ? trade.cost.toFixed(2) : "-"}
              </TableCell>
              <TableCell className="text-right font-mono text-[10px] py-1 px-1 text-muted-foreground">
                {trade.fee ? `-${trade.fee.cost.toFixed(4)}` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
