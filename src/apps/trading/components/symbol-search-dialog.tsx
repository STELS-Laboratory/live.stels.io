/**
 * Symbol Search Dialog Component
 * Command palette style symbol search with filtering and recent symbols
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, TrendingUp, TrendingDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWatchlistStore } from "../stores/watchlist.store";
import { useMultipleTickers } from "../hooks";

interface SymbolSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (symbol: string, exchange: string, market: string) => void;
}

// Available trading pairs
const AVAILABLE_SYMBOLS = [
  { symbol: "BTC/USDT", exchange: "bybit", market: "spot", name: "Bitcoin" },
  { symbol: "ETH/USDT", exchange: "bybit", market: "spot", name: "Ethereum" },
  { symbol: "SOL/USDT", exchange: "bybit", market: "spot", name: "Solana" },
  { symbol: "BNB/USDT", exchange: "bybit", market: "spot", name: "BNB" },
  { symbol: "XRP/USDT", exchange: "bybit", market: "spot", name: "Ripple" },
  { symbol: "DOGE/USDT", exchange: "bybit", market: "spot", name: "Dogecoin" },
  { symbol: "ADA/USDT", exchange: "bybit", market: "spot", name: "Cardano" },
  { symbol: "AVAX/USDT", exchange: "bybit", market: "spot", name: "Avalanche" },
  { symbol: "DOT/USDT", exchange: "bybit", market: "spot", name: "Polkadot" },
  { symbol: "MATIC/USDT", exchange: "bybit", market: "spot", name: "Polygon" },
  { symbol: "LINK/USDT", exchange: "bybit", market: "spot", name: "Chainlink" },
  { symbol: "LTC/USDT", exchange: "bybit", market: "spot", name: "Litecoin" },
  { symbol: "UNI/USDT", exchange: "bybit", market: "spot", name: "Uniswap" },
  { symbol: "ATOM/USDT", exchange: "bybit", market: "spot", name: "Cosmos" },
  { symbol: "FIL/USDT", exchange: "bybit", market: "spot", name: "Filecoin" },
  { symbol: "APT/USDT", exchange: "bybit", market: "spot", name: "Aptos" },
  { symbol: "ARB/USDT", exchange: "bybit", market: "spot", name: "Arbitrum" },
  { symbol: "OP/USDT", exchange: "bybit", market: "spot", name: "Optimism" },
  { symbol: "NEAR/USDT", exchange: "bybit", market: "spot", name: "NEAR Protocol" },
  { symbol: "INJ/USDT", exchange: "bybit", market: "spot", name: "Injective" },
];

// Local storage key for recent symbols
const RECENT_SYMBOLS_KEY = "trading-recent-symbols";
const MAX_RECENT = 5;

export function SymbolSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: SymbolSearchDialogProps) {
  const [search, setSearch] = useState("");
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);

  // Get watchlist for favorites
  const { items: watchlistItems } = useWatchlistStore();

  // Get tickers for all symbols to show prices
  const tickers = useMultipleTickers(
    AVAILABLE_SYMBOLS.map((s) => ({
      symbol: s.symbol,
      exchange: s.exchange,
      market: s.market,
    })),
    { interval: 2000 }
  );

  // Load recent symbols from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SYMBOLS_KEY);
    if (stored) {
      try {
        setRecentSymbols(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save recent symbol
  const addToRecent = useCallback((symbol: string) => {
    setRecentSymbols((prev) => {
      const filtered = prev.filter((s) => s !== symbol);
      const updated = [symbol, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SYMBOLS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Handle selection
  const handleSelect = useCallback(
    (symbol: string, exchange: string, market: string) => {
      addToRecent(symbol);
      onSelect(symbol, exchange, market);
      onOpenChange(false);
      setSearch("");
    },
    [addToRecent, onSelect, onOpenChange]
  );

  // Filter symbols based on search
  const filteredSymbols = useMemo(() => {
    if (!search) return AVAILABLE_SYMBOLS;

    const lowerSearch = search.toLowerCase();
    return AVAILABLE_SYMBOLS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(lowerSearch) ||
        s.name.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  // Get recent symbols data
  const recentSymbolsData = useMemo(() => {
    return recentSymbols
      .map((symbol) => AVAILABLE_SYMBOLS.find((s) => s.symbol === symbol))
      .filter(Boolean) as typeof AVAILABLE_SYMBOLS;
  }, [recentSymbols]);

  // Get favorite symbols
  const favoriteSymbols = useMemo(() => {
    return watchlistItems
      .filter((item) => item.isFavorite)
      .map((item) => AVAILABLE_SYMBOLS.find((s) => s.symbol === item.symbol))
      .filter(Boolean) as typeof AVAILABLE_SYMBOLS;
  }, [watchlistItems]);

  // Format price
  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "—";
    if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search symbols... (e.g., BTC, Ethereum)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center py-6 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-50" />
            <p>No symbols found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        </CommandEmpty>

        {/* Recent Symbols */}
        {!search && recentSymbolsData.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentSymbolsData.map((item) => {
                const ticker = tickers.get(item.symbol);
                const isPositive = (ticker?.percentage ?? 0) >= 0;

                return (
                  <CommandItem
                    key={`recent-${item.symbol}`}
                    value={item.symbol}
                    onSelect={() => handleSelect(item.symbol, item.exchange, item.market)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{item.symbol}</span>
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticker && (
                        <>
                          <span className="font-mono text-sm">
                            ${formatPrice(ticker.last)}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-0.5 text-xs",
                              isPositive ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {ticker.percentage?.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Favorites */}
        {!search && favoriteSymbols.length > 0 && (
          <>
            <CommandGroup heading="Favorites">
              {favoriteSymbols.map((item) => {
                const ticker = tickers.get(item.symbol);
                const isPositive = (ticker?.percentage ?? 0) >= 0;

                return (
                  <CommandItem
                    key={`fav-${item.symbol}`}
                    value={item.symbol}
                    onSelect={() => handleSelect(item.symbol, item.exchange, item.market)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{item.symbol}</span>
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ticker && (
                        <>
                          <span className="font-mono text-sm">
                            ${formatPrice(ticker.last)}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-0.5 text-xs",
                              isPositive ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {ticker.percentage?.toFixed(2)}%
                          </span>
                        </>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* All Symbols */}
        <CommandGroup heading={search ? "Results" : "All Symbols"}>
          {filteredSymbols.map((item) => {
            const ticker = tickers.get(item.symbol);
            const isPositive = (ticker?.percentage ?? 0) >= 0;
            const isFavorite = watchlistItems.some((w) => w.symbol === item.symbol && w.isFavorite);

            return (
              <CommandItem
                key={item.symbol}
                value={`${item.symbol} ${item.name}`}
                onSelect={() => handleSelect(item.symbol, item.exchange, item.market)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {isFavorite && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                  <span className="font-medium">{item.symbol}</span>
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                    {item.exchange}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {ticker && (
                    <>
                      <span className="font-mono text-sm">
                        ${formatPrice(ticker.last)}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-0.5 text-xs min-w-[60px] justify-end",
                          isPositive ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isPositive ? "+" : ""}
                        {ticker.percentage?.toFixed(2)}%
                      </span>
                    </>
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
