# STELS Web3 OS - Component Development Guide

## Component Architecture

### Component Types

#### 1. Page Components (Routes)

**Location:** `src/apps/*/`\
**Purpose:** Top-level application views\
**Examples:** `Markets.tsx`, `Scanner.tsx`, `Canvas/Flow.tsx`

#### 2. Feature Components

**Location:** `src/apps/*/components/`\
**Purpose:** Application-specific functionality\
**Examples:** `Markets/components/MarketRow.tsx`,
`Scanner/components/AccountCard.tsx`

#### 3. UI Components

**Location:** `src/components/ui/`\
**Purpose:** Reusable interface primitives (shadcn/ui)\
**Examples:** `button.tsx`, `card.tsx`, `dialog.tsx`

#### 4. Widget Components

**Location:** `src/components/widgets/`\
**Purpose:** Real-time data visualization\
**Examples:** `Ticker.tsx`, `OrderBook.tsx`, `Candles.tsx`

#### 5. Shared Components

**Location:** `src/components/auth/`, `src/components/main/`, etc.\
**Purpose:** Cross-application functionality\
**Examples:** `ProfessionalConnectionFlow.tsx`, `Header.tsx`

## Component Standards

### Functional Component Pattern

```typescript
import React from "react";

/**
 * Component description explaining its purpose and behavior
 */
interface ComponentNameProps {
  /** Prop description */
  requiredProp: string;
  /** Optional prop description with default */
  optionalProp?: number;
  /** Callback description */
  onEvent?: (value: string) => void;
}

/**
 * ComponentName - Brief description
 */
export function ComponentName({
  requiredProp,
  optionalProp = 0,
  onEvent,
}: ComponentNameProps): React.ReactElement {
  // 1. Hooks (order matters)
  const [state, setState] = React.useState<string>("");
  const ref = React.useRef<HTMLDivElement>(null);
  const memoValue = React.useMemo(() => {
    return expensiveComputation(requiredProp);
  }, [requiredProp]);

  // 2. Effects
  React.useEffect(() => {
    // Side effect logic

    return () => {
      // Cleanup
    };
  }, [/* dependencies */]);

  // 3. Event handlers
  const handleClick = React.useCallback((): void => {
    setState("clicked");
    onEvent?.(state);
  }, [state, onEvent]);

  // 4. Render logic
  if (!requiredProp) {
    return <div>Error: Missing required prop</div>;
  }

  // 5. Return JSX
  return (
    <div className="component-container" ref={ref}>
      <button onClick={handleClick}>
        {memoValue}
      </button>
    </div>
  );
}

// Export as default if it's the main component of the file
export default ComponentName;
```

### TypeScript Requirements

**Strict Mode Rules:**

```typescript
// ✅ Do: Explicit return type
export function Component(): React.ReactElement {
  return <div />;
}

// ❌ Don't: Implicit return
export function Component() {
  return <div />;
}

// ✅ Do: Use unknown for dynamic data
const data: unknown = apiResponse;
if (isValidData(data)) {
  const typed = data as ValidType;
}

// ❌ Don't: Use any
const data: any = apiResponse;

// ✅ Do: Type guards
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// ✅ Do: Optional chaining
const value = obj?.nested?.property;

// ❌ Don't: Non-null assertion
const value = obj!.nested!.property;
```

### Props Interface Pattern

```typescript
// ✅ Good: Separate interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  // ...
}

// ✅ Also acceptable: Inline type
export function Button({
  label,
  onClick,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  // ...
}

// ❌ Avoid: React.FC (unless children needed)
export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  // ...
};

// ✅ Use React.FC only when children are required
interface ContainerProps {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children }) => {
  return <div className="container">{children}</div>;
};
```

## Styling Guidelines

### Tailwind CSS v4 Standards

**Do's:**

```typescript
// ✅ Use utility classes
<div className="flex items-center gap-4 p-6 bg-card border border-border rounded-lg">

// ✅ Responsive classes
<div className="text-sm md:text-base lg:text-lg">

// ✅ Dark mode support
<div className="bg-white dark:bg-zinc-900">

// ✅ Conditional classes with cn()
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)}>
```

**Don'ts:**

```typescript
// ❌ Inline styles
<div style={{ padding: "24px", backgroundColor: "#fff" }}>

// ❌ Custom CSS classes (except when absolutely necessary)
<div className="my-custom-class">

// ❌ Arbitrary values without good reason
<div className="p-[17px]">  // Use standard spacing scale
```

### Color Palette

**Primary Colors:**

- Amber: `#f59e0b` (`amber-500`)
- Zinc: For grays and backgrounds

**Semantic Colors:**

- Success: `green-500`
- Error: `red-500`
- Warning: `amber-500`
- Info: `blue-500`

**Usage:**

```typescript
// ✅ Correct
<div className="text-amber-500 bg-amber-500/10 border-amber-500/30">

// ✅ Semantic
<div className="text-green-500">Success</div>
<div className="text-red-500">Error</div>
```

### Responsive Design

**Breakpoint Strategy:**

```typescript
// Mobile-first approach
<div className="
  text-xs          // Mobile (default)
  sm:text-sm       // Small (640px+)
  md:text-base     // Medium (768px+)
  lg:text-lg       // Large (1024px+)
  xl:text-xl       // Extra large (1280px+)
">
```

**Layout Patterns:**

```typescript
// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Flex with wrap
<div className="flex flex-col md:flex-row gap-4">

// Hidden on mobile
<div className="hidden md:block">

// Only on mobile
<div className="md:hidden">
```

## Component Composition

### Container/Presentational Pattern

**Container Component:**

```typescript
/**
 * Container handles data fetching and business logic
 */
export function MarketDataContainer(): React.ReactElement {
  const session = useSessionStoreSync();
  const marketData = filterSession(session || {}, /\.ticker$/);

  const processedData = useMemo(() => {
    return marketData.map((item) => ({
      // Transform data
    }));
  }, [marketData]);

  return <MarketDataPresentation data={processedData} />;
}

/**
 * Presentational component only renders UI
 */
interface MarketDataPresentationProps {
  data: ProcessedData[];
}

export function MarketDataPresentation({
  data,
}: MarketDataPresentationProps): React.ReactElement {
  return (
    <div>
      {data.map((item) => <MarketRow key={item.id} data={item} />)}
    </div>
  );
}
```

### Compound Component Pattern

**Use Case:** Components with internal structure (Tabs, Dialog, Card)

```typescript
/**
 * Parent component
 */
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

/**
 * Sub-components
 */
Card.Header = function CardHeader({ children }) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }) {
  return <div className="card-body">{children}</div>;
};

Card.Footer = function CardFooter({ children }) {
  return <div className="card-footer">{children}</div>;
};

/**
 * Usage
 */
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>;
```

### Render Props Pattern

**Use Case:** Share rendering logic

```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (
    data: T | null,
    loading: boolean,
    error: string | null,
  ) => React.ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [url]);

  return <>{children(data, loading, error)}</>;
}

// Usage:
<DataFetcher<UserData> url="/api/user">
  {(data, loading, error) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error} />;
    return <UserProfile user={data} />;
  }}
</DataFetcher>;
```

## Custom Hooks

### Hook Development Pattern

```typescript
/**
 * Hook description and purpose
 * @param param1 - Description
 * @returns Description of return value
 */
export function useCustomHook(param1: string): ReturnType {
  // 1. State
  const [value, setValue] = useState<string>("");

  // 2. Refs
  const mountedRef = useRef<boolean>(true);

  // 3. Effects
  useEffect(() => {
    // Effect logic

    return () => {
      mountedRef.current = false;
    };
  }, [param1]);

  // 4. Memoized values
  const computedValue = useMemo(() => {
    return expensiveComputation(value);
  }, [value]);

  // 5. Callbacks
  const handleUpdate = useCallback((newValue: string): void => {
    if (mountedRef.current) {
      setValue(newValue);
    }
  }, []);

  // 6. Return
  return {
    value,
    computedValue,
    handleUpdate,
  };
}
```

### Common Hook Patterns

#### Data Fetching Hook

```typescript
interface UseDataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDataFetch<T>(url: string): UseDataFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

#### Form Hook

```typescript
interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  handleChange: (field: keyof T, value: unknown) => void;
  handleSubmit: (
    onSubmit: (values: T) => void | Promise<void>,
  ) => Promise<void>;
  reset: () => void;
}

export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  validate?: (values: T) => Partial<Record<keyof T, string>>,
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = useCallback((field: keyof T, value: unknown): void => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => void | Promise<void>,
  ): Promise<void> => {
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    await onSubmit(values);
  }, [values, validate]);

  const reset = useCallback((): void => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return { values, errors, handleChange, handleSubmit, reset };
}
```

## UI Component Library (shadcn/ui)

### Available Components

**Location:** `src/components/ui/`

#### Form Components

- `button.tsx` - Button with variants
- `input.tsx` - Text input
- `textarea.tsx` - Multi-line input
- `select.tsx` - Dropdown select
- `checkbox.tsx` - Checkbox input
- `switch.tsx` - Toggle switch
- `label.tsx` - Form label

#### Layout Components

- `card.tsx` - Content container
- `separator.tsx` - Visual divider
- `scroll-area.tsx` - Scrollable container
- `tabs.tsx` - Tabbed interface

#### Feedback Components

- `alert.tsx` - Alert messages
- `badge.tsx` - Status badges
- `progress.tsx` - Progress bar
- `tooltip.tsx` - Hover tooltips
- `dialog.tsx` - Modal dialogs
- `loader.tsx` - Loading indicator

#### Data Display

- `table.tsx` - Data table
- `accordion.tsx` - Expandable sections

### Component Usage Examples

#### Button

```typescript
import { Button } from "@/components/ui/button";

<Button
  variant="default" // default | outline | ghost | destructive
  size="default" // default | sm | lg | icon
  onClick={handleClick}
  disabled={isLoading}
  className="custom-classes"
>
  Click Me
</Button>;
```

#### Card

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card className="border-2">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

#### Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function MyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogHeader>

        <div>Dialog content</div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### Tabs

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1" className="w-full">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>

  <TabsContent value="tab1">
    Content for tab 1
  </TabsContent>

  <TabsContent value="tab2">
    Content for tab 2
  </TabsContent>
</Tabs>;
```

#### Select

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={selected} onValueChange={setSelected}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>;
```

## Widget Development

### Widget Component Pattern

```typescript
/**
 * Widget for displaying ticker data
 */
interface TickerWidgetProps {
  raw: TickerRawData;
}

interface TickerRawData {
  exchange: string;
  market: string;
  last: number;
  change: number;
  percentage: number;
  volume: number;
}

export function TickerWidget({ raw }: TickerWidgetProps): React.ReactElement {
  // Format data
  const formatPrice = (price: number): string => {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  // Determine color
  const priceColor = raw.change >= 0 ? "text-green-500" : "text-red-500";

  return (
    <div className="bg-card p-4 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{raw.market}</div>
          <div className={cn("text-2xl font-bold", priceColor)}>
            ${formatPrice(raw.last)}
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-sm font-mono", priceColor)}>
            {raw.change >= 0 ? "+" : ""}
            {raw.percentage.toFixed(2)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Vol: {raw.volume.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Registering New Widget Type

**1. Add to WidgetType enum:**

```typescript
// src/lib/canvas-types.ts
export const WidgetType = {
  TICKER: "ticker",
  TRADES: "trades",
  BOOK: "book",
  CANDLES: "candles",
  INDICATOR: "indicator",
  MY_WIDGET: "mywidget", // Add new type
} as const;
```

**2. Create widget component:**

```typescript
// src/components/widgets/MyWidget.tsx
export function MyWidget({ raw }: { raw: MyWidgetData }) {
  return <div>{/* widget UI */}</div>;
}
```

**3. Register in NodeFlow:**

```typescript
// src/apps/Canvas/NodeFlow.tsx
switch (widgetType) {
  case WidgetType.TICKER:
    return <Ticker raw={raw} />;
  case WidgetType.MY_WIDGET:
    return <MyWidget raw={raw} />;
    // ...
}
```

**4. Define data structure:**

```typescript
// In your widget or types file
interface MyWidgetData {
  field1: string;
  field2: number;
  timestamp: number;
}
```

## Animation Guidelines

### Framer Motion Integration

**Basic Animation:**

```typescript
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>;
```

**Page Transitions:**

```typescript
import { AnimatePresence, motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -10 },
};

<AnimatePresence mode="wait">
  <motion.div
    key={currentRoute}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
  >
    {content}
  </motion.div>
</AnimatePresence>;
```

**Interactive Elements:**

```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  Click Me
</motion.button>;
```

### Animation Performance

**Do's:**

- Use `transform` and `opacity` for animations (GPU accelerated)
- Use `AnimatePresence` for exit animations
- Keep duration under 300ms for UI responsiveness
- Use easing functions: `[0.16, 1, 0.3, 1]` (custom ease-out)

**Don'ts:**

- Don't animate `width`, `height`, `top`, `left` (causes reflow)
- Don't animate many elements simultaneously
- Don't use animations for critical user interactions

## Form Handling

### Controlled Input Pattern

```typescript
function FormComponent() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    amount: 0,
  });

  const handleChange = (field: string, value: unknown): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Validate
    if (!formData.name) {
      alert("Name is required");
      return;
    }

    // Submit
    await submitData(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />
      <Input
        type="number"
        value={formData.amount}
        onChange={(e) => handleChange("amount", parseFloat(e.target.value))}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Form Validation

```typescript
interface FormErrors {
  name?: string;
  email?: string;
  amount?: string;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Name is required";
  }

  if (!data.email.includes("@")) {
    errors.email = "Invalid email format";
  }

  if (data.amount <= 0) {
    errors.amount = "Amount must be positive";
  }

  return errors;
}

// Usage:
const errors = validateForm(formData);
if (Object.keys(errors).length > 0) {
  setFormErrors(errors);
  return;
}
```

## Performance Optimization

### React.memo

**When to use:**

- Component renders frequently
- Props rarely change
- Rendering is expensive

```typescript
import React from "react";

interface ExpensiveComponentProps {
  data: ComplexData;
  onAction: () => void;
}

export const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
  onAction,
}: ExpensiveComponentProps): React.ReactElement {
  // Expensive rendering logic
  return <div>{/* Complex UI */}</div>;
});

// Optional: Custom comparison
export const ExpensiveComponent = React.memo(
  function ExpensiveComponent({ data, onAction }) {
    return <div>{/* Complex UI */}</div>;
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.data.id === nextProps.data.id;
  },
);
```

### useMemo

**When to use:**

- Expensive computation
- Result used in render
- Dependencies change infrequently

```typescript
function Component({ items, filter }) {
  // ✅ Memoize expensive operation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Complex filtering logic
      return complexFilter(item, filter);
    });
  }, [items, filter]);

  return (
    <div>
      {filteredItems.map((item) => <Item key={item.id} {...item} />)}
    </div>
  );
}
```

### useCallback

**When to use:**

- Callback passed to child components
- Callback used in dependencies
- Prevent unnecessary re-renders

```typescript
function Parent() {
  const [count, setCount] = useState(0);

  // ✅ Memoize callback
  const handleIncrement = useCallback((): void => {
    setCount((c) => c + 1);
  }, []);

  return <Child onIncrement={handleIncrement} />;
}

const Child = React.memo(function Child({
  onIncrement,
}: {
  onIncrement: () => void;
}) {
  // Only re-renders when onIncrement reference changes
  return <button onClick={onIncrement}>Increment</button>;
});
```

### Lazy Loading

**Route-based code splitting:**

```typescript
import { lazy, Suspense } from "react";

const Markets = lazy(() => import("@/apps/Markets"));
const Scanner = lazy(() => import("@/apps/Scanner"));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      {route === "markets" && <Markets />}
      {route === "scanner" && <Scanner />}
    </Suspense>
  );
}
```

## Accessibility

### ARIA Attributes

```typescript
// Interactive elements
<button
  aria-label="Close dialog"
  aria-pressed={isActive}
  aria-disabled={isDisabled}
>
  <X className="w-4 h-4" />
</button>

// Navigation
<nav aria-label="Primary navigation">
  <a href="/markets" aria-current={isActive ? "page" : undefined}>
    Markets
  </a>
</nav>

// Form controls
<input
  aria-label="Search applications"
  aria-describedby="search-help"
  aria-invalid={hasError}
/>
<span id="search-help">Enter app name to search</span>

// Dialogs
<Dialog>
  <DialogContent role="dialog" aria-modal="true">
    <DialogTitle>Title</DialogTitle>
  </DialogContent>
</Dialog>
```

### Keyboard Navigation

```typescript
function Component() {
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    switch (e.key) {
      case "Enter":
        handleSubmit();
        break;
      case "Escape":
        handleClose();
        break;
      case "ArrowUp":
        handleNavigateUp();
        e.preventDefault();
        break;
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Items list"
    >
      {/* content */}
    </div>
  );
}
```

### Focus Management

```typescript
function Modal({ open }: { open: boolean }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && modalRef.current) {
      // Focus modal on open
      modalRef.current.focus();

      // Trap focus
      const handleTab = (e: KeyboardEvent) => {
        // Focus trap logic
      };

      document.addEventListener("keydown", handleTab);
      return () => document.removeEventListener("keydown", handleTab);
    }
  }, [open]);

  return (
    <div ref={modalRef} tabIndex={-1}>
      {/* modal content */}
    </div>
  );
}
```

## Error Handling

### Error Boundary Pattern

```typescript
import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h2 className="text-red-500 font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-red-400">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage:
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>;
```

### Try-Catch in Async Functions

```typescript
async function handleAction(): Promise<void> {
  try {
    setLoading(true);
    setError(null);

    const result = await performAction();
    setData(result);
  } catch (err) {
    const errorMessage = err instanceof Error
      ? err.message
      : "An unknown error occurred";

    setError(errorMessage);
    console.error("[Component] Action failed:", err);
  } finally {
    setLoading(false);
  }
}
```

## Testing Components

### Component Testing Pattern

```typescript
import { fireEvent, render, screen } from "@testing-library/react";
import { ComponentName } from "./ComponentName";

describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName requiredProp="value" />);
    expect(screen.getByText("value")).toBeInTheDocument();
  });

  it("handles click event", () => {
    const handleClick = jest.fn();
    render(<ComponentName onEvent={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("updates on prop change", () => {
    const { rerender } = render(<ComponentName value="initial" />);
    expect(screen.getByText("initial")).toBeInTheDocument();

    rerender(<ComponentName value="updated" />);
    expect(screen.getByText("updated")).toBeInTheDocument();
  });
});
```

## Component Documentation

### JSDoc Standards

````typescript
/**
 * Card component for displaying trading metrics
 *
 * @example
 * ```tsx
 * <MetricCard
 *   label="Total Equity"
 *   value="$125,000.00"
 *   color="text-green-500"
 *   icon={<DollarSign />}
 * />
 * ```
 */
interface MetricCardProps {
  /** Label text displayed above value */
  label: string;
  /** Formatted value to display */
  value: string;
  /** Tailwind color class for value text */
  color?: string;
  /** Icon component displayed next to label */
  icon?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export function MetricCard({
  label,
  value,
  color = "text-foreground",
  icon,
  size = "md",
}: MetricCardProps): React.ReactElement {
  // Implementation
}
````

## Best Practices

### Component Structure

✅ **Do:**

- One component per file (except compound components)
- Export as default if it's the main component
- Co-locate types with component
- Keep components under 300 lines
- Extract complex logic to custom hooks

❌ **Don't:**

- Multiple unrelated components in one file
- Inline style objects
- Direct DOM manipulation
- Business logic in render methods
- Nested component definitions

### Props Design

✅ **Do:**

- Use descriptive prop names
- Provide default values for optional props
- Document each prop with JSDoc
- Use discriminated unions for variants
- Keep prop interfaces simple

❌ **Don't:**

- Pass entire objects when only one field is needed
- Use boolean flags for multiple states (use union types)
- Make everything configurable (YAGNI principle)
- Expose internal implementation details

### State Management

✅ **Do:**

- Use local state for UI state
- Use Zustand for shared/persistent state
- Lift state only when necessary
- Initialize state with proper types

❌ **Don't:**

- Put everything in global store
- Duplicate state across multiple stores
- Store derived data (use computed values)
- Forget to clean up effects

### Event Handlers

✅ **Do:**

- Name handlers `handle{EventName}`
- Use useCallback for callbacks passed to children
- Prevent default when needed
- Handle errors gracefully

❌ **Don't:**

- Define handlers inline in JSX
- Forget to stop propagation when needed
- Ignore TypeScript event types
- Create new functions on every render

### Conditional Rendering

✅ **Do:**

```typescript
// Early returns
if (!data) return <Loading />;
if (error) return <Error message={error} />;
return <Content data={data} />;

// Ternary for simple conditions
{
  isLoading ? <Spinner /> : <Content />;
}

// Logical AND for optional rendering
{
  showBadge && <Badge>New</Badge>;
}
```

❌ **Don't:**

```typescript
// Nested ternaries
{
  condition1
    ? (
      condition2 ? <A /> : <B />
    )
    : (
      condition3 ? <C /> : <D />
    );
}

// Use switch or multiple returns instead
```

## File Organization

### Component File Structure

```typescript
// 1. Imports
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 2. Type Definitions
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

interface LocalState {
  value: string;
}

// 3. Constants
const DEFAULT_VALUE = "default";
const MAX_ITEMS = 100;

// 4. Helper Functions (pure functions)
function formatValue(value: number): string {
  return value.toFixed(2);
}

// 5. Main Component
export function ComponentName({
  prop1,
  prop2 = 0,
}: ComponentProps): React.ReactElement {
  // Implementation
}

// 6. Sub-components (if tightly coupled)
function SubComponent() {
  return <div />;
}

// 7. Default export (if applicable)
export default ComponentName;
```

### Module Exports

```typescript
// src/apps/Markets/index.ts
export { default } from "./Markets";
export * from "./types";
export * from "./utils";
export * from "./components";
export * from "./store";
```

## Component Lifecycle

### Mounting

```typescript
useEffect(() => {
  console.log("Component mounted");

  // Initialize data
  loadInitialData();

  return () => {
    console.log("Component unmounted");
    // Cleanup
  };
}, []); // Empty deps = mount/unmount only
```

### Updating

```typescript
useEffect(() => {
  console.log("Prop changed:", prop);

  // React to prop change
  updateBasedOnProp(prop);
}, [prop]); // Runs when prop changes
```

### Cleanup

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    doSomething();
  }, 1000);

  // ✅ Always clean up side effects
  return () => {
    clearTimeout(timer);
  };
}, []);

useEffect(() => {
  const subscription = dataSource.subscribe(handleData);

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Common Components Reference

### Modal/Dialog Pattern

```typescript
interface DialogComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
}

export function DialogComponent({
  open,
  onOpenChange,
  onSubmit,
}: DialogComponentProps): React.ReactElement {
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    setFormData({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
        </DialogHeader>

        {/* Form fields */}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### List Component Pattern

```typescript
interface ListItem {
  id: string;
  name: string;
  value: number;
}

interface ListComponentProps {
  items: ListItem[];
  onItemClick?: (item: ListItem) => void;
  emptyMessage?: string;
}

export function ListComponent({
  items,
  onItemClick,
  emptyMessage = "No items found",
}: ListComponentProps): React.ReactElement {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="p-4 border rounded-lg hover:bg-muted cursor-pointer"
        >
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-muted-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
```

### Loading State Pattern

```typescript
interface ComponentState {
  data: Data | null;
  loading: boolean;
  error: string | null;
}

export function Component(): React.ReactElement {
  const [state, setState] = useState<ComponentState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  if (state.loading) {
    return <Loading />;
  }

  if (state.error) {
    return <Error message={state.error} />;
  }

  if (!state.data) {
    return <EmptyState />;
  }

  return <Content data={state.data} />;
}
```

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team
