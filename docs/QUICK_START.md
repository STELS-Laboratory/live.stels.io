# STELS Web3 OS - Quick Start Guide

## Getting Started (5 Minutes)

### 1. Installation

```bash
# Clone repository
git clone <repository-url>
cd apps/web3

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access:** http://localhost:5173

### 2. First Run

**Application Flow:**

1. Opens to Welcome screen (App Store)
2. Click any app to launch
3. First-time users: Authentication flow starts automatically

**Developer Mode:**

- Shows full sidebar navigation
- Access to Editor and Network apps
- Enabled per network configuration

## Authentication (First Time)

### Step 1: Create Wallet

**Options:**

- **Create New Wallet** - Generates new keypair
- **Import Existing** - Enter 64-character hex private key

**Important:** Save your private key securely. You cannot recover it if lost.

### Step 2: Select Network

**Available Networks:**

- **TestNet** - For development and testing
- **MainNet** - Production network (live funds)
- **LocalNet** - Local development

**Recommendation:** Start with TestNet

### Step 3: Connect

- Automatic WebSocket connection
- Session token received
- Real-time data streaming begins

## Quick Tour of Applications

### Liquidity Scanner

**Purpose:** Portfolio and wallet analysis

**Quick Start:**

1. Navigate to Scanner from Welcome
2. View overview metrics (liquidity, balance, P&L)
3. Explore tabs: Overview, Network, Portfolio
4. Optional: Enter wallet address in Scanner tab to analyze external wallets

**Key Metrics:**

- Total Liquidity
- Available Balance
- Portfolio ROI
- Worker Efficiency
- Network Health

### Markets Terminal

**Purpose:** Multi-exchange market monitoring

**Quick Start:**

1. Navigate to Markets from Welcome
2. View real-time tickers from all connected exchanges
3. Use filters to narrow by exchange or symbol
4. Click on rows for detailed views

**Features:**

- Mini candlestick charts
- 24h change percentages
- Volume statistics
- Bid/Ask spreads
- Connection latency indicators

### Order Book Aggregator

**Purpose:** Deep market analysis

**Quick Start:**

1. Navigate to OrderBook from Welcome
2. Select market from tabs (default: SOL/USDT)
3. View aggregated order book from all exchanges
4. Click exchange in ranking to see individual order book

**Metrics:**

- Total Bid/Ask Liquidity
- Market Imbalance
- Depth Ratio
- VWAP
- Large Orders Detection

### Canvas Workspace

**Purpose:** Custom dashboard builder

**Quick Start:**

1. Navigate to Canvas from Welcome
2. Click Shopping Bag icon (dock, bottom center) to open Widget Store
3. Drag widgets from store to canvas
4. Widgets display real-time data automatically

**Widget Store:**

- 100+ real-time widgets
- Grouped by exchange and asset
- Search and filter
- Shows which widgets are already on canvas

**Panel System:**

- Multiple independent canvases
- Create panels with Settings icon (dock)
- Switch between panels with top tabs
- Each panel saves its layout

**Auto-Connections:**

- Click Network icon (dock) to open settings
- Enable to automatically connect related widgets
- Group by: exchange, market, asset, type
- Visual edge grouping with colors

### AMI Editor (Developer)

**Purpose:** Create automated trading algorithms

**Quick Start:**

1. Navigate to Editor from Welcome (requires developer mode)
2. Click "AI Protocol" button
3. Choose template or start from scratch
4. Configure execution mode and priority
5. Create worker

**Worker Templates:**

- **Grid Trading** - Automated grid strategy
- **DCA Strategy** - Dollar cost averaging
- **Market Monitor** - Data collection
- **Balance Monitor** - Account monitoring
- **Health Check** - Node monitoring

**Execution Modes:**

- **Parallel** - Runs on all nodes
- **Leader** - Distributed consensus (one active)
- **Exclusive** - Specific node only

**Priority Levels:**

- **Critical** - 50 errors max, 1ms retry
- **High** - 20 errors max, 10ms retry
- **Normal** - 10 errors max, 100ms retry
- **Low** - 5 errors max, 1s retry

### Network Visualization

**Purpose:** Monitor distributed infrastructure

**Quick Start:**

1. Navigate to Network from Welcome
2. View interactive 3D globe with node locations
3. Click nodes for detailed information
4. View network statistics in top-right panel

**Controls:**

- Auto-rotate toggle
- Globe visibility toggle
- Refresh data

### Wallet Manager

**Purpose:** Manage blockchain wallet and exchange accounts

**Quick Start:**

1. Navigate to Wallet from Welcome
2. View wallet details (address, public key, balance)
3. Switch to Accounts tab
4. Add exchange accounts with "Add Account" button

**Tabs:**

- **Wallet** - View wallet info, connection status
- **Accounts** - Manage exchange accounts
- **Transactions** - Sign blockchain transactions

## Common Tasks

### Add Exchange Account

```
1. Wallet → Accounts tab → "Add Account"
2. Fill in:
   - Node ID (unique identifier)
   - Exchange (Binance, Bybit, etc.)
   - API Key and Secret
   - Status (Active/Learn/Stopped)
3. Optional: Configure trading protocol
4. Review and sign
5. Send to server or save locally
```

### Create Trading Worker

```
1. Editor → "AI Protocol" button
2. Select template (or Empty Script)
3. Configure:
   - Execution Mode (Parallel/Leader/Exclusive)
   - Priority (Critical/High/Normal/Low)
   - Worker Mode (Loop/Single)
   - Dependencies
4. Review script
5. Create worker
6. Worker starts automatically if active: true
```

### Build Custom Dashboard

```
1. Canvas → Shopping Bag icon (Widget Store)
2. Browse widgets by exchange/asset
3. Drag widget to canvas
4. Position and arrange
5. Create multiple panels for different views
6. Switch panels with top tabs
7. Settings saved automatically
```

### Monitor Portfolio

```
1. Scanner → Overview tab
2. View key metrics:
   - Total Liquidity
   - Available Balance
   - Portfolio ROI
   - Performance Rate
3. Switch to Portfolio tab for asset breakdown
4. Switch to Network tab for infrastructure status
```

## Development Workflow

### Creating a New Component

```bash
# 1. Create component file
touch src/components/MyComponent.tsx

# 2. Add component code
# See COMPONENT_GUIDE.md for patterns

# 3. Export from index
echo "export { MyComponent } from './MyComponent';" >> src/components/index.ts

# 4. Import and use
```

### Creating a New Application

```bash
# 1. Create app directory
mkdir -p src/apps/MyApp/components

# 2. Create files
touch src/apps/MyApp/MyApp.tsx
touch src/apps/MyApp/store.ts
touch src/apps/MyApp/types.ts
touch src/apps/MyApp/utils.ts
touch src/apps/MyApp/index.ts

# 3. Register route in App.tsx
# Add to renderMainContent() switch statement

# 4. Add to applications array in Welcome/applications.tsx
```

### Adding a New Widget Type

```typescript
// 1. Add to WidgetType enum (src/lib/canvas-types.ts)
export const WidgetType = {
  // ...
  MY_WIDGET: "mywidget"
}

// 2. Create widget component (src/components/widgets/MyWidget.tsx)
export function MyWidget({ raw }: { raw: MyData }) {
  return <div>{/* UI */}</div>;
}

// 3. Register in NodeFlow (src/apps/Canvas/NodeFlow.tsx)
case WidgetType.MY_WIDGET:
  return <MyWidget raw={raw} />;

// 4. Backend sends data with widget: "mywidget"
```

### Creating a Store

```typescript
// 1. Create store file
// src/stores/modules/myfeature.store.ts

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface MyFeatureState {
  value: string;
  setValue: (value: string) => void;
}

export const useMyFeatureStore = create<MyFeatureState>()(
  devtools(
    persist(
      (set) => ({
        value: "",
        setValue: (value) => set({ value }),
      }),
      { name: "myfeature-store" },
    ),
    { name: "My Feature Store" },
  ),
);

// 2. Export from index
// src/stores/index.ts
export { useMyFeatureStore } from "./modules/myfeature.store";

// 3. Use in components
import { useMyFeatureStore } from "@/stores";

function MyComponent() {
  const value = useMyFeatureStore((state) => state.value);
  const setValue = useMyFeatureStore((state) => state.setValue);
}
```

## Debugging

### Browser DevTools

**Chrome/Edge:**

1. F12 to open DevTools
2. **Console** - View logs and errors
3. **Network** - Monitor API calls and WebSocket
4. **Application** - View localStorage/sessionStorage
5. **Redux** - View Zustand stores (requires extension)

**Redux DevTools Extension:**

- Install from Chrome Web Store
- All stores appear in Redux tab
- View state snapshots
- Time-travel debugging
- Action tracking

### Common Issues

**Issue: "No session data"**

```
Cause: WebSocket not connected
Solution:
1. Check connection status (top-right)
2. Verify network selection
3. Try reconnecting
4. Check browser console for errors
```

**Issue: "Widgets not displaying"**

```
Cause: Widget data not in session
Solution:
1. Wait for WebSocket connection
2. Verify backend is running
3. Check sessionStorage has data
4. Inspect session object in console: window.session
```

**Issue: "Panel not saving"**

```
Cause: LocalStorage full or disabled
Solution:
1. Check localStorage quota
2. Clear old data
3. Enable localStorage in browser
4. Check browser privacy settings
```

**Issue: "Worker not starting"**

```
Cause: Script error or backend issue
Solution:
1. Check worker script for syntax errors
2. View worker stats panel for error details
3. Check backend logs
4. Verify dependencies are available
```

## Tips and Tricks

### Keyboard Shortcuts

**General:**

- `Ctrl/Cmd + K` - Quick search (if implemented)
- `Escape` - Close modals/dialogs

**Canvas:**

- Click and drag - Pan canvas
- Mouse wheel - Zoom
- Click widget - Select
- Delete key - Delete selected (if implemented)

### Performance Tips

**For Large Datasets:**

- Use filters to reduce visible items
- Enable pagination (if available)
- Close unused panels
- Limit widgets on canvas

**For Slow Connections:**

- Use cached data when possible
- Reduce auto-refresh intervals
- Close unnecessary widgets
- Use lightweight view modes

### Power User Features

**Multiple Panels:**

- Create separate panels for different strategies
- Quick switching without losing layouts
- Export/Import panel configurations (future)

**Auto-Connections:**

- Visualize data relationships automatically
- Customize grouping keys
- Show/hide connection labels
- Color-coded by connection type

**Worker Management:**

- Use leader mode for singleton tasks
- Parallel mode for distributed data collection
- Priority system for task scheduling
- Statistics panel for monitoring

## Next Steps

### Learn More

1. **README.md** - Project overview and setup
2. **ARCHITECTURE.md** - Detailed system design
3. **API_DOCUMENTATION.md** - Backend integration
4. **STATE_MANAGEMENT.md** - Zustand store guide
5. **COMPONENT_GUIDE.md** - Component development
6. **DEPLOYMENT_SECURITY.md** - Production deployment

### Explore Codebase

**Start Here:**

- `src/App.tsx` - Application entry point
- `src/apps/Welcome/` - Understand app launcher
- `src/components/ui/` - Reusable components
- `src/stores/modules/auth.store.ts` - Authentication logic
- `src/lib/gliesereum/` - Blockchain SDK

### Common Tasks

**Add New Feature:**

1. Create component in appropriate app directory
2. Add types in `types.ts`
3. Add utility functions in `utils.ts`
4. Update store if needed
5. Test thoroughly
6. Document in JSDoc

**Fix Bug:**

1. Reproduce issue
2. Check browser console
3. Review Redux DevTools state
4. Add console.log strategically
5. Fix and verify
6. Add regression test (future)

**Optimize Performance:**

1. Profile with React DevTools
2. Identify expensive re-renders
3. Add React.memo where appropriate
4. Use useMemo for expensive computations
5. Verify improvement

## Support and Resources

### Getting Help

**Documentation:**

- Read relevant .md files in root directory
- Check JSDoc comments in source code
- Review component examples

**Debugging:**

- Browser DevTools console
- Redux DevTools for state inspection
- Network tab for API calls
- React DevTools for component tree

**Community:**

- Internal team communication channels
- Code review process
- Pair programming sessions

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Debugging
npm run dev -- --debug   # Debug mode (if configured)
npm run build -- --sourcemap  # Build with source maps

# Maintenance
npm audit                # Security audit
npm outdated             # Check for updates
npm update               # Update dependencies
```

## Troubleshooting

### Reset Application State

**Clear All Data:**

```typescript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Reset Specific Store:**

```typescript
// In browser console:
localStorage.removeItem("canvas-store");
location.reload();
```

**Reset Wallet (Danger):**

```typescript
// This will disconnect and remove wallet
localStorage.removeItem("_g");
localStorage.removeItem("auth-store");
location.reload();

// You will need private key to recover
```

### Network Issues

**WebSocket Won't Connect:**

1. Check network configuration
2. Verify backend is running
3. Check firewall settings
4. Try different network (TestNet/LocalNet)
5. Check browser console for specific errors

**Session Expired:**

1. Click "Re-authenticate" in modal
2. Wallet auto-restored from localStorage
3. New session established
4. Data streaming resumes

**High Latency:**

1. Check internet connection
2. Try different network/server
3. Reduce number of active widgets
4. Close unused applications

### Development Issues

**TypeScript Errors:**

```bash
# Check for type errors
npx tsc --noEmit

# Common fixes:
# - Add explicit return types
# - Use unknown instead of any
# - Properly type function parameters
```

**Build Errors:**

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Hot Reload Not Working:**

```bash
# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

## Best Practices Summary

### Code Quality

✅ **Do:**

- Write TypeScript with strict mode
- Add JSDoc comments to public functions
- Use functional components with hooks
- Follow ESLint rules
- Use Tailwind CSS utilities
- Handle errors gracefully
- Clean up effects and subscriptions

❌ **Don't:**

- Use `any` type
- Create inline styles
- Ignore TypeScript errors
- Leave commented code
- Skip error handling
- Forget cleanup in useEffect

### Security

✅ **Do:**

- Validate all inputs
- Use HTTPS in production
- Keep dependencies updated
- Sanitize user content
- Log security events

❌ **Don't:**

- Log private keys
- Store secrets in code
- Trust user input
- Expose sensitive errors
- Commit credentials

### Performance

✅ **Do:**

- Use React.memo for expensive components
- Memoize callbacks passed to children
- Implement proper loading states
- Use code splitting
- Optimize images

❌ **Don't:**

- Create objects/functions in render
- Update state in render
- Forget dependency arrays
- Load all data upfront
- Ignore performance warnings

## Quick Reference

### File Locations

```
Component:     src/components/ui/{name}.tsx
App:           src/apps/{Name}/{Name}.tsx
Store:         src/stores/modules/{name}.store.ts
Hook:          src/hooks/use{Name}.ts
Type:          src/lib/{domain}-types.ts
Utility:       src/lib/{domain}.ts
Widget:        src/components/widgets/{Name}.tsx
```

### Import Paths

```typescript
// UI Components
import { Button } from "@/components/ui/button";

// Apps
import Markets from "@/apps/Markets";

// Stores
import { useAppStore, useAuthStore } from "@/stores";

// Hooks
import { useMobile } from "@/hooks/useMobile";

// Utilities
import { cn } from "@/lib/utils";
import { createWallet } from "@/lib/gliesereum";

// Types
import type { Panel } from "@/lib/panel-types";
```

### Common Patterns

**Get Current Route:**

```typescript
const currentRoute = useAppStore((state) => state.currentRoute);
```

**Navigate to Route:**

```typescript
import { navigateTo } from "@/lib/router";
navigateTo("markets");
```

**Access Session Data:**

```typescript
const session = useSessionStoreSync();
const ticker = session?.[channel];
```

**Check Connection:**

```typescript
const { isConnected, connectionSession } = useAuthStore();
if (isConnected && connectionSession) {
  // Make API call
}
```

**Theme Toggle:**

```typescript
const { theme, toggleTheme } = useTheme();
```

## Resources

**Documentation:**

- README.md - Overview
- ARCHITECTURE.md - System design
- API_DOCUMENTATION.md - Backend integration
- STATE_MANAGEMENT.md - Zustand stores
- COMPONENT_GUIDE.md - Component patterns
- DEPLOYMENT_SECURITY.md - Production & security

**External:**

- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Tailwind CSS: https://tailwindcss.com
- Zustand: https://github.com/pmndrs/zustand

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team

**Happy coding! 🚀**
