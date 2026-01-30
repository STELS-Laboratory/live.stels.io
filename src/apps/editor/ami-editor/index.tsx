/**
 * AMIEditor module exports
 */

/* eslint-disable react-refresh/only-export-components */
import EditorErrorBoundary from "../error-boundary";
import { AMIEditor } from "../ami_editor";

// Wrap AMIEditor with Error Boundary
const AMIEditorWithErrorBoundary = () => (
  <EditorErrorBoundary>
    <AMIEditor />
  </EditorErrorBoundary>
);

export { AMIEditor, AMIEditorWithErrorBoundary as default };
export * from "./types";
export * from "./utils";
export * from "./constants";
export { CreateWorkerDialog } from "./create-worker-dialog";
export { LeaderInfoCard } from "./leader-info-card";
export { WorkerStatsPanel } from "./worker-stats-panel";
export { WorkerLogsPanel } from "./worker-logs-panel";
export { StopAllDialog } from "./stop-all-dialog";
export { MigrateWorkerDialog } from "./migrate-worker-dialog";
export { ConfirmToggleDialog } from "./confirm-toggle-dialog";
export { CreateToolDialog } from "./CreateToolDialog";
export { DeleteToolDialog } from "./DeleteToolDialog";
export { CallToolDialog } from "./CallToolDialog";
export type {
  LeaderInfo,
  Worker,
  WorkerCreateRequest,
  WorkerStats,
} from "../store";
export { useEditorStore } from "../store";
export { getScopeColor } from "./utils";
