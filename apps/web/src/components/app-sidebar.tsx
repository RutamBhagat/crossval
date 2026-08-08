"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@crossval/ui/components/sidebar";
import { LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
] as const;

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              size="lg"
              tooltip="Crossval"
            >
              <Image
                alt="Crossval"
                className="size-8 shrink-0 object-contain"
                height={32}
                src="/logo.png"
                width={32}
              />
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-mono text-sm font-semibold">
                  CrossVal
                </span>
                <span className="truncate text-xs text-sidebar-foreground/65">
                  Spending workspace
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={item.label === "Overview"}
                    render={<Link href={item.href} />}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
