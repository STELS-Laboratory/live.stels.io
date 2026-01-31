/**
 * App Sidebar Component
 * Main navigation sidebar using shadcn/ui sidebar pattern
 */

import * as React from "react";
import {
  Boxes,
  Bot,
  Code,
  Home,
  Wallet,
  Zap,
  TrendingUp,
  GitBranch,
  Globe,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { navigateTo } from "@/lib/router";

import Graphite from "@/components/ui/vectors/logos/graphite";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ConnectionStatusSimple } from "@/components/auth/connection-status-simple";

/**
 * Navigation item type
 */
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
}

/**
 * Navigation group type
 */
interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Navigation groups configuration
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        id: "welcome",
        label: "Home",
        icon: Home,
        route: "welcome",
      },
      {
        id: "canvas",
        label: "Canvas",
        icon: Boxes,
        route: "canvas",
      },
    ],
  },
  {
    label: "AI & Automation",
    items: [
      {
        id: "agents",
        label: "Agents",
        icon: Bot,
        route: "agents",
      },
      {
        id: "chains",
        label: "Chains",
        icon: GitBranch,
        route: "chains",
      },
      {
        id: "strategies",
        label: "Strategies",
        icon: Zap,
        route: "strategies",
      },
    ],
  },
  {
    label: "Trading",
    items: [
      {
        id: "trading",
        label: "Trading",
        icon: TrendingUp,
        route: "trading",
      },
      {
        id: "accounts",
        label: "Accounts",
        icon: Wallet,
        route: "accounts",
      },
    ],
  },
  {
    label: "Development",
    items: [
      {
        id: "editor",
        label: "Editor",
        icon: Code,
        route: "editor",
      },
      {
        id: "domains",
        label: "Domains",
        icon: Globe,
        route: "domains",
      },
      {
        id: "metrics",
        label: "Metrics",
        icon: BarChart3,
        route: "metrics",
      },
    ],
  },
];

/**
 * Logo component for sidebar header
 */
function SidebarLogo(): React.ReactElement {
  return (
    <button
      onClick={() => navigateTo("welcome")}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded transition-colors hover:bg-sidebar-accent"
    >
      <div className="relative flex items-center justify-center w-[1.75em] h-[1.75em]">
        <Graphite size={1.75} primary="var(--sidebar-primary)" />
      </div>
      <div className="flex flex-col group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-bold tracking-tight text-sidebar-foreground leading-none">
          STELS
        </span>
        <span className="text-[10px] font-medium text-sidebar-foreground/60 tracking-wider uppercase">
          Web 5
        </span>
      </div>
    </button>
  );
}

/**
 * Main App Sidebar
 */
export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>): React.ReactElement {
  const { currentRoute } = useAppStore();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = currentRoute === item.route;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => navigateTo(item.route)}
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ConnectionStatusSimple />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
