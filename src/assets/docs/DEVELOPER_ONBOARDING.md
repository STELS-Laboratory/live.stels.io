# Developer Onboarding Guide

**Category:** Developer\
**Version:** 1.0.0\
**Last Updated:** January 28, 2025\
**Target Audience:** New Developers, Contributors

---

## Welcome, Developer!

This guide will help you set up your development environment, understand the
codebase structure, and make your first contribution to STELS.

**Estimated time:** 30-60 minutes

---

## Prerequisites

Before starting, ensure you have:

### Required Software

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: v2.30.0 or higher ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended
  ([Download](https://code.visualstudio.com/))

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### Required Knowledge

- **JavaScript/TypeScript**: Intermediate level
- **React**: Functional components and hooks
- **Basic understanding**: Git, npm, command line

---

## Step 1: Clone and Setup

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/gliesereum/stels.git
cd stels

# Install dependencies
npm install
```

### Verify Installation

```bash
# Check versions
node --version  # Should be >= v18.0.0
npm --version   # Should be >= v9.0.0

# Verify dependencies installed
ls node_modules  # Should see many directories
```

---

## Step 2: Project Structure

Familiarize yourself with the codebase organization:

```
stels/
├── src/
│   ├── apps/               # Application modules
│   │   ├── canvas/         # Visual workflow builder
│   │   ├── editor/         # Protocol editor (Monaco)
│   │   ├── markets/        # Trading terminal
│   │   ├── wallet/         # Gliesereum wallet
│   │   ├── schemas/        # Schema management
│   │   ├── docs/           # Documentation viewer
│   │   ├── welcome/        # Application launcher
│   │   └── template/       # App template for new apps
│   │
│   ├── components/         # Reusable components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── main/           # Core app components
│   │   ├── auth/           # Authentication components
│   │   ├── panels/         # Panel system
│   │   └── widgets/        # Trading widgets
│   │
│   ├── stores/             # Zustand state stores
│   │   └── modules/        # Store modules
│   │       ├── app.store.ts      # Global app state
│   │       ├── auth.store.ts     # Authentication
│   │       ├── theme.store.ts    # Theme management
│   │       └── toast.store.ts    # Notifications
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── use_mobile.ts   # Mobile detection
│   │   ├── use_theme.ts    # Theme access
│   │   ├── use_web_socket_store.ts  # WebSocket
│   │   └── use_hydration.ts # State hydration
│   │
│   ├── lib/                # Core utilities
│   │   ├── gliesereum/     # Blockchain SDK
│   │   ├── gui/            # UI utilities and schema resolver
│   │   ├── utils.ts        # Helper functions
│   │   ├── router.ts       # URL routing
│   │   └── logger.ts       # Logging system
│   │
│   ├── assets/             # Static assets
│   │   ├── docs/           # Markdown documentation
│   │   └── icons/          # App icons
│   │
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles (Tailwind)
│
├── public/                 # Public static files
│   ├── schemas/            # JSON schemas
│   └── icons.json          # Icon manifest
│
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # Project documentation
```

---

## Step 3: Development Workflow

### Start Development Server

```bash
# Start Vite dev server with hot reload
npm run dev
```

**Expected output:**

```
VITE v5.0.0  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open `http://localhost:5173/` in your browser.

### Understanding Hot Module Replacement (HMR)

STELS uses Vite's HMR for instant updates:

1. Edit any file in `src/`
2. Save the file
3. Browser updates automatically **without full reload**
4. React state is preserved when possible

**Try it:**

1. Open any `.tsx` file
2. Change some text
3. Save and see instant update in browser

---

## Step 4: Code Standards

STELS follows strict coding standards. Familiarize yourself with them:

### TypeScript Standards

**Always use explicit types:**

```typescript
// ✅ GOOD: Explicit return type
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ BAD: No return type
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Never use `any`:**

```typescript
// ✅ GOOD: Use unknown or proper type
function processData(data: unknown): Result {
  if (typeof data === "object" && data !== null) {
    // Type narrowing
  }
}

// ❌ BAD: Using any
function processData(data: any): Result {
  // Type safety lost
}
```

**No non-null assertions:**

```typescript
// ✅ GOOD: Handle null/undefined
const value = data?.value ?? defaultValue;

// ❌ BAD: Non-null assertion
const value = data!.value;
```

### React Component Standards

**Use functional components with hooks:**

```typescript
// ✅ GOOD: Functional component with typed props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Button(
  { label, onClick, disabled = false }: ButtonProps,
): React.ReactElement {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

**Always type props:**

```typescript
// ✅ GOOD: Interface for props
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

// ❌ BAD: No type
function UserCard({ user, onEdit }) {
  // ...
}
```

### Styling Standards

**Use Tailwind CSS classes exclusively:**

```typescript
// ✅ GOOD: Tailwind classes
<button className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
  Click me
</button>

// ❌ BAD: Inline styles
<button style={{ padding: '8px 16px', backgroundColor: '#f59e0b' }}>
  Click me
</button>
```

**Use `cn()` utility for conditional classes:**

```typescript
import { cn } from "@/lib/utils";

// ✅ GOOD: Using cn() utility
<div
  className={cn(
    "base-class",
    isActive && "active-class",
    hasError && "error-class",
  )}
>
  Content
</div>;
```

### File Naming Conventions

- **Components**: `PascalCase.tsx` (e.g., `UserCard.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Stores**: `snake_case.ts` (e.g., `user_store.ts`)
- **Hooks**: `camelCase.ts` (e.g., `useUserData.ts`)

---

## Step 5: Running Code Quality Checks

### Type Checking

```bash
# Run TypeScript compiler check
npm run type-check

# Expected: No errors
```

**If you see errors:**

1. Read the error message carefully
2. Check the file and line number
3. Fix type issues
4. Run again until clean

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**Common lint errors:**

- Unused variables
- Missing dependencies in hooks
- Incorrect hook usage
- Accessibility issues

### Building

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

**Expected:**

- Build completes without errors
- Bundle sizes are reasonable
- Preview opens in browser

---

## Step 6: Understanding State Management

STELS uses Zustand for state management. Here's how to work with stores:

### Reading from Store

```typescript
import { useAppStore } from "@/stores";

function MyComponent(): React.ReactElement {
  // Subscribe to specific state
  const currentRoute = useAppStore((state) => state.currentRoute);
  const isDeveloper = useAppStore((state) => state.isDeveloper);

  // Use in component
  return <div>Current route: {currentRoute}</div>;
}
```

### Updating Store

```typescript
import { useAppStore } from "@/stores";

function Navigation(): React.ReactElement {
  const navigateTo = useAppStore((state) => state.navigateTo);

  const handleClick = (): void => {
    navigateTo("canvas");
  };

  return <button onClick={handleClick}>Go to Canvas</button>;
}
```

### Creating a New Store

```typescript
// src/stores/modules/my_feature.store.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface MyFeatureState {
  // State properties
  data: string[];
  isLoading: boolean;

  // Actions
  addData: (item: string) => void;
  clearData: () => void;
}

export const useMyFeatureStore = create<MyFeatureState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        data: [],
        isLoading: false,

        // Actions
        addData: (item: string) => {
          set((state) => ({
            data: [...state.data, item],
          }));
        },

        clearData: () => {
          set({ data: [] });
        },
      }),
      {
        name: "my-feature-store",
        partialize: (state) => ({
          data: state.data,
          // Don't persist loading state
        }),
      },
    ),
    { name: "My Feature Store" },
  ),
);
```

---

## Step 7: Working with Components

### Using shadcn/ui Components

STELS uses shadcn/ui for base components:

```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function MyForm(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <h2>Form Title</h2>
      </CardHeader>
      <CardContent>
        <Input type="text" placeholder="Enter value" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Creating Custom Components

```typescript
// src/components/feature/MyComponent.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface MyComponentProps {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

/**
 * MyComponent displays a titled card with optional description
 *
 * @param title - The main heading
 * @param description - Optional description text
 * @param variant - Visual variant style
 */
export function MyComponent({
  title,
  description,
  variant = "default",
}: MyComponentProps): React.ReactElement {
  return (
    <div
      className={cn(
        "p-4 rounded border",
        variant === "success" && "bg-green-500/10 border-green-500/20",
        variant === "error" && "bg-red-500/10 border-red-500/20",
      )}
    >
      <h3 className="font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
```

---

## Step 8: WebSocket Integration

STELS uses WebSocket for real-time communication:

### Accessing WebSocket

```typescript
import { useWebSocketStore } from "@/hooks/use_web_socket_store";

function MyRealtimeComponent(): React.ReactElement {
  const { connection, isConnected, send } = useWebSocketStore();

  const handleSendMessage = (): void => {
    if (isConnected) {
      send({
        type: "my-operation",
        payload: { data: "value" },
      });
    }
  };

  return (
    <div>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}
```

### Handling Messages

```typescript
useEffect(() => {
  if (!connection) return;

  const handleMessage = (event: MessageEvent): void => {
    const message = JSON.parse(event.data);

    if (message.type === "my-event") {
      // Handle message
      console.log("Received:", message.payload);
    }
  };

  connection.addEventListener("message", handleMessage);

  return () => {
    connection.removeEventListener("message", handleMessage);
  };
}, [connection]);
```

---

## Step 9: Your First Contribution

Let's create a simple feature to get familiar with the workflow.

### Task: Add a "Hello Developer" Component

**1. Create the component:**

```typescript
// src/components/developer/HelloDeveloper.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function HelloDeveloper(): React.ReactElement {
  const developerName = "Fellow Developer";

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-2">
          Hello, {developerName}! 👋
        </h2>
        <p className="text-muted-foreground">
          Welcome to STELS development. You're ready to build amazing things!
        </p>
      </CardContent>
    </Card>
  );
}
```

**2. Export from index:**

```typescript
// src/components/developer/index.ts
export { HelloDeveloper } from "./HelloDeveloper";
```

**3. Use in an app:**

```typescript
// src/apps/welcome/Welcome.tsx
import { HelloDeveloper } from "@/components/developer";

// Add to your component
<HelloDeveloper />;
```

**4. Test it:**

1. Save all files
2. Check browser (HMR should update)
3. Verify component displays correctly

**5. Verify quality:**

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

---

## Step 10: Creating Your First App

Use the template system to create a new app:

### Copy the Template

```bash
cd src/apps/
cp -r template my-first-app
cd my-first-app
```

### Follow Integration Steps

1. **Rename main file:**
   ```bash
   mv template-app.tsx my-first-app.tsx
   ```

2. **Update component name:**
   ```typescript
   // my-first-app.tsx
   export function MyFirstApp(): React.ReactElement {
     // Your app code
   }
   ```

3. **Register in app store:**
   ```typescript
   // src/stores/modules/app.store.ts
   const allowedRoutes = [
     // ... existing routes
     "my-first-app",
   ];
   ```

4. **Add to navigation:**
   ```typescript
   // src/components/main/layout.tsx
   import { MyIcon } from "lucide-react";

   const systemNav: NavItem[] = [
     // ... existing items
     { key: "my-first-app", label: "My App", icon: MyIcon },
   ];
   ```

5. **Configure routing:**
   ```typescript
   // src/App.tsx
   const routes = {
     // ... existing routes
     "my-first-app": () => import("@/apps/my-first-app"),
   };
   ```

**Detailed instructions:** See `/src/apps/template/QUICKSTART.md`

---

## Step 11: Debugging Tips

### React DevTools

Install React DevTools extension:

- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

**Features:**

- Inspect component tree
- View props and state
- Track re-renders
- Profile performance

### Zustand DevTools

Zustand integrates with Redux DevTools:

- [Chrome Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

**Features:**

- View store state
- Track actions
- Time-travel debugging
- State diff visualization

### Console Logging

Use the structured logger:

```typescript
import { logger } from "@/lib/logger";

logger.info("Component mounted", {
  context: "MyComponent",
  data: { props },
});

logger.error("Operation failed", {
  context: "MyComponent",
  data: { error: error.message },
});
```

### Network Debugging

**WebSocket messages:**

1. Open DevTools → Network tab
2. Filter: WS (WebSocket)
3. Click connection
4. View Messages tab
5. See all sent/received messages

---

## Step 12: Common Issues and Solutions

### Issue: TypeScript Errors

**Problem:** `Property 'x' does not exist on type 'y'`

**Solution:**

1. Check type definitions
2. Ensure proper imports
3. Update interface if needed

### Issue: Component Not Updating

**Problem:** State changes but UI doesn't update

**Solution:**

1. Check if using proper Zustand selectors
2. Verify React dependencies in hooks
3. Ensure immutable updates

### Issue: WebSocket Not Connecting

**Problem:** Connection fails or disconnects

**Solution:**

1. Check WebSocket URL configuration
2. Verify network connectivity
3. Check browser console for errors
4. Review reconnection logic

### Issue: Build Fails

**Problem:** Production build errors

**Solution:**

1. Run type check: `npm run type-check`
2. Fix all TypeScript errors
3. Run lint: `npm run lint -- --fix`
4. Try build again

---

## Step 13: Best Practices

### Code Organization

- **One component per file**
- **Group related files in folders**
- **Use index files for exports**
- **Keep components focused and small**

### Performance

- **Use `React.memo` for expensive components**
- **Memoize callbacks with `useCallback`**
- **Memoize computations with `useMemo`**
- **Implement proper cleanup in `useEffect`**

### Security

- **Never log private keys**
- **Validate all inputs**
- **Use constant-time comparisons**
- **Sanitize user-generated content**

### Accessibility

- **Use semantic HTML**
- **Add proper ARIA attributes**
- **Ensure keyboard navigation**
- **Test with screen readers**

---

## Step 14: Getting Help

### Documentation

- **In-app docs**: Navigate to Docs app
- **Code comments**: Read JSDoc comments
- **Template examples**: Check `/src/apps/template/`

### Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Pull Requests**: Contribute code and improvements

### Development Philosophy

Before asking for help, try to:

1. Read error messages carefully
2. Search documentation
3. Check similar components
4. Debug with console/DevTools
5. Isolate the problem

---

## Next Steps

You're now ready to develop with STELS! Continue learning:

- 🛠️ **[Building Your First Agent](BUILDING_FIRST_AGENT.md)** - Create an
  autonomous agent
- 📚 **[API Reference](API_REFERENCE.md)** - Detailed technical docs
- 🎨 **[UI Components Guide](UI_COMPONENTS_GUIDE.md)** - Component library
  reference
- ⚡ **[Performance Optimization](PERFORMANCE_GUIDE.md)** - Make your apps fast

---

## Checklist

Before you start developing, ensure:

- ✅ All dependencies installed (`npm install`)
- ✅ Dev server runs (`npm run dev`)
- ✅ Type checking passes (`npm run type-check`)
- ✅ Linting passes (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ VS Code extensions installed
- ✅ DevTools extensions installed
- ✅ Project structure understood
- ✅ Coding standards reviewed
- ✅ First component created and tested

---

**Welcome to the STELS developer community. Let's build the future of autonomous
web applications together!**

---

_© 2025 Gliesereum Ukraine. All rights reserved._
