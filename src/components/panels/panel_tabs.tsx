import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
	Download,
	FileDown,
	FileUp,
	FolderPlus,
	GripVertical,
	MoreVertical,
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
	onContextMenu: (e: React.MouseEvent) => void;
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
 * Individual panel tab component with professional design
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
	onContextMenu,
}) => {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className={cn(
				"group relative flex items-center min-w-0 cursor-pointer select-none",
				"transition-all duration-200 ease-out",
				"border-r border-border/50",
				isActive ? "bg-primary/10" : "bg-transparent hover:bg-muted/50",
			)}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Active indicator */}
			{isActive && (
				<div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
			)}

			{/* Content */}
			<div className="flex items-center gap-2 px-3 py-2 min-w-0 flex-1">
				{/* Drag handle - subtle */}
				<GripVertical
					className={cn(
						"h-3 w-3 flex-shrink-0 transition-opacity",
						isActive || isHovered
							? "opacity-40 text-muted-foreground"
							: "opacity-0",
					)}
				/>

				{/* Panel name */}
				<span
					className={cn(
						"text-xs font-medium truncate transition-colors",
						isActive ? "text-primary" : "text-muted-foreground",
					)}
					title={panel.name}
				>
					{panel.name}
				</span>

				{/* Node count badge - minimal */}
				{nodeCount > 0 && (
					<TooltipProvider delayDuration={300}>
						<Tooltip>
							<TooltipTrigger asChild>
								<span
									className={cn(
										"text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors flex-shrink-0",
										isActive
											? "bg-primary/20 text-primary"
											: "bg-muted text-muted-foreground",
									)}
								>
									{nodeCount}
								</span>
							</TooltipTrigger>
							<TooltipContent side="bottom" className="text-xs">
								<p>{nodeCount} node{nodeCount !== 1 ? "s" : ""} in panel</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>

			{/* Actions - only show on hover or active */}
			<div
				className={cn(
					"flex items-center gap-1 px-2 transition-opacity",
					isActive || isHovered ? "opacity-100" : "opacity-0",
				)}
			>
				{/* Context menu */}
				<DropdownMenu>
					<TooltipProvider delayDuration={300}>
						<Tooltip>
							<TooltipTrigger asChild>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-5 w-5 p-0 hover:bg-muted/80"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreVertical className="h-3 w-3" />
									</Button>
								</DropdownMenuTrigger>
							</TooltipTrigger>
							<TooltipContent side="bottom" className="text-xs">
								<p>Panel actions</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<DropdownMenuContent align="start" className="w-48">
						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onRename();
							}}
							className="text-xs"
						>
							<Pencil className="mr-2 h-3 w-3" />
							Rename panel
						</DropdownMenuItem>

						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onDuplicate();
							}}
							className="text-xs"
						>
							<FolderPlus className="mr-2 h-3 w-3" />
							Duplicate panel
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
							Export panel
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem
							onClick={(e) => {
								e.stopPropagation();
								onClose();
							}}
							className="text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
						>
							<Trash2 className="mr-2 h-3 w-3" />
							Delete panel
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Close button */}
				<TooltipProvider delayDuration={300}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-5 w-5 p-0 hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
								onClick={(e) => {
									e.stopPropagation();
									onClose();
								}}
							>
								<X className="h-3 w-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="text-xs">
							<p>Close panel (Ctrl+W)</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
};

/**
 * Panel tabs container component with professional toolbar
 */
export const PanelTabs: React.FC<PanelTabsProps> = ({ className }) => {
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

	// Handle panel rename
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

	// Handle panel delete
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

	// Handle export single panel
	const handleExportPanel = useCallback(
		(panelId: string) => {
			try {
				const jsonData = exportPanel(panelId);
				const panel = panels.find((p: Panel) => p.id === panelId);
				const filename = `panel-${panel?.name || "export"}-${Date.now()}.json`;
				downloadJSON(filename, jsonData);
			} catch {

				toast.error("Failed to export panel", "Please try again");
			}
		},
		[exportPanel, panels],
	);

	// Handle export all panels
	const handleExportAll = useCallback(() => {
		try {
			const jsonData = exportAllPanels();
			const filename = `panels-all-${Date.now()}.json`;
			downloadJSON(filename, jsonData);
		} catch {

			toast.error("Failed to export panels", "Please try again");
		}
	}, [exportAllPanels]);

	// Handle import single panel
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
						toast.success("Panel imported successfully!");
						setActivePanel(panelId);
					} else {
						toast.error("Failed to import panel", "Invalid panel data");
					}
				} catch {

					toast.error("Failed to import panel", "Please check the file format");
				}
			};
			reader.readAsText(file);

			// Reset input
			event.target.value = "";
		},
		[importPanel, setActivePanel],
	);

	// Handle import all panels
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
					if (success) {
						toast.success("All panels imported successfully!");
					} else {
						toast.error("Failed to import panels", "Invalid data format");
					}
				} catch {

					toast.error(
						"Failed to import panels",
						"Please check the file format",
					);
				}
			};
			reader.readAsText(file);

			// Reset input
			event.target.value = "";
		},
		[importAllPanels],
	);

	// Get node count for a panel
	const getNodeCount = useCallback(
		(panelId: string): number => {
			return panelData[panelId]?.nodes?.length || 0;
		},
		[panelData],
	);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent): void => {
			// Ctrl/Cmd + T: New panel
			if ((event.ctrlKey || event.metaKey) && event.key === "t") {
				event.preventDefault();
				createPanel("New Panel");
			}

			// Ctrl/Cmd + W: Close active panel
			if ((event.ctrlKey || event.metaKey) && event.key === "w") {
				event.preventDefault();
				if (activePanelId && panels.length > 1) {
					handleDeletePanel(activePanelId);
				}
			}

			// Ctrl/Cmd + Tab: Next panel
			if ((event.ctrlKey || event.metaKey) && event.key === "Tab") {
				event.preventDefault();
				const currentIndex = panels.findIndex((p: Panel) =>
					p.id === activePanelId
				);
				const nextIndex = (currentIndex + 1) % panels.length;
				setActivePanel(panels[nextIndex].id);
			}

			// Ctrl/Cmd + Shift + Tab: Previous panel
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
	}, [
		activePanelId,
		panels,
		createPanel,
		setActivePanel,
		handleDeletePanel,
	]);

	return (
		<div
			className={cn(
				"flex items-stretch bg-card border-b border-border/50",
				"transition-colors duration-200",
				className,
			)}
		>
			{/* Panel tabs - scrollable */}
			<div className="flex items-stretch flex-1 min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
				{panels.map((panel: Panel) =>
					editingPanelId === panel.id
						? (
							// Inline edit mode
							<div
								key={panel.id}
								className="flex items-center gap-2 px-3 py-2 border-r border-border/50 bg-muted/30 min-w-0"
							>
								<Input
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									className="h-6 text-xs px-2 flex-1 min-w-0"
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
									className="h-6 w-6 p-0"
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
								onContextMenu={(e) => {
									e.preventDefault();
									// Context menu is handled by dropdown
								}}
							/>
						)
				)}
			</div>

			{/* Toolbar - right side */}
			<div className="flex items-stretch border-l border-border/50 bg-muted/20">
				{/* New panel button */}
				<TooltipProvider delayDuration={300}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-full px-3 rounded-none hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
								onClick={() => createPanel("New Panel")}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="text-xs">
							<p>New panel (Ctrl+T)</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Export/Import menu */}
				<DropdownMenu>
					<TooltipProvider delayDuration={300}>
						<Tooltip>
							<TooltipTrigger asChild>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-full px-3 rounded-none hover:bg-muted/50"
									>
										<Download className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
							</TooltipTrigger>
							<TooltipContent side="bottom" className="text-xs">
								<p>Import/Export panels</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuItem
							onClick={handleExportAll}
							className="text-xs cursor-pointer"
						>
							<FileDown className="mr-2 h-3 w-3" />
							Export all panels
						</DropdownMenuItem>

						<DropdownMenuItem
							onClick={() => {
								if (activePanelId) {
									handleExportPanel(activePanelId);
								}
							}}
							disabled={!activePanelId}
							className="text-xs cursor-pointer"
						>
							<Save className="mr-2 h-3 w-3" />
							Export active panel
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem
							onClick={() => fileInputRef.current?.click()}
							className="text-xs cursor-pointer"
						>
							<FileUp className="mr-2 h-3 w-3" />
							Import panel
						</DropdownMenuItem>

						<DropdownMenuItem
							onClick={() => fileInputAllRef.current?.click()}
							className="text-xs cursor-pointer text-amber-600 dark:text-amber-400"
						>
							<Upload className="mr-2 h-3 w-3" />
							Import all panels (replace)
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Hidden file inputs */}
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
