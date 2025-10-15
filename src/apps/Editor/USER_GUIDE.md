# AMI Editor - User Guide

Quick start guide for creating and managing worker scripts.

---

## 🚀 Quick Start

### Creating Your First Worker

```
┌─────────────────────────────────────────────────────────┐
│ 1. Click [+ AI PROTOCOL] button                         │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Choose Template                                      │
│                                                         │
│  📊 Grid Trading        💰 DCA Strategy                 │
│  Leader + Critical     Leader + High                    │
│                                                         │
│  📈 Market Monitor      💵 Balance Monitor              │
│  Parallel + Normal     Parallel + Critical              │
│                                                         │
│  🔢 Price Aggregator    🏥 Health Check                 │
│  Leader + High         Parallel + Low                   │
│                                                         │
│  🧹 Log Cleanup         📝 Empty Template               │
│  Exclusive + Low       Customizable                     │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Configure Settings                                   │
│                                                         │
│  Execution Mode: ● Parallel  ○ Leader  ○ Exclusive     │
│  Priority:       ● Critical  ○ High  ○ Normal  ○ Low   │
│  Worker Mode:    ● Loop  ○ Single                      │
│  Account ID:     g-bhts (optional)                      │
│  Description:    "My trading strategy"                  │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Review Summary                                       │
│  ✅ Mode: leader on auto-elected node                   │
│  ✅ Priority: critical (50 errors, 1ms delay)           │
│  ✅ Worker Mode: loop (engine managed)                  │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Click [Create Worker]                                │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ ✅ Worker Created!                                       │
│  - Appears in list with 🆕 badge                         │
│  - Auto-selected for editing                            │
│  - Ready to customize                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📖 Understanding Execution Modes

### 🔵 Parallel Mode

**What it does**: Worker runs on ALL nodes simultaneously

**When to use**:

- ✅ Monitoring and logging
- ✅ Data collection from all nodes
- ✅ Health checks
- ✅ Analytics

**⚠️ DO NOT use for**:

- ❌ Order placement (creates duplicates!)
- ❌ Balance updates (race conditions!)
- ❌ Any state-changing operations

**Example**: Market data collector

```
Node s-0001: ✅ Fetches BTC/USDT ticker
Node s-0002: ✅ Fetches BTC/USDT ticker  
Node s-0003: ✅ Fetches BTC/USDT ticker

Result: 3 data points (one per node) ✅
```

---

### 🟡 Leader Mode (Recommended for Trading)

**What it does**: Worker runs on ONE node (automatic election)

**When to use**:

- ✅ Trading strategies
- ✅ Grid/DCA strategies
- ✅ Order placement
- ✅ Balance management
- ✅ Portfolio rebalancing

**How it works**:

```
1. All nodes see worker
2. Atomic election → ONE node becomes leader
3. ONLY leader executes script
4. Leader renews lease every 30s
5. If leader crashes → new election (~60s)
```

**Example**: Grid trading

```
Node s-0001: ✅ Elected as leader → Places 10 orders
Node s-0002: ⏭️  Not leader → Skips
Node s-0003: ⏭️  Not leader → Skips

Result: 10 orders (correct!) ✅
```

**Leader Info Card**:

```
┌─────────────────────────────────────┐
│ 👑 Leader Election                  │
│                                     │
│ Status:       ✅ Leader Active       │
│ Leader Node:  s-0001                │
│ Elected At:   14:30:45              │
│ Last Renewed: 14:35:15              │
│ Expires In:   45s                   │
└─────────────────────────────────────┘
```

---

### 🟣 Exclusive Mode

**What it does**: Worker runs on SPECIFIC node (manual assignment)

**When to use**:

- ✅ Node-specific tasks
- ✅ Region-specific operations
- ✅ Hardware-dependent processes
- ✅ Debugging on specific node

**Configuration**:

- Set `Assigned Node: "s-0001"`
- Only that node will execute

**Example**: Daily report generator

```
Node s-0001: ✅ Generates report (assigned)
Node s-0002: ⏭️  Skips (not assigned)
Node s-0003: ⏭️  Skips (not assigned)

Result: 1 report (only from s-0001) ✅
```

---

## ⚡ Understanding Priorities

### 🔴 Critical Priority

**Characteristics**:

- ⚡ Runs first (highest priority)
- 🔄 50 errors before stop
- ⏱️ 1ms delay between iterations
- 📊 Detailed logging

**Use for**:

- Balance monitoring
- Risk management
- Stop-loss execution
- Critical alerts

---

### 🟠 High Priority

**Characteristics**:

- ⚡ Runs after critical
- 🔄 20 errors before stop
- ⏱️ 10ms delay
- 📊 Important operations

**Use for**:

- Order execution
- Position monitoring
- Price alerts
- Strategy execution

---

### 🟢 Normal Priority (Default)

**Characteristics**:

- ⚡ Standard priority
- 🔄 10 errors before stop
- ⏱️ 100ms delay
- 📊 Standard logging

**Use for**:

- Market data collection
- Analytics
- Notifications
- General monitoring

---

### 🔵 Low Priority

**Characteristics**:

- ⚡ Runs last
- 🔄 5 errors before stop
- ⏱️ 1s delay
- 📊 Minimal logging

**Use for**:

- Log cleanup
- Data archiving
- Reports
- Background tasks

---

## 🎨 Visual Guide

### Worker Card Indicators

```
┌──────────────────────────────────────────┐
│ [📄]  worker-1729000000                  │ ← Icon + SID
│  NEW   ← 🆕 Badge (3s after creation)    │
│  👑    ← Crown (leader mode)             │
│  🟢    ← Green pulse (active)            │
│       [ACTIVE] ← Status badge            │
│       [🗑️] ← Delete (on hover)           │
│                                          │
│ 📝 "Grid trading strategy for BTC"      │ ← Note
│                                          │
│ 🌐 s-0001  # v1.0  📦 worker  ⏰ 5m     │ ← Metadata
│                                          │
│ // logger.info('Grid start...           │ ← Script preview
└──────────────────────────────────────────┘
```

### Editor Panel Layout

```
┌────────────────────────────────────────────────────────┐
│ [💻] worker-1729000000    [ACTIVE] [v1.0]    [STOP]   │ ← Header
├────────────────────────────────────────────────────────┤
│ Node: s-0001 | Channel: ami.worker.xxx | Modified...  │ ← Metadata
├────────────────────────────────────────────────────────┤
│ 📝 NOTES                             [Reset] [Save]   │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Grid trading strategy for BTC/USDT                 │ │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ ⚡ UNSAVED CHANGES (SCRIPT)      [Revert] [Save All]  │ ← Warning
├────────────────────────────────────────────────────────┤
│ 👑 Leader Election                                     │ ← Leader Info
│ Status:       ✅ Leader Active                          │
│ Leader Node:  s-0001                                   │
│ Expires In:   45s                                      │
├────────────────────────────────────────────────────────┤
│ ╔════════════════════════════════════════════════════╗ │
│ ║  1 │ const exchange = new Stels.runtime.cex...    ║ │ ← Monaco
│ ║  2 │ const symbol = 'BTC/USDT';                   ║ │   Editor
│ ║  3 │ logger.info('Grid start');                   ║ │
│ ║    │                                               ║ │
│ ╚════════════════════════════════════════════════════╝ │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Worker Statistics Panel

```
┌──────────────────────────────────────────────────────┐
│ 📊 Worker Statistics        [🔄] [Refresh]   [✕]    │
├──────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌───────────┐ ┌────────┐ ┌───────────┐│
│ │ RUNNING  │ │EXECUTIONS │ │ ERRORS │ │ERROR RATE ││
│ │   3/10   │ │  15,234   │ │   12   │ │   0.08%  ││
│ │    ▶     │ │    📈     │ │   ✕    │ │    ⚠️    ││
│ └──────────┘ └───────────┘ └────────┘ └───────────┘│
├──────────────────────────────────────────────────────┤
│ Error Breakdown:                                     │
│ ┌─────────────────┐ ┌──────────────────┐            │
│ │ ⚠️  Network: 10  │ │ ✕ Critical: 2    │            │
│ └─────────────────┘ └──────────────────┘            │
├──────────────────────────────────────────────────────┤
│ Individual Workers:                                  │
│ ┌────────────────────────────────────────────────┐  │
│ │ 🟢 grid-btc-001                    [Running]   │  │
│ │ Exec: 1,234  Err: 5  Rate: 0.4%               │  │
│ │ ████████████░░░░░░░░░░ 0.4%                   │  │
│ └────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────┐  │
│ │ ⚪ dca-eth-002                      [Stopped]   │  │
│ │ Exec: 234  Err: 2  Rate: 0.9%                 │  │
│ │ ████████░░░░░░░░░░░░ 0.9%                     │  │
│ └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 Common Workflows

### Workflow 1: Create Grid Trading Bot

```
Goal: Place grid orders on BTC/USDT

1. Click [+ AI PROTOCOL]
2. Select "📊 Grid Trading" template
3. Click [Next]
4. Configuration auto-filled:
   ✅ Execution Mode: leader (one node only)
   ✅ Priority: critical (high tolerance)
   ✅ Worker Mode: loop (engine managed)
5. Set Account ID: "g-bhts"
6. Click [Create Worker]
7. Worker appears with 🆕 badge
8. Edit script:
   - Replace API_KEY
   - Replace SECRET
   - Adjust GRID_LEVELS if needed
9. Click [Save All]
10. Click [START]
11. Check Leader Info Card:
    - Leader elected
    - Shows which node is executing
12. Grid orders placed ✅
```

---

### Workflow 2: Monitor Market Data

```
Goal: Collect ticker data on all nodes

1. Click [+ AI PROTOCOL]
2. Select "📈 Market Monitor" template
3. Click [Next]
4. Configuration:
   ✅ Execution Mode: parallel (all nodes)
   ✅ Priority: normal
5. Optional: Add more symbols in script
6. Click [Create Worker]
7. Click [START]
8. All nodes collect data in parallel ✅
```

---

### Workflow 3: Check Worker Health

```
Goal: See how workers are performing

1. Click [STATS] button in header
2. Stats panel opens:
   - Running: 3 / 10
   - Executions: 15,234
   - Errors: 12 (0.08%)
3. Review error breakdown:
   - Network: 10 (retry-able)
   - Critical: 2 (need attention)
4. Check individual workers:
   - Green = running well
   - Orange = some errors
   - Red = high error rate
5. Toggle auto-refresh for live monitoring
```

---

### Workflow 4: Manage Leader Election

```
Goal: Monitor which node executes trading strategy

1. Select worker with 👑 crown badge
2. Leader Info Card appears:
   ┌──────────────────────────┐
   │ 👑 Leader Election       │
   │ Status: ✅ Leader Active │
   │ Leader: s-0001           │
   │ Expires: 45s             │
   └──────────────────────────┘
3. Watch countdown
4. If expires → new election
5. Auto-refresh shows updates
```

---

### Workflow 5: Delete Old Worker

```
Goal: Clean up unused workers

1. Find worker in list
2. Hover over worker card
3. 🗑️ Delete button appears
4. Click delete button
5. Confirmation dialog:
   ┌─────────────────────────┐
   │ 🗑️  Delete Worker       │
   │ Are you sure?           │
   │ Worker ID: xxx          │
   │ [Cancel] [Delete]       │
   └─────────────────────────┘
6. Click [Delete Worker]
7. Worker removed ✅
```

---

## 💡 Tips & Tricks

### Tip 1: Start with Templates

Don't write from scratch! Use templates:

- Faster development
- Best practices included
- Correct execution mode pre-configured

### Tip 2: Test with Parallel First

Before deploying trading strategy:

1. Create as **parallel** mode
2. Check logs on all nodes
3. Verify logic works
4. Then change to **leader** mode

### Tip 3: Monitor Leader Election

For leader workers:

- Keep Leader Info Card visible
- Watch which node is executing
- Monitor lease expiration
- Understand failover behavior

### Tip 4: Use Stats for Debugging

High error rate?

1. Click [STATS]
2. Check which worker has errors
3. Review error type (network vs critical)
4. Fix script or adjust priority

### Tip 5: Always Check Existing Orders

For trading workers, ALWAYS check existing state:

```javascript
// Before creating orders
const orders = await exchange.fetchOpenOrders(symbol);
if (orders.length === 0) {
  // Safe to create new orders
} else {
  logger.warn("Orders already exist, skipping");
  return;
}
```

This prevents duplicates during failover!

---

## ⚠️ Common Mistakes

### Mistake 1: Wrong Execution Mode

```
❌ Trading strategy with executionMode: "parallel"
→ All nodes place orders → DUPLICATES!

✅ Trading strategy with executionMode: "leader"  
→ One node places orders → CORRECT!
```

### Mistake 2: Not Checking Existing State

```
❌ await exchange.createOrder(...)
→ Failover creates duplicate orders

✅ const orders = await exchange.fetchOpenOrders(...)
   if (orders.length === 0) {
     await exchange.createOrder(...)
   }
→ Failover is safe
```

### Mistake 3: Using console.log

```
❌ console.log('Price:', price)
→ Not available in worker context

✅ logger.info('Price:', price)
→ Worker-specific logging
```

### Mistake 4: Forgetting API Keys

```
❌ const exchange = new Stels.runtime.cex.bybit({})
→ Authentication error

✅ const exchange = new Stels.runtime.cex.bybit({
     apiKey: 'YOUR_ACTUAL_KEY',
     secret: 'YOUR_ACTUAL_SECRET'
   })
→ Properly authenticated
```

---

## 🎓 Learning Path

### Beginner

1. **Start with "Empty Template"**
   - Simple script structure
   - Practice with parallel mode
   - Use logger.info() for debugging

2. **Try "Market Monitor"**
   - Learn Stels.runtime.cex API
   - Understand CCXT exchange interface
   - Practice Stels.webfix() for KV storage

3. **Experiment with "Health Check"**
   - Learn node information APIs
   - Practice with Deno APIs
   - Understand distributed data storage

### Intermediate

4. **Create "Balance Monitor"**
   - Work with exchange APIs
   - Handle account balances
   - Use critical priority

5. **Build "Price Aggregator"**
   - Learn leader mode
   - Practice multi-node coordination
   - Understand distributed KV reads

6. **Deploy "DCA Strategy"**
   - Learn single mode (self-managed loop)
   - Practice long-running workers
   - Implement buy logic

### Advanced

7. **Create "Grid Trading"**
   - Master leader mode
   - Implement idempotency checks
   - Handle order management
   - Practice error handling

8. **Customize Templates**
   - Modify existing templates
   - Create custom strategies
   - Optimize performance
   - Implement advanced features

---

## 📱 Keyboard Shortcuts

**In Monaco Editor**:

- `Cmd/Ctrl + S` - Save (triggers auto-save)
- `Cmd/Ctrl + Enter` - Run/Execute
- `Cmd/Ctrl + F` - Find
- `Cmd/Ctrl + H` - Replace
- `Cmd/Ctrl + /` - Toggle comment

**In Worker List**:

- `↑` / `↓` - Navigate workers
- `Enter` - Select worker
- `Delete` - Delete selected worker

---

## 🔍 Troubleshooting

### "Worker not starting"

**Check**:

1. Is worker `ACTIVE`? (green badge)
2. Check backend logs for errors
3. For leader mode: Click [STATS] → check if running
4. Verify API keys are correct

### "Duplicate orders created"

**Problem**: Using parallel mode for trading

**Solution**:

1. Stop worker immediately
2. Cancel duplicate orders
3. Change executionMode to "leader"
4. Restart worker

### "Leader keeps changing"

**Problem**: Network instability

**What happens**:

- Leader loses connection
- Lease expires
- New leader elected
- Can cause temporary disruption

**Solution**: Normal behavior, but check:

- Network quality
- Node stability
- Lease TTL configuration

### "High error rate"

**Check Stats Panel**:

1. Click [STATS]
2. Find worker with high error rate
3. Check error type:
   - Network errors → Temporary, will retry
   - Critical errors → Script bug, needs fix
4. Review script logic
5. Fix and save

---

## 🎉 Success Indicators

### Worker is Working Well

✅ Status: **ACTIVE** (green badge)\
✅ Leader: **s-0001** (stable, not changing)\
✅ Executions: **1,000+** (increasing)\
✅ Error Rate: **< 5%** (green progress bar)\
✅ Expires In: **> 30s** (healthy lease)

### Worker Needs Attention

⚠️ Status: **INACTIVE** (red badge)\
⚠️ Error Rate: **> 15%** (red progress bar)\
⚠️ Critical Errors: **> 0** (review script)\
⚠️ Leader: **changing frequently** (network issues)\
⚠️ Expires In: **< 15s** (lease about to expire)

---

## 📞 Getting Help

### Self-Service

1. Check this guide
2. Review template scripts
3. Click [STATS] to diagnose
4. Check Leader Info Card
5. Review backend logs

### Documentation

- 📖 [Module README](./README.md)
- 📝 [Changelog](./CHANGELOG.md)
- 🔧 [Development Guide](../../../iscructions/WORKER_DEVELOPMENT_GUIDE.md)
- 👑 [Leader Election](../../../iscructions/WORKER_LEADER_ELECTION.md)

### Common Questions

**Q: Should I use parallel or leader for my trading bot?**\
A: ALWAYS use **leader** mode for trading to prevent duplicate orders.

**Q: What priority should I use?**\
A:

- Balance/risk → critical
- Order execution → high
- Market data → normal
- Cleanup → low

**Q: How do I know if my worker is running?**\
A: Look for:

- 🟢 Green pulse on worker card
- [ACTIVE] badge
- Leader Info Card shows leader node
- Stats show executions increasing

**Q: What if leader node crashes?**\
A: Automatic failover:

- Lease expires after 60s
- New leader elected
- Worker continues (~60s downtime)

**Q: Can I run same worker on specific nodes?**\
A: Yes! Use **exclusive** mode and set assigned node.

---

**Happy Worker Development! 🚀**

Need help? Check the full [README.md](./README.md) or contact STELS support.
