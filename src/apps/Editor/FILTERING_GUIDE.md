# Worker Filtering & Sorting Guide

## ✨ Professional Filtering System

Advanced multi-dimensional filtering with automatic sorting.

---

## 🎯 Features

### 1. **Search** (Text Input)

Search across multiple fields simultaneously:

- ✅ Worker ID (SID)
- ✅ Node ID (NID)
- ✅ Note/Description
- ✅ Version

**Usage:**

```
Type: "grid"     → Finds workers with "grid" in any field
Type: "s-0001"   → Finds workers on node s-0001
Type: "1.19.2"   → Finds workers with version 1.19.2
```

**Features:**

- Real-time filtering (instant results)
- Case-insensitive search
- Clear button (X) appears when typing

### 2. **Status Filter** (Active/Inactive)

Filter by worker running status:

- 🟢 **Active Only** - Shows only running workers
- 🔴 **Inactive Only** - Shows only stopped workers
- ⚪ **All Status** - Shows all workers (default)

**Icons:**

- `▶️ Play` - Active workers
- `⏸️ PowerOff` - Inactive workers
- `📋 Layers` - All workers

### 3. **Execution Mode Filter**

Filter by how workers run across nodes:

- 🔵 **Parallel** - Runs on all nodes simultaneously
- 🟡 **Leader** - Runs on one elected leader node
- 🟣 **Exclusive** - Runs on specific assigned node
- ⚪ **All Modes** - No filter (default)

**Use Cases:**

- Find all trading bots → Filter: `Leader`
- Find monitoring workers → Filter: `Parallel`
- Find node-specific tasks → Filter: `Exclusive`

**Icons:**

- `📋 Layers` - Parallel mode
- `👑 Crown` - Leader mode
- `🖥️ Server` - Exclusive mode

### 4. **Priority Filter**

Filter by execution priority level:

- 🔴 **Critical** - Highest priority (50 errors, 1ms)
- 🟠 **High** - High priority (20 errors, 10ms)
- 🟢 **Normal** - Standard priority (10 errors, 100ms)
- 🔵 **Low** - Lowest priority (5 errors, 1s)
- ⚪ **All Priorities** - No filter (default)

**Use Cases:**

- Find critical workers → Filter: `Critical`
- Find background tasks → Filter: `Low`
- Find trading workers → Filter: `High` or `Critical`

**Icons:**

- `⚡ Zap` with color coding (red/orange/green/blue)

### 5. **Automatic Sorting**

**Always sorts by timestamp descending:**

- ✅ Newest workers appear first
- ✅ Recently updated workers move to top
- ✅ Consistent ordering

**Why?**

- See latest changes immediately
- Track recent activity easily
- Know what's new at a glance

---

## 🎨 UI Layout

```
┌─────────────────────────────────────┐
│ [Search workers...            ] [X] │
├─────────────────────────────────────┤
│ [All Status ▼]    [Reset] [3/10]   │ ← Status filter
├─────────────────────────────────────┤
│ [All Modes ▼] [All Priorities ▼]   │ ← Mode & Priority
├─────────────────────────────────────┤
│ [leader ✕] [critical ✕]            │ ← Active filters
└─────────────────────────────────────┘
```

### Visual Indicators

**Counter (Top Right):**

```
[3/10]  ← 3 filtered results / 10 total
```

- Amber background
- Monospace font
- Updates in real-time

**Reset Button:**

- Appears when any filter is active
- Clears all filters at once
- Returns to default state

**Active Filter Badges:**

- Appear below filter dropdowns
- Colored by filter type:
  - 🔵 Blue - Execution mode
  - 🟠 Orange - Priority
- Click `X` to remove individual filter
- Compact design (height: 5px)

---

## 💡 Usage Examples

### Example 1: Find Active Trading Bots

```
1. Status: Active Only
2. Mode: Leader
3. Priority: Critical or High

Result: All active trading workers
```

### Example 2: Find Monitoring Workers

```
1. Mode: Parallel
2. Priority: Normal or Low

Result: All monitoring/logging workers
```

### Example 3: Find Problem Workers

```
1. Status: Inactive Only
2. Search: "error" or check stats

Result: Stopped workers (possibly due to errors)
```

### Example 4: Find Recent Changes

```
1. Clear all filters (default sorting)
2. Top of list = newest/updated

Result: Recently modified workers
```

### Example 5: Find Node-Specific Tasks

```
1. Mode: Exclusive
2. Search: "s-0001"

Result: Tasks assigned to specific node
```

### Example 6: Audit Critical Workers

```
1. Priority: Critical
2. Status: All

Result: All high-priority workers (running or not)
```

---

## 🔧 Filter Logic

### Combining Filters (AND Logic)

All active filters must match:

```javascript
// Worker matches if ALL conditions are true:
✅ Matches search term (if provided)
AND
✅ Matches status filter (if selected)
AND
✅ Matches execution mode (if selected)
AND
✅ Matches priority (if selected)
```

**Example:**

```
Search: "grid"
Status: Active
Mode: Leader
Priority: Critical

Result: Active leader workers with "grid" in name and critical priority
```

### Filter Defaults

When no filters are selected:

- Search: Empty (matches all)
- Status: All (null)
- Mode: All (null)
- Priority: All (null)

**Result:** Shows all workers, sorted by timestamp (newest first)

---

## 🎯 Filter Persistence

### During Session

**Filters persist:**

- ✅ While selecting different workers
- ✅ While editing workers
- ✅ While switching tabs

**Filters reset:**

- ❌ On page refresh (not persisted to localStorage)
- ✅ When clicking "Reset" button

### Reset Behavior

**Reset button clears:**

1. Search text → Empty
2. Status filter → All
3. Execution mode → All
4. Priority → All

**Does NOT reset:**

- Selected worker
- Editor content
- Unsaved changes

---

## 📊 Filter Statistics

### Real-Time Counter

Shows filtered results in real-time:

```
[3/10]   ← 3 matches out of 10 total workers
[10/10]  ← All workers match (no filters)
[0/5]    ← No matches (too restrictive filters)
```

**Location:** Top right of filter section\
**Color:** Amber (matches theme)\
**Font:** Monospace (easier to read numbers)

### Visual Feedback

**Empty Results:**

- Counter shows `[0/X]`
- Worker list is empty
- No special message (intentional - adjust filters)

**All Match:**

- Counter shows `[X/X]`
- No active filter badges shown
- Default sorting applies

---

## 🎨 Color Coding

### Status Filter

- 🟢 Green - Active workers
- 🔴 Red - Inactive workers
- ⚪ Gray - All status

### Execution Mode Filter

- 🔵 Blue - Parallel (all nodes)
- 🟡 Amber - Leader (one node)
- 🟣 Purple - Exclusive (assigned)

### Priority Filter

- 🔴 Red - Critical (urgent)
- 🟠 Orange - High (important)
- 🟢 Green - Normal (standard)
- 🔵 Blue - Low (background)

### Active Filter Badges

- 🔵 Blue border/bg - Mode filter
- 🟠 Orange border/bg - Priority filter

---

## ⚡ Performance

### Optimizations

**Efficient Filtering:**

```typescript
// Single pass through array
workers
  .filter(matchesAllConditions) // O(n)
  .sort(byTimestampDesc); // O(n log n)
```

**Benefits:**

- ✅ Instant results (< 1ms for 100s of workers)
- ✅ No lag or stuttering
- ✅ Smooth UX

**Why It's Fast:**

1. JavaScript native array methods (optimized)
2. Simple comparison operations
3. No complex regex or string operations
4. No API calls during filtering (local only)

---

## 🎓 Best Practices

### For Users

**Finding Workers:**

1. Start broad (no filters) to see all
2. Add filters one by one
3. Use search for specific workers
4. Check counter to validate results

**Organizing Workflow:**

1. Filter by status to see what's running
2. Filter by mode to group similar workers
3. Filter by priority to see critical first
4. Combine filters to narrow down

**Troubleshooting:**

1. No results? → Check if filters too restrictive
2. Too many results? → Add more filters
3. Can't find worker? → Clear all filters first
4. Recent worker missing? → It's sorted to top already

### For Developers

**Adding New Filters:**

```typescript
// 1. Add state
const [filterNew, setFilterNew] = useState<string | null>(null);

// 2. Add to filter logic
const matchesNew = !filterNew || worker.field === filterNew;

// 3. Add to reset
setFilterNew(null);

// 4. Add UI select dropdown
```

**Filter Order:**

1. Search (text) - Always first
2. Status (boolean) - High priority
3. Mode (enum) - Medium priority
4. Priority (enum) - Lower priority

---

## 📱 Responsive Design

### Compact Layout

**Desktop (> 768px):**

```
[Search field          ]
[Status ▼] [Reset] [X/Y]
[Mode ▼] [Priority ▼]
[active badges]
```

**Mobile (< 768px):**

- Same layout (works well)
- Dropdowns stack naturally
- Touch-friendly targets (height: 32px+)

---

## 🚀 Future Enhancements

### Possible Additions

**More Filters:**

- [ ] Filter by version (dropdown)
- [ ] Filter by node ID (dropdown)
- [ ] Filter by dependencies (multi-select)
- [ ] Filter by creation date (date picker)

**Advanced Features:**

- [ ] Save filter presets
- [ ] Share filter URLs
- [ ] Quick filter buttons
- [ ] Filter history

**UI Improvements:**

- [ ] Filter builder mode
- [ ] Visual filter flow diagram
- [ ] Filter suggestions
- [ ] Smart filters (based on context)

---

## 📝 Summary

**Current Features:**

- ✅ Text search (4 fields)
- ✅ Status filter (active/inactive)
- ✅ Execution mode filter (parallel/leader/exclusive)
- ✅ Priority filter (critical/high/normal/low)
- ✅ Automatic sorting (newest first)
- ✅ Visual indicators (badges, icons, colors)
- ✅ Reset all filters
- ✅ Real-time counter

**Benefits:**

- 🚀 Fast & responsive
- 🎨 Professional design
- 💡 Intuitive UX
- 🔧 Easy to use
- 📊 Visual feedback

---

**Status:** ✅ Complete\
**Performance:** Excellent\
**UX:** Professional
