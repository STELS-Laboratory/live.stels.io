/**
 * Example Component
 * Demonstrates component structure and patterns
 *
 * INSTRUCTIONS:
 * 1. Copy this file for new components
 * 2. Update interface and component names
 * 3. Follow STELS component standards
 */

import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Component props interface
 * Always fully type your props
 */
export interface ExampleComponentProps {
  /** Component title */
  title: string;
  /** Data to display */
  data: Array<{ id: string; name: string; value: number }>;
  /** Active status */
  isActive?: boolean;
  /** Callback when item is selected */
  onSelect?: (id: string) => void;
  /** Optional class name */
  className?: string;
}

/**
 * Example Component
 * Demonstrates best practices for STELS components
 */
export function ExampleComponent({
  title,
  data,
  isActive = false,
  onSelect,
  className,
}: ExampleComponentProps): React.ReactElement {
  // Local state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoized calculations
  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  // Optimized callbacks
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      onSelect?.(id);
    },
    [onSelect],
  );

  const handleRefresh = useCallback(async () => {
    setIsProcessing(true);
    // Simulated async operation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsProcessing(false);
  }, []);

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isActive && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            {title}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {data.length} items
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isProcessing}
              className="h-7 w-7 p-0"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isProcessing && "animate-spin")}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Summary Stats */}
        <div className="p-3 bg-muted/30 rounded border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Value</span>
            <span className="text-sm font-bold text-foreground">
              {totalValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-1">
          {sortedData.length === 0
            ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No items found</p>
              </div>
            )
            : (
              sortedData.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded border transition-all",
                    selectedId === item.id
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-muted/30 border-border hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-foreground">{item.name}</span>
                    {selectedId === item.id && (
                      <Check className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {item.value.toLocaleString()}
                  </span>
                </button>
              ))
            )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Set display name for debugging
 */
ExampleComponent.displayName = "ExampleComponent";

export default ExampleComponent;
