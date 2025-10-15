# AMI Editor - Worker Development Platform

Professional IDE for creating and managing distributed worker scripts in the
Heterogen Runtime.

---

## 🎯 Overview

The AMI Editor provides a complete development environment for:

- **Creating** worker scripts with templates
- **Editing** JavaScript code with Monaco Editor
- **Managing** worker lifecycle (start/stop/delete)
- **Monitoring** leader election status
- **Tracking** execution statistics and errors

---

## 🏗️ Architecture

```
Editor/
├── AMIEditor.tsx                    # Main component (split-panel UI)
├── store.ts                         # Zustand store with API integration
└── AMIEditor/
    ├── constants.ts                 # Worker configurations
    ├── types.ts                     # TypeScript definitions
    ├── utils.ts                     # Helper functions
    ├── templates.ts                 # Pre-built worker scripts ⭐
    ├── CreateWorkerDialog.tsx       # Worker creation form ⭐
    ├── LeaderInfoCard.tsx          # Leader election display ⭐
    ├── WorkerStatsPanel.tsx        # Execution metrics ⭐
    └── index.ts                     # Barrel exports
```

---

## ✨ Features

### 1. **Worker Templates** 📝

Pre-built scripts for common use cases:

```typescript
import { WORKER_TEMPLATES } from "./AMIEditor/templates";

const templates = {
  "grid-trading": "Grid trading strategy (leader, critical)",
  "dca-strategy": "Dollar cost averaging (leader, high, single)",
  "market-monitor": "Market data collection (parallel, normal)",
  "balance-monitor": "Account balance tracking (parallel, critical)",
  "price-aggregator": "Multi-node price aggregation (leader, high)",
  "health-check": "Node health monitoring (parallel, low)",
  "log-cleanup": "Log maintenance (exclusive, low)",
  "empty": "Blank template",
};
```

### 2. **Execution Modes** 🔄

**Parallel Mode** (All nodes):

- ✅ Monitoring and logging
- ✅ Data collection from all nodes
- ❌ NOT for order placement (duplicates!)

**Leader Mode** (One node via consensus):

- ✅ Trading strategies
- ✅ Order placement
- ✅ Balance updates
- ✅ Automatic failover (~60s downtime)

**Exclusive Mode** (Specific node):

- ✅ Node-specific tasks
- ✅ Region-specific operations
- ✅ Debugging and testing

### 3. **Priority Levels** ⚡

| Priority     | Error Tolerance | Delay | Use Case                 |
| ------------ | --------------- | ----- | ------------------------ |
| **Critical** | 50 errors       | 1ms   | Balance, risk management |
| **High**     | 20 errors       | 10ms  | Order execution          |
| **Normal**   | 10 errors       | 100ms | Market data              |
| **Low**      | 5 errors        | 1s    | Cleanup, logging         |

### 4. **Leader Election** 👑

For `executionMode: "leader"` workers:

```
1. All nodes see worker in distributed KV
2. Each node attempts atomic CAS:
   atomic.check(null).set({ leader: "node-id" })
3. ONLY ONE succeeds (atomic guarantee)
4. Leader executes script
5. Lease renewed every 30s (expires in 60s)
6. If leader crashes → auto-failover to new leader
```

**Leader Info Card** shows:

- Current leader node
- Election timestamp
- Lease expiration time
- Auto-refresh every 10s

### 5. **Worker Statistics** 📊

**Metrics tracked**:

- Total executions
- Error count and error rate
- Network errors vs critical errors
- Running status
- Last execution timestamp

**Stats Panel** displays:

- Overall statistics (all workers)
- Individual worker metrics
- Error breakdown
- Auto-refresh capability

---

## 🚀 Usage

### Create New Worker

1. Click **[+ AI PROTOCOL]** button
2. Select template (or start from scratch)
3. Configure execution settings:
   - Execution Mode (parallel/leader/exclusive)
   - Priority (critical/high/normal/low)
   - Worker Mode (loop/single)
   - Dependencies version
   - Account ID (optional)
   - Assigned Node (for exclusive mode)
4. Review configuration summary
5. Click **Create Worker**

### Edit Worker

1. Select worker from list (left panel)
2. Edit script in Monaco Editor
3. Modify notes in textarea
4. Click **[Save All]** when done
5. Changes synchronized to backend

### Start/Stop Worker

1. Select worker
2. Click **[START]** or **[STOP]** button
3. Status updates across all nodes
4. Active indicator shows running state

### Delete Worker

1. Hover over worker card
2. Click 🗑️ trash icon
3. Confirm deletion in dialog
4. Worker removed from all nodes

### View Statistics

1. Click **[STATS]** button in header
2. View overall execution metrics
3. See per-worker statistics
4. Toggle auto-refresh (15s interval)

### Monitor Leader Election

For workers with `executionMode: "leader"`:

1. Select worker
2. Leader Info Card appears below header
3. Shows:
   - Current leader node
   - Lease expiration countdown
   - Last renewal time
4. Auto-refreshes every 10s

---

## 🎨 UI Components

### Left Panel - Workers Registry

**Header**:

- 🗄️ PROTOCOL REGISTRY title
- [STATS] button - View execution metrics
- [+ AI PROTOCOL] button - Create new worker

**Search & Filters**:

- Search by SID, NID, note, version
- Filter: All / Active Only / Inactive Only
- Results counter

**Worker Cards**:

- Icon with status indicators:
  - Green pulse dot = Active
  - 👑 Crown badge = Leader mode
  - NEW badge = Recently created
- SID (strategy ID)
- Status badge (ACTIVE/INACTIVE)
- Note preview
- Metadata grid (NID, Version, Channel, Time)
- Script preview (1 line)
- 🗑️ Delete button (on hover)

**Footer**:

- Worker count statistics
- Active/Inactive counts

### Right Panel - Code Editor

**When worker selected**:

**Header**:

- Terminal icon with active pulse
- SID (large, bold)
- Status and version badges
- [STOP/START] toggle button

**Metadata Grid**:

- Node ID
- Channel
- Last modified
- Script size (characters)

**Notes Section**:

- Editable textarea
- [Reset] / [Save] buttons

**Leader Info Card** (for leader mode):

- Leader election status
- Current leader node
- Lease expiration countdown
- Last renewal timestamp
- Auto-refresh toggle

**Unsaved Changes Warning**:

- Appears when script or notes modified
- Shows what changed (SCRIPT / NOTES / BOTH)
- [Revert] and [Save All] buttons

**Monaco Editor**:

- Full JavaScript/TypeScript support
- Syntax highlighting
- Molokai theme (dark/light)
- Stels SDK autocomplete
- Line numbers and minimap

---

## 📡 API Integration

### Endpoints

All requests use WebFix protocol:

```typescript
POST {api}
Headers:
  Content-Type: application/json
  stels-session: {sessionId}

Body: {
  webfix: "1.0",
  method: string,
  params: [],
  body: object
}
```

**Methods**:

1. **listWorkers** - Get all workers
   ```typescript
   method: "listWorkers";
   body: {}
   ```

2. **setWorker** - Create worker
   ```typescript
   method: "setWorker"
   body: {
     scriptContent: string
     dependencies: string[]
     version: string
     executionMode: "parallel" | "leader" | "exclusive"
     priority: "critical" | "high" | "normal" | "low"
     mode?: "loop" | "single"
     accountId?: string
     assignedNode?: string
     note?: string
   }
   ```

3. **updateWorker** - Update worker
   ```typescript
   method: "updateWorker"
   body: {
     channel: string  // "ami.worker.{sid}"
     raw: {
       active?: boolean
       script?: string
       note?: string
       // ... other fields
     }
   }
   ```

4. **deleteWorker** - Delete worker
   ```typescript
   method: "deleteWorker";
   body: {
     sid: string;
   }
   ```

5. **getLeaderInfo** - Get leader election status
   ```typescript
   method: "getLeaderInfo";
   body: {
     workerId: string;
   }
   ```

6. **getWorkerStats** - Get execution statistics
   ```typescript
   method: "getWorkerStats";
   body: {}
   ```

---

## 🔐 Security

### Authorization

- All worker operations require **authenticated session**
- Session token from `auth-store` localStorage
- Only **OWNERS** can create/modify/delete workers

### Script Validation

- Syntax check before creation
- Size limit (< 64KB for distributed KV)
- No access to file system (except Deno APIs)
- Sandboxed execution environment

### Available in Worker Context

```javascript
✅ Stels.config          // Node configuration
✅ Stels.net             // Distributed KV
✅ Stels.local           // Local KV
✅ Stels.runtime.cex     // CCXT Pro (exchanges)
✅ Stels.blockchain      // Gliesereum
✅ Stels.wallet          // Node wallet
✅ Stels.webfix()        // KV operations
✅ Stels.sleep()         // Sleep function
✅ logger                // Worker-specific logger

❌ File system (restricted)
❌ Network (except CCXT)
❌ Environment variables
```

---

## 🎯 Best Practices

### 1. Choose Correct Execution Mode

```
Trading Strategy (orders, balance)?
  → executionMode: "leader" ✅

Monitoring/Logging?
  → executionMode: "parallel" ✅

Node-specific task?
  → executionMode: "exclusive" ✅
```

### 2. Idempotency for Leader Workers

```javascript
// ❌ BAD: Creates duplicate orders on failover
await exchange.createOrder(...);

// ✅ GOOD: Checks existing state first
const orders = await exchange.fetchOpenOrders(symbol);
if (orders.length === 0) {
  await exchange.createOrder(...);
}
```

### 3. Error Handling

```javascript
try {
  await exchange.createOrder(...);
  logger.info('Order success');
} catch (error) {
  logger.error('Order failed:', error);
  
  if (error.name === 'InsufficientFunds') {
    return; // Don't retry
  }
  
  throw error; // Let engine handle
}
```

### 4. Use Appropriate Priority

- **Critical**: Balance checks, stop-loss, risk management
- **High**: Order execution, position monitoring
- **Normal**: Market data, analytics
- **Low**: Cleanup, archiving, reports

---

## 🐛 Troubleshooting

### Worker executes on all nodes (duplicates)

**Problem**: `executionMode: "parallel"` for trading script

**Solution**: Change to `executionMode: "leader"`

### Worker doesn't start on any node

**Check**:

1. Is `active: true`?
2. Check backend logs for errors
3. For leader mode: check `getLeaderInfo`
4. Wait 60s for lease TTL if stuck

### Leader changes frequently

**Problem**: Network instability

**Solution**: Increase `LEASE_DURATION_MS` in backend config

### Script validation errors

**Common issues**:

- Missing `logger` prefix for console operations
- Trying to use `console.log` (use `logger.info` instead)
- Incorrect Stels API usage
- Missing semicolons or syntax errors

---

## 📊 Monitoring

### View Worker Stats

1. Click [STATS] button in header
2. See overall metrics:
   - Total running workers
   - Total executions
   - Error count and rate
   - Error breakdown (network vs critical)
3. Individual worker metrics
4. Toggle auto-refresh

### Monitor Leader Election

1. Select worker with `executionMode: "leader"`
2. Leader Info Card shows:
   - Current leader node
   - Elected at timestamp
   - Last renewal time
   - Expires in (countdown)
   - Expired warning (if applicable)
3. Auto-refreshes every 10s

---

## 🎨 Visual Indicators

### Worker Card Indicators

**Status**:

- 🟢 Green pulse = Active worker
- 👑 Crown badge = Leader mode
- 🆕 NEW badge = Recently created (3s)

**Selection**:

- 🟡 Amber border = Selected
- 🟡 Amber background
- 🟡 Amber text

**Hover**:

- 🗑️ Delete button appears

### Editor Panel Indicators

**Unsaved Changes**:

- ⚡ Amber banner with icon
- Shows what changed (SCRIPT/NOTES/BOTH)
- [Revert] and [Save All] buttons

**Leader Mode**:

- 👑 Leader Info Card below header
- Green border if has leader
- Orange border if no leader
- Red border if lease expired

---

## 🔄 Data Flow

```
User clicks [+ AI PROTOCOL]
        ↓
CreateWorkerDialog opens
        ↓
User selects template
        ↓
Configures execution settings
        ↓
createWorker() → POST to backend
        ↓
Worker created in distributed KV
        ↓
All nodes see new worker
        ↓
Worker added to UI list
        ↓
Auto-selected for editing
        ↓
User activates worker
        ↓
Leader election (if leader mode)
        ↓
Worker starts executing
```

---

## 💻 Code Examples

### Create Grid Trading Worker

```typescript
const request: WorkerCreateRequest = {
  scriptContent: `/* grid trading logic */`,
  dependencies: ["gliesereum"],
  version: "1.19.2",
  executionMode: "leader",
  priority: "critical",
  accountId: "g-bhts",
  note: "BTC/USDT grid with 10 levels",
};

await createWorker(request);
```

### Update Worker Status

```typescript
const updatedWorker: Worker = {
  ...selectedWorker,
  value: {
    ...selectedWorker.value,
    raw: {
      ...selectedWorker.value.raw,
      active: true, // Start worker
    },
  },
};

await updateWorker(updatedWorker);
```

### Check Leader Election

```typescript
const leaderInfo = await getLeaderInfo(workerId);

console.log({
  hasLeader: leaderInfo.hasLeader,
  leader: leaderInfo.leader, // "s-0001"
  expiresIn: leaderInfo.expiresIn, // 45000 (45s)
});
```

### Get Worker Statistics

```typescript
const stats = await getWorkerStats();

stats.forEach((stat) => {
  console.log(`Worker ${stat.sid}:`);
  console.log(`  Executions: ${stat.executions}`);
  console.log(`  Error Rate: ${stat.errorRate}%`);
  console.log(`  Running: ${stat.isRunning}`);
});
```

---

## 🎨 UI/UX Design

### Color Coding

**Execution Modes**:

- 🔵 Parallel = Blue
- 🟡 Leader = Amber
- 🟣 Exclusive = Purple

**Priorities**:

- 🔴 Critical = Red
- 🟠 High = Orange
- 🟢 Normal = Green
- 🔵 Low = Blue

**Status**:

- 🟢 Active = Green
- 🔴 Inactive = Red
- 🟡 Selected = Amber
- 🟢 Newly Created = Green (pulse)

### Professional Touches

- ✅ Corner accents on cards
- ✅ Smooth transitions and animations
- ✅ Loading states with spinners
- ✅ Error handling with user feedback
- ✅ Confirmation dialogs for destructive actions
- ✅ Auto-refresh toggles for live data
- ✅ Hover effects and tooltips
- ✅ Monaco Editor integration
- ✅ Split-panel resizable layout

---

## 🔍 Worker Script Context

### Available APIs

```javascript
// Node Information
Stels.config.nid; // "s-0001"
Stels.config.network; // "localnet" | "testnet" | "mainnet"

// Distributed KV
Stels.net.get(key);
Stels.net.set(key, value);
Stels.net.delete(key);
Stels.net.list({ prefix });

// Local KV
Stels.local.get(key);
Stels.local.set(key, value);

// CCXT Pro
new Stels.runtime.cex.binance({ apiKey, secret });
new Stels.runtime.cex.bybit({ apiKey, secret });
// ... other exchanges

// Utilities
Stels.sleep(ms);
Stels.webfix({ brain, method, channel, module, raw, timestamp });

// Logging
logger.info(message, ...args);
logger.error(message, ...args);
logger.warn(message, ...args);
logger.debug(message, ...args);
```

---

## 📝 TypeScript Types

```typescript
interface Worker {
  key: string[];
  value: {
    raw: {
      sid: string; // Worker ID
      nid: string; // Node ID
      active: boolean; // Running status
      script: string; // JavaScript code
      note: string; // Description
      version: string; // Dependencies version
      dependencies: string[]; // Package names
      timestamp: number; // Last modified

      // Extended fields (backend)
      executionMode?: "parallel" | "leader" | "exclusive";
      priority?: "critical" | "high" | "normal" | "low";
      mode?: "loop" | "single";
      accountId?: string;
      assignedNode?: string;
    };
    channel: string; // "ami.worker.{sid}"
  };
}

interface LeaderInfo {
  workerId: string;
  hasLeader: boolean;
  leader: string | null; // Node ID of leader
  timestamp: number; // Election time
  expiresAt: number; // Lease expiration
  renewedAt: number; // Last renewal
  expiresIn: number; // Milliseconds until expiry
  isExpired: boolean; // Lease expired flag
}

interface WorkerStats {
  sid: string;
  executions: number;
  errors: number;
  errorRate: number; // Percentage
  networkErrors: number;
  criticalErrors: number;
  isRunning: boolean;
  lastExecution?: number;
}
```

---

## 🎯 Common Use Cases

### Grid Trading Strategy

```typescript
// Template: "grid-trading"
// Mode: leader + critical
// Places grid orders only once (no duplicates)
// Automatic failover if node crashes
```

### DCA (Dollar Cost Averaging)

```typescript
// Template: "dca-strategy"
// Mode: leader + high + single
// Buys hourly, manages own loop
// Failover-safe with existing order checks
```

### Market Data Collector

```typescript
// Template: "market-monitor"
// Mode: parallel + normal
// All nodes collect data
// Distributed workload
```

### Balance Monitor

```typescript
// Template: "balance-monitor"
// Mode: parallel + critical
// Each node monitors its accounts
// High priority for balance safety
```

---

## 🚨 Important Notes

### ⚠️ Trading Strategies

**ALWAYS use `executionMode: "leader"`** for:

- Order placement
- Grid strategies
- DCA strategies
- Balance updates
- Portfolio rebalancing

**Why?** Parallel mode will execute on ALL nodes → duplicate orders!

### ⚠️ Idempotency

Leader workers should check existing state:

```javascript
// Always check before creating orders
const existingOrders = await exchange.fetchOpenOrders(symbol);
if (existingOrders.length === 0) {
  // Safe to create
}
```

### ⚠️ Error Handling

Different error types have different retry strategies:

- **Network errors**: Exponential backoff, max 20 retries
- **Critical errors** (syntax, logic): Limited retries, then stop
- **Insufficient funds**: Don't retry, log and skip

---

## 📚 Related Documentation

- [Worker Development Guide](../../../../iscructions/WORKER_DEVELOPMENT_GUIDE.md)
- [Leader Election Guide](../../../../iscructions/WORKER_LEADER_ELECTION.md)
- [Quick Reference](../../../../iscructions/WORKER_QUICK_REFERENCE.md)
- [Worker Cheatsheet](../../../../iscructions/WORKER_CHEATSHEET.txt)

---

**Version**: 2.0.0\
**Last Updated**: October 2024\
**Status**: Production Ready ✅
