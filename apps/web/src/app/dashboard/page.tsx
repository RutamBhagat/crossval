import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
    <main className="container mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 border-b pb-4">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Planning workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {session.user.name}
        </h1>
      </header>
      <Dashboard />
    </main>
  );
}
