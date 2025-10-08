# Testnet Notification Components

This directory contains professional notification components for informing users
about testnet status and delays.

## Components

### TestnetNotification

Full-featured notification card with animations and detailed information about
testnet delays.

### TestnetStatusAlert

Compact alert component for easy integration into existing pages.

## Usage Examples

### Basic Integration in Scanner.tsx

```tsx
import TestnetStatusAlert from "@/components/notifications/TestnetStatusAlert";

// Add this after the "Notify Users" comment in Scanner.tsx
return (
  <div className="container m-auto">
    {/* Notify Users */}
    <TestnetStatusAlert className="mb-6" />

    {/* Rest of your existing content */}
    <Card className="p-0 bg-zinc-950 border-0">
      {/* ... */}
    </Card>
  </div>
);
```

### Compact Version

```tsx
import TestnetStatusAlert from "@/components/notifications/TestnetStatusAlert";

// Use compact variant for less space
<TestnetStatusAlert variant="compact" className="mb-4" />;
```

### Full Featured Version

```tsx
import TestnetNotification from "@/components/notifications/TestnetNotification";

// Use full notification card
<TestnetNotification className="mb-6" />;
```

## Features

- ✅ Professional design matching project standards
- ✅ Amber/zinc color palette
- ✅ Dark mode support
- ✅ Dismissible notifications
- ✅ Animated elements
- ✅ Responsive design
- ✅ Accessibility features
- ✅ TypeScript support
- ✅ Follows shadcn/ui patterns
