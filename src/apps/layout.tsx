/**
 * Layout Component
 * Main application layout with sidebar - shadcn blocks pattern
 * https://ui.shadcn.com/blocks
 */

import React from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/main/app-sidebar";
import { SiteHeader } from "@/components/main/site-header";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Sidebar Layout Component
 * Provides collapsible sidebar navigation and content area
 */
export function Layout({ children }: LayoutProps): React.ReactElement {
  return (
    <div className="flex h-full w-full">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3rem",
          } as React.CSSProperties
        }
        className="flex h-full w-full"
      >
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden">
          <SiteHeader />
          <main className="flex flex-1 flex-col min-h-0 overflow-hidden" id="main-content">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
