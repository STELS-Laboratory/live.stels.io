# Editor Module Changelog

## [2.0.0] - 2024-10-15

### ✨ Added

#### **Worker Templates System**

- 📝 8 pre-built templates for common use cases:
  - Grid Trading (leader, critical)
  - DCA Strategy (leader, high, single)
  - Market Monitor (parallel, normal)
  - Balance Monitor (parallel, critical)
  - Price Aggregator (leader, high)
  - Health Check (parallel, low)
  - Log Cleanup (exclusive, low)
  - Empty Template (customizable)
- 🎨 Template categories: trading, monitoring, analytics, maintenance
- 🔧 Each template includes proper execution mode and priority

#### **Worker Creation Dialog**

- 🎯 Two-step wizard:
  - Step 1: Template selection with category badges
  - Step 2: Configuration with validation
- ⚙️ Full configuration options:
  - Execution Mode (parallel/leader/exclusive)
  - Priority (critical/high/normal/low)
  - Worker Mode (loop/single)
  - Dependencies version
  - Account ID (optional)
  - Assigned Node (for exclusive mode)
  - Description
- ✅ Configuration summary with visual feedback
- 🎨 Professional UI with icons and color coding

#### **Leader Election Monitoring**

- 👑 LeaderInfoCard component for leader-mode workers
- 📊 Shows:
  - Current leader node
  - Election timestamp
  - Last renewal time
  - Lease expiration countdown
  - Expired status warning
- 🔄 Auto-refresh every 10 seconds (toggleable)
- 🎨 Color-coded status (green=active, orange=no leader, red=expired)

#### **Worker Statistics Panel**

- 📈 Overall statistics dashboard:
  - Running workers count
  - Total executions
  - Total errors
  - Average error rate
- 📊 Error breakdown (network vs critical)
- 📋 Individual worker metrics with progress bars
- 🔄 Auto-refresh capability (15s interval)
- 🎨 Professional card-based layout

#### **Worker Deletion**

- 🗑️ Delete button on each worker card (hover to reveal)
- ⚠️ Confirmation dialog with worker ID preview
- ✅ Automatic cleanup from local state
- 🔒 Secure API integration

#### **Store Enhancements**

- 🆕 `createWorker()` - Full-featured worker creation
- 🗑️ `deleteWorker()` - Remove workers
- 👑 `getLeaderInfo()` - Check leader election status
- 📊 `getWorkerStats()` - Fetch execution metrics
- 🔧 Updated API calls to use WebFix protocol
- 🔐 Proper session-based authentication

#### **UI/UX Improvements**

- 👑 Crown badge indicator for leader-mode workers
- 🎨 Visual differentiation by execution mode
- 📊 Stats button in header
- ✨ Professional animations and transitions
- 🔍 Better error handling and user feedback
- 📱 Improved mobile detection (no mobile support message)

### 🔄 Changed

#### **API Integration**

- **Before**: Used `/ai-worker/*` endpoints with Bearer token
- **After**: Uses WebFix protocol with session header

**Old**:

```typescript
POST /ai-worker/list
Authorization: Bearer {token}
```

**New**:

```typescript
POST {api}
stels-session: {session}
Body: {
  webfix: "1.0",
  method: "listWorkers",
  params: [],
  body: {}
}
```

#### **Worker Creation**

- **Before**: Disabled button, minimal configuration
- **After**: Full wizard with templates and configuration options

#### **Worker Display**

- **Before**: Basic card with SID and status
- **After**: Rich card with indicators (active, leader, new), delete button,
  metadata

### 🐛 Fixed

- ✅ Fixed disabled [+ AI PROTOCOL] button
- ✅ Fixed API authentication (Bearer token → session header)
- ✅ Fixed endpoint paths (old `/ai-worker/*` → WebFix protocol)
- ✅ Added proper error handling for all operations
- ✅ Added validation for worker creation

### 🗑️ Removed

- ❌ Old worker creation modal (replaced with dialog)
- ❌ Hardcoded default script (replaced with templates)
- ❌ Unused BRAIN_TYPES and WORKER_TYPES display (kept in constants for future
  use)

---

## [1.0.0] - Initial Release

### Features

- Basic worker list display
- Script editing with Monaco Editor
- Worker status toggle (start/stop)
- Note editing
- Search and filter functionality
- Basic CRUD operations

---

## Migration Guide

### For Users

No migration needed - all existing workers continue to work.

**New capabilities**:

1. Create workers with templates (click [+ AI PROTOCOL])
2. View leader election status (select leader worker)
3. Monitor execution stats (click [STATS])
4. Delete workers (hover and click 🗑️)

### For Developers

**Updated Store API**:

```typescript
// Old
const setWorker = useEditorStore((state) => state.setWorker);
await setWorker(); // Limited configuration

// New
const createWorker = useEditorStore((state) => state.createWorker);
await createWorker({
  scriptContent: "...",
  executionMode: "leader",
  priority: "critical",
  // ... full configuration
});
```

**New Store Methods**:

```typescript
import { useEditorStore } from "./store";

// Delete worker
const deleteWorker = useEditorStore((state) => state.deleteWorker);
await deleteWorker(sid);

// Get leader info
const getLeaderInfo = useEditorStore((state) => state.getLeaderInfo);
const info = await getLeaderInfo(workerId);

// Get statistics
const getWorkerStats = useEditorStore((state) => state.getWorkerStats);
const stats = await getWorkerStats();
```

---

## Breaking Changes

### API Endpoints

⚠️ **Backend must support WebFix protocol**:

```typescript
// Required methods:
-listWorkers -
  setWorker -
  updateWorker -
  deleteWorker -
  getLeaderInfo -
  getWorkerStats;
```

### Worker Structure

⚠️ **Extended worker.value.raw fields**:

```typescript
interface WorkerRaw {
  // Existing fields
  sid: string;
  nid: string;
  active: boolean;
  script: string;
  note: string;
  version: string;
  dependencies: string[];
  timestamp: number;

  // NEW fields (optional, added by backend)
  executionMode?: "parallel" | "leader" | "exclusive";
  priority?: "critical" | "high" | "normal" | "low";
  mode?: "loop" | "single";
  accountId?: string;
  assignedNode?: string;
}
```

---

## Roadmap

### v2.1.0 (Planned)

- [ ] Worker script versioning
- [ ] Script diff viewer
- [ ] Execution logs viewer
- [ ] Worker cloning/duplication
- [ ] Bulk operations (start/stop multiple)
- [ ] Advanced filtering (by mode, priority)
- [ ] Worker dependencies graph
- [ ] Export/import workers

### v2.2.0 (Planned)

- [ ] Mobile support
- [ ] Script debugging tools
- [ ] Performance profiling
- [ ] A/B testing for strategies
- [ ] Worker marketplace
- [ ] Collaborative editing

---

## Support

- 📖 [Full Documentation](./README.md)
- 🔧
  [Worker Development Guide](../../../../iscructions/WORKER_DEVELOPMENT_GUIDE.md)
- 👑 [Leader Election Guide](../../../../iscructions/WORKER_LEADER_ELECTION.md)
- ⚡ [Quick Reference](../../../../iscructions/WORKER_QUICK_REFERENCE.md)

---

**Maintainer**: STELS Laboratory\
**License**: Proprietary\
**Status**: Production Ready ✅
