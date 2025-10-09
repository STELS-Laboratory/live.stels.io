import React from "react";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Filter, Search, X } from "lucide-react";
import { getCurrencyIcon, getExchangeIcon } from "../utils.ts";

interface MarketFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedExchanges: string[];
  selectedSymbols: string[];
  availableExchanges: string[];
  availableSymbols: string[];
  toggleExchange: (exchange: string) => void;
  toggleSymbol: (symbol: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Market filters component
 */
export function MarketFilters({
  searchTerm,
  setSearchTerm,
  selectedExchanges,
  selectedSymbols,
  availableExchanges,
  availableSymbols,
  toggleExchange,
  toggleSymbol,
  clearFilters,
  hasActiveFilters,
}: MarketFiltersProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by symbol or market..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Exchange Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Exchanges</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableExchanges.map((exchange) => (
            <Button
              key={exchange}
              variant={selectedExchanges.includes(exchange)
                ? "default"
                : "outline"}
              size="sm"
              onClick={() => toggleExchange(exchange)}
              className="h-8"
            >
              {getExchangeIcon(exchange)
                ? (
                  <img
                    src={getExchangeIcon(exchange)!}
                    alt={exchange}
                    className="w-4 h-4 rounded-full mr-2"
                  />
                )
                : (
                  <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">
                    {exchange.charAt(0).toUpperCase()}
                  </div>
                )}
              {exchange}
            </Button>
          ))}
        </div>
      </div>

      {/* Symbol Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Symbols</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableSymbols.map((symbol) => (
            <Button
              key={symbol}
              variant={selectedSymbols.includes(symbol) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSymbol(symbol)}
              className="h-8"
            >
              {getCurrencyIcon(symbol)
                ? (
                  <img
                    src={getCurrencyIcon(symbol)!}
                    alt={symbol}
                    className="w-4 h-4 rounded-full mr-2"
                  />
                )
                : (
                  <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">
                    {symbol.slice(0, 2)}
                  </div>
                )}
              {symbol}
            </Button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
