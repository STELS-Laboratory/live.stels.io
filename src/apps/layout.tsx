import React from "react";
import { UnifiedHeader } from "@/components/main/unified-header";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Simple Layout Component
 * Provides navigation and logout functionality for Editor and Canvas apps
 */
export function Layout(
  { children }: LayoutProps,
): React.ReactElement {
  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <UnifiedHeader />

      {/* Main Content */}
      <main 
        role="main" 
        id="main-content"
        className="flex-1 overflow-hidden"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
