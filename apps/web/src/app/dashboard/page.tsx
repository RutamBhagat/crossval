import { SidebarInset, SidebarProvider } from "@crossval/ui/components/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { authClient } from "@/lib/auth-client";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
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
    <SidebarProvider className="h-svh min-h-0">
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <Header withSidebar />
        <div className="min-h-0 flex-1 overflow-auto scroll-smooth">
          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <header className="mb-8 max-w-2xl">
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {session.user.name}&apos;s workspace
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Plan, record, compare.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Set a monthly target, log what you spent, and check the variance.
              </p>
            </header>
            <Dashboard />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
