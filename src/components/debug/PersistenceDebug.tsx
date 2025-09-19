import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFlowPersistence } from "@/hooks/useFlowPersistence";

/**
 * Debug component for testing flow persistence
 */
export const PersistenceDebug: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { loadNodes, loadEdges, loadViewport, clearAllData } =
    useFlowPersistence();

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-black/20 text-white border-white/20 hover:bg-white/10"
        >
          Debug Persistence
        </Button>
      </div>
    );
  }

  const nodes = loadNodes();
  const edges = loadEdges();
  const viewport = loadViewport();

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Card className="w-80 bg-black/80 text-white border-white/20">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Persistence Debug</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs">Nodes:</span>
            <Badge
              variant="secondary"
              className="bg-amber-500/20 text-amber-300"
            >
              {nodes.length}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs">Edges:</span>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
              {edges.length}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs">Viewport:</span>
            <Badge
              variant="secondary"
              className="bg-green-500/20 text-green-300"
            >
              {viewport ? "Saved" : "None"}
            </Badge>
          </div>

          {viewport && (
            <div className="text-xs space-y-1 bg-zinc-800/50 p-2 rounded">
              <div>X: {viewport.x.toFixed(2)}</div>
              <div>Y: {viewport.y.toFixed(2)}</div>
              <div>Zoom: {viewport.zoom.toFixed(2)}</div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => {
                console.log("Current nodes:", nodes);
                console.log("Current edges:", edges);
                console.log("Current viewport:", viewport);
              }}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              Log to Console
            </Button>

            <Button
              onClick={() => {
                if (confirm("Clear all saved data?")) {
                  clearAllData();
                  window.location.reload();
                }
              }}
              variant="destructive"
              size="sm"
              className="w-full text-xs"
            >
              Clear & Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
