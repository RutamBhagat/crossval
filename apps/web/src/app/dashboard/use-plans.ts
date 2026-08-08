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

type PlanInput = {
  categoryId: string;
  month: string;
  amount: string;
};

async function getPlans() {
  const response = await fetch("/api/plans");
  const data = (await response.json()) as { plans?: Plan[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Plans could not be loaded");
  }

  return data.plans ?? [];
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

export function usePlans() {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const queryKey = ["plans", session?.user.id] as const;
  const plansQuery = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await getPlans();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Plans could not be loaded");
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
      toast.success("Monthly target saved");
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    plans: plansQuery.data ?? [],
    isLoading: isSessionPending || plansQuery.isLoading,
    isSaving: savePlanMutation.isPending,
    savePlan: savePlanMutation.mutate,
  };
}
