# STELS Web3 OS - Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Issue: "No active connection" Error

**Symptoms:**

- Cannot access application features
- "No active connection" error in console
- Connection status shows disconnected

**Diagnosis:**

```typescript
// Check in browser console:
useAuthStore.getState().isConnected; // Should be true
useAuthStore.getState().connectionSession; // Should have session object
```

**Solutions:**

1. **Verify Wallet Exists:**
   ```typescript
   // Console:
   localStorage.getItem("_g"); // Should return wallet JSON

   // If null, create/import wallet
   ```

2. **Check Network Selection:**
   ```typescript
   // Console:
   useAuthStore.getState().selectedNetwork; // Should have network config

   // If null, select network in UI
   ```

3. **Reconnect:**
   ```typescript
   // Use UI: Click connection status → Reconnect
   // Or console:
   useAuthStore.getState().connectToNode();
   ```

4. **Clear Session and Retry:**
   ```bash
   sessionStorage.clear();
   # Refresh page
   # Go through authentication flow
   ```

---

#### Issue: "Session expired" Modal Keeps Appearing

**Symptoms:**

- Modal appears repeatedly
- Cannot re-authenticate
- WebSocket constantly disconnecting

**Diagnosis:**

```typescript
// Console:
useAuthStore.getState().showSessionExpiredModal; // true
useWebSocketStore.getState().sessionExpired; // true
useWebSocketStore.getState().reconnectAttempts; // Check count
```

**Solutions:**

1. **Reset WebSocket State:**
   ```typescript
   useWebSocketStore.getState().resetWebSocketState();
   useAuthStore.getState().setShowSessionExpiredModal(false);
   ```

2. **Check Backend Availability:**
   ```bash
   # Test WebSocket endpoint
   wscat -c wss://api.stels.network

   # If fails, backend is down
   ```

3. **Clear All and Restart:**
   ```typescript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

4. **Verify Network Configuration:**
   ```typescript
   // Console:
   useAuthStore.getState().selectedNetwork;
   // Verify API and socket URLs are correct
   ```

---

#### Issue: Wallet Not Restoring After Page Reload

**Symptoms:**

- Must create/import wallet every time
- Authentication flow starts on every reload
- Wallet data exists in localStorage but not loading

**Diagnosis:**

```typescript
// Console:
localStorage.getItem("_g"); // Check if wallet exists
useAuthStore.getState().wallet; // Check if loaded
useAuthStore.getState()._hasHydrated; // Should be true
```

**Solutions:**

1. **Wait for Hydration:**
   ```typescript
   // Store may not be hydrated yet
   // Wait 1-2 seconds after page load

   setTimeout(() => {
     console.log(useAuthStore.getState().wallet);
   }, 2000);
   ```

2. **Check Auth Restore Hook:**
   ```typescript
   // Verify useAuthRestore is running
   // Check console for: "[AuthRestore] Attempting restoration"
   ```

3. **Manually Restore:**
   ```typescript
   const walletData = localStorage.getItem("_g");
   if (walletData) {
     const wallet = JSON.parse(walletData);
     useAuthStore.setState({
       wallet,
       isWalletCreated: true,
     });
   }
   ```

4. **Fix Corrupted Data:**
   ```typescript
   // If wallet data is corrupted
   const walletData = localStorage.getItem("_g");
   try {
     JSON.parse(walletData);
   } catch {
     console.error("Corrupted wallet data");
     localStorage.removeItem("_g");
     // User must import wallet from backup
   }
   ```

---

### Canvas Issues

#### Issue: Widgets Not Displaying on Canvas

**Symptoms:**

- Dropped widget doesn't appear
- Existing widgets show "Loading Session..."
- Widgets show "Channel not found"

**Diagnosis:**

```typescript
// Console:
const session = sessionStorage;
console.log("Session keys:", Object.keys(session).length);

// Check specific channel
const channel = "testnet.runtime...ticker";
console.log("Widget data:", sessionStorage.getItem(channel));
```

**Solutions:**

1. **Wait for WebSocket Connection:**
   ```typescript
   // Check connection:
   useWebSocketStore.getState().connection; // Should be true

   // If false, wait or reconnect
   ```

2. **Verify Channel Exists:**
   ```typescript
   // Console:
   const session = {};
   for (let i = 0; i < sessionStorage.length; i++) {
     const key = sessionStorage.key(i);
     session[key] = sessionStorage.getItem(key);
   }
   console.log("Available channels:", Object.keys(session));
   ```

3. **Check Backend Data:**
   ```bash
   # Verify backend is sending widget data
   # Check WebSocket messages in Network tab
   ```

4. **Refresh Session:**
   ```typescript
   sessionStorage.clear();
   // Reconnect to reload all session data
   useAuthStore.getState().connectToNode();
   ```

---

#### Issue: Panel State Not Persisting

**Symptoms:**

- Panel layout resets on refresh
- Widgets disappear
- Viewport resets to default

**Diagnosis:**

```typescript
// Console:
const canvasStore = JSON.parse(localStorage.getItem("canvas-store"));
console.log("Panels:", canvasStore.state.panels);
console.log("Panel data:", canvasStore.state.panelData);
```

**Solutions:**

1. **Check LocalStorage Quota:**
   ```javascript
   // Estimate usage
   let total = 0;
   for (let key in localStorage) {
     total += localStorage[key].length + key.length;
   }
   console.log("LocalStorage usage:", (total / 1024).toFixed(2), "KB");
   ```

2. **Verify Active Panel:**
   ```typescript
   useCanvasStore.getState().panels.activePanelId;
   // Should match a panel ID in panels array
   ```

3. **Check Panel Data:**
   ```typescript
   const panelId = useCanvasStore.getState().panels.activePanelId;
   const panelData = useCanvasStore.getState().getPanelData(panelId);
   console.log("Panel data:", panelData);
   ```

4. **Reset and Recreate:**
   ```typescript
   // If corrupted
   localStorage.removeItem("canvas-store");
   location.reload();
   // Create new panel
   ```

---

#### Issue: Auto-Connections Not Working

**Symptoms:**

- No automatic edges appear
- Enable toggle doesn't create connections
- Connection statistics show 0 groups

**Diagnosis:**

```typescript
// Console:
// Check if enabled
const config = /* auto connection config from component state */;
console.log("Enabled:", config?.enabled);
console.log("Group keys:", config?.groupByKeys);

// Check nodes
const nodes = /* nodes from ReactFlow */;
console.log("Nodes:", nodes.length);
console.log("Node data:", nodes.map(n => n.data));
```

**Solutions:**

1. **Verify Enabled:**
   ```typescript
   // Click Network icon in dock
   // Verify toggle is ON
   ```

2. **Check Group Keys:**
   ```typescript
   // At least one grouping key must be selected
   // Default: "exchange"
   ```

3. **Verify Node Data:**
   ```typescript
   // Nodes must have sessionData with groupable fields
   nodes.forEach((node) => {
     const data = node.data.sessionData?.raw;
     console.log("Exchange:", data?.exchange);
     console.log("Market:", data?.market);
   });
   ```

4. **Check Node Count:**
   ```typescript
   // Need at least 2 nodes to create connections
   console.log("Node count:", nodes.length);
   ```

---

### Editor Issues

#### Issue: Worker Not Starting

**Symptoms:**

- Worker created but shows inactive
- No execution statistics
- Worker doesn't appear in backend logs

**Diagnosis:**

```typescript
// Console:
const workers = useEditorStore.getState().workers;
const worker = workers.find((w) => w.value.raw.sid === "your-sid");
console.log("Worker active:", worker?.value.raw.active);
console.log("Worker script:", worker?.value.raw.script);
```

**Solutions:**

1. **Verify Worker is Active:**
   ```typescript
   // Check active flag
   worker.value.raw.active === true;

   // If false, click START button
   ```

2. **Check Script Syntax:**
   ```typescript
   // Look for syntax errors
   try {
     new Function(worker.value.raw.script);
     console.log("Script syntax OK");
   } catch (error) {
     console.error("Script syntax error:", error);
   }
   ```

3. **Verify Dependencies:**
   ```typescript
   // Check if dependencies are available
   console.log("Dependencies:", worker.value.raw.dependencies);
   // Backend must have these packages installed
   ```

4. **Check Execution Mode:**
   ```typescript
   const mode = worker.value.raw.executionMode || "parallel";
   console.log("Execution mode:", mode);

   // If "exclusive", verify assignedNode is correct
   if (mode === "exclusive") {
     console.log("Assigned node:", worker.value.raw.assignedNode);
   }
   ```

5. **Review Backend Logs:**
   ```bash
   # Check backend for worker errors
   # Look for script execution errors
   # Verify node is running
   ```

---

#### Issue: Leader Election Not Working

**Symptoms:**

- Leader worker not executing
- hasLeader shows false
- No leader node assigned

**Diagnosis:**

```typescript
// Get leader info
const leaderInfo = await useEditorStore
  .getState()
  .getLeaderInfo("worker-sid");

console.log("Has leader:", leaderInfo?.hasLeader);
console.log("Leader node:", leaderInfo?.leader);
console.log("Expires in:", leaderInfo?.expiresIn);
```

**Solutions:**

1. **Wait for Election:**
   ```typescript
   // Election takes a few seconds
   // Refresh leader info after 5 seconds
   ```

2. **Verify Multiple Nodes:**
   ```typescript
   // Leader election requires multiple nodes
   // Check network for active nodes
   ```

3. **Check Distributed KV:**
   ```bash
   # Backend must have distributed KV store
   # Verify it's configured and running
   ```

4. **Review Worker Configuration:**
   ```typescript
   // Ensure executionMode is "leader"
   console.log("Mode:", worker.value.raw.executionMode);
   ```

---

### Performance Issues

#### Issue: Application Running Slow

**Symptoms:**

- Laggy UI interactions
- Slow route transitions
- High memory usage
- Browser tab freezes

**Diagnosis:**

1. **Check Memory Usage:**
   ```javascript
   // Chrome DevTools → Performance → Memory
   // Record heap snapshots
   // Look for memory leaks
   ```

2. **Profile Performance:**
   ```javascript
   // Chrome DevTools → Performance
   // Record interaction
   // Analyze flame graph
   // Identify slow components
   ```

3. **Check Network Activity:**
   ```javascript
   // DevTools → Network
   // Look for slow requests
   // Check WebSocket message frequency
   ```

**Solutions:**

1. **Reduce Active Widgets:**
   ```typescript
   // Close unnecessary widgets on canvas
   // Limit to 20-30 widgets per panel
   ```

2. **Clear Old Data:**
   ```typescript
   // Clear sessionStorage
   sessionStorage.clear();

   // Clear old localStorage data
   // Keep only: _g, auth-store, theme-store
   ```

3. **Disable Auto-Connections:**
   ```typescript
   // If many widgets, auto-connections can be expensive
   // Toggle off in Canvas dock
   ```

4. **Reduce Message Rate:**
   ```bash
   # Contact backend team to reduce update frequency
   # For development, acceptable
   # For production, optimize backend
   ```

5. **Update Browser:**
   ```bash
   # Ensure browser is latest version
   # Clear browser cache
   # Disable unnecessary extensions
   ```

---

#### Issue: High Memory Usage

**Symptoms:**

- Browser tab uses > 500 MB RAM
- Browser warns about memory
- Tab crashes

**Diagnosis:**

```javascript
// Console:
performance.memory.usedJSHeapSize / 1024 / 1024; // MB
performance.memory.totalJSHeapSize / 1024 / 1024;

// Chrome DevTools → Memory → Take heap snapshot
// Look for detached DOM nodes
// Look for large arrays/objects
```

**Solutions:**

1. **Close Unused Panels:**
   ```typescript
   // Delete panels you're not using
   useCanvasStore.getState().deletePanel(panelId);
   ```

2. **Clear Session Data:**
   ```typescript
   sessionStorage.clear();
   // Reconnect to reload only needed data
   ```

3. **Restart Application:**
   ```typescript
   // Refresh page to clear memory
   location.reload();
   ```

4. **Check for Memory Leaks:**
   ```javascript
   // Take heap snapshot
   // Interact with app
   // Take another snapshot
   // Compare → Look for growing objects
   ```

---

### Data Issues

#### Issue: Market Data Not Updating

**Symptoms:**

- Ticker shows stale prices
- Order book not refreshing
- Trades not appearing

**Diagnosis:**

```typescript
// Check WebSocket connection
useWebSocketStore.getState().connection; // Should be true

// Check last message time
const session = sessionStorage.getItem(channel);
const data = JSON.parse(session);
console.log("Last update:", new Date(data.timestamp));

// Check network tab for WebSocket messages
// Should see continuous message flow
```

**Solutions:**

1. **Verify Connection:**
   ```typescript
   const ws = useWebSocketStore.getState().ws;
   console.log("WebSocket state:", ws?.readyState);
   // 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED

   // If not OPEN (1), reconnect
   ```

2. **Check Backend:**
   ```bash
   # Ping backend API
   curl https://api.stels.network/health

   # Check WebSocket endpoint
   wscat -c wss://api.stels.network
   ```

3. **Refresh Connection:**
   ```typescript
   await useAuthStore.getState().disconnectFromNode();
   await useAuthStore.getState().connectToNode();
   ```

---

#### Issue: Widget Shows "Unknown Type"

**Symptoms:**

- Widget displays raw JSON instead of formatted UI
- Widget title shows "(Unknown Type)"
- Widget type not recognized

**Diagnosis:**

```typescript
// Check widget type
const session = sessionStorage.getItem(channel);
const data = JSON.parse(session);
console.log("Widget type:", data.widget);

// Check if type is registered
// See src/apps/Canvas/NodeFlow.tsx, switch statement
```

**Solutions:**

1. **Verify Widget Type:**
   ```typescript
   // Check against WidgetType enum
   import { WidgetType } from "@/lib/canvas-types";
   console.log("Valid types:", Object.values(WidgetType));
   ```

2. **Update Backend:**
   ```bash
   # Backend may be sending wrong widget type
   # Contact backend team
   ```

3. **Add Widget Handler:**
   ```typescript
   // If new widget type, add to NodeFlow.tsx:
   case "newtype":
     return <NewWidget raw={raw} />;
   ```

---

### Build and Development Issues

#### Issue: TypeScript Compilation Errors

**Symptoms:**

- `npm run build` fails
- Red squiggly lines in editor
- Type errors in terminal

**Diagnosis:**

```bash
# Check all type errors
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/path/to/file.tsx
```

**Common Errors and Fixes:**

1. **Missing Return Type:**
   ```typescript
   // ❌ Error
   function calculate(a: number) {
     return a + 1;
   }

   // ✅ Fix
   function calculate(a: number): number {
     return a + 1;
   }
   ```

2. **Implicit Any:**
   ```typescript
   // ❌ Error
   function process(data) {
     return data.value;
   }

   // ✅ Fix
   function process(data: unknown): unknown {
     if (isValidData(data)) {
       return data.value;
     }
     throw new Error("Invalid data");
   }
   ```

3. **Object Possibly Null:**
   ```typescript
   // ❌ Error
   const value = obj.property;

   // ✅ Fix
   const value = obj?.property;
   // Or
   if (obj) {
     const value = obj.property;
   }
   ```

4. **Non-Null Assertion:**
   ```typescript
   // ❌ Not allowed
   const value = obj!.property;

   // ✅ Use optional chaining
   const value = obj?.property;
   ```

---

#### Issue: Build Succeeds But Application Crashes

**Symptoms:**

- `npm run build` completes
- Production build crashes on load
- White screen or error in console

**Diagnosis:**

```bash
# Build and preview
npm run build
npm run preview

# Check browser console for errors
# Check Network tab for failed requests
```

**Solutions:**

1. **Check for Dynamic Imports:**
   ```typescript
   // Ensure all dynamic imports are valid
   const Module = await import("./path/to/module");
   ```

2. **Verify Environment Variables:**
   ```typescript
   // Check all import.meta.env.* usage
   // Ensure variables are defined
   ```

3. **Check Asset Paths:**
   ```typescript
   // Ensure all asset imports are correct
   // Use @/ alias for consistency
   import icon from "@/assets/icon.png";
   ```

4. **Test Production Build Locally:**
   ```bash
   npm run build
   npm run preview
   # Test thoroughly before deploying
   ```

---

#### Issue: Hot Reload Not Working

**Symptoms:**

- Changes not appearing in browser
- Must manually refresh
- Vite HMR errors in console

**Solutions:**

1. **Restart Dev Server:**
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

2. **Clear Vite Cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Check File Watchers:**
   ```bash
   # macOS/Linux: Increase limit
   ulimit -n 10000

   # Restart dev server
   ```

4. **Verify File Extensions:**
   ```bash
   # Ensure correct extensions: .tsx, .ts
   # Vite watches specific extensions
   ```

---

### Storage Issues

#### Issue: LocalStorage Full

**Symptoms:**

- "QuotaExceededError" in console
- Cannot save panel data
- Store updates failing

**Diagnosis:**

```javascript
// Check usage
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length + key.length;
  }
}
console.log("Total usage:", (total / 1024).toFixed(2), "KB");

// Check individual stores
Object.keys(localStorage).forEach((key) => {
  const size = localStorage[key].length;
  console.log(key, (size / 1024).toFixed(2), "KB");
});
```

**Solutions:**

1. **Clear Old Data:**
   ```typescript
   // Clear non-essential stores
   localStorage.removeItem("markets-store");
   localStorage.removeItem("orderbook-store");
   localStorage.removeItem("scanner-store");

   // Keep essential: _g, auth-store, theme-store
   ```

2. **Clear Specific Panel:**
   ```typescript
   const store = JSON.parse(localStorage.getItem("canvas-store"));

   // Remove specific panel
   store.state.panels.panels = store.state.panels.panels
     .filter((p) => p.id !== "panel-to-delete");
   delete store.state.panels.panelData["panel-to-delete"];

   localStorage.setItem("canvas-store", JSON.stringify(store));
   ```

3. **Reduce Canvas Data:**
   ```typescript
   // Remove unused panels
   // Limit widgets per panel
   // Use fewer panels
   ```

---

#### Issue: Data Lost on Browser Close

**Symptoms:**

- Settings reset
- Panels disappear
- Must reconfigure each time

**Diagnosis:**

```typescript
// Check if localStorage is enabled
try {
  localStorage.setItem("test", "test");
  localStorage.removeItem("test");
  console.log("LocalStorage working");
} catch {
  console.error("LocalStorage disabled");
}
```

**Solutions:**

1. **Enable LocalStorage:**
   ```
   Browser Settings → Privacy → Enable LocalStorage
   ```

2. **Check Private Browsing:**
   ```
   Private/Incognito mode may disable LocalStorage
   Use normal browsing mode
   ```

3. **Check Browser Extensions:**
   ```
   Disable privacy extensions that block storage
   Try in different browser
   ```

---

### WebSocket Issues

#### Issue: WebSocket Constantly Reconnecting

**Symptoms:**

- Connection status flickers
- "Reconnecting..." message appears repeatedly
- Reconnect counter increasing

**Diagnosis:**

```typescript
// Console:
const ws = useWebSocketStore.getState().ws;
console.log("State:", ws?.readyState);
console.log(
  "Reconnect attempts:",
  useWebSocketStore.getState().reconnectAttempts,
);

// Network tab → WS
// Check close reason and code
```

**Solutions:**

1. **Check Backend Health:**
   ```bash
   # Test endpoint
   curl https://api.stels.network/health

   # Check WebSocket
   wscat -c wss://api.stels.network
   ```

2. **Verify Network Stability:**
   ```bash
   # Check internet connection
   ping api.stels.network

   # Check for packet loss
   ```

3. **Reset Connection:**
   ```typescript
   useWebSocketStore.getState().resetWebSocketState();
   useAuthStore.getState().connectToNode();
   ```

4. **Change Network:**
   ```typescript
   // Try different network (TestNet, LocalNet)
   // May have better connectivity
   ```

---

## Debugging Tools

### Browser DevTools

**Console:**

```javascript
// Access stores
window.useAppStore = useAppStore;
window.useAuthStore = useAuthStore;
window.useCanvasStore = useCanvasStore;

// Then in console:
useAppStore.getState();
useAuthStore.getState();
```

**Network Tab:**

```
Filter: WS (WebSocket messages)
Filter: Fetch/XHR (API calls)

Check:
- Request headers (stels-session)
- Response status codes
- Message frequency
- Connection state
```

**Application Tab:**

```
Storage → Local Storage → localhost:5173
Storage → Session Storage → localhost:5173

Check:
- Store data
- Wallet data (_g key)
- Session data (channel keys)
```

**Redux Tab (DevTools Extension):**

```
View all Zustand stores
- App Store
- Auth Store
- Canvas Store
- etc.

Features:
- State inspection
- Action history
- Time-travel debugging
- State diff
```

### Diagnostic Commands

**In Browser Console:**

```javascript
// 1. Check authentication
console.log("Authenticated:", useAuthStore.getState().isAuthenticated);
console.log("Connected:", useAuthStore.getState().isConnected);
console.log("Wallet:", useAuthStore.getState().wallet?.address);

// 2. Check WebSocket
const ws = useWebSocketStore.getState().ws;
console.log("WebSocket state:", ws?.readyState);
console.log("Connection:", useWebSocketStore.getState().connection);

// 3. Check session data
let count = 0;
for (let i = 0; i < sessionStorage.length; i++) {
  count++;
}
console.log("Session keys:", count);

// 4. Check stores
console.log("Panels:", useCanvasStore.getState().panels.panels.length);
console.log("Workers:", useEditorStore.getState().workers.length);

// 5. Check route
console.log("Current route:", useAppStore.getState().currentRoute);
console.log("Allowed routes:", useAppStore.getState().allowedRoutes);
```

### Reset Commands

**Nuclear Option (Clear Everything):**

```javascript
// WARNING: Clears all data including wallet
localStorage.clear();
sessionStorage.clear();
location.reload();

// You will need private key to restore wallet
```

**Safe Reset (Keep Wallet):**

```javascript
// Save wallet
const wallet = localStorage.getItem("_g");

// Clear everything
localStorage.clear();
sessionStorage.clear();

// Restore wallet
localStorage.setItem("_g", wallet);

// Reload
location.reload();
```

**Reset Specific Store:**

```javascript
// Remove specific store
localStorage.removeItem("canvas-store");
location.reload();
```

## Error Messages Reference

### Common Error Messages

#### "No active connection"

**Meaning:** Not connected to WebSocket\
**Location:** API calls, widget rendering\
**Fix:** Reconnect via connection status button

#### "Session expired"

**Meaning:** WebSocket session no longer valid\
**Location:** WebSocket close event, API 401 response\
**Fix:** Click "Re-authenticate" in modal

#### "Invalid wallet address format"

**Meaning:** Address doesn't match Gliesereum format\
**Location:** Scanner input validation\
**Fix:** Verify address starts with 'g' and is 42-44 characters

#### "Failed to fetch workers"

**Meaning:** Worker API call failed\
**Location:** Editor worker list\
**Fix:** Check connection, verify backend is running

#### "QuotaExceededError"

**Meaning:** LocalStorage full\
**Location:** Store persistence\
**Fix:** Clear old data or unused stores

#### "Channel not found"

**Meaning:** Widget channel not in session\
**Location:** Canvas widget rendering\
**Fix:** Wait for WebSocket data or verify backend sends this channel

## Getting Help

### Information to Provide

When reporting issues, include:

1. **Environment:**
   - Browser and version
   - Operating system
   - Screen resolution
   - Mobile/Desktop

2. **State:**
   ```javascript
   // Run in console:
   console.log({
     authenticated: useAuthStore.getState().isAuthenticated,
     connected: useAuthStore.getState().isConnected,
     route: useAppStore.getState().currentRoute,
     network: useAuthStore.getState().selectedNetwork?.name,
     wsState: useWebSocketStore.getState().ws?.readyState,
   });
   ```

3. **Steps to Reproduce:**
   - Exact steps taken
   - Expected behavior
   - Actual behavior

4. **Console Errors:**
   - Copy full error messages
   - Include stack traces
   - Include any warnings

5. **Network Tab:**
   - Failed requests
   - WebSocket close reason
   - Response codes

### Support Channels

**For Bugs:**

- Create GitHub issue
- Include diagnostic information
- Attach screenshots if UI issue

**For Questions:**

- Check documentation first
- Search closed issues
- Ask in team chat

**For Security:**

- Email: security@gliesereum.ua
- Do not post publicly
- Encrypted communication preferred

## Recovery Procedures

### Complete Application Reset

**When:** Application completely broken, nothing works

**Steps:**

```typescript
// 1. Export wallet private key (if possible)
const wallet = JSON.parse(localStorage.getItem("_g"));
console.log("Private Key:", wallet.privateKey);
// COPY THIS SOMEWHERE SAFE

// 2. Clear all data
localStorage.clear();
sessionStorage.clear();

// 3. Close all tabs
// 4. Open new tab
// 5. Import wallet using saved private key
// 6. Reconfigure settings
```

### Wallet Recovery

**When:** Wallet lost but you have private key

**Steps:**

```typescript
// 1. Go to Authentication screen
// 2. Click "Import Existing"
// 3. Enter private key (64-character hex)
// 4. Complete authentication flow
// 5. Wallet restored
```

### Account Recovery

**When:** Exchange accounts lost

**If Saved to Backend:**

```typescript
// Accounts automatically loaded from backend
// On wallet connection
// No action needed
```

**If Local Only:**

```
You must reconfigure accounts manually
No automatic recovery available
Keep backups of account configurations
```

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team
