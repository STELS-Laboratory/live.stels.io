/**
 * Session Data Viewer Component
 * Interactive JSON viewer with copy-to-clipboard for paths
 */

import { type ReactElement, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Button } from "@/components/ui";
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
      return <span className="text-muted-foreground">null</span>;
    }

    if (typeof value === "boolean") {
      return (
        <span className="text-blue-800 dark:text-blue-400">
          {value.toString()}
        </span>
      );
    }

    if (typeof value === "number") {
      return (
        <span className="text-purple-800 dark:text-purple-400">{value}</span>
      );
    }

    if (typeof value === "string") {
      return (
        <span className="text-green-800 dark:text-green-600">"{value}"</span>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">[]</span>;
      }

      return (
        <span>
          <span className="text-muted-foreground">[</span>
          {"\n"}
          {value.map((item, idx) => (
            <span key={idx}>
              {indent} {renderValue(item, `${path}[${idx}]`, level + 1)}
              {idx < value.length - 1 ? "," : ""}
              {"\n"}
            </span>
          ))}
          {indent}
          <span className="text-muted-foreground">]</span>
        </span>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);

      if (entries.length === 0) {
        return <span className="text-muted-foreground">{"{}"}</span>;
      }

      return (
        <span>
          <span className="text-muted-foreground">{"{"}</span>
          {"\n"}
          {entries.map(([key, val], idx) => {
            const fullPath = path ? `${path}.${key}` : key;
            return (
              <span key={key}>
                {indent}
                <button
                  onClick={() => handleCopyPath(fullPath)}
                  className="text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors cursor-pointer inline-flex items-center gap-0.5 group"
                  title={`Click to copy: {${fullPath}}`}
                >
                  "{key}"
                  {copiedPath === fullPath
                    ? (
                      <Check className="w-2.5 h-2.5 text-green-700 dark:text-green-500" />
                    )
                    : (
                      <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </button>
                <span className="text-muted-foreground">:</span>
                {renderValue(val, fullPath, level + 1)}
                {idx < entries.length - 1 ? "," : ""}
                {"\n"}
              </span>
            );
          })}
          {indent}
          <span className="text-muted-foreground">{"}"}</span>
        </span>
      );
    }

    return <span className="text-muted-foreground">{String(value)}</span>;
  };

  return (
    <div className="flex-shrink-0 border-t border-border bg-card/10">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">
            Session Data
          </span>
          {channelsData.length > 0 && selfChannelKey && (
            <code className="text-[9px] font-mono text-green-950 dark:text-green-600 bg-green-200 dark:bg-green-500/10 px-1 py-0.5 rounded font-bold">
              self={selfChannelKey.match(/\.([A-Z]{3,10})(?:\/|USDT)/)?.[1] ||
                "..."}
            </code>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="h-5 px-1.5 text-[10px]"
          >
            Expand
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="h-5 px-1.5 text-[10px]"
          >
            Collapse
          </Button>
          <span className="text-[10px] text-muted-foreground ml-1">
            {channelsData.length}
          </span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto p-2 bg-background">
        <div className="space-y-1">
          {channelsData.map((channel) => {
            const isExpanded = expandedChannels[channel.key];
            const originalKey = getOriginalKey(channel.key);
            const isSelf = channel.key === "self" ||
              originalKey === selfChannelKey;

            return (
              <div
                key={channel.key}
                className="border border-border rounded bg-card/10"
              >
                <button
                  onClick={() => toggleChannel(channel.key)}
                  className="w-full flex items-center justify-between p-1.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {isExpanded
                      ? (
                        <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      )
                      : (
                        <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      )}
                    <span className="text-[10px] font-mono text-green-800 dark:text-green-600 font-semibold">
                      {channel.key}
                    </span>
                    {isSelf && (
                      <span className="text-[9px] px-1 py-0.5 bg-green-200 text-green-950 dark:bg-green-500/30 dark:text-black rounded font-bold">
                        SELF
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {Object.keys(channel.data).length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-2">
                    <pre className="text-[10px] font-mono">
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
