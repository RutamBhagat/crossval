"use client";

import { Button } from "@crossval/ui/components/button";
import { useSidebar } from "@crossval/ui/components/sidebar";
import Image from "next/image";
import Link from "next/link";

import UserMenu from "./user-menu";

type HeaderProps = {
  withSidebar?: boolean;
};

function WorkspaceBrandTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      aria-label="Open workspace navigation"
      className="w-auto px-1"
      onClick={toggleSidebar}
      variant="ghost"
    >
      <Image
        alt=""
        className="size-6 shrink-0 object-contain"
        height={24}
        src="/logo.png"
        width={24}
      />
      <span className="font-mono text-xs font-semibold tracking-tight">
        CrossVal
      </span>
    </Button>
  );
}

export default function Header({ withSidebar = false }: HeaderProps) {
  if (withSidebar) {
    return (
      <header className="border-b bg-background md:hidden">
        <div className="flex h-14 items-center px-3">
          <WorkspaceBrandTrigger />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
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
        <UserMenu />
      </div>
    </header>
  );
}
