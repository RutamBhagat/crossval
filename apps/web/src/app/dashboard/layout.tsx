import { SidebarInset, SidebarProvider } from "@crossval/ui/components/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { authClient } from "@/lib/auth-client";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <SidebarProvider
      className="h-svh min-h-0"
      style={
        {
          "--sidebar-width": "10rem",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden bg-muted/30">
        <Header withSidebar />
        <div className="min-h-0 flex-1 overflow-auto scroll-smooth">
          <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
