# Store Architecture

## Overview

STELS uses **Zustand** for state management with a **modular architecture**
where each application has its own store.

## Structure

```
src/
├── stores/
│   └── modules/              # Global stores only
│       ├── app.store.ts      # Routing, network status, sync
│       ├── auth.store.ts     # Wallet, authentication, connection
│       └── theme.store.ts    # Theme management
│
├── apps/
│   ├── Canvas/
│   │   └── store.ts          # Canvas UI + Panel management
│   ├── Editor/
│   │   └── store.ts          # Worker/Protocol management
│   ├── Markets/
│   │   └── store.ts          # Market filters & state
│   ├── Scanner/
│   │   └── store.ts          # Scanner filters & state
│   ├── Fred/
│   │   └── store.ts          # Indicators filters & state
│   └── OrderBook/
│       └── store.ts          # OrderBook preferences
```

## Store Types

### Global Stores (src/stores/modules/)

These stores contain **application-wide state** that is shared across multiple
features:

#### 1. **app.store.ts**

- Routing (`currentRoute`, `allowedRoutes`)
- Network status monitoring
- Data synchronization state
- App versioning

```typescript
import { useAppStore } from "@/stores";

const { currentRoute, setRoute } = useAppStore();
```

#### 2. **auth.store.ts**

- Wallet management (create/import)
- Network selection (testnet/mainnet)
- Connection session (WebSocket)
- Developer mode

```typescript
import { useAuthStore } from "@/stores";

const { wallet, isAuthenticated, connectToNode } = useAuthStore();
```

#### 3. **theme.store.ts**

- Theme mode (light/dark/system)
- Resolved theme
- Theme persistence

```typescript
import { useThemeStore } from "@/stores";

const { theme, setTheme, toggleTheme } = useThemeStore();
```

### Application Stores (src/apps/)

Each application has its **own store** located in its directory:

#### 1. **Canvas Store** (`apps/Canvas/store.ts`)

Manages Canvas workspace and panel system:

```typescript
import { useCanvasStore } from "@/apps/Canvas/store";

// Widget Store UI
const { ui, toggleWidgetStore } = useCanvasStore();

// Panel Management
const { panels, createPanel, setActivePanel } = useCanvasStore();
```

**Features**:

- Widget Store UI state (open/closed, categories, search)
- Panel CRUD operations
- Panel data (nodes, edges, viewport)
- Panel switching and persistence

#### 2. **Editor Store** (`apps/Editor/store.ts`)

Manages AMI Workers and Protocols:

```typescript
import { useEditorStore, type Worker } from "@/apps/Editor/store";

const { workers, listWorkers, updateWorker } = useEditorStore();
```

**Features**:

- Workers list and CRUD operations
- Worker script management
- API integration with backend

#### 3. **Markets Store** (`apps/Markets/store.ts`)

Manages market data filters:

```typescript
import { useMarketsStore } from "@/apps/Markets/store";

const { searchTerm, selectedExchanges, toggleExchange } = useMarketsStore();
```

**Features**:

- Search and filtering
- Exchange/symbol selection
- Sorting preferences
- View mode (table/grid)

#### 4. **Scanner Store** (`apps/Scanner/store.ts`)

Manages wallet scanner state:

```typescript
import { useScannerStore } from "@/apps/Scanner/store";

const { selectedWalletAddress, filterByConnection } = useScannerStore();
```

**Features**:

- Wallet selection
- Connection/activity filters
- Sorting and view preferences
- Expandable sections state

#### 5. **Fred Store** (`apps/Fred/store.ts`)

Manages economic indicators state:

```typescript
import { useFredStore } from "@/apps/Fred/store";

const { selectedCountry, selectedCategory, clearFilters } = useFredStore();
```

**Features**:

- Country/category filters
- Search functionality
- Indicator comparison
- Favorite indicators

#### 6. **OrderBook Store** (`apps/OrderBook/store.ts`)

Manages order book preferences:

```typescript
import { useOrderBookStore } from "@/apps/OrderBook/store";

const { showScales, depth, toggleScales } = useOrderBookStore();
```

**Features**:

- Display preferences (scales, volume bars)
- Order book depth
- Large order highlighting
- Auto-refresh settings

## Best Practices

### 1. **Colocation**

Keep stores close to where they're used:

```
apps/Canvas/
  ├── Flow.tsx
  ├── FlowWithPanels.tsx
  ├── MacOSNode.tsx
  └── store.ts              ← Canvas-specific state
```

### 2. **Selective Exports**

Export specific selectors for better performance:

```typescript
// ✅ Good - selective subscription
const name = useCanvasStore((state) => state.panels.panels[0].name);

// ❌ Bad - subscribes to entire state
const { panels } = useCanvasStore();
```

### 3. **Custom Hooks**

Create custom hooks for common patterns:

```typescript
// In store.ts
export const usePanelActions = () =>
  useCanvasStore((state) => ({
    createPanel: state.createPanel,
    deletePanel: state.deletePanel,
    updatePanel: state.updatePanel,
  }));

// In component
const { createPanel, deletePanel } = usePanelActions();
```

### 4. **Persistence**

Use Zustand `persist` middleware for localStorage:

```typescript
export const useCanvasStore = create<CanvasStore>()(
  devtools(
    persist(
      (set, get) => ({/* ... */}),
      {
        name: "canvas-store",
        partialize: (state) => ({
          panels: state.panels, // Only persist panels
        }),
      },
    ),
  ),
);
```

### 5. **DevTools**

All stores use Zustand DevTools for debugging:

```typescript
devtools(
  (set, get) => ({/* ... */}),
  { name: "Canvas Store" }, // Friendly name in DevTools
);
```

## Migration Guide

### Before (Old Structure)

```typescript
// Old import
import { useCanvasUIStore } from "@/stores/modules/canvas-ui.store";
import { usePanelStore } from "@/stores/modules/panel.store";

const { isOpen, toggleWidgetStore } = useCanvasUIStore();
const { panels, createPanel } = usePanelStore();
```

### After (New Structure)

```typescript
// New import - single store
import { useCanvasStore } from "@/apps/Canvas/store";

const isOpen = useCanvasStore((state) => state.ui.isOpen);
const toggleWidgetStore = useCanvasStore((state) => state.toggleWidgetStore);
const panels = useCanvasStore((state) => state.panels.panels);
const createPanel = useCanvasStore((state) => state.createPanel);
```

## Benefits

1. ✅ **Better Organization** - Store lives with the app it serves
2. ✅ **Easier Navigation** - Developers can find everything in one place
3. ✅ **Better Scalability** - Each app is self-contained
4. ✅ **Clearer Dependencies** - Explicit imports show relationships
5. ✅ **Simpler Testing** - Mock only what you need
6. ✅ **Less Global State** - Reduces coupling between apps

## Store Naming Convention

- Global stores: `use[Domain]Store` (e.g., `useAppStore`, `useAuthStore`)
- App stores: Located in app folder, exported from `index.ts`
- Custom hooks: `use[Domain][Feature]` (e.g., `usePanelActions`)

## State Management Principles

1. **Single Responsibility** - Each store manages one domain
2. **Immutability** - Use Zustand's `set` properly
3. **Selectors** - Use selective subscriptions to avoid re-renders
4. **Actions** - Keep business logic in store actions
5. **Types** - Full TypeScript coverage with explicit types
