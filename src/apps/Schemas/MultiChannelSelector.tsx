/**
 * Multi-Channel Selector Component
 * Allows selection of multiple session storage channels
 */

import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";
import useSessionStoreSync from "@/hooks/useSessionStoreSync.ts";
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
    <div className="flex flex-col gap-3" key={refreshKey}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">
          Channels (Multi-select)
        </label>
        <div className="flex items-center gap-2">
          {availableChannels.length > 0
            ? (
              <>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Select All
                </button>
                <span className="text-xs text-zinc-600">•</span>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  Clear
                </button>
                <span className="text-xs text-zinc-600">•</span>
              </>
            )
            : null}
          <button
            onClick={handleRefresh}
            className="text-xs text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
            title="Refresh channel list"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      {availableChannels.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="pl-9 pr-9 h-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
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
            <div className="text-xs text-amber-400 mb-3">
              Session storage is empty. To use this dynamic schema, you need
              active data channels from WebSocket.
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenMarkets}
                className="flex items-center gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <ExternalLink className="w-3 h-3" />
                Open Markets App
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-1.5 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh List
              </Button>
            </div>

            <div className="text-xs text-zinc-400 space-y-1.5 mb-3">
              <div className="font-semibold text-amber-400">
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

            <div className="p-2 bg-zinc-900 rounded border border-zinc-700">
              <div className="text-[10px] text-zinc-500">
                💡 <strong className="text-zinc-400">Pro Tip:</strong>{" "}
                Dynamic schemas pull real-time data from session storage. Static
                schemas (containers/routers) don't need channels.
              </div>
            </div>
          </div>
        )
        : filteredChannels.length === 0
        ? (
          <div className="p-4 bg-zinc-800/50 rounded border border-zinc-700">
            <p className="text-xs text-zinc-500">
              No channels match "{searchQuery}"
            </p>
          </div>
        )
        : (
          <div className="max-h-60 overflow-y-auto border border-zinc-700 rounded bg-zinc-900/50">
            {Object.entries(groupedChannels).map(([type, channels]) => {
              if (channels.length === 0) return null;

              const typeColors: Record<string, string> = {
                ticker: "text-blue-400",
                book: "text-green-400",
                trades: "text-purple-400",
                other: "text-zinc-400",
              };

              return (
                <div key={type}>
                  <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        typeColors[type]
                      }`}
                    >
                      {type} ({channels.length})
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {channels.map((channelKey) => {
                      const isSelected = selectedChannels.includes(channelKey);
                      const channelData = session?.[channelKey] as
                        | Record<string, unknown>
                        | null;
                      const module = channelData?.module as string | undefined;

                      return (
                        <label
                          key={channelKey}
                          className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggle(channelKey)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-zinc-300 font-mono truncate">
                              {channelKey}
                            </div>
                            {module && (
                              <div className="text-xs text-zinc-500 mt-0.5">
                                Type: {module}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              Selected
                            </span>
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

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {selectedChannels.length} of {availableChannels.length} selected
          {searchQuery && ` (${filteredChannels.length} shown)`}
        </span>
        {selectedChannels.length > 0 && (
          <span className="text-green-500">
            Data from {selectedChannels.length} channel
            {selectedChannels.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
