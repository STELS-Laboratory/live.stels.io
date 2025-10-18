# 🎨 Visual Demo - AMI Editor Updates

## 🖥️ Linux Terminal Logs

### Full Terminal View

```
┌──────────────────────────────────────────────────────────────────┐
│ Worker Logs                                      🟢 Connected    │
│ 52e72aac-7bd4-4cbf-9a3f-689eca7d3d36                            │
│                                                                   │
│ [Following] [Auto-scroll] [Clear] [Download]          1,234 lines│
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ● ● ●  worker@stels:~/52e72aac$                                │
│  ─────────────────────────────────────────────────────────────── │
│  ░░░░░░░░░░░░░░░░ SCANLINES EFFECT ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                   │
│  # ───────────────────────────────────────────────────────────  │
│  # Switched to worker: 52e72aac-7bd4-4cbf-9a3f-689eca7d3d36     │
│  # Time: 2025-10-18T02:11:33.385Z                               │
│  # ───────────────────────────────────────────────────────────  │
│                                                                   │
│  › [2025-10-18T02:11:34.123Z] [INFO] Worker started             │
│  › [2025-10-18T02:11:35.456Z] [INFO] Initializing...            │
│  › [2025-10-18T02:11:36.789Z] [DEBUG] Config loaded             │
│  › [2025-10-18T02:11:37.012Z] [WARN] Low memory warning         │
│  › [2025-10-18T02:11:38.345Z] [ERROR] Connection timeout        │
│  › [2025-10-18T02:11:39.678Z] [INFO] Retrying...                │
│  › [2025-10-18T02:11:40.901Z] [INFO] Connected successfully     │
│                                                                   │
│  $ █                                                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Color Legend

```
🔵 # Cyan (Bold)        - Comments, separators
🔴 [ERROR] Red          - Critical errors
🟡 [WARN] Yellow        - Warnings
🟢 [INFO] Light Green   - Information
🟢 [DEBUG] Dim Green    - Debug messages
🟢 › Green (50%)        - Terminal prompt
🟢 $ Green              - Command prompt
🟢 █ Green (Blinking)   - Active cursor
```

---

## 💾 Save All Button with Hotkey

### Before

```
┌────────────────────────────────────┐
│ [Revert] [Save All]                │
└────────────────────────────────────┘
```

### After

```
┌────────────────────────────────────┐
│ [Revert] [Save All ⌘S]             │
└────────────────────────────────────┘
         └─ Visual indicator
```

### Button States

**With Changes:**

```
┌──────────────────────────────────┐
│ 🔄 Revert   💾 Save All ⌘S      │ ← Amber, enabled
└──────────────────────────────────┘
```

**Saving:**

```
┌──────────────────────────────────┐
│ 🔄 Revert   ⚙️  Saving... ⌘S    │ ← Spinning
└──────────────────────────────────┘
```

**No Changes:**

```
┌──────────────────────────────────┐
│ (Buttons hidden)                 │ ← Clean interface
└──────────────────────────────────┘
```

---

## 📱 Responsive Views

### Desktop (Full View)

```
┌───────────────┬─────────────────────────────────────────┐
│               │ ● ● ●  Code   Config   Notes   Logs    │
│ WORKERS LIST  ├─────────────────────────────────────────┤
│               │                                         │
│ ┌───────────┐ │ Terminal View:                         │
│ │ Worker A  │ │                                         │
│ ├───────────┤ │ › [INFO] Logs here                     │
│ │ Worker B  │ │ › [ERROR] Red errors                   │
│ │ (selected)│ │ $ █                                    │
│ ├───────────┤ │                                         │
│ │ Worker C  │ │                                         │
│ └───────────┘ │                                         │
│               │                                         │
└───────────────┴─────────────────────────────────────────┘
```

### Tablet

```
┌─────────────────────────────────────┐
│ WORKERS LIST (Collapsed)            │
├─────────────────────────────────────┤
│ Terminal View (Full Width)          │
│                                      │
│ › [INFO] Logs visible               │
│ $ █                                 │
└─────────────────────────────────────┘
```

---

## 🎬 User Workflows

### Workflow 1: Debug Production Issue

```
1. Select problematic worker
   └─> Worker list → Click worker

2. Open logs
   └─> Click "Logs" tab

3. Enable following
   └─> Click "Following" (turns green)

4. Watch for errors
   └─> Red [ERROR] lines appear

5. Pause stream
   └─> Click "Paused"

6. Download logs
   └─> Click "Download"

7. Fix code
   └─> Switch to "Code" tab
   └─> Edit script
   └─> Press ⌘S

8. Monitor results
   └─> Switch back to "Logs"
   └─> Enable "Following"
```

### Workflow 2: Create New Worker

```
1. Click "+ AI PROTOCOL"
   └─> Opens template dialog

2. Select template
   └─> Choose "Balance Monitor"

3. Configure
   └─> Set scope, mode, priority

4. Create
   └─> Click "Create Worker"

5. Edit code
   └─> "Code" tab opens
   └─> Modify script
   └─> Press ⌘S to save

6. Start worker
   └─> Click "START" button

7. Monitor
   └─> Switch to "Logs" tab
   └─> Enable "Following"
   └─> Watch execution
```

### Workflow 3: Multi-Worker Comparison

```
1. Open Worker A
   └─> View logs in "Logs" tab

2. Download logs
   └─> Click "Download"
   └─> Save as worker-a.log

3. Switch to Worker B
   └─> Logs auto-clear with separator
   └─> Shows: "# Switched to worker: B"

4. Compare behavior
   └─> Watch for differences
   └─> Download worker-b.log

5. Analyze offline
   └─> Open both .log files
   └─> Compare side-by-side
```

---

## 🎯 Quick Reference

### Terminal Commands

| Element            | Visual          | Meaning           |
| ------------------ | --------------- | ----------------- |
| `●●●`              | Window controls | macOS style       |
| `worker@stels:~/$` | Prompt          | Unix shell        |
| `#` line           | Cyan bold       | Comment/Separator |
| `›` symbol         | Green dim       | Log prompt        |
| `$` symbol         | Green           | Command prompt    |
| `█` cursor         | Green blinking  | Active/Connected  |

### Status Indicators

| Indicator       | Color         | Meaning                |
| --------------- | ------------- | ---------------------- |
| 🟢 Connected    | Green         | Active SSE connection  |
| 🔴 Disconnected | Red           | No connection          |
| 🟢 Following    | Green         | Auto-receive new logs  |
| ⚪ Paused       | Gray          | Static logs            |
| 🔵 Auto-scroll  | Blue spinning | Auto-scrolling enabled |

### Keyboard Shortcuts

| Key             | Action   | When Available     |
| --------------- | -------- | ------------------ |
| `⌘S` / `Ctrl+S` | Save All | When changes exist |

---

## 💡 Pro Tips

### Tip 1: Fast Debugging

```
⌘S (save) → Watch logs → Find error → Edit code → ⌘S (save)
└─────────────┬─────────────────────────────────┬─────────┘
           Fast cycle!                    No mouse needed!
```

### Tip 2: Multi-tab Editing

```
Code tab → Edit → Notes tab → Add notes → ⌘S saves both!
```

### Tip 3: Download for Analysis

```
Following → Error appears → Pause → Download → Analyze offline
```

### Tip 4: Clean Switching

```
Worker A logs → Switch to Worker B
  ↓
Auto-cleared with separator
  ↓
No confusion!
```

---

## 🖼️ Screenshots (Text-based)

### Empty State

```
┌────────────────────────────────────┐
│ ● ● ●  worker@stels:~/empty$      │
├────────────────────────────────────┤
│                                    │
│ $ No logs available.               │
│   Start the worker to see logs.   │
│                                    │
└────────────────────────────────────┘
```

### Active Streaming

```
┌────────────────────────────────────┐
│ ● ● ●  worker@stels:~/52e72aac$   │
├────────────────────────────────────┤
│ › [INFO] Processing batch 1/10    │
│ › [INFO] Processing batch 2/10    │
│ › [WARN] Rate limit approaching   │
│ › [INFO] Processing batch 3/10    │
│ $ █                                │
└────────────────────────────────────┘
```

### Error State

```
┌────────────────────────────────────┐
│ ● ● ●  worker@stels:~/52e72aac$   │
├────────────────────────────────────┤
│ › [INFO] Starting operation...    │
│ › [ERROR] Connection timeout       │
│ › [INFO] Retrying (1/3)...        │
│ › [ERROR] Connection timeout       │
│ › [INFO] Retrying (2/3)...        │
│ $ █                                │
└────────────────────────────────────┘
```

---

**Created:** 2025-10-18\
**For:** AMI Editor v2.1.0\
**Platform:** SONAR Trading Platform

**Enjoy your new Linux terminal experience!** 🐧💚
