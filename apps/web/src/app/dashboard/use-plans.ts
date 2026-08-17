"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type PlansQuery = Parameters<typeof api.api.plans.get>[0]["query"];

export type PlanSortKey = PlansQuery["sort"];
export type PlanSortDirection = PlansQuery["direction"];

export function usePlans(
  offset: number,
  limit: number,
  sort: PlanSortKey,
  direction: PlanSortDirection,
) {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const queryKey = ["plans", session?.user.id] as const;

  const plansQuery = useQuery({
    queryKey: [...queryKey, offset, limit, sort, direction],
    queryFn: async () =>
      (await api.api.plans.get({ query: { offset, limit, sort, direction } })).data,
    enabled: Boolean(session?.user.id),
    retry: false,
  });

  const savePlan = useMutation({
    mutationFn: (input: Parameters<typeof api.api.plans.put>[0]) =>
      api.api.plans.put(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: ["reports", session?.user.id],
      });
      toast.success("Monthly target saved");
    },
  });

  return {
    plans: plansQuery.data?.plans ?? [],
    total: plansQuery.data?.total ?? 0,
    isLoading: isSessionPending || plansQuery.isLoading,
    isSaving: savePlan.isPending,
    savePlan: savePlan.mutate,
  };
}
