import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Download,
  FileDown,
  FileUp,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCanvasStore } from "@/apps/canvas/store";
import type { Panel } from "@/lib/panel-types";
import { toast } from "@/stores";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PanelTabsProps {
  className?: string;
}

interface PanelTabProps {
  panel: Panel;
  isActive: boolean;
  nodeCount: number;
  onClick: () => void;
  onClose: () => void;
  onRename: () => void;
  onExport: () => void;
  onDuplicate: () => void;
}

/**
 * Download JSON file helper
 */
function downloadJSON(filename: string, jsonData: string): void {
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Professional Panel Tab Component
 */
const PanelTab: React.FC<PanelTabProps> = ({
  panel,
  isActive,
  nodeCount,
  onClick,
  onClose,
  onRename,
  onExport,
  onDuplicate,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2",
        "border-r",
        "transition-colors duration-150",
        "cursor-pointer select-none",
        isActive ? "" : "",
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 dark:bg-amber-400" />
      )}

      {/* Panel name */}
      <span
        className={cn(
          "text-sm font-medium truncate max-w-[120px]",
          "transition-colors",
          isActive ? "" : "",
        )}
        title={panel.name}
      >
        {panel.name}
      </span>

      {/* Node count */}
      {nodeCount > 0 && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "text-[10px] font-mono font-semibold",
                  "px-1.5 py-0.5 rounded",
                  "tabular-nums",
                  isActive
                    ? "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
                    : "",
                )}
              >
                {nodeCount}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>{nodeCount} node{nodeCount !== 1 ? "s" : ""}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Actions - show on hover or active */}
      <div
        className={cn(
          "flex items-center gap-0.5 ml-auto",
          "transition-opacity duration-150",
          isActive || isHovered ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-zinc-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              className="text-xs"
            >
              <Pencil className="mr-2 h-3 w-3" />
              Rename
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="text-xs"
            >
              <FolderPlus className="mr-2 h-3 w-3" />
              Duplicate
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              className="text-xs"
            >
              <FileDown className="mr-2 h-3 w-3" />
              Export
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-xs text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Close button */}
        <button
          className="p-1 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Professional Panel Tabs Container
 */
export const PanelTabsPro: React.FC<PanelTabsProps> = ({ className }) => {
  const panels = useCanvasStore((state): Panel[] => state.panels.panels);
  const activePanelId = useCanvasStore((state): string | null =>
    state.panels.activePanelId
  );
  const panelData = useCanvasStore((
    state,
  ): Record<string, import("@/lib/panel-types").PanelData> =>
    state.panels.panelData
  );
  const setActivePanel = useCanvasStore((state): (panelId: string) => void =>
    state.setActivePanel
  );
  const updatePanel = useCanvasStore((
    state,
  ): (panelId: string, updates: Partial<Panel>) => void => state.updatePanel);
  const deletePanel = useCanvasStore((state): (panelId: string) => void =>
    state.deletePanel
  );
  const createPanel = useCanvasStore((
    state,
  ): (name: string, description?: string) => string => state.createPanel);
  const duplicatePanel = useCanvasStore((state): (panelId: string) => string =>
    state.duplicatePanel
  );
  const exportPanel = useCanvasStore((state): (panelId: string) => string =>
    state.exportPanel
  );
  const exportAllPanels = useCanvasStore((state): () => string =>
    state.exportAllPanels
  );
  const importPanel = useCanvasStore((
    state,
  ): (jsonData: string) => string | null => state.importPanel);
  const importAllPanels = useCanvasStore((
    state,
  ): (jsonData: string) => boolean => state.importAllPanels);

  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputAllRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleStartRename = useCallback((panel: Panel) => {
    setEditingPanelId(panel.id);
    setEditName(panel.name);
  }, []);

  const handleSaveRename = useCallback(() => {
    if (editingPanelId && editName.trim()) {
      updatePanel(editingPanelId, { name: editName.trim() });
    }
    setEditingPanelId(null);
    setEditName("");
  }, [editingPanelId, editName, updatePanel]);

  const handleCancelRename = useCallback(() => {
    setEditingPanelId(null);
    setEditName("");
  }, []);

  const handleDeletePanel = useCallback(
    (panelId: string) => {
      if (panels.length <= 1) {
        toast.warning(
          "Cannot delete the last panel",
          "Create another panel first",
        );
        return;
      }

      // Delete panel without confirmation
      deletePanel(panelId);
    },
    [panels.length, deletePanel],
  );

  const handleExportPanel = useCallback(
    (panelId: string) => {
      try {
        const jsonData = exportPanel(panelId);
        const panel = panels.find((p: Panel) => p.id === panelId);
        const filename = `panel-${panel?.name || "export"}-${Date.now()}.json`;
        downloadJSON(filename, jsonData);
      } catch (error) {
        console.error("Export failed:", error);
        toast.error("Failed to export panel", "Please try again");
      }
    },
    [exportPanel, panels],
  );

  const handleExportAll = useCallback(() => {
    try {
      const jsonData = exportAllPanels();
      downloadJSON(`panels-all-${Date.now()}.json`, jsonData);
    } catch (error) {
      console.error("Export all failed:", error);
      toast.error("Failed to export panels", "Please try again");
    }
  }, [exportAllPanels]);

  const handleImportPanel = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string;
          const panelId = importPanel(jsonData);
          if (panelId) {
            setActivePanel(panelId);
          } else {
            toast.error("Failed to import panel", "Invalid panel data");
          }
        } catch (error) {
          console.error("Import failed:", error);
          toast.error("Failed to import panel", "Please check the file format");
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    },
    [importPanel, setActivePanel],
  );

  const handleImportAllPanels = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Import panels without confirmation

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string;
          const success = importAllPanels(jsonData);
          if (!success) {
            toast.error("Failed to import panels", "Invalid data format");
          }
        } catch (error) {
          console.error("Import all failed:", error);
          toast.error(
            "Failed to import panels",
            "Please check the file format",
          );
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    },
    [importAllPanels],
  );

  const getNodeCount = useCallback(
    (panelId: string): number => {
      return panelData[panelId]?.nodes?.length || 0;
    },
    [panelData],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === "t") {
        event.preventDefault();
        createPanel("New Panel");
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "w") {
        event.preventDefault();
        if (activePanelId && panels.length > 1) {
          handleDeletePanel(activePanelId);
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Tab") {
        event.preventDefault();
        const currentIndex = panels.findIndex((p: Panel) =>
          p.id === activePanelId
        );
        const nextIndex = (currentIndex + 1) % panels.length;
        setActivePanel(panels[nextIndex].id);
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "Tab"
      ) {
        event.preventDefault();
        const currentIndex = panels.findIndex((p: Panel) =>
          p.id === activePanelId
        );
        const prevIndex = currentIndex === 0
          ? panels.length - 1
          : currentIndex - 1;
        setActivePanel(panels[prevIndex].id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activePanelId, panels, createPanel, setActivePanel, handleDeletePanel]);

  return (
    <div
      className={cn(
        "flex items-stretch",
        "",
        "border-b ",
        className,
      )}
    >
      {/* Panel tabs - scrollable */}
      <div className="flex items-stretch flex-1 min-w-0 overflow-x-auto scrollbar-thin">
        {panels.map((panel: Panel) =>
          editingPanelId === panel.id
            ? (
              // Inline edit
              <div
                key={panel.id}
                className="flex items-center gap-2 px-3 py-2 border-r"
              >
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 text-xs px-2"
                  placeholder="Panel name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename();
                    if (e.key === "Escape") handleCancelRename();
                  }}
                  onBlur={handleSaveRename}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleSaveRename}
                >
                  <Save className="h-3 w-3" />
                </Button>
              </div>
            )
            : (
              <PanelTab
                key={panel.id}
                panel={panel}
                isActive={panel.id === activePanelId}
                nodeCount={getNodeCount(panel.id)}
                onClick={() => setActivePanel(panel.id)}
                onClose={() => handleDeletePanel(panel.id)}
                onRename={() => handleStartRename(panel)}
                onExport={() => handleExportPanel(panel.id)}
                onDuplicate={() => duplicatePanel(panel.id)}
              />
            )
        )}
      </div>

      {/* Toolbar - Professional */}
      <div className="flex items-stretch border-l ">
        {/* New panel */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => createPanel("New Panel")}
                className={cn(
                  "px-3 h-full",
                  "transition-colors",
                )}
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>New panel (⌘T)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Export/Import */}
        <DropdownMenu>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "px-3 h-full border-l",
                      "transition-colors",
                    )}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p>Import/Export</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleExportAll} className="text-xs">
              <FileDown className="mr-2 h-3 w-3" />
              Export all panels
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                if (activePanelId) handleExportPanel(activePanelId);
              }}
              disabled={!activePanelId}
              className="text-xs"
            >
              <Save className="mr-2 h-3 w-3" />
              Export active panel
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => fileInputRef.current?.click()}
              className="text-xs"
            >
              <FileUp className="mr-2 h-3 w-3" />
              Import panel
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => fileInputAllRef.current?.click()}
              className="text-xs text-amber-600 dark:text-amber-400"
            >
              <Upload className="mr-2 h-3 w-3" />
              Import all (replace)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportPanel}
        />
        <input
          ref={fileInputAllRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportAllPanels}
        />
      </div>
    </div>
  );
};

export default PanelTabsPro;
