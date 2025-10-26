/**
 * Template App Component
 *
 * INSTRUCTIONS:
 * 1. Rename this file to your app name (e.g., markets.tsx)
 * 2. Replace TemplateApp with your component name
 * 3. Update imports and functionality
 * 4. Follow STELS development standards
 */

import React, { useEffect, useState } from "react";
import { useMobile } from "@/hooks/use_mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Book, Check, RefreshCw, Sparkles } from "lucide-react";
import { useTemplateStore } from "./store";
import { DeveloperGuidePanel } from "./components/developer-guide-panel";

/**
 * Template Application Component
 * Replace this with your app's description
 */
function TemplateApp(): React.ReactElement {
  const mobile = useMobile();

  // Access store state and actions
  const data = useTemplateStore((state) => state.data);
  const isLoading = useTemplateStore((state) => state.isLoading);
  const error = useTemplateStore((state) => state.error);
  const loadData = useTemplateStore((state) => state.loadData);
  const resetData = useTemplateStore((state) => state.resetData);

  // Local component state
  const [initialized, setInitialized] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (!initialized) {
      loadData();
      setInitialized(true);
    }
  }, [initialized, loadData]);

  // Mobile warning - desktop interface required
  if (mobile) {
    return (
      <div className="h-full bg-background p-4 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-card rounded flex items-center justify-center mb-4 mx-auto">
            <Sparkles className="w-8 h-8 text-amber-700 dark:text-amber-400" />
          </div>
          <h2 className="text-amber-700 dark:text-amber-400 font-mono text-lg font-bold mb-2">
            YOUR APP NAME
          </h2>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Desktop interface required
          </p>
          <div className="p-4 bg-card/10 border border-border rounded text-left">
            <p className="text-xs text-muted-foreground mb-3">
              This application requires a desktop display for optimal workflow:
            </p>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>Feature description 1</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>Feature description 2</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>Feature description 3</span>
              </li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Please open STELS on a desktop browser to access this application
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-border border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-mono">
            Loading your app...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              Error Loading App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              onClick={() => loadData()}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main app content
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded border border-amber-500/30">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                STELS App Template
              </h1>
              <p className="text-sm text-muted-foreground">
                Starter template for creating new applications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowGuide(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              <Book className="w-4 h-4 mr-2" />
              Developer Guide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetData}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Card with Instructions */}
          <Card className="bg-gradient-to-br from-amber-500/10 via-blue-500/5 to-purple-500/10 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-full flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Welcome to STELS App Template! 🚀
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is your starting point for creating professional
                    applications in the STELS platform. Follow the integration
                    guide to get started.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => setShowGuide(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                    >
                      <Book className="w-4 h-4 mr-2" />
                      Open Developer Guide
                    </Button>
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-600"
                    >
                      Production Ready
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
                    >
                      TypeScript
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400"
                    >
                      Zustand Store
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Guide */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-blue-500/5 border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-500">1</span>
                  </div>
                  Rename Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Rename template files to your app name and update component
                  names
                </p>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-muted-foreground">
                    ✓ template-app.tsx → your-app.tsx
                  </div>
                  <div className="text-muted-foreground">
                    ✓ TemplateApp → YourApp
                  </div>
                  <div className="text-muted-foreground">✓ Update exports</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/5 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-500">2</span>
                  </div>
                  System Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Register your app in 5 system files for navigation and routing
                </p>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-muted-foreground">✓ app.store.ts</div>
                  <div className="text-muted-foreground">✓ app_tabs.tsx</div>
                  <div className="text-muted-foreground">✓ layout.tsx</div>
                  <div className="text-muted-foreground">✓ App.tsx</div>
                  <div className="text-muted-foreground">
                    ✓ app_shortcuts.tsx
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-green-500">3</span>
                  </div>
                  Build & Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Implement your features and test the integration thoroughly
                </p>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-muted-foreground">
                    ✓ Define data types
                  </div>
                  <div className="text-muted-foreground">
                    ✓ Build UI components
                  </div>
                  <div className="text-muted-foreground">✓ Test navigation</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Zustand State Management
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pre-configured store with persistence and DevTools
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        TypeScript Types
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Strict typing with interfaces and type safety
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Mobile Detection
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Automatic mobile warning for desktop-only apps
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Error Handling
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Professional loading and error states
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Example Components
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pre-built component and hook examples
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Documentation
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5 comprehensive guides and pattern library
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-blue-500" />
                  Documentation Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-2 bg-background/50 rounded border border-border hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        QUICKSTART.md
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                      >
                        Start Here
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      5-minute setup guide for first-time users
                    </p>
                  </div>

                  <div className="p-2 bg-background/50 rounded border border-border hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        INTEGRATION.md
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
                      >
                        Essential
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Step-by-step system integration instructions
                    </p>
                  </div>

                  <div className="p-2 bg-background/50 rounded border border-border hover:border-purple-500/30 transition-colors">
                    <span className="text-xs font-semibold text-foreground block mb-1">
                      PATTERNS.md
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Code patterns library and examples
                    </p>
                  </div>

                  <div className="p-2 bg-background/50 rounded border border-border hover:border-green-500/30 transition-colors">
                    <span className="text-xs font-semibold text-foreground block mb-1">
                      README.md
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Complete documentation and reference
                    </p>
                  </div>

                  <div className="p-2 bg-background/50 rounded border border-border hover:border-orange-500/30 transition-colors">
                    <span className="text-xs font-semibold text-foreground block mb-1">
                      INDEX.md
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Template overview and features
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-500" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    File Structure
                  </h3>
                  <div className="space-y-1 text-xs font-mono bg-muted/30 p-3 rounded border border-border">
                    <div className="text-amber-500">template/</div>
                    <div className="text-muted-foreground ml-3">
                      ├── index.ts
                    </div>
                    <div className="text-muted-foreground ml-3">
                      ├── template-app.tsx
                    </div>
                    <div className="text-muted-foreground ml-3">
                      ├── store.ts
                    </div>
                    <div className="text-muted-foreground ml-3">
                      ├── types.ts
                    </div>
                    <div className="text-muted-foreground ml-3">
                      ├── constants.ts
                    </div>
                    <div className="text-muted-foreground ml-3">
                      ├── utils.ts
                    </div>
                    <div className="text-muted-foreground ml-3">
                      ├── components/
                    </div>
                    <div className="text-muted-foreground ml-3">
                      ├── hooks/
                    </div>
                    <div className="text-muted-foreground ml-3">
                      └── *.md (docs)
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    System Files to Edit
                  </h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-background/50 rounded border border-border">
                      <div className="text-xs font-mono text-foreground mb-0.5">
                        app.store.ts
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Line 147 • allowedRoutes
                      </div>
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-border">
                      <div className="text-xs font-mono text-foreground mb-0.5">
                        app_tabs.tsx
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Line 35 • DEV_TOOLS
                      </div>
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-border">
                      <div className="text-xs font-mono text-foreground mb-0.5">
                        layout.tsx
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Line 120 • systemNav
                      </div>
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-border">
                      <div className="text-xs font-mono text-foreground mb-0.5">
                        App.tsx
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Line 36 • Lazy imports
                      </div>
                    </div>
                    <div className="p-2 bg-background/50 rounded border border-border">
                      <div className="text-xs font-mono text-foreground mb-0.5">
                        app_shortcuts.tsx
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Line 74 • Shortcuts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Data Display */}
          {data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Example Data Display
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This is example data from the store. Replace with your
                    actual content.
                  </p>
                  <div className="p-4 bg-muted/30 rounded border border-border">
                    <pre className="text-xs font-mono text-foreground">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Developer Guide Panel */}
      <DeveloperGuidePanel
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}

TemplateApp.displayName = "TemplateApp";

export default TemplateApp;
