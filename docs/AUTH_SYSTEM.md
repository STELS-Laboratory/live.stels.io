# Authentication System Documentation

## Overview

The SONAR Web3 application now features a robust authentication system that
manages wallet creation, network selection, and automatic connection
restoration.

## Key Features

### 1. Complete Data Clearing on Logout

- **Function**: `resetAuth()` and `disconnectFromNode()`
- **What it clears**:
  - All Zustand store state
  - `localStorage` entries: `auth-store`, `private-store`, `_g`
  - Any keys starting with `auth-`, `wallet-`, `session-`
- **Usage**: Called when user clicks "Logout" or "Disconnect"

### 2. Automatic Connection Restoration

- **Function**: `restoreConnection()`
- **Trigger**: Automatically called on app load via `useAuthRestore` hook
- **Logic**:
  1. Checks if wallet and network are available
  2. Checks if saved session exists in localStorage
  3. Attempts to reconnect using existing credentials
  4. Clears invalid session data if connection fails

### 3. Persistent State Management

- **Zustand Persist**: Saves wallet, network, and connection state
- **localStorage Keys**:
  - `auth-store`: Zustand persisted state
  - `private-store`: Network session data
  - `_g`: Legacy wallet data (cleared on logout)

## Authentication Flow

```
1. App Load
   ↓
2. useAuthRestore Hook
   ↓
3. Check: wallet + network + saved session?
   ↓
4. If yes: restoreConnection()
   ↓
5. If successful: User is authenticated
   ↓
6. If failed: Clear invalid data, show auth flow
```

## User Actions

### Login/Connect

1. Create or import wallet
2. Select network (testnet/mainnet/localnet)
3. Connect to node
4. Session is automatically saved

### Logout/Disconnect

1. Click "Logout" in ConnectionStatusSimple
2. All data is cleared from store and localStorage
3. User must re-authenticate

### Automatic Reconnection

- Happens automatically on app reload
- No user action required
- Seamless experience if session is valid

## Developer Tools

### AuthTestPanel Component

- Available in wallet settings when in developer mode
- Shows current authentication state
- Allows testing of connection/disconnection
- Displays localStorage contents
- Provides manual restore testing

### Console Logging

- All auth actions are logged to console
- Prefixed with `[Auth]` or `[AuthRestore]`
- Helps with debugging connection issues

## Technical Implementation

### Store Structure

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

  // UI
  isAuthenticated: boolean;
  showNetworkSelector: boolean;
}
```

### Key Functions

- `createNewWallet()`: Generate new wallet
- `importExistingWallet(privateKey)`: Import existing wallet
- `selectNetwork(network)`: Choose network to connect to
- `connectToNode()`: Establish connection with signed transaction
- `disconnectFromNode()`: Disconnect and clear session data
- `resetAuth()`: Complete reset of all auth data
- `restoreConnection()`: Attempt to restore previous connection

## Security Considerations

1. **Private Keys**: Never logged or exposed in console
2. **Session Data**: Stored securely in localStorage
3. **Transaction Signing**: Uses deterministic stringification
4. **Network Validation**: All network requests are validated
5. **Error Handling**: Invalid sessions are automatically cleared

## Testing

To test the authentication system:

1. **Create wallet and connect**
2. **Refresh the page** - should auto-reconnect
3. **Clear browser data** - should require re-authentication
4. **Use AuthTestPanel** - for detailed debugging (developer mode only)

## Troubleshooting

### Connection Issues

- Check network connectivity
- Verify API endpoints are accessible
- Check console for error messages
- Use AuthTestPanel to inspect state

### Data Persistence Issues

- Check localStorage permissions
- Verify Zustand persist configuration
- Clear all data and re-authenticate

### Auto-reconnect Not Working

- Check if wallet and network are saved
- Verify session data in localStorage
- Check console for restore errors
