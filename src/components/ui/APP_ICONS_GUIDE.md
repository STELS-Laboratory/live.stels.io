# App Icons Guide

## Overview

The `AppIcon` component provides a flexible system for displaying application
icons. It automatically uses SVG icons when available, or falls back to
displaying the first letter of the app name.

## Current Implementation

### Files

- **Component**: `src/components/ui/app-icon.tsx`
- **Usage**: `src/apps/Welcome/applications.tsx`
- **SVG Assets**: `src/assets/icons/apps/`

### How It Works

```tsx
// In applications.tsx
icon: <AppIcon appId="scanner" appName="Liquidity Pool" />;
```

The component will:

1. Look for a matching SVG icon in the `SVG_ICONS` map
2. If found, render the SVG with proper styling
3. If not found, display the first letter of the app name

## Adding New SVG Icons

### Step 1: Add Your SVG File

Place your SVG file in: `src/assets/icons/apps/YourAppName.svg`

Example: `src/assets/icons/apps/Markets.svg`

### Step 2: Update app-icon.tsx

Add your icon to the `SVG_ICONS` map:

```tsx
const SVG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  scanner: ({ className }) => (
    <svg viewBox="0 0 499 499" fill="none" className={className}>
      {/* SVG paths */}
    </svg>
  ),
  // Add your new icon here
  markets: ({ className }) => (
    <svg viewBox="0 0 YOUR_WIDTH YOUR_HEIGHT" fill="none" className={className}>
      {/* Your SVG paths */}
    </svg>
  ),
};
```

### Step 3: Important SVG Guidelines

1. **Remove hardcoded colors**: Replace `fill="#F99B09"` with
   `fill="currentColor"`
2. **Set viewBox**: Ensure your SVG has a proper `viewBox` attribute
3. **Remove width/height**: Let the className control the size
4. **Use className prop**: Pass it to the SVG element for styling

### Step 4: Test

```bash
npm run dev
```

Navigate to the Welcome screen and verify your icon appears correctly.

## Current Icons

| App ID    | Icon Type | Status          |
| --------- | --------- | --------------- |
| scanner   | SVG       | ✅ Implemented  |
| wallet    | SVG       | ✅ Implemented  |
| markets   | Letter    | 🔤 Fallback (M) |
| orderbook | Letter    | 🔤 Fallback (A) |
| canvas    | Letter    | 🔤 Fallback (C) |
| network   | Letter    | 🔤 Fallback (N) |
| editor    | Letter    | 🔤 Fallback (E) |

## Styling

The component supports different sizes:

```tsx
<AppIcon appId="scanner" appName="Scanner" size="sm" />  // 16x16px
<AppIcon appId="scanner" appName="Scanner" size="md" />  // 24x24px
<AppIcon appId="scanner" appName="Scanner" size="lg" />  // 32x32px (default)
<AppIcon appId="scanner" appName="Scanner" size="xl" />  // 48x48px
```

Custom styling:

```tsx
<AppIcon
  appId="scanner"
  appName="Scanner"
  className="text-amber-500 hover:text-amber-600"
/>;
```

## SVG Optimization Tips

1. **Use SVGO**: Optimize your SVGs before adding them
   ```bash
   npm install -g svgo
   svgo your-icon.svg
   ```

2. **Simplify paths**: Remove unnecessary detail for better performance

3. **Test color inheritance**: Ensure `currentColor` works with your design

## Future Improvements

- [x] Add Scanner SVG icon ✅
- [x] Add Wallet SVG icon ✅
- [ ] Add remaining 5 app SVG icons (Markets, Aggregator, Canvas, Network,
      Editor)
- [ ] Create automated SVG import system
- [ ] Add icon variants (outline, solid)
- [ ] Support animated SVG icons
- [ ] Add icon preview storybook

## Troubleshooting

**Icon not showing?**

- Check the `appId` matches the key in `SVG_ICONS` (case-sensitive)
- Verify SVG paths are valid
- Check for console errors

**Icon color wrong?**

- Ensure you're using `fill="currentColor"` in SVG paths
- Check parent component applies text color classes

**Icon size wrong?**

- Verify `viewBox` attribute is set correctly
- Check size prop or className overrides

## Examples

### Full SVG Icon Example

```tsx
markets: ({ className }) => (
	<svg 
		viewBox="0 0 24 24" 
		fill="none" 
		xmlns="http://www.w3.org/2000/svg"
		className={className}
	>
		<path 
			d="M3 3v18h18" 
			stroke="currentColor" 
			strokeWidth="2"
		/>
		<path 
			d="M7 14l4-4 3 3 5-5" 
			stroke="currentColor" 
			strokeWidth="2"
		/>
	</svg>
),
```

### Letter Fallback Example

When no SVG is defined, the component automatically shows the first letter:

```tsx
// This will show "M" in a styled container
<AppIcon appId="markets" appName="Markets" />;
```

## Best Practices

1. ✅ Keep SVG files optimized and small
2. ✅ Use semantic naming for app IDs
3. ✅ Test icons in both light and dark modes
4. ✅ Ensure icons scale properly at all sizes
5. ✅ Maintain consistent visual style across all icons
6. ✅ Use the letter fallback as a temporary solution
7. ❌ Don't hardcode colors in SVG paths
8. ❌ Don't use bitmap images (PNG, JPG) for icons

---

**Last Updated**: 2024-10-09 **Version**: 1.0.0
