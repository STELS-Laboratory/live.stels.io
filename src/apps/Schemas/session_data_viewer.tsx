/**
 * Session Data Viewer Component
 * Interactive JSON viewer with copy-to-clipboard for paths
 */

import { type ReactElement, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import type { ChannelAlias, ChannelData } from "./types.ts";

interface SessionDataViewerProps {
  channelsData: ChannelData[];
  channelAliases: ChannelAlias[];
  selfChannelKey?: string | null;
}

interface ChannelExpanded {
  [key: string]: boolean;
}

/**
 * Display session data in formatted JSON with clickable paths
 */
export default function SessionDataViewer({
  channelsData,
  channelAliases,
  selfChannelKey,
}: SessionDataViewerProps): ReactElement {
  // Get original channel key from alias
  const getOriginalKey = (alias: string): string => {
    const found = channelAliases.find((a) => a.alias === alias);
    return found?.channelKey || alias;
  };
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedChannels, setExpandedChannels] = useState<ChannelExpanded>(
    () => {
      // Auto-expand first channel by default
      const initial: ChannelExpanded = {};
      if (channelsData.length > 0 && channelsData[0]) {
        initial[channelsData[0].key] = true;
      }
      return initial;
    },
  );

  const toggleChannel = (channelKey: string): void => {
    setExpandedChannels((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
  };

  const expandAll = (): void => {
    const allExpanded: ChannelExpanded = {};
    channelsData.forEach((channel) => {
      allExpanded[channel.key] = true;
    });
    setExpandedChannels(allExpanded);
  };

  const collapseAll = (): void => {
    setExpandedChannels({});
  };

  const handleCopyPath = async (path: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(`{${path}}`);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Render JSON with clickable keys
  const renderValue = (
    value: unknown,
    path: string,
    level: number = 0,
  ): ReactElement => {
    const indent = "  ".repeat(level);

    if (value === null) {
      return <span className="text-zinc-500">null</span>;
    }

    if (typeof value === "boolean") {
      return <span className="text-blue-400">{value.toString()}</span>;
    }

    if (typeof value === "number") {
      return <span className="text-purple-400">{value}</span>;
    }

    if (typeof value === "string") {
      return <span className="text-green-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-zinc-400">[]</span>;
      }

      return (
        <span>
          <span className="text-zinc-400">[</span>
          {"\n"}
          {value.map((item, idx) => (
            <span key={idx}>
              {indent} {renderValue(item, `${path}[${idx}]`, level + 1)}
              {idx < value.length - 1 ? "," : ""}
              {"\n"}
            </span>
          ))}
          {indent}
          <span className="text-zinc-400">]</span>
        </span>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);

      if (entries.length === 0) {
        return <span className="text-zinc-400">{"{}"}</span>;
      }

      return (
        <span>
          <span className="text-zinc-400">{"{"}</span>
          {"\n"}
          {entries.map(([key, val], idx) => {
            const fullPath = path ? `${path}.${key}` : key;
            return (
              <span key={key}>
                {indent}
                <button
                  onClick={() => handleCopyPath(fullPath)}
                  className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer inline-flex items-center gap-1 group"
                  title={`Click to copy: {${fullPath}}`}
                >
                  "{key}"
                  {copiedPath === fullPath
                    ? <Check className="w-3 h-3 text-green-500" />
                    : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </button>
                <span className="text-zinc-400">:</span>
                {renderValue(val, fullPath, level + 1)}
                {idx < entries.length - 1 ? "," : ""}
                {"\n"}
              </span>
            );
          })}
          {indent}
          <span className="text-zinc-400">{"}"}</span>
        </span>
      );
    }

    return <span className="text-zinc-400">{String(value)}</span>;
  };

  return (
    <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/50">
      <div className="flex flex-col gap-2 p-2 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-400">
              Session Data — Click keys to copy
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={expandAll}
                className="text-xs text-zinc-500 hover:text-amber-400 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800"
              >
                Expand All
              </button>
              <span className="text-zinc-700">|</span>
              <button
                onClick={collapseAll}
                className="text-xs text-zinc-500 hover:text-amber-400 transition-colors px-2 py-0.5 rounded hover:bg-zinc-800"
              >
                Collapse All
              </button>
            </div>
          </div>
          <span className="text-xs text-zinc-500">
            {channelsData.length} channel{channelsData.length !== 1 ? "s" : ""}
          </span>
        </div>
        {channelsData.length > 0 && selfChannelKey && (
          <div className="px-2 py-1 bg-green-500/10 rounded border border-green-500/20">
            <span className="text-[10px] text-green-400">
              ✨ <code className="font-mono text-green-300">self</code> ={" "}
              <code className="font-mono text-green-200">{selfChannelKey}</code>
            </span>
          </div>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto p-3 bg-zinc-950">
        <div className="space-y-2">
          {channelsData.map((channel) => {
            const isExpanded = expandedChannels[channel.key];
            const originalKey = getOriginalKey(channel.key);
            const isAlias = originalKey !== channel.key;
            const isSelf = channel.key === "self" ||
              originalKey === selfChannelKey;

            return (
              <div
                key={channel.key}
                className="border border-zinc-800 rounded bg-zinc-900/50"
              >
                <button
                  onClick={() => toggleChannel(channel.key)}
                  className="w-full flex flex-col gap-1 p-2 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isExpanded
                        ? (
                          <ChevronDown className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                        )
                        : (
                          <ChevronRight className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                        )}
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-green-400 font-semibold">
                            {channel.key}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/30 text-green-300 rounded font-semibold">
                              SELF
                            </span>
                          )}
                        </div>
                        {isAlias && (
                          <span className="text-[10px] font-mono text-zinc-500 truncate">
                            → {originalKey}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600 flex-shrink-0 ml-2">
                      {Object.keys(channel.data).length} keys
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-600 ml-5">
                    Click keys below to copy: {`{${channel.key}.raw.data.last}`}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800 p-3">
                    <pre className="text-xs font-mono">
                      {renderValue(channel.data, channel.key)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
