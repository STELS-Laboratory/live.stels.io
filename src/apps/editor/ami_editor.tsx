import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
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
	Redo,
	RotateCcw,
	Save,
	Search,
	Undo,
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
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load Monaco Editor for professional code editing
const MonacoEditor = lazy(() =>
	import("@/components/editor/monaco_editor")
);
import {
	useEditorStore,
	type Worker,
	type WorkerCreateRequest,
} from "./store.ts";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
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
import { ConfirmToggleDialog } from "./ami_editor/confirm_toggle_dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeveloperAccessRequestDialog } from "@/components/auth/developer_access_request";
import { navigateTo } from "@/lib/router";
import { toast } from "@/stores";
import {
	validateDependencies,
	validateVersion,
	validateNodeId,
	validateAccountId,
} from "./utils/validation.ts";

export function AMIEditor(): JSX.Element {
	const mobile = useMobile();
	const { connectionSession } = useAuthStore();
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
	const [saving, setSaving] = useState(false);
	const [toggling, setToggling] = useState(false);
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
	const [showToggleConfirmDialog, setShowToggleConfirmDialog] = useState(false);
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
	const [undoFn, setUndoFn] = useState<(() => void) | null>(null);
	const [redoFn, setRedoFn] = useState<(() => void) | null>(null);

	// Cache for formatted scripts (sid -> formatted code)
	const formattedScriptsCache = useRef<Map<string, string>>(new Map());
	
	// AbortController for canceling in-flight requests
	const abortControllerRef = useRef<AbortController | null>(null);
	const loadWorkersTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Check developer access on mount
	useEffect(() => {
		if (connectionSession) {
			// Check if user has developer permissions
			const isDeveloper = connectionSession.developer || false;

			if (!isDeveloper) {

				setShowDeveloperAccessDialog(true);
				setLoading(false);
			}
		}
	}, [connectionSession]);

	// Load workers with debounce and abort controller
	const loadWorkers = useCallback(async () => {
		// Only load workers if user has developer permissions
		if (!connectionSession?.developer) {
			setLoading(false);
			return;
		}

		// Cancel previous request if still in flight
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create new abort controller for this request
		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		setLoading(true);
		try {
			await listWorkers();
			
			// Check if request was aborted
			if (abortController.signal.aborted) {
				return;
			}
			
			const w = useEditorStore.getState().workers;
			setWorkers(w);
			setLoading(false);
		} catch (error) {
			// Ignore abort errors
			if (error instanceof Error && error.name === "AbortError") {
				return;
			}
			
			console.error("Failed to load workers:", error);
			toast.error(
				"Failed to load workers",
				error instanceof Error ? error.message : "Unknown error occurred",
			);

			setLoading(false);
		} finally {
			// Clear abort controller if this was the active request
			if (abortControllerRef.current === abortController) {
				abortControllerRef.current = null;
			}
		}
	}, [connectionSession?.developer, listWorkers]);

	// Debounced load workers
	const debouncedLoadWorkers = useCallback(() => {
		// Clear existing timeout
		if (loadWorkersTimeoutRef.current) {
			clearTimeout(loadWorkersTimeoutRef.current);
		}

		// Set new timeout
		loadWorkersTimeoutRef.current = setTimeout(() => {
			loadWorkers();
		}, 300); // 300ms debounce
	}, [loadWorkers]);

	useEffect(() => {
		debouncedLoadWorkers();
		
		return () => {
			// Cleanup on unmount
			if (loadWorkersTimeoutRef.current) {
				clearTimeout(loadWorkersTimeoutRef.current);
			}
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				abortControllerRef.current = null;
			}
		};
	}, [debouncedLoadWorkers]);

	useEffect(() => {
		if (newlyCreatedWorker) {
			const timer = setTimeout(() => {
				setNewlyCreatedWorker(null);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [newlyCreatedWorker]);

	// Compute filtered workers (moved before useEffect to avoid dependency issues)
	const filteredWorkers = useMemo(() => {
		return workers
			.filter((protocol) => {
				// Safety check - ensure protocol has required structure
				if (!protocol?.value?.raw) {
					return false;
				}

				// Search filter
				const matchesSearch = !searchTerm ||
					protocol.value.raw.note?.toLowerCase().includes(
						searchTerm.toLowerCase(),
					) ||
					protocol.value.raw.sid?.toLowerCase().includes(
						searchTerm.toLowerCase(),
					) ||
					protocol.value.raw.nid?.toLowerCase().includes(
						searchTerm.toLowerCase(),
					) ||
					protocol.value.raw.version?.toLowerCase().includes(
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
	}, [workers, searchTerm, filterActive, filterExecutionMode, filterPriority, filterScope, sortOrder]);

	// Keyboard shortcuts for better usability
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent): void => {
			// Ignore shortcuts when typing in inputs/textarea
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target instanceof HTMLElement && e.target.isContentEditable)
			) {
				// Allow Cmd+S even in editor
				if ((e.metaKey || e.ctrlKey) && e.key === "s") {
					e.preventDefault();
					if (selectedWorker && (isEditing || isEditingNote || isEditingConfig)) {
						handleSaveAll();
					}
				}
				return;
			}

			const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
			const modKey = isMac ? e.metaKey : e.ctrlKey;

			if (modKey) {
				// Cmd/Ctrl + S: Save changes
				if (e.key === "s" || e.key === "S") {
					e.preventDefault();
					if (selectedWorker && (isEditing || isEditingNote || isEditingConfig)) {
						handleSaveAll();
					}
					return;
				}

				// Cmd/Ctrl + N: Create new worker
				if (e.key === "n" || e.key === "N") {
					e.preventDefault();
					setShowCreateDialog(true);
					return;
				}

				// Cmd/Ctrl + F: Focus search
				if (e.key === "f" || e.key === "F") {
					e.preventDefault();
					const searchInput = document.querySelector<HTMLInputElement>(
						'input[aria-label*="Search workers"]',
					);
					searchInput?.focus();
					return;
				}

				// Cmd/Ctrl + K: Quick actions (toggle worker)
				if (e.key === "k" || e.key === "K") {
					e.preventDefault();
					if (selectedWorker) {
						handleToggleWorkerStatusClick(selectedWorker);
					}
					return;
				}

				// Cmd/Ctrl + 1-4: Switch tabs
				if (e.key >= "1" && e.key <= "4") {
					e.preventDefault();
					const tabMap: Record<string, string> = {
						"1": "code",
						"2": "config",
						"3": "prompts",
						"4": "logs",
					};
					const tab = tabMap[e.key];
					if (tab && selectedWorker) {
						setActiveTab(tab);
					}
					return;
				}
			}

			// Escape: Close dialogs
			if (e.key === "Escape") {
				if (showCreateDialog) {
					setShowCreateDialog(false);
					return;
				}
				if (showMigrateDialog) {
					setShowMigrateDialog(false);
					return;
				}
				if (showStopAllDialog) {
					setShowStopAllDialog(false);
					return;
				}
				if (showToggleConfirmDialog) {
					setShowToggleConfirmDialog(false);
					return;
				}
				if (showStatsPanel) {
					setShowStatsPanel(false);
					return;
				}
			}

			// Arrow keys: Navigate worker list
			if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				if (filteredWorkers.length === 0) return;
				e.preventDefault();
				const currentIndex = selectedWorker
					? filteredWorkers.findIndex(
						(w) => w.value.raw.sid === selectedWorker.value.raw.sid,
					)
					: -1;
				const nextIndex = e.key === "ArrowDown"
					? (currentIndex + 1) % filteredWorkers.length
					: currentIndex <= 0
					? filteredWorkers.length - 1
					: currentIndex - 1;
				handleSelectWorker(filteredWorkers[nextIndex]);
				return;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		selectedWorker,
		isEditing,
		isEditingNote,
		isEditingConfig,
		filteredWorkers,
		showCreateDialog,
		showMigrateDialog,
		showStopAllDialog,
		showToggleConfirmDialog,
		showStatsPanel,
		activeTab,
	]);

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
			toast.success("Worker created successfully", `ID: ${newWorker.value.raw.sid}`);
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

	const handleToggleWorkerStatusClick = (worker?: Worker) => {
		const targetWorker = worker || selectedWorker;
		if (!targetWorker) return;
		setSelectedWorker(targetWorker);
		setShowToggleConfirmDialog(true);
	};

	const handleToggleWorkerStatus = async () => {
		if (!selectedWorker) return;
		
		// Optimistic update - update UI immediately
		const previousState = selectedWorker.value.raw.active;
		const optimisticWorker: Worker = {
			...selectedWorker,
			value: {
				...selectedWorker.value,
				raw: {
					...selectedWorker.value.raw,
					active: !previousState,
				},
			},
		};
		
		// Update UI immediately
		setSelectedWorker(optimisticWorker);
		setWorkers((prev) =>
			prev.map((w) =>
				w.value.raw.sid === selectedWorker.value.raw.sid ? optimisticWorker : w
			)
		);
		
		setToggling(true);
		try {
			// API requires FULL raw object with ALL fields
			const updatedRaw = {
				sid: selectedWorker.value.raw.sid,
				nid: selectedWorker.value.raw.nid,
				active: !previousState,
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
			// Revert optimistic update on error
			setSelectedWorker(selectedWorker);
			setWorkers((prev) =>
				prev.map((w) =>
					w.value.raw.sid === selectedWorker.value.raw.sid ? selectedWorker : w
				)
			);
			
			console.error("Failed to toggle worker status:", error);
			toast.error(
				"Failed to toggle worker status",
				error instanceof Error ? error.message : "Unknown error occurred",
			);
		} finally {
			setToggling(false);
		}
	};

	const handleSaveAll = async () => {
		console.log("🔵 handleSaveAll called", {
			selectedWorker: !!selectedWorker,
			isEditing,
			isEditingNote,
			isEditingConfig,
			saving,
		});

		if (!selectedWorker || (!isEditing && !isEditingNote && !isEditingConfig)) {
			console.log("❌ handleSaveAll early return:", {
				noSelectedWorker: !selectedWorker,
				noEditing: !isEditing && !isEditingNote && !isEditingConfig,
			});
			return;
		}

		console.log("✅ handleSaveAll proceeding with save...");

		// Clear previous validation errors
		setValidationError(null);
		console.log("🔍 Starting validations...", { currentConfig });

		// Validation: local scope can only use leader mode
		if (
			currentConfig.scope === "local" &&
			(currentConfig.executionMode === "parallel" ||
				currentConfig.executionMode === "exclusive")
		) {
			console.log("❌ Validation failed: local scope requires leader mode");
			setValidationError(
				"Invalid configuration: Local scope workers can only use leader execution mode (single node execution)",
			);
			return;
		}
		console.log("✅ Scope validation passed");

		// Validate dependencies
		const depsValidation = validateDependencies(currentConfig.dependencies);
		if (!depsValidation.valid) {
			console.log("❌ Dependencies validation failed:", depsValidation.error);
			setValidationError(depsValidation.error || "Invalid dependencies");
			return;
		}
		console.log("✅ Dependencies validation passed");

		// Validate version
		const versionValidation = validateVersion(currentConfig.version);
		if (!versionValidation.valid) {
			console.log("❌ Version validation failed:", versionValidation.error);
			setValidationError(versionValidation.error || "Invalid version");
			return;
		}
		console.log("✅ Version validation passed");

		// Validate node ID if provided (optional field - clear if invalid instead of blocking)
		if (currentConfig.nid) {
			const nidValidation = validateNodeId(currentConfig.nid);
			if (!nidValidation.valid) {
				// Node ID is optional - if it's invalid, just clear it instead of blocking save
				currentConfig.nid = "";
			}
		}

		// Validate account ID if provided (optional field - clear if invalid instead of blocking)
		if (currentConfig.accountId) {
			const accountValidation = validateAccountId(currentConfig.accountId);
			if (!accountValidation.valid) {
				// Account ID is optional - if it's invalid, just clear it instead of blocking save
				currentConfig.accountId = "";
			}
		}

		console.log("✅ All validations passed, setting saving=true");
		setSaving(true);
		console.log("🔄 Starting save process...", {
			selectedWorkerSid: selectedWorker.value.raw.sid,
			currentScript: currentScript.substring(0, 50) + "...",
			currentNote,
			currentConfig,
		});

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
			
			console.log("📤 Calling updateWorker with body:", {
				channel: workerBody.value.channel,
				rawSid: workerBody.value.raw.sid,
				rawKeys: Object.keys(workerBody.value.raw),
			});

			const result = await updateWorker(workerBody);
			
			console.log("📥 updateWorker result:", result ? "success" : "null", result);

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
				toast.success("Worker saved successfully");
			} else {
				toast.error("Failed to save worker", "No response from server");
			}
		} catch (error) {
			console.error("❌ Failed to save worker:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			toast.error(
				"Failed to save worker",
				`${errorMessage}. Please check your connection and try again.`,
			);
		} finally {
			setSaving(false);
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
			toast.error(
				"Failed to stop all workers",
				error instanceof Error ? error.message : "Unknown error occurred",
			);

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
				setSelectedWorker(migratedWorker); // Auto-select migrated worker
				toast.success("Worker migrated successfully", `New ID: ${migratedWorker.value.raw.sid}`);
			}
			return migratedWorker;
		} catch (error) {
			console.error("Failed to migrate worker:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			toast.error(
				"Failed to migrate worker",
				`${errorMessage}. Ensure the worker is stopped and network is available.`,
			);

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
			<div className="h-full bg-gradient-to-br from-background via-muted/10 to-background p-4 flex items-center justify-center">
				<div className="text-center max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
					<div className="relative mb-4 mx-auto w-20 h-20">
						{/* Animated background */}
						<div className="absolute inset-0 bg-amber-500/10 rounded-lg animate-pulse" />
						<div className="relative w-16 h-16 bg-card rounded-lg flex items-center justify-center border border-amber-500/20 shadow-lg">
							<Code className="w-8 h-8 text-amber-700 dark:text-amber-400 transition-transform duration-300" />
						</div>
					</div>
					<h2 className="text-amber-700 dark:text-amber-400 font-mono text-lg font-bold mb-2 animate-in fade-in duration-700">
						PROTOCOL EDITOR
					</h2>
					<p className="text-muted-foreground font-mono text-sm mb-6 animate-in fade-in duration-700" style={{ animationDelay: "100ms" }}>
						Desktop interface required
					</p>
					<div className="p-4 bg-card/50 border border-border rounded-lg text-left shadow-sm animate-in fade-in duration-700" style={{ animationDelay: "200ms" }}>
						<p className="text-xs text-muted-foreground mb-3 font-semibold">
							The Protocol Editor requires a desktop display for optimal
							workflow:
						</p>
						<ul className="text-xs text-muted-foreground space-y-2">
							<li className="flex items-start gap-2 transition-colors duration-200 hover:text-foreground">
								<span className="text-amber-500 mt-0.5">•</span>
								<span>Monaco Editor with syntax highlighting</span>
							</li>
							<li className="flex items-start gap-2 transition-colors duration-200 hover:text-foreground">
								<span className="text-amber-500 mt-0.5">•</span>
								<span>Split-panel layout for code and worker list</span>
							</li>
							<li className="flex items-start gap-2 transition-colors duration-200 hover:text-foreground">
								<span className="text-amber-500 mt-0.5">•</span>
								<span>Real-time execution logs and statistics</span>
							</li>
						</ul>
					</div>
					<p className="text-xs text-muted-foreground mt-4 animate-in fade-in duration-700" style={{ animationDelay: "300ms" }}>
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
						<Cpu className="w-6 h-6 text-amber-700 dark:text-amber-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
					</div>
					<div className="text-amber-700 dark:text-amber-400 font-mono text-sm font-bold">
						LOADING PROTOCOL REGISTRY
					</div>
				</div>
			</div>
		);
	}

	return connectionSession
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
					<div className="h-full bg-card flex flex-col overflow-hidden" role="complementary" aria-labelledby="registry-header">
						{/* Header - Compact */}
						<div className="px-3 py-2 border-b border-border bg-card">
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Database className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
													<h2 className="text-amber-700 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wide" id="registry-header">
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
													className="h-6 w-6 p-0 text-red-700 dark:text-red-400 hover:text-red-800 dark:text-red-300"
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
									<Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground transition-colors duration-200" />
									<Input
										placeholder="Search workers... (⌘F)"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-7 pr-7 bg-input border-border text-foreground placeholder:text-muted-foreground h-6 text-[11px] focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200 hover:border-amber-500/50"
										aria-label="Search workers by ID, note, or version"
									/>
									{searchTerm && (
										<Button
											size="sm"
											variant="ghost"
											className="absolute right-1 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 hover:bg-muted/50"
											onClick={() => setSearchTerm("")}
											title="Clear search (Esc)"
										>
											<X className="w-3 h-3 transition-transform duration-200 group-hover:rotate-90" />
										</Button>
									)}
									{!searchTerm && (
										<div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
											<kbd className="px-1 py-0.5 text-[9px] bg-muted/50 rounded border border-border/50 text-muted-foreground">
												⌘F
											</kbd>
										</div>
									)}
								</div>

								{/* Professional Filters */}
								<div className="flex items-center gap-1.5 flex-wrap">
									{/* Status Filter */}
									<div className="flex items-center gap-0.5 bg-muted/30 rounded-lg px-1 py-0.5 border border-border/50">
										<span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
											Status
										</span>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterActive(null)}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 ${
												filterActive === null
													? "bg-card text-foreground shadow-sm"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
											}`}
										>
											All
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterActive(true)}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
												filterActive === true
													? "bg-green-500/20 text-green-700 dark:text-green-600 shadow-sm"
													: "text-muted-foreground hover:text-green-700 dark:text-green-600 hover:bg-green-500/10"
											}`}
										>
											<Play className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
											Active
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterActive(false)}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
												filterActive === false
													? "bg-red-500/20 text-red-700 dark:text-red-400 shadow-sm"
													: "text-muted-foreground hover:text-red-700 dark:text-red-400 hover:bg-red-500/10"
											}`}
										>
											<Square className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
											Stopped
										</Button>
									</div>

									{/* Scope Filter */}
									<div className="flex items-center gap-0.5 bg-muted/30 rounded-lg px-1 py-0.5 border border-border/50">
										<span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
											Scope
										</span>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterScope(null)}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 ${
												filterScope === null
													? "bg-card text-foreground shadow-sm"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
											}`}
										>
											All
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterScope("local")}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
												filterScope === "local"
													? "bg-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm"
													: "text-muted-foreground hover:text-blue-700 dark:text-blue-400 hover:bg-blue-500/10"
											}`}
										>
											<Server className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
											Local
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterScope("network")}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
												filterScope === "network"
													? "bg-green-500/20 text-green-700 dark:text-green-600 shadow-sm"
													: "text-muted-foreground hover:text-green-700 dark:text-green-600 hover:bg-green-500/10"
											}`}
										>
											<Globe className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
											Network
										</Button>
									</div>

									{/* Execution Mode Filter */}
									<div className="flex items-center gap-0.5 bg-muted/30 rounded-lg px-1 py-0.5 border border-border/50">
										<span className="text-[9px] text-muted-foreground uppercase font-semibold mr-0.5">
											Mode
										</span>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterExecutionMode(null)}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 ${
												filterExecutionMode === null
													? "bg-card text-foreground shadow-sm"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
											}`}
										>
											All
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterExecutionMode("leader")}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
												filterExecutionMode === "leader"
													? "bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm"
													: "text-muted-foreground hover:text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
											}`}
										>
											<Crown className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
											Leader
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterExecutionMode("parallel")}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
												filterExecutionMode === "parallel"
													? "bg-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm"
													: "text-muted-foreground hover:text-blue-700 dark:text-blue-400 hover:bg-blue-500/10"
											}`}
										>
											<Cpu className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110" />
											Parallel
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setFilterExecutionMode("exclusive")}
											className={`h-5 px-1.5 text-[10px] transition-all duration-200 hover:scale-105 ${
												filterExecutionMode === "exclusive"
													? "bg-purple-500/20 text-purple-700 dark:text-purple-400 shadow-sm"
													: "text-muted-foreground hover:text-purple-700 dark:text-purple-400 hover:bg-purple-500/10"
											}`}
										>
											<Zap className="w-2.5 h-2.5 mr-0.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
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
											className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 hover:bg-muted/50"
											title={sortOrder === "asc"
												? "Oldest first"
												: "Newest first"}
										>
											{sortOrder === "asc"
												? <ArrowUp className="w-3 h-3 transition-transform duration-200 group-hover:-translate-y-0.5" />
												: <ArrowDown className="w-3 h-3 transition-transform duration-200 group-hover:translate-y-0.5" />}
										</Button>

										{(searchTerm || filterActive !== null ||
											filterExecutionMode || filterPriority ||
											filterScope !== "local") && (
											<Button
												size="sm"
												variant="ghost"
												className="h-6 px-2 text-[10px] text-muted-foreground hover:text-amber-700 dark:text-amber-400"
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

										<div className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
											{filteredWorkers.length}/{workers.length}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Workers List - File System Style */}
						<ScrollArea className="flex-1 overflow-y-auto" role="list" aria-label="Workers list">
							<div className="py-1">
								{loading ? (
									// Skeleton loaders with stagger animation
									<div className="space-y-1">
										{Array.from({ length: 5 }).map((_, i) => (
											<div
												key={i}
												className="px-2 py-1.5 animate-in fade-in slide-in-from-left-4"
												style={{
													animationDelay: `${i * 50}ms`,
													animationDuration: "300ms",
												}}
											>
												<div className="flex items-center gap-1.5">
													<Skeleton className="w-4 h-4 rounded" />
													<Skeleton className="h-4 flex-1 max-w-[200px]" />
													<Skeleton className="h-3 w-6 rounded" />
													<Skeleton className="h-3 w-6 rounded ml-auto" />
												</div>
												<Skeleton className="h-3 w-32 ml-5 mt-0.5" />
											</div>
										))}
									</div>
								) : filteredWorkers.length === 0 ? (
									// Empty state with beautiful design
									<div className="flex flex-col items-center justify-center py-12 px-4">
										<div className="relative mb-4">
											<div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
												<FileCode className="w-8 h-8 text-muted-foreground/50" />
											</div>
											<div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500/20 rounded-full border-2 border-background animate-pulse" />
										</div>
										<h3 className="text-sm font-semibold text-foreground mb-1">
											No workers found
										</h3>
										<p className="text-xs text-muted-foreground text-center max-w-xs mb-4">
											{searchTerm || filterActive !== null ||
												filterExecutionMode || filterPriority ||
												filterScope !== "local"
												? "Try adjusting your filters or search terms"
												: "Create your first worker to get started"}
										</p>
										{!searchTerm && filterActive === null &&
											!filterExecutionMode && !filterPriority &&
											filterScope === "local" && (
											<Button
												onClick={() => setShowCreateDialog(true)}
												size="sm"
												className="bg-amber-500 hover:bg-amber-600 text-black font-bold transition-all duration-200 hover:scale-105"
											>
												<Plus className="w-3 h-3 mr-1" />
												Create Worker
											</Button>
										)}
									</div>
								) : (
									filteredWorkers.map((protocol, index) => {
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
											role="listitem"
											aria-selected={isSelected}
											aria-label={`Worker ${protocol.value.raw.sid}${protocol.value.raw.active ? ", active" : ", stopped"}`}
											className={`group flex flex-col px-2 py-1.5 cursor-pointer transition-all duration-200 ease-out ${
												isSelected
													? "bg-amber-500/20 border-l-2 border-amber-500 shadow-sm"
													: isNewlyCreated
													? "bg-green-500/10 animate-pulse border-l-2 border-green-500"
													: "hover:bg-muted/50 hover:border-l-2 hover:border-muted-foreground/30 hover:shadow-sm"
											}`}
											onClick={() => handleSelectWorker(protocol)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													handleSelectWorker(protocol);
												}
												// Delete key to show delete option (future feature)
												if (e.key === "Delete" || e.key === "Backspace") {
													e.preventDefault();
													// Could add delete confirmation here
												}
											}}
											tabIndex={0}
											title={`${protocol.value.raw.sid} - ${protocol.value.raw.active ? "Active" : "Stopped"} - Press Enter to select, Arrow keys to navigate`}
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
																? "text-amber-700 dark:text-amber-400"
																: protocol.value.raw.active
																? "text-blue-700 dark:text-blue-400"
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
																? "text-amber-700 dark:text-amber-400"
																: protocol.value.raw.active
																? "text-green-700 dark:text-green-700 dark:text-green-600"
																: "text-red-700 dark:text-red-400"
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
																	: "bg-blue-500/20 text-blue-700 dark:text-blue-400"
															}`}
															title={scope}
														>
															{scope === "network" ? "N" : "L"}
														</span>
														<span
															className={`text-[8px] px-0.5 rounded ${
																execMode === "leader"
																	? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
																	: execMode === "parallel"
																	? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
																	: "bg-purple-500/20 text-purple-700 dark:text-purple-400"
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
															className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-green-700 dark:text-green-700 dark:text-green-600 hover:scale-110 hover:bg-green-500/10"
															title="Migrate to network"
														>
															<Upload className="w-2.5 h-2.5 transition-transform duration-200 group-hover:translate-y-[-2px]" />
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
								})
								)}
							</div>
						</ScrollArea>

						{/* Footer - File System Style */}
						<div className="px-2 py-1 border-t border-border bg-card/10 backdrop-blur-sm">
							<div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
								<span className="transition-colors duration-200">
									{filteredWorkers.length} items
								</span>
								<div className="flex items-center gap-2">
									<span className="text-green-700 dark:text-green-600 transition-colors duration-200 flex items-center gap-1">
										<div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50" />
										{workers.filter((w) => w.value.raw.active).length} active
									</span>
									<span className="text-muted-foreground/50">•</span>
									<span className="text-red-700 dark:text-red-400 transition-colors duration-200 flex items-center gap-1">
										<div className="w-1.5 h-1.5 bg-red-400 rounded-full shadow-sm shadow-red-400/30" />
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
									<div className="bg-card border-b border-border px-3 py-2 shadow-sm relative">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 flex-1 min-w-0">
												<div className="relative w-7 h-7 bg-muted rounded flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:bg-muted/80 hover:scale-105">
													<Terminal className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 transition-transform duration-200" />
													{selectedWorker.value.raw.active && (
														<div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50" />
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
																				: "bg-blue-500/10 text-blue-700 dark:text-blue-400"
																		}`}
																	>
																		{scope === "network" ? "NET" : "LOC"}
																	</span>
																	<span
																		className={`text-[9px] px-1 py-0.5 rounded font-mono ${
																			execMode === "leader"
																				? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
																				: execMode === "parallel"
																				? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
																				: "bg-purple-500/10 text-purple-700 dark:text-purple-400"
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
																				? "bg-red-500/10 text-red-700 dark:text-red-400"
																				: priority === "high"
																				? "bg-orange-500/10 text-orange-700 dark:text-orange-400"
																				: priority === "normal"
																				? "bg-green-500/10 text-green-700 dark:text-green-700 dark:text-green-600"
																				: "bg-blue-500/10 text-blue-700 dark:text-blue-400"
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
												{(isEditing || isEditingNote || isEditingConfig) && (
													<div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] text-amber-700 dark:text-amber-400 font-mono">
														<div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
														<span>Unsaved changes</span>
													</div>
												)}
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
																	className="h-6 w-6 p-0 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:text-blue-300"
																>
																	<Upload className="w-3 h-3" />
																</Button>
															</TooltipTrigger>
															<TooltipContent side="bottom">
																<div className="space-y-1">
																	<p className="font-semibold">Migrate to Network</p>
																	<p className="text-xs text-muted-foreground">
																		Create a network copy with new ID
																	</p>
																</div>
															</TooltipContent>
														</Tooltip>
													)}

													{/* Start/Stop button */}
													<Tooltip delayDuration={100}>
														<TooltipTrigger asChild>
															<Button
																onClick={() => handleToggleWorkerStatusClick()}
																size="sm"
																disabled={toggling}
															className={`h-6 w-6 p-0 ${
																selectedWorker.value.raw.active
																	? "bg-red-500 hover:bg-red-600 text-white dark:text-white"
																	: "bg-green-500 hover:bg-green-600 text-white dark:text-white"
															}`}
														>
															{toggling
																	? (
																		<Settings className="animate-spin w-3 h-3" />
																	)
																	: selectedWorker.value.raw.active
																	? <PowerOff className="w-3 h-3" />
																	: <Play className="w-3 h-3" />}
															</Button>
														</TooltipTrigger>
														<TooltipContent side="bottom">
															<div className="space-y-1">
																<p className="font-semibold">
																	{selectedWorker.value.raw.active
																		? "Stop Worker"
																		: "Start Worker"}
																</p>
																<p className="text-xs text-muted-foreground">
																	{selectedWorker.value.raw.active
																		? "Deactivate this worker"
																		: "Activate this worker"}
																</p>
																<p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border">
																	Shortcut: ⌘K
																</p>
															</div>
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
										<div className="bg-card border-b border-border px-2 py-1.5 shadow-sm">
											<div className="flex items-center justify-between">
												<TabsList className="bg-muted/30 p-0.5 h-7 transition-all duration-200">
													<TabsTrigger
														value="code"
														className="text-[11px] h-6 px-2 transition-all duration-200 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 hover:bg-muted/50"
														title="Code Editor (⌘1)"
													>
														<Code className="w-3 h-3 mr-1 transition-transform duration-200 group-data-[state=active]:scale-110" />
														Code
													</TabsTrigger>
													<TabsTrigger
														value="config"
														className="text-[11px] h-6 px-2 transition-all duration-200 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 hover:bg-muted/50"
														title="Configuration (⌘2)"
													>
														<Settings className="w-3 h-3 mr-1 transition-transform duration-200 group-data-[state=active]:scale-110" />
														Config
													</TabsTrigger>
													<TabsTrigger
														value="prompts"
														className="text-[11px] h-6 px-2 transition-all duration-200 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 hover:bg-muted/50"
														title="Prompts (⌘3)"
													>
														<FileText className="w-3 h-3 mr-1 transition-transform duration-200 group-data-[state=active]:scale-110" />
														Prompts
													</TabsTrigger>
													<TabsTrigger
														value="logs"
														className="text-[11px] h-6 px-2 transition-all duration-200 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400 hover:bg-muted/50"
														title="Logs (⌘4)"
													>
														<Terminal className="w-3 h-3 mr-1 transition-transform duration-200 group-data-[state=active]:scale-110" />
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
														{/* Undo/Redo buttons - always visible */}
														{activeTab === "code" && undoFn && (
															<>
																<Tooltip delayDuration={100}>
																	<TooltipTrigger asChild>
																		<Button
																			onClick={() => undoFn()}
																			variant="ghost"
																			size="sm"
																			className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-700 dark:text-amber-400 transition-all duration-200 hover:scale-110 hover:bg-amber-500/10"
																		>
																			<Undo className="w-3 h-3 transition-transform duration-200 hover:-translate-x-0.5" />
																		</Button>
																	</TooltipTrigger>
																	<TooltipContent side="bottom">
																		Undo (⌘Z)
																	</TooltipContent>
																</Tooltip>
																<Tooltip delayDuration={100}>
																	<TooltipTrigger asChild>
																		<Button
																			onClick={() => redoFn?.()}
																			variant="ghost"
																			size="sm"
																			className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-700 dark:text-amber-400 transition-all duration-200 hover:scale-110 hover:bg-amber-500/10 disabled:opacity-30"
																			disabled={!redoFn}
																		>
																			<Redo className="w-3 h-3 transition-transform duration-200 hover:translate-x-0.5" />
																		</Button>
																	</TooltipTrigger>
																	<TooltipContent side="bottom">
																		Redo (⌘⇧Z)
																	</TooltipContent>
																</Tooltip>
															</>
														)}
														{/* Format button - always visible */}
														{activeTab === "code" && formatCodeFn && (
															<Tooltip delayDuration={100}>
																<TooltipTrigger asChild>
																	<Button
																		onClick={() =>
																			formatCodeFn()}
																		variant="ghost"
																		size="sm"
																		className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-700 dark:text-blue-400 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10"
																	>
																		<AlignJustify className="w-3 h-3 transition-transform duration-200 hover:rotate-90" />
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
																				className="h-6 w-6 p-0 text-muted-foreground hover:text-amber-700 dark:text-amber-400"
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
																				onClick={(e) => {
																					console.log("🖱️ Save button clicked", {
																						event: e,
																						saving,
																						selectedWorker: !!selectedWorker,
																						isEditing,
																						isEditingNote,
																						isEditingConfig,
																					});
																					handleSaveAll();
																				}}
																				size="sm"
																				className="h-6 px-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black"
																				disabled={saving}
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
												<MonacoEditor
													script={currentScript}
													handleEditorChange={handleEditorChange}
													onEditorReady={(formatFn) =>
														setFormatCodeFn(() => formatFn)}
													onUndoRedoReady={(undo, redo) => {
														setUndoFn(() => undo);
														setRedoFn(() => redo);
													}}
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
														<AlertDescription className="text-red-700 dark:text-red-400">
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
																	<Server className="w-4 h-4 text-blue-700 dark:text-blue-400" />
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
																	className="text-blue-700 dark:text-blue-400 hover:text-blue-500 underline font-medium"
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
														<AlertDescription className="text-blue-700 dark:text-blue-400 text-xs">
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
															onChange={(e) => {
																const validation = validateVersion(e.target.value);
																if (validation.valid) {
																	handleConfigChange("version", e.target.value);
																	setValidationError(null);
																} else {
																	setValidationError(validation.error || "Invalid version");
																}
															}}
															placeholder="1.19.2"
															className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
															aria-label="Version"
															aria-invalid={validationError?.includes("version") || false}
														/>
														{validationError?.includes("version") && (
															<p className="text-xs text-red-700 dark:text-red-400">
																{validationError}
															</p>
														)}
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
															onChange={(e) => {
																const validation = validateNodeId(e.target.value);
																if (validation.valid) {
																	handleConfigChange("nid", e.target.value);
																	setValidationError(null);
																} else {
																	setValidationError(validation.error || "Invalid node ID");
																}
															}}
															placeholder="s-0001"
															className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
															aria-label="Node ID (optional)"
															aria-invalid={validationError?.includes("node ID") || false}
														/>
														{validationError?.includes("node ID") && (
															<p className="text-xs text-red-700 dark:text-red-400">
																{validationError}
															</p>
														)}
													</div>

													<div className="space-y-1.5">
														<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
															<Database className="w-3 h-3" />
															<span>Dependencies</span>
														</div>
														<Input
															value={currentConfig.dependencies.join(", ")}
															onChange={(e) => {
																const deps = e.target.value.split(",").map((d) => d.trim())
																	.filter(Boolean);
																const validation = validateDependencies(deps);
																if (validation.valid) {
																	handleConfigChange("dependencies", deps);
																	setValidationError(null);
																} else {
																	setValidationError(validation.error || "Invalid dependencies");
																}
															}}
															placeholder="gliesereum"
															className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
															aria-label="Dependencies (comma-separated)"
															aria-invalid={validationError?.includes("dependencies") || false}
														/>
														{validationError?.includes("dependencies") && (
															<p className="text-xs text-red-700 dark:text-red-400">
																{validationError}
															</p>
														)}
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
															onChange={(e) => {
																const validation = validateAccountId(e.target.value);
																if (validation.valid) {
																	handleConfigChange("accountId", e.target.value);
																	setValidationError(null);
																} else {
																	setValidationError(validation.error || "Invalid account ID");
																}
															}}
															placeholder="g-bhts"
															className="bg-muted border-border text-card-foreground text-xs h-8 font-mono"
															aria-label="Account ID (optional)"
															aria-invalid={validationError?.includes("account ID") || false}
														/>
														{validationError?.includes("account ID") && (
															<p className="text-xs text-red-700 dark:text-red-400">
																{validationError}
															</p>
														)}
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
													aria-label="Worker prompts and instructions"
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
											<Code className="w-10 h-10 text-amber-700 dark:text-amber-400" />
										</div>
										<h3 className="text-amber-700 dark:text-amber-400 font-mono text-xl font-bold mb-2">
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

				{/* Toggle Worker Status Confirmation Dialog */}
				<ConfirmToggleDialog
					open={showToggleConfirmDialog}
					onOpenChange={setShowToggleConfirmDialog}
					worker={selectedWorker}
					onConfirm={handleToggleWorkerStatus}
					isToggling={toggling}
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

					<h2 className="text-amber-700 dark:text-amber-400 font-mono text-2xl font-bold mb-3">
						AUTHENTICATION REQUIRED
					</h2>

					<p className="text-muted-foreground text-sm mb-8 leading-relaxed">
						Authenticate with GitHub to access the Protocol Editor and build
						autonomous web agents
					</p>

					<div className="space-y-4">
						<div className="bg-card/10 border border-border rounded p-4">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
									<Database className="w-4 h-4 text-blue-700 dark:text-blue-400" />
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
						onClick={() => navigateTo("welcome")}
						className="mt-8 bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black font-mono text-sm font-bold px-8 py-3 rounded shadow-lg shadow-amber-400/20 transition-all duration-200 hover:shadow-amber-400/30"
					>
						<Zap className="w-4 h-4 mr-2" />
						AUTHENTICATE
					</Button>

					<div className="mt-6 px-4 py-2 bg-muted/50 rounded inline-block">
						<div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
							<Server className="w-3 h-3" />
							GitHub authentication required
						</div>
					</div>
				</div>
			</div>
		);
}
