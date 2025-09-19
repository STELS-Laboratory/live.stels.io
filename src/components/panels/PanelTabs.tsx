import React, { useState } from "react";
import {
  Copy,
  Edit2,
  MoreVertical,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
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
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSettings: () => void;
}

/**
 * Individual panel tab component
 */
const PanelTab: React.FC<PanelTabProps> = ({
  panel,
  isActive,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
  onSettings,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex items-center min-w-0 cursor-pointer",
        "border-b-2 transition-all duration-200",
        isActive
          ? "border-amber-500 bg-amber-500/10"
          : "border-transparent hover:border-zinc-400/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50",
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

      {/* Panel actions menu */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "h-6 w-6 p-0 hover:bg-zinc-200 dark:hover:bg-zinc-700",
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>

        {showMenu && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg">
            <div className="py-1">
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
              >
                <Edit2 className="h-3 w-3 mr-2" />
                Rename
              </button>

              <button
                className="flex items-center w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                  setShowMenu(false);
                }}
              >
                <Copy className="h-3 w-3 mr-2" />
                Duplicate
              </button>

              <button
                className="flex items-center w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onSettings();
                  setShowMenu(false);
                }}
              >
                <Settings className="h-3 w-3 mr-2" />
                Settings
              </button>

              <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />

              <button
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </button>
            </div>
          </div>
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
    createPanel,
    updatePanel,
    duplicatePanel,
    deletePanel,
  } = usePanelStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPanel, setEditingPanel] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreatePanel = () => {
    const name = prompt("Enter panel name:");
    if (name && name.trim()) {
      createPanel(name.trim());
    }
  };

  const handleEditPanel = (panel: Panel) => {
    setEditingPanel(panel.id);
    setEditName(panel.name);
  };

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

  const handleDuplicatePanel = (panelId: string) => {
    duplicatePanel(panelId);
  };

  const handleDeletePanel = (panelId: string) => {
    if (panels.length <= 1) {
      alert("Cannot delete the last panel. Create another panel first.");
      return;
    }

    if (
      confirm(
        "Are you sure you want to delete this panel? This action cannot be undone.",
      )
    ) {
      deletePanel(panelId);
    }
  };

  const handlePanelSettings = (panel: Panel) => {
    // TODO: Implement panel settings dialog
    console.log("Panel settings for:", panel.name);
  };

  return (
    <div
      className={cn(
        "flex items-center bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800",
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
            onEdit={() => handleEditPanel(panel)}
            onDuplicate={() => handleDuplicatePanel(panel.id)}
            onDelete={() => handleDeletePanel(panel.id)}
            onSettings={() => handlePanelSettings(panel)}
          />
        ))}
      </div>

      {/* Create new panel button */}
      <div className="flex items-center px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreatePanel}
          className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Create new panel"
        >
          <Plus className="h-4 w-4" />
        </Button>
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
