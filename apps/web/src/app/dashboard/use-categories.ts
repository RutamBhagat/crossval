"use client";

import { useQuery } from "@tanstack/react-query";

import { categories as fallbackCategories } from "@crossval/domain/categories";

type Category = (typeof fallbackCategories)[number];

function useCategories() {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      const data = (await response.json()) as {
        categories?: Category[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Categories could not be loaded");
      }

      return data.categories ?? [];
    },
    retry: false,
  });

  return {
    ...query,
    categories: query.data ?? fallbackCategories,
  };
}

export { useCategories };
