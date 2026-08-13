"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import type { MonthlyVariance, ReportRow } from "@crossval/domain/report";

export type ReportSortKey = "month" | "category" | "target";
export type ReportSortDirection = "ascending" | "descending";

async function getReport(
  startMonth: string,
  endMonth: string,
  offset: number,
  limit: number,
  sort: ReportSortKey,
  direction: ReportSortDirection,
) {
  const query = new URLSearchParams({
    start: startMonth,
    end: endMonth,
    offset: String(offset),
    limit: String(limit),
    sort,
    direction,
  });
  const response = await fetch(
    `/api/reports?${query}`,
    { credentials: "include" },
  );
  const data = (await response.json()) as {
    reports?: ReportRow[];
    monthlyVariance?: MonthlyVariance[];
    total?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Report could not be loaded");
  }

  return {
    reports: data.reports ?? [],
    monthlyVariance: data.monthlyVariance ?? [],
    total: data.total ?? 0,
  };
}

export function useReport(
  startMonth: string,
  endMonth: string,
  offset: number,
  limit: number,
  sort: ReportSortKey,
  direction: ReportSortDirection,
) {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const reportQuery = useQuery({
    queryKey: [
      "reports",
      session?.user.id,
      startMonth,
      endMonth,
      offset,
      limit,
      sort,
      direction,
    ],
    queryFn: async () => {
      try {
        return await getReport(
          startMonth,
          endMonth,
          offset,
          limit,
          sort,
          direction,
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Report could not be loaded",
        );
        throw error;
      }
    },
    enabled: Boolean(session?.user.id),
    retry: false,
  });

  return {
    rows: reportQuery.data?.reports ?? [],
    monthlyVariance: reportQuery.data?.monthlyVariance ?? [],
    total: reportQuery.data?.total ?? 0,
    isLoading: isSessionPending || reportQuery.isLoading,
  };
}
