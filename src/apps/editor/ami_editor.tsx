import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import Split from "react-split";
import {
	Activity,
	AlertCircle,
	AlignJustify,
	ArrowDown,
	ArrowUp,
	Code,
	Cpu,
	Crown,
	Database,
	FileCode,
	FileText,
	Globe,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// Lazy load CodeMirror Editor for performance (~120 KB gzipped vs Monaco's 990 KB)
const CodeMirrorEditor = lazy(() =>
	import("@/components/editor/codemirror_editor")
);
import {
	useEditorStore,
	type Worker,
	type WorkerCreateRequest,
} from "./store.ts";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { useAppStore } from "@/stores/modules/app.store.ts";
import { useMobile } from "@/hooks/use_mobile.ts";
import type { JSX } from "react/jsx-runtime";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Graphite from "@/components/ui/vectors/logos/graphite";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateWorkerDialog } from "./ami_editor/create_worker_dialog";
import { LeaderInfoCard } from "./ami_editor/leader_info_card";
import { WorkerStatsPanel } from "./ami_editor/worker_stats_panel";
import { WorkerLogsPanel } from "./ami_editor/worker_logs_panel";
import { StopAllDialog } from "./ami_editor/stop_all_dialog";
import { MigrateWorkerDialog } from "./ami_editor/migrate_worker_dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeveloperAccessRequestDialog } from "@/components/auth/developer_access_request";
import { navigateTo } from "@/lib/router";

export function AMIEditor(): JSX.Element {
	const mobile = useMobile();
	const { wallet, connectionSession } = useAuthStore();
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
	const [currentScript, setCurrentScriptInternal] = useState<string>("");

	// Wrapper for setCurrentScript
	const setCurrentScript = useCallback((value: string) => {
		setCurrentScriptInternal(value);
	}, []);
	const [currentNote, setCurrentNote] = useState<string>("");
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingNote, setIsEditingNote] = useState(false);
	const [isEditingConfig, setIsEditingConfig] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterActive, setFilterActive] = useState<boolean | null>(null); // Default: All (active and inactive)
	const [filterExecutionMode, setFilterExecutionMode] = useState<string | null>(
		null,
	);
	const [filterPriority, setFilterPriority] = useState<string | null>(null);
	const [filterScope, setFilterScope] = useState<string | null>("local"); // Default: Local only
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showStatsPanel, setShowStatsPanel] = useState(false);
	const [showStopAllDialog, setShowStopAllDialog] = useState(false);
	const [showMigrateDialog, setShowMigrateDialog] = useState(false);
	const [workerToMigrate, setWorkerToMigrate] = useState<Worker | null>(null);
	const [showDeveloperAccessDialog, setShowDeveloperAccessDialog] = useState(
		false,
	);
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
	const [formatCodeFn, setFormatCodeFn] = useState<(() => void) | null>(null);

	// Cache for formatted scripts (sid -> formatted code)
	const formattedScriptsCache = useRef<Map<string, string>>(new Map());

	// Check developer access on mount
	useEffect(() => {
		if (wallet && connectionSession) {
			// Check if user has developer permissions
			const isDeveloper = connectionSession.developer || false;

			if (!isDeveloper) {

				setShowDeveloperAccessDialog(true);
				setLoading(false);
			}
		}
	}, [wallet, connectionSession]);

	// Load workers
	const loadWorkers = async () => {
		// Only load workers if user has developer permissions
		if (!connectionSession?.developer) {
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			await listWorkers();
			const w = useEditorStore.getState().workers;
			setWorkers(w);
			setLoading(false);
		} catch {

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

	// Hotkey: Cmd+S / Ctrl+S to save changes
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent): void => {
			// Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault(); // Prevent browser's save dialog

				// Only save if there are changes and a worker is selected
				if (selectedWorker && (isEditing || isEditingNote || isEditingConfig)) {
					handleSaveAll();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedWorker, isEditing, isEditingNote, isEditingConfig]);

	const handleCreateWorker = async (
		request: WorkerCreateRequest,
	): Promise<void> => {
		const created = await createWorker(request);
		if (created) {
			const newWorker: Worker = created;
			setWorkers((prev) => [newWorker, ...prev]);

			// Use the user's input values, not server response (which might have defaults)
			const scope = request.scope || newWorker.value.raw.scope || "local";
			const executionMode = request.executionMode ||
				newWorker.value.raw.executionMode || "leader";
			const priority = request.priority || newWorker.value.raw.priority ||
				"normal";
			const mode = request.mode || newWorker.value.raw.mode || "loop";
			const version = request.version || newWorker.value.raw.version ||
				"1.19.2";
			const dependencies = request.dependencies ||
				newWorker.value.raw.dependencies || [];
			const accountId = request.accountId || newWorker.value.raw.accountId ||
				"";
			const assignedNode = request.assignedNode ||
				newWorker.value.raw.assignedNode || "";
			const note = request.note || newWorker.value.raw.note || "";

			// Set selected worker with user's values preserved
			setSelectedWorker(newWorker);

			// Set current script (use request script, not server response which might be minified)
			setCurrentScript(request.scriptContent || newWorker.value.raw.script);
			setCurrentNote(note);

			// Set current config with user's values (don't auto-correct on creation)
			setCurrentConfig({
				scope,
				executionMode, // Use user's choice, don't auto-correct
				priority,
				mode,
				version,
				dependencies,
				accountId,
				assignedNode,
				nid: newWorker.value.raw.nid || "",
			});

			setIsEditing(false);
			setIsEditingNote(false);
			setIsEditingConfig(false);
			setNewlyCreatedWorker(newWorker.value.raw.sid);
		}
	};

	const handleSelectWorker = (protocol: Worker) => {
		setSelectedWorker(protocol);

		// Check if we have a formatted version in cache
		const cachedFormatted = formattedScriptsCache.current.get(
			protocol.value.raw.sid,
		);

		setCurrentScript(cachedFormatted || protocol.value.raw.script);
		setCurrentNote(protocol.value.raw.note);

		// Use values from protocol, don't apply defaults that might override user choices
		const scope = protocol.value.raw.scope ?? "local";
		let executionMode = protocol.value.raw.executionMode ?? "leader";

		// Auto-correct: local scope must use leader mode
		// Only apply if the combination is invalid (user might have selected wrong combination)
		// This is a safety check for existing workers with invalid configs
		if (
			scope === "local" &&
			(executionMode === "parallel" || executionMode === "exclusive")
		) {
			executionMode = "leader";
		}

		setCurrentConfig({
			scope,
			executionMode,
			priority: protocol.value.raw.priority ?? "normal",
			mode: protocol.value.raw.mode ?? "loop",
			version: protocol.value.raw.version ?? "1.19.2",
			dependencies: protocol.value.raw.dependencies ?? [],
			accountId: protocol.value.raw.accountId ?? "",
			assignedNode: protocol.value.raw.assignedNode ?? "",
			nid: protocol.value.raw.nid ?? "",
		});
		setIsEditing(false);
		setIsEditingNote(false);
		setIsEditingConfig(false);
		setValidationError(null);
	};

	const handleEditorChange = (value: string | undefined) => {
		if (value !== undefined) {
			setCurrentScript(value);

			// Save formatted version to cache for current worker
			if (selectedWorker) {
				formattedScriptsCache.current.set(selectedWorker.value.raw.sid, value);
			}

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
			// Scope cannot be changed after creation
			if (field === "scope") {

				return;
			}

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
		} catch {
			// Error handled silently
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
				// Update result with the saved script (formatted version from editor)
				const updatedResult: Worker = {
					...result,
					value: {
						...result.value,
						raw: {
							...result.value.raw,
							script: currentScript, // Use the formatted script from editor
						},
					},
				};

				setWorkers((prev) =>
					prev.map((w) =>
						w.value.raw.sid === selectedWorker.value.raw.sid ? updatedResult : w
					)
				);
				setSelectedWorker(updatedResult);

				// Update cache with saved script
				formattedScriptsCache.current.set(
					updatedResult.value.raw.sid,
					currentScript,
				);

				// DON'T update currentScript - keep the formatted version in editor!
				// Server returns minified code, but user is still editing formatted version
				// setCurrentScript(result.value.raw.script); // ❌ This would replace formatted code
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
		} catch {
			// Error handled silently
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
		} catch {

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
		} catch {

			throw error;
		}
	};

	const handleOpenMigrateDialog = (worker: Worker): void => {
		setWorkerToMigrate(worker);
		setShowMigrateDialog(true);
	};

	const handleCloseDeveloperAccessDialog = (open: boolean): void => {
		setShowDeveloperAccessDialog(open);
		// If dialog is being closed and user doesn't have developer access,
		// navigate back to welcome (App Store)
		if (!open && !connectionSession?.developer) {
			navigateTo("welcome");
		}
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
			// Smart Sort: Local > Active > Date
			if (sortOrder === "desc") {
				// 1. Sort by scope (local first)
				const scopeA = a.value.raw.scope || "local";
				const scopeB = b.value.raw.scope || "local";
				if (scopeA !== scopeB) {
					return scopeA === "local" ? -1 : 1;
				}

				// 2. Sort by active status (active first)
				const activeA = a.value.raw.active ? 1 : 0;
				const activeB = b.value.raw.active ? 1 : 0;
				if (activeA !== activeB) {
					return activeB - activeA;
				}

				// 3. Sort by timestamp (newest first)
				return b.value.raw.timestamp - a.value.raw.timestamp;
			}

			// Ascending: oldest first
			return a.value.raw.timestamp - b.value.raw.timestamp;
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
					<div className="w-16 h-16 bg-card rounded flex items-center justify-center mb-4 mx-auto">
						<Code className="w-8 h-8 text-amber-700 dark:text-amber-400" />
					</div>
					<h2 className="text-amber-700 dark:text-amber-400 font-mono text-lg font-bold mb-2">
						PROTOCOL EDITOR
					</h2>
					<p className="text-muted-foreground font-mono text-sm mb-6">
						Desktop interface required
					</p>
					<div className="p-4 bg-card/10 border border-border rounded text-left">
						<p className="text-xs text-muted-foreground mb-3">
							The Protocol Editor requires a desktop display for optimal
							workflow:
						</p>
						<ul className="text-xs text-muted-foreground space-y-2">
							<li className="flex items-start gap-2">
								<span className="text-amber-500">•</span>
								<span>Monaco code editor with syntax highlighting</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-amber-500">•</span>
								<span>Split-panel layout for code and worker list</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-amber-500">•</span>
								<span>Real-time execution logs and statistics</span>
							</li>
						</ul>
					</div>
					<p className="text-xs text-muted-foreground mt-4">
						Please open STELS on a desktop browser to access the Protocol Editor
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
						<Cpu className="w-6 h-6 text-amber-700 dark:text-amber-700 dark:text-amber-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
					</div>
					<div className="text-amber-700 dark:text-amber-700 dark:text-amber-400 font-mono text-sm font-bold">
						LOADING PROTOCOL REGISTRY
					</div>
				</div>
			</div>
		);
	}

	return wallet
		? (
			<div className="h-full">
				<Split
					className="flex h-full bg-background p-0 m-0"
					direction="horizontal"
					sizes={[20, 80]}
					minSize={[450, 400]}
					gutterSize={2}
				>
					{/* Left Panel - Workers Registry */}
					<div className="h-full bg-card flex flex-col overflow-hidden">
						{/* Header - Compact */}
						<div className="px-3 py-2 border-b border-border bg-card">
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Database className="w-3.5 h-3.5 text-amber-700 dark:text-amber-700 dark:text-amber-400" />
									<h2 className="text-amber-700 dark:text-amber-700 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wide">
										Protocol Registry
									</h2>
								</div>
								<TooltipProvider>
									<div className="flex items-center gap-1">
										<Tooltip delayDuration={100}>
											<TooltipTrigger asChild>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => setShowStatsPanel(!showStatsPanel)}
													className="h-6 w-6 p-0"
												>
													<Activity className="w-3.5 h-3.5" />
												</Button>
											</TooltipTrigger>
											<TooltipContent side="bottom">
												Worker Stats
											</TooltipContent>
										</Tooltip>

										<Tooltip delayDuration={100}>
											<TooltipTrigger asChild>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => setShowStopAllDialog(true)}
													disabled={workers.filter((w) => w.value.raw.active)
														.length === 0}
													className="h-6 w-6 p-0 text-red-700 dark:text-red-700 dark:text-red-400 hover:text-red-800 dark:text-red-300"
												>
													<Square className="w-3.5 h-3.5" />
												</Button>
											</TooltipTrigger>
											<TooltipContent side="bottom">
												Stop All Workers
											</TooltipContent>
										</Tooltip>

										<div className="w-px h-4 bg-border mx-0.5" />

										<Tooltip delayDuration={100}>
											<TooltipTrigger asChild>
												<Button
													size="sm"
													onClick={() => setShowCreateDialog(true)}
													className="bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black h-6 px-2"
												>
													<Plus className="w-3 h-3 mr-1" />
													<span className="text-[10px] font-mono font-bold">
														NEW
													</span>
												</Button>
											</TooltipTrigger>
											<TooltipContent side="bottom">
												Create Worker
											</TooltipContent>
										</Tooltip>
									</div>
								</TooltipProvider>
							</div>

							{/* Search and Filters - Professional */}
							<div className="space-y-1">
								{/* Search */}
								<div className="relative">
									<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
									<Input
										placeholder="Search workers..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-7 pr-7 bg-input border-border text-foreground placeholder:text-muted-foreground h-6 text-[11px] focus:border-amber-500 focus:ring-amber-500/20"
									/>
									{searchTerm && (
										<Button
											size="sm"
											variant="ghost"
											className="absolute right-1 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
											onClick={() => setSearchTerm("")}
										>
											<X className="w-3 h-3" />
										</Button>
									)}
								</div>

								{/* Professional Filters */}
								<div className="flex items-center gap-1.5 flex-wrap">
									{/* Status Filter */}
									<div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5">
										<span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
											Status
										</span>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterActive(null)}
											className={`h-5 px-1.5 text-[10px] ${
												filterActive === null
													? "bg-card text-foreground"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											All
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterActive(true)}
											className={`h-5 px-1.5 text-[10px] ${
												filterActive === true
													? "bg-green-500/20 text-green-700 dark:text-green-700 dark:text-green-600"
													: "text-muted-foreground hover:text-green-700 dark:text-green-700 dark:text-green-600"
											}`}
										>
											<Play className="w-2.5 h-2.5 mr-0.5" />
											Active
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterActive(false)}
											className={`h-5 px-1.5 text-[10px] ${
												filterActive === false
													? "bg-red-500/20 text-red-700 dark:text-red-700 dark:text-red-400"
													: "text-muted-foreground hover:text-red-700 dark:text-red-700 dark:text-red-400"
											}`}
										>
											<Square className="w-2.5 h-2.5 mr-0.5" />
											Stopped
										</Button>
									</div>

									{/* Scope Filter */}
									<div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5">
										<span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
											Scope
										</span>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterScope(null)}
											className={`h-5 px-1.5 text-[10px] ${
												filterScope === null
													? "bg-card text-foreground"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											All
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterScope("local")}
											className={`h-5 px-1.5 text-[10px] ${
												filterScope === "local"
													? "bg-blue-500/20 text-blue-700 dark:text-blue-700 dark:text-blue-400"
													: "text-muted-foreground hover:text-blue-700 dark:text-blue-700 dark:text-blue-400"
											}`}
										>
											<Server className="w-2.5 h-2.5 mr-0.5" />
											Local
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterScope("network")}
											className={`h-5 px-1.5 text-[10px] ${
												filterScope === "network"
													? "bg-green-500/20 text-green-700 dark:text-green-700 dark:text-green-600"
													: "text-muted-foreground hover:text-green-700 dark:text-green-700 dark:text-green-600"
											}`}
										>
											<Globe className="w-2.5 h-2.5 mr-0.5" />
											Network
										</Button>
									</div>

									{/* Execution Mode Filter */}
									<div className="flex items-center gap-0.5 bg-muted/30 rounded px-1 py-0.5">
										<span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
											Mode
										</span>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterExecutionMode(null)}
											className={`h-5 px-1.5 text-[10px] ${
												filterExecutionMode === null
													? "bg-card text-foreground"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											All
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterExecutionMode("leader")}
											className={`h-5 px-1.5 text-[10px] ${
												filterExecutionMode === "leader"
													? "bg-amber-500/20 text-amber-700 dark:text-amber-700 dark:text-amber-400"
													: "text-muted-foreground hover:text-amber-700 dark:text-amber-700 dark:text-amber-400"
											}`}
										>
											<Crown className="w-2.5 h-2.5 mr-0.5" />
											Leader
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterExecutionMode("parallel")}
											className={`h-5 px-1.5 text-[10px] ${
												filterExecutionMode === "parallel"
													? "bg-blue-500/20 text-blue-700 dark:text-blue-700 dark:text-blue-400"
													: "text-muted-foreground hover:text-blue-700 dark:text-blue-700 dark:text-blue-400"
											}`}
										>
											<Cpu className="w-2.5 h-2.5 mr-0.5" />
											Parallel
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterExecutionMode("exclusive")}
											className={`h-5 px-1.5 text-[10px] ${
												filterExecutionMode === "exclusive"
													? "bg-purple-500/20 text-purple-700 dark:text-purple-700 dark:text-purple-400"
													: "text-muted-foreground hover:text-purple-700 dark:text-purple-700 dark:text-purple-400"
											}`}
										>
											<Zap className="w-2.5 h-2.5 mr-0.5" />
											Exclusive
										</Button>
									</div>

									<div className="flex-1" />

									{/* Sort & Clear */}
									<div className="flex items-center gap-1">
										<Button
											size="sm"
											variant="ghost"
											onClick={() =>
												setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
											className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
											title={sortOrder === "asc"
												? "Oldest first"
												: "Newest first"}
										>
											{sortOrder === "asc"
												? <ArrowUp className="w-3 h-3" />
												: <ArrowDown className="w-3 h-3" />}
										</Button>

										{(searchTerm || filterActive !== null ||
											filterExecutionMode || filterPriority ||
											filterScope !== "local") && (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 px-2 text-[10px] text-muted-foreground hover:text-amber-700 dark:text-amber-700 dark:text-amber-400"
												onClick={() => {
													setSearchTerm("");
													setFilterActive(null);
													setFilterExecutionMode(null);
													setFilterPriority(null);
													setFilterScope("local");
												}}
												title="Clear all filters"
											>
												<X className="w-3 h-3 mr-0.5" />
												Clear
											</Button>
										)}

										<div className="text-[10px] text-amber-700 dark:text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
											{filteredWorkers.length}/{workers.length}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Workers List - File System Style */}
						<ScrollArea className="flex-1 overflow-y-auto">
							<div className="py-1">
								{filteredWorkers.map((protocol, index) => {
									const isNewlyCreated =
										newlyCreatedWorker === protocol.value.raw.sid;
									const isSelected =
										selectedWorker?.value.raw.sid === protocol.value.raw.sid;
									const isLeaderMode =
										protocol.value.raw.executionMode === "leader";
									const scope = protocol.value.raw.scope || "local";
									const execMode = protocol.value.raw.executionMode ||
										"parallel";

									// Create unique key using both key array and sid
									const uniqueKey = `${
										protocol.key.join("-")
									}-${protocol.value.raw.sid}-${index}`;

									return (
										<div
											key={uniqueKey}
											className={`group flex flex-col px-2 py-1.5 cursor-pointer transition-colors ${
												isSelected
													? "bg-amber-500/20"
													: isNewlyCreated
													? "bg-green-500/10 animate-pulse"
													: "hover:bg-muted/50"
											}`}
											onClick={() => handleSelectWorker(protocol)}
										>
											{/* Main row */}
											<div className="flex items-center gap-1.5">
												{/* File Icon with Status */}
												<div className="relative flex-shrink-0">
													<FileCode
														className={`w-4 h-4 ${
															isNewlyCreated
																? "text-green-700 dark:text-green-700 dark:text-green-600"
																: isSelected
																? "text-amber-700 dark:text-amber-700 dark:text-amber-400"
																: protocol.value.raw.active
																? "text-blue-700 dark:text-blue-700 dark:text-blue-400"
																: "text-muted-foreground"
														}`}
													/>
													{/* Active indicator */}
													{protocol.value.raw.active && !isSelected && (
														<div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
													)}
													{/* Leader crown */}
													{isLeaderMode && (
														<Crown className="absolute -bottom-0.5 -right-0.5 w-2 h-2 text-amber-500" />
													)}
												</div>

												{/* Filename and badges */}
												<div className="flex-1 min-w-0 flex items-center gap-1.5">
													<span
														className={`font-mono text-[11px] font-semibold truncate ${
															isSelected
																? "text-amber-700 dark:text-amber-700 dark:text-amber-400"
																: protocol.value.raw.active
																? "text-green-700 dark:text-green-700 dark:text-green-600"
																: "text-red-700 dark:text-red-700 dark:text-red-400"
														}`}
													>
														{protocol.value.raw.sid}
													</span>

													{/* Inline badges */}
													<div className="flex items-center gap-0.5">
														<span
															className={`text-[8px] px-0.5 rounded ${
																scope === "network"
																	? "bg-green-500/20 text-green-700 dark:text-green-700 dark:text-green-600"
																	: "bg-blue-500/20 text-blue-700 dark:text-blue-700 dark:text-blue-400"
															}`}
															title={scope}
														>
															{scope === "network" ? "N" : "L"}
														</span>
														<span
															className={`text-[8px] px-0.5 rounded ${
																execMode === "leader"
																	? "bg-amber-500/20 text-amber-700 dark:text-amber-700 dark:text-amber-400"
																	: execMode === "parallel"
																	? "bg-blue-500/20 text-blue-700 dark:text-blue-700 dark:text-blue-400"
																	: "bg-purple-500/20 text-purple-700 dark:text-purple-700 dark:text-purple-400"
															}`}
															title={execMode}
														>
															{execMode === "leader"
																? "L"
																: execMode === "parallel"
																? "P"
																: "E"}
														</span>
													</div>
												</div>

												{/* Right side - Actions and time */}
												<div className="flex items-center gap-1 flex-shrink-0">
													{/* Migrate button */}
													{scope === "local" && (
														<Button
															size="sm"
															variant="ghost"
															onClick={(e) => {
																e.stopPropagation();
																handleOpenMigrateDialog(protocol);
															}}
															className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-green-700 dark:text-green-700 dark:text-green-600"
															title="Migrate to network"
														>
															<Upload className="w-2.5 h-2.5" />
														</Button>
													)}

													{/* Time ago */}
													<span className="text-[9px] text-muted-foreground font-mono min-w-[24px] text-right">
														{getTimeAgo(protocol.value.raw.timestamp)}
													</span>
												</div>
											</div>

											{/* Description/Prompts - always visible if exists */}
											{protocol.value.raw.note && (
												<div className="ml-5 mt-0.5">
													<p className="text-[10px] text-muted-foreground line-clamp-1">
														{protocol.value.raw.note}
													</p>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</ScrollArea>

						{/* Footer - File System Style */}
						<div className="px-2 py-1 border-t border-border bg-card/10">
							<div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
								<span>
									{filteredWorkers.length} items
								</span>
								<div className="flex items-center gap-2">
									<span className="text-green-700 dark:text-green-700 dark:text-green-600">
										{workers.filter((w) => w.value.raw.active).length} active
									</span>
									<span>•</span>
									<span className="text-red-700 dark:text-red-700 dark:text-red-400">
										{workers.filter((w) => !w.value.raw.active).length} stopped
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Right Panel - Code Editor */}
					<div className="flex flex-col h-full bg-muted">
						{selectedWorker
							? (
								<div className="h-full flex flex-col">
									{/* Editor Header - Compact */}
									<div className="bg-card border-b border-border px-3 py-2">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 flex-1 min-w-0">
												<div className="relative w-7 h-7 bg-muted rounded flex items-center justify-center flex-shrink-0">
													<Terminal className="w-3.5 h-3.5 text-amber-700 dark:text-amber-700 dark:text-amber-400" />
													{selectedWorker.value.raw.active && (
														<div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="text-foreground font-mono text-[11px] font-bold truncate">
														{selectedWorker.value.raw.sid}
													</h3>
													<div className="flex items-center gap-1.5 mt-0.5">
														{(() => {
															const scope = selectedWorker.value.raw.scope ||
																"local";
															const execMode =
																selectedWorker.value.raw.executionMode ||
																"parallel";
															const priority =
																selectedWorker.value.raw.priority || "normal";

															return (
																<>
																	<span
																		className={`text-[9px] px-1 py-0.5 rounded font-mono ${
																			scope === "network"
																				? "bg-green-500/10 text-green-700 dark:text-green-700 dark:text-green-600"
																				: "bg-blue-500/10 text-blue-700 dark:text-blue-700 dark:text-blue-400"
																		}`}
																	>
																		{scope === "network" ? "NET" : "LOC"}
																	</span>
																	<span
																		className={`text-[9px] px-1 py-0.5 rounded font-mono ${
																			execMode === "leader"
																				? "bg-amber-500/10 text-amber-700 dark:text-amber-700 dark:text-amber-400"
																				: execMode === "parallel"
																				? "bg-blue-500/10 text-blue-700 dark:text-blue-700 dark:text-blue-400"
																				: "bg-purple-500/10 text-purple-700 dark:text-purple-700 dark:text-purple-400"
																		}`}
																	>
																		{execMode === "leader"
																			? "LDR"
																			: execMode === "parallel"
																			? "PAR"
																			: "EXC"}
																	</span>
																	<span
																		className={`text-[9px] px-1 py-0.5 rounded font-mono ${
																			priority === "critical"
																				? "bg-red-500/10 text-red-700 dark:text-red-700 dark:text-red-400"
																				: priority === "high"
																				? "bg-orange-500/10 text-orange-700 dark:text-orange-700 dark:text-orange-400"
																				: priority === "normal"
																				? "bg-green-500/10 text-green-700 dark:text-green-700 dark:text-green-600"
																				: "bg-blue-500/10 text-blue-700 dark:text-blue-700 dark:text-blue-400"
																		}`}
																	>
																		{priority === "critical"
																			? "CRT"
																			: priority === "high"
																			? "HI"
																			: priority === "normal"
																			? "NRM"
																			: "LOW"}
																	</span>
																	<span className="text-[9px] text-muted-foreground">
																		v{selectedWorker.value.raw.version}
																	</span>
																</>
															);
														})()}
													</div>
												</div>
											</div>

											<TooltipProvider>
												<div className="flex items-center gap-1">
													{/* Migrate button for local workers */}
													{(selectedWorker.value.raw.scope || "local") ===
															"local" && (
														<Tooltip delayDuration={100}>
															<TooltipTrigger asChild>
																<Button
																	onClick={() =>
																		handleOpenMigrateDialog(selectedWorker)}
																	size="sm"
																	variant="ghost"
																	className="h-6 w-6 p-0 text-blue-700 dark:text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:text-blue-300"
																>
																	<Upload className="w-3 h-3" />
																</Button>
															</TooltipTrigger>
															<TooltipContent side="bottom">
																Migrate to Network
															</TooltipContent>
														</Tooltip>
													)}

													{/* Start/Stop button */}
													<Tooltip delayDuration={100}>
														<TooltipTrigger asChild>
															<Button
																onClick={handleToggleWorkerStatus}
																size="sm"
																disabled={updating}
																className={`h-6 w-6 p-0 ${
																	selectedWorker.value.raw.active
																		? "bg-red-500 hover:bg-red-600 text-white dark:text-white"
																		: "bg-green-500 hover:bg-green-600 text-white dark:text-white"
																}`}
															>
																{updating
																	? (
																		<Settings className="animate-spin w-3 h-3" />
																	)
																	: selectedWorker.value.raw.active
																	? <PowerOff className="w-3 h-3" />
																	: <Play className="w-3 h-3" />}
															</Button>
														</TooltipTrigger>
														<TooltipContent side="bottom">
															{selectedWorker.value.raw.active
																? "Stop Worker"
																: "Start Worker"}
														</TooltipContent>
													</Tooltip>
												</div>
											</TooltipProvider>
										</div>
									</div>

									{/* Tabs Navigation & Content */}
									<Tabs
										value={activeTab}
										onValueChange={setActiveTab}
										className="flex-1 flex flex-col min-h-0 p-0 m-0 gap-0"
									>
										<div className="bg-card border-b border-border px-2 py-1.5">
											<div className="flex items-center justify-between">
												<TabsList className="bg-muted/30 p-0.5 h-7">
													<TabsTrigger
														value="code"
														className="text-[11px] h-6 px-2"
													>
														<Code className="w-3 h-3 mr-1" />
														Code
													</TabsTrigger>
													<TabsTrigger
														value="config"
														className="text-[11px] h-6 px-2"
													>
														<Settings className="w-3 h-3 mr-1" />
														Config
													</TabsTrigger>
													<TabsTrigger
														value="prompts"
														className="text-[11px] h-6 px-2"
													>
														<FileText className="w-3 h-3 mr-1" />
														Prompts
													</TabsTrigger>
													<TabsTrigger
														value="logs"
														className="text-[11px] h-6 px-2"
													>
														<Terminal className="w-3 h-3 mr-1" />
														Logs
													</TabsTrigger>
													{selectedWorker.value.raw.executionMode ===
															"leader" && (
														<TabsTrigger
															value="leader"
															className="text-[11px] h-6 px-2"
														>
															<Crown className="w-3 h-3 mr-1" />
															Leader
														</TabsTrigger>
													)}
												</TabsList>

												<TooltipProvider>
													<div className="flex items-center gap-1">
														{/* Format button - always visible */}
														{activeTab === "code" && formatCodeFn && (
															<Tooltip delayDuration={100}>
																<TooltipTrigger asChild>
																	<Button
																		onClick={() =>
																			formatCodeFn()}
																		variant="ghost"
																		size="sm"
																		className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-700 dark:text-blue-400"
																	>
																		<AlignJustify className="w-3 h-3" />
																	</Button>
																</TooltipTrigger>
																<TooltipContent side="bottom">
																	Format Code (Prettify)
																</TooltipContent>
															</Tooltip>
														)}

														{(isEditing || isEditingNote || isEditingConfig) &&
															(
																<>
																	<Tooltip delayDuration={100}>
																		<TooltipTrigger asChild>
																			<Button
																				onClick={() => {
																					resetScript();
																					resetNote();
																					resetConfig();
																				}}
																				variant="ghost"
																				size="sm"
																				className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-700 dark:text-amber-700 dark:text-amber-400"
																			>
																				<RotateCcw className="w-3 h-3" />
																			</Button>
																		</TooltipTrigger>
																		<TooltipContent side="bottom">
																			Revert Changes
																		</TooltipContent>
																	</Tooltip>

																	<Tooltip delayDuration={100}>
																		<TooltipTrigger asChild>
																			<Button
																				onClick={handleSaveAll}
																				size="sm"
																				className="h-6 px-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black"
																				disabled={updating}
																			>
																				<Save className="w-3 h-3 mr-1" />
																				<span className="text-[10px] font-bold">
																					SAVE
																				</span>
																				<kbd className="ml-1 px-1 py-0.5 text-[9px] bg-muted/50 rounded border border-border/50">
																					⌘S
																				</kbd>
																			</Button>
																		</TooltipTrigger>
																		<TooltipContent side="bottom">
																			Save All (⌘S)
																		</TooltipContent>
																	</Tooltip>
																</>
															)}
													</div>
												</TooltipProvider>
											</div>
										</div>

										{/* Tab: Code */}
										<TabsContent
											value="code"
											className="flex-1 m-0 p-0 min-h-0"
										>
											<Suspense
												fallback={
													<div className="h-full bg-background flex items-center justify-center">
														<div className="text-center">
															<div className="w-12 h-12 border-4 border-border border-t-amber-500 rounded-full animate-spin mx-auto mb-3">
															</div>
															<p className="text-muted-foreground text-xs font-mono">
																Loading Editor...
															</p>
														</div>
													</div>
												}
											>
												<CodeMirrorEditor
													script={currentScript}
													handleEditorChange={handleEditorChange}
													onEditorReady={(formatFn) =>
														setFormatCodeFn(() => formatFn)}
												/>
											</Suspense>
										</TabsContent>

										{/* Tab: Configuration */}
										<TabsContent
											value="config"
											className="flex-1 m-0 p-2 overflow-y-auto bg-surface"
										>
											<div className="max-w-2xl mx-auto space-y-2 bg-muted p-3 border rounded">
												{/* Validation Error */}
												{validationError && (
													<Alert className="border-red-500/30 bg-red-500/10">
														<AlertCircle className="h-4 w-4 text-red-500" />
														<AlertDescription className="text-red-700 dark:text-red-700 dark:text-red-400">
															{validationError}
														</AlertDescription>
													</Alert>
												)}

												{/* Row 1: Scope (Read-only) */}
												<div className="space-y-1.5">
													<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
														<Database className="w-3 h-3" />
														<span>Scope (Read-only)</span>
													</div>
													<Select
														value={currentConfig.scope}
														disabled={true}
													>
														<SelectTrigger className="bg-muted/50 border-border text-card-foreground text-xs h-8 opacity-75 cursor-not-allowed">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="local">
																<div className="flex items-center gap-2">
																	<Server className="w-4 h-4 text-blue-700 dark:text-blue-700 dark:text-blue-400" />
																	<span>Local</span>
																	<span className="text-xs text-muted-foreground">
																		(This node only)
																	</span>
																</div>
															</SelectItem>
															<SelectItem value="network">
																<div className="flex items-center gap-2">
																	<Cpu className="w-4 h-4 text-green-700 dark:text-green-700 dark:text-green-600" />
																	<span>Network</span>
																	<span className="text-xs text-muted-foreground">
																		(All nodes in network)
																	</span>
																</div>
															</SelectItem>
														</SelectContent>
													</Select>
													<p className="text-xs text-muted-foreground">
														Scope cannot be changed after creation.
														{currentConfig.scope === "local" && (
															<>
																{" "}Use{" "}
																<button
																	onClick={() => {
																		if (selectedWorker) {
																			handleOpenMigrateDialog(selectedWorker);
																		}
																	}}
																	className="text-blue-700 dark:text-blue-700 dark:text-blue-400 hover:text-blue-500 underline font-medium"
																>
																	Migrate to Network
																</button>{" "}
																to move this worker to network scope with a new
																ID.
															</>
														)}
													</p>
												</div>

												{/* Local Scope Info */}
												{currentConfig.scope === "local" && (
													<Alert className="border-blue-500/30 bg-blue-500/10">
														<AlertCircle className="h-4 w-4 text-blue-500" />
														<AlertDescription className="text-blue-700 dark:text-blue-700 dark:text-blue-400 text-xs">
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

										{/* Tab: Prompts */}
										<TabsContent value="prompts" className="flex-1 m-0 p-2">
											<div className="max-w-2xl mx-auto">
												<Textarea
													value={currentNote}
													onChange={(
														e: React.ChangeEvent<HTMLTextAreaElement>,
													) => handleNoteChange(e.target.value)}
													placeholder="Worker prompts and instructions..."
													className="bg-input border-border text-foreground placeholder:text-muted-foreground text-[11px] resize-none min-h-[200px] focus:border-blue-500 focus:ring-blue-500/20"
												/>
											</div>
										</TabsContent>

										{/* Tab: Logs */}
										<TabsContent
											value="logs"
											className="flex-1 m-0 p-0 min-h-0 gap-0"
										>
											<WorkerLogsPanel
												workerId={selectedWorker.value.raw.sid}
											/>
										</TabsContent>

										{/* Tab: Leader Info */}
										{selectedWorker.value.raw.executionMode === "leader" && (
											<TabsContent
												value="leader"
												className="flex-1 m-0 p-2 overflow-y-auto"
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
										<div className="w-20 h-20 bg-muted rounded flex items-center justify-center mb-6 mx-auto">
											<Code className="w-10 h-10 text-amber-700 dark:text-amber-700 dark:text-amber-400" />
										</div>
										<h3 className="text-amber-700 dark:text-amber-700 dark:text-amber-400 font-mono text-xl font-bold mb-2">
											CODE EDITOR
										</h3>
										<p className="text-muted-foreground text-sm mb-6">
											Select a protocol from the registry to start editing
										</p>
										<div className="px-4 py-2 bg-muted rounded inline-block">
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
					<div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

				{/* Developer Access Request Dialog */}
				<DeveloperAccessRequestDialog
					open={showDeveloperAccessDialog}
					onOpenChange={handleCloseDeveloperAccessDialog}
				/>
			</div>
		)
		: (
			<div className="h-full bg-background flex items-center justify-center">
				<div className="text-center max-w-md mx-auto p-8">
					<div className="w-24 h-24 flex items-center justify-center mb-8 mx-auto relative">
						<div className="w-16 h-16 rounded flex items-center justify-center">
							<Graphite size={6} primary="gray" />
						</div>
						<div className="absolute inset-0" />
					</div>

					<h2 className="text-amber-700 dark:text-amber-700 dark:text-amber-400 font-mono text-2xl font-bold mb-3">
						WALLET REQUIRED
					</h2>

					<p className="text-muted-foreground text-sm mb-8 leading-relaxed">
						Connect your wallet to access the Protocol Editor and build
						autonomous web agents
					</p>

					<div className="space-y-4">
						<div className="bg-card/10 border border-border rounded p-4">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
									<Database className="w-4 h-4 text-blue-700 dark:text-blue-700 dark:text-blue-400" />
								</div>
								<span className="text-card-foreground font-mono text-sm font-bold">
									PROTOCOL REGISTRY
								</span>
							</div>
							<p className="text-muted-foreground text-xs">
								Create and manage distributed protocols for autonomous agents
							</p>
						</div>

						<div className="bg-card/10 border border-border rounded p-4">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
									<Code className="w-4 h-4 text-green-700 dark:text-green-700 dark:text-green-600" />
								</div>
								<span className="text-card-foreground font-mono text-sm font-bold">
									CODE EDITOR
								</span>
							</div>
							<p className="text-muted-foreground text-xs">
								Write and deploy workers across the heterogeneous network
							</p>
						</div>
					</div>

					<Button
						onClick={() => setRoute("wallet")}
						className="mt-8 bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black font-mono text-sm font-bold px-8 py-3 rounded shadow-lg shadow-amber-400/20 transition-all duration-200 hover:shadow-amber-400/30"
					>
						<Zap className="w-4 h-4 mr-2" />
						CONNECT WALLET
					</Button>

					<div className="mt-6 px-4 py-2 bg-muted/50 rounded inline-block">
						<div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
							<Server className="w-3 h-3" />
							Secure cryptographic connection required
						</div>
					</div>
				</div>
			</div>
		);
}
