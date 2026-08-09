"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import type { ReportRow } from "@/server/report";

async function getReport(startMonth: string, endMonth: string) {
  const query = new URLSearchParams({ start: startMonth, end: endMonth });
  const response = await fetch(`/api/reports?${query}`);
  const data = (await response.json()) as {
    reports?: ReportRow[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Report could not be loaded");
  }

  return data.reports ?? [];
}

export function useReport(startMonth: string, endMonth: string) {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const reportQuery = useQuery({
    queryKey: ["reports", session?.user.id, startMonth, endMonth],
    queryFn: async () => {
      try {
        return await getReport(startMonth, endMonth);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Report could not be loaded");
        throw error;
      }
    },
    enabled: Boolean(session?.user.id),
    retry: false,
  });

  return {
    rows: reportQuery.data ?? [],
    isLoading: isSessionPending || reportQuery.isLoading,
  };
}
