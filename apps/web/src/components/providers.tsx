"use client";

import { Toaster } from "@crossval/ui/components/sonner";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api-error";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            toast.error(getApiErrorMessage(error));
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            toast.error(getApiErrorMessage(error));
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster closeButton richColors />
    </QueryClientProvider>
  );
}
