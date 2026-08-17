"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type ActualsQuery = Parameters<typeof api.api.actuals.get>[0]["query"];

export type ActualSortKey = ActualsQuery["sort"];
export type ActualSortDirection = ActualsQuery["direction"];

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
    queryFn: async () =>
      (await api.api.actuals.get({ query: { offset, limit, sort, direction } })).data,
    enabled: Boolean(session?.user.id),
    retry: false,
  });

  const createActual = useMutation({
    mutationFn: (input: Parameters<typeof api.api.actuals.post>[0]) =>
      api.api.actuals.post(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: ["reports", session?.user.id],
      });
      toast.success("Actual spend logged");
    },
  });

  const importActuals = useMutation({
    mutationFn: async (file: File) =>
      (await api.api.actuals.import.post({ file })).data?.imported ?? 0,
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({
        queryKey: ["reports", session?.user.id],
      });
      toast.success(`${count} actual ${count === 1 ? "row" : "rows"} imported`);
    },
  });

  return {
    actuals: actualsQuery.data?.actuals ?? [],
    total: actualsQuery.data?.total ?? 0,
    isLoading: isSessionPending || actualsQuery.isLoading,
    isSaving: createActual.isPending,
    isImporting: importActuals.isPending,
    createActual: createActual.mutate,
    importActuals: importActuals.mutateAsync,
  };
}
