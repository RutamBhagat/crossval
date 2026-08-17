"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type ReportActualsQuery = Parameters<
  typeof api.api.reports.actuals.get
>[0]["query"];

export function useReportActuals(
  categoryId?: ReportActualsQuery["categoryId"],
  month?: ReportActualsQuery["month"],
) {
  const { data: session } = authClient.useSession();
  const actualsQuery = useQuery({
    queryKey: ["report-actuals", session?.user.id, categoryId, month],
    queryFn: async () =>
      (await
        api.api.reports.actuals.get({
          query: { categoryId: categoryId!, month: month! },
        })).data,
    enabled: Boolean(session?.user.id && categoryId && month),
    retry: false,
  });

  return {
    actuals: actualsQuery.data?.actuals ?? [],
    isLoading: actualsQuery.isLoading,
  };
}
