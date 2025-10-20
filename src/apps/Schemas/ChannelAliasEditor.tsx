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
}

/**
 * Display channel data access reference with optional visual labels
 */
export default function ChannelAliasEditor({
  channelKeys,
  aliases,
  onChange,
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
      <div className="p-3 bg-amber-500/10 rounded border border-amber-500/20">
        <p className="text-xs text-amber-500">
          Select channels first to set aliases
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-400" />
          <div className="text-xs text-blue-400 font-semibold">
            Required: Set Aliases for Data Access
          </div>
        </div>
        <div className="text-xs text-zinc-300 mb-2">
          Aliases are <strong>required</strong>{" "}
          to access channel data. Examples:
        </div>
        <div className="space-y-1 mt-2">
          <code className="text-xs text-green-400 font-mono block bg-zinc-950 px-3 py-2 rounded">
            {`{${getAlias(channelKeys[0]) || "alias"}.raw.data.last}`}{" "}
            — price data
          </code>
          <code className="text-xs text-blue-400 font-mono block bg-zinc-950 px-3 py-2 rounded">
            {`{${getAlias(channelKeys[0]) || "alias"}.raw.exchange}`}{" "}
            — exchange name
          </code>
        </div>
        {channelKeys.length > 1 && (
          <div className="text-xs text-amber-400 mt-2 bg-amber-500/10 px-2 py-1 rounded">
            ⚠️ Set unique aliases for all {channelKeys.length} channels below
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-zinc-300 font-semibold">
            Channel Aliases (Required)
          </span>
        </div>
        <span className="text-xs text-green-500">
          Click "Use" to auto-fill
        </span>
      </div>

      <div className="space-y-2">
        {channelKeys.map((channelKey, idx) => {
          const currentAlias = getAlias(channelKey);
          const suggested = suggestAlias(channelKey);

          // Check if this suggestion is already used
          const isSuggestedTaken = aliases.some(
            (a) => a.alias === suggested && a.channelKey !== channelKey,
          );

          return (
            <div
              key={channelKey}
              className="flex flex-col gap-2 p-3 bg-zinc-900/50 rounded border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500 font-mono truncate flex-1">
                  {channelKey}
                </div>
                {currentAlias && (
                  <span className="text-xs text-green-500 flex items-center gap-1 ml-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={currentAlias}
                  onChange={(e) =>
                    handleAliasChange(channelKey, e.target.value)}
                  placeholder={`e.g., ${suggested || `channel${idx + 1}`}`}
                  className="flex-1 h-8 text-sm font-mono"
                />
                {!currentAlias && suggested && !isSuggestedTaken && (
                  <button
                    onClick={() => handleAutoSuggest(channelKey)}
                    className="text-xs text-amber-500 hover:text-amber-400 px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 transition-colors whitespace-nowrap"
                  >
                    Use "{suggested}"
                  </button>
                )}
              </div>
              {currentAlias && (
                <div className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 space-y-1">
                  <div>
                    ✓ Access with:{" "}
                    <code className="font-mono text-green-400">
                      {`{${currentAlias}.raw.data.last}`}
                    </code>
                  </div>
                  <div className="text-zinc-400">
                    or{" "}
                    <code className="font-mono text-blue-400">
                      {`{${currentAlias}.raw.exchange}`}
                    </code>
                  </div>
                </div>
              )}
              {!currentAlias && (
                <div className="text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                  ⚠️ Alias required - click "Use" button or enter manually
                </div>
              )}
            </div>
          );
        })}
      </div>

      {aliases.length > 0 && (
        <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
          <div className="text-xs text-green-400 mb-2 font-semibold">
            ✓ Ready to use in schema:
          </div>
          <div className="text-xs text-zinc-400 space-y-2">
            {aliases.slice(0, 3).map((alias) => (
              <div key={alias.alias}>
                <div className="text-zinc-500 mb-0.5 text-[10px]">
                  // {alias.channelKey}
                </div>
                <div className="space-y-1">
                  <code className="text-green-400 font-mono block bg-zinc-950 px-2 py-1 rounded">
                    {`{${alias.alias}.raw.data.last}`}
                  </code>
                  <code className="text-blue-400 font-mono block bg-zinc-950 px-2 py-1 rounded">
                    {`{${alias.alias}.raw.exchange} {${alias.alias}.raw.market}`}
                  </code>
                </div>
              </div>
            ))}
            {aliases.length > 3 && (
              <div className="text-zinc-600 italic">
                +{aliases.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}

      {channelKeys.length > 0 && aliases.length < channelKeys.length && (
        <div className="p-3 bg-amber-500/10 rounded border border-amber-500/20">
          <div className="text-xs text-amber-500">
            ⚠️ {channelKeys.length - aliases.length} channel
            {channelKeys.length - aliases.length !== 1 ? "s" : ""}{" "}
            need aliases. Click "Use" buttons above to auto-fill.
          </div>
        </div>
      )}
    </div>
  );
}
