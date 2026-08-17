"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export function useLocks() {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const queryKey = ["locks", session?.user.id] as const;

  const locksQuery = useQuery({
    queryKey,
    queryFn: async () => (await api.api.locks.get()).data,
    enabled: Boolean(session?.user.id),
    retry: false,
  });

  const lockMonth = useMutation({
    mutationFn: (input: Parameters<typeof api.api.locks.put>[0]) =>
      api.api.locks.put(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Month locked");
    },
  });

  return {
    locks: locksQuery.data?.locks ?? [],
    isLoading: isSessionPending || locksQuery.isLoading,
    isLocking: lockMonth.isPending,
    lockMonth: (month: string) => lockMonth.mutate({ month }),
  };
}
