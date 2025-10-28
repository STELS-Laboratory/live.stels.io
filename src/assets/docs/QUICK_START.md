# Quick Start Guide

**Category:** Developer\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** Developers wanting to get started quickly

---

## Get Started in 5 Minutes

This guide gets you up and running with STELS development as quickly as
possible.

---

## Prerequisites

- **Node.js** v18+ and **npm** v9+
- **Git** for version control
- **Code editor** (VS Code recommended)

---

## Installation

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/gliesereum/stels.git
cd stels

# Install dependencies
npm install
```

**Wait for installation to complete** (~2-3 minutes)

### 2. Start Development Server

```bash
npm run dev
```

**Expected output:**

```
VITE v5.0.0  ready in 1234 ms
➜  Local:   http://localhost:5173/
```

### 3. Open in Browser

Navigate to `http://localhost:5173/`

**You should see the STELS Welcome screen!** 🎉

---

## First Steps

### Explore the Interface

**1. Welcome Screen**

- Central hub for launching applications
- Access to all STELS tools

**2. Developer Tools (Top Tabs)**

- **Editor**: Monaco-based code editor
- **Canvas**: Visual workflow builder
- **Schemas**: JSON Schema management
- **Docs**: Documentation viewer (you're here!)

**3. Navigation**

- Click tabs to switch apps
- Press `Cmd+Shift+E` for Editor
- Press `Cmd+Shift+C` for Canvas
- Press `Cmd+Shift+D` for Docs

### Try the Editor

1. Click **Editor** tab or press `Cmd+Shift+E`
2. You'll see Monaco editor with syntax highlighting
3. Try typing: `const message = "Hello STELS";`
4. Notice IntelliSense and type checking!

### Explore the Canvas

1. Click **Canvas** tab or press `Cmd+Shift+C`
2. Drag and drop nodes to create workflows
3. Connect nodes to define data flow
4. Right-click for context menu

### Read Documentation

1. Click **Docs** tab or press `Cmd+Shift+D`
2. Browse platform documentation
3. Filter by category
4. Search for specific topics

---

## Your First Component

Let's create a simple React component:

### 1. Create File

```bash
mkdir -p src/components/hello
touch src/components/hello/HelloWorld.tsx
```

### 2. Write Component

```typescript
// src/components/hello/HelloWorld.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function HelloWorld(): React.ReactElement {
  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-2">Hello, STELS! 👋</h2>
        <p className="text-muted-foreground">
          You've created your first component!
        </p>
      </CardContent>
    </Card>
  );
}
```

### 3. Use Component

Add to Welcome screen:

```typescript
// src/apps/welcome/Welcome.tsx
import { HelloWorld } from "@/components/hello/HelloWorld";

// Inside Welcome component's return:
<HelloWorld />;
```

### 4. See Result

Save files and check browser—HMR updates instantly!

---

## Create Your First App

Use the template to create a new app in **15 minutes**:

### 1. Copy Template

```bash
cd src/apps/
cp -r template my-app
cd my-app
```

### 2. Rename Main File

```bash
mv template-app.tsx my-app.tsx
```

### 3. Update Component

```typescript
// my-app.tsx
export function MyApp(): React.ReactElement {
  return (
    <div className="h-full bg-background p-8">
      <h1 className="text-3xl font-bold">My First App</h1>
      <p className="text-muted-foreground mt-2">
        Building with STELS!
      </p>
    </div>
  );
}
```

### 4. Register App

**A. Add to routes** (`src/stores/modules/app.store.ts`):

```typescript
const allowedRoutes = [
  // ... existing
  "my-app",
];
```

**B. Add navigation** (`src/components/main/layout.tsx`):

```typescript
import { Sparkles } from "lucide-react";

const systemNav: NavItem[] = [
  // ... existing
  { key: "my-app", label: "My App", icon: Sparkles },
];
```

**C. Configure routing** (`src/App.tsx`):

```typescript
const routes = {
  // ... existing
  "my-app": () => import("@/apps/my-app"),
};
```

### 5. Test It

1. Save all files
2. Refresh browser
3. Click "My App" in sidebar
4. See your app! 🚀

---

## Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Quality
npm run type-check       # TypeScript checking
npm run lint             # ESLint
npm run lint -- --fix    # Auto-fix lint issues

# Clean
rm -rf node_modules      # Remove dependencies
rm -rf dist              # Remove build output
npm install              # Reinstall dependencies
```

---

## Project Structure at a Glance

```
stels/
├── src/
│   ├── apps/           → Application modules
│   ├── components/     → Reusable UI components
│   ├── stores/         → State management (Zustand)
│   ├── hooks/          → Custom React hooks
│   ├── lib/            → Utilities and services
│   └── assets/         → Static assets
├── public/             → Public files
└── package.json        → Dependencies
```

---

## Key Technologies

| Technology       | Purpose           | Docs                                                                           |
| ---------------- | ----------------- | ------------------------------------------------------------------------------ |
| **React 18**     | UI framework      | [react.dev](https://react.dev)                                                 |
| **TypeScript**   | Type safety       | [typescriptlang.org](https://typescriptlang.org)                               |
| **Vite**         | Build tool        | [vitejs.dev](https://vitejs.dev)                                               |
| **Zustand**      | State management  | [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)                 |
| **Tailwind CSS** | Styling           | [tailwindcss.com](https://tailwindcss.com)                                     |
| **shadcn/ui**    | Component library | [ui.shadcn.com](https://ui.shadcn.com)                                         |
| **Monaco**       | Code editor       | [microsoft.github.io/monaco-editor](https://microsoft.github.io/monaco-editor) |
| **ReactFlow**    | Node-based UI     | [reactflow.dev](https://reactflow.dev)                                         |

---

## Code Style Quick Reference

### TypeScript

```typescript
// ✅ GOOD: Explicit types
function add(a: number, b: number): number {
  return a + b;
}

// ❌ BAD: Implicit types
function add(a, b) {
  return a + b;
}
```

### React Components

```typescript
// ✅ GOOD: Functional with types
interface Props {
  title: string;
  count: number;
}

function Counter({ title, count }: Props): React.ReactElement {
  return <div>{title}: {count}</div>;
}

// ❌ BAD: No types
function Counter({ title, count }) {
  return <div>{title}: {count}</div>;
}
```

### Styling

```typescript
// ✅ GOOD: Tailwind classes
<button className="px-4 py-2 bg-amber-500 text-white rounded">
  Click me
</button>

// ❌ BAD: Inline styles
<button style={{ padding: '8px 16px', background: '#f59e0b' }}>
  Click me
</button>
```

---

## Common Issues

### Port Already in Use

```bash
# Error: Port 5173 is already in use
# Solution: Kill process or use different port
lsof -ti:5173 | xargs kill -9
# Or
npm run dev -- --port 3000
```

### Module Not Found

```bash
# Error: Cannot find module '@/...'
# Solution: Restart dev server
# Press Ctrl+C to stop
npm run dev
```

### Type Errors

```bash
# Error: Property 'x' does not exist
# Solution: Check type definitions
npm run type-check
# Fix reported errors
```

### Build Fails

```bash
# Error: Build failed
# Solution: Check for errors
npm run type-check
npm run lint
# Fix all errors before building
```

---

## Keyboard Shortcuts

| Shortcut      | Action              |
| ------------- | ------------------- |
| `Cmd+Shift+E` | Open Editor         |
| `Cmd+Shift+C` | Open Canvas         |
| `Cmd+Shift+S` | Open Schemas        |
| `Cmd+Shift+D` | Open Docs           |
| `Cmd+0`       | Go to Welcome       |
| `Cmd+1-9`     | Switch to app tab N |

---

## Next Steps

### Learn More

- 📖 **[Platform Introduction](PLATFORM_INTRODUCTION.md)** - Understand STELS
  philosophy
- 🏗️ **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - System design
- 🚀 **[Developer Onboarding](DEVELOPER_ONBOARDING.md)** - Complete setup guide
- 🛠️ **[Building Your First Agent](BUILDING_FIRST_AGENT.md)** - Create an
  autonomous agent

### Explore Apps

- **Canvas**: Build visual workflows
- **Editor**: Write and test protocols
- **Schemas**: Manage data structures
- **Markets**: View real-time market data
- **Wallet**: Manage cryptographic identity

### Join Community

- **GitHub**: Report issues and contribute
- **Discussions**: Ask questions
- **Pull Requests**: Submit improvements

---

## Getting Help

### Documentation

1. **In-app Docs**: Click Docs tab
2. **Code Comments**: Read JSDoc comments
3. **Template Examples**: Check `/src/apps/template/`

### Debugging

1. **Browser Console**: Check for errors
2. **React DevTools**: Inspect components
3. **Network Tab**: Monitor API calls
4. **Zustand DevTools**: Debug state

### Common Questions

**Q: How do I add a new route?** A: Update `allowedRoutes` in app.store.ts

**Q: Where do components go?** A: `/src/components/` for shared,
`/src/apps/[app]/` for app-specific

**Q: How do I style components?** A: Use Tailwind CSS classes exclusively

**Q: How do I manage state?** A: Use Zustand stores in `/src/stores/`

---

## Checklist

Before moving forward, ensure:

- ✅ Dev server runs without errors
- ✅ Welcome screen loads properly
- ✅ Can navigate between apps
- ✅ Created a test component
- ✅ Understand project structure
- ✅ Know where to find documentation
- ✅ Familiar with keyboard shortcuts
- ✅ Code quality checks pass

---

## You're Ready!

You now have STELS running and understand the basics. Time to build something
amazing!

**What to build next?**

- Create a custom trading dashboard
- Build a data visualization tool
- Develop an autonomous agent
- Design a workflow automation system

The platform is yours—start creating! 🚀

---

_© 2025 Gliesereum Ukraine. All rights reserved._
