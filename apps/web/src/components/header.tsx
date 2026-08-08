"use client";

import Link from "next/link";

import UserMenu from "./user-menu";

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          className="font-mono text-sm font-semibold tracking-tight underline-offset-4 hover:underline"
          href="/dashboard"
        >
          Crossval
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
