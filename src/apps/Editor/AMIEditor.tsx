import { useEffect, useState } from "react";
import Split from "react-split";
import {
	Activity,
	AlertCircle,
	ArrowDown,
	ArrowUp,
	Clock,
	Code,
	Cpu,
	Crown,
	Database,
	FileCode,
	FileText,
	Globe,
	HardDrive,
	Hash,
	Layers,
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
	Upload,
	X,
	Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
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
import { StopAllDialog } from "./AMIEditor/StopAllDialog.tsx";
import { MigrateWorkerDialog } from "./AMIEditor/MigrateWorkerDialog.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { getExecutionModeColor, getPriorityColor } from "./AMIEditor/utils.ts";

export function AMIEditor(): JSX.Element {
	const mobile = useMobile();
	const { wallet } = useAuthStore();
	const { setRoute } = useAppStore();
	const listWorkers = useEditorStore((state) => state.listWorkers);
	const createWorker = useEditorStore((state) => state.createWorker);
	const updateWorker = useEditorStore((state) => state.updateWorker);
	const migrateWorkerWithNewSid = useEditorStore((state) =>
		state.migrateWorkerWithNewSid
	);
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
	const [validationError, setValidationError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterActive, setFilterActive] = useState<boolean | null>(null);
	const [filterExecutionMode, setFilterExecutionMode] = useState<string | null>(
		null,
	);
	const [filterPriority, setFilterPriority] = useState<string | null>(null);
	const [filterScope, setFilterScope] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showStatsPanel, setShowStatsPanel] = useState(false);
	const [showStopAllDialog, setShowStopAllDialog] = useState(false);
	const [showMigrateDialog, setShowMigrateDialog] = useState(false);
	const [workerToMigrate, setWorkerToMigrate] = useState<Worker | null>(null);
	const [newlyCreatedWorker, setNewlyCreatedWorker] = useState<string | null>(
		null,
	);
	const [currentConfig, setCurrentConfig] = useState({
		scope: "local" as "local" | "network",
		executionMode: "leader" as "parallel" | "leader" | "exclusive",
		priority: "normal" as "critical" | "high" | "normal" | "low",
		mode: "loop" as "loop" | "single",
		version: "1.19.2",
		dependencies: [] as string[],
		accountId: "",
		assignedNode: "",
		nid: "",
	});
	const [activeTab, setActiveTab] = useState("code");

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

	const handleSelectWorker = (protocol: Worker) => {
		setSelectedWorker(protocol);
		setCurrentScript(protocol.value.raw.script);
		setCurrentNote(protocol.value.raw.note);

		const scope = protocol.value.raw.scope || "local";
		let executionMode = protocol.value.raw.executionMode || "parallel";

		// Auto-correct: local scope must use leader mode
		if (
			scope === "local" &&
			(executionMode === "parallel" || executionMode === "exclusive")
		) {
			executionMode = "leader";
		}

		setCurrentConfig({
			scope,
			executionMode,
			priority: protocol.value.raw.priority || "normal",
			mode: protocol.value.raw.mode || "loop",
			version: protocol.value.raw.version || "1.19.2",
			dependencies: protocol.value.raw.dependencies || [],
			accountId: protocol.value.raw.accountId || "",
			assignedNode: protocol.value.raw.assignedNode || "",
			nid: protocol.value.raw.nid || "",
		});
		setIsEditing(false);
		setIsEditingNote(false);
		setIsEditingConfig(false);
		setValidationError(null);
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

	const handleConfigChange = (
		field: string,
		value:
			| string
			| string[]
			| "local"
			| "network"
			| "parallel"
			| "leader"
			| "exclusive"
			| "critical"
			| "high"
			| "normal"
			| "low"
			| "loop"
			| "single",
	) => {
		if (selectedWorker) {
			const originalConfig = {
				scope: selectedWorker.value.raw.scope || "local" as const,
				executionMode: selectedWorker.value.raw.executionMode ||
					"parallel" as const,
				priority: selectedWorker.value.raw.priority || "normal" as const,
				mode: selectedWorker.value.raw.mode || "loop" as const,
				version: selectedWorker.value.raw.version || "1.19.2",
				dependencies: selectedWorker.value.raw.dependencies || [],
				accountId: selectedWorker.value.raw.accountId || "",
				assignedNode: selectedWorker.value.raw.assignedNode || "",
				nid: selectedWorker.value.raw.nid || "",
			};
			const newConfig = { ...currentConfig, [field]: value };

			// If scope changed to local, enforce leader mode (only option for local)
			if (field === "scope" && value === "local") {
				newConfig.executionMode = "leader";
			}

			// Clear validation error when config changes
			setValidationError(null);

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
			const scope = selectedWorker.value.raw.scope || "local";
			let executionMode = selectedWorker.value.raw.executionMode || "parallel";

			// Auto-correct: local scope must use leader mode
			if (
				scope === "local" &&
				(executionMode === "parallel" || executionMode === "exclusive")
			) {
				executionMode = "leader";
			}

			setCurrentConfig({
				scope,
				executionMode,
				priority: selectedWorker.value.raw.priority || "normal",
				mode: selectedWorker.value.raw.mode || "loop",
				version: selectedWorker.value.raw.version || "1.19.2",
				dependencies: selectedWorker.value.raw.dependencies || [],
				accountId: selectedWorker.value.raw.accountId || "",
				assignedNode: selectedWorker.value.raw.assignedNode || "",
				nid: selectedWorker.value.raw.nid || "",
			});
			setIsEditingConfig(false);
			setValidationError(null);
		}
	};

	const handleToggleWorkerStatus = async () => {
		if (!selectedWorker) return;
		setUpdating(true);
		try {
			// API requires FULL raw object with ALL fields
			const updatedRaw = {
				sid: selectedWorker.value.raw.sid,
				nid: selectedWorker.value.raw.nid,
				active: !selectedWorker.value.raw.active,
				mode: selectedWorker.value.raw.mode || "loop",
				scope: selectedWorker.value.raw.scope || "local",
				executionMode: selectedWorker.value.raw.executionMode ||
					"parallel",
				priority: selectedWorker.value.raw.priority || "normal",
				accountId: selectedWorker.value.raw.accountId || undefined,
				assignedNode: selectedWorker.value.raw.assignedNode || undefined,
				note: selectedWorker.value.raw.note,
				script: selectedWorker.value.raw.script,
				dependencies: selectedWorker.value.raw.dependencies,
				version: selectedWorker.value.raw.version,
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
						w.value.raw.sid === selectedWorker.value.raw.sid ? result : w
					)
				);
				setSelectedWorker(result);
			}
		} catch (error) {
			console.error("Failed to update protocol status:", error);
		} finally {
			setUpdating(false);
		}
	};

	const handleSaveAll = async () => {
		if (!selectedWorker || (!isEditing && !isEditingNote && !isEditingConfig)) {
			return;
		}

		// Clear previous validation errors
		setValidationError(null);

		// Validation: local scope can only use leader mode
		if (
			currentConfig.scope === "local" &&
			(currentConfig.executionMode === "parallel" ||
				currentConfig.executionMode === "exclusive")
		) {
			setValidationError(
				"Invalid configuration: Local scope workers can only use leader execution mode (single node execution)",
			);
			return;
		}

		setUpdating(true);
		try {
			// API requires FULL raw object with ALL fields (not partial update)
			const updatedRaw = {
				sid: selectedWorker.value.raw.sid,
				nid: currentConfig.nid,
				active: selectedWorker.value.raw.active,
				mode: currentConfig.mode,
				scope: currentConfig.scope,
				executionMode: currentConfig.executionMode,
				priority: currentConfig.priority,
				accountId: currentConfig.accountId || undefined,
				assignedNode: currentConfig.assignedNode || undefined,
				note: currentNote,
				script: currentScript,
				dependencies: currentConfig.dependencies,
				version: currentConfig.version,
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
						w.value.raw.sid === selectedWorker.value.raw.sid ? result : w
					)
				);
				setSelectedWorker(result);
				setCurrentScript(result.value.raw.script);
				setCurrentNote(result.value.raw.note);
				setCurrentConfig({
					scope: result.value.raw.scope || "local",
					executionMode: result.value.raw.executionMode || "parallel",
					priority: result.value.raw.priority || "normal",
					mode: result.value.raw.mode || "loop",
					version: result.value.raw.version || "1.19.2",
					dependencies: result.value.raw.dependencies || [],
					accountId: result.value.raw.accountId || "",
					assignedNode: result.value.raw.assignedNode || "",
					nid: result.value.raw.nid || "",
				});
				setIsEditing(false);
				setIsEditingNote(false);
				setIsEditingConfig(false);
				setValidationError(null);
			}
		} catch (error) {
			console.error("Failed to save protocol changes:", error);
		} finally {
			setUpdating(false);
		}
	};

	const handleStopAll = async (): Promise<{
		stopped: number;
		failed: number;
		total: number;
	}> => {
		try {
			const result = await stopAllWorkers();

			// Refresh workers list to show updated status (active: false)
			await loadWorkers();

			return result;
		} catch (error) {
			console.error("Failed to stop all workers:", error);
			throw error;
		}
	};

	const handleMigrateWorker = async (
		worker: Worker,
	): Promise<Worker | null> => {
		try {
			const migratedWorker = await migrateWorkerWithNewSid(worker);
			if (migratedWorker) {
				// Add to workers list
				setWorkers((prev) => [migratedWorker, ...prev]);
				setNewlyCreatedWorker(migratedWorker.value.raw.sid);
			}
			return migratedWorker;
		} catch (error) {
			console.error("Failed to migrate worker:", error);
			throw error;
		}
	};

	const handleOpenMigrateDialog = (worker: Worker): void => {
		setWorkerToMigrate(worker);
		setShowMigrateDialog(true);
	};

	const filteredWorkers = workers
		.filter((protocol) => {
			// Search filter
			const matchesSearch = !searchTerm ||
				protocol.value.raw.note.toLowerCase().includes(
					searchTerm.toLowerCase(),
				) ||
				protocol.value.raw.sid.toLowerCase().includes(
					searchTerm.toLowerCase(),
				) ||
				protocol.value.raw.nid.toLowerCase().includes(
					searchTerm.toLowerCase(),
				) ||
				protocol.value.raw.version.toLowerCase().includes(
					searchTerm.toLowerCase(),
				);

			// Active status filter
			const matchesActive = filterActive === null ||
				protocol.value.raw.active === filterActive;

			// Execution mode filter
			const workerExecMode = protocol.value.raw.executionMode ||
				"parallel";
			const matchesExecMode = !filterExecutionMode ||
				workerExecMode === filterExecutionMode;

			// Priority filter
			const workerPriority = protocol.value.raw.priority || "normal";
			const matchesPriority = !filterPriority ||
				workerPriority === filterPriority;

			// Scope filter
			const workerScope = protocol.value.raw.scope || "local";
			const matchesScope = !filterScope || workerScope === filterScope;

			return matchesSearch && matchesActive && matchesExecMode &&
				matchesPriority && matchesScope;
		})
		.sort((a, b) => {
			// Sort based on selected criteria
			let comparison = 0;

			switch (sortBy) {
				case "date":
					comparison = b.value.raw.timestamp - a.value.raw.timestamp;
					break;
				case "name":
					comparison = a.value.raw.sid.localeCompare(b.value.raw.sid);
					break;
				case "status":
					comparison = (b.value.raw.active ? 1 : 0) -
						(a.value.raw.active ? 1 : 0);
					break;
				default:
					comparison = b.value.raw.timestamp - a.value.raw.timestamp;
			}

			return sortOrder === "asc" ? -comparison : comparison;
		});

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
					<div className="h-full bg-card flex flex-col border-r border-border overflow-hidden">
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
										onClick={() => setShowStopAllDialog(true)}
										disabled={workers.filter((w) => w.value.raw.active)
											.length === 0}
										className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-mono text-xs h-8"
									>
										<Square className="w-3 h-3 mr-1" />
										STOP ALL
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
							<div className="space-y-2">
								{/* Search */}
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
									<Input
										placeholder="Search..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-9 pr-8 bg-muted border-border text-card-foreground placeholder-zinc-500 h-8 text-xs focus:border-amber-400 focus:ring-amber-400/20"
									/>
									{searchTerm && (
										<Button
											size="sm"
											variant="ghost"
											className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-muted-foreground hover:text-card-foreground"
											onClick={() => setSearchTerm("")}
										>
											<X className="w-3 h-3" />
										</Button>
									)}
								</div>

								{/* Compact Sort and Filters */}
								<div className="flex items-center gap-1.5">
									{/* Sort */}
									<Select
										value={`${sortBy}-${sortOrder}`}
										onValueChange={(value) => {
											const [by, order] = value.split("-") as [
												typeof sortBy,
												typeof sortOrder,
											];
											setSortBy(by);
											setSortOrder(order);
										}}
									>
										<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-7 w-[110px]">
											<div className="flex items-center gap-1">
												{sortOrder === "asc"
													? <ArrowUp className="w-3 h-3" />
													: <ArrowDown className="w-3 h-3" />}
												<span className="capitalize">{sortBy}</span>
											</div>
										</SelectTrigger>
										<SelectContent className="bg-muted border-border">
											<SelectItem value="date-desc" className="text-xs">
												<div className="flex items-center gap-2">
													<ArrowDown className="w-3 h-3" />
													Date (Newest)
												</div>
											</SelectItem>
											<SelectItem value="date-asc" className="text-xs">
												<div className="flex items-center gap-2">
													<ArrowUp className="w-3 h-3" />
													Date (Oldest)
												</div>
											</SelectItem>
											<SelectItem value="name-asc" className="text-xs">
												<div className="flex items-center gap-2">
													<ArrowUp className="w-3 h-3" />
													Name (A-Z)
												</div>
											</SelectItem>
											<SelectItem value="name-desc" className="text-xs">
												<div className="flex items-center gap-2">
													<ArrowDown className="w-3 h-3" />
													Name (Z-A)
												</div>
											</SelectItem>
											<SelectItem value="status-desc" className="text-xs">
												<div className="flex items-center gap-2">
													<ArrowDown className="w-3 h-3" />
													Status (Active)
												</div>
											</SelectItem>
											<SelectItem value="status-asc" className="text-xs">
												<div className="flex items-center gap-2">
													<ArrowUp className="w-3 h-3" />
													Status (Inactive)
												</div>
											</SelectItem>
										</SelectContent>
									</Select>

									{/* Status Filter */}
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
										<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-7 w-[90px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-muted border-border">
											<SelectItem value="all" className="text-xs">
												All
											</SelectItem>
											<SelectItem
												value="active"
												className="text-xs text-green-400"
											>
												Active
											</SelectItem>
											<SelectItem
												value="inactive"
												className="text-xs text-red-400"
											>
												Inactive
											</SelectItem>
										</SelectContent>
									</Select>

									{/* Scope Filter */}
									<Select
										value={filterScope || "all-scope"}
										onValueChange={(value) =>
											setFilterScope(value === "all-scope" ? null : value)}
									>
										<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-7 w-[90px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-muted border-border">
											<SelectItem value="all-scope" className="text-xs">
												All Scope
											</SelectItem>
											<SelectItem
												value="local"
												className="text-xs text-blue-400"
											>
												<div className="flex items-center gap-1.5">
													<Server className="w-3 h-3" />
													Local
												</div>
											</SelectItem>
											<SelectItem
												value="network"
												className="text-xs text-green-400"
											>
												<div className="flex items-center gap-1.5">
													<Globe className="w-3 h-3" />
													Network
												</div>
											</SelectItem>
										</SelectContent>
									</Select>

									{/* Clear filters */}
									{(searchTerm || filterActive !== null ||
										filterExecutionMode || filterPriority || filterScope) && (
										<Button
											size="sm"
											variant="ghost"
											className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-400"
											onClick={() => {
												setSearchTerm("");
												setFilterActive(null);
												setFilterExecutionMode(null);
												setFilterPriority(null);
												setFilterScope(null);
											}}
										>
											<X className="w-3.5 h-3.5" />
										</Button>
									)}
								</div>

								{/* Advanced Filters - Execution Mode & Priority */}
								<div className="flex items-center justify-between gap-1.5">
									<div className="flex items-center gap-1.5 flex-1">
										<Select
											value={filterExecutionMode || "all-modes"}
											onValueChange={(value) =>
												setFilterExecutionMode(
													value === "all-modes" ? null : value,
												)}
										>
											<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-7 flex-1">
												<SelectValue placeholder="Mode" />
											</SelectTrigger>
											<SelectContent className="bg-muted border-border">
												<SelectItem value="all-modes" className="text-xs">
													All Modes
												</SelectItem>
												<SelectItem
													value="parallel"
													className="text-xs text-blue-400"
												>
													Parallel
												</SelectItem>
												<SelectItem
													value="leader"
													className="text-xs text-amber-400"
												>
													Leader
												</SelectItem>
												<SelectItem
													value="exclusive"
													className="text-xs text-purple-400"
												>
													Exclusive
												</SelectItem>
											</SelectContent>
										</Select>

										<Select
											value={filterPriority || "all-priorities"}
											onValueChange={(value) =>
												setFilterPriority(
													value === "all-priorities" ? null : value,
												)}
										>
											<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-7 flex-1">
												<SelectValue placeholder="Priority" />
											</SelectTrigger>
											<SelectContent className="bg-muted border-border">
												<SelectItem value="all-priorities" className="text-xs">
													All Priority
												</SelectItem>
												<SelectItem
													value="critical"
													className="text-xs text-red-400"
												>
													Critical
												</SelectItem>
												<SelectItem
													value="high"
													className="text-xs text-orange-400"
												>
													High
												</SelectItem>
												<SelectItem
													value="normal"
													className="text-xs text-green-400"
												>
													Normal
												</SelectItem>
												<SelectItem
													value="low"
													className="text-xs text-blue-400"
												>
													Low
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Results counter */}
									<div className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded font-mono whitespace-nowrap">
										{filteredWorkers.length}/{workers.length}
									</div>
								</div>
							</div>
						</div>

						{/* Workers List */}
						<ScrollArea className="flex-1 px-2 py-2 overflow-y-auto">
							<div className="space-y-2">
								{filteredWorkers.map((protocol, index) => {
									const isNewlyCreated =
										newlyCreatedWorker === protocol.value.raw.sid;
									const isSelected =
										selectedWorker?.value.raw.sid === protocol.value.raw.sid;
									const isLeaderMode =
										protocol.value.raw.executionMode === "leader";

									// Create unique key using both key array and sid
									const uniqueKey = `${
										protocol.key.join("-")
									}-${protocol.value.raw.sid}-${index}`;

									return (
										<div
											key={uniqueKey}
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
											</div>

											{/* Note */}
											{protocol.value.raw.note && (
												<div className="mb-3 p-2 bg-card/50 rounded border border-border/50">
													<p className="text-xs text-blue-300 line-clamp-2">
														{protocol.value.raw.note}
													</p>
												</div>
											)}

											{/* Metadata Grid */}
											<div className="grid grid-cols-2 gap-2 text-xs mb-2">
												<div className="flex items-center gap-1">
													<Server className="w-3 h-3 text-blue-400" />
													<span className="text-blue-300 font-mono truncate">
														{protocol.value.raw.nid}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Hash className="w-3 h-3 text-amber-400" />
													<span className="text-amber-400 font-mono">
														{protocol.value.raw.version}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Clock className="w-3 h-3 text-muted-foreground" />
													<span className="text-muted-foreground">
														{getTimeAgo(protocol.value.raw.timestamp)}
													</span>
												</div>
												<div className="flex items-center gap-1">
													<Database className="w-3 h-3 text-purple-400" />
													<span className="text-purple-300 truncate">
														{protocol.value.raw.dependencies.join(", ") ||
															"none"}
													</span>
												</div>
											</div>

											{/* Mode & Priority Badges */}
											<div className="flex items-center justify-between gap-1.5">
												<div className="flex items-center gap-1.5 flex-wrap flex-1">
													{(() => {
														const scope = protocol.value.raw.scope || "local";
														const execMode = protocol.value.raw.executionMode ||
															"parallel";
														const priority = protocol.value.raw.priority ||
															"normal";
														const mode = protocol.value.raw.mode ||
															"loop";

														return (
															<>
																<Badge
																	variant="outline"
																	className={`text-[10px] px-1.5 py-0 h-4 ${
																		scope === "network"
																			? "border-green-400/50 bg-green-400/10 text-green-400"
																			: "border-blue-400/50 bg-blue-400/10 text-blue-400"
																	}`}
																>
																	{scope}
																</Badge>
																<Badge
																	variant="outline"
																	className={`text-[10px] px-1.5 py-0 h-4 ${
																		getExecutionModeColor(execMode)
																	}`}
																>
																	{execMode}
																</Badge>
																<Badge
																	variant="outline"
																	className={`text-[10px] px-1.5 py-0 h-4 ${
																		getPriorityColor(priority)
																	}`}
																>
																	{priority}
																</Badge>
																<Badge
																	variant="outline"
																	className="text-[10px] px-1.5 py-0 h-4 border-muted/50 text-muted-foreground"
																>
																	{mode}
																</Badge>
															</>
														);
													})()}
												</div>

												{/* Migrate button for local workers */}
												{(protocol.value.raw.scope || "local") === "local" && (
													<Button
														size="sm"
														variant="ghost"
														onClick={(e) => {
															e.stopPropagation();
															handleOpenMigrateDialog(protocol);
														}}
														className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-green-400"
														title="Migrate to network"
													>
														<Upload className="w-3.5 h-3.5" />
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</ScrollArea>

						{/* Footer - Status Summary */}
						<div className="p-3 border-t border-border bg-card/50">
							<div className="flex items-center justify-center gap-4 text-xs">
								<div className="flex items-center gap-1.5">
									<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
									<span className="text-muted-foreground">Active:</span>
									<span className="text-green-400 font-mono font-bold">
										{workers.filter((w) => w.value.raw.active).length}
									</span>
								</div>
								<div className="flex items-center gap-1.5">
									<div className="w-2 h-2 bg-red-400 rounded-full" />
									<span className="text-muted-foreground">Inactive:</span>
									<span className="text-red-400 font-mono font-bold">
										{workers.filter((w) => !w.value.raw.active).length}
									</span>
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
													<div className="flex items-center gap-1.5 flex-wrap">
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
														{(() => {
															const scope = selectedWorker.value.raw.scope ||
																"local";
															const execMode = selectedWorker.value.raw
																.executionMode || "parallel";
															const priority =
																selectedWorker.value.raw.priority ||
																"normal";
															const mode = selectedWorker.value.raw.mode ||
																"loop";

															return (
																<>
																	<Badge
																		variant="outline"
																		className={`text-[10px] px-1.5 py-0 h-4 flex-shrink-0 ${
																			scope === "network"
																				? "border-green-400/50 bg-green-400/10 text-green-400"
																				: "border-blue-400/50 bg-blue-400/10 text-blue-400"
																		}`}
																	>
																		{scope}
																	</Badge>
																	<Badge
																		variant="outline"
																		className={`text-[10px] px-1.5 py-0 h-4 flex-shrink-0 ${
																			getExecutionModeColor(execMode)
																		}`}
																	>
																		{execMode === "leader" && (
																			<Crown className="w-2.5 h-2.5 mr-0.5" />
																		)}
																		{execMode}
																	</Badge>
																	<Badge
																		variant="outline"
																		className={`text-[10px] px-1.5 py-0 h-4 flex-shrink-0 ${
																			getPriorityColor(priority)
																		}`}
																	>
																		{priority}
																	</Badge>
																	<Badge
																		variant="outline"
																		className="text-[10px] px-1.5 py-0 h-4 border-muted/50 text-muted-foreground flex-shrink-0"
																	>
																		{mode}
																	</Badge>
																</>
															);
														})()}
													</div>
													<div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
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
														{selectedWorker.value.raw.accountId && (
															<span className="flex items-center gap-1">
																<Code className="w-2.5 h-2.5" />
																{selectedWorker.value.raw.accountId}
															</span>
														)}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2">
												{/* Migrate button for local workers */}
												{(selectedWorker.value.raw.scope || "local") ===
														"local" && (
													<Button
														onClick={() =>
															handleOpenMigrateDialog(selectedWorker)}
														size="sm"
														variant="outline"
														className="px-3 py-1.5 font-mono text-xs h-8 flex-shrink-0 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
													>
														<Upload className="w-3.5 h-3.5 mr-1.5" />
														MIGRATE
													</Button>
												)}

												{/* Start/Stop button */}
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
													{selectedWorker.value.raw.executionMode ===
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
												{/* Validation Error */}
												{validationError && (
													<Alert className="border-red-500/30 bg-red-500/10">
														<AlertCircle className="h-4 w-4 text-red-500" />
														<AlertDescription className="text-red-400">
															{validationError}
														</AlertDescription>
													</Alert>
												)}

												{/* Row 1: Scope */}
												<div className="space-y-1.5">
													<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
														<Database className="w-3 h-3" />
														<span>Scope</span>
													</div>
													<Select
														value={currentConfig.scope}
														onValueChange={(value: "local" | "network") =>
															handleConfigChange("scope", value)}
													>
														<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="local">
																<div className="flex items-center gap-2">
																	<Server className="w-4 h-4 text-blue-400" />
																	<span>Local</span>
																	<span className="text-xs text-muted-foreground">
																		(This node only)
																	</span>
																</div>
															</SelectItem>
															<SelectItem value="network">
																<div className="flex items-center gap-2">
																	<Cpu className="w-4 h-4 text-green-400" />
																	<span>Network</span>
																	<span className="text-xs text-muted-foreground">
																		(All nodes in network)
																	</span>
																</div>
															</SelectItem>
														</SelectContent>
													</Select>
													<p className="text-xs text-muted-foreground">
														Where this worker will be stored and visible
													</p>
												</div>

												{/* Local Scope Info */}
												{currentConfig.scope === "local" && (
													<Alert className="border-blue-500/30 bg-blue-500/10">
														<AlertCircle className="h-4 w-4 text-blue-500" />
														<AlertDescription className="text-blue-400 text-xs">
															<strong>Local scope:</strong>{" "}
															Worker executes only on this node in leader mode.
															Parallel and exclusive modes are only available
															for network scope.
														</AlertDescription>
													</Alert>
												)}

												{/* Row 2: Execution Mode and Priority */}
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Cpu className="w-3 h-3" />
															<span>Execution Mode</span>
														</div>
														<Select
															value={currentConfig.executionMode}
															onValueChange={(
																value: "parallel" | "leader" | "exclusive",
															) => handleConfigChange("executionMode", value)}
														>
															<SelectTrigger className="bg-muted border-border text-card-foreground text-xs h-8">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem
																	value="parallel"
																	disabled={currentConfig.scope === "local"}
																>
																	<div className="flex items-center gap-2">
																		<span>Parallel</span>
																		<span className="text-xs text-muted-foreground">
																			{currentConfig.scope === "local"
																				? "(Network only)"
																				: "(All nodes)"}
																		</span>
																	</div>
																</SelectItem>
																<SelectItem value="leader">
																	<div className="flex items-center gap-2">
																		<span>Leader</span>
																		<span className="text-xs text-muted-foreground">
																			(Single node)
																		</span>
																	</div>
																</SelectItem>
																<SelectItem
																	value="exclusive"
																	disabled={currentConfig.scope === "local"}
																>
																	<div className="flex items-center gap-2">
																		<span>Exclusive</span>
																		<span className="text-xs text-muted-foreground">
																			{currentConfig.scope === "local"
																				? "(Network only)"
																				: "(Assigned node)"}
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
															onValueChange={(
																value: "critical" | "high" | "normal" | "low",
															) => handleConfigChange("priority", value)}
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
															onValueChange={(value: "loop" | "single") =>
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
															onChange={(e) =>
																handleConfigChange(
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
													onChange={(
														e: React.ChangeEvent<HTMLTextAreaElement>,
													) => handleNoteChange(e.target.value)}
													placeholder="Add notes about this worker..."
													className="bg-muted border-border text-card-foreground placeholder-zinc-500 text-sm resize-none min-h-[200px] focus:border-blue-400 focus:ring-blue-400/20"
												/>
											</div>
										</TabsContent>

										{/* Tab: Leader Info */}
										{selectedWorker.value.raw.executionMode ===
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

				{/* Stop All Workers Dialog */}
				<StopAllDialog
					open={showStopAllDialog}
					onOpenChange={setShowStopAllDialog}
					onConfirm={handleStopAll}
					activeWorkersCount={workers.filter((w) => w.value.raw.active).length}
				/>

				{/* Migrate Worker Dialog */}
				<MigrateWorkerDialog
					open={showMigrateDialog}
					onOpenChange={setShowMigrateDialog}
					worker={workerToMigrate}
					onMigrate={handleMigrateWorker}
				/>

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
