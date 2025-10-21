/**
 * Multi-Channel Selector Component
 * Allows selection of multiple session storage channels
 */

import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";
import useSessionStoreSync from "@/hooks/use_session_store_sync.ts";
import { Button, Checkbox, Input } from "@/components/ui";
import { ExternalLink, RefreshCw, Search, X } from "lucide-react";

interface MultiChannelSelectorProps {
  selectedChannels: string[];
  onChange: (channels: string[]) => void;
}

/**
 * Multi-select component for session storage channels
 * Shows all available channels with checkboxes
 */
export default function MultiChannelSelector({
  selectedChannels,
  onChange,
}: MultiChannelSelectorProps): ReactElement {
  const session = useSessionStoreSync() as Record<string, unknown> | null;
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const availableChannels = useMemo(() => {
    if (!session) return [];

    const channels = Object.keys(session)
      .filter((key) => {
        // Skip utility functions and non-channel keys
        if (
          typeof session[key] === "function" ||
          key === "saveData" ||
          key === "getData" ||
          key === "reloadState" ||
          key.startsWith("phantom.") ||
          key.endsWith(".heartbeat")
        ) {
          return false;
        }

        const val = session[key];

        // Check structure: must have 'raw' or 'data' field
        return (
          typeof val === "object" &&
          val !== null &&
          ("raw" in val || "data" in val)
        );
      })
      .sort();

    return channels;
  }, [session]);

  // Filtered channels based on search
  const filteredChannels = useMemo(() => {
    if (!searchQuery) return availableChannels;

    const query = searchQuery.toLowerCase();
    return availableChannels.filter((channel) =>
      channel.toLowerCase().includes(query)
    );
  }, [availableChannels, searchQuery]);

  // Group channels by type
  const groupedChannels = useMemo(() => {
    const groups: Record<string, string[]> = {
      ticker: [],
      book: [],
      trades: [],
      other: [],
    };

    filteredChannels.forEach((channel) => {
      if (channel.includes(".ticker.")) {
        groups.ticker!.push(channel);
      } else if (channel.includes(".book.")) {
        groups.book!.push(channel);
      } else if (channel.includes(".trades.")) {
        groups.trades!.push(channel);
      } else {
        groups.other!.push(channel);
      }
    });

    return groups;
  }, [filteredChannels]);

  const handleToggle = (channelKey: string): void => {
    if (selectedChannels.includes(channelKey)) {
      onChange(selectedChannels.filter((k) => k !== channelKey));
    } else {
      onChange([...selectedChannels, channelKey]);
    }
  };

  const handleSelectAll = (): void => {
    onChange(availableChannels);
  };

  const handleClearAll = (): void => {
    onChange([]);
  };

  const handleRefresh = useCallback((): void => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleOpenMarkets = useCallback((): void => {
    // Trigger navigation to Markets
    const event = new CustomEvent("navigate", { detail: { app: "Markets" } });
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="flex flex-col gap-2" key={refreshKey}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-foreground font-semibold uppercase tracking-wide">
          Channels
        </span>
        <div className="flex items-center gap-1">
          {availableChannels.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-5 px-1.5 text-[10px]"
                title="Select all channels"
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-5 px-1.5 text-[10px]"
                title="Clear selection"
              >
                Clear
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-5 w-5 p-0"
            title="Refresh channel list"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search - compact */}
      {availableChannels.length > 3 && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter..."
            className="pl-7 pr-7 h-6 text-[11px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {availableChannels.length === 0
        ? (
          <div className="p-4 bg-amber-500/10 rounded border border-amber-500/20">
            <div className="text-sm text-amber-500 font-semibold mb-2">
              ⚠️ No Channels Available
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-400 mb-3">
              Session storage is empty. To use this dynamic schema, you need
              active data channels from WebSocket.
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenMarkets}
                className="flex items-center gap-1.5 text-xs border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <ExternalLink className="w-3 h-3" />
                Open Markets App
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-1.5 text-xs border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh List
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1.5 mb-3">
              <div className="font-semibold text-amber-700 dark:text-amber-400">
                Quick Start Guide:
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">1.</span>
                <span>
                  Click "Open Markets App" button above or open it from
                  navigation
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">2.</span>
                <span>
                  Wait 2-3 seconds for WebSocket to connect and load data
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">3.</span>
                <span>
                  Click "Refresh List" button - channels will appear here
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">4.</span>
                <span>Select channels you want to use in your schema</span>
              </div>
            </div>

            <div className="p-2 bg-card rounded border border-border">
              <div className="text-[10px] text-muted-foreground">
                💡 <strong className="text-foreground">Pro Tip:</strong>{" "}
                Dynamic schemas pull real-time data from session storage. Static
                schemas (containers/routers) don't need channels.
              </div>
            </div>
          </div>
        )
        : filteredChannels.length === 0
        ? (
          <div className="p-4 bg-muted/50 rounded border border-border">
            <p className="text-xs text-muted-foreground">
              No channels match "{searchQuery}"
            </p>
          </div>
        )
        : (
          <div className="max-h-60 overflow-y-auto border border-border rounded bg-card/50">
            {Object.entries(groupedChannels).map(([type, channels]) => {
              if (channels.length === 0) return null;

              const typeColors: Record<string, string> = {
                ticker: "text-blue-700 dark:text-blue-400",
                book: "text-green-700 dark:text-green-600",
                trades: "text-purple-700 dark:text-purple-400",
                other: "text-muted-foreground",
              };

              return (
                <div key={type}>
                  <div className="px-2 py-1 bg-card border-b border-border">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        typeColors[type]
                      }`}
                    >
                      {type} ({channels.length})
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {channels.map((channelKey) => {
                      const isSelected = selectedChannels.includes(channelKey);
                      const symbol = channelKey.match(
                        /\.([A-Z]{3,10})(?:\/[A-Z]{3,10}|USDT)/,
                      )?.[1];

                      return (
                        <label
                          key={channelKey}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggle(channelKey)}
                          />
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            {symbol && (
                              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                                {symbol}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-mono truncate">
                              {channelKey}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {selectedChannels.length}/{availableChannels.length}
          {searchQuery && ` (${filteredChannels.length})`}
        </span>
        {selectedChannels.length > 0 && (
          <span className="text-green-500 flex items-center gap-1">
            <span className="w-1 h-1 bg-green-500 rounded-full" />
            {selectedChannels.length}
          </span>
        )}
      </div>
    </div>
  );
}
