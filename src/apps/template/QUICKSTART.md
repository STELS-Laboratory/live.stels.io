# Quick Start Guide - 5 Minutes to Your First STELS App

Follow this guide to create and integrate a new app in under 5 minutes.

## ⚡ Quick Setup (Terminal)

```bash
# 1. Navigate to apps directory
cd src/apps/

# 2. Copy template to your app name
cp -r template analytics

# 3. Navigate to your new app
cd analytics

# 4. Rename main component file
mv template-app.tsx analytics.tsx
```

## ✏️ Quick Edits

### 1. Update `index.ts`

```typescript
export { default } from "./analytics";
export type { AnalyticsProps } from "./analytics";
export { useAnalyticsStore } from "./store";
export type { AnalyticsData, AnalyticsStore } from "./types";
```

### 2. Update `analytics.tsx` (3 places)

**Find and replace:**

- `TemplateApp` → `Analytics`
- `TemplateAppProps` → `AnalyticsProps`
- `"YOUR APP NAME"` → `"ANALYTICS"`
- `"Your App Title"` → `"Analytics Dashboard"`

### 3. Update `store.ts` (2 places)

**Find and replace:**

- `template-app-store` → `analytics-store`
- `"Template App Store"` → `"Analytics Store"`

### 4. Update `types.ts`

Rename interfaces:

- `TemplateData` → `AnalyticsData`
- `TemplateStore` → `AnalyticsStore`

## 🔌 System Integration (5 files)

### File 1: `src/stores/modules/app.store.ts`

**Line 147:**

```typescript
const allowedRoutes = [
  "welcome",
  "canvas",
  "editor",
  "schemas",
  "docs",
  "analytics",
];
```

### File 2: `src/components/main/app_tabs.tsx`

**Add import:**

```typescript
import { BarChart3 } from "lucide-react";
```

**Line 35-40 (add to array):**

```typescript
{ key: "analytics", name: "Analytics", icon: BarChart3, shortcut: "A" },
```

### File 3: `src/apps/layout.tsx`

**Add import:**

```typescript
import { BarChart3 } from "lucide-react";
```

**Line 120-125 (add to array):**

```typescript
{ key: "analytics", label: "Analytics", icon: BarChart3 },
```

**Line 105-114 (add to names object):**

```typescript
"analytics": "Analytics",
```

### File 4: `src/App.tsx`

**After line 36 (add lazy import):**

```typescript
const Analytics = lazy(() => import("@/apps/analytics"));
```

**After line 641 (add case):**

```typescript
case "analytics":
  return (
    <Suspense
      fallback={
        <div className="p-4 text-muted-foreground">
          Loading analytics...
        </div>
      }
    >
      <Analytics />
    </Suspense>
  );
```

### File 5: `src/components/main/app_shortcuts.tsx`

**After line 74 (add shortcut):**

```typescript
if (e.key === "A" || e.key === "a") {
  e.preventDefault();
  navigateTo("analytics");
  return;
}
```

## ✅ Test Your App

```bash
# Start dev server
npm run dev

# Open browser
# http://localhost:5173

# Test navigation:
# - Press ⌘⇧A (Mac) or Ctrl+Shift+A (Windows)
# - Click Analytics in sidebar (desktop)
# - Check app tab appears in header
```

## 🎯 Customization Tips

### Change App Icon

Browse Lucide icons: https://lucide.dev

```typescript
// Popular choices:
import {
  Activity, // Monitoring
  BarChart3, // Analytics
  Database, // Data
  Globe, // Network
  Settings, // Configuration
  TrendingUp, // Trading
  Zap, // Performance
} from "lucide-react";
```

### Change Keyboard Shortcut

Pick unused letter (A-Z). Already used:

- `E` - Editor
- `C` - Canvas
- `S` - Schemas
- `D` - Docs

Available: `A`, `B`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `P`, `Q`,
`R`, `T`, `U`, `V`, `W`, `X`, `Y`, `Z`

### Change Theme Colors

Use STELS color system:

**Primary (Amber):**

```typescript
className =
  "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";
```

**Success (Green):**

```typescript
className =
  "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-600";
```

**Error (Red):**

```typescript
className = "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400";
```

**Info (Blue):**

```typescript
className =
  "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
```

## 🚀 Next Steps

After basic setup:

1. **Define your data types** in `types.ts`
2. **Implement store actions** in `store.ts`
3. **Build UI components** following patterns
4. **Add custom hooks** for business logic
5. **Test thoroughly** on desktop and mobile
6. **Add documentation** for your app

## 📚 Example Apps to Study

| App         | Complexity | Learn From                                  |
| ----------- | ---------- | ------------------------------------------- |
| **docs**    | Simple     | Basic structure, markdown rendering         |
| **canvas**  | Complex    | ReactFlow, panels, drag-and-drop            |
| **editor**  | Advanced   | Monaco editor, sub-modules, dialogs         |
| **schemas** | Expert     | IndexedDB, complex state, nested components |

## 💡 Pro Tips

1. **Start simple** - Get basic structure working first
2. **Copy patterns** - Reuse code from existing apps
3. **Test often** - Check browser console for errors
4. **Follow standards** - Use TypeScript strict mode
5. **Mobile first** - Always add mobile warning
6. **Document code** - Add JSDoc comments
7. **Use store** - Global state in Zustand, local in component

## ⏱️ Estimated Time

- **Basic setup:** 5 minutes
- **System integration:** 10 minutes
- **Testing:** 5 minutes
- **Total:** ~20 minutes for working app

## 🎓 Learning Resources

- **Tailwind CSS:** https://tailwindcss.com
- **shadcn/ui:** https://ui.shadcn.com
- **Zustand:** https://zustand-demo.pmnd.rs
- **Lucide Icons:** https://lucide.dev
- **Framer Motion:** https://www.framer.com/motion

---

**Ready to build? Start with step 1!** 🚀
