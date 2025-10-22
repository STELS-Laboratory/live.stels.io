import React, { useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	Copy,
	Grid3X3,
	List,
	Plus,
	Settings,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/apps/canvas/store";
import type { Panel } from "@/lib/panel-types";

interface PanelManagerProps {
	isOpen: boolean;
	onClose: () => void;
}

interface PanelCardProps {
	panel: Panel;
	onEdit: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
}

/**
 * Individual panel card component
 */
const PanelCard: React.FC<PanelCardProps> = ({
	panel,
	onEdit,
	onDuplicate,
	onDelete,
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
}) => {
	const isActive = panel.isActive;

	return (
		<Card
			className={cn(
				"group cursor-pointer transition-all duration-200 border",
				isActive
					? "ring-2 ring-zinc-400/60 dark:ring-zinc-600/60 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-300/60 dark:border-zinc-700/60 shadow-md"
					: "bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-md hover:scale-[1.02] shadow-sm",
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<CardTitle
							className={cn(
								"text-sm font-medium truncate",
								isActive
									? "text-zinc-900 dark:text-zinc-100"
									: "text-zinc-700 dark:text-zinc-300",
							)}
						>
							{panel.name}
						</CardTitle>
						{panel.description && (
							<p
								className={cn(
									"text-xs mt-1 line-clamp-2",
									isActive
										? "text-zinc-600 dark:text-zinc-400"
										: "text-zinc-500 dark:text-zinc-500",
								)}
							>
								{panel.description}
							</p>
						)}
					</div>

					<div className="flex items-center space-x-1 ml-2">
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							onClick={(e) => {
								e.stopPropagation();
								onMoveUp();
							}}
							disabled={!canMoveUp}
						>
							<ArrowUp className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							onClick={(e) => {
								e.stopPropagation();
								onMoveDown();
							}}
							disabled={!canMoveDown}
						>
							<ArrowDown className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Badge
							variant={isActive ? "default" : "secondary"}
							className={cn(
								"text-xs",
								isActive
									? "bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900 border-zinc-700/60 dark:border-zinc-300/60"
									: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-800/60",
							)}
						>
							{isActive ? "Active" : "Inactive"}
						</Badge>

						<span
							className={cn(
								"text-xs",
								isActive
									? "text-zinc-600 dark:text-zinc-400"
									: "text-zinc-500 dark:text-zinc-500",
							)}
						>
							Created {new Date(panel.createdAt).toLocaleDateString()}
						</span>
					</div>

					<div className="flex items-center space-x-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
						>
							<Settings className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
							onClick={(e) => {
								e.stopPropagation();
								onDuplicate();
							}}
						>
							<Copy className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
							onClick={(e) => {
								e.stopPropagation();
								onDelete();
							}}
						>
							<Trash2 className="h-3 w-3" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

/**
 * Panel manager component
 */
export const PanelManager: React.FC<PanelManagerProps> = (
	{ isOpen, onClose },
) => {
	const panels = useCanvasStore((state) => state.panels.panels);
	const createPanel = useCanvasStore((state) => state.createPanel);
	const updatePanel = useCanvasStore((state) => state.updatePanel);
	const duplicatePanel = useCanvasStore((state) => state.duplicatePanel);
	const deletePanel = useCanvasStore((state) => state.deletePanel);
	const clearAllPanels = useCanvasStore((state) => state.clearAllPanels);
	const movePanelUp = useCanvasStore((state) => state.movePanelUp);
	const movePanelDown = useCanvasStore((state) => state.movePanelDown);

	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
	const [newPanelName, setNewPanelName] = useState("");
	const [newPanelDescription, setNewPanelDescription] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

	const handleCreatePanel = () => {
		if (newPanelName.trim()) {
			createPanel(newPanelName.trim(), newPanelDescription.trim() || undefined);
			setNewPanelName("");
			setNewPanelDescription("");
			setShowCreateForm(false);
		}
	};

	const handleEditPanel = (panel: Panel) => {
		setEditingPanel(panel);
		setNewPanelName(panel.name);
		setNewPanelDescription(panel.description || "");
	};

	const handleSaveEdit = () => {
		if (editingPanel && newPanelName.trim()) {
			updatePanel(editingPanel.id, {
				name: newPanelName.trim(),
				description: newPanelDescription.trim() || undefined,
			});
			setEditingPanel(null);
			setNewPanelName("");
			setNewPanelDescription("");
		}
	};

	const handleCancelEdit = () => {
		setEditingPanel(null);
		setNewPanelName("");
		setNewPanelDescription("");
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

	const handleMovePanel = (panelId: string, direction: "up" | "down") => {
		if (direction === "up") {
			movePanelUp(panelId);
		} else {
			movePanelDown(panelId);
		}
	};

	const handleClearAllPanels = () => {
		if (
			confirm(
				"Are you sure you want to delete ALL panels? This action cannot be undone.",
			)
		) {
			clearAllPanels();
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
			<Card className="w-full max-w-4xl max-h-[80vh] bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl overflow-hidden rounded-2xl">
				<CardHeader className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/50">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
								<Grid3X3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
							</div>
							<CardTitle className="text-zinc-900 dark:text-zinc-100">
								Panel Manager
							</CardTitle>
						</div>

						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setViewMode(viewMode === "grid" ? "list" : "grid")}
								className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
							>
								{viewMode === "grid"
									? <List className="h-4 w-4" />
									: <Grid3X3 className="h-4 w-4" />}
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={onClose}
								className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
							>
								Close
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4 bg-zinc-50 dark:bg-zinc-900/50 p-6">
					{/* Actions */}
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Button
								onClick={() => setShowCreateForm(true)}
								className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white"
							>
								<Plus className="h-4 w-4 mr-2" />
								Create Panel
							</Button>

							{panels.length > 0 && (
								<Button
									variant="destructive"
									size="sm"
									onClick={handleClearAllPanels}
									className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Clear All
								</Button>
							)}
						</div>

						<Badge
							variant="secondary"
							className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-300/60 dark:border-zinc-700/60"
						>
							{panels.length} panel{panels.length !== 1 ? "s" : ""}
						</Badge>
					</div>

					{/* Create/Edit form */}
					{(showCreateForm || editingPanel) && (
						<Card className="bg-white dark:bg-zinc-800 border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
							<CardContent className="p-4">
								<div className="space-y-3">
									<div>
										<Label
											htmlFor="panel-name"
											className="text-zinc-700 dark:text-zinc-300"
										>
											Panel Name
										</Label>
										<Input
											id="panel-name"
											value={newPanelName}
											onChange={(e) => setNewPanelName(e.target.value)}
											placeholder="Enter panel name"
											className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-900 dark:text-zinc-100"
										/>
									</div>

									<div>
										<Label
											htmlFor="panel-description"
											className="text-zinc-700 dark:text-zinc-300"
										>
											Description (optional)
										</Label>
										<Textarea
											id="panel-description"
											value={newPanelDescription}
											onChange={(e) => setNewPanelDescription(e.target.value)}
											placeholder="Enter panel description"
											rows={2}
											className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-900 dark:text-zinc-100"
										/>
									</div>

									<div className="flex items-center space-x-2">
										<Button
											onClick={editingPanel
												? handleSaveEdit
												: handleCreatePanel}
											disabled={!newPanelName.trim()}
											className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white"
										>
											{editingPanel ? "Save Changes" : "Create Panel"}
										</Button>

										<Button
											variant="outline"
											onClick={handleCancelEdit}
											className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
										>
											Cancel
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Panels list */}
					{panels.length === 0
						? (
							<div className="text-center py-12 px-4">
								<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
									<Grid3X3 className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
								</div>
								<p className="text-zinc-700 dark:text-zinc-300 font-medium mb-1">
									No panels created yet
								</p>
								<p className="text-sm text-zinc-500 dark:text-zinc-400">
									Create your first panel to get started
								</p>
							</div>
						)
						: (
							<div
								className={cn(
									"space-y-4",
									viewMode === "grid" &&
										"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
								)}
							>
								{panels.map((panel, index) => (
									<PanelCard
										key={panel.id}
										panel={panel}
										onEdit={() => handleEditPanel(panel)}
										onDuplicate={() => handleDuplicatePanel(panel.id)}
										onDelete={() => handleDeletePanel(panel.id)}
										onMoveUp={() => handleMovePanel(panel.id, "up")}
										onMoveDown={() => handleMovePanel(panel.id, "down")}
										canMoveUp={index > 0}
										canMoveDown={index < panels.length - 1}
									/>
								))}
							</div>
						)}
				</CardContent>
			</Card>
		</div>
	);
};
