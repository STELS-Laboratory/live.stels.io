/**
 * Balance Panel Component
 * Compact display of account balances for sidebar
 * Uses realtime data from sessionStorage with RPC fallback
 */

import { useMemo } from "react";
import { useTradingStore } from "../store";
import { useRealtimeAccountBalance } from "../hooks";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Wallet, Wifi, WifiOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ============================================
// Types
// ============================================

interface BalancePanelProps {
  /** Account NID (network identifier) */
  nid: string;
  /** Exchange name */
  exchange?: string;
  /** User address (from auth) */
  address?: string;
}

// ============================================
// Helpers
// ============================================

/**
 * Get user address from private-store in localStorage
 */
function getUserAddress(): string | null {
  try {
    const privateStore = localStorage.getItem("private-store");
    if (privateStore) {
      const data = JSON.parse(privateStore) as {
        raw?: { info?: { address?: string }; address?: string };
      };
      return data?.raw?.info?.address ?? data?.raw?.address ?? null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Format balance for display
 */
function formatBalance(value: number): string {
  if (value >= 1000000) return (value / 1000000).toFixed(2) + "M";
  if (value >= 1000) return (value / 1000).toFixed(2) + "K";
  if (value >= 1) return value.toFixed(4);
  if (value >= 0.0001) return value.toFixed(4);
  return value.toFixed(8);
}

/**
 * Format timestamp to relative time
 */
function formatLastSync(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 1000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// ============================================
// Component
// ============================================

export function BalancePanel({ nid, exchange, address: propAddress }: BalancePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get RPC-based balances as fallback
  const { balances: rpcBalances, balanceLoading } = useTradingStore();

  // Get user address from props or localStorage
  const userAddress = propAddress || getUserAddress();

  // Get realtime balance data from sessionStorage
  const {
    balances: realtimeBalances,
    isConnected,
    data: realtimeData,
  } = useRealtimeAccountBalance(
    userAddress || "",
    exchange || "",
    nid,
    { interval: 2000, enabled: !!(userAddress && exchange && nid) }
  );

  // Use realtime data if available, otherwise fallback to RPC
  const hasRealtimeData = Object.keys(realtimeBalances).length > 0;
  const balances = hasRealtimeData ? realtimeBalances : rpcBalances;

  // Sort balances by total value (descending), separate main currencies
  const { mainBalances, otherBalances } = useMemo(() => {
    const mainCurrencies = ["USDT", "USDC", "USD", "BTC", "ETH", "SOL"];
    const entries = Object.entries(balances).filter(([, balance]) => balance.total > 0);
    
    const main = entries
      .filter(([currency]) => mainCurrencies.includes(currency))
      .sort((a, b) => mainCurrencies.indexOf(a[0]) - mainCurrencies.indexOf(b[0]));
    
    const other = entries
      .filter(([currency]) => !mainCurrencies.includes(currency))
      .sort((a, b) => b[1].total - a[1].total);
    
    return { mainBalances: main, otherBalances: other };
  }, [balances]);

  // Calculate estimated total in USD (simplified)
  const estimatedTotal = useMemo(() => {
    // This is very simplified - ideally would use actual USD values
    const usdtLike = ["USDT", "USDC", "USD", "BUSD", "DAI"];
    let total = 0;
    for (const [currency, balance] of Object.entries(balances)) {
      if (usdtLike.includes(currency)) {
        total += balance.total;
      }
    }
    return total;
  }, [balances]);

  if (balanceLoading && mainBalances.length === 0) {
    return (
      <div className="p-3 animate-pulse">
        <div className="h-4 w-20 bg-muted rounded mb-2" />
        <div className="h-6 w-32 bg-muted rounded" />
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Total Balance</div>
              <div className="text-sm font-semibold font-mono">
                ${formatBalance(estimatedTotal)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "p-1 rounded",
                  isConnected ? "text-trading-buy" : "text-muted-foreground"
                )}>
                  {isConnected ? (
                    <Wifi className="h-3.5 w-3.5" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isConnected ? "Realtime connected" : "Realtime disconnected"}
                {realtimeData?.raw?.lastBalanceSync && (
                  <div className="text-xs text-muted-foreground">
                    Synced: {formatLastSync(realtimeData.raw.lastBalanceSync)}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
            
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px] h-4 px-1",
                hasRealtimeData ? "border-trading-buy/30 text-trading-buy" : "border-muted"
              )}
            >
              {hasRealtimeData ? "RT" : "RPC"}
            </Badge>
            
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} />
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-1">
          {/* Main Currencies */}
          {mainBalances.map(([currency, balance]) => (
            <div
              key={currency}
              className="flex items-center justify-between py-1 text-xs"
            >
              <span className="font-medium">{currency}</span>
              <div className="text-right font-mono">
                <span>{formatBalance(balance.free)}</span>
                {balance.used > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({formatBalance(balance.used)} used)
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* Divider if there are other currencies */}
          {otherBalances.length > 0 && mainBalances.length > 0 && (
            <div className="border-t my-2" />
          )}
          
          {/* Other Currencies */}
          {otherBalances.slice(0, 5).map(([currency, balance]) => (
            <div
              key={currency}
              className="flex items-center justify-between py-1 text-xs text-muted-foreground"
            >
              <span>{currency}</span>
              <span className="font-mono">{formatBalance(balance.total)}</span>
            </div>
          ))}
          
          {/* Show more indicator */}
          {otherBalances.length > 5 && (
            <div className="text-[10px] text-muted-foreground text-center pt-1">
              +{otherBalances.length - 5} more assets
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
