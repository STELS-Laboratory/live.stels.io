# AMI Editor Changelog

## [Unreleased] - 2025-10-18

### ✨ Added

- **Real-time Worker Logs Streaming**
  - New `WorkerLogsPanel` component with SSE support
  - "Logs" tab in worker editor
  - Follow/Pause mode for log streaming
  - Auto-scroll toggle
  - Color-coded log levels (ERROR, WARN, INFO, DEBUG)
  - Download logs functionality
  - Connection status indicator
  - Line counter
  - **Linux Terminal Design** - classic green-on-black terminal style
  - Scanlines effect (CRT monitor simulation)
  - Terminal header with macOS-style buttons
  - Unix-style prompt (`worker@stels:~/workerId$`)
  - Blinking cursor indicator
  - Terminal prompt symbol (`›`) for each log line

- **Keyboard Shortcuts**
  - `⌘S` / `Ctrl+S` - Save all changes (code, notes, config)
  - Smart detection - only saves when there are changes
  - Prevents browser's default save dialog
  - Cross-platform support (macOS, Windows, Linux)
  - Visual tooltip on Save All button

### 🎨 UX Improvements

- **Worker Switching**
  - Auto-clear previous worker's logs
  - Visual separator with timestamp and worker ID
  - Prevents confusion between workers
  - Cyan-colored separator for visibility

- **Terminal UI**
  - Linux-style terminal design
  - Green monospace text on black background
  - Scanlines effect for retro CRT look
  - macOS-style window controls (● ● ●)
  - Unix-style prompt display
  - Blinking cursor when connected
  - Prompt symbol (`›`) for each log line

### 📚 Documentation

- Added `HOTKEYS.md` - keyboard shortcuts guide
- Added `TERMINAL_DESIGN.md` - Linux terminal styling documentation
- Added `SSE_PARSING_FIX.md` - detailed explanation of SSE parsing
- Added `SECURITY_NOTES.md` - security guide for authenticated SSE
- Updated API documentation references

### 🔧 Technical

- Integration with Worker Logs API (`/api/worker/logs/stream`)
- Server-Sent Events (SSE) implementation with proper chunk buffering
- Authentication via fetch headers (fetch + ReadableStream, not EventSource)
- Circular buffer pattern for memory optimization
- Automatic reconnection on connection loss
- Keyboard event listeners with proper cleanup
- Cross-platform hotkey detection (metaKey vs ctrlKey)
- Auto-clear logs on worker switch with visual separator

### 🛠️ Build & Linter Fixes

- **Excluded external libraries from linting**
  - Added `src/lib/ccxt` to ESLint and TypeScript ignores
  - Added `src/components/editor/monaco` to ESLint and TypeScript ignores
  - Faster builds by skipping 985+ third-party files

- **Fixed type safety issues**
  - Removed `any` type from `useAutoConnections.ts` (used
    `keyof ConnectionKeys`)
  - Removed `any` types from `echarts-utils.ts` (created `EChartsTooltipParam`
    interface)
  - Added type guards for safe property access
  - Added null checks for optional properties

- **Build status**
  - ✅ 0 ESLint errors
  - ✅ 0 TypeScript errors
  - ✅ Production build successful

---

## Previous Updates

### Worker Migration (2025-10-17)

- Added `MigrateWorkerDialog` component
- Support for migrating local workers to network scope
- New SID generation during migration
- UI indicators for migration process

### Leader Election (2025-10-16)

- Added `LeaderInfoCard` component
- Support for leader mode workers
- Leader status monitoring
- Lease expiration tracking

### Worker Statistics (2025-10-15)

- Added `WorkerStatsPanel` component
- Real-time execution metrics
- Error rate tracking
- Network/Critical error breakdown
- Individual worker stats

### Stop All Workers (2025-10-14)

- Added `StopAllDialog` component
- Emergency stop functionality
- Batch stop with results summary
- Error handling for failed stops

### Worker Templates (2025-10-13)

- Added `CreateWorkerDialog` with template selection
- Pre-built templates:
  - Grid Trading
  - DCA Strategy
  - Market Monitor
  - Balance Monitor
  - Price Aggregator
  - Health Check
  - Log Cleanup
  - Empty Template
- Template categories (trading, monitoring, analytics, maintenance)

### Core Features (Initial Release)

- Worker list with search and filters
- Monaco-based code editor
- Configuration management
- Notes system
- Multi-tab interface
- Real-time worker updates
- Scope management (local/network)
- Execution modes (parallel/leader/exclusive)
- Priority levels (critical/high/normal/low)

---

## API Compatibility

### Current Version: v2.1.0

**Supported Endpoints:**

- `setWorker` - Create worker
- `listWorkers` - List all workers
- `updateWorker` - Update worker
- `stopAllWorkers` - Stop all workers
- `getWorkerStats` - Get statistics
- `getLeaderInfo` - Get leader info
- `migrateWorker` - Migrate worker (deprecated, use setWorker with new SID)
- `GET /api/worker/logs/stream` - Stream logs (NEW)
- `GET /api/worker/logs` - Get logs info (NEW)

**WebFIX Protocol:** 1.0

---

## Breaking Changes

### None in current release

---

## Migration Guide

### Adding Real-time Logs to Custom Components

If you want to integrate logs streaming in your own components:

```typescript
import { WorkerLogsPanel } from "@/apps/Editor/AMIEditor/WorkerLogsPanel.tsx";

function MyComponent({ workerId }: { workerId: string }) {
  return (
    <div className="h-full">
      <WorkerLogsPanel workerId={workerId} />
    </div>
  );
}
```

### Using SSE Directly

```typescript
const url = `/api/worker/logs/stream?sid=${workerId}&follow=true`;
const eventSource = new EventSource(url);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "log":
      console.log(data.content);
      break;
    case "error":
      console.error(data.message);
      break;
  }
};

// Cleanup
eventSource.close();
```

---

## Performance Considerations

### Memory Management

- Logs are stored in a circular buffer (max 10,000 lines)
- Old logs are automatically removed when limit is reached
- Download logs before clearing if needed

### Network Usage

- SSE uses single long-lived connection
- ~10-50ms latency per log entry
- Automatic reconnection on connection loss

### Recommended Practices

1. Use Pause mode when not actively monitoring
2. Clear logs periodically during long debugging sessions
3. Download logs before closing the application
4. Use Follow mode only when actively debugging

---

## Known Issues

### None in current release

---

## Roadmap

### Short-term (Next Sprint)

- [ ] Log search/filter functionality
- [ ] Log level filtering (show only errors, etc.)
- [ ] Timestamp formatting options
- [ ] Line wrapping toggle

### Medium-term (Next Month)

- [ ] Log analytics dashboard
- [ ] Pattern detection (repeated errors)
- [ ] Export logs (multiple formats: JSON, CSV)
- [ ] Log archiving

### Long-term (Future)

- [ ] Webhooks for critical errors
- [ ] Log aggregation across multiple workers
- [ ] Custom log parsers
- [ ] Log compression for archived files

---

**Maintainer:** STELS Laboratory

**Support:** support@stels.dev

**License:** Proprietary
