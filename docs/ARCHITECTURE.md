# STELS Web3 OS - Architecture Documentation

## System Architecture Overview

STELS Web3 OS is built on a modular, event-driven architecture with real-time
data synchronization through WebSocket connections and persistent state
management using Zustand.

## Architectural Layers

### 1. Presentation Layer (UI Components)

**Responsibility:** User interface rendering and user interaction handling

**Structure:**

```
src/components/
├── ui/              # Primitive UI components (shadcn/ui)
├── auth/            # Authentication flow components
├── editor/          # Code editor components
├── main/            # Core app components
├── notifications/   # Alert and notification system
├── panels/          # Canvas panel management
└── widgets/         # Trading data widgets
```

**Key Characteristics:**

- Functional React components
- TypeScript strict mode
- Tailwind CSS v4 styling
- Responsive mobile-first design
- Accessibility compliant (ARIA attributes)

### 2. Application Layer (Business Logic)

**Responsibility:** Application-specific features and workflows

**Structure:**

```
src/apps/
├── Canvas/         # Visual workspace application
├── Editor/         # Algorithmic trading IDE
├── Markets/        # Multi-exchange terminal
├── OrderBook/      # Order book aggregator
├── Scanner/        # Portfolio analyzer
├── Wallet/         # Blockchain wallet
├── Fred/           # Economic indicators
├── Globe/          # Network visualization
└── Welcome/        # Application launcher
```

**Module Architecture Pattern:**

```
AppModule/
├── index.ts           # Public exports
├── ComponentName.tsx  # Main component
├── store.ts           # Module-specific Zustand store
├── types.ts           # TypeScript definitions
├── utils.ts           # Utility functions
├── constants.ts       # Constants and configuration
└── components/        # Sub-components
    ├── Component1.tsx
    ├── Component2.tsx
    └── index.ts
```

### 3. State Management Layer

**Responsibility:** Global and domain-specific state management

**Architecture:**

```
State Management
├── Global Stores (src/stores/modules/)
│   ├── app.store.ts        # Application state
│   ├── auth.store.ts       # Authentication state
│   ├── accounts.store.ts   # Exchange accounts
│   └── theme.store.ts      # Theme preferences
│
└── Module Stores (src/apps/*/store.ts)
    ├── Canvas Store         # Panel and widget UI
    ├── Editor Store         # Worker management
    ├── Markets Store        # Market filters
    ├── OrderBook Store      # Display preferences
    ├── Scanner Store        # Filter state
    ├── Fred Store           # Indicator filters
    └── Welcome Store        # App launcher state
```

**Store Pattern:**

```typescript
// Global stores use persist middleware
export const useGlobalStore = create<StoreType>()(
  devtools(
    persist(
      (set, get) => ({
        // State and actions
      }),
      { name: "store-name" },
    ),
    { name: "Store Name" },
  ),
);

// Module stores may or may not persist
export const useModuleStore = create<StoreType>()(
  devtools(
    (set, get) => ({
      // State and actions
    }),
    { name: "Module Store" },
  ),
);
```

### 4. Data Access Layer

**Responsibility:** Real-time data synchronization and API communication

**Components:**

#### WebSocket Manager (`hooks/useWebSocketStore.ts`)

- Single WebSocket connection per session
- Automatic reconnection logic (5 attempts, exponential backoff)
- Message batching (200ms debounce)
- Session expiration detection
- Connection state management

**Connection Flow:**

```
1. Authentication → 2. Network Selection → 3. WebSocket Connect
       ↓                      ↓                       ↓
   Wallet Setup        API Endpoint Setup     Session Established
       ↓                      ↓                       ↓
   Store Session         Store Connection      Real-time Data Flow
```

#### Session Storage Sync (`hooks/useSessionStoreSync.ts`)

- Bridges WebSocket data to React components
- Efficient update mechanism
- Type-safe session access
- Cross-tab synchronization

#### API Client Pattern

```typescript
async function apiCall(method: string, body: unknown): Promise<Response> {
  const { connectionSession } = useAuthStore.getState();

  const response = await fetch(connectionSession.api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stels-session": connectionSession.session,
    },
    body: JSON.stringify({
      webfix: "1.0",
      method,
      params: [],
      body,
    }),
  });

  return response.json();
}
```

### 5. Blockchain Layer

**Responsibility:** Cryptographic operations and blockchain interaction

**Location:** `src/lib/gliesereum/`

**Components:**

- `wallet.ts` - Wallet creation, import, address validation
- `crypto.ts` - Signature, verification, hashing
- `validation.ts` - Input validation and sanitization
- `types.ts` - Type definitions

**Architecture:**

```
Blockchain Layer
├── Wallet Management
│   ├── Key Generation (secp256k1)
│   ├── Address Derivation (Base58Check)
│   └── Card Number (Luhn algorithm)
│
├── Transaction Creation
│   ├── Basic Transactions
│   ├── Smart Transactions (multi-op)
│   └── Multi-Signature (Cosign)
│
└── Cryptographic Primitives
    ├── ECDSA Sign/Verify
    ├── SHA-256 Hashing
    ├── Deterministic Serialization
    └── Constant-Time Comparison
```

## Data Flow Architecture

### Unidirectional Data Flow

```
User Action → Event Handler → State Update → Re-render
                    ↓
              WebSocket Send (optional)
                    ↓
              Backend Processing
                    ↓
          WebSocket Message Received
                    ↓
          Session Storage Update
                    ↓
          React State Update
                    ↓
              Component Re-render
```

### State Synchronization

**LocalStorage Persistence:**

```
Zustand Store (Memory)
       ↓
   persist middleware
       ↓
   localStorage
       ↓
   Hydration on load
```

**Session Data Flow:**

```
WebSocket Message
       ↓
   Message Handler
       ↓
   Batch Accumulation (200ms)
       ↓
   Session Storage Update
       ↓
   useSessionStoreSync Hook
       ↓
   Component Re-render
```

## Canvas Architecture

### Panel System Design

**Concept:** Multiple independent workspaces, each with its own nodes, edges,
and viewport.

**Structure:**

```typescript
CanvasStore
├── panels: Panel[]              # Panel metadata
├── activePanelId: string        # Currently active panel
└── panelData: Record<string, PanelData>
    └── PanelData
        ├── panelId: string
        ├── nodes: FlowNode[]    # ReactFlow nodes
        ├── edges: Edge[]        # Manual connections
        └── viewport: Viewport   # Camera position
```

**Panel Lifecycle:**

1. **Creation** - Initialize with default settings
2. **Activation** - Load panel data, restore viewport
3. **Interaction** - Add/remove nodes, create edges
4. **Persistence** - Auto-save to localStorage (300ms debounce)
5. **Switching** - Smooth transition with loading state

**Auto-Connection System:**

```typescript
// Analyzes nodes and creates automatic edges
useAutoConnections(nodes, manualEdges) → autoEdges

// Rendering combines both:
allEdges = [...manualEdges, ...autoEdges]
```

**Widget Integration:**

```
Widget Store → Drag Widget → Drop on Canvas → Create Node
                                    ↓
                        Attach Session Data Channel
                                    ↓
                        NodeFlow Renders Widget
                                    ↓
                        Real-time Data Updates
```

## AMI Worker Architecture

### Execution Model

**Worker Types:**

1. **Parallel Execution**
   - Runs on all available nodes simultaneously
   - Use case: Data collection, monitoring
   - No coordination needed

2. **Leader Election**
   - Distributed consensus (one active node)
   - Leader lease with auto-renewal
   - Automatic failover on leader failure
   - Use case: Trading strategies, singleton tasks

3. **Exclusive Execution**
   - Assigned to specific node
   - Use case: Node-specific maintenance

**Priority System:**

```
Critical:  50 max errors, 1ms retry delay
High:      20 max errors, 10ms retry delay
Normal:    10 max errors, 100ms retry delay
Low:       5 max errors, 1s retry delay
```

**Worker Modes:**

- `loop` - Engine repeats execution automatically
- `single` - Worker manages its own execution loop

### Worker Execution Flow

```
Worker Created
      ↓
Set Active: true
      ↓
Execution Mode Check
      ↓
├── Parallel → All nodes execute
├── Leader → Leader election → Elected node executes
└── Exclusive → Assigned node executes
      ↓
Script Execution (Deno runtime)
      ↓
Statistics Collection
      ↓
Error Handling (based on priority)
      ↓
Loop (if mode: "loop")
```

## Real-Time Data Architecture

### Session Data Structure

**Channel Pattern:**

```
{network}.{domain}.{module}.{exchange}.{market_type}.{pair}.{widget_type}

Example:
testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker
```

**Session Object:**

```typescript
SessionStore = {
  [channel: string]: SessionWidgetData {
    module: string,
    channel: string,
    widget: string,
    raw: WidgetRawData,
    timestamp: number
  }
}
```

### Widget-to-Data Binding

```
1. Widget dropped on Canvas
        ↓
2. Node created with channel reference
        ↓
3. NodeFlow component renders
        ↓
4. useSessionStoreSync provides session
        ↓
5. session[channel] → Widget data
        ↓
6. Widget component renders data
        ↓
7. WebSocket updates → Auto re-render
```

## Security Architecture

### Key Management

**Storage Strategy:**

```
Private Key (Created/Imported)
         ↓
   JSON.stringify(wallet)
         ↓
   localStorage["_g"]  (for auto-restore)
         ↓
   Auth Store (in-memory during session)
```

**Security Measures:**

- Private keys never transmitted over network
- Signatures created client-side
- No logging of sensitive data
- Constant-time signature verification
- Encrypted storage recommended (future enhancement)

### Authentication Flow

```
1. Wallet Available → 2. Network Selected → 3. Generate Token
         ↓                      ↓                      ↓
   Local Wallet          API Endpoint           Sign Challenge
         ↓                      ↓                      ↓
   Public Key           WebSocket URL          Send to Backend
         ↓                      ↓                      ↓
   Address              Connection Params      Receive Session
                                ↓
                        Session Established
                                ↓
                        Real-time Data Flow
```

### Transaction Signing

**Basic Transaction:**

```typescript
1. Create transaction object
2. Calculate SHA-256 hash
3. Sign with ECDSA (secp256k1)
4. Attach signature
5. Verify locally
6. Send to network
```

**Smart Transaction:**

```typescript
1. Define operations (ops)
2. Calculate fee based on ops
3. Serialize deterministically
4. Sign transaction
5. Add cosign signatures (if multi-sig)
6. Verify all signatures
7. Submit to network
```

## Routing Architecture

### URL-Based Navigation

**Pattern:** `/app/:route`

**Implementation:**

```
URL Change
    ↓
useUrlRouter hook detects
    ↓
Updates useAppStore.currentRoute
    ↓
App.tsx renderMainContent() switches
    ↓
Route component renders
    ↓
URL synchronized with state
```

**Route Protection:**

- `allowedRoutes` array in app store
- Dynamic based on user permissions
- Developer mode shows additional routes

## Performance Architecture

### Optimization Strategies

#### 1. Debouncing

```typescript
// Canvas viewport saves (300ms)
const debouncedSaveViewport = useCallback((viewport) => {
  if (viewportSaveTimeoutRef.current) {
    clearTimeout(viewportSaveTimeoutRef.current);
  }
  viewportSaveTimeoutRef.current = setTimeout(() => {
    updatePanelData(activePanelId, { viewport });
  }, 300);
}, [activePanelId, updatePanelData]);
```

#### 2. Memoization

```typescript
// Expensive computations
const filteredData = useMemo(() => {
  return data.filter(item => /* complex filter */);
}, [data, /* dependencies */]);

// Event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [/* dependencies */]);
```

#### 3. Code Splitting

```typescript
// Route-based lazy loading
const LazyComponent = lazy(() => import("./Component"));

// Used with Suspense
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>;
```

#### 4. WebSocket Batching

```typescript
// Accumulate messages for 200ms before processing
const MESSAGE_BATCH_INTERVAL = 200; // ms
let messageBatch: Record<string, string> = {};
let batchTimeout: NodeJS.Timeout | null = null;

function scheduleMessageBatch(): void {
  if (batchTimeout) return;
  batchTimeout = setTimeout(flushMessageBatch, MESSAGE_BATCH_INTERVAL);
}
```

## Error Handling Architecture

### Error Boundaries

**Strategy:** Graceful degradation with user-friendly error messages

**Levels:**

1. **Component Level** - Try-catch in render methods
2. **API Level** - HTTP error handling with retry logic
3. **WebSocket Level** - Connection error recovery
4. **Store Level** - State validation before updates

### WebSocket Reconnection Strategy

```typescript
Reconnection Logic:
1. Initial failure → Retry in 1s
2. Second failure → Retry in 2s (exponential)
3. Third failure → Retry in 4s
4. Fourth failure → Retry in 8s
5. Fifth failure → Retry in 16s
6. After 5 failures → Show session expired modal
```

## Authentication State Machine

```
States:
- initializing     → hydrating
- hydrating        → checking_session
- checking_session → authenticating | loading_app
- authenticating   → connecting
- connecting       → loading_app
- loading_app      → ready
- ready            → (active state)
- upgrading        → (maintenance mode)

Transitions:
- Each transition has artificial delay for UX (150-400ms)
- Progress bar animations during transitions
- State persistence across page reloads
```

## Canvas Data Architecture

### ReactFlow Integration

**Node Structure:**

```typescript
FlowNode {
  id: string,                    // Unique identifier
  type: "custom",                // Node type (always custom)
  position: { x, y },            // Canvas position
  data: FlowNodeData {
    channel: string,             // Session data key
    label: string,               // Display name
    onDelete: Function,          // Delete handler
    sessionData?: SessionWidgetData,  // Real-time data
    nodeState?: NodeState {      // UI state
      minimized: boolean,
      maximized: boolean
    }
  },
  dragHandle: ".drag-handle",    // Drag area selector
  style?: { width, height, zIndex, opacity }  // Visual state
}
```

**Edge Types:**

1. **Manual Edges** - User-created connections
2. **Auto Edges** - Generated by auto-connection system (ID starts with "auto-")

**Persistence Strategy:**

```typescript
Panel Change Detected
        ↓
Filter Changes (position, dimensions, etc.)
        ↓
Debounce 300ms
        ↓
Save to PanelData in store
        ↓
Zustand persist middleware
        ↓
localStorage["canvas-store"]
```

## Widget Type System

### Widget Resolution

```typescript
// Channel example:
"testnet.runtime.connector.exchange.crypto.bybit.spot.BTC/USDT.ticker";

// Split and extract:
const parts = channel.split(".");
const widgetType = parts[parts.length - 1]; // "ticker"

// Map to component:
switch (widgetType) {
  case "ticker":
    return <Ticker raw={raw} />;
  case "trades":
    return <TradesWidget {...props} />;
  case "book":
    return <OrderBook book={raw} />;
  case "candles":
    return <Candles raw={raw} />;
    // etc...
}
```

### Widget Data Contract

**All widgets receive:**

```typescript
{
  widget: string,              // Widget type identifier
  raw: WidgetRawData,          // Type-specific data
  data?: SessionWidgetData     // Full session object
}
```

## Auto-Connection Algorithm

### Purpose

Automatically create visual connections between Canvas widgets that share common
properties (exchange, market, asset).

### Algorithm

```typescript
1. Extract connection keys from each node
   - Parse session data
   - Extract: exchange, market, asset, base, quote, type, module

2. Group nodes by configured keys
   - Default: group by "exchange"
   - Create EdgeGroup for each unique value

3. Generate edges for each group
   - Connect all nodes with same group value
   - Assign color based on key type
   - Set metadata (group count, related nodes)

4. Filter duplicate connections
   - Remove auto-edges that match manual edges
   - Prevent overlapping connections

5. Combine with manual edges
   - allEdges = [...manualEdges, ...autoEdges]
```

### Configuration

```typescript
interface AutoConnectionConfig {
  enabled: boolean;
  groupByKeys: ("exchange" | "market" | "asset" | "type")[];
  showLabels: boolean;
  edgeStyles: {
    exchange: string; // Color for exchange-based connections
    market: string; // Color for market-based connections
    asset: string; // Color for asset-based connections
    type: string; // Color for type-based connections
  };
}
```

## Theme Architecture

### Theme Resolution

```
User Setting (ThemeMode)
      ↓
  "system" | "light" | "dark"
      ↓
Resolve to actual theme
      ↓
  "light" | "dark"
      ↓
Apply CSS variables
      ↓
Update document classes
```

### CSS Variable System

**Light Theme:**

```css
--background: 0 0% 100%;
--foreground: 240 10% 3.9%;
--card: 0 0% 100%;
--primary: 24 100% 50%; /* #f59e0b */
```

**Dark Theme:**

```css
--background: 240 10% 3.9%;
--foreground: 0 0% 98%;
--card: 240 10% 3.9%;
--primary: 38 100% 50%; /* #f59e0b */
```

### System Preference Detection

```typescript
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

mediaQuery.addEventListener("change", (e) => {
  if (theme === "system") {
    const newTheme = e.matches ? "dark" : "light";
    applyTheme(newTheme);
  }
});
```

## Mobile Architecture

### Responsive Strategy

**Breakpoints:**

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Detection Hook:**

```typescript
const isMobile = useMobile(768);
const { isMobile, isTablet, isDesktop } = useDeviceType();
```

**Rendering Strategy:**

```typescript
// Conditional rendering based on device
{isMobile ? <MobileComponent /> : <DesktopComponent />}

// Responsive Tailwind classes
<div className="text-xs sm:text-sm lg:text-base">
```

### Touch Optimization

**Gesture Prevention:**

- Pinch-to-zoom disabled
- Touch gestures prevented
- Wheel zoom with Ctrl/Cmd only
- Touch action: manipulation

## Build Architecture

### Vite Configuration

**Plugins:**

- `@vitejs/plugin-react` - React support with Fast Refresh
- `@tailwindcss/vite` - Tailwind CSS v4 integration

**Alias:**

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src")
  }
}
```

**Output:**

```
dist/
├── index.html          # Entry HTML
├── assets/             # Bundled assets
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [images]
└── logo.svg
```

## Deployment Architecture

### Production Build

```bash
# 1. TypeScript Check
tsc -b

# 2. Vite Build
vite build

# Output: dist/ directory with optimized bundle
```

### Environment-Specific Behavior

**Network Selection:**

- TestNet - Development and testing
- MainNet - Production trading
- LocalNet - Local development

**Developer Mode:**

- Shows additional routes (Editor, Network)
- Enables debug panels
- Extended sidebar navigation
- Development tools access

## Monitoring and Debugging

### DevTools Integration

**Zustand DevTools:**

- All stores connected to Redux DevTools
- State snapshots
- Time-travel debugging
- Action tracking

**Console Logging:**

- Structured logging with prefixes `[ComponentName]`
- State transitions logged
- WebSocket events tracked
- Error logging with context

### Performance Monitoring

**Metrics Tracked:**

- WebSocket latency
- Message batch size
- Reconnection attempts
- Worker execution statistics
- Component render counts (via React DevTools)

## Scalability Considerations

### Horizontal Scalability

**WebSocket Design:**

- Single connection per client
- Server-side message routing
- Distributed worker execution

**Panel System:**

- Independent panel data
- No cross-panel dependencies
- Unlimited panel creation

### Vertical Scalability

**State Management:**

- Partitioned stores by domain
- Selective persistence (reduce localStorage size)
- Lazy initialization where possible

**Component Optimization:**

- React.memo for expensive components
- Virtualization for long lists (ScrollArea)
- Code splitting by route

## Future Architecture Enhancements

### Planned Improvements

1. **Service Workers** - Offline capability
2. **IndexedDB Migration** - Large data storage
3. **WebRTC Data Channels** - Peer-to-peer communication
4. **GraphQL Subscriptions** - Alternative to WebSocket
5. **Progressive Web App** - Mobile app experience
6. **End-to-End Encryption** - Enhanced security
7. **Multi-Tab Synchronization** - BroadcastChannel API

### Migration Considerations

- Backward compatibility for stored data
- Version detection in stores
- Migration scripts for breaking changes
- Deprecation warnings

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team
