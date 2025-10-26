# 🎯 How to Use This Template

## Quick Commands

```bash
# Navigate to apps directory
cd src/apps/

# Copy template
cp -r template my-new-app

# Rename main file
cd my-new-app
mv template-app.tsx my-new-app.tsx

# Open in editor and start coding!
```

---

## 📝 Step-by-Step Guide

### Step 1: Copy Template (30 seconds)

```bash
cd src/apps/
cp -r template analytics  # Replace 'analytics' with your app name
cd analytics
```

### Step 2: Rename Files (1 minute)

```bash
# Rename main component
mv template-app.tsx analytics.tsx
```

**Update these files:**

- `index.ts` - Change exports
- `analytics.tsx` - Change component name
- `store.ts` - Change store name
- `types.ts` - Change type names

### Step 3: System Integration (10 minutes)

Edit these 5 files:

**1. app.store.ts (line 147)**

```typescript
const allowedRoutes = [..., 'analytics'];
```

**2. app_tabs.tsx (line 35)**

```typescript
import { BarChart3 } from "lucide-react";
const DEV_TOOLS = [..., { key: "analytics", name: "Analytics", icon: BarChart3, shortcut: "A" }];
```

**3. layout.tsx (lines 120, 105)**

```typescript
const systemNav = [..., { key: "analytics", label: "Analytics", icon: BarChart3 }];
const names = {..., "analytics": "Analytics" };
```

**4. App.tsx (lines 36, 641)**

```typescript
const Analytics = lazy(() => import("@/apps/analytics"));
// ... in renderMainContent:
case "analytics": return <Suspense><Analytics /></Suspense>;
```

**5. app_shortcuts.tsx (line 74)**

```typescript
if (e.key === "A" || e.key === "a") {
  e.preventDefault();
  navigateTo("analytics");
}
```

### Step 4: Test (5 minutes)

```bash
npm run dev
```

**Test checklist:**

- [ ] Open http://localhost:5173
- [ ] Click Analytics in sidebar (desktop)
- [ ] Test ⌘⇧A keyboard shortcut
- [ ] Check app tab in header
- [ ] Test on mobile (warning should show)
- [ ] Reload page (store should persist)

---

## 🎨 Customization

### Change App Icon

Browse https://lucide.dev and pick an icon:

```typescript
import { YourIcon } from "lucide-react";
```

Popular choices:

- Analytics: `BarChart3`, `TrendingUp`, `LineChart`
- Data: `Database`, `Table`, `Folder`
- Settings: `Settings`, `Sliders`, `Wrench`
- Network: `Globe`, `Server`, `Wifi`

### Change Colors

Use STELS color system:

```typescript
// Primary (Amber)
className =
  "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";

// Success (Green)
className =
  "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-600";

// Info (Blue)
className =
  "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
```

### Change Layout

Template uses full-height layout:

```typescript
<div className="h-full bg-background flex flex-col">
  {/* Header - fixed */}
  <div className="border-b border-border px-6 py-4">
    {/* Header content */}
  </div>

  {/* Content - scrollable */}
  <div className="flex-1 overflow-auto p-6">
    {/* Your content */}
  </div>
</div>;
```

---

## 🔧 Common Modifications

### Add API Integration

Update `store.ts`:

```typescript
loadData: async (): Promise<void> => {
  set({ isLoading: true, error: null });

  try {
    const response = await fetch('YOUR_API_URL');
    const data = await response.json();
    
    set({
      data,
      isLoading: false,
      lastUpdate: Date.now(),
    });
  } catch (error) {
    set({
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to load",
    });
  }
},
```

### Add WebSocket Support

Create custom hook:

```typescript
// hooks/use-websocket.ts
export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (e) => setData(JSON.parse(e.data));
    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, [url]);

  return { isConnected, data };
}
```

### Add Real-time Updates

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadData(); // Refresh every 5 seconds
  }, 5000);

  return () => clearInterval(interval);
}, [loadData]);
```

---

## 📱 Mobile Support

Template includes mobile detection:

```typescript
const mobile = useMobile();

if (mobile) {
  return <MobileWarning />;
}

return <DesktopContent />;
```

**Mobile warning shows:**

- App icon
- App name
- Feature list
- Desktop requirement message

---

## 🧪 Testing Checklist

**Before committing:**

- [ ] TypeScript: `npm run build` - no errors
- [ ] Linting: No ESLint warnings
- [ ] Navigation: All routes work
- [ ] Shortcuts: Keyboard shortcuts functional
- [ ] Mobile: Warning displays correctly
- [ ] Store: Data persists on reload
- [ ] Theme: Light/Dark switching works
- [ ] Console: No errors or warnings
- [ ] Performance: No lag or stuttering
- [ ] Accessibility: ARIA attributes present

---

## 💡 Pro Tips

1. **Start small** - Get basic structure working first
2. **Use guide** - Click "Developer Guide" button in template
3. **Copy patterns** - Check PATTERNS.md for examples
4. **Test often** - Run dev server and test frequently
5. **Follow types** - Let TypeScript guide you
6. **Mobile first** - Always include mobile check
7. **Document** - Add JSDoc comments as you code

---

## 🎓 Example Workflow

**Creating an Analytics Dashboard:**

```bash
# 1. Copy (30s)
cp -r template analytics
cd analytics
mv template-app.tsx analytics.tsx

# 2. Update Code (2min)
# - Change TemplateApp → Analytics in analytics.tsx
# - Change exports in index.ts
# - Update store names in store.ts

# 3. Register (5min)
# - Edit app.store.ts line 147
# - Edit app_tabs.tsx line 35
# - Edit layout.tsx lines 120, 105
# - Edit App.tsx lines 36, 641
# - Edit app_shortcuts.tsx line 74

# 4. Choose Icon (1min)
import { BarChart3 } from "lucide-react";

# 5. Test (3min)
npm run dev
# Test navigation, shortcuts, mobile

# Total: ~12 minutes to working app!
```

---

## 🔑 Key Files Explained

**index.ts** - Public API

- Exports component, types, store
- Clean entry point

**template-app.tsx** - Main Component

- Mobile detection
- Loading/error states
- Professional UI layout
- Interactive guide

**store.ts** - State Management

- Zustand configuration
- Persistence
- DevTools
- Typed actions

**types.ts** - Type Definitions

- Data structures
- Component props
- API types
- Store types

**constants.ts** - Configuration

- Static values
- API endpoints
- Colors
- Shortcuts

**utils.ts** - Helpers

- Formatting functions
- Validators
- Calculators
- Sorters

---

## ⚠️ Common Mistakes

❌ **Don't:**

- Use `any` type
- Skip mobile check
- Forget to update allowedRoutes
- Use inline styles
- Skip error handling

✅ **Do:**

- Use strict TypeScript
- Include mobile warning
- Update all 5 system files
- Use Tailwind classes
- Add error boundaries

---

## 📞 Need Help?

**Documentation:**

- QUICKSTART.md - Fast setup
- INTEGRATION.md - Detailed steps
- PATTERNS.md - Code examples
- README.md - Full reference

**Examples:**

- Study `docs` app (simple)
- Study `canvas` app (complex)
- Study `editor` app (advanced)

**Interactive:**

- Click "Developer Guide" in template
- Use integration checklist
- Follow step-by-step wizard

---

**Good luck building your STELS app!** 🚀
