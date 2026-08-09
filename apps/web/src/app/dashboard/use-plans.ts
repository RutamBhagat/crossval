"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type Plan = {
  id: string;
  categoryId: string;
  month: string;
  amountCents: number;
};

export type PlanSortKey = "month" | "category" | "amount";
export type PlanSortDirection = "ascending" | "descending";

type PlanInput = {
  categoryId: string;
  month: string;
  amount: string;
};

async function getPlans(
  offset: number,
  limit: number,
  sort: PlanSortKey,
  direction: PlanSortDirection,
) {
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    sort,
    direction,
  });
  const response = await fetch(`/api/plans?${query}`);
  const data = (await response.json()) as {
    plans?: Plan[];
    total?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Plans could not be loaded");
  }

  return { plans: data.plans ?? [], total: data.total ?? 0 };
}

async function savePlan(input: PlanInput) {
  const response = await fetch("/api/plans", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Plan could not be saved");
  }
}

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
    queryFn: async () => {
      try {
        return await getPlans(offset, limit, sort, direction);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Plans could not be loaded",
        );
        throw error;
      }
    },
    enabled: Boolean(session?.user.id),
    retry: false,
  });
  const savePlanMutation = useMutation({
    mutationFn: savePlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: ["reports", session?.user.id],
      });
      toast.success("Monthly target saved");
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    plans: plansQuery.data?.plans ?? [],
    total: plansQuery.data?.total ?? 0,
    isLoading: isSessionPending || plansQuery.isLoading,
    isSaving: savePlanMutation.isPending,
    savePlan: savePlanMutation.mutate,
  };
}
