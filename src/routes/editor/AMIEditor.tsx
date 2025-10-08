import { useEffect, useState } from "react";
import Split from "react-split";
import {
	Activity,
	Calendar,
	Check,
	Clock,
	Code,
	Cpu,
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
	Terminal,
	X,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import EditorComponent from "@/components/editor/EditorComponent";
import type { Worker } from "@/stores/modules/worker.store";
import { useWorkerStore } from "@/stores/modules/worker.store";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useAppStore } from "@/stores/modules/app.store";
import { useMobile } from "@/hooks/useMobile.ts";
import type { JSX } from "react/jsx-runtime";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Graphite from "@/components/ui/vectors/logos/Graphite";

export function AMIEditor(): JSX.Element {
	const mobile = useMobile();
	const { wallet } = useAuthStore();
	const { setRoute } = useAppStore();
	const listWorkers = useWorkerStore((state) => state.listWorkers);
	const updateWorker = useWorkerStore((state) => state.updateWorker);

	const [workers, setWorkers] = useState<Worker[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
	const [currentScript, setCurrentScript] = useState<string>("");
	const [currentNote, setCurrentNote] = useState<string>("");
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingNote, setIsEditingNote] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterActive, setFilterActive] = useState<boolean | null>(null);
	const setWorker = useWorkerStore((state) => state.setWorker);
	const [creatingWorker, setCreatingWorker] = useState(false);
	const [newlyCreatedWorker, setNewlyCreatedWorker] = useState<string | null>(
		null,
	);

	// Load workers
	const loadWorkers = async () => {
		setLoading(true);
		try {
			await listWorkers();
			const w = useWorkerStore.getState().workers;
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

	const handleSelectWorker = (protocol: Worker) => {
		setSelectedWorker(protocol);
		setCurrentScript(protocol.value.raw.script);
		setCurrentNote(protocol.value.raw.note);
		setIsEditing(false);
		setIsEditingNote(false);
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
		if (!selectedWorker || (!isEditing && !isEditingNote)) return;
		setUpdating(true);
		try {
			const updatedRaw = {
				...selectedWorker.value.raw,
				script: currentScript,
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
				setIsEditing(false);
				setIsEditingNote(false);
			}
		} catch (error) {
			console.error("Failed to save protocol changes:", error);
		} finally {
			setUpdating(false);
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
			<div className="h-full bg-zinc-950 p-4 flex items-center justify-center">
				<div className="text-center max-w-sm mx-auto">
					<div className="w-16 h-16 bg-zinc-900 rounded-xl flex items-center justify-center mb-4 mx-auto">
						<Terminal className="w-8 h-8 text-amber-400" />
					</div>
					<h2 className="text-amber-400 font-mono text-lg font-bold mb-2">
						MARKET BROWSER
					</h2>
					<p className="text-zinc-400 font-mono text-sm">
						Desktop interface required
					</p>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="h-full bg-zinc-950 flex items-center justify-center">
				<div className="text-center">
					<div className="relative mb-6">
						<div className="w-16 h-16 border-4 border-zinc-800 border-t-amber-400 rounded-full animate-spin mx-auto">
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
			<div className="h-full bg-zinc-950">
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
					<div className="h-full bg-zinc-900 flex flex-col border-r border-zinc-800">
						{/* Header */}
						<div className="p-4 border-b border-zinc-800 bg-zinc-900">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
										<Database className="w-4 h-4 text-amber-400" />
									</div>
									<div>
										<h2 className="text-amber-400 font-mono text-sm font-bold">
											PROTOCOL REGISTRY
										</h2>
										<p className="text-zinc-500 text-xs font-mono">
											Distributed execution platform
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{/*<Button*/}
									{/*	size="sm"*/}
									{/*	variant="outline"*/}
									{/*	className="bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white font-mono text-xs h-8"*/}
									{/*>*/}
									{/*	<LogOut className="w-3 h-3 mr-1" />*/}
									{/*	EXIT*/}
									{/*</Button>*/}
									<Button
										size="sm"
										onClick={async () => {
											setCreatingWorker(true);
											try {
												const created = await setWorker();
												if (created && created.value && created.value.raw) {
													const newWorker: Worker = created;
													setWorkers((prev) => [newWorker, ...prev]);
													setSelectedWorker(newWorker);
													setCurrentScript(newWorker.value.raw.script);
													setCurrentNote(newWorker.value.raw.note);
													setIsEditing(false);
													setIsEditingNote(false);
													setNewlyCreatedWorker(newWorker.value.raw.sid);
												}
											} catch (error) {
												console.error("Failed to create protocol:", error);
											} finally {
												setCreatingWorker(false);
											}
										}}
										disabled={true}
										className={`bg-amber-500 hover:bg-amber-600 text-black font-mono text-xs h-8 px-3`}
									>
										{creatingWorker
											? (
												<>
													<div className="animate-spin mr-1 w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
													CREATING
												</>
											)
											: (
												<>
													<Plus className="w-3 h-3 mr-1" />
													AI PROTOCOL
												</>
											)}
									</Button>
								</div>
							</div>

							{/* Search and Filter */}
							<div className="space-y-3">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
									<Input
										placeholder="Search workers..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-500 h-9 focus:border-amber-400 focus:ring-amber-400/20"
									/>
									{searchTerm && (
										<Button
											size="sm"
											variant="ghost"
											className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 text-zinc-500 hover:text-zinc-300"
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
										<SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs h-8">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-zinc-800 border-zinc-700">
											<SelectItem value="all" className="text-zinc-300 text-xs">
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
												className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-300"
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

									return (
										<div
											key={protocol.value.raw.sid}
											onClick={() => handleSelectWorker(protocol)}
											className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
												isSelected
													? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/20"
													: isNewlyCreated
													? "border-green-400 bg-green-400/10 shadow-lg shadow-green-400/20 animate-pulse"
													: "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
											}`}
										>
											{/* Header */}
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2 flex-1 min-w-0">
													<div className="relative">
														<div
															className={`w-8 h-8 rounded-lg flex items-center justify-center ${
																isNewlyCreated
																	? "bg-green-400/20"
																	: "bg-zinc-700/50"
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
															<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-zinc-800" />
														)}
													</div>
													<div className="flex-1 min-w-0">
														<div
															className={`font-mono text-sm font-bold truncate ${
																isNewlyCreated
																	? "text-green-300"
																	: isSelected
																	? "text-amber-300"
																	: "text-zinc-200"
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
												<div className="mb-3 p-2 bg-zinc-900/50 rounded border border-zinc-700/50">
													<p className="text-xs text-blue-300 line-clamp-2">
														{protocol.value.raw.note}
													</p>
												</div>
											)}

											{/* Metadata */}
											<div className="grid grid-cols-2 gap-2 text-xs">
												<div className="flex items-center gap-1">
													<Network className="w-3 h-3 text-blue-400" />
													<span className="text-zinc-400 truncate">
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
													<Clock className="w-3 h-3 text-zinc-400" />
													<span className="text-zinc-400">
														{getTimeAgo(protocol.value.raw.timestamp)}
													</span>
												</div>
											</div>

											{/* Script Preview */}
											<div className="mt-3 p-2 bg-zinc-900/50 rounded border border-zinc-700/50">
												<code className="text-xs text-zinc-400 line-clamp-1">
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
						<div className="p-4 border-t border-zinc-800 bg-zinc-900">
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
					<div className="flex flex-col h-full bg-zinc-900">
						{selectedWorker
							? (
								<div className="h-full flex flex-col">
									{/* Editor Header */}
									<div className="bg-zinc-900 border-b border-zinc-800 p-4">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center relative">
													<Terminal className="w-5 h-5 text-amber-400" />
													{selectedWorker.value.raw.active && (
														<div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-zinc-900" />
													)}
												</div>
												<div>
													<h3 className="text-zinc-100 font-mono text-lg font-bold">
														{selectedWorker.value.raw.sid}
													</h3>
													<div className="flex items-center gap-2 mt-1">
														<Badge
															variant="outline"
															className={`text-xs ${
																selectedWorker.value.raw.active
																	? "border-green-400 text-green-400 bg-green-400/10"
																	: "border-red-400 text-red-400 bg-red-400/10"
															}`}
														>
															{selectedWorker.value.raw.active
																? "ACTIVE"
																: "INACTIVE"}
														</Badge>
														<Badge
															variant="outline"
															className="text-xs border-amber-400 text-amber-400 bg-amber-400/10"
														>
															v{selectedWorker.value.raw.version}
														</Badge>
													</div>
												</div>
											</div>

											<Button
												onClick={handleToggleWorkerStatus}
												size="sm"
												disabled={updating}
												className={`px-4 py-2 font-mono text-sm transition-all duration-200 ${
													selectedWorker.value.raw.active
														? "bg-red-500 hover:bg-red-600 text-white"
														: "bg-green-500 hover:bg-green-600 text-white"
												}`}
											>
												{updating
													? (
														<>
															<Settings className="animate-spin mr-2 w-4 h-4" />
															UPDATING
														</>
													)
													: selectedWorker.value.raw.active
													? (
														<>
															<PowerOff className="w-4 h-4 mr-2" />
															STOP
														</>
													)
													: (
														<>
															<Play className="w-4 h-4 mr-2" />
															START
														</>
													)}
											</Button>
										</div>

										{/* Metadata */}
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
											<div className="flex items-center gap-2">
												<Server className="w-3 h-3 text-blue-400" />
												<span className="text-zinc-400">Node:</span>
												<span className="text-blue-300 font-mono">
													{selectedWorker.value.raw.nid}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Network className="w-3 h-3 text-purple-400" />
												<span className="text-zinc-400">Channel:</span>
												<span className="text-purple-300 font-mono truncate">
													{selectedWorker.value.channel}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Calendar className="w-3 h-3 text-amber-400" />
												<span className="text-zinc-400">Modified:</span>
												<span className="text-amber-400 font-mono">
													{formatTimestamp(selectedWorker.value.raw.timestamp)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<HardDrive className="w-3 h-3 text-zinc-400" />
												<span className="text-zinc-400">Size:</span>
												<span className="text-zinc-300 font-mono">
													{selectedWorker.value.raw.script.length} chars
												</span>
											</div>
										</div>
									</div>

									{/* Notes Section */}
									<div className="bg-zinc-900 border-b border-zinc-800 p-4">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2">
												<FileText className="w-4 h-4 text-blue-400" />
												<span className="text-blue-300 font-mono text-sm font-bold">
													NOTES
												</span>
											</div>
											{isEditingNote && (
												<div className="flex items-center gap-2">
													<Button
														onClick={resetNote}
														variant="ghost"
														size="sm"
														className="text-xs text-zinc-400 hover:text-zinc-200"
													>
														<RotateCcw className="w-3 h-3 mr-1" />
														Reset
													</Button>
													<Button
														onClick={handleSaveNote}
														variant="outline"
														size="sm"
														className="text-xs border-blue-400 bg-blue-400/10 text-blue-400 hover:bg-blue-400/20"
														disabled={updating}
													>
														<Save className="w-3 h-3 mr-1" />
														Save
													</Button>
												</div>
											)}
										</div>
										<Textarea
											value={currentNote}
											onChange={(e) => handleNoteChange(e.target.value)}
											placeholder="Add notes about this protocol..."
											className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-500 text-sm resize-none h-20 focus:border-blue-400 focus:ring-blue-400/20"
										/>
									</div>

									{/* Unsaved Changes Warning */}
									{(isEditing || isEditingNote) && (
										<div className="bg-amber-400/10 border-b border-amber-400/20 text-amber-400 px-4 py-3 flex justify-between items-center">
											<div className="flex items-center gap-2">
												<Activity className="w-4 h-4 animate-pulse" />
												<span className="font-mono text-sm font-bold">
													UNSAVED CHANGES
													{isEditing && isEditingNote
														? " (SCRIPT & NOTES)"
														: isEditing
														? " (SCRIPT)"
														: " (NOTES)"}
												</span>
											</div>
											<div className="flex gap-2">
												<Button
													onClick={() => {
														resetScript();
														resetNote();
													}}
													variant="ghost"
													size="sm"
													className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
												>
													<RotateCcw className="w-3 h-3 mr-1" />
													Revert
												</Button>
												<Button
													onClick={handleSaveAll}
													variant="outline"
													size="sm"
													className="border-amber-400 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
													disabled={updating}
												>
													<Check className="w-3 h-3 mr-1" />
													Save All
												</Button>
											</div>
										</div>
									)}

									{/* Code Editor */}
									<div className="flex-1 overflow-hidden">
										<EditorComponent
											script={currentScript}
											handleEditorChange={handleEditorChange}
										/>
									</div>
								</div>
							)
							: (
								/* No Worker Selected */
								<div className="h-full flex items-center justify-center">
									<div className="text-center max-w-md">
										<div className="w-20 h-20 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 mx-auto">
											<Code className="w-10 h-10 text-amber-400" />
										</div>
										<h3 className="text-amber-400 font-mono text-xl font-bold mb-2">
											CODE EDITOR
										</h3>
										<p className="text-zinc-400 text-sm mb-6">
											Select a protocol from the registry to start editing
										</p>
										<div className="px-4 py-2 bg-zinc-800 rounded-lg inline-block">
											<div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
												<Terminal className="w-3 h-3" />
												Ready for development
											</div>
										</div>
									</div>
								</div>
							)}
					</div>
				</Split>

				{/* Worker Creation Modal */}
				{creatingWorker && (
					<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
						<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md mx-4 shadow-2xl">
							<div className="text-center">
								<div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 mx-auto relative">
									<Zap className="w-8 h-8 text-amber-400" />
									<div className="absolute inset-0 rounded-xl border-2 border-amber-400/30 animate-ping" />
								</div>
								<h3 className="text-amber-400 font-mono text-xl font-bold mb-2">
									CREATING PROTOCOL
								</h3>
								<p className="text-zinc-400 text-sm mb-6">
									Initializing new execution instance...
								</p>
								<div className="bg-zinc-800 rounded-full h-2 overflow-hidden">
									<div className="bg-amber-400 h-full animate-pulse" />
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		)
		: (
			<div className="h-full bg-zinc-950 flex items-center justify-center">
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

					<p className="text-zinc-400 text-sm mb-8 leading-relaxed">
						Connect your wallet to access the protocol registry and code editor
					</p>

					<div className="space-y-4">
						<div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
									<Database className="w-4 h-4 text-blue-400" />
								</div>
								<span className="text-zinc-300 font-mono text-sm font-bold">
									PROTOCOL REGISTRY
								</span>
							</div>
							<p className="text-zinc-500 text-xs">
								Manage distributed execution protocols
							</p>
						</div>

						<div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
							<div className="flex items-center gap-3 mb-3">
								<div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
									<Code className="w-4 h-4 text-green-400" />
								</div>
								<span className="text-zinc-300 font-mono text-sm font-bold">
									CODE EDITOR
								</span>
							</div>
							<p className="text-zinc-500 text-xs">
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

					<div className="mt-6 px-4 py-2 bg-zinc-800/50 rounded-lg inline-block">
						<div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
							<Server className="w-3 h-3" />
							Secure Web3 connection required
						</div>
					</div>
				</div>
			</div>
		);
}
