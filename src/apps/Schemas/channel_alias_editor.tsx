/**
 * Channel Data Reference Component
 * Show how to access data from selected channels
 */

import { type ReactElement } from "react";
import { Input } from "@/components/ui";
import { Info, Tag } from "lucide-react";
import type { ChannelAlias } from "./types.ts";

interface ChannelAliasEditorProps {
  channelKeys: string[];
  aliases: ChannelAlias[];
  onChange: (aliases: ChannelAlias[]) => void;
  selfChannelKey?: string | null;
  onSelfChannelChange?: (channelKey: string | null) => void;
}

/**
 * Display channel data access reference with optional visual labels
 */
export default function ChannelAliasEditor({
  channelKeys,
  aliases,
  onChange,
  selfChannelKey,
  onSelfChannelChange,
}: ChannelAliasEditorProps): ReactElement {
  const getAlias = (channelKey: string): string => {
    return aliases.find((a) => a.channelKey === channelKey)?.alias || "";
  };

  const handleAliasChange = (channelKey: string, alias: string): void => {
    const sanitized = alias.toLowerCase().replace(/[^a-z0-9_]/g, "");

    // Check for duplicate aliases
    const isDuplicate = aliases.some(
      (a) => a.alias === sanitized && a.channelKey !== channelKey,
    );

    const updated = aliases.filter((a) => a.channelKey !== channelKey);

    if (sanitized && !isDuplicate) {
      updated.push({ channelKey, alias: sanitized });
    }

    onChange(updated);
  };

  // Extract symbol from channel key (e.g., BTC/USDT → btc, SOL/USDT → sol)
  const extractSymbol = (channelKey: string): string => {
    // Match pattern like .BTC/USDT. or .SOLUSDT.
    const match = channelKey.match(
      /\.([A-Z]{3,10})(?:\/[A-Z]{3,10}|USDT|USD|USDC)\./i,
    );
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
    return "";
  };

  // Auto-suggest aliases based on channel type and symbol
  const suggestAlias = (channelKey: string): string => {
    const symbol = extractSymbol(channelKey);

    if (channelKey.includes(".ticker.")) {
      return symbol ? `${symbol}_ticker` : "ticker";
    }
    if (channelKey.includes(".book.")) {
      return symbol ? `${symbol}_book` : "book";
    }
    if (channelKey.includes(".trades.")) {
      return symbol ? `${symbol}_trades` : "trades";
    }

    return symbol || "";
  };

  const handleAutoSuggest = (channelKey: string): void => {
    const suggested = suggestAlias(channelKey);
    if (suggested) {
      handleAliasChange(channelKey, suggested);
    }
  };

  if (channelKeys.length === 0) {
    return (
      <div className="p-2 bg-blue-500/10 rounded border border-blue-500/30">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Info className="w-3 h-3 text-blue-700 dark:text-blue-400" />
          <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wide">
            Universal Mode
          </span>
        </div>
        <code className="text-[10px] text-green-700 dark:text-green-600 font-mono block bg-background/50 px-2 py-1 rounded border border-border">
          {"{self.raw.data.last}"} • {"{self.raw.exchange}"}
        </code>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="p-2 bg-blue-500/10 rounded border border-blue-500/30">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Info className="w-3 h-3 text-blue-700 dark:text-blue-400" />
          <span className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wide">
            Data Access
          </span>
        </div>
        <div className="flex gap-2">
          <code className="flex-1 text-[10px] text-green-700 dark:text-green-600 font-mono block bg-background/50 px-2 py-1 rounded border border-border">
            {"{self.raw.data.last}"}
          </code>
          <code className="flex-1 text-[10px] text-blue-700 dark:text-blue-400 font-mono block bg-background/50 px-2 py-1 rounded border border-border">
            {`{${getAlias(channelKeys[0]) || "alias"}.raw...}`}
          </code>
        </div>
      </div>

      {/* Self Channel Selector - Compact */}
      {channelKeys.length > 0 && onSelfChannelChange && (
        <div className="p-2 bg-green-500/10 rounded border border-green-500/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1 h-1 bg-green-500 rounded-full" />
            <span className="text-[10px] text-green-700 dark:text-green-600 font-semibold uppercase tracking-wide">
              Self Channel
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {channelKeys.map((channelKey) => {
              const isSelf = selfChannelKey === channelKey;
              const symbol =
                channelKey.match(/\.([A-Z]{3,10})(?:\/|USDT)/)?.[1] ||
                channelKey.split(".").pop()?.slice(0, 6);
              return (
                <button
                  key={channelKey}
                  onClick={() => onSelfChannelChange(channelKey)}
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${
                    isSelf
                      ? "bg-green-500/20 border-green-500/50 text-green-800 dark:text-green-300"
                      : "bg-card border-border text-muted-foreground hover:border-green-500/30"
                  }`}
                  title={channelKey}
                >
                  {symbol}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-foreground font-semibold uppercase tracking-wide">
            Aliases
          </span>
        </div>
        <span className="text-[9px] text-green-500">
          Click chip to auto-fill
        </span>
      </div>

      <div className="space-y-1.5">
        {channelKeys.map((channelKey, idx) => {
          const currentAlias = getAlias(channelKey);
          const suggested = suggestAlias(channelKey);
          const isSuggestedTaken = aliases.some(
            (a) => a.alias === suggested && a.channelKey !== channelKey,
          );
          const symbol = channelKey.match(/\.([A-Z]{3,10})(?:\/|USDT)/)?.[1];

          return (
            <div
              key={channelKey}
              className="flex items-center gap-1.5 p-1.5 bg-card/50 rounded border border-border"
            >
              {/* Channel symbol/indicator */}
              <div
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                  currentAlias
                    ? "bg-green-500/20 text-green-700 dark:text-green-600 border border-green-500/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {symbol || idx + 1}
              </div>

              {/* Alias input */}
              <Input
                value={currentAlias}
                onChange={(e) => handleAliasChange(channelKey, e.target.value)}
                placeholder={suggested || `ch${idx + 1}`}
                className="h-6 text-[11px] font-mono flex-1"
              />

              {/* Auto-suggest chip */}
              {!currentAlias && suggested && !isSuggestedTaken && (
                <button
                  onClick={() => handleAutoSuggest(channelKey)}
                  className="px-1.5 py-0.5 text-[10px] text-amber-500 hover:text-amber-700 dark:text-amber-400 rounded border border-amber-500/30 bg-amber-500/10 transition-colors font-mono"
                  title={`Use "${suggested}"`}
                >
                  {suggested}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Active aliases preview - compact */}
      {aliases.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {aliases.map((alias) => (
            <code
              key={alias.alias}
              className="text-[10px] text-green-700 dark:text-green-600 font-mono bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/30"
              title={alias.channelKey}
            >
              {alias.alias}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}
