# Welcome App Store - Quick Start Guide

## 🚀 Getting Started

The new Welcome screen is already integrated and ready to use!

## 📖 Basic Usage

### Import and Use

```typescript
// App.tsx already imports Welcome
import Welcome from "@/apps/Welcome";

// It's automatically used in routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
    </Routes>
  );
}
```

---

## 🎮 User Guide

### For End Users

#### Browsing Apps

1. **View All Apps** - Scroll through the app grid
2. **Search** - Type in the search bar to filter
3. **Filter by Category** - Click category buttons
4. **View Featured** - Toggle "Featured Only"

#### Launching Apps

1. **Click App Card** - Launch immediately
2. **Recent Apps** - One-click from recent section
3. **Favorites** - Launch from favorites section

#### Managing Favorites

1. **Add to Favorites** - Click ❤️ heart icon on app card
2. **Remove from Favorites** - Click ❤️ again to toggle off
3. **View All Favorites** - Automatically shown in favorites section

---

## 💻 Developer Guide

### Accessing Store

```typescript
import { useWelcomeStore } from "@/apps/Welcome/store";

function MyComponent() {
  // Get state
  const searchTerm = useWelcomeStore((state) => state.searchTerm);
  const recentApps = useWelcomeStore((state) => state.recentApps);
  const favoriteApps = useWelcomeStore((state) => state.favoriteApps);

  // Get actions
  const setSearchTerm = useWelcomeStore((state) => state.setSearchTerm);
  const toggleFavorite = useWelcomeStore((state) => state.toggleFavorite);
  const clearFilters = useWelcomeStore((state) => state.clearFilters);
}
```

### Using Custom Hooks

```typescript
import {
  useWelcomeActions,
  useWelcomeFilters,
  useWelcomePreferences,
} from "@/apps/Welcome/store";

function MyComponent() {
  // Filters
  const { searchTerm, selectedCategory, showOnlyFeatured } =
    useWelcomeFilters();

  // Preferences
  const { viewMode, recentApps, favoriteApps } = useWelcomePreferences();

  // Actions
  const {
    setSearchTerm,
    toggleFavorite,
    addToRecent,
    clearFilters,
  } = useWelcomeActions();
}
```

### Adding New Application

```typescript
// 1. Edit applications.tsx
export const applications: AppMetadata[] = [
  // ... existing apps
  {
    id: "my-new-app",
    route: "my-new-app",
    name: "My New App",
    tagline: "One line description",
    description: "Longer description explaining what this app does...",
    icon: <MyIcon className="w-8 h-8" />,
    color: "from-blue-500/20 to-cyan-500/20",
    category: "Analytics",
    featured: false,
    size: "medium",
    badge: "New",
    stats: "Coming soon",
  },
];

// 2. Create the actual app component
// apps/MyNewApp/MyNewApp.tsx

// 3. Register route in App.tsx
case "my-new-app":
  return <MyNewApp />;

// 4. Add to allowed routes in app.store.ts
allowedRoutes: ["welcome", "scanner", ..., "my-new-app"]
```

### Using Individual Components

```typescript
import { AppGrid, EmptyState, HeroSection } from "@/apps/Welcome/components";

function CustomAppStore() {
  return (
    <div>
      <HeroSection
        totalApps={10}
        featuredCount={5}
        isMobile={false}
      />

      <AppGrid
        applications={myApps}
        onLaunch={handleLaunch}
        isMobile={false}
        title="My Apps"
      />

      {noResults && <EmptyState isMobile={false} />}
    </div>
  );
}
```

---

## 🎨 Customization

### Changing Colors

Edit `AppCardPremium.tsx`:

```typescript
function getCategoryColorScheme(category: string) {
  const schemes = {
    Analytics: {
      bg: "from-blue-500/10 to-cyan-500/10",
      text: "text-blue-500",
      border: "border-blue-500/20",
      glow: "shadow-blue-500/20",
    },
    // Add your custom color schemes
    MyCategory: {
      bg: "from-orange-500/10 to-red-500/10",
      text: "text-orange-500",
      border: "border-orange-500/20",
      glow: "shadow-orange-500/20",
    },
  };
  
  return schemes[category] || /* default */;
}
```

### Adding Category Icons

Edit `CategoryFilter.tsx`:

```typescript
function getCategoryIcon(category: AppCategory) {
  const icons = {
    All: <Grid3X3 className="w-4 h-4" />,
    Analytics: <Activity className="w-4 h-4" />,
    // Add your icon
    MyCategory: <MyIcon className="w-4 h-4" />,
  };

  return icons[category] || <Flame className="w-4 h-4" />;
}
```

### Modifying Animations

All animations use Framer Motion:

```typescript
// Change duration
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }} // ← Change this
>

// Change easing
transition={{ 
  duration: 0.5, 
  ease: [0.16, 1, 0.3, 1] // ← Custom cubic-bezier
}}

// Disable animations
transition={{ duration: 0 }}
```

---

## 🔍 Debugging

### Check Store State

```typescript
// In component
const state = useWelcomeStore.getState();
console.log("Welcome Store:", state);

// In DevTools
// Zustand DevTools will show "Welcome Store"
```

### Check Filtered Apps

```typescript
function WelcomePremium() {
  const filteredApps = useMemo(() => {
    // ... filtering logic
    console.log("Filtered apps:", filteredApps);
    return filteredApps;
  }, [searchTerm, selectedCategory]);
}
```

### Check Recent Apps

```typescript
const recentApps = useWelcomeStore((state) => state.recentApps);
console.log("Recent apps:", recentApps);

// Should be array of app IDs
// Example: ["scanner", "markets", "canvas"]
```

---

## 🧪 Testing

### Test Store

```typescript
import { useWelcomeStore } from "@/apps/Welcome/store";

describe("Welcome Store", () => {
  it("should filter apps by search term", () => {
    const { setSearchTerm } = useWelcomeStore.getState();
    setSearchTerm("scanner");

    const searchTerm = useWelcomeStore.getState().searchTerm;
    expect(searchTerm).toBe("scanner");
  });

  it("should toggle favorites", () => {
    const { toggleFavorite } = useWelcomeStore.getState();
    toggleFavorite("scanner");

    const favorites = useWelcomeStore.getState().favoriteApps;
    expect(favorites).toContain("scanner");
  });
});
```

### Test Components

```typescript
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/apps/Welcome/components";

describe("HeroSection", () => {
  it("should render search input", () => {
    render(<HeroSection totalApps={7} featuredCount={5} isMobile={false} />);

    const searchInput = screen.getByPlaceholderText("Search applications...");
    expect(searchInput).toBeInTheDocument();
  });
});
```

---

## 🎯 Common Tasks

### Clear All Filters

```typescript
const clearFilters = useWelcomeStore((state) => state.clearFilters);

<Button onClick={clearFilters}>
  Clear Filters
</Button>;
```

### Get App by ID

```typescript
import { applications } from "@/apps/Welcome/applications";

const app = applications.find((app) => app.id === "scanner");
```

### Check if App is Favorite

```typescript
const favoriteApps = useWelcomeStore((state) => state.favoriteApps);
const isFavorite = favoriteApps.includes(appId);
```

### Track App Launch

```typescript
const addToRecent = useWelcomeStore((state) => state.addToRecent);

function handleLaunch(route: string) {
  addToRecent(appId);
  navigateTo(route);
}
```

---

## 🐛 Troubleshooting

### Apps not showing

1. Check if filters are active
2. Check `applications.tsx` data
3. Verify category matches
4. Check search term

### Animations not working

1. Ensure Framer Motion is installed
2. Check for `prefers-reduced-motion`
3. Verify transition props

### Store not persisting

1. Check localStorage is enabled
2. Verify persist middleware config
3. Check storage key: `welcome-store`

---

## 📱 Mobile-Specific Features

### Touch Optimizations

- **Larger touch targets** (48x48px minimum)
- **Touch feedback** with scale animations
- **Horizontal scroll** for categories
- **Bottom sheet** style for filters

### Performance

- **Reduced animations** on mobile
- **Optimized grid** (4 columns)
- **Lazy loading** for off-screen cards

---

## 🎨 Accessibility

### Keyboard Navigation

- `Tab` - Navigate between elements
- `Enter` - Launch app
- `Escape` - Clear search
- `Arrow keys` - Navigate categories

### Screen Readers

- ARIA labels on all interactive elements
- Semantic HTML structure
- Focus management
- Status announcements

---

## 💡 Tips & Tricks

### For Users

1. **Use Search** - Fastest way to find apps
2. **Favorite Often-Used Apps** - Quick access
3. **Try Categories** - Discover similar apps
4. **Check Recent** - Last opened apps

### For Developers

1. **Use Custom Hooks** - Cleaner code
2. **Selective Subscriptions** - Better performance
3. **Memoize Filters** - Avoid re-calculations
4. **Document Changes** - Update applications.tsx comments

---

## 🔗 Related Resources

- [Welcome README](README.md) - Full documentation
- [Store README](../../stores/README.md) - Store architecture
- [App README](../README.md) - App architecture

---

**Ready to launch! 🚀**
