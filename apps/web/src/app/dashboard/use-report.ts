"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type ReportQuery = Parameters<typeof api.api.reports.get>[0]["query"];

export type ReportSortKey = ReportQuery["sort"];
export type ReportSortDirection = ReportQuery["direction"];

export function useReport(
  start: string,
  end: string,
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
      start,
      end,
      offset,
      limit,
      sort,
      direction,
    ],
    queryFn: async () =>
      (await
        api.api.reports.get({
          query: { start, end, offset, limit, sort, direction },
        })).data,
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
