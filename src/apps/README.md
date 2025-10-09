# Applications Architecture

## Overview

Each application in STELS is a **self-contained module** with its own
components, types, utilities, and state management.

## Application Structure

```
apps/
├── Canvas/              # Visual widget editor
│   ├── Flow.tsx
│   ├── FlowWithPanels.tsx
│   ├── MacOSNode.tsx
│   ├── NodeFlow.tsx
│   └── store.ts         ← Canvas-specific state (UI + Panels)
│
├── Editor/              # AMI Protocol editor
│   ├── AMIEditor.tsx
│   ├── AMIEditor/
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── store.ts         ← Editor-specific state (Workers)
│
├── Markets/             # Market data aggregator
│   ├── Markets.tsx
│   ├── components/
│   ├── types.ts
│   ├── utils.ts
│   └── store.ts         ← Markets-specific state (Filters)
│
├── Scanner/             # Wallet scanner
│   ├── Scanner.tsx
│   ├── components/
│   ├── types.ts
│   ├── utils.ts
│   └── store.ts         ← Scanner-specific state (Filters)
│
├── Fred/                # Economic indicators
│   ├── Fred.tsx
│   ├── constants.tsx
│   ├── types.ts
│   ├── utils.ts
│   └── store.ts         ← Fred-specific state (Filters)
│
├── OrderBook/           # Order book analysis
│   ├── OrderBook.tsx
│   ├── constants.ts
│   ├── types.ts
│   ├── utils.ts
│   └── store.ts         ← OrderBook-specific state (Preferences)
│
├── Globe/               # Network visualization
│   └── HeterogenMap/
│
├── Wallet/              # Wallet management
│   └── Wallet.tsx
│
├── Welcome/             # App launcher
│   ├── Welcome.tsx
│   └── applications.tsx
│
├── Layout.tsx           # Root layout
└── Screen.tsx           # Screen wrapper
```

## Module Pattern

Each application follows a consistent pattern:

```
AppName/
├── AppName.tsx          # Main component
├── components/          # App-specific components (optional)
│   ├── Component1.tsx
│   └── Component2.tsx
├── types.ts            # TypeScript definitions
├── utils.ts            # Utility functions
├── constants.ts        # Constants and configs
├── store.ts            # Zustand store (NEW!)
└── index.ts            # Barrel exports
```

## Store Integration

### State Management Layers

```
┌─────────────────────────────────────────────────┐
│                 Global State                     │
│  (app.store, auth.store, theme.store)           │
│  • Routing, Network, Wallet, Theme              │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│              Application State                   │
│  (Canvas, Editor, Markets, etc.)                │
│  • App-specific filters, preferences, UI        │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│               Component State                    │
│  (useState, useReducer)                         │
│  • Temporary UI state, forms, etc.              │
└─────────────────────────────────────────────────┘
```

### Example: Canvas Application

```typescript
// apps/Canvas/store.ts
export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      // Widget Store UI State
      ui: {
        isOpen: false,
        activeCategory: "all",
        searchTerm: "",
        expandedExchanges: {},
        expandedAssets: {},
        groupingMode: "exchange",
      },

      // Panel System State
      panels: {
        panels: [],
        activePanelId: null,
        panelData: {},
      },

      // Actions
      toggleWidgetStore: () => {/* ... */},
      createPanel: (name, description) => {/* ... */},
      // ... more actions
    }),
    {
      name: "canvas-store",
      partialize: (state) => ({
        panels: state.panels, // Only persist panels
      }),
    },
  ),
);
```

## Application Descriptions

### 🎨 Canvas

**Purpose**: Visual widget editor with drag-and-drop interface\
**Key Features**:

- React Flow integration
- Multiple panels (workspaces)
- Auto-connections between widgets
- Drag & drop from Widget Store
- Persistent layouts

**Store**: Widget UI state, Panel management, Viewport state

---

### 💻 Editor (AMI Editor)

**Purpose**: Code editor for AI protocols and workers\
**Key Features**:

- Monaco editor integration
- Protocol/Worker CRUD
- Real-time syntax validation
- Execution status monitoring

**Store**: Workers list, Worker CRUD operations, Loading states

---

### 📊 Markets

**Purpose**: Real-time cryptocurrency market data aggregation\
**Key Features**:

- Multi-exchange aggregation
- Live price updates
- Candlestick charts
- Volume analysis

**Store**: Search filters, Exchange/Symbol selection, Sorting preferences

---

### 🔍 Scanner

**Purpose**: Trading account monitoring and analysis\
**Key Features**:

- Portfolio overview
- Position tracking
- Order management
- Risk metrics

**Store**: Wallet selection, Connection filters, Expandable sections

---

### 📈 Fred

**Purpose**: World Bank economic indicators viewer\
**Key Features**:

- Country-based grouping
- Category filtering
- Indicator comparison
- Historical data

**Store**: Country/Category filters, Search, Comparison state, Favorites

---

### 📖 OrderBook

**Purpose**: Professional order book analysis\
**Key Features**:

- Multi-exchange aggregation
- Liquidity metrics (VWAP, imbalance)
- Large order detection
- Real-time updates

**Store**: Display preferences, Depth settings, Auto-refresh config

---

### 🌍 Globe (HeterogenMap)

**Purpose**: Network node visualization\
**Key Features**:

- 3D Globe with node locations
- Network health metrics
- Geographic distribution

**Store**: None (uses local state)

---

### 👛 Wallet

**Purpose**: Gliesereum wallet management\
**Key Features**:

- Balance viewing
- Private key display
- Network selection

**Store**: None (uses auth.store)

---

### 🏠 Welcome

**Purpose**: Application launcher (App Store)\
**Key Features**:

- App grid display
- Category filtering
- Feature highlights

**Store**: None (uses app.store for routing)

## Routing Integration

All applications integrate with the global routing system:

```typescript
// In any component
import { useAppStore } from "@/stores";
import { navigateTo } from "@/lib/router";

const { currentRoute, setRoute } = useAppStore();

// Navigate programmatically
navigateTo("canvas");
setRoute("markets");
```

Available routes:

- `welcome` - Welcome screen
- `canvas` - Canvas editor
- `editor` - AMI Editor
- `markets` - Market data
- `scanner` - Wallet scanner
- `fred` - Economic indicators
- `orderbook` - Order book
- `network` - Network globe
- `wallet` - Wallet management

## Development Guidelines

### Adding a New Application

1. **Create directory**: `apps/NewApp/`
2. **Create main component**: `NewApp.tsx`
3. **Create store**: `store.ts` (if needed)
4. **Create types**: `types.ts`
5. **Create utils**: `utils.ts`
6. **Create barrel export**: `index.ts`
7. **Register route** in `app.store.ts`
8. **Add to** `App.tsx` routing
9. **Add to** `Layout.tsx` navigation

### Store Best Practices

1. ✅ **Use selectors** - Subscribe only to what you need
2. ✅ **Separate concerns** - UI state vs Business logic
3. ✅ **Persist wisely** - Only persist what's necessary
4. ✅ **DevTools enabled** - All stores should use devtools
5. ✅ **Type everything** - Full TypeScript coverage
6. ✅ **Document actions** - JSDoc for all public methods

### Component Best Practices

1. ✅ **Extract logic** into custom hooks
2. ✅ **Use memo** for expensive renders
3. ✅ **Proper cleanup** in useEffect
4. ✅ **Error boundaries** for resilience
5. ✅ **Accessibility** with ARIA attributes
6. ✅ **Responsive design** for all screen sizes

## Resources

- [Store Architecture](../stores/README.md)
- [Migration Guide](../../MIGRATION_STORE_ARCHITECTURE.md)
- [Canvas Types](../lib/canvas-types.ts)
- [Panel Types](../lib/panel-types.ts)
