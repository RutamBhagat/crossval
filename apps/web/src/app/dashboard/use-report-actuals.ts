"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export type ReportActual = {
  id: string;
  amountCents: number;
  note?: string;
};

async function getReportActuals(categoryId: string, month: string) {
  const query = new URLSearchParams({ categoryId, month });
  const response = await fetch(
    `/api/reports/actuals?${query}`,
    { credentials: "include" },
  );
  const data = (await response.json()) as {
    actuals?: ReportActual[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Actual entries could not be loaded");
  }

  return data.actuals ?? [];
}

export function useReportActuals(categoryId?: string, month?: string) {
  const { data: session } = authClient.useSession();
  const actualsQuery = useQuery({
    queryKey: ["report-actuals", session?.user.id, categoryId, month],
    queryFn: async () => {
      try {
        return await getReportActuals(categoryId!, month!);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Actual entries could not be loaded",
        );
        throw error;
      }
    },
    enabled: Boolean(session?.user.id && categoryId && month),
    retry: false,
  });

  return {
    actuals: actualsQuery.data ?? [],
    isLoading: actualsQuery.isLoading,
  };
}
