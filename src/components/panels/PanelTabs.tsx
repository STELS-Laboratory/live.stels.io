import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePanelStore } from "@/stores/modules/panel.store";
import type { Panel } from "@/lib/panel-types";

interface PanelTabsProps {
  className?: string;
}

interface PanelTabProps {
  panel: Panel;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Individual panel tab component
 */
const PanelTab: React.FC<PanelTabProps> = ({
  panel,
  isActive,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "group relative flex items-center min-w-0 cursor-pointer",
        "border-b-2 transition-all duration-300 ease-in-out",
        isActive
          ? "border-amber-500 bg-amber-500/10 scale-105 shadow-sm"
          : "border-transparent hover:border-zinc-400/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:scale-102",
      )}
      onClick={onClick}
    >
      <div className="flex items-center px-3 py-2 min-w-0 flex-1">
        <span
          className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-amber-500" : "text-zinc-600 dark:text-zinc-400",
          )}
        >
          {panel.name}
        </span>

        {panel.description && (
          <Badge
            variant="secondary"
            className="ml-2 text-xs bg-zinc-200/50 dark:bg-zinc-700/50"
          >
            {panel.description.length > 20
              ? `${panel.description.substring(0, 20)}...`
              : panel.description}
          </Badge>
        )}
      </div>
    </div>
  );
};

/**
 * Panel tabs container component
 */
export const PanelTabs: React.FC<PanelTabsProps> = ({ className }) => {
  const {
    panels,
    activePanelId,
    setActivePanel,
    updatePanel,
  } = usePanelStore();

  const [editingPanel, setEditingPanel] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleSaveEdit = () => {
    if (editingPanel && editName.trim()) {
      updatePanel(editingPanel, { name: editName.trim() });
      setEditingPanel(null);
      setEditName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingPanel(null);
    setEditName("");
  };

  return (
    <div
      className={cn(
        "flex items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out",
        className,
      )}
    >
      {/* Panel tabs */}
      <div className="flex items-center flex-1 min-w-0 overflow-x-auto">
        {panels.map((panel) => (
          <PanelTab
            key={panel.id}
            panel={panel}
            isActive={panel.id === activePanelId}
            onClick={() => setActivePanel(panel.id)}
          />
        ))}
      </div>

      {/* Inline edit dialog */}
      {editingPanel && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg p-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              placeholder="Panel name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") handleCancelEdit();
              }}
            />
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={!editName.trim()}
              className="h-7 px-2"
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              className="h-7 px-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
