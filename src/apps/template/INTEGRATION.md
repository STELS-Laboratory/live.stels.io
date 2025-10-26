# Integration Guide - Adding Your App to STELS

This guide provides step-by-step instructions for integrating your new app into
the STELS platform.

## 📋 Integration Checklist

Complete these steps in order:

### ✅ 1. Prepare Your App

- [ ] Copy template folder to your app name
- [ ] Rename all files and components
- [ ] Update all imports and exports
- [ ] Test app component renders correctly

### ✅ 2. Register in App Store

**File:** `src/stores/modules/app.store.ts`

**Location:** Line 147

**Before:**

```typescript
const allowedRoutes = ["welcome", "canvas", "editor", "schemas", "docs"];
```

**After:**

```typescript
const allowedRoutes = [
  "welcome",
  "canvas",
  "editor",
  "schemas",
  "docs",
  "your-app",
];
```

### ✅ 3. Add to Development Tools

**File:** `src/components/main/app_tabs.tsx`

**Step 1:** Import icon

```typescript
import { YourIcon } from "lucide-react";
```

**Step 2:** Add to DEV_TOOLS array (lines 35-40)

```typescript
const DEV_TOOLS: DevTool[] = [
  { key: "editor", name: "Editor", icon: Code, shortcut: "E" },
  { key: "canvas", name: "Canvas", icon: Boxes, shortcut: "C" },
  { key: "schemas", name: "Schemas", icon: LayoutIcon, shortcut: "S" },
  { key: "docs", name: "Docs", icon: FileText, shortcut: "D" },
  { key: "your-app", name: "Your App", icon: YourIcon, shortcut: "Y" }, // ← Add this
];
```

### ✅ 4. Add to Layout Navigation

**File:** `src/apps/layout.tsx`

**Step 1:** Import icon (if not already imported)

```typescript
import { YourIcon } from "lucide-react";
```

**Step 2:** Add to systemNav array (lines 120-125)

```typescript
const systemNav: NavItem[] = [
  { key: "canvas", label: "Canvas", icon: Boxes },
  { key: "editor", label: "Editor", icon: Code },
  { key: "schemas", label: "Schemas", icon: LayoutIcon },
  { key: "docs", label: "Docs", icon: FileText },
  { key: "your-app", label: "Your App", icon: YourIcon }, // ← Add this
].filter((i) => allowedRoutes.includes(i.key));
```

**Step 3:** Add friendly name in getAppName function (lines 105-114)

```typescript
const getAppName = (route: string): string => {
  const names: Record<string, string> = {
    welcome: "Welcome",
    editor: "Editor",
    canvas: "Canvas",
    schemas: "Schemas",
    docs: "Documentation",
    "your-app": "Your App Name", // ← Add this
  };
  return names[route] || route;
};
```

### ✅ 5. Add to App Router

**File:** `src/App.tsx`

**Step 1:** Add lazy import (after line 36)

```typescript
const YourApp = lazy(() => import("@/apps/your-app"));
```

**Step 2:** Add route case in renderMainContent() (after line 641)

```typescript
case "your-app":
  return (
    <Suspense
      fallback={
        <div className="p-4 text-muted-foreground">
          Loading your app...
        </div>
      }
    >
      <YourApp />
    </Suspense>
  );
```

### ✅ 6. Add Keyboard Shortcuts

**File:** `src/components/main/app_shortcuts.tsx`

**Add in handleKeyDown function** (after line 74, before line 77):

```typescript
if (e.key === "Y" || e.key === "y") {
  e.preventDefault();
  navigateTo("your-app");
  return;
}
```

### ✅ 7. Test Integration

Run through this checklist:

1. **Navigation:**
   - [ ] Sidebar navigation works (desktop)
   - [ ] App tabs show correctly
   - [ ] Click navigation functional

2. **Keyboard Shortcuts:**
   - [ ] `⌘⇧Y` opens your app (or your letter)
   - [ ] `⌘0` returns to home
   - [ ] Tab navigation works

3. **Tooltips:**
   - [ ] Sidebar tooltip shows correctly
   - [ ] Tab tooltip shows app info
   - [ ] Shortcut hint displayed

4. **Mobile:**
   - [ ] Mobile warning displays
   - [ ] Desktop version works

5. **State:**
   - [ ] Store persists correctly
   - [ ] Data loads properly
   - [ ] Error handling works

## 🔍 Code Examples

### Complete Integration Example

**1. App Component** (`src/apps/analytics/analytics.tsx`)

```typescript
import React, { useEffect } from "react";
import { useMobile } from "@/hooks/use_mobile";
import { BarChart3 } from "lucide-react";
import { useAnalyticsStore } from "./store";

function Analytics(): React.ReactElement {
  const mobile = useMobile();
  const loadData = useAnalyticsStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (mobile) {
    return (
      <div className="h-full bg-background p-4 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-card rounded flex items-center justify-center mb-4 mx-auto">
            <BarChart3 className="w-8 h-8 text-amber-700 dark:text-amber-400" />
          </div>
          <h2 className="text-amber-700 dark:text-amber-400 font-mono text-lg font-bold mb-2">
            ANALYTICS
          </h2>
          <p className="text-muted-foreground font-mono text-sm">
            Desktop interface required
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Your app content */}
    </div>
  );
}

export default Analytics;
```

**2. Store Registration** (`src/stores/modules/app.store.ts`)

```typescript
const allowedRoutes = [
  "welcome",
  "canvas",
  "editor",
  "schemas",
  "docs",
  "analytics", // ← Your app
];
```

**3. App Tabs** (`src/components/main/app_tabs.tsx`)

```typescript
import { BarChart3 } from "lucide-react";

const DEV_TOOLS: DevTool[] = [
  { key: "editor", name: "Editor", icon: Code, shortcut: "E" },
  { key: "canvas", name: "Canvas", icon: Boxes, shortcut: "C" },
  { key: "schemas", name: "Schemas", icon: LayoutIcon, shortcut: "S" },
  { key: "docs", name: "Docs", icon: FileText, shortcut: "D" },
  { key: "analytics", name: "Analytics", icon: BarChart3, shortcut: "A" },
];
```

**4. Layout Navigation** (`src/apps/layout.tsx`)

```typescript
const systemNav: NavItem[] = [
  { key: "canvas", label: "Canvas", icon: Boxes },
  { key: "editor", label: "Editor", icon: Code },
  { key: "schemas", label: "Schemas", icon: LayoutIcon },
  { key: "docs", label: "Docs", icon: FileText },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
].filter((i) => allowedRoutes.includes(i.key));
```

**5. App Router** (`src/App.tsx`)

```typescript
const Analytics = lazy(() => import("@/apps/analytics"));

// In renderMainContent():
case "analytics":
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading analytics...</div>}>
      <Analytics />
    </Suspense>
  );
```

**6. Keyboard Shortcuts** (`src/components/main/app_shortcuts.tsx`)

```typescript
if (e.key === "A" || e.key === "a") {
  e.preventDefault();
  navigateTo("analytics");
  return;
}
```

## 🎨 Icon Selection

Choose appropriate Lucide icons for your app:

- **Analytics/Charts:** `BarChart3`, `LineChart`, `TrendingUp`
- **Data/Database:** `Database`, `Table`, `Folder`
- **Settings/Config:** `Settings`, `Sliders`, `Wrench`
- **Network/API:** `Globe`, `Server`, `Wifi`
- **Trading:** `TrendingUp`, `DollarSign`, `Activity`
- **Monitoring:** `Activity`, `Eye`, `Monitor`
- **Tools:** `Tool`, `Wrench`, `Hammer`

Full list: https://lucide.dev

## ⚠️ Common Mistakes

1. **Forgot to add to allowedRoutes** - App won't navigate
2. **Mismatched route keys** - Must be same everywhere
3. **Missing lazy import** - App won't load
4. **Wrong icon import** - Use Lucide React icons
5. **No mobile check** - Poor mobile UX
6. **Missing return type** - TypeScript error
7. **Using `any` type** - Violates standards

## 🧪 Testing

After integration, test:

```bash
npm run dev
```

Test checklist:

- [ ] App loads without errors
- [ ] Navigation works from sidebar
- [ ] Tab navigation works
- [ ] Keyboard shortcuts work
- [ ] Mobile warning displays
- [ ] Store persists data
- [ ] Theme switching works
- [ ] No console errors

## 🎓 Learn from Examples

Study existing apps for patterns:

- **Simple:** `docs` - Basic document viewer
- **Complex:** `editor` - Monaco editor with sub-modules
- **Canvas:** `canvas` - ReactFlow with panels
- **Schema:** `schemas` - Advanced editor with preview

## 📞 Questions?

Refer to workspace rules and existing app implementations for guidance.

---

**Happy coding!** 🚀
