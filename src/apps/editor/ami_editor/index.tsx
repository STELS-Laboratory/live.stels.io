/**
 * AMIEditor module exports
 */

/* eslint-disable react-refresh/only-export-components */
import EditorErrorBoundary from "../error_boundary";
import { AMIEditor } from "../ami_editor";

// Wrap AMIEditor with Error Boundary
const AMIEditorWithErrorBoundary = () => (
  <EditorErrorBoundary>
    <AMIEditor />
  </EditorErrorBoundary>
);

export { AMIEditor, AMIEditorWithErrorBoundary as default };
export * from "./types.ts";
export * from "./utils.ts";
export * from "./constants.ts";
export { CreateWorkerDialog } from "./create_worker_dialog";
export { LeaderInfoCard } from "./leader_info_card";
export { WorkerStatsPanel } from "./worker_stats_panel";
export { WorkerLogsPanel } from "./worker_logs_panel";
export { WorkerEconomicsPanel } from "./worker_economics_panel";
export { StopAllDialog } from "./stop_all_dialog";
export { MigrateWorkerDialog } from "./migrate_worker_dialog";
export { ConfirmToggleDialog } from "./confirm_toggle_dialog";
export type {
  LeaderInfo,
  Worker,
  WorkerCreateRequest,
  WorkerStats,
} from "../store.ts";
export { useEditorStore } from "../store.ts";
export { getScopeColor } from "./utils.ts";
