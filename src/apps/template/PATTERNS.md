# Common Patterns for STELS Apps

This file contains frequently used patterns and code snippets for STELS
applications.

## 🎯 Component Patterns

### 1. Header with Actions

```typescript
<div className="border-b border-border bg-card/30 px-6 py-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
        <YourIcon className="w-5 h-5 text-amber-500" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground">App Title</h1>
        <p className="text-sm text-muted-foreground">Description</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        Secondary Action
      </Button>
      <Button
        variant="default"
        size="sm"
        className="bg-amber-500 hover:bg-amber-600 text-black"
      >
        Primary Action
      </Button>
    </div>
  </div>
</div>;
```

### 2. Stats Cards Grid

```typescript
const stats = [
  { label: "Total", value: 1234, icon: Database, color: "text-blue-500" },
  { label: "Active", value: 567, icon: Play, color: "text-green-500" },
  { label: "Errors", value: 8, icon: AlertCircle, color: "text-red-500" },
];

<div className="grid grid-cols-3 gap-4">
  {stats.map((stat) => {
    const Icon = stat.icon;
    return (
      <Card key={stat.label}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stat.value.toLocaleString()}
              </p>
            </div>
            <Icon className={`w-8 h-8 ${stat.color}`} />
          </div>
        </CardContent>
      </Card>
    );
  })}
</div>;
```

### 3. Data Table with Actions

```typescript
<div className="border border-border rounded overflow-hidden">
  <table className="w-full">
    <thead className="bg-muted/30 border-b border-border">
      <tr>
        <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
          Name
        </th>
        <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
          Status
        </th>
        <th className="px-4 py-2 text-left text-xs font-semibold text-foreground">
          Value
        </th>
        <th className="px-4 py-2 text-right text-xs font-semibold text-foreground">
          Actions
        </th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-border hover:bg-muted/50 transition-colors"
        >
          <td className="px-4 py-3 text-sm text-foreground">{item.name}</td>
          <td className="px-4 py-3">
            <Badge variant={item.active ? "success" : "secondary"}>
              {item.active ? "Active" : "Inactive"}
            </Badge>
          </td>
          <td className="px-4 py-3 text-sm text-foreground font-mono">
            {item.value.toLocaleString()}
          </td>
          <td className="px-4 py-3 text-right">
            <Button variant="ghost" size="sm">
              <Edit2 className="w-4 h-4" />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>;
```

### 4. Search and Filters Bar

```typescript
const [searchTerm, setSearchTerm] = useState("");
const [filterStatus, setFilterStatus] = useState<string | null>(null);

<div className="flex items-center gap-3 mb-4">
  {/* Search */}
  <div className="relative flex-1 max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-9"
    />
  </div>

  {/* Filters */}
  <div className="flex items-center gap-2">
    <Button
      variant={filterStatus === null ? "default" : "outline"}
      size="sm"
      onClick={() => setFilterStatus(null)}
    >
      All
    </Button>
    <Button
      variant={filterStatus === "active" ? "default" : "outline"}
      size="sm"
      onClick={() => setFilterStatus("active")}
    >
      Active
    </Button>
    <Button
      variant={filterStatus === "inactive" ? "default" : "outline"}
      size="sm"
      onClick={() => setFilterStatus("inactive")}
    >
      Inactive
    </Button>
  </div>
</div>;
```

### 5. Split Panel Layout

```typescript
import Split from "react-split";

<Split
  className="flex h-full"
  direction="horizontal"
  sizes={[30, 70]}
  minSize={[300, 400]}
  gutterSize={2}
>
  {/* Left Panel */}
  <div className="h-full bg-card overflow-auto">
    <div className="p-4">
      {/* Sidebar content */}
    </div>
  </div>

  {/* Right Panel */}
  <div className="h-full bg-background overflow-auto">
    <div className="p-6">
      {/* Main content */}
    </div>
  </div>
</Split>;
```

## 🔄 Store Patterns

### 1. Async Data Loading with Error Handling

```typescript
loadData: async (): Promise<void> => {
  set({ isLoading: true, error: null });

  try {
    const response = await fetch('/api/endpoint');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    set({
      data,
      isLoading: false,
      lastUpdate: Date.now(),
    });
  } catch (error) {
    set({
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to load data",
    });
  }
},
```

### 2. Optimistic Updates

```typescript
updateItem: async (id: string, updates: Partial<Item>): Promise<void> => {
  const { items } = get();
  
  // Optimistic update
  const updatedItems = items.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
  set({ items: updatedItems });
  
  try {
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    // Rollback on error
    set({ items });
    set({ error: "Failed to update item" });
  }
},
```

### 3. Pagination

```typescript
interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

const paginationSlice = {
  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 0,

  setPage: (page: number) => set({ currentPage: page }),
  setItemsPerPage: (count: number) => set({ itemsPerPage: count }),
  nextPage: () =>
    set((state) => ({
      currentPage: Math.min(
        state.currentPage + 1,
        Math.ceil(state.totalItems / state.itemsPerPage),
      ),
    })),
  prevPage: () =>
    set((state) => ({
      currentPage: Math.max(state.currentPage - 1, 1),
    })),
};
```

## 🎨 UI Patterns

### 1. Professional Alert Messages

```typescript
{/* Success */}
<Alert className="border-green-500/30 bg-green-500/10">
  <CheckCircle className="h-4 w-4 text-green-500" />
  <AlertDescription className="text-green-700 dark:text-green-600">
    Operation completed successfully!
  </AlertDescription>
</Alert>;

{/* Warning */}
<Alert className="border-orange-500/30 bg-orange-500/10">
  <AlertTriangle className="h-4 w-4 text-orange-500" />
  <AlertDescription className="text-orange-700 dark:text-orange-400">
    Please review before proceeding
  </AlertDescription>
</Alert>;

{/* Error */}
<Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
  <AlertCircle className="h-4 w-4 text-red-500" />
  <AlertDescription className="text-red-700 dark:text-red-400">
    An error occurred. Please try again.
  </AlertDescription>
</Alert>;

{/* Info */}
<Alert className="border-blue-500/30 bg-blue-500/10">
  <Info className="h-4 w-4 text-blue-500" />
  <AlertDescription className="text-blue-700 dark:text-blue-400">
    Additional information about this feature
  </AlertDescription>
</Alert>;
```

### 2. Professional Badges

```typescript
{/* Status Badges */}
<Badge variant="outline" className="border-green-400/50 bg-green-400/10 text-green-700 dark:text-green-600">
  Active
</Badge>

<Badge variant="outline" className="border-blue-400/50 bg-blue-400/10 text-blue-700 dark:text-blue-400">
  Pending
</Badge>

<Badge variant="outline" className="border-red-400/50 bg-red-400/10 text-red-700 dark:text-red-400">
  Error
</Badge>

<Badge variant="outline" className="border-amber-400/50 bg-amber-400/10 text-amber-700 dark:text-amber-400">
  Warning
</Badge>
```

### 3. Tooltips with Details

```typescript
<TooltipProvider>
  <Tooltip delayDuration={100}>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="sm">
        <Info className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <div className="flex flex-col gap-1">
        <span className="font-semibold">Feature Name</span>
        <span className="text-muted-foreground">
          Description · Keyboard shortcut
        </span>
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

### 4. Empty States

```typescript
{
  items.length === 0 && (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <YourIcon className="w-16 h-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Items Found
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get started by creating your first item
        </p>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Item
        </Button>
      </div>
    </div>
  );
}
```

### 5. Dialog/Modal Pattern

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function YourDialog({ open, onOpenChange }: DialogProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      // Your logic
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="relative p-2 border border-amber-500/30 bg-amber-500/10">
              <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
              <YourIcon className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-foreground">Dialog Title</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Dialog description text
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Dialog content */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            {isSubmitting ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 🔌 Hooks Patterns

### 1. Custom Data Hook

```typescript
interface UseDataReturn {
  data: DataType | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useData(): UseDataReturn {
  const [data, setData] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/data");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading, error, refresh: loadData };
}
```

### 2. WebSocket Hook

```typescript
export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [url]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, lastMessage, send };
}
```

### 3. Debounced Input

```typescript
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage:
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebouncedValue(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

## 🎬 Animation Patterns

### 1. Staggered List Animation

```typescript
import { motion } from "framer-motion";

{
  items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Item content */}
    </motion.div>
  ));
}
```

### 2. Scale on Hover

```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15, ease: "easeOut" }}
  className="p-4 bg-card rounded border border-border"
>
  Click me
</motion.button>;
```

### 3. Fade In/Out

```typescript
<AnimatePresence mode="wait">
  {show && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>;
```

## 🔐 Auth Patterns

### 1. Protected Content

```typescript
import { useAuthStore } from "@/stores/modules/auth.store";

function ProtectedComponent(): React.ReactElement {
  const { wallet, connectionSession } = useAuthStore();

  if (!wallet) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Wallet connection required
          </p>
          <Button onClick={() => navigateTo("welcome")}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (!connectionSession) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Connecting...</p>
      </div>
    );
  }

  return <div>{/* Protected content */}</div>;
}
```

### 2. Developer-Only Features

```typescript
const { connectionSession } = useAuthStore();
const isDeveloper = connectionSession?.developer || false;

{
  isDeveloper && (
    <div className="border-t border-border mt-4 pt-4">
      <p className="text-xs text-amber-500 mb-2">Developer Tools</p>
      {/* Developer-only content */}
    </div>
  );
}
```

## 📊 Data Display Patterns

### 1. Formatted Numbers

```typescript
// Price formatting
<span className="text-lg font-bold text-foreground">
  ${price.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}
</span>

// Crypto formatting (8 decimals)
<span className="font-mono text-foreground">
  {amount.toFixed(8)} BTC
</span>

// Percentage with color
<span className={`font-semibold ${
  change > 0 
    ? 'text-green-700 dark:text-green-600' 
    : 'text-red-700 dark:text-red-400'
}`}>
  {change > 0 ? '+' : ''}{change.toFixed(2)}%
</span>
```

### 2. Time Display

```typescript
// Relative time
function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Formatted date
<span className="text-xs text-muted-foreground">
  {new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}
</span>;
```

## ⌨️ Keyboard Shortcuts Pattern

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent): void => {
    // Ignore if typing in input
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Cmd/Ctrl + S - Save
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
      return;
    }

    // Simple key shortcuts
    switch (e.key.toLowerCase()) {
      case "r":
        handleRefresh();
        break;
      case "n":
        handleNew();
        break;
      case "escape":
        handleClose();
        break;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [handleSave, handleRefresh, handleNew, handleClose]);
```

## 🔄 Real-time Updates Pattern

```typescript
// Auto-refresh data every N seconds
useEffect(() => {
  const interval = setInterval(() => {
    loadData();
  }, 5000); // 5 seconds

  return () => clearInterval(interval);
}, [loadData]);

// With toggle
const [autoRefresh, setAutoRefresh] = useState(false);

useEffect(() => {
  if (!autoRefresh) return;

  const interval = setInterval(() => {
    loadData();
  }, 5000);

  return () => clearInterval(interval);
}, [autoRefresh, loadData]);
```

## 🎯 Performance Patterns

### 1. Memoized Expensive Calculations

```typescript
const expensiveData = useMemo(() => {
  return items
    .filter((item) => item.active)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}, [items]);
```

### 2. Callback Optimization

```typescript
const handleAction = useCallback((id: string) => {
  // Action logic
  updateItem(id);
}, [updateItem]);
```

### 3. Component Memoization

```typescript
const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
}: Props): React.ReactElement {
  // Expensive rendering logic
  return <div>{/* ... */}</div>;
});
```

## 📱 Responsive Patterns

```typescript
// Conditional rendering based on screen size
const mobile = useMobile();

<div className={`grid ${mobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}>
  {/* Content */}
</div>

// Responsive padding/spacing
<div className={`p-${mobile ? '4' : '6'}`}>
  {/* Content */}
</div>

// Hide on mobile
{!mobile && (
  <div className="hidden lg:block">
    {/* Desktop-only content */}
  </div>
)}
```

---

Use these patterns as building blocks for your STELS applications. All patterns
follow the platform's development standards and best practices.
