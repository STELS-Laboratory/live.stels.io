/**
 * Schema Statistics Component
 * Shows metadata and statistics about active schema
 */

import type { ReactElement } from "react";
import type { SchemaProject } from "./types.ts";
import { Calendar, Clock, FileJson, Link2 } from "lucide-react";

interface SchemaStatsProps {
  schema: SchemaProject;
  jsonLength: number;
}

/**
 * Display schema statistics and metadata
 */
export default function SchemaStats({
  schema,
  jsonLength,
}: SchemaStatsProps): ReactElement {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = [
    {
      icon: FileJson,
      label: "Size",
      value: `${jsonLength} chars`,
      color: "text-blue-500",
    },
    {
      icon: Link2,
      label: "Channels",
      value: schema.channelKeys.length.toString(),
      color: "text-green-500",
    },
    {
      icon: Calendar,
      label: "Created",
      value: formatDate(schema.createdAt),
      color: "text-muted-foreground",
    },
    {
      icon: Clock,
      label: "Updated",
      value: formatDate(schema.updatedAt),
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-1.5 p-1.5 bg-card/50 rounded border border-border"
          >
            <Icon className={`w-3 h-3 ${stat.color}`} />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </span>
              <span className="text-[10px] text-foreground font-medium">
                {stat.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
