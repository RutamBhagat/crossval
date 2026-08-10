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
import { ChartNoAxesColumnIncreasing, LockKeyhole, Rows3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import UserMenu from "./user-menu";

const navigation = [
  { label: "Ledger", href: "/dashboard", icon: Rows3 },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    label: "Period close",
    href: "/dashboard/periods",
    icon: LockKeyhole,
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
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
                src="/logo.svg"
                width={32}
              />
              <span className="truncate font-mono text-sm font-semibold">
                CrossVal
              </span>
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
                    isActive={pathname === item.href}
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
