# 🔧 Linter & Build Fixes

## 🎯 Problem

Проект не билдился из-за ошибок линтера в внешних библиотеках и type errors.

## ✅ Solutions Applied

### 1. Excluded External Libraries

#### ESLint Configuration (`eslint.config.js`)

**Before:**

```javascript
export default tseslint.config([
  globalIgnores(["dist"]),
  // ...
]);
```

**After:**

```javascript
export default tseslint.config([
  globalIgnores(["dist", "src/lib/ccxt", "src/components/editor/monaco"]),
  // ...
]);
```

#### TypeScript Configuration (`tsconfig.app.json`)

**Before:**

```json
{
  "include": ["src"]
}
```

**After:**

```json
{
  "include": ["src"],
  "exclude": ["src/lib/ccxt", "src/components/editor/monaco"]
}
```

**Rationale:**

- `ccxt` - External CCXT library (985 files, not our code)
- `monaco` - Monaco Editor SDK (autocomplete, types)
- Both contain third-party code with their own linting standards

---

### 2. Fixed Type Safety Issues

#### File: `src/hooks/useAutoConnections.ts`

**Error:**

```
91:42  error  Unexpected any. Specify a different type
```

**Before:**

```typescript
const toggleGroupingKey = useCallback((key: string) => {
  if (config.groupByKeys.includes(key as any)) { // ❌ any
    removeGroupingKey(key);
  }
}, []);
```

**After:**

```typescript
const toggleGroupingKey = useCallback((key: keyof ConnectionKeys) => {
  if (config.groupByKeys.includes(key)) { // ✅ Typed
    removeGroupingKey(key);
  }
}, []);
```

**Fix:** Used proper type `keyof ConnectionKeys` instead of `any`.

---

#### File: `src/components/widgets/AggregatedCandles/echarts-utils.ts`

**Errors:**

```
110:56  error  Unexpected any. Specify a different type
115:25  error  Unexpected any. Specify a different type
164:87  error  Property 'toFixed' does not exist
166:57  error  Property 'seriesName' does not exist
170:44  error  Property 'color' does not exist
172:56  error  'param.data' is possibly 'undefined'
```

**Before:**

```typescript
export const getCandlestickTooltipFormatter = (params: any): string => {
  params.forEach((param: any) => {
    // ...
  });
};
```

**After:**

```typescript
interface EChartsTooltipParam {
  componentSubType?: string;
  data?: number | number[] | [number, number, number, number, number];
  seriesName?: string;
  color?: string;
}

export const getCandlestickTooltipFormatter = (
  params: EChartsTooltipParam | EChartsTooltipParam[],
): string => {
  const paramsArray = Array.isArray(params) ? params : [params];

  paramsArray.forEach((param: EChartsTooltipParam) => {
    // Type guards for safe access
    if (
      param.componentSubType === "candlestick" &&
      param.data &&
      Array.isArray(param.data) &&
      param.data.length === 5
    ) {
      // Safe to use data as tuple
    }

    if (
      param.componentSubType === "bar" &&
      param.data &&
      typeof param.data === "number"
    ) {
      // Safe to use data.toFixed()
    }

    if (
      param.componentSubType === "line" &&
      param.seriesName &&
      param.data &&
      Array.isArray(param.data) &&
      param.data.length >= 2
    ) {
      // Safe to access param.data[1]
    }
  });
};
```

**Fixes:**

1. Created `EChartsTooltipParam` interface
2. Properly typed `params` parameter
3. Added type guards for safe property access
4. Handled different data types (number, array, tuple)
5. Added null checks for optional properties

---

## 📊 Results

### Before Fixes

```bash
$ npm run build
❌ 39 ESLint errors
❌ 5 TypeScript errors
❌ Build failed
```

### After Fixes

```bash
$ npm run build
✅ 0 ESLint errors
✅ 0 TypeScript errors
✅ Build successful in 14.95s
```

### Verification Commands

```bash
# ESLint check
$ npx eslint . --max-warnings 0
✅ Exit code: 0

# TypeScript check
$ npx tsc --noEmit
✅ Exit code: 0

# Production build
$ npm run build
✅ Exit code: 0
✅ Output: dist/ (4.28 MB)
```

---

## 🎯 Summary of Changes

### Configuration Files

| File                | Change                                                          | Purpose                                    |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `eslint.config.js`  | Added `src/lib/ccxt`, `src/components/editor/monaco` to ignores | Skip linting external libs                 |
| `tsconfig.app.json` | Added exclude array                                             | Skip TypeScript checking for external libs |

### Code Files

| File                    | Issue                  | Fix                                     |
| ----------------------- | ---------------------- | --------------------------------------- |
| `useAutoConnections.ts` | `any` type usage       | Changed to `keyof ConnectionKeys`       |
| `echarts-utils.ts`      | Multiple `any` types   | Created `EChartsTooltipParam` interface |
| `echarts-utils.ts`      | Unsafe property access | Added type guards and null checks       |

---

## 🔒 Type Safety Improvements

### Before

```typescript
// ❌ Unsafe - any allows anything
function toggle(key: string) {
  if (keys.includes(key as any)) { ... }
}

function formatter(params: any) {
  params.data.toFixed(2);  // May crash!
}
```

### After

```typescript
// ✅ Safe - proper types
function toggle(key: keyof ConnectionKeys) {
  if (keys.includes(key)) { ... }
}

function formatter(params: EChartsTooltipParam | EChartsTooltipParam[]) {
  if (param.data && typeof param.data === "number") {
    param.data.toFixed(2);  // Safe!
  }
}
```

---

## 📚 Best Practices Applied

1. **No `any` types** - Used proper TypeScript types
2. **Type guards** - Safe property access with runtime checks
3. **Null checks** - Handle undefined/null values
4. **Interface definitions** - Clear type contracts
5. **Excluded third-party** - Don't lint external libraries

---

## 🚀 Impact

### Build Performance

- ✅ Clean build without errors
- ✅ Faster linting (skips 985 ccxt files)
- ✅ Faster TypeScript compilation

### Code Quality

- ✅ Type safety maintained
- ✅ No `any` types in our code
- ✅ Proper error handling

### Developer Experience

- ✅ No false positives from external libs
- ✅ Clear error messages when issues occur
- ✅ Confident refactoring with type safety

---

## ⚙️ Maintenance

### Future External Libraries

When adding new external libraries:

1. **Check for linting issues**
   ```bash
   npx eslint src/path/to/lib
   ```

2. **Add to ignores if needed**
   ```javascript
   // eslint.config.js
   globalIgnores(["dist", "src/lib/ccxt", "src/path/to/lib"]);
   ```

3. **Add to TypeScript excludes**
   ```json
   // tsconfig.app.json
   "exclude": ["src/lib/ccxt", "src/path/to/lib"]
   ```

### When to Ignore

✅ **Do ignore:**

- Third-party libraries
- Generated code
- External SDKs
- Code with different standards

❌ **Don't ignore:**

- Your own code
- Project-specific utilities
- Application logic
- Custom components

---

**Fixed:** 2025-10-18\
**Status:** ✅ All checks passing\
**Build:** ✅ Production ready

**Commands to verify:**

```bash
npm run build        # Full production build
npx eslint .         # Linter check
npx tsc --noEmit     # Type check
```
