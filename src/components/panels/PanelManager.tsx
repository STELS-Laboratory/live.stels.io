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
import { usePanelStore } from "@/stores/modules/panel.store";
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
				"cursor-pointer transition-all duration-200 hover:shadow-md",
				isActive
					? "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/10"
					: "hover:bg-zinc-50 dark:hover:bg-muted/50",
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<CardTitle className="text-sm font-medium truncate">
							{panel.name}
						</CardTitle>
						{panel.description && (
							<p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 line-clamp-2">
								{panel.description}
							</p>
						)}
					</div>

					<div className="flex items-center space-x-1 ml-2">
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
							onClick={(e) => {
								e.stopPropagation();
								onMoveUp();
							}}
							disabled={!canMoveUp}
						>
							<ArrowUp className="h-3 w-3" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
							onClick={(e) => {
								e.stopPropagation();
								onMoveDown();
							}}
							disabled={!canMoveDown}
						>
							<ArrowDown className="h-3 w-3" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Badge
							variant={isActive ? "default" : "secondary"}
							className="text-xs"
						>
							{isActive ? "Active" : "Inactive"}
						</Badge>

						<span className="text-xs text-muted-foreground dark:text-muted-foreground">
							Created {new Date(panel.createdAt).toLocaleDateString()}
						</span>
					</div>

					<div className="flex items-center space-x-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0"
							onClick={(e) => {
								e.stopPropagation();
								onEdit();
							}}
						>
							<Settings className="h-3 w-3" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0"
							onClick={(e) => {
								e.stopPropagation();
								onDuplicate();
							}}
						>
							<Copy className="h-3 w-3" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
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
	const {
		panels,
		createPanel,
		updatePanel,
		duplicatePanel,
		deletePanel,
		clearAllPanels,
	} = usePanelStore();

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
		// TODO: Implement panel reordering
		console.log(`Move panel ${panelId} ${direction}`);
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
		<div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/50 flex items-center justify-center p-4">
			<Card className="w-full max-w-4xl max-h-[80vh] bg-card">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Panel Manager</CardTitle>

						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setViewMode(viewMode === "grid" ? "list" : "grid")}
							>
								{viewMode === "grid"
									? <List className="h-4 w-4" />
									: <Grid3X3 className="h-4 w-4" />}
							</Button>

							<Button variant="outline" size="sm" onClick={onClose}>
								Close
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					{/* Actions */}
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2">
							<Button onClick={() => setShowCreateForm(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Create Panel
							</Button>

							{panels.length > 0 && (
								<Button
									variant="destructive"
									size="sm"
									onClick={handleClearAllPanels}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Clear All
								</Button>
							)}
						</div>

						<Badge variant="secondary">
							{panels.length} panel{panels.length !== 1 ? "s" : ""}
						</Badge>
					</div>

					{/* Create/Edit form */}
					{(showCreateForm || editingPanel) && (
						<Card className="bg-zinc-50 dark:bg-muted">
							<CardContent className="p-4">
								<div className="space-y-3">
									<div>
										<Label htmlFor="panel-name">Panel Name</Label>
										<Input
											id="panel-name"
											value={newPanelName}
											onChange={(e) => setNewPanelName(e.target.value)}
											placeholder="Enter panel name"
										/>
									</div>

									<div>
										<Label htmlFor="panel-description">
											Description (optional)
										</Label>
										<Textarea
											id="panel-description"
											value={newPanelDescription}
											onChange={(e) => setNewPanelDescription(e.target.value)}
											placeholder="Enter panel description"
											rows={2}
										/>
									</div>

									<div className="flex items-center space-x-2">
										<Button
											onClick={editingPanel
												? handleSaveEdit
												: handleCreatePanel}
											disabled={!newPanelName.trim()}
										>
											{editingPanel ? "Save Changes" : "Create Panel"}
										</Button>

										<Button variant="outline" onClick={handleCancelEdit}>
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
							<div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
								<Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>No panels created yet</p>
								<p className="text-sm">
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
