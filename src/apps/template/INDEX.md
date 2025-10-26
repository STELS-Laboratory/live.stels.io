# 📦 STELS App Template - Complete Package

Production-ready starter template for creating new applications in the STELS
platform.

## 📁 What's Included

```
template/
├── 📄 Core Files
│   ├── index.ts                    # Module exports
│   ├── template-app.tsx            # Main React component with mobile support
│   ├── store.ts                    # Zustand state management with persistence
│   ├── types.ts                    # TypeScript type definitions
│   ├── constants.ts                # App-specific constants
│   └── utils.ts                    # Utility functions
│
├── 📁 Examples
│   ├── components/
│   │   └── example-component.tsx   # Component pattern example
│   └── hooks/
│       └── use-example.ts          # Custom hook examples
│
└── 📚 Documentation
    ├── README.md                   # Main documentation
    ├── QUICKSTART.md               # 5-minute setup guide
    ├── INTEGRATION.md              # Step-by-step integration
    ├── PATTERNS.md                 # Common code patterns
    └── INDEX.md                    # This file
```

## 🚀 Quick Start

**3-step process:**

1. **Copy template**
   ```bash
   cd src/apps/
   cp -r template your-app
   ```

2. **Rename files and update code**
   - Rename `template-app.tsx` → `your-app.tsx`
   - Update component names and exports
   - Customize functionality

3. **Integrate into system** (6 files)
   - Add to `allowedRoutes` in app.store.ts
   - Add to `DEV_TOOLS` in app_tabs.tsx
   - Add to `systemNav` in layout.tsx
   - Add lazy import in App.tsx
   - Add keyboard shortcut in app_shortcuts.tsx
   - Test navigation

**Full guide:** See `QUICKSTART.md`

## 📖 Documentation Files

| File               | Purpose                  | When to Use                  |
| ------------------ | ------------------------ | ---------------------------- |
| **README.md**      | Complete documentation   | Reference during development |
| **QUICKSTART.md**  | 5-minute setup           | First-time app creation      |
| **INTEGRATION.md** | System integration steps | Connecting app to STELS      |
| **PATTERNS.md**    | Code patterns library    | Building features            |
| **INDEX.md**       | This overview            | Understanding template       |

## ✨ Features

### ✅ Production Ready

- Complete TypeScript typing
- Zustand state management
- Error boundaries
- Loading states
- Mobile warnings
- Keyboard shortcuts
- Professional UI/UX

### ✅ STELS Standards Compliant

- Strict TypeScript (no `any`)
- Functional components only
- Tailwind CSS v4 utilities
- shadcn/ui components
- Accessibility (ARIA)
- JSDoc documentation
- Professional English

### ✅ Developer Experience

- Hot module replacement
- Type-safe APIs
- Code examples
- Pattern library
- Integration guide
- Best practices

## 🎯 App Types Supported

| Type               | Description             | Examples                           |
| ------------------ | ----------------------- | ---------------------------------- |
| **Canvas-Style**   | Visual/Interactive      | ReactFlow, drag-and-drop           |
| **Editor-Style**   | Code/Text editing       | Monaco editor, syntax highlighting |
| **Data-Intensive** | Complex data operations | Tables, charts, analytics          |
| **Docs-Style**     | Documentation viewer    | Markdown, search, navigation       |

## 🔧 Core Technologies

- **React 18+** - Functional components with Hooks
- **TypeScript** - Strict mode, full typing
- **Zustand** - State management
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **Lucide React** - Icon system

## 📊 Template Structure

### Core Files (Required)

**index.ts** - Module entry point

- Exports default component
- Exports types and store
- Clean public API

**template-app.tsx** - Main component

- Mobile detection
- Loading/error states
- Professional UI
- Accessibility

**store.ts** - State management

- Zustand with devtools
- Persistence support
- Hydration handling
- Typed actions

**types.ts** - Type definitions

- Data structures
- Component props
- API responses
- Store types

### Support Files (Optional)

**constants.ts** - Static values

- Configuration
- API endpoints
- Color schemes
- Keyboard shortcuts

**utils.ts** - Helper functions

- Formatting
- Validation
- Calculations
- Sorting/filtering

**components/** - Sub-components

- Reusable UI pieces
- Feature modules
- Complex widgets

**hooks/** - Custom hooks

- Business logic
- Data fetching
- Side effects
- Form handling

## 🎨 Design System

### Colors

```typescript
// Primary
"text-amber-500";
"bg-amber-500/10";
"border-amber-500/30";

// Success
"text-green-700 dark:text-green-600";
"bg-green-500/10";

// Error
"text-red-700 dark:text-red-400";
"bg-red-500/10";

// Info
"text-blue-700 dark:text-blue-400";
"bg-blue-500/10";
```

### Typography

```typescript
// Headings
"text-3xl font-bold"; // H1
"text-2xl font-bold"; // H2
"text-xl font-semibold"; // H3

// Body
"text-sm text-foreground"; // Normal
"text-xs text-muted-foreground"; // Small
"font-mono"; // Code
```

### Spacing

```typescript
// Padding
"p-4"; // Medium (16px)
"p-6"; // Large (24px)
"p-2"; // Small (8px)

// Gap
"gap-4"; // Medium
"gap-2"; // Small
"gap-6"; // Large
```

## 🔑 Integration Checklist

Quick checklist to verify integration:

```
Registration:
[ ] Added to allowedRoutes (app.store.ts)
[ ] Added to DEV_TOOLS (app_tabs.tsx)
[ ] Added to systemNav (layout.tsx)
[ ] Added to getAppName (layout.tsx)

Routing:
[ ] Lazy import added (App.tsx)
[ ] Case added to renderMainContent (App.tsx)
[ ] Keyboard shortcut added (app_shortcuts.tsx)

Testing:
[ ] App loads without errors
[ ] Navigation works (sidebar, tabs)
[ ] Keyboard shortcut works (⌘⇧Letter)
[ ] Mobile warning displays
[ ] Store persists data
[ ] Theme switching works
```

## 🎓 Learning Path

**Day 1: Setup**

- Copy template
- Rename files
- Basic integration
- Test navigation

**Day 2: Core Features**

- Define data types
- Implement store actions
- Build main UI
- Add error handling

**Day 3: Polish**

- Add animations
- Improve UX
- Write documentation
- Performance optimization

## 💡 Best Practices

1. **TypeScript First** - Define types before implementation
2. **Small Components** - Break down complex UI
3. **Custom Hooks** - Extract business logic
4. **Error Boundaries** - Prevent crashes
5. **Loading States** - Better UX
6. **Mobile Check** - Desktop warning
7. **Keyboard Shortcuts** - Power user features
8. **Documentation** - Help future developers

## 🐛 Troubleshooting

**App doesn't load?**

- Check allowedRoutes includes your key
- Verify lazy import syntax
- Check browser console for errors

**Navigation doesn't work?**

- Ensure route keys match everywhere
- Check getAppName includes your route
- Verify systemNav configuration

**Keyboard shortcut not working?**

- Check for key conflicts
- Verify app_shortcuts.tsx updated
- Test with both Cmd and Ctrl

**Store not persisting?**

- Check persist configuration
- Verify partialize function
- Check localStorage in DevTools

## 📞 Support

- **Review existing apps** for patterns
- **Check workspace rules** for standards
- **Test incrementally** to catch issues early
- **Follow TypeScript errors** for guidance

## 🎉 Success Criteria

Your app is ready when:

- ✅ Loads without errors
- ✅ Navigation works from all entry points
- ✅ Keyboard shortcuts functional
- ✅ Mobile warning displays correctly
- ✅ Store persists and restores data
- ✅ Theme switching works
- ✅ No TypeScript errors
- ✅ No linter warnings
- ✅ Tooltips configured
- ✅ Professional UI/UX

---

**Template Version:** 1.0\
**Platform:** STELS Web3\
**Created:** October 2025\
**License:** Gliesereum Ukraine

**Start building your app now!** 🚀
