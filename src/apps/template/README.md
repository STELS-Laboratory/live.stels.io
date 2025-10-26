# 🚀 STELS App Template

> **Production-ready starter template for creating professional STELS
> applications**

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-State-orange)](https://zustand-demo.pmnd.rs/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**⏱️ Setup Time:** 5-20 minutes | **📦 Files:** 17 | **📝 Lines:** 2,691 | **📚
Guides:** 8

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Copy template
cd src/apps/ && cp -r template analytics && cd analytics

# 2. Rename main file
mv template-app.tsx analytics.tsx

# 3. Start development
npm run dev
```

**Then:** Click "Developer Guide" button in the app for interactive setup!

---

## 🎁 What's Included

### ✨ Interactive Developer Guide

The template includes a **full-screen interactive guide** built right into the
app:

- ✅ **8 integration steps** with visual progress tracking
- ✅ **Code examples** with syntax highlighting and copy buttons
- ✅ **Task checkboxes** to track your progress
- ✅ **File references** with line numbers
- ✅ **Success indicators** when steps complete
- ✅ **Quick reference** panel for shortcuts

**Access the guide:**

1. Temporarily add `'template'` to `allowedRoutes` in `app.store.ts`
2. Run `npm run dev` and navigate to template app
3. Click **"Developer Guide"** button
4. Follow steps and check off tasks as you complete them

This is a starter template for creating new applications in the STELS platform.

## 📁 Template Structure

```
template/
├── index.ts              # Module exports
├── template-app.tsx      # Main component
├── store.ts             # Zustand state management
├── types.ts             # TypeScript type definitions
├── constants.ts         # App-specific constants
├── utils.ts             # Utility functions
└── README.md            # This file
```

## 🚀 Quick Start

### Step 1: Copy Template

```bash
cd src/apps/
cp -r template your-app-name
cd your-app-name
```

### Step 2: Rename Files

```bash
mv template-app.tsx your-app-name.tsx
```

### Step 3: Update Code

1. **index.ts**: Update exports

```typescript
export { default } from "./your-app-name";
export type { YourAppProps } from "./your-app-name";
export { useYourAppStore } from "./store";
```

2. **your-app-name.tsx**: Replace component name and logic
3. **store.ts**: Update store name and state
4. **types.ts**: Define your data types

### Step 4: Register in System

**1. Add to `allowedRoutes`** (`src/stores/modules/app.store.ts`):

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

**2. Add to `DEV_TOOLS`** (`src/components/main/app_tabs.tsx`):

```typescript
import { YourIcon } from "lucide-react";

const DEV_TOOLS: DevTool[] = [
  // ... existing tools
  { key: "your-app", name: "Your App", icon: YourIcon, shortcut: "Y" },
];
```

**3. Add to `systemNav`** (`src/apps/layout.tsx`):

```typescript
const systemNav: NavItem[] = [
  // ... existing items
  { key: "your-app", label: "Your App", icon: YourIcon },
];
```

**4. Add lazy import** (`src/App.tsx`):

```typescript
const YourApp = lazy(() => import("@/apps/your-app"));

// In renderMainContent():
case "your-app":
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <YourApp />
    </Suspense>
  );
```

**5. Add keyboard shortcut** (`src/components/main/app_shortcuts.tsx`):

```typescript
if (e.key === "Y" || e.key === "y") {
  e.preventDefault();
  navigateTo("your-app");
  return;
}
```

## 📝 Development Standards

### TypeScript

- ✅ Strict mode enabled
- ✅ No `any` or `!` assertions
- ✅ Explicit return types
- ✅ Use `unknown` instead of `any`

### React

- ✅ Functional components only
- ✅ Fully typed props
- ✅ Use React Hooks
- ✅ React.memo for expensive components

### Styling

- ✅ Tailwind CSS v4 utilities only
- ✅ shadcn/ui components
- ✅ No inline styles
- ✅ Dark theme support
- ✅ Responsive design

### State Management

- ✅ Zustand for global state
- ✅ Local state for component-specific
- ✅ Persist important data
- ✅ Hydration handling

## 🎨 Component Patterns

### Basic Component

```typescript
interface MyComponentProps {
  title: string;
  data: DataType;
  onAction: () => void;
}

function MyComponent({
  title,
  data,
  onAction,
}: MyComponentProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}

export default MyComponent;
```

### With Hooks

```typescript
function MyComponent(): React.ReactElement {
  const data = useTemplateStore((state) => state.data);
  const loadData = useTemplateStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return <div>{/* Content */}</div>;
}
```

## 🔧 Common Patterns

### Loading State

```typescript
if (isLoading) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

### Error Handling

```typescript
if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
```

### Empty State

```typescript
if (!data || data.length === 0) {
  return (
    <div className="text-center py-12">
      <YourIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p className="text-sm text-muted-foreground">No data available</p>
    </div>
  );
}
```

## 🎯 App Types

### Canvas-Style (Visual/Interactive)

- ReactFlow for node-based interfaces
- Panel management system
- Drag-and-drop functionality
- State persistence to localStorage

### Editor-Style (Code/Text)

- Monaco Editor for code editing
- Syntax highlighting
- Validation and error handling
- Split-panel layouts

### Data-Intensive Apps

- Proper loading states
- Error boundaries
- Data validation
- Caching strategies

### Documentation-Style

- ReactMarkdown for rendering
- Search and filtering
- Responsive design
- Syntax highlighting with `react-syntax-highlighter`

## 🔑 Keyboard Shortcuts

Add your app shortcuts in `src/components/main/app_shortcuts.tsx`:

```typescript
// Development Tool: Cmd+Shift+Y
if (e.shiftKey && (e.key === "Y" || e.key === "y")) {
  e.preventDefault();
  navigateTo("your-app");
  return;
}
```

## 📱 Mobile Support

Always include mobile check:

```typescript
const mobile = useMobile();

if (mobile) {
  return <MobileWarning />;
}

return <DesktopContent />;
```

## ✅ Checklist

Before deploying your app, ensure:

- [ ] All files renamed from template
- [ ] TypeScript types fully defined
- [ ] Component props typed correctly
- [ ] Store actions implemented
- [ ] Mobile warning included
- [ ] Error boundaries added
- [ ] Loading states handled
- [ ] Registered in allowedRoutes
- [ ] Added to DEV_TOOLS
- [ ] Added to systemNav
- [ ] Lazy import in App.tsx
- [ ] Keyboard shortcuts configured
- [ ] Tooltips configured
- [ ] Testing completed
- [ ] Documentation updated

## 📚 Resources

- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://zustand-demo.pmnd.rs)
- [Lucide Icons](https://lucide.dev)
- [React Hook Form](https://react-hook-form.com)

## 🤝 Support

Follow STELS development standards and patterns from existing apps for
consistency.

---

**Created:** STELS Platform Team\
**Version:** 1.0\
**License:** Gliesereum Ukraine © 2025
