# URL-Based Routing System

## Overview

The SONAR Web3 application now supports URL-based routing using query
parameters. This allows users to navigate directly to specific routes via URL
and enables proper browser history management.

## How It Works

### URL Format

Routes are accessed using the `router` query parameter:

```
https://live.stels.io/?router=welcome
https://live.stels.io/?router=markets
https://live.stels.io/?router=scanner
https://live.stels.io/?router=fred
https://live.stels.io/?router=network
https://live.stels.io/?router=canvas
https://live.stels.io/?router=wallet
```

### Available Routes

- `welcome` - Main dashboard
- `scanner` - Network scanner
- `markets` - Market data viewer
- `fred` - FRED economic data
- `network` - Network visualization
- `canvas` - Canvas/Flow editor
- `wallet` - Wallet management

## Implementation Details

### Core Components

#### 1. useUrlRouter Hook (`src/hooks/useUrlRouter.ts`)

- Synchronizes URL query parameters with application state
- Handles browser back/forward navigation
- Validates routes and redirects invalid ones to welcome
- Updates URL when route changes in store
- Prevents infinite loops with initialization tracking
- Provides detailed logging for debugging

#### 2. Router Utilities (`src/lib/router.ts`)

- `navigateTo(route)` - Programmatically navigate to a route
- `getCurrentRouteFromUrl()` - Get current route from URL
- `isValidRoute(route)` - Validate if route exists
- `syncUrlWithStore()` - Force sync URL with current store state
- `initializeFromUrl()` - Initialize routing from URL on app startup

#### 3. RouteLoader Component (`src/components/main/RouteLoader.tsx`)

- Shows loading state during direct link navigation
- Provides visual feedback while route is being initialized
- Handles both valid and invalid route scenarios

#### 4. Integration with App Store

- Uses existing Zustand store for state management
- Maintains `allowedRoutes` array for validation
- Preserves existing `setRoute` functionality
- Ensures proper state synchronization on app startup

### Features

#### Automatic URL Synchronization

- URL updates automatically when navigating via UI
- Application state updates when URL changes manually
- Browser history is properly maintained

#### Route Validation

- Invalid routes redirect to welcome page
- Console warnings for invalid route attempts
- Maintains security by only allowing predefined routes

#### Browser Navigation Support

- Back/forward buttons work correctly
- Popstate events are handled properly
- URL state is preserved across page reloads

#### Direct Link Navigation

- Users can share direct links to specific routes
- Proper loading states during route initialization
- Automatic store synchronization on app startup
- Graceful handling of invalid routes with redirects

## Usage Examples

### Programmatic Navigation

```typescript
import { navigateTo } from "@/lib/router";

// Navigate to markets
navigateTo("markets");

// Navigate to scanner
navigateTo("scanner");
```

### URL Validation

```typescript
import { getCurrentRouteFromUrl, isValidRoute } from "@/lib/router";

// Check if route is valid
if (isValidRoute("markets")) {
  navigateTo("markets");
}

// Get current route from URL
const currentRoute = getCurrentRouteFromUrl();
```

### Direct URL Access

Users can directly access routes by typing URLs:

- `https://live.stels.io/?router=markets`
- `https://live.stels.io/?router=scanner`
- `https://live.stels.io/?router=canvas`

### Direct Link Navigation

When users click on direct links or enter URLs manually:

1. **App Startup**: The `initializeFromUrl()` function runs on app mount
2. **Route Validation**: URL route is validated against allowed routes
3. **Store Sync**: If valid, store is updated with the route from URL
4. **Loading State**: `RouteLoader` shows loading indicator during
   initialization
5. **Route Rendering**: Target route component is rendered with proper state

**Example Flow:**

```
User clicks: https://live.stels.io/?router=markets
↓
App loads → initializeFromUrl() runs
↓
Route "markets" is validated
↓
Store currentRoute is set to "markets"
↓
RouteLoader shows loading state
↓
Markets component renders with proper state
```

## Testing

### Demo Component

The `UrlRouterDemo` component on the welcome page provides:

- Real-time URL and state monitoring
- Quick navigation buttons
- Test URL generation
- Invalid route testing
- Direct link testing with sync status indicators

### Manual Testing

1. Navigate to different routes via UI
2. Check that URL updates correctly
3. Use browser back/forward buttons
4. Manually edit URL query parameter
5. Test invalid routes (should redirect to welcome)
6. Test direct link navigation (open new tabs with URLs)
7. Verify loading states during direct navigation

## Browser Compatibility

- Modern browsers with URLSearchParams support
- IE11+ with polyfill (if needed)
- Mobile browsers fully supported
- Progressive enhancement approach

## Security Considerations

- Only predefined routes are allowed
- Invalid routes redirect to safe default
- No XSS vulnerabilities through URL manipulation
- Route validation happens on both client and store level

## Future Enhancements

- Support for nested routes
- Route parameters (e.g., `?router=markets&symbol=BTC`)
- Deep linking to specific components
- Route-based analytics tracking
