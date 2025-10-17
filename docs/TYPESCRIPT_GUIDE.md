# STELS Web3 OS - TypeScript Development Guide

## TypeScript Configuration

### Compiler Options

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "strict": true, // Enable all strict checks
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"] // Path alias
    }
  }
}
```

**Strict Mode Enabled:**

- `noImplicitAny` - No implicit any types
- `strictNullChecks` - Null and undefined are distinct types
- `strictFunctionTypes` - Function parameter contravariance
- `strictBindCallApply` - Strict bind/call/apply methods
- `strictPropertyInitialization` - Class properties must be initialized
- `noImplicitThis` - No implicit this
- `alwaysStrict` - Use "use strict" directive

## Type System Standards

### Explicit Return Types (Required)

**Functions:**

```typescript
// ✅ Correct: Explicit return type
function calculate(a: number, b: number): number {
  return a + b;
}

// ❌ Wrong: Implicit return type
function calculate(a: number, b: number) {
  return a + b;
}

// ✅ Correct: Async function
async function fetchData(url: string): Promise<Data> {
  const response = await fetch(url);
  return response.json();
}

// ✅ Correct: Void return
function logMessage(message: string): void {
  console.log(message);
}

// ✅ Correct: Never returns
function throwError(message: string): never {
  throw new Error(message);
}
```

**React Components:**

```typescript
// ✅ Correct: Explicit ReactElement
export function Component(props: Props): React.ReactElement {
  return <div>{props.value}</div>;
}

// ✅ Correct: JSX.Element also acceptable
export function Component(props: Props): JSX.Element {
  return <div>{props.value}</div>;
}

// ❌ Wrong: Implicit return
export function Component(props: Props) {
  return <div>{props.value}</div>;
}
```

**Callbacks:**

```typescript
// ✅ Correct: Typed callback
const handleClick = useCallback((): void => {
  doSomething();
}, []);

// ✅ Correct: Callback with params
const handleChange = useCallback((value: string): void => {
  setValue(value);
}, []);

// ✅ Correct: Async callback
const handleSubmit = useCallback(async (): Promise<void> => {
  await submitData();
}, []);
```

### Unknown vs Any

**Rule:** Use `unknown` instead of `any` for dynamic data

```typescript
// ✅ Correct: Use unknown
function processData(data: unknown): ProcessedData {
  if (isValidData(data)) {
    return transformData(data);
  }
  throw new Error("Invalid data");
}

// ❌ Wrong: Use any
function processData(data: any): ProcessedData {
  return transformData(data);  // No type safety
}

// ✅ Type guard pattern
function isValidData(data: unknown): data is ValidData {
  return (
    typeof data === "object" &&
    data !== null &&
    "requiredField" in data
  );
}

// Usage:
const apiResponse: unknown = await fetch(...);
if (isValidData(apiResponse)) {
  // TypeScript knows apiResponse is ValidData
  console.log(apiResponse.requiredField);
}
```

### Non-Null Assertions (Forbidden)

```typescript
// ❌ Wrong: Non-null assertion
const value = obj!.property;
const length = array!.length;

// ✅ Correct: Optional chaining
const value = obj?.property;
const length = array?.length;

// ✅ Correct: Type guard
if (obj && obj.property) {
  const value = obj.property;
}

// ✅ Correct: Default value
const value = obj?.property ?? "default";
```

## Type Definitions

### Interface vs Type

**Interfaces (Preferred for Objects):**

```typescript
// ✅ Use for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Can be extended
interface Admin extends User {
  permissions: string[];
}

// ✅ Can be augmented (declaration merging)
interface User {
  avatar?: string;
}
```

**Type Aliases (For Unions, Primitives):**

```typescript
// ✅ Use for unions
type Status = "idle" | "loading" | "success" | "error";

// ✅ Use for primitives
type ID = string;

// ✅ Use for tuples
type Coordinate = [number, number];

// ✅ Use for complex types
type Handler = (event: Event) => void;
```

**When to Use Each:**

- **Interface** - Objects, classes, when extension is likely
- **Type** - Unions, intersections, primitives, mapped types

### Component Props Types

**Props Interface:**

```typescript
/**
 * Props for MyComponent
 */
interface MyComponentProps {
  /** Required string prop */
  title: string;

  /** Optional number with default */
  count?: number;

  /** Callback function */
  onSubmit: (value: string) => void;

  /** Optional callback */
  onChange?: (value: number) => void;

  /** React children */
  children?: React.ReactNode;

  /** CSS class name */
  className?: string;

  /** Disabled state */
  disabled?: boolean;
}

export function MyComponent({
  title,
  count = 0,
  onSubmit,
  onChange,
  children,
  className,
  disabled = false,
}: MyComponentProps): React.ReactElement {
  // Implementation
}
```

**Props with Discriminated Unions:**

```typescript
// ✅ Better than boolean flags
interface BaseProps {
  title: string;
}

type ButtonProps =
  & BaseProps
  & (
    | { variant: "primary"; color: string }
    | { variant: "secondary"; outline: boolean }
    | { variant: "text"; underline?: boolean }
  );

function Button(props: ButtonProps): React.ReactElement {
  switch (props.variant) {
    case "primary":
      // TypeScript knows props.color exists
      return <button style={{ color: props.color }}>{props.title}</button>;
    case "secondary":
      // TypeScript knows props.outline exists
      return <button>{props.title}</button>;
    case "text":
      // TypeScript knows props.underline exists
      return <span>{props.title}</span>;
  }
}
```

### Store Types

**State and Actions Separation:**

```typescript
/**
 * Store state interface
 */
interface StoreState {
  value: string;
  count: number;
  items: Item[];
  loading: boolean;
  error: string | null;
}

/**
 * Store actions interface
 */
interface StoreActions {
  setValue: (value: string) => void;
  increment: () => void;
  addItem: (item: Item) => void;
  fetchItems: () => Promise<void>;
  reset: () => void;
}

/**
 * Combined store type
 */
export type Store = StoreState & StoreActions;

/**
 * Store implementation
 */
export const useStore = create<Store>()(
  devtools((set, get) => ({
    // State
    value: "",
    count: 0,
    items: [],
    loading: false,
    error: null,

    // Actions
    setValue: (value: string) => {
      set({ value });
    },

    increment: () => {
      set((state) => ({ count: state.count + 1 }));
    },

    addItem: (item: Item) => {
      set((state) => ({
        items: [...state.items, item],
      }));
    },

    fetchItems: async () => {
      set({ loading: true, error: null });
      try {
        const items = await api.fetchItems();
        set({ items, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Unknown error",
          loading: false,
        });
      }
    },

    reset: () => {
      set({
        value: "",
        count: 0,
        items: [],
        loading: false,
        error: null,
      });
    },
  })),
);
```

### Type Guards

**Purpose:** Narrow unknown types to specific types

```typescript
// Basic type guard
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Object type guard
interface User {
  id: string;
  name: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

// Array type guard
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

// Usage:
function process(data: unknown): void {
  if (isUser(data)) {
    // TypeScript knows data is User
    console.log(data.id, data.name);
  } else {
    throw new Error("Invalid user data");
  }
}
```

### Generic Types

**Generic Functions:**

```typescript
// ✅ Generic function with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Usage:
const user = { id: "123", name: "Alice" };
const name = getProperty(user, "name"); // Type: string
```

**Generic Components:**

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({
  items,
  renderItem,
  keyExtractor,
}: ListProps<T>): React.ReactElement {
  return (
    <div>
      {items.map((item) => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Usage:
<List<User>
  items={users}
  renderItem={(user) => <div>{user.name}</div>}
  keyExtractor={(user) => user.id}
/>;
```

**Generic Hooks:**

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T): void => {
    setStoredValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}

// Usage:
const [user, setUser] = useLocalStorage<User>("user", defaultUser);
```

## Advanced TypeScript Patterns

### Discriminated Unions

```typescript
// ✅ Type-safe state machine
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Data }
  | { status: "error"; error: string };

function Component({ state }: { state: State }) {
  switch (state.status) {
    case "idle":
      return <div>Idle</div>;
    case "loading":
      return <div>Loading...</div>;
    case "success":
      // TypeScript knows state.data exists
      return <div>{state.data.value}</div>;
    case "error":
      // TypeScript knows state.error exists
      return <div>Error: {state.error}</div>;
  }
}
```

### Utility Types

**Built-in TypeScript Utilities:**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// Partial - All properties optional
type PartialUser = Partial<User>;
// { id?: string; name?: string; email?: string; age?: number }

// Required - All properties required
type RequiredUser = Required<PartialUser>;

// Pick - Select specific properties
type UserBasic = Pick<User, "id" | "name">;
// { id: string; name: string }

// Omit - Exclude specific properties
type UserPublic = Omit<User, "email">;
// { id: string; name: string; age: number }

// Record - Object with specific key/value types
type UserMap = Record<string, User>;
// { [key: string]: User }

// Readonly - All properties readonly
type ImmutableUser = Readonly<User>;

// ReturnType - Extract function return type
type FunctionReturn = ReturnType<typeof myFunction>;

// Parameters - Extract function parameters
type FunctionParams = Parameters<typeof myFunction>;
```

**Custom Utility Types:**

```typescript
// Make specific fields optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Usage:
type UserUpdate = PartialBy<User, "email" | "age">;
// { id: string; name: string; email?: string; age?: number }

// Make specific fields required
type RequireBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Deep partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### Mapped Types

```typescript
// Transform all properties
type ReadonlyUser = {
  readonly [K in keyof User]: User[K];
};

// Conditional transformation
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// Filter properties by type
type StringProperties<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

// Usage:
type UserStrings = StringProperties<User>;
// { id: string; name: string; email: string }
```

### Template Literal Types

```typescript
// ✅ Type-safe string patterns
type EventName = `on${Capitalize<string>}`;
// "onClick", "onChange", etc.

type RouteParam = `${string}/:${string}`;
// "users/:id", "posts/:slug", etc.

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = `/${string}`;
type APIRoute = `${HTTPMethod} ${Endpoint}`;
// "GET /users", "POST /posts", etc.
```

## Type Organization

### File Structure

**Domain-Specific Types:**

```
src/lib/
├── api-types.ts        # API request/response types
├── canvas-types.ts     # Canvas and widget types
├── panel-types.ts      # Panel system types
└── gliesereum/
    └── types.ts        # Blockchain types
```

**Module Types:**

```
src/apps/Markets/
├── Markets.tsx
├── types.ts            # Market-specific types
├── utils.ts
└── components/
    └── MarketRow.tsx   # Can import from ../types.ts
```

### Export Strategy

**Public Types (Export):**

```typescript
// types.ts
export interface PublicType {
  field: string;
}

export type PublicUnion = "a" | "b" | "c";
```

**Private Types (Don't Export):**

```typescript
// Component.tsx
interface ComponentInternalState {
  // Only used within this file
}

function Component() {
  const [state, setState] = useState<ComponentInternalState>({});
}
```

**Re-exports:**

```typescript
// index.ts
export type { PublicType, PublicUnion } from "./types";
export { Component } from "./Component";
```

## Type Safety Patterns

### API Response Typing

```typescript
// ✅ Define expected response
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface User {
  id: string;
  name: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const json: unknown = await response.json();

  // Validate response
  if (!isAPIResponse<User>(json)) {
    throw new Error("Invalid response format");
  }

  if (!json.success || !json.data) {
    throw new Error(json.error || "Request failed");
  }

  return json.data;
}

function isAPIResponse<T>(value: unknown): value is APIResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof value.success === "boolean"
  );
}
```

### Event Handler Typing

```typescript
// ✅ Correct: Type event parameter
const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
  event.preventDefault();
  console.log("Button clicked");
};

const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
  const value = event.target.value;
  setValue(value);
};

const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
  if (event.key === "Enter") {
    handleSubmit();
  }
};

// ✅ Form submission
const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
  event.preventDefault();
  // Process form
};
```

### Store Selector Typing

```typescript
// ✅ Explicit return type in selector
const value = useStore((state): string => state.value);

// ✅ Multiple values
const { value, count } = useStore((
  state,
): { value: string; count: number } => ({
  value: state.value,
  count: state.count,
}));

// ✅ Custom selector hook
export const useStoreValue = (): string => useStore((state) => state.value);

export const useStoreActions = (): StoreActions =>
  useStore((state) => ({
    setValue: state.setValue,
    increment: state.increment,
  }));
```

### Async Function Typing

```typescript
// ✅ Correct: Promise return type
async function fetchData(): Promise<Data> {
  const response = await fetch("/api/data");
  return response.json();
}

// ✅ Correct: Void promise for side effects
async function saveData(data: Data): Promise<void> {
  await fetch("/api/data", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ✅ Correct: Error handling
async function fetchWithError(): Promise<Data> {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.error("Fetch failed:", error.message);
    }
    throw error;
  }
}
```

## Common Type Errors and Solutions

### Error: Type 'X' is not assignable to type 'Y'

**Problem:**

```typescript
interface Props {
  value: string;
}

function Component({ value }: Props) {
  const [state, setState] = useState(value);
  // Error: value is string but state could be inferred as any
}
```

**Solution:**

```typescript
// ✅ Explicit state type
const [state, setState] = useState<string>(value);
```

### Error: Object is possibly 'null' or 'undefined'

**Problem:**

```typescript
const user = getUser();
console.log(user.name); // Error: Object is possibly null
```

**Solutions:**

```typescript
// ✅ Optional chaining
console.log(user?.name);

// ✅ Null check
if (user) {
  console.log(user.name);
}

// ✅ Default value
const name = user?.name ?? "Unknown";

// ✅ Type assertion (if you're certain)
const name = user!.name; // ❌ Avoid this, prefer other methods
```

### Error: Argument of type 'unknown' is not assignable

**Problem:**

```typescript
function process(data: unknown) {
  return data.field; // Error: data is unknown
}
```

**Solution:**

```typescript
// ✅ Type guard
function process(data: unknown): string {
  if (isValidData(data)) {
    return data.field;
  }
  throw new Error("Invalid data");
}

function isValidData(value: unknown): value is { field: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "field" in value &&
    typeof (value as { field: unknown }).field === "string"
  );
}
```

### Error: Property 'X' does not exist on type 'Y'

**Problem:**

```typescript
interface User {
  name: string;
}

const user: User = { name: "Alice", age: 30 }; // Error: age not in User
```

**Solutions:**

```typescript
// ✅ Add property to interface
interface User {
  name: string;
  age?: number;
}

// ✅ Use type assertion (if intentional)
const user = { name: "Alice", age: 30 } as User;

// ✅ Use index signature for dynamic properties
interface User {
  name: string;
  [key: string]: unknown;
}
```

## Type Inference

### Let TypeScript Infer When Possible

```typescript
// ✅ Let TypeScript infer simple types
const count = 5; // Inferred as number
const name = "Alice"; // Inferred as string
const isActive = true; // Inferred as boolean

// ✅ Explicit type when needed
const items: Item[] = []; // Array starts empty
const user: User | null = null; // Could be null

// ✅ Function return types (always explicit)
function calculate(a: number, b: number): number {
  return a + b;
}
```

### Inferred Types in React

```typescript
// ✅ State type inferred from initial value
const [count, setCount] = useState(0); // count: number
const [name, setName] = useState(""); // name: string

// ✅ Explicit when initial value is null/undefined
const [user, setUser] = useState<User | null>(null);
const [data, setData] = useState<Data | undefined>(undefined);

// ✅ Ref type inferred from initial value
const divRef = useRef<HTMLDivElement>(null);
const countRef = useRef(0);
```

## Type Documentation

### JSDoc with TypeScript

````typescript
/**
 * Calculate total value of portfolio assets
 *
 * @param assets - Array of asset holdings
 * @param prices - Map of asset prices
 * @returns Total portfolio value in USD
 *
 * @example
 * ```typescript
 * const total = calculatePortfolioValue(
 *   [{ symbol: "BTC", amount: 1.5 }],
 *   { BTC: 50000 }
 * );
 * // Returns: 75000
 * ```
 */
function calculatePortfolioValue(
  assets: Asset[],
  prices: Record<string, number>,
): number {
  return assets.reduce((sum, asset) => {
    const price = prices[asset.symbol] || 0;
    return sum + (asset.amount * price);
  }, 0);
}
````

### Interface Documentation

```typescript
/**
 * Configuration for AMI worker execution
 */
interface WorkerConfig {
  /** Unique worker identifier */
  sid: string;

  /** Node ID where worker runs */
  nid: string;

  /** Whether worker is currently active */
  active: boolean;

  /** Worker execution mode
   * - parallel: Runs on all nodes
   * - leader: Distributed consensus
   * - exclusive: Specific node only
   */
  executionMode: "parallel" | "leader" | "exclusive";

  /** Execution priority (affects error tolerance and retry delay) */
  priority: "critical" | "high" | "normal" | "low";

  /** Runtime version (semver format) */
  version: string;

  /** Package dependencies */
  dependencies: string[];
}
```

## Type Testing

### Type Assertions for Testing

```typescript
// Compile-time type checks
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Usage:
type Test1 = AssertEqual<string, string>; // true
type Test2 = AssertEqual<string, number>; // false

// Ensure function returns correct type
function test() {
  const result = myFunction();
  const check: AssertEqual<typeof result, ExpectedType> = true;
}
```

### Runtime Type Validation

```typescript
// Zod-style validation (if added)
import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().positive().optional(),
});

type User = z.infer<typeof UserSchema>;

function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}

// Usage:
try {
  const user = validateUser(apiResponse);
  // user is guaranteed to match User type
} catch (error) {
  console.error("Validation failed:", error);
}
```

## Type Safety Best Practices

### Do's

✅ **Use strict mode** - Enable all strict checks\
✅ **Explicit return types** - Always declare function returns\
✅ **Type guards** - Narrow unknown types safely\
✅ **Const assertions** - Use `as const` for literal types\
✅ **Discriminated unions** - Better than boolean flags\
✅ **Generic constraints** - Use `extends` to limit generics\
✅ **Utility types** - Leverage built-in utilities\
✅ **Index signatures** - For dynamic object keys\
✅ **Enum alternatives** - Use union types or const objects

### Don'ts

❌ **Never use `any`** - Use `unknown` instead\
❌ **Avoid non-null assertions** - Use optional chaining\
❌ **Don't use `@ts-ignore`** - Fix the type error\
❌ **Don't duplicate type definitions** - Use imports\
❌ **Don't over-engineer types** - Keep them simple\
❌ **Avoid excessive type casting** - Use type guards\
❌ **Don't use `Object` or `Function` types** - Too broad

## TypeScript Tooling

### VS Code Integration

**Recommended Extensions:**

- TypeScript and JavaScript Language Features (built-in)
- ESLint
- Prettier
- Error Lens (inline errors)

**Editor Settings:**

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Type Checking

**Check Types:**

```bash
# Check all types
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/components/MyComponent.tsx

# Watch mode
npx tsc --noEmit --watch
```

**CI/CD Integration:**

```bash
# In build script (package.json)
{
  "scripts": {
    "build": "tsc -b && vite build"
  }
}
```

## Migration Guide

### Adding Types to Untyped Code

**Step 1: Add basic types**

```typescript
// Before:
function process(data) {
  return data.value;
}

// After:
function process(data: unknown): unknown {
  return (data as any).value;
}
```

**Step 2: Add type guards**

```typescript
function process(data: unknown): string {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error("Invalid data");
}

function isValidData(value: unknown): value is { value: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as { value: unknown }).value === "string"
  );
}
```

**Step 3: Proper interfaces**

```typescript
interface Data {
  value: string;
  count: number;
}

function process(data: unknown): string {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error("Invalid data");
}

function isValidData(value: unknown): value is Data {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "count" in value &&
    typeof (value as Data).value === "string" &&
    typeof (value as Data).count === "number"
  );
}
```

## Type Performance

### Optimization Tips

**Use Simpler Types:**

```typescript
// ✅ Fast: Simple type
type ID = string;

// ❌ Slow: Complex mapped type
type ComplexType<T> = {
  [K in keyof T]: T[K] extends object ? ComplexType<T[K]>
    : T[K];
};
```

**Limit Type Recursion:**

```typescript
// ❌ Potentially slow
type DeepPartial<T> = {
  [K in keyof T]: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// ✅ Better: Limit depth
type DeepPartial<T, D extends number = 5> = D extends 0 ? T
  : {
    [K in keyof T]: T[K] extends object ? DeepPartial<T[K], Prev[D]>
      : T[K];
  };
```

**Cache Type Results:**

```typescript
// ✅ Calculate once, reuse
type ProcessedUser = Omit<User, "password">;

function getUser(): ProcessedUser {
  // ...
}

function updateUser(user: ProcessedUser): void {
  // ...
}
```

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team
