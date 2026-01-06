import React from "react";
import { UnifiedHeader } from "@/components/main/unified_header";

interface SimpleLayoutProps {
  children: React.ReactNode;
}

/**
 * Simple Layout Component
 * Provides navigation and logout functionality for Editor and Canvas apps
 */
export function SimpleLayout(
  { children }: SimpleLayoutProps,
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
