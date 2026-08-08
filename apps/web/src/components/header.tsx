"use client";

import { Button } from "@crossval/ui/components/button";
import { useSidebar } from "@crossval/ui/components/sidebar";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import UserMenu from "./user-menu";

type HeaderProps = {
  withSidebar?: boolean;
};

function WorkspaceSidebarTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      aria-label="Toggle sidebar"
      onClick={toggleSidebar}
      size="icon-sm"
      variant="outline"
    >
      <Menu />
    </Button>
  );
}

export default function Header({ withSidebar = false }: HeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {withSidebar && <WorkspaceSidebarTrigger />}
          {withSidebar ? (
            <span className="truncate text-sm font-medium">Overview</span>
          ) : (
            <Link
              className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight underline-offset-4 hover:underline"
              href="/dashboard"
            >
              <Image
                alt=""
                className="size-6 shrink-0 object-contain"
                height={24}
                src="/logo.png"
                width={24}
              />
              CrossVal
            </Link>
          )}
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
