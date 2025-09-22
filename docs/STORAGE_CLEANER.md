# Storage Cleaner Documentation

## Overview

The SONAR Web3 application now includes a comprehensive storage cleaning system
that ensures complete data removal when users logout or disconnect. This system
clears ALL possible storage mechanisms used by modern web browsers.

## What Gets Cleared

### 1. localStorage

- **All keys**: Complete removal of all localStorage entries
- **App-specific keys**: Special attention to auth-related keys
- **Verification**: Confirms zero items remain

### 2. sessionStorage

- **All keys**: Complete removal of all sessionStorage entries
- **Session data**: Temporary session information
- **Verification**: Confirms zero items remain

### 3. IndexedDB

- **Database deletion**: Removes entire databases, not just data
- **App databases**: Clears all possible app-related databases
- **Graceful handling**: Continues even if databases don't exist

### 4. Cache Storage (Service Worker)

- **All caches**: Removes all cached data
- **PWA caches**: Clears Vite PWA plugin caches
- **Resource caches**: Clears all cached resources

### 5. Cookies

- **All cookies**: Removes cookies for current domain
- **Path variations**: Clears cookies with different paths
- **Domain variations**: Clears cookies for subdomains

### 6. App-Specific Storage

- **Zustand stores**: auth-store, wallet-store, app-store, etc.
- **Session data**: private-store, connection data
- **Legacy data**: _g (old wallet format)
- **User preferences**: Any saved user settings

## Storage Cleaner Functions

### `clearAllStorage()`

**Comprehensive cleanup** - clears ALL storage mechanisms

```typescript
await clearAllStorage();
// Clears: localStorage, sessionStorage, IndexedDB, Cache, Cookies
```

### `clearAppStorage()`

**App-specific cleanup** - clears only app-related data

```typescript
clearAppStorage();
// Clears: localStorage, sessionStorage, app-specific keys
```

### Individual Functions

- `clearLocalStorage()` - localStorage only
- `clearSessionStorage()` - sessionStorage only
- `clearIndexedDB()` - IndexedDB databases only
- `clearCacheStorage()` - Cache storage only
- `clearCookies()` - Cookies only
- `clearAppSpecificStorage()` - App keys only

## Integration with Auth System

### `disconnectFromNode()`

- Calls `clearAllStorage()` for complete cleanup
- Fallback to `clearAppStorage()` if full clear fails
- Async function with error handling

### `resetAuth()`

- Calls `clearAllStorage()` for complete reset
- Fallback to `clearAppStorage()` if full clear fails
- Clears Zustand store state
- Async function with error handling

## Verification System

The storage cleaner includes verification to ensure complete cleanup:

```typescript
// Verification after cleanup
const remainingLocalStorage = Object.keys(localStorage).length;
const remainingSessionStorage = Object.keys(sessionStorage).length;

if (remainingLocalStorage === 0 && remainingSessionStorage === 0) {
  console.log("✅ Storage cleanup verified - all data cleared");
} else {
  console.warn("⚠️ Some storage items remain:", {
    localStorage: remainingLocalStorage,
    sessionStorage: remainingSessionStorage,
  });
}
```

## Error Handling

### Graceful Degradation

- If comprehensive cleanup fails, falls back to basic cleanup
- Continues operation even if some storage mechanisms fail
- Detailed error logging for debugging

### Browser Compatibility

- Checks for storage mechanism availability before clearing
- Handles older browsers that may not support all storage types
- No errors if storage mechanisms are unavailable

## Testing

### AuthTestPanel Integration

- **Clear All Data**: Uses `resetAuth()` + `localStorage.clear()`
- **Test Full Clear**: Direct call to `clearAllStorage()`
- **Real-time verification**: Shows remaining storage items

### Manual Testing

1. **Create wallet and connect**
2. **Check localStorage**: Should contain auth data
3. **Click "Logout"**: Should clear everything
4. **Verify cleanup**: localStorage should be empty
5. **Use "Test Full Clear"**: For comprehensive testing

## Console Logging

All storage operations are logged with prefixes:

- `[StorageCleaner]` - Storage operations
- `[Auth]` - Authentication operations
- `[AuthTest]` - Testing operations

### Log Examples

```
[StorageCleaner] Starting comprehensive storage cleanup...
[StorageCleaner] localStorage cleared: 5 items
[StorageCleaner] sessionStorage cleared: 2 items
[StorageCleaner] IndexedDB database deleted: auth-store
[StorageCleaner] Cache storage cleared: 3 caches
[StorageCleaner] ✅ All storage mechanisms cleared successfully
[StorageCleaner] ✅ Storage cleanup verified - all data cleared
```

## Security Benefits

### Complete Data Removal

- No residual data left in any storage mechanism
- Prevents data leakage between sessions
- Ensures complete privacy on logout

### Cross-Session Isolation

- Each session starts completely fresh
- No cached authentication data
- No residual wallet information

### Privacy Protection

- Complete removal of sensitive data
- No traces left in browser storage
- Meets privacy requirements

## Performance Considerations

### Async Operations

- All cleanup operations are asynchronous
- Non-blocking UI during cleanup
- Parallel execution where possible

### Error Recovery

- Fallback mechanisms ensure cleanup continues
- No single point of failure
- Graceful degradation

### Browser Limits

- Respects browser storage limits
- Handles quota exceeded scenarios
- Continues operation despite limitations

## Troubleshooting

### Cleanup Not Working

1. Check browser console for errors
2. Verify storage permissions
3. Try manual cleanup via AuthTestPanel
4. Check for browser extensions blocking storage access

### Partial Cleanup

1. Check console logs for specific failures
2. Verify which storage mechanisms failed
3. Try individual cleanup functions
4. Check browser compatibility

### Performance Issues

1. Monitor console for slow operations
2. Check IndexedDB deletion logs
3. Verify cache clearing completion
4. Consider browser storage limits

## Future Enhancements

### Additional Storage Types

- WebSQL (legacy support)
- File System Access API
- Origin Private File System

### Enhanced Verification

- Cross-storage verification
- Data integrity checks
- Cleanup confirmation dialogs

### Performance Optimization

- Selective cleanup based on usage
- Background cleanup processes
- Optimized parallel operations
