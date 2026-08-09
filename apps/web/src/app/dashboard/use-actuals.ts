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

export type ActualSortKey = "month" | "category" | "note" | "amount";
export type ActualSortDirection = "ascending" | "descending";

type ActualInput = {
  categoryId: string;
  month: string;
  amount: string;
  note?: string;
};

async function getActuals(
  offset: number,
  limit: number,
  sort: ActualSortKey,
  direction: ActualSortDirection,
) {
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    sort,
    direction,
  });
  const response = await fetch(`/api/actuals?${query}`);
  const data = (await response.json()) as {
    actuals?: Actual[];
    total?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Actuals could not be loaded");
  }

  return { actuals: data.actuals ?? [], total: data.total ?? 0 };
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

async function importActuals(file: File) {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/actuals/import", {
    method: "POST",
    body,
  });
  const data = (await response.json()) as { imported?: number; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Actuals could not be imported");
  }

  return data.imported ?? 0;
}

export function useActuals(
  offset: number,
  limit: number,
  sort: ActualSortKey,
  direction: ActualSortDirection,
) {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const queryKey = ["actuals", session?.user.id] as const;
  const actualsQuery = useQuery({
    queryKey: [...queryKey, offset, limit, sort, direction],
    queryFn: async () => {
      try {
        return await getActuals(offset, limit, sort, direction);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Actuals could not be loaded",
        );
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
      void queryClient.invalidateQueries({
        queryKey: ["reports", session?.user.id],
      });
      toast.success("Actual spend logged");
    },
    onError: (error) => toast.error(error.message),
  });
  const importActualsMutation = useMutation({
    mutationFn: importActuals,
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: ["reports", session?.user.id],
      });
      toast.success(`${count} actual ${count === 1 ? "row" : "rows"} imported`);
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    actuals: actualsQuery.data?.actuals ?? [],
    total: actualsQuery.data?.total ?? 0,
    isLoading: isSessionPending || actualsQuery.isLoading,
    isSaving: createActualMutation.isPending,
    isImporting: importActualsMutation.isPending,
    createActual: createActualMutation.mutate,
    importActuals: importActualsMutation.mutateAsync,
  };
}
