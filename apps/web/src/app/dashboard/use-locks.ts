"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

type PeriodLock = {
  id: string;
  month: string;
};

async function getLocks() {
  const response = await fetch("/api/locks");
  const data = (await response.json()) as { locks?: PeriodLock[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Locked months could not be loaded");
  }

  return data.locks ?? [];
}

async function lockMonth(month: string) {
  const response = await fetch("/api/locks", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month }),
  });
  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Month could not be locked");
  }
}

export function useLocks() {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const queryKey = ["locks", session?.user.id] as const;
  const locksQuery = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await getLocks();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Locked months could not be loaded");
        throw error;
      }
    },
    enabled: Boolean(session?.user.id),
    retry: false,
  });
  const lockMonthMutation = useMutation({
    mutationFn: lockMonth,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Month locked");
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    locks: locksQuery.data ?? [],
    isLoading: isSessionPending || locksQuery.isLoading,
    isLocking: lockMonthMutation.isPending,
    lockMonth: lockMonthMutation.mutate,
  };
}
