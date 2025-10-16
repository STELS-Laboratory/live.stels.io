# Worker Editor - Quick Guide

## 🎯 Overview

Modern professional worker editor with tab-based interface. Everything fits in
one screen - no scrolling needed!

---

## 🚀 Quick Start

### Creating a Worker

1. Click **[+ AI PROTOCOL]** in header
2. Choose template or start from scratch
3. Configure settings (execution mode, priority, etc.)
4. Click **[Create Worker]**
5. Worker appears with 🆕 badge

### Editing a Worker

1. Select worker from left panel
2. Switch between tabs:
   - **Code** - Edit JavaScript with Monaco Editor
   - **Config** - Change execution settings
   - **Notes** - Add descriptions
   - **Leader** - View election status (leader workers only)
3. Make changes
4. Click **[Save All]** when done

### Starting/Stopping

**Individual Worker:**

- Click **[START]** or **[STOP]** in header

**All Workers:**

- Click **[STOP ALL]** in header
- Confirm action
- See result summary

### Deleting a Worker

1. Hover over worker card
2. Click 🗑️ trash icon
3. Confirm deletion

---

## 🎨 Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Left Panel (30%)         │ Right Panel (70%)                    │
│                          │                                       │
│ ┌─────────────────────┐  │ ┌──────────────────────────────────┐ │
│ │ PROTOCOL REGISTRY   │  │ │ Worker: abc-123         [STOP]  │ │
│ │ [STATS][STOP ALL][+]│  │ │ ON v1.19.2 👑  s-0001  5m  1.2KB│ │
│ ├─────────────────────┤  │ ├──────────────────────────────────┤ │
│ │ [Search...]     X/Y │  │ │[Code][Config][Notes][Leader]     │ │
│ │ [Filter: All ▼]     │  │ │                 [Revert][Save All]│ │
│ ├─────────────────────┤  │ ├──────────────────────────────────┤ │
│ │                     │  │ │                                  │ │
│ │ ┌─────────────────┐ │  │ │                                  │ │
│ │ │ 📄 worker-1     │ │  │ │                                  │ │
│ │ │ 🟢 NEW [ACTIVE] │ │  │ │      Tab Content                 │ │
│ │ │ ━━━━━━━━━━━━━━ │ │  │ │      (Full height)               │ │
│ │ │ s-0001  #v1.0   │ │  │ │                                  │ │
│ │ │ // code...      │ │  │ │                                  │ │
│ │ └─────────────────┘ │  │ │                                  │ │
│ │                     │  │ │                                  │ │
│ │ ┌─────────────────┐ │  │ │                                  │ │
│ │ │ 📄 worker-2     │ │  │ │                                  │ │
│ │ │ [INACTIVE] 🗑️   │ │  │ │                                  │ │
│ │ └─────────────────┘ │  │ └──────────────────────────────────┘ │
│ └─────────────────────┘  │                                       │
│                          │                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Tab Reference

### 🔹 Code Tab

**Features:**

- Full-screen Monaco Editor
- Syntax highlighting
- Auto-completion
- Line numbers
- Minimap

**Shortcuts:**

- `Cmd/Ctrl + S` - Auto-save
- `Cmd/Ctrl + F` - Find
- `Cmd/Ctrl + /` - Comment

**Tips:**

- Use `logger.info()` instead of `console.log()`
- Available globals: `Stels`, `logger`, `Deno`

### ⚙️ Config Tab

**Fields:**

**Execution Mode:**

- `parallel` - Runs on all nodes (monitoring, logging)
- `leader` - Runs on one node only (trading, orders)
- `exclusive` - Runs on specific node (assigned)

**Priority:**

- `critical` - 50 errors tolerance, 1ms delay
- `high` - 20 errors, 10ms delay
- `normal` - 10 errors, 100ms delay
- `low` - 5 errors, 1s delay

**Worker Mode:**

- `loop` - Engine repeats execution
- `single` - Self-managed loop

**Other:**

- Version (e.g., "1.19.2")
- Node ID (e.g., "s-0001")
- Dependencies (comma-separated)
- Account ID (optional)
- Assigned Node (for exclusive mode)

### 📝 Notes Tab

- Large text area for descriptions
- Supports multi-line text
- Auto-saves with [Save All]

### 👑 Leader Tab

**Only for workers with `executionMode: "leader"`**

Shows:

- ✅ Leader status (active/no leader)
- Current leader node ID
- Election timestamp
- Last renewal time
- ⏰ Expires in (countdown)
- ⚠️ Expired warning

Auto-refreshes every 10 seconds

---

## 🎛️ Header Controls

### Left Panel Header

**[STATS]** - Opens statistics panel with:

- Total executions
- Error rates
- Per-worker metrics
- Network vs critical errors

**[STOP ALL]** - Emergency stop button:

- Stops all active workers
- Shows confirmation dialog
- Displays result summary
- Disabled when no active workers

**[+ AI PROTOCOL]** - Create new worker:

- Opens template selection dialog
- 8 pre-built templates
- Configuration wizard

### Right Panel Header

**Worker Info:**

- 📄 Icon with active pulse
- SID (Strategy ID)
- ON/OFF badge
- Version badge
- 👑 Crown (leader mode)
- Mini metadata (node, time, size)

**[START/STOP]** - Toggle worker:

- Green = Start worker
- Red = Stop worker
- Loading state during update

---

## 🔍 Worker List Features

### Search

- Search by SID, NID, note, version
- Real-time filtering
- Clear button (X)

### Filter

- **All Workers** - Show everything
- **Active Only** - Running workers
- **Inactive Only** - Stopped workers

### Counter

Shows: `X/Y` (filtered/total)

### Worker Card Info

**Header:**

- 📄 Icon
- 🟢 Active pulse (if running)
- 👑 Crown badge (if leader mode)
- 🆕 NEW badge (3 seconds after creation)
- SID
- [ACTIVE] / [INACTIVE] status
- 🗑️ Delete button (hover)

**Note:**

- Blue box with description (if exists)

**Metadata:**

- 🌐 Node ID
- # Version
- 📦 Channel
- ⏰ Time ago

**Script Preview:**

- First line of code

---

## 💡 Tips & Tricks

### 1. Keyboard Navigation

- `↑/↓` - Navigate worker list
- `Enter` - Select worker
- Tab through config fields

### 2. Quick Actions

- **Double-click worker** - Jump to Code tab
- **Hover delete** - Quick removal
- **Esc** - Close dialogs

### 3. Save Workflow

1. Make changes in any tab
2. Notice unsaved indicator
3. Switch tabs freely (changes preserved)
4. Click **[Save All]** once when done
5. Or click **[Revert]** to undo

### 4. Leader Workers

- Always use `leader` mode for trading
- Check **Leader Tab** for status
- Monitor lease expiration
- Automatic failover (~60s)

### 5. Configuration Best Practices

**Trading/Orders:**

```
executionMode: leader
priority: critical or high
```

**Monitoring/Logging:**

```
executionMode: parallel
priority: normal or low
```

**Node-specific:**

```
executionMode: exclusive
assignedNode: "s-0001"
```

---

## ⚠️ Common Mistakes

### ❌ Wrong execution mode for trading

```javascript
// BAD: Creates duplicate orders!
executionMode: "parallel"; // DON'T use for trading
```

```javascript
// GOOD: One leader places orders
executionMode: "leader"; // ✅ Correct
```

### ❌ Forgetting to save

- Changes are tracked per tab
- **Must click [Save All]** to persist
- Revert button discards all changes

### ❌ Using console.log

```javascript
// BAD: Won't work
console.log("message");
```

```javascript
// GOOD: Use logger
logger.info("message");
```

---

## 🆘 Troubleshooting

### Worker not starting

1. Check if **[ACTIVE]** badge is green
2. Verify script has no syntax errors
3. Check **[STATS]** for error details
4. For leader mode: check **Leader Tab**

### Can't see changes

- Did you click **[Save All]**?
- Check for errors in console
- Refresh browser if needed

### High error rate

1. Click **[STATS]**
2. Check error type (network vs critical)
3. Fix script if critical errors
4. Network errors retry automatically

### Leader keeps changing

- Check network stability
- Review **Leader Tab** for lease info
- Normal behavior during failover

---

## 📊 Statistics Panel

Access via **[STATS]** button

**Overall:**

- ▶️ Running: X/Y workers
- 📈 Executions: Total count
- ❌ Errors: Error count
- ⚠️ Error Rate: Percentage

**Error Breakdown:**

- 🟠 Network errors (temporary)
- 🔴 Critical errors (code bugs)

**Per-Worker:**

- Status (running/stopped)
- Execution count
- Error count and rate
- Progress bar
- Last execution time

---

## 🎯 Workflow Examples

### Example 1: Create Grid Trading Bot

```
1. Click [+ AI PROTOCOL]
2. Select "Grid Trading" template
3. Click [Next]
4. Config auto-filled:
   ✅ executionMode: leader
   ✅ priority: critical
5. Click [Create Worker]
6. Switch to [Code] tab
7. Replace API keys
8. Click [Save All]
9. Click [START]
10. Switch to [Leader] tab
11. ✅ Verify leader elected
```

### Example 2: Monitor All Nodes

```
1. Click [+ AI PROTOCOL]
2. Select "Market Monitor"
3. Config:
   ✅ executionMode: parallel
   ✅ priority: normal
4. [Create Worker]
5. [START]
6. All nodes collect data ✅
```

### Example 3: Emergency Stop

```
1. Something wrong!
2. Click [STOP ALL]
3. Confirm "Yes"
4. Wait for result
5. ✅ All workers stopped
6. Fix issue
7. Start workers individually
```

---

## 🎨 Visual Indicators

### Colors

- 🟢 Green - Active, success, started
- 🔴 Red - Inactive, error, stopped
- 🟡 Amber - Warning, primary action
- 🔵 Blue - Information, notes
- 🟣 Purple - Configuration

### Badges

- `ON` / `OFF` - Worker status
- `v1.19.2` - Version
- `NEW` - Recently created
- `ACTIVE` / `INACTIVE` - Status

### Icons

- 📄 - Worker/File
- 👑 - Leader mode
- 🟢 - Active pulse
- 🗑️ - Delete
- ⚙️ - Configuration
- 📝 - Notes
- 🔍 - Search

---

## 🚀 Ready to Use!

Open the editor and start creating workers!

**Remember:**

- Use `leader` mode for trading
- Save changes before testing
- Check **[STATS]** for monitoring
- Use **[STOP ALL]** for emergencies

**Happy coding! 🎉**
