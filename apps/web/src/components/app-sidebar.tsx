"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@crossval/ui/components/sidebar";
import { LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import UserMenu from "./user-menu";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
] as const;

export function AppSidebar() {
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              aria-label="Toggle workspace navigation"
              onClick={toggleSidebar}
              size="lg"
              tooltip="Toggle sidebar"
            >
              <Image
                alt="Crossval"
                className="size-8 shrink-0 object-contain"
                height={32}
                src="/logo.png"
                width={32}
              />
              <span className="truncate font-mono text-sm font-semibold">CrossVal</span>
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

      <SidebarFooter className="border-t">
        <UserMenu placement="sidebar" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
