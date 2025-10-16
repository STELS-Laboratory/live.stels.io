import { useEffect, useState } from "react";
import Split from "react-split";
import {
	Activity,
	Calendar,
	Check,
	Clock,
	Code,
	Copy,
	Cpu,
	Crown,
	Database,
	FileCode,
	FileText,
	HardDrive,
	Hash,
	Layers,
	Network,
	Play,
	Plus,
	PowerOff,
	RotateCcw,
	Save,
	Search,
	Server,
	Settings,
	Square,
	Terminal,
	Trash2,
	X,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog.tsx";
import EditorComponent from "@/components/editor/EditorComponent.tsx";
import {
	useEditorStore,
	type Worker,
	type WorkerCreateRequest,
} from "./store.ts";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { useAppStore } from "@/stores/modules/app.store.ts";
import { useMobile } from "@/hooks/useMobile.ts";
import type { JSX } from "react/jsx-runtime";
import { Input } from "@/components/ui/input.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select.tsx";
import Graphite from "@/components/ui/vectors/logos/Graphite.tsx";
import { CreateWorkerDialog } from "./AMIEditor/CreateWorkerDialog.tsx";
import { LeaderInfoCard } from "./AMIEditor/LeaderInfoCard.tsx";
import { WorkerStatsPanel } from "./AMIEditor/WorkerStatsPanel.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs.tsx";

export function AMIEditor(): JSX.Element {
	const mobile = useMobile();
	const { wallet } = useAuthStore();
	const { setRoute } = useAppStore();
	const listWorkers = useEditorStore((state) => state.listWorkers);
	const createWorker = useEditorStore((state) => state.createWorker);
	const updateWorker = useEditorStore((state) => state.updateWorker);
	const deleteWorker = useEditorStore((state) => state.deleteWorker);
	const getLeaderInfo = useEditorStore((state) => state.getLeaderInfo);
	const getWorkerStats = useEditorStore((state) => state.getWorkerStats);
	const stopAllWorkers = useEditorStore((state) => state.stopAllWorkers);

	const [workers, setWorkers] = useState<Worker[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
	const [currentScript, setCurrentScript] = useState<string>("");
	const [currentNote, setCurrentNote] = useState<string>("");
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingNote, setIsEditingNote] = useState(false);
	const [isEditingConfig, setIsEditingConfig] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterActive, setFilterActive] = useState<boolean | null>(null);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);
	const [showStatsPanel, setShowStatsPanel] = useState(false);
	const [newlyCreatedWorker, setNewlyCreatedWorker] = useState<string | null>(
		null,
	);
	const [currentConfig, setCurrentConfig] = useState({
		executionMode: "parallel" as "parallel" | "leader" | "exclusive",
		priority: "normal" as "critical" | "high" | "normal" | "low",
		mode: "loop" as "loop" | "single",
		version: "1.19.2",
		dependencies: [] as string[],
		accountId: "",
		assignedNode: "",
		nid: "",
	});
	const [activeTab, setActiveTab] = useState("code");
	const [stoppingAll, setStoppingAll] = useState(false);

	// Load workers
	const loadWorkers = async () => {
		setLoading(true);
		try {
			await listWorkers();
			const w = useEditorStore.getState().workers;
			setWorkers(w);
			setLoading(false);
		} catch (error) {
			console.error("Failed to load workers:", error);
			setLoading(false);
		}
	};

	useEffect(() => {
		loadWorkers();
	}, [listWorkers]);

	useEffect(() => {
		if (newlyCreatedWorker) {
			const timer = setTimeout(() => {
				setNewlyCreatedWorker(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [newlyCreatedWorker]);

	const handleCreateWorker = async (
		request: WorkerCreateRequest,
	): Promise<void> => {
		const created = await createWorker(request);
		if (created) {
			const newWorker: Worker = created;
			setWorkers((prev) => [newWorker, ...prev]);
			setSelectedWorker(newWorker);
			setCurrentScript(newWorker.value.raw.script);
			setCurrentNote(newWorker.value.raw.note);
			setIsEditing(false);
			setIsEditingNote(false);
			setNewlyCreatedWorker(newWorker.value.raw.sid);
		}
	};

	const handleDeleteWorker = async (sid: string): Promise<void> => {
		const success = await deleteWorker(sid);
		if (success) {
			setWorkers((prev) => prev.filter((w) => w.value.raw.sid !== sid));
			if (selectedWorker?.value.raw.sid === sid) {
				setSelectedWorker(null);
				setCurrentScript("");
				setCurrentNote("");
			}
			setWorkerToDelete(null);
			setShowDeleteDialog(false);
		}
	};

	const handleSelectWorker = (protocol: Worker) => {
		setSelectedWorker(protocol);
		setCurrentScript(protocol.value.raw.script);
		setCurrentNote(protocol.value.raw.note);
		setCurrentConfig({
			executionMode: (protocol.value.raw as any).executionMode || "parallel",
			priority: (protocol.value.raw as any).priority || "normal",
			mode: (protocol.value.raw as any).mode || "loop",
			version: protocol.value.raw.version || "1.19.2",
			dependencies: protocol.value.raw.dependencies || [],
			accountId: (protocol.value.raw as any).accountId || "",
			assignedNode: (protocol.value.raw as any).assignedNode || "",
			nid: protocol.value.raw.nid || "",
		});
		setIsEditing(false);
		setIsEditingNote(false);
		setIsEditingConfig(false);
	};

	const handleEditorChange = (value: string | undefined) => {
		if (value !== undefined) {
			setCurrentScript(value);
			setIsEditing(
				selectedWorker ? value !== selectedWorker.value.raw.script : false,
			);
		}
	};

	const handleNoteChange = (value: string) => {
		setCurrentNote(value);
		setIsEditingNote(
			selectedWorker ? value !== selectedWorker.value.raw.note : false,
		);
	};

	const resetScript = () => {
		if (selectedWorker) {
			setCurrentScript(selectedWorker.value.raw.script);
			setIsEditing(false);
		}
	};

	const resetNote = () => {
		if (selectedWorker) {
			setCurrentNote(selectedWorker.value.raw.note);
			setIsEditingNote(false);
		}
	};

	const handleConfigChange = (field: string, value: any) => {
		if (selectedWorker) {
			const originalConfig = {
				executionMode: (selectedWorker.value.raw as any).executionMode ||
					"parallel",
				priority: (selectedWorker.value.raw as any).priority || "normal",
				mode: (selectedWorker.value.raw as any).mode || "loop",
				version: selectedWorker.value.raw.version || "1.19.2",
				dependencies: selectedWorker.value.raw.dependencies || [],
				accountId: (selectedWorker.value.raw as any).accountId || "",
				assignedNode: (selectedWorker.value.raw as any).assignedNode || "",
				nid: selectedWorker.value.raw.nid || "",
			};
			const newConfig = { ...currentConfig, [field]: value };
			setCurrentConfig(newConfig);
			setIsEditingConfig(
				JSON.stringify(newConfig) !== JSON.stringify(originalConfig),
			);
		} else {
			setCurrentConfig((prev) => ({ ...prev, [field]: value }));
		}
	};

	const resetConfig = () => {
		if (selectedWorker) {
			setCurrentConfig({
				executionMode: (selectedWorker.value.raw as any).executionMode ||
					"parallel",
				priority: (selectedWorker.value.raw as any).priority || "normal",
				mode: (selectedWorker.value.raw as any).mode || "loop",
				version: selectedWorker.value.raw.version || "1.19.2",
				dependencies: selectedWorker.value.raw.dependencies || [],
				accountId: (selectedWorker.value.raw as any).accountId || "",
				assignedNode: (selectedWorker.value.raw as any).assignedNode || "",
				nid: selectedWorker.value.raw.nid || "",
			});
			setIsEditingConfig(false);
		}
	};

	const handleToggleWorkerStatus = async () => {
		if (!selectedWorker) return;
		setUpdating(true);
		try {
			const updatedRaw = {
				...selectedWorker.value.raw,
				active: !selectedWorker.value.raw.active,
				timestamp: Date.now(),
			};
			const workerBody: Worker = {
				...selectedWorker,
				value: {
					...selectedWorker.value,
					raw: updatedRaw,
				},
			};
			const result = await updateWorker(workerBody);
			if (result) {
				setWorkers((prev) =>
					prev.map((w) =>
						w.value.raw.sid === selectedWorker.value.raw.sid
							? { ...w, value: { ...w.value, raw: updatedRaw } }
							: w
					)
				);
				setSelectedWorker((
					prev,
				) => (prev
					? { ...prev, value: { ...prev.value, raw: updatedRaw } }
					: null)
				);
			}
		} catch (error) {
			console.error("Failed to update protocol status:", error);
		} finally {
			setUpdating(false);
		}
	};

	const handleSaveNote = async () => {
		if (!selectedWorker || !isEditingNote) return;
		setUpdating(true);
		try {
			const updatedRaw = {
				...selectedWorker.value.raw,
				note: currentNote,
				timestamp: Date.now(),
			};
			const workerBody: Worker = {
				...selectedWorker,
				value: {
					...selectedWorker.value,
					raw: updatedRaw,
				},
			};
			const result = await updateWorker(workerBody);
			if (result) {
				setWorkers((prev) =>
					prev.map((w) =>
						w.value.raw.sid === selectedWorker.value.raw.sid
							? { ...w, value: { ...w.value, raw: updatedRaw } }
							: w
					)
				);
				setSelectedWorker((
					prev,
				) => (prev
					? { ...prev, value: { ...prev.value, raw: updatedRaw } }
					: null)
				);
				setIsEditingNote(false);
			}
		} catch (error) {
			console.error("Failed to save protocol note:", error);
		} finally {
			setUpdating(false);
		}
	};

	const handleSaveAll = async () => {
		if (!selectedWorker || (!isEditing && !isEditingNote && !isEditingConfig)) {
			return;
		}
		setUpdating(true);
		try {
			const updatedRaw = {
				...selectedWorker.value.raw,
				script: currentScript,
				note: currentNote,
				version: currentConfig.version,
				dependencies: currentConfig.dependencies,
				nid: currentConfig.nid,
				timestamp: Date.now(),
				...(currentConfig.executionMode &&
					{ executionMode: currentConfig.executionMode }),
				...(currentConfig.priority && { priority: currentConfig.priority }),
				...(currentConfig.mode && { mode: currentConfig.mode }),
				...(currentConfig.accountId && { accountId: currentConfig.accountId }),
				...(currentConfig.assignedNode &&
					{ assignedNode: currentConfig.assignedNode }),
			};
			const workerBody: Worker = {
				...selectedWorker,
				value: {
					...selectedWorker.value,
					raw: updatedRaw,
				},
			};
			const result = await updateWorker(workerBody);
			if (result) {
				setWorkers((prev) =>
					prev.map((w) =>
						w.value.raw.sid === selectedWorker.value.raw.sid
							? { ...w, value: { ...w.value, raw: updatedRaw } }
							: w
					)
				);
				setSelectedWorker((
					prev,
				) => (prev
					? { ...prev, value: { ...prev.value, raw: updatedRaw } }
					: null)
				);
				setIsEditing(false);
				setIsEditingNote(false);
				setIsEditingConfig(false);
			}
		} catch (error) {
			console.error("Failed to save protocol changes:", error);
		} finally {
			setUpdating(false);
		}
	};

	const handleStopAll = async () => {
		if (!confirm("Are you sure you want to stop all active workers?")) {
			return;
		}
		setStoppingAll(true);
		try {
			const result = await stopAllWorkers();
			if (result.total > 0) {
				alert(
					`Stopped ${result.stopped}/${result.total} workers${
						result.failed > 0 ? ` (${result.failed} failed)` : ""
					}`,
				);
			}
		} catch (error) {
			console.error("Failed to stop all workers:", error);
			alert("Failed to stop all workers");
		} finally {
			setStoppingAll(false);
		}
	};

	const filteredWorkers = workers.filter((protocol) => {
		const matchesSearch = protocol.value.raw.note.toLowerCase().includes(
			searchTerm.toLowerCase(),
		) ||
			protocol.value.raw.sid.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter = filterActive === null ||
			protocol.value.raw.active === filterActive;
		return matchesSearch && matchesFilter;
	});

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleString("en-US", {
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
	};

	const getTimeAgo = (timestamp: number) => {
		const minutes = Math.floor((Date.now() - timestamp) / 1000 / 60);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		return `${days}d`;
	};

	if (mobile) {
		return (
			<div className="h-full bg-background p-4 flex items-center justify-center">
				<div className="text-center max-w-sm mx-auto">
					<div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center mb-4 mx-auto">
						<Terminal className="w-8 h-8 text-amber-400" />
					</div>
					<h2 className="text-amber-400 font-mono text-lg font-bold mb-2">
						MARKET BROWSER
					</h2>
					<p className="text-muted-foreground font-mono text-sm">
						Desktop interface required
					</p>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="h-full bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="relative mb-6">
						<div className="w-16 h-16 border-4 border-border border-t-amber-400 rounded-full animate-spin mx-auto">
						</div>
						<Cpu className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
					</div>
					<div className="text-amber-400 font-mono text-sm font-bold">
						LOADING PROTOCOL REGISTRY
					</div>
				</div>
			</div>
		);
	}

	return wallet
		? (
			<div className="h-full bg-background">
				<Split
					className="flex h-full"
					direction="horizontal"
					sizes={[30, 70]}
					minSize={[280, 400]}
					gutterSize={1}
					gutterStyle={() => ({
						background: "#27272a",
						cursor: "col-resize",
					})}
				>
					{/* Left Panel - Workers Registry */}
					<div className="h-full bg-card flex flex-col border-r border-border">
						{/* Header */}
						<div className="p-4 border-b border-border bg-card">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
										<Database className="w-4 h-4 text-amber-400" />
									</div>
									<div>
										<h2 className="text-amber-400 font-mono text-sm font-bold">
											PROTOCOL REGISTRY
										</h2>
										<p className="text-muted-foreground text-xs font-mono">
											Distributed execution platform
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowStatsPanel(!showStatsPanel)}
										className="bg-muted border-border text-muted-foreground hover:bg-secondary hover:text-foreground font-mono text-xs h-8"
									>
										<Activity className="w-3 h-3 mr-1" />
										STATS
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={handleStopAll}
										disabled={stoppingAll ||
											workers.filter((w) => w.value.raw.active).length === 0}
										className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-mono text-xs h-8"
									>
										{stoppingAll
											? (
												<>
													<div className="animate-spin w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full mr-1" />
													STOPPING
												</>
											)
											: (
												<>
													<Square className="w-3 h-3 mr-1" />
													STOP ALL
												</>
											)}
									</Button>
									<Button
										size="sm"
										onClick={() => setShowCreateDialog(true)}
										className="bg-amber-500 hover:bg-amber-600 text-black font-mono text-xs h-8 px-3"
									>
										<Plus className="w-3 h-3 mr-1" />
										AI PROTOCOL
									</Button>
								</div>
							</div>

							{/* Search and Filter */}
							<div className="space-y-3">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										placeholder="Search workers..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 bg-muted border-border text-card-foreground placeholder-zinc-500 h-9 focus:border-amber-400 focus:ring-amber-400/20"
									/>
									{searchTerm && (
										<Button
											size="sm"
											variant="ghost"
											className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-muted-foreground hover:text-card-foreground"
											onClick={() => setSearchTerm("")}
										>
											<X className="w-3 h-3" />
										</Button>
									)}
								</div>

								<div className="flex items-center gap-2">
									<Select
										value={filterActive === null
											? "all"
											: filterActive
											? "active"
											: "inactive"}
										onValueChange={(value) => {
											if (value === "all") setFilterActive(null);
											else if (value === "active") setFilterActive(true);
											else setFilterActive(false);
										}}
									>
										<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-muted border-border">
											<SelectItem
												value="all"
												className="text-card-foreground text-xs"
											>
												All Workers
											</SelectItem>
											<SelectItem
												value="active"
												className="text-green-400 text-xs"
											>
												Active Only
											</SelectItem>
											<SelectItem
												value="inactive"
												className="text-red-400 text-xs"
											>
												Inactive Only
											</SelectItem>
										</SelectContent>
									</Select>

									<div className="flex items-center gap-1 ml-auto">
										{(searchTerm || filterActive !== null) && (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 px-2 text-xs text-muted-foreground hover:text-card-foreground"
												onClick={() => {
													setSearchTerm("");
													setFilterActive(null);
												}}
											>
												Reset
											</Button>
										)}
										<div className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
											{filteredWorkers.length}/{workers.length}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Workers List */}
						<ScrollArea className="flex-1 px-2 py-2">
							<div className="space-y-2">
								{filteredWorkers.map((protocol) => {
									const isNewlyCreated =
										newlyCreatedWorker === protocol.value.raw.sid;
									const isSelected =
										selectedWorker?.value.raw.sid === protocol.value.raw.sid;
									const isLeaderMode =
										(protocol.value.raw as any).executionMode === "leader";

									return (
										<div
											key={protocol.value.raw.sid}
											className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
												isSelected
													? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/20"
													: isNewlyCreated
													? "border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20 animate-pulse"
													: "border-border bg-muted/50 hover:border-muted hover:bg-muted"
											}`}
											onClick={() => handleSelectWorker(protocol)}
										>
											{/* Header */}
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2 flex-1 min-w-0">
													<div className="relative">
														<div
															className={`w-8 h-8 rounded-lg flex items-center justify-center ${
																isNewlyCreated
																	? "bg-green-400/20"
																	: "bg-secondary/50"
															}`}
														>
															<FileCode
																className={`w-4 h-4 ${
																	isNewlyCreated
																		? "text-green-400"
																		: "text-amber-400"
																}`}
															/>
														</div>
														{protocol.value.raw.active && (
															<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-border" />
														)}
														{isLeaderMode && (
															<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-border flex items-center justify-center">
																<Crown className="w-2 h-2 text-black" />
															</div>
														)}
													</div>
													<div className="flex-1 min-w-0">
														<div
															className={`font-mono text-sm font-bold truncate ${
																isNewlyCreated
																	? "text-green-300"
																	: isSelected
																	? "text-amber-300"
																	: "text-card-foreground"
															}`}
														>
															{protocol.value.raw.sid}
														</div>
														{isNewlyCreated && (
															<Badge className="text-xs bg-green-400/20 text-green-400 border-green-400">
																NEW
															</Badge>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1.5">
													<Badge
														variant="outline"
														className={`text-xs ${
															protocol.value.raw.active
																? "border-green-400 text-green-400 bg-green-400/10"
																: "border-red-400 text-red-400 bg-red-400/10"
														}`}
													>
														{protocol.value.raw.active ? "ACTIVE" : "INACTIVE"}
													</Badge>
													<Button
														variant="ghost"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															setWorkerToDelete(protocol.value.raw.sid);
															setShowDeleteDialog(true);
														}}
														className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
													>
														<Trash2 className="w-3 h-3" />
													</Button>
												</div>
											</div>

											{/* Note */}
											{protocol.value.raw.note && (
												<div className="mb-3 p-2 bg-card/50 rounded border border-border/50">
													<p className="text-xs text-blue-300 line-clamp-2">
														{protocol.value.raw.note}
													</p>
												</div>
											)}

											{/* Metadata */}
											<div className="grid grid-cols-2 gap-2 text-xs">
												<div className="flex items-center gap-1">
													<Network className="w-3 h-3 text-blue-400" />
													<span className="text-muted-foreground truncate">
														{protocol.value.raw.nid}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Hash className="w-3 h-3 text-amber-400" />
													<span className="text-amber-400">
														{protocol.value.raw.version}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Layers className="w-3 h-3 text-purple-400" />
													<span className="text-purple-300 truncate">
														{protocol.value.channel.split(".").pop()}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Clock className="w-3 h-3 text-muted-foreground" />
													<span className="text-muted-foreground">
														{getTimeAgo(protocol.value.raw.timestamp)}
													</span>
												</div>
											</div>

											{/* Script Preview */}
											<div className="mt-3 p-2 bg-card/50 rounded border border-border/50">
												<code className="text-xs text-muted-foreground line-clamp-1">
													{protocol.value.raw.script.replace(/\s+/g, " ")
														.trim() ||
														"// Empty script"}
												</code>
											</div>
										</div>
									);
								})}
							</div>
						</ScrollArea>

						{/* Footer */}
						<div className="p-4 border-t border-border bg-card">
							<div className="flex items-center justify-between text-xs">
								<div className="text-amber-400 font-mono font-bold">
									{filteredWorkers.length} of {workers.length} workers
								</div>
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-1">
										<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
										<span className="text-green-400 font-mono">
											{workers.filter((w) => w.value.raw.active).length}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<div className="w-2 h-2 bg-red-400 rounded-full" />
										<span className="text-red-400 font-mono">
											{workers.filter((w) => !w.value.raw.active).length}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Panel - Code Editor */}
					<div className="flex flex-col h-full bg-card">
						{selectedWorker
							? (
								<div className="h-full flex flex-col">
									{/* Editor Header - Compact */}
									<div className="bg-card border-b border-border px-4 py-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center relative flex-shrink-0">
													<Terminal className="w-4 h-4 text-amber-400" />
													{selectedWorker.value.raw.active && (
														<div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse border-2 border-card" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<h3 className="text-foreground font-mono text-base font-bold truncate">
															{selectedWorker.value.raw.sid}
														</h3>
														<Badge
															variant="outline"
															className={`text-[10px] px-1.5 py-0 h-4 flex-shrink-0 ${
																selectedWorker.value.raw.active
																	? "border-green-400/50 text-green-400 bg-green-400/10"
																	: "border-red-400/50 text-red-400 bg-red-400/10"
															}`}
														>
															{selectedWorker.value.raw.active ? "ON" : "OFF"}
														</Badge>
														<Badge
															variant="outline"
															className="text-[10px] px-1.5 py-0 h-4 border-amber-400/50 text-amber-400 bg-amber-400/10 flex-shrink-0"
														>
															v{selectedWorker.value.raw.version}
														</Badge>
														{(selectedWorker.value.raw as any).executionMode ===
																"leader" && (
															<Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
														)}
													</div>
													<div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
														<span className="flex items-center gap-1">
															<Server className="w-2.5 h-2.5" />
															{selectedWorker.value.raw.nid}
														</span>
														<span className="flex items-center gap-1">
															<Clock className="w-2.5 h-2.5" />
															{getTimeAgo(selectedWorker.value.raw.timestamp)}
														</span>
														<span className="flex items-center gap-1">
															<HardDrive className="w-2.5 h-2.5" />
															{selectedWorker.value.raw.script.length}
														</span>
													</div>
												</div>
											</div>

											<Button
												onClick={handleToggleWorkerStatus}
												size="sm"
												disabled={updating}
												className={`px-3 py-1.5 font-mono text-xs h-8 flex-shrink-0 ${
													selectedWorker.value.raw.active
														? "bg-red-500 hover:bg-red-600 text-white"
														: "bg-green-500 hover:bg-green-600 text-white"
												}`}
											>
												{updating
													? (
														<>
															<Settings className="animate-spin mr-1.5 w-3.5 h-3.5" />
															...
														</>
													)
													: selectedWorker.value.raw.active
													? (
														<>
															<PowerOff className="w-3.5 h-3.5 mr-1.5" />
															STOP
														</>
													)
													: (
														<>
															<Play className="w-3.5 h-3.5 mr-1.5" />
															START
														</>
													)}
											</Button>
										</div>
									</div>

									{/* Tabs Navigation & Content */}
									<Tabs
										value={activeTab}
										onValueChange={setActiveTab}
										className="flex-1 flex flex-col min-h-0"
									>
										<div className="bg-card border-b border-border px-4 pt-2">
											<div className="flex items-center justify-between">
												<TabsList className="bg-muted/30 p-0.5 h-8">
													<TabsTrigger
														value="code"
														className="text-xs h-7 px-3"
													>
														<Code className="w-3 h-3 mr-1.5" />
														Code
													</TabsTrigger>
													<TabsTrigger
														value="config"
														className="text-xs h-7 px-3"
													>
														<Settings className="w-3 h-3 mr-1.5" />
														Config
													</TabsTrigger>
													<TabsTrigger
														value="notes"
														className="text-xs h-7 px-3"
													>
														<FileText className="w-3 h-3 mr-1.5" />
														Notes
													</TabsTrigger>
													{(selectedWorker.value.raw as any).executionMode ===
															"leader" && (
														<TabsTrigger
															value="leader"
															className="text-xs h-7 px-3"
														>
															<Crown className="w-3 h-3 mr-1.5" />
															Leader
														</TabsTrigger>
													)}
												</TabsList>

												{(isEditing || isEditingNote || isEditingConfig) && (
													<div className="flex items-center gap-2">
														<Button
															onClick={() => {
																resetScript();
																resetNote();
																resetConfig();
															}}
															variant="ghost"
															size="sm"
															className="text-xs h-7 px-2 text-muted-foreground hover:text-amber-400"
														>
															<RotateCcw className="w-3 h-3 mr-1" />
															Revert
														</Button>
														<Button
															onClick={handleSaveAll}
															size="sm"
															className="text-xs h-7 px-3 bg-amber-500 hover:bg-amber-600 text-black"
															disabled={updating}
														>
															<Save className="w-3 h-3 mr-1" />
															Save All
														</Button>
													</div>
												)}
											</div>
										</div>

										{/* Tab: Code */}
										<TabsContent
											value="code"
											className="flex-1 m-0 p-0 min-h-0"
										>
											<EditorComponent
												script={currentScript}
												handleEditorChange={handleEditorChange}
											/>
										</TabsContent>

										{/* Tab: Configuration */}
										<TabsContent
											value="config"
											className="flex-1 m-0 p-4 overflow-y-auto"
										>
											<div className="max-w-2xl mx-auto space-y-3">
												{/* Row 1: Execution Mode and Priority */}
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Cpu className="w-3 h-3" />
															<span>Execution Mode</span>
														</div>
														<Select
															value={currentConfig.executionMode}
															onValueChange={(value: any) =>
																handleConfigChange("executionMode", value)}
														>
															<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="parallel">
																	<div className="flex items-center gap-2">
																		<span>Parallel</span>
																		<span className="text-xs text-muted-foreground">
																			(All nodes)
																		</span>
																	</div>
																</SelectItem>
																<SelectItem value="leader">
																	<div className="flex items-center gap-2">
																		<span>Leader</span>
																		<span className="text-xs text-muted-foreground">
																			(One node)
																		</span>
																	</div>
																</SelectItem>
																<SelectItem value="exclusive">
																	<div className="flex items-center gap-2">
																		<span>Exclusive</span>
																		<span className="text-xs text-muted-foreground">
																			(Assigned)
																		</span>
																	</div>
																</SelectItem>
															</SelectContent>
														</Select>
													</div>

													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Zap className="w-3 h-3" />
															<span>Priority</span>
														</div>
														<Select
															value={currentConfig.priority}
															onValueChange={(value: any) =>
																handleConfigChange("priority", value)}
														>
															<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="critical">
																	<div className="flex items-center gap-2">
																		<span>Critical</span>
																		<span className="text-xs text-muted-foreground">
																			(50 errors, 1ms)
																		</span>
																	</div>
																</SelectItem>
																<SelectItem value="high">
																	<div className="flex items-center gap-2">
																		<span>High</span>
																		<span className="text-xs text-muted-foreground">
																			(20 errors, 10ms)
																		</span>
																	</div>
																</SelectItem>
																<SelectItem value="normal">
																	<div className="flex items-center gap-2">
																		<span>Normal</span>
																		<span className="text-xs text-muted-foreground">
																			(10 errors, 100ms)
																		</span>
																	</div>
																</SelectItem>
																<SelectItem value="low">
																	<div className="flex items-center gap-2">
																		<span>Low</span>
																		<span className="text-xs text-muted-foreground">
																			(5 errors, 1s)
																		</span>
																	</div>
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
												</div>

												{/* Row 2: Worker Mode and Version */}
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Layers className="w-3 h-3" />
															<span>Worker Mode</span>
														</div>
														<Select
															value={currentConfig.mode}
															onValueChange={(value: any) =>
																handleConfigChange("mode", value)}
														>
															<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="loop">
																	<div className="flex items-center gap-2">
																		<span>Loop</span>
																		<span className="text-xs text-muted-foreground">
																			(Engine repeats)
																		</span>
																	</div>
																</SelectItem>
																<SelectItem value="single">
																	<div className="flex items-center gap-2">
																		<span>Single</span>
																		<span className="text-xs text-muted-foreground">
																			(Self-managed)
																		</span>
																	</div>
																</SelectItem>
															</SelectContent>
														</Select>
													</div>

													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Hash className="w-3 h-3" />
															<span>Version</span>
														</div>
														<Input
															value={currentConfig.version}
															onChange={(e) =>
																handleConfigChange("version", e.target.value)}
															placeholder="1.19.2"
															className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
														/>
													</div>
												</div>

												{/* Row 3: Node ID and Dependencies */}
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Server className="w-3 h-3" />
															<span>Node ID</span>
														</div>
														<Input
															value={currentConfig.nid}
															onChange={(e) =>
																handleConfigChange("nid", e.target.value)}
															placeholder="s-0001"
															className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
														/>
													</div>

													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Database className="w-3 h-3" />
															<span>Dependencies</span>
														</div>
														<Input
															value={currentConfig.dependencies.join(", ")}
															onChange={(e) => handleConfigChange(
																"dependencies",
																e.target.value.split(",").map((d) => d.trim())
																	.filter(Boolean),
															)}
															placeholder="gliesereum"
															className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
														/>
													</div>
												</div>

												{/* Row 4: Account ID */}
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Code className="w-3 h-3" />
															<span>Account ID (Optional)</span>
														</div>
														<Input
															value={currentConfig.accountId}
															onChange={(e) =>
																handleConfigChange("accountId", e.target.value)}
															placeholder="g-bhts"
															className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
														/>
													</div>

													{currentConfig.executionMode === "exclusive" && (
														<div className="space-y-1.5">
															<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
																<Server className="w-3 h-3" />
																<span>Assigned Node</span>
															</div>
															<Input
																value={currentConfig.assignedNode}
																onChange={(e) =>
																	handleConfigChange(
																		"assignedNode",
																		e.target.value,
																	)}
																placeholder="s-0001"
																className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
															/>
														</div>
													)}
												</div>
											</div>
										</TabsContent>

										{/* Tab: Notes */}
										<TabsContent value="notes" className="flex-1 m-0 p-4">
											<div className="max-w-2xl mx-auto">
												<Textarea
													value={currentNote}
													onChange={(e) => handleNoteChange(e.target.value)}
													placeholder="Add notes about this worker..."
													className="bg-muted border-border text-card-foreground placeholder-zinc-500 text-sm resize-none min-h-[200px] focus:border-blue-400 focus:ring-blue-400/20"
												/>
											</div>
										</TabsContent>

										{/* Tab: Leader Info */}
										{(selectedWorker.value.raw as any).executionMode ===
												"leader" && (
											<TabsContent
												value="leader"
												className="flex-1 m-0 p-4 overflow-y-auto"
											>
												<div className="max-w-2xl mx-auto">
													<LeaderInfoCard
														workerId={selectedWorker.value.raw.sid}
														onRefresh={getLeaderInfo}
													/>
												</div>
											</TabsContent>
										)}
									</Tabs>
								</div>
							)
							: (
								/* No Worker Selected */
								<div className="h-full flex items-center justify-center">
									<div className="text-center max-w-md">
										<div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center mb-6 mx-auto">
											<Code className="w-10 h-10 text-amber-400" />
										</div>
										<h3 className="text-amber-400 font-mono text-xl font-bold mb-2">
											CODE EDITOR
										</h3>
										<p className="text-muted-foreground text-sm mb-6">
											Select a protocol from the registry to start editing
										</p>
										<div className="px-4 py-2 bg-muted rounded-lg inline-block">
											<div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
												<Terminal className="w-3 h-3" />
												Ready for development
											</div>
										</div>
									</div>
								</div>
							)}
					</div>
				</Split>

				{/* Create Worker Dialog */}
				<CreateWorkerDialog
					open={showCreateDialog}
					onOpenChange={setShowCreateDialog}
					onSubmit={handleCreateWorker}
				/>

				{/* Delete Worker Confirmation */}
				<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
					<DialogContent className="max-w-md bg-card border-border">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<div className="relative p-2 border border-red-500/30 bg-red-500/10">
									<div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-red-500/50" />
									<Trash2 className="h-5 w-5 text-red-500" />
								</div>
								<span className="text-foreground">Delete Worker</span>
							</DialogTitle>
							<DialogDescription className="text-muted-foreground">
								Are you sure you want to delete this worker? This action cannot
								be undone.
							</DialogDescription>
						</DialogHeader>

						<div className="py-4">
							<div className="p-3 bg-muted border border-border rounded-lg">
								<p className="text-xs text-muted-foreground mb-1">Worker ID:</p>
								<p className="text-sm text-foreground font-mono">
									{workerToDelete}
								</p>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setShowDeleteDialog(false)}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => {
									if (workerToDelete) {
										handleDeleteWorker(workerToDelete);
									}
								}}
								className="bg-red-500 hover:bg-red-600 text-foreground"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete Worker
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Stats Panel */}
				{showStatsPanel && (
					<div className="fixed inset-0 bg-black/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
						<div className="w-full max-w-3xl">
							<div className="flex justify-end mb-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowStatsPanel(false)}
									className="text-muted-foreground hover:text-foreground"
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
							<WorkerStatsPanel onRefresh={getWorkerStats} />
						</div>
					</div>
				)}
			</div>
		)
		: (
			<div className="h-full bg-background flex items-center justify-center">
				<div className="text-center max-w-md mx-auto p-8">
					<div className="w-24 h-24 flex items-center justify-center mb-8 mx-auto relative">
						<div className="w-16 h-16 rounded-xl flex items-center justify-center">
							<Graphite size={6} primary="gray" />
						</div>
						<div className="absolute inset-0" />
					</div>

					<h2 className="text-amber-400 font-mono text-2xl font-bold mb-3">
						WALLET REQUIRED
					</h2>

					<p className="text-muted-foreground text-sm mb-8 leading-relaxed">
						Connect your wallet to access the protocol registry and code editor
					</p>

					<div className="space-y-4">
						<div className="bg-card/50 border border-border rounded-lg p-4">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
									<Database className="w-4 h-4 text-blue-400" />
								</div>
								<span className="text-card-foreground font-mono text-sm font-bold">
									PROTOCOL REGISTRY
								</span>
							</div>
							<p className="text-muted-foreground text-xs">
								Manage distributed execution protocols
							</p>
						</div>

						<div className="bg-card/50 border border-border rounded-lg p-4">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
									<Code className="w-4 h-4 text-green-400" />
								</div>
								<span className="text-card-foreground font-mono text-sm font-bold">
									CODE EDITOR
								</span>
							</div>
							<p className="text-muted-foreground text-xs">
								Write and deploy smart contracts
							</p>
						</div>
					</div>

					<Button
						onClick={() => setRoute("wallet")}
						className="mt-8 bg-amber-500 hover:bg-amber-600 text-black font-mono text-sm font-bold px-8 py-3 rounded-lg shadow-lg shadow-amber-400/20 transition-all duration-200 hover:shadow-amber-400/30"
					>
						<Zap className="w-4 h-4 mr-2" />
						CONNECT WALLET
					</Button>

					<div className="mt-6 px-4 py-2 bg-muted/50 rounded-lg inline-block">
						<div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
							<Server className="w-3 h-3" />
							Secure Web3 connection required
						</div>
					</div>
				</div>
			</div>
		);
}
