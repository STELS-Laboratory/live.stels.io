/**
 * Site Header Component
 * Header with sidebar trigger and breadcrumbs - shadcn blocks pattern
 */

import * as React from "react";
import { useAppStore } from "@/stores";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Route labels for breadcrumbs
 */
const ROUTE_LABELS: Record<string, string> = {
  welcome: "Home",
  editor: "Editor",
  canvas: "Canvas",
};

/**
 * Site Header with sidebar trigger
 */
export function SiteHeader(): React.ReactElement {
  const { currentRoute } = useAppStore();
  const routeLabel = ROUTE_LABELS[currentRoute] || currentRoute;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#" onClick={() => {}}>
                STELS Web 5
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{routeLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
