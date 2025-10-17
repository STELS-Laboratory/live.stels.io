import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  EyeOff,
  Filter,
  Info,
  Network,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutoConnectionConfig } from "@/lib/canvas-types";

/**
 * Props for the AutoConnectionsSettings component
 */
interface AutoConnectionsSettingsProps {
  /** Current configuration */
  config: AutoConnectionConfig;
  /** Whether auto connections are enabled */
  isEnabled: boolean;
  /** Callback to toggle auto connections */
  onToggle: () => void;
  /** Callback to update configuration */
  onUpdateConfig: (config: Partial<AutoConnectionConfig>) => void;
  /** Connection statistics */
  stats?: {
    nodeCount: number;
    edgeCount: number;
    groupCount: number;
    connectionsByType: Record<string, number>;
  };
  /** Available grouping keys */
  availableKeys: string[];
}

/**
 * Settings panel for auto connections configuration
 */
function AutoConnectionsSettings({
  config,
  isEnabled,
  onToggle,
  onUpdateConfig,
  stats,
  availableKeys,
}: AutoConnectionsSettingsProps): React.ReactElement {
  const toggleGroupingKey = (key: string) => {
    const currentKeys = config.groupByKeys;
    const typedKey = key as keyof import("@/lib/canvas-types").ConnectionKeys;
    const newKeys = currentKeys.includes(typedKey)
      ? currentKeys.filter((k) => k !== key)
      : [...currentKeys, typedKey];

    onUpdateConfig({ groupByKeys: newKeys });
  };

  const toggleShowLabels = () => {
    onUpdateConfig({ showLabels: !config.showLabels });
  };

  const getKeyIcon = (key: string) => {
    const icons = {
      exchange: "🏛️",
      market: "📈",
      asset: "💰",
      base: "🪙",
      quote: "💱",
      type: "🔧",
      module: "📦",
    };
    return icons[key as keyof typeof icons] || "🔗";
  };

  const getKeyColor = (key: string) => {
    const colors = {
      exchange: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      market: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      asset: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      base: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      quote: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      type: "bg-red-500/20 text-red-400 border-red-500/30",
      module: "bg-lime-500/20 text-lime-400 border-lime-500/30",
    };
    return colors[key as keyof typeof colors] ||
      "bg-muted/20 text-muted-foreground border-border/30";
  };

  return (
    <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg text-foreground">
              Auto Connections
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "transition-all duration-200",
              isEnabled
                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                : "bg-secondary/50 text-muted-foreground hover:bg-muted/50",
            )}
          >
            {isEnabled
              ? <Eye className="h-4 w-4" />
              : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription className="text-muted-foreground">
          Automatically connect nodes based on shared properties
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics */}
        {stats && isEnabled && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Connection Statistics
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-muted-foreground">Nodes</div>
                <div className="text-foreground font-medium">
                  {stats.nodeCount}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-muted-foreground">Groups</div>
                <div className="text-foreground font-medium">
                  {stats.groupCount}
                </div>
              </div>
            </div>

            {Object.keys(stats.connectionsByType).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Connections by type:
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.connectionsByType).map((
                    [type, count],
                  ) => (
                    <Badge
                      key={type}
                      className={cn(
                        "text-xs px-2 py-1",
                        getKeyColor(type),
                      )}
                    >
                      {getKeyIcon(type)} {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grouping Keys */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Group By</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {availableKeys.map((key) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => toggleGroupingKey(key)}
                className={cn(
                  "justify-start text-xs h-auto p-2 transition-all duration-200",
                  config.groupByKeys.includes(
                      key as keyof import("@/lib/canvas-types").ConnectionKeys,
                    )
                    ? getKeyColor(key)
                    : "bg-muted/30 text-muted-foreground hover:bg-secondary/50 hover:text-muted-foreground",
                )}
              >
                <span className="mr-2">{getKeyIcon(key)}</span>
                <span className="capitalize">{key}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-secondary" />

        {/* Display Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Display Options</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-card-foreground">Show Labels</span>
            </div>
            <Switch
              checked={config.showLabels}
              onCheckedChange={toggleShowLabels}
            />
          </div>
        </div>

        {/* Status */}
        <div className="pt-2">
          <div
            className={cn(
              "flex items-center justify-center space-x-2 p-2 rounded-lg text-xs font-medium",
              isEnabled
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-muted/50 text-muted-foreground border border-border/50",
            )}
          >
            <Zap className="h-3 w-3" />
            <span>
              {isEnabled
                ? "Auto connections active"
                : "Auto connections disabled"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AutoConnectionsSettings;
