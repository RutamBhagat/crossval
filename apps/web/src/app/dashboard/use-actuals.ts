"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type Actual = {
  id: string;
  categoryId: string;
  month: string;
  amountCents: number;
  note?: string;
};

type ActualInput = {
  categoryId: string;
  month: string;
  amount: string;
  note?: string;
};

async function getActuals() {
  const response = await fetch("/api/actuals");
  const data = (await response.json()) as { actuals?: Actual[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Actuals could not be loaded");
  }

  return data.actuals ?? [];
}

async function createActual(input: ActualInput) {
  const response = await fetch("/api/actuals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Actual could not be logged");
  }
}

export function useActuals() {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const queryKey = ["actuals", session?.user.id] as const;
  const actualsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await getActuals();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Actuals could not be loaded");
        throw error;
      }
    },
    enabled: Boolean(session?.user.id),
    retry: false,
  });
  const createActualMutation = useMutation({
    mutationFn: createActual,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Actual spend logged");
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    actuals: actualsQuery.data ?? [],
    isLoading: isSessionPending || actualsQuery.isLoading,
    isSaving: createActualMutation.isPending,
    createActual: createActualMutation.mutate,
  };
}
