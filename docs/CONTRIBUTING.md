# Contributing to STELS Web3 OS

## Welcome

Thank you for your interest in contributing to STELS Web3 OS. This document
provides guidelines and best practices for contributing to the project.

## Code of Conduct

### Professional Standards

- Write clean, maintainable code
- Follow established patterns and conventions
- Write comprehensive documentation
- Test your changes thoroughly
- Be respectful in code reviews
- Use professional English in all communications

### Quality Standards

- TypeScript strict mode compliance
- No `any` types or non-null assertions
- Explicit return types on all functions
- Comprehensive error handling
- Proper cleanup in effects
- Responsive design (mobile + desktop)
- Accessibility compliance

## Getting Started

### Development Environment Setup

**Prerequisites:**

```bash
Node.js 18+ (LTS recommended)
npm 9+
Git 2.30+
Modern browser with DevTools
```

**Initial Setup:**

```bash
# Clone repository
git clone <repository-url>
cd apps/web3

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
http://localhost:5173
```

**Verify Setup:**

- Application loads without errors
- No TypeScript errors (`npx tsc --noEmit`)
- No ESLint errors (`npm run lint`)
- DevTools console is clean

## Development Workflow

### Branch Strategy

**Main Branches:**

- `main` - Production-ready code
- `develop` - Integration branch
- `canvas` - Canvas feature development (current)

**Feature Branches:**

```bash
# Create feature branch from develop
git checkout develop
git pull
git checkout -b feature/your-feature-name

# Work on feature
# Commit changes
# Push and create PR
```

**Naming Convention:**

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

### Commit Guidelines

**Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `style` - Formatting, styling
- `test` - Tests
- `chore` - Build, dependencies

**Examples:**

```bash
feat(canvas): add auto-connection system

Implemented automatic edge generation between widgets
based on shared properties (exchange, market, asset).

- Added useAutoConnections hook
- Added GroupedEdge component
- Added AutoConnectionsSettings panel

feat(editor): add worker statistics panel

fix(auth): resolve session expiration modal loop

refactor(stores): split app store into modules

docs(api): document worker management endpoints

chore(deps): update dependencies to latest versions
```

**Commit Best Practices:**

- Keep commits atomic (one logical change)
- Write descriptive commit messages
- Reference issue numbers when applicable
- Sign commits (optional but recommended)

## Code Standards

### TypeScript Requirements

**Mandatory:**

```typescript
// ✅ Strict mode enabled
// ✅ Explicit return types
export function myFunction(param: string): ReturnType {
  return processedValue;
}

// ✅ No any types
function process(data: unknown): ProcessedData {
  if (isValidData(data)) {
    return transform(data);
  }
  throw new Error("Invalid data");
}

// ✅ Type guards for unknowns
function isValidData(value: unknown): value is ValidData {
  return typeof value === "object" && value !== null;
}
```

**Forbidden:**

```typescript
// ❌ No any
function process(data: any) {}

// ❌ No non-null assertions
const value = obj!.property;

// ❌ No implicit returns
function calculate(a: number, b: number) {
  return a + b;
}
```

### React Component Standards

**Structure:**

```typescript
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Component description
 */
interface ComponentProps {
  /** Prop documentation */
  requiredProp: string;
  /** Optional prop with default */
  optionalProp?: number;
}

/**
 * ComponentName - Brief description
 */
export function ComponentName({
  requiredProp,
  optionalProp = 0,
}: ComponentProps): React.ReactElement {
  // 1. Hooks
  const [state, setState] = useState<string>("");

  // 2. Effects
  React.useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, []);

  // 3. Event handlers
  const handleClick = useCallback((): void => {
    setState("clicked");
  }, []);

  // 4. Render
  return (
    <Button onClick={handleClick}>
      {requiredProp}
    </Button>
  );
}

export default ComponentName;
```

**Requirements:**

- Functional components only
- TypeScript interfaces for props
- Explicit return type: `React.ReactElement`
- JSDoc comments
- Proper hook dependencies
- Cleanup in useEffect

### Styling Standards

**Tailwind CSS Only:**

```typescript
// ✅ Correct
<div className="flex items-center gap-4 p-6 bg-card border border-border">

// ✅ Responsive
<div className="text-sm md:text-base lg:text-lg">

// ✅ Conditional with cn()
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes"
)}>

// ❌ Wrong: Inline styles
<div style={{ padding: "24px" }}>

// ❌ Wrong: Custom CSS classes
<div className="my-custom-class">
```

**Color Palette:**

- Primary: `amber-500` (#f59e0b)
- Grays: `zinc-*` scale
- Success: `green-500`
- Error: `red-500`
- Warning: `amber-500`
- Info: `blue-500`

### State Management Standards

**Store Structure:**

```typescript
// ✅ Separate state and actions
interface StoreState {
  value: string;
}

interface StoreActions {
  setValue: (value: string) => void;
}

type Store = StoreState & StoreActions;

// ✅ Use middleware
export const useStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({/* ... */}),
      { name: "store-name" },
    ),
    { name: "Store Display Name" },
  ),
);
```

## Pull Request Process

### Before Submitting PR

**Checklist:**

- [ ] Code follows TypeScript standards
- [ ] All functions have explicit return types
- [ ] No `any` types or non-null assertions
- [ ] Components use Tailwind CSS only
- [ ] All code and comments in English
- [ ] JSDoc comments added to public APIs
- [ ] No console.log statements (use proper logging)
- [ ] Error handling implemented
- [ ] Responsive design (mobile + desktop)
- [ ] ARIA attributes for accessibility
- [ ] No ESLint errors (`npm run lint`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Changes tested manually
- [ ] No breaking changes (or documented)

### Creating PR

**Title Format:**

```
<type>(<scope>): <description>

Examples:
feat(canvas): add panel duplication feature
fix(auth): resolve session persistence issue
refactor(stores): improve type safety
```

**Description Template:**

```markdown
## Description

Brief description of changes

## Motivation

Why these changes are needed

## Changes

- Change 1
- Change 2
- Change 3

## Testing

How changes were tested

## Screenshots (if UI changes)

[Attach screenshots]

## Breaking Changes

None / List breaking changes

## Checklist

- [ ] TypeScript strict mode compliant
- [ ] Tests pass (when implemented)
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Responsive design
- [ ] Accessibility verified
```

### Code Review Process

**Reviewer Checklist:**

- [ ] Code follows project standards
- [ ] TypeScript types are correct
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling is comprehensive
- [ ] Documentation is clear
- [ ] No unnecessary complexity
- [ ] Test coverage is adequate

**Review Comments:**

- Be constructive and specific
- Suggest improvements with examples
- Explain reasoning
- Approve when standards are met

## Testing

### Manual Testing

**Required Tests:**

1. **Authentication Flow**
   - Create new wallet
   - Import existing wallet
   - Network selection
   - Connection establishment
   - Session persistence across reload

2. **Feature Testing**
   - Test all new functionality
   - Test edge cases
   - Test error states
   - Test loading states
   - Test on mobile and desktop

3. **Regression Testing**
   - Verify existing features still work
   - Check related functionality
   - Test with different data

### Test Scenarios

**Canvas:**

```
1. Create new panel
2. Add 5 different widgets
3. Create manual connections
4. Enable auto-connections
5. Switch to another panel
6. Switch back - verify state restored
7. Refresh page - verify persistence
```

**Editor:**

```
1. Create worker from template
2. Modify script
3. Change configuration
4. Save changes
5. Start worker
6. View statistics
7. Stop worker
8. Refresh page - verify worker persists
```

**Authentication:**

```
1. Create new wallet
2. Save private key
3. Refresh page
4. Verify auto-restore works
5. Disconnect
6. Reconnect with same wallet
7. Verify session restored
```

## Documentation

### Code Documentation

**JSDoc for Public APIs:**

````typescript
/**
 * Calculate volume-weighted average price
 *
 * @param orders - Array of order book entries [price, volume]
 * @param depth - Number of levels to include in calculation
 * @returns Weighted average price
 *
 * @throws {Error} If orders array is empty
 *
 * @example
 * ```typescript
 * const vwap = calculateVWAP([[100, 1.5], [101, 2.0]], 2);
 * // Returns weighted average of orders
 * ```
 */
export function calculateVWAP(
  orders: [number, number][],
  depth: number,
): number {
  if (orders.length === 0) {
    throw new Error("Orders array cannot be empty");
  }

  // Implementation
}
````

**Component Documentation:**

````typescript
/**
 * Display trading position with P&L metrics
 *
 * Shows position details including:
 * - Symbol and side (long/short)
 * - Entry and current price
 * - Unrealized P&L
 * - Liquidation price
 * - Leverage
 *
 * @example
 * ```tsx
 * <PositionCard position={{
 *   symbol: "BTC/USDT",
 *   side: "long",
 *   entryPrice: 50000,
 *   markPrice: 52000,
 *   unrealizedPnl: 2000,
 *   leverage: 10
 * }} />
 * ```
 */
export function PositionCard(
  { position }: PositionCardProps,
): React.ReactElement {
  // Implementation
}
````

### README Updates

**When to Update:**

- New features added
- API changes
- New dependencies
- Configuration changes
- Breaking changes

**Update Sections:**

- Features list
- Installation steps
- API documentation
- Configuration options
- Breaking changes section

## Security Guidelines

### Code Security

**Never Commit:**

- Private keys
- API keys or secrets
- Session tokens
- Passwords
- Personal data

**Check Before Commit:**

```bash
# Search for potential secrets
git diff | grep -i "apikey\|secret\|password\|private"

# Use .gitignore for sensitive files
.env
.env.local
*.key
*.pem
```

**Secure Coding:**

```typescript
// ✅ Validate all inputs
function processUserInput(input: string): string {
  if (!input || input.length > 1000) {
    throw new Error("Invalid input");
  }
  return sanitize(input);
}

// ✅ Use constant-time comparisons
import { constantTimeEqual } from "@/lib/gliesereum/crypto";

// ✅ No sensitive data in logs
console.log("User:", sanitizeLogData(user));
```

### Dependency Security

**Before Adding Dependency:**

1. Check npm package reputation
2. Review download statistics
3. Check last update date
4. Scan for known vulnerabilities
5. Review package source code (for critical deps)

**Security Audit:**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if safe)
npm audit fix

# Review manual fixes
npm audit fix --dry-run
```

## Performance Guidelines

### Performance Requirements

**Metrics:**

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Optimization Checklist:**

- [ ] Large components memoized
- [ ] Expensive computations memoized
- [ ] Callbacks memoized for child components
- [ ] Images optimized
- [ ] Code split by route
- [ ] Lazy loading for heavy features
- [ ] Debouncing for frequent updates
- [ ] Virtualization for long lists

### Performance Testing

**Before Submitting:**

```bash
# Build and test production bundle
npm run build
npm run preview

# Check bundle size
# Review dist/assets/ file sizes

# Test performance
# Use Chrome DevTools Lighthouse
```

## Contribution Types

### Bug Fixes

**Process:**

1. Create issue describing bug
2. Reproduce bug locally
3. Create fix branch
4. Implement fix
5. Test thoroughly
6. Submit PR with issue reference

**PR Template:**

```markdown
Fixes #<issue-number>

## Bug Description

Brief description of the bug

## Root Cause

What caused the bug

## Solution

How the fix works

## Testing

Steps to verify fix
```

### New Features

**Process:**

1. Discuss feature in issue/discussion
2. Get approval from maintainers
3. Design implementation
4. Create feature branch
5. Implement with tests
6. Update documentation
7. Submit PR

**PR Template:**

```markdown
Implements #<issue-number>

## Feature Description

What this feature does

## Implementation

Technical approach

## Usage Example

Code example showing usage

## Documentation

Links to updated docs

## Screenshots

UI changes (if applicable)
```

### Refactoring

**Process:**

1. Identify code that needs improvement
2. Create refactoring plan
3. Ensure no behavior changes
4. Test thoroughly
5. Submit PR

**Guidelines:**

- Keep refactoring PRs focused
- Don't mix refactoring with features
- Maintain backward compatibility
- Update tests and docs

### Documentation

**Process:**

1. Identify missing/outdated docs
2. Create docs branch
3. Write or update documentation
4. Review for clarity and accuracy
5. Submit PR

**Documentation Standards:**

- Professional English
- Clear and concise
- Code examples
- No marketing language
- Technical accuracy

## Code Review

### Submitting for Review

**Preparation:**

```bash
# Self-review checklist
1. Read your own PR diff
2. Check for commented code
3. Check for debug statements
4. Verify all files are intentional
5. Update documentation
6. Add descriptive PR description
```

**Requesting Review:**

- Tag relevant reviewers
- Provide context in PR description
- Highlight areas needing attention
- Be responsive to feedback

### Reviewing Code

**Review Focus:**

1. **Correctness** - Does it work as intended?
2. **Standards** - Follows project conventions?
3. **Security** - No vulnerabilities?
4. **Performance** - No obvious bottlenecks?
5. **Maintainability** - Easy to understand?
6. **Documentation** - Adequately documented?

**Review Comments:**

````markdown
# Request changes

This needs a null check here because user could be undefined.

# Suggest improvement

Consider using useMemo here for better performance:

```typescript
const filtered = useMemo(() => items.filter(...), [items]);
```
````

# Ask question

Why is this setTimeout needed? Could we use useEffect instead?

# Approve

LGTM! Great implementation of the auto-connection system.

````
## Testing Strategy

### Manual Testing Checklist

**UI Testing:**
- [ ] All buttons functional
- [ ] Forms validate correctly
- [ ] Loading states display
- [ ] Error states display
- [ ] Empty states display
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

**Integration Testing:**
- [ ] Authentication flow complete
- [ ] WebSocket connection stable
- [ ] Session persistence works
- [ ] API calls successful
- [ ] State updates correctly
- [ ] Routing works
- [ ] Multi-tab behavior

**Browser Testing:**
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

### Automated Testing (Future)

**Unit Tests:**
```typescript
// Example pattern
describe("calculateVWAP", () => {
  it("calculates correctly with valid data", () => {
    const orders: [number, number][] = [
      [100, 1.0],
      [101, 2.0]
    ];
    const result = calculateVWAP(orders, 2);
    expect(result).toBeCloseTo(100.67);
  });
  
  it("throws error with empty array", () => {
    expect(() => calculateVWAP([], 2)).toThrow();
  });
});
````

**Component Tests:**

```typescript
import { fireEvent, render, screen } from "@testing-library/react";

describe("Button", () => {
  it("renders with label", () => {
    render(<Button label="Click Me" onClick={() => {}} />);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button label="Click" onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Release Process

### Version Numbering

**Semantic Versioning:**

```
MAJOR.MINOR.PATCH

Example: 0.12.8
- 0 = Major version (pre-1.0 = beta)
- 12 = Minor version (features)
- 8 = Patch version (fixes)
```

**When to Increment:**

- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes

### Release Checklist

**Pre-Release:**

- [ ] All PRs merged to develop
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version number incremented
- [ ] Build tested
- [ ] Security audit passed

**Release:**

```bash
# 1. Update version
npm version minor  # or major, patch

# 2. Build
npm run build

# 3. Tag release
git tag -a v0.12.8 -m "Release v0.12.8"

# 4. Push
git push origin main --tags

# 5. Deploy
# Follow deployment process
```

**Post-Release:**

- [ ] Monitor for errors
- [ ] Check user feedback
- [ ] Update documentation site
- [ ] Announce release

## Common Contributions

### Adding New Widget Type

**Steps:**

```typescript
// 1. Define type (src/lib/canvas-types.ts)
export const WidgetType = {
  // ...existing
  NEW_WIDGET: "newwidget"
}

// 2. Create component (src/components/widgets/NewWidget.tsx)
export function NewWidget({ raw }: { raw: NewWidgetData }): React.ReactElement {
  return <div>{/* UI */}</div>;
}

// 3. Register (src/apps/Canvas/NodeFlow.tsx)
case WidgetType.NEW_WIDGET:
  return <NewWidget raw={raw} />;

// 4. Add to exports (src/components/widgets/index.ts)
export { NewWidget } from "./NewWidget";

// 5. Document in API_DOCUMENTATION.md
// 6. Create PR
```

### Adding New Application

**Steps:**

```bash
# 1. Create directory structure
mkdir -p src/apps/MyApp/components
touch src/apps/MyApp/MyApp.tsx
touch src/apps/MyApp/store.ts
touch src/apps/MyApp/types.ts
touch src/apps/MyApp/utils.ts
touch src/apps/MyApp/index.ts

# 2. Implement component
# See COMPONENT_GUIDE.md

# 3. Add route (src/App.tsx)
import MyApp from "@/apps/MyApp";

function renderMainContent() {
  switch (currentRoute) {
    // ...
    case "myapp":
      return <MyApp />;
  }
}

# 4. Add to Welcome (src/apps/Welcome/applications.tsx)
{
  id: "myapp",
  route: "myapp",
  name: "My App",
  // ... metadata
}

# 5. Update Layout.tsx for navigation
# 6. Create PR
```

### Improving Performance

**Identify Bottleneck:**

```bash
# 1. Open React DevTools
# 2. Go to Profiler tab
# 3. Record interaction
# 4. Analyze render times
# 5. Identify slow components
```

**Apply Optimization:**

```typescript
// Memoize expensive component
export const ExpensiveComponent = React.memo(
  function ExpensiveComponent({ data }: Props) {
    // Complex rendering
  },
);

// Memoize expensive computation
const processed = useMemo(() => {
  return expensiveProcess(data);
}, [data]);

// Memoize callback
const handleClick = useCallback(() => {
  // Handler logic
}, [/* dependencies */]);
```

**Verify Improvement:**

- Re-run Profiler
- Compare render times
- Check bundle size
- Monitor user experience

## Questions and Support

### Getting Help

**For Contributors:**

- Check existing documentation
- Search closed issues
- Ask in team chat
- Tag maintainers in PR

**For Issues:**

- Use issue templates
- Provide reproduction steps
- Include browser/OS info
- Attach screenshots/logs

### Contact

**Maintainers:**

- STELS Development Team

**Security Issues:**

- security@gliesereum.ua
- Use encrypted communication
- Follow responsible disclosure

## License

By contributing to STELS Web3 OS, you agree that your contributions will be
licensed under the same terms as the project.

© 2024 Gliesereum Ukraine. All rights reserved.

---

**Document Version:** 1.0\
**Last Updated:** 2025-10-17\
**Authors:** STELS Development Team

**Thank you for contributing!** 🙏
