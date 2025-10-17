# STELS Web3 OS - State Management Guide

## Overview

STELS Web3 OS uses **Zustand** as its primary state management solution. The
architecture separates global application state from module-specific state, with
persistence and debugging capabilities.

## Store Architecture

### Global Stores

**Location:** `src/stores/modules/`

These stores manage cross-application state and are available throughout the
entire application.

#### 1. App Store (`app.store.ts`)

**Responsibility:** Application-wide state, routing, and network status

**State:**

```typescript
interface AppState {
  // Version and maintenance
  version: string;
  upgrade: boolean;

  // Routing
  allowedRoutes: string[];
  currentRoute: string;
  routeLoading: boolean;

  // Network status
  online: boolean;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;

  // Sync state
  hasUpdates: boolean;
  lastSyncTimestamp: number;
  localDataVersion: string;
  remoteDataVersion: string;
  isSyncing: boolean;
  syncError: string | null;
}
```

**Actions:**

```typescript
interface AppActions {
  setVersion: (version: string) => void;
  setUpgrade: (value: boolean) => void;
  setRoute: (route: string) => void;
  setRouteLoading: (value: boolean) => void;

  updateStatus: () => void;

  checkForUpdates: () => Promise<boolean>;
  syncData: () => Promise<void>;
  markDataAsUpdated: (version: string) => void;
  dismissUpdates: () => void;
  setSyncError: (error: string | null) => void;
}
```

**Usage:**

```typescript
import { useAppStore } from "@/stores";

function MyComponent() {
  const currentRoute = useAppStore((state) => state.currentRoute);
  const setRoute = useAppStore((state) => state.setRoute);

  return (
    <button onClick={() => setRoute("markets")}>
      Go to Markets
    </button>
  );
}
```

#### 2. Auth Store (`auth.store.ts`)

**Responsibility:** Authentication, wallet management, and network connections

**State:**

```typescript
interface AuthState {
  // Wallet
  wallet: Wallet | null;
  isWalletCreated: boolean;

  // Network
  selectedNetwork: NetworkConfig | null;
  availableNetworks: NetworkConfig[];

  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  connectionSession: ConnectionSession | null;
  connectionError: string | null;

  // User preferences
  developerMode: boolean;

  // UI state
  isAuthenticated: boolean;
  showNetworkSelector: boolean;
  showSecurityWarning: boolean;
  showSessionExpiredModal: boolean;

  _hasHydrated: boolean;
}
```

**Actions:**

```typescript
interface AuthActions {
  // Wallet
  createNewWallet: () => void;
  importExistingWallet: (privateKey: string) => boolean;
  resetWallet: () => void;

  // Network
  setAvailableNetworks: (networks: NetworkConfig[]) => void;
  selectNetwork: (network: NetworkConfig) => void;

  // Connection
  connectToNode: () => Promise<boolean>;
  disconnectFromNode: () => Promise<void>;
  restoreConnection: () => Promise<boolean>;

  // Preferences
  setDeveloperMode: (enabled: boolean) => void;

  // UI
  setShowNetworkSelector: (show: boolean) => void;
  setShowSecurityWarning: (show: boolean) => void;
  setShowSessionExpiredModal: (show: boolean) => void;
  clearConnectionError: () => void;

  // Utility
  resetAuth: () => Promise<void>;
}
```

**Connection Flow:**

```typescript
// 1. Create/Import wallet
createNewWallet();

// 2. Select network
selectNetwork(networkConfig);

// 3. Connect
const success = await connectToNode();

// 4. Use connection
const { connectionSession } = useAuthStore.getState();
```

**Persistence:**

```typescript
// Persisted to localStorage["auth-store"]:
{
  wallet: Wallet,
  selectedNetwork: NetworkConfig,
  isWalletCreated: boolean,
  developerMode: boolean
}

// Not persisted (session-only):
{
  isConnected,
  connectionSession,
  connectionError,
  UI flags
}
```

#### 3. Accounts Store (`accounts.store.ts`)

**Responsibility:** Exchange account management and transaction signing

**State:**

```typescript
interface AccountsState {
  accounts: StoredAccount[];
  activeAccountId: string | null;
  _hasHydrated: boolean;
}

interface StoredAccount {
  id: string;
  createdAt: number;
  updatedAt: number;
  account: AccountRequest;
  publicKey: string;
  signature: string;
  address: string;
}
```

**Actions:**

```typescript
interface AccountsActions {
  addAccount: (account: AccountRequest, wallet: Wallet) => StoredAccount;
  updateAccount: (
    id: string,
    account: Partial<AccountRequest>,
    wallet: Wallet,
  ) => boolean;
  removeAccount: (id: string) => void;
  setActiveAccount: (id: string) => void;
  getAccount: (id: string) => StoredAccount | undefined;
  getActiveAccount: () => StoredAccount | undefined;

  signTransaction: (
    request: TransactionRequest,
    wallet: Wallet,
  ) => SignedTransaction;

  sendAccountToServer: (
    account: AccountRequest,
    wallet: Wallet,
    session: string,
    apiUrl: string,
  ) => Promise<boolean>;

  fetchAccountsFromServer: (
    address: string,
    session: string,
    apiUrl: string,
  ) => Promise<void>;

  clearAllAccounts: () => void;
}
```

**Usage:**

```typescript
const { accounts, activeAccountId, setActiveAccount } = useAccountsStore();

// Add account
const account = addAccount({
  nid: "nid-1234",
  exchange: "bybit",
  apiKey: "...",
  secret: "...",
  status: "active",
}, wallet);

// Sign transaction
const signedTx = signTransaction({
  to: "g...",
  amount: 1.5,
  fee: 0.001,
}, wallet);
```

#### 4. Theme Store (`theme.store.ts`)

**Responsibility:** Theme management and system preference detection

**State:**

```typescript
interface ThemeState {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  _hasHydrated: boolean;
}
```

**Actions:**

```typescript
interface ThemeActions {
  toggleTheme: () => void; // Cycles: system → light → dark → system
  setTheme: (theme: ThemeMode) => void;
  setResolvedTheme: (theme: ResolvedTheme) => void;
  setHasHydrated: (state: boolean) => void;
}
```

**Usage:**

```typescript
import { useTheme } from "@/hooks/useTheme";

function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current: {theme} (Resolved: {resolvedTheme})
    </button>
  );
}
```

### Module Stores

**Location:** `src/apps/*/store.ts`

Module stores manage state specific to individual applications.

#### Canvas Store

**Location:** `src/apps/Canvas/store.ts`

**State Structure:**

```typescript
interface CanvasStoreState {
  // Widget Store UI
  ui: {
    isOpen: boolean;
    activeCategory: string;
    searchTerm: string;
    expandedExchanges: Record<string, boolean>;
    expandedAssets: Record<string, boolean>;
    groupingMode: "exchange" | "asset";
  };

  // Panel System
  panels: {
    panels: Panel[];
    activePanelId: string | null;
    panelData: Record<string, PanelData>;
  };
}
```

**Key Actions:**

```typescript
// Widget Store UI
toggleWidgetStore: () => void;
setActiveCategory: (category: string) => void;
setSearchTerm: (term: string) => void;
toggleExchange: (exchange: string) => void;
setGroupingMode: (mode: GroupingMode) => void;

// Panel Management
createPanel: (name: string, description?: string) => string;
deletePanel: (panelId: string) => void;
updatePanel: (panelId: string, updates: Partial<Panel>) => void;
duplicatePanel: (panelId: string) => string;
setActivePanel: (panelId: string) => void;
getActivePanel: () => Panel | null;
updatePanelData: (panelId: string, data: Partial<PanelData>) => void;
getPanelData: (panelId: string) => PanelData | null;
```

**Persistence:**

```typescript
persist(
  // ...
  {
    name: "canvas-store",
    partialize: (state) => ({
      panels: state.panels, // Only persist panel data
    }),
  },
);
```

**Usage:**

```typescript
const panels = useCanvasStore(state => state.panels.panels);
const createPanel = useCanvasStore(state => state.createPanel);
const updatePanelData = useCanvasStore(state => state.updatePanelData);

// Create panel
const panelId = createPanel("Trading Panel", "Main trading workspace");

// Update panel data
updatePanelData(panelId, {
  nodes: [...],
  edges: [...],
  viewport: { x: 0, y: 0, zoom: 1 }
});
```

#### Editor Store

**Location:** `src/apps/Editor/store.ts`

**State:**

```typescript
interface EditorStoreState {
  workers: Worker[];
  workersLoading: boolean;
  workersError: string | null;
  worker: {
    isLoading: boolean;
    isEditor: boolean;
  };
}
```

**Actions:**

```typescript
listWorkers: () => Promise<void>;
createWorker: (request: WorkerCreateRequest) => Promise<Worker | null>;
updateWorker: (workerData: Worker) => Promise<Worker | null>;
getLeaderInfo: (workerId: string) => Promise<LeaderInfo | null>;
getWorkerStats: () => Promise<WorkerStats[]>;
stopAllWorkers: () => Promise<{ stopped, failed, total }>;
clearError: () => void;
```

**No Persistence:** Worker data loaded fresh from API on each session.

#### Markets Store

**Location:** `src/apps/Markets/store.ts`

**State:**

```typescript
interface MarketsStoreState {
  searchTerm: string;
  selectedExchanges: string[];
  selectedSymbols: string[];
  sortDirection: "asc" | "desc";
  sortField: "price" | "volume" | "change" | "market";
  viewMode: "table" | "grid";
}
```

**Persistence:** All state persisted to `localStorage["markets-store"]`

#### OrderBook Store

**Location:** `src/apps/OrderBook/store.ts`

**State:**

```typescript
interface OrderBookStoreState {
  selectedMarket: string;
  selectedExchange: string;
  showScales: boolean;
  showVolumeBars: boolean;
  depth: 10 | 20 | 50;
  highlightLargeOrders: boolean;
  largeOrderThreshold: number;
  autoRefreshInterval: number;
  autoRefresh: boolean;
  lastUpdate: number;
}
```

#### Scanner Store

**Location:** `src/apps/Scanner/store.ts`

**State:**

```typescript
interface ScannerStoreState {
  selectedWalletAddress: string | null;
  filterByConnection: "all" | "connected" | "disconnected";
  filterByActivity: "all" | "active" | "inactive";
  searchTerm: string;
  sortField: "equity" | "pnl" | "positions" | "exchange";
  sortDirection: "asc" | "desc";
  viewMode: "cards" | "table";
  expandedSections: Record<string, {
    positions: boolean;
    orders: boolean;
    balances: boolean;
    protocol: boolean;
  }>;
}
```

#### Fred Store

**Location:** `src/apps/Fred/store.ts`

**State:**

```typescript
interface FredStoreState {
  selectedCountry: string;
  selectedCategory: string;
  searchTerm: string;
  activeTab: "overview" | "indicators" | "comparison";
  sortDirection: "asc" | "desc";
  sortField: "value" | "name" | "date" | "country";
  comparisonIndicator: string;
  favoriteIndicators: string[];
}
```

#### Welcome Store

**Location:** `src/apps/Welcome/store.ts`

**State:**

```typescript
interface WelcomeStoreState {
  searchTerm: string;
  selectedCategory: AppCategory;
  viewMode: "grid" | "list";
  sortBy: "name" | "category" | "popular";
  recentApps: string[]; // Last 5 launched apps
  favoriteApps: string[]; // User favorites
  showOnlyFeatured: boolean;
}
```

## Store Patterns

### Creating a New Store

**Template:**

```typescript
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface MyStoreState {
  // State properties
  value: string;
  count: number;
}

interface MyStoreActions {
  // Action functions
  setValue: (value: string) => void;
  increment: () => void;
  reset: () => void;
}

export type MyStore = MyStoreState & MyStoreActions;

export const useMyStore = create<MyStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        value: "",
        count: 0,

        // Actions
        setValue: (value: string) => {
          set({ value });
        },

        increment: () => {
          set((state) => ({ count: state.count + 1 }));
        },

        reset: () => {
          set({ value: "", count: 0 });
        },
      }),
      {
        name: "my-store",
        // Optional: partial persistence
        partialize: (state) => ({
          value: state.value,
          count: state.count,
        }),
      },
    ),
    {
      name: "My Store", // DevTools display name
    },
  ),
);
```

### Using Stores in Components

**Pattern 1: Select Specific State**

```typescript
function Component() {
  // Only re-renders when 'value' changes
  const value = useMyStore((state) => state.value);

  return <div>{value}</div>;
}
```

**Pattern 2: Select Multiple Values**

```typescript
function Component() {
  const { value, count } = useMyStore((state) => ({
    value: state.value,
    count: state.count,
  }));

  return <div>{value}: {count}</div>;
}
```

**Pattern 3: Select Actions Only**

```typescript
function Component() {
  const setValue = useMyStore((state) => state.setValue);
  const increment = useMyStore((state) => state.increment);

  // Component doesn't re-render on state changes
  return (
    <div>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

**Pattern 4: Custom Selector Hooks**

```typescript
// In store file:
export const useMyStoreValue = () => useMyStore((state) => state.value);
export const useMyStoreActions = () =>
  useMyStore((state) => ({
    setValue: state.setValue,
    increment: state.increment,
    reset: state.reset,
  }));

// In component:
function Component() {
  const value = useMyStoreValue();
  const { setValue, increment } = useMyStoreActions();
}
```

### Accessing Stores Outside React

```typescript
// Get current state
const state = useMyStore.getState();
console.log(state.value);

// Set state
useMyStore.setState({ value: "new value" });

// Subscribe to changes
const unsubscribe = useMyStore.subscribe(
  (state) => console.log("State changed:", state),
);

// Later: unsubscribe
unsubscribe();
```

## Persistence Strategy

### LocalStorage Keys

```typescript
"app-store"; // App state
"auth-store"; // Auth state (wallet, network)
"accounts-store"; // Exchange accounts
"theme-store"; // Theme preferences
"canvas-store"; // Canvas panels
"markets-store"; // Markets filters
"orderbook-store"; // OrderBook preferences
"scanner-store"; // Scanner state
"fred-store"; // Fred filters
"welcome-store"; // Welcome preferences
```

### Hydration

**Problem:** State must load from localStorage before rendering

**Solution:** Hydration detection

```typescript
// In store:
_hasHydrated: boolean;

// Middleware automatically sets on load
onRehydrateStorage: (() => (state) => {
  state?._hasHydrated = true;
});

// In component:
const hasHydrated = useMyStore((state) => state._hasHydrated);

if (!hasHydrated) {
  return <Loading />;
}
```

**Global Hydration Hook:**

```typescript
import { useHydration } from "@/hooks/useHydration";

function App() {
  const hasHydrated = useHydration();

  if (!hasHydrated) {
    return <SplashScreen />;
  }

  return <MainApp />;
}
```

### Partial Persistence

**Use Case:** Persist only specific state properties

```typescript
persist(
  (set, get) => ({/* state */}),
  {
    name: "store-name",
    partialize: (state) => ({
      // Only persist these properties
      value: state.value,
      settings: state.settings,
      // Omit: temporaryData, computedValues, etc.
    }),
  },
);
```

### Storage Migration

**Version Detection:**

```typescript
persist(
  (set, get) => ({/* state */}),
  {
    name: "store-name",
    version: 1,
    migrate: (persistedState, version) => {
      if (version === 0) {
        // Migrate from v0 to v1
        return {
          ...persistedState,
          newField: "default value",
        };
      }
      return persistedState;
    },
  },
);
```

## Advanced Patterns

### Computed Values

**Pattern:** Use selectors for derived state

```typescript
// In store:
export const useFilteredItems = () =>
  useMyStore((state) => {
    const { items, searchTerm } = state;
    return items.filter((item) => item.name.includes(searchTerm));
  });

// In component:
const filteredItems = useFilteredItems();
```

**Alternative:** useMemo in component

```typescript
function Component() {
  const items = useMyStore((state) => state.items);
  const searchTerm = useMyStore((state) => state.searchTerm);

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.name.includes(searchTerm));
  }, [items, searchTerm]);
}
```

### Async Actions

**Pattern:** Handle async operations in actions

```typescript
interface MyStoreState {
  data: DataType[];
  loading: boolean;
  error: string | null;
}

interface MyStoreActions {
  fetchData: () => Promise<void>;
}

export const useMyStore = create<MyStore>()(
  devtools((set, get) => ({
    data: [],
    loading: false,
    error: null,

    fetchData: async () => {
      set({ loading: true, error: null });

      try {
        const response = await fetch("/api/data");
        const data = await response.json();
        set({ data, loading: false });
      } catch (error) {
        set({
          error: error.message,
          loading: false,
        });
      }
    },
  })),
);
```

### Cross-Store Communication

**Pattern 1: Direct Access**

```typescript
// In store A
import { useStoreBStore } from "./storeB";

export const useStoreAStore = create<StoreA>()(
  devtools((set, get) => ({
    doSomething: () => {
      const storeB = useStoreBStore.getState();
      console.log(storeB.value);
    },
  })),
);
```

**Pattern 2: Subscribe to Another Store**

```typescript
// In store initialization
useStoreBStore.subscribe((state) => {
  if (state.importantValue) {
    useStoreAStore.setState({ relatedValue: state.importantValue });
  }
});
```

**Pattern 3: Shared Hook**

```typescript
function useCombinedData() {
  const dataA = useStoreA((state) => state.data);
  const dataB = useStoreB((state) => state.data);

  return useMemo(() => {
    return [...dataA, ...dataB];
  }, [dataA, dataB]);
}
```

## WebSocket Store Pattern

**Special Case:** `hooks/useWebSocketStore.ts`

This is a Zustand store that manages WebSocket connection state.

**State:**

```typescript
interface WebSocketState {
  ws: WebSocket | null;
  connection: boolean;
  locked: boolean;
  sessionExpired: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isCleaningUp: boolean;
}
```

**Actions:**

```typescript
connectNode: (config: WebSocketConfig) => void;
handleSessionExpired: () => void;
resetReconnectAttempts: () => void;
resetWebSocketState: () => void;
```

**Integration:**

```typescript
// Used internally by auth flow
const { connectNode, connection } = useWebSocketStore();

// Connect after network selection
connectNode(websocketConfig);

// Monitor connection status
if (connection) {
  console.log("WebSocket connected");
}
```

## Session Storage Bridge

**Hook:** `useSessionStoreSync`

**Purpose:** Bridge between sessionStorage and React state

**Implementation:**

```typescript
function useSessionStoreSync() {
  const [session, setSession] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // Load from sessionStorage
    const loadState = () => {
      const data = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data[key] = JSON.parse(sessionStorage.getItem(key));
        }
      }
      setSession(data);
    };

    loadState();

    // Listen for storage events
    window.addEventListener("storage", loadState);
    return () => window.removeEventListener("storage", loadState);
  }, []);

  return session;
}
```

**Usage:**

```typescript
function Widget() {
  const session = useSessionStoreSync();

  if (!session) return null;

  const ticker = session["channel.path"];
  return <div>{ticker?.raw?.last}</div>;
}
```

## State Synchronization Patterns

### Store → Component

**Automatic Re-render:**

```typescript
const value = useStore((state) => state.value);
// Component re-renders when value changes
```

**Conditional Subscription:**

```typescript
const shouldSubscribe = true;
const value = useStore(
  (state) => shouldSubscribe ? state.value : undefined,
);
```

### Component → Store

**Direct Update:**

```typescript
const setValue = useStore((state) => state.setValue);
setValue("new value");
```

**Batch Update:**

```typescript
useStore.setState({
  value1: "new",
  value2: 123,
  value3: true,
});
```

### Store → LocalStorage

**Automatic via persist middleware:**

```typescript
// Any state change triggers persistence
set({ value: "new" });

// Writes to localStorage["store-name"]
```

### LocalStorage → Store

**Automatic on initialization:**

```typescript
// On app load:
1. Zustand reads localStorage["store-name"]
2. Hydrates store with persisted state
3. Sets _hasHydrated = true
4. App can render
```

### Store → WebSocket

**Send Updates to Backend:**

```typescript
// In action:
updateData: (async (newData) => {
  set({ data: newData });

  // Notify backend
  const { connectionSession } = useAuthStore.getState();
  await fetch(connectionSession.api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stels-session": connectionSession.session,
    },
    body: JSON.stringify({
      webfix: "1.0",
      method: "updateData",
      params: [],
      body: newData,
    }),
  });
});
```

### WebSocket → Store

**Receive Updates from Backend:**

```typescript
// In WebSocket message handler:
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  // Update session storage
  sessionStorage.setItem(message.channel, JSON.stringify(message));

  // Trigger component re-renders via useSessionStoreSync
};
```

## Store Performance Optimization

### Subscription Optimization

**Problem:** Component re-renders too often

**Solution 1: Narrow Selection**

```typescript
// ❌ Bad: Re-renders on any store change
const store = useMyStore();

// ✅ Good: Only re-renders when value changes
const value = useMyStore((state) => state.value);
```

**Solution 2: Shallow Comparison**

```typescript
import shallow from "zustand/shallow";

// Only re-renders when either value changes
const { value1, value2 } = useMyStore(
  (state) => ({ value1: state.value1, value2: state.value2 }),
  shallow,
);
```

### Action Optimization

**Problem:** Action recreated on every render

**Solution: Use useCallback in store**

```typescript
export const useMyStoreActions = () =>
  useMyStore((state) => ({
    setValue: state.setValue,
    increment: state.increment,
  }));

// In component:
const actions = useMyStoreActions();
// 'actions' reference is stable
```

### Large State Optimization

**Pattern: Split Store**

```typescript
// Instead of one large store:
interface LargeStore {
  data1: Data1;
  data2: Data2;
  data3: Data3;
}

// Split into smaller stores:
export const useData1Store = create<Data1Store>(...);
export const useData2Store = create<Data2Store>(...);
export const useData3Store = create<Data3Store>(...);
```

## Debugging

### Redux DevTools

**Access:** Browser extension → Redux tab

**Features:**

- View current state
- Track action history
- Time-travel debugging
- State diff visualization

**Store Names in DevTools:**

- "App Store"
- "Auth Store"
- "Accounts Store"
- "Theme Store"
- "Canvas Store"
- "Editor Store"
- etc.

### Console Logging

```typescript
// Enable store logging (development only)
const useMyStore = create<MyStore>()(
  devtools(
    (set, get) => ({
      action: () => {
        console.log("[MyStore] Before:", get());
        set({ value: "new" });
        console.log("[MyStore] After:", get());
      },
    }),
    {
      name: "My Store",
      trace: true, // Log action traces
    },
  ),
);
```

### State Inspection

```typescript
// Get current state in console
window.useMyStore = useMyStore;

// Then in browser console:
useMyStore.getState();
```

## Common Pitfalls and Solutions

### Pitfall 1: Infinite Re-render Loop

**Problem:**

```typescript
function Component() {
  const data = useStore((state) => state.data);

  useEffect(() => {
    // ❌ This triggers state change → re-render → effect → state change...
    useStore.setState({ data: processData(data) });
  }, [data]);
}
```

**Solution:**

```typescript
function Component() {
  const data = useStore((state) => state.data);

  useEffect(() => {
    // ✅ Only run once
    const processed = processData(data);
    useStore.setState({ data: processed });
  }, []); // Empty deps
}
```

### Pitfall 2: Stale Closure

**Problem:**

```typescript
const count = useStore((state) => state.count);

useEffect(() => {
  const interval = setInterval(() => {
    // ❌ Always uses initial count value
    console.log(count);
  }, 1000);

  return () => clearInterval(interval);
}, []); // Empty deps, count is stale
```

**Solution:**

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // ✅ Always gets latest value
    const currentCount = useStore.getState().count;
    console.log(currentCount);
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

### Pitfall 3: Lost State on Hot Reload

**Problem:** Development state resets on file save

**Solution:** Persist important state

```typescript
persist(
  (set, get) => ({/* state */}),
  { name: "store-name" }, // Survives hot reload
);
```

### Pitfall 4: Race Conditions

**Problem:**

```typescript
// Multiple async actions compete
fetchData1();
fetchData2();
// Which one wins?
```

**Solution: Request ID Pattern**

```typescript
let requestId = 0;

fetchData: async () => {
  const currentRequestId = ++requestId;
  set({ loading: true });
  
  const data = await fetch(...);
  
  // Only update if this is still the latest request
  if (currentRequestId === requestId) {
    set({ data, loading: false });
  }
}
```

## Testing Stores

### Unit Testing Pattern

```typescript
import { act, renderHook } from "@testing-library/react-hooks";
import { useMyStore } from "./store";

describe("MyStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useMyStore.setState({
      value: "",
      count: 0,
    });
  });

  it("should increment count", () => {
    const { result } = renderHook(() => useMyStore());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it("should persist value", () => {
    const { result } = renderHook(() => useMyStore());

    act(() => {
      result.current.setValue("test");
    });

    // Check localStorage
    const stored = JSON.parse(
      localStorage.getItem("my-store"),
    );
    expect(stored.state.value).toBe("test");
  });
});
```

## Migration Guide

### Upgrading Store Structure

**When:** Adding new fields or changing types

**Pattern:**

```typescript
persist(
  (set, get) => ({
    // New field
    newField: "default",

    // Existing fields
    existingField: "value",
  }),
  {
    name: "store-name",
    version: 2, // Increment version
    migrate: (persistedState, version) => {
      if (version < 2) {
        // Add new field to old state
        return {
          ...persistedState,
          newField: "default",
        };
      }
      return persistedState;
    },
  },
);
```

### Renaming Store

**Steps:**

1. Create new store with new name
2. Add migration to read old store
3. Copy data to new store
4. Remove old store from localStorage

```typescript
// In new store:
persist(
  (set, get) => ({
    // State
  }),
  {
    name: "new-store-name",
    onRehydrateStorage: () => (state) => {
      // Migrate from old store
      const oldData = localStorage.getItem("old-store-name");
      if (oldData) {
        const parsed = JSON.parse(oldData);
        set({ ...parsed.state });
        localStorage.removeItem("old-store-name");
      }
    },
  },
);
```

## Best Practices

### Do's

✅ Use narrow selectors for better performance\
✅ Separate state and actions in interfaces\
✅ Use devtools middleware for debugging\
✅ Persist user preferences\
✅ Handle async errors in actions\
✅ Document store purpose and usage\
✅ Use TypeScript strict mode\
✅ Create custom selector hooks

### Don'ts

❌ Don't select entire store unnecessarily\
❌ Don't mutate state directly\
❌ Don't persist sensitive data (passwords, tokens)\
❌ Don't create circular dependencies between stores\
❌ Don't use store for component-local state\
❌ Don't forget to handle loading/error states\
❌ Don't use `any` type for state

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team
