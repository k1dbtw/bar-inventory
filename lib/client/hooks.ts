"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { statusOf, type WriteOffReason } from "@/lib/domain";
import type { ProductInput } from "@/lib/inventory";
import type { SettingsDTO } from "@/lib/settings";
import { api, UnauthorizedClientError, type AppState } from "./api";

const STATE_KEY = ["state"];

export function useAppState() {
  const router = useRouter();
  const query = useQuery({ queryKey: STATE_KEY, queryFn: api.state });

  useEffect(() => {
    if (query.error instanceof UnauthorizedClientError) router.replace("/login");
  }, [query.error, router]);

  return query;
}

export function useHistory() {
  return useQuery({ queryKey: ["history"], queryFn: api.history });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: api.stats });
}

export function useArchivedProducts() {
  return useQuery({ queryKey: ["archived"], queryFn: api.archivedProducts });
}

function useInvalidateAll() {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: STATE_KEY });
    client.invalidateQueries({ queryKey: ["history"] });
    client.invalidateQueries({ queryKey: ["stats"] });
    client.invalidateQueries({ queryKey: ["archived"] });
  };
}

/** Quantity changes apply instantly on screen, then reconcile with the server. */
export function useAdjust() {
  const client = useQueryClient();
  const invalidate = useInvalidateAll();

  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) => api.adjust(id, delta),
    onMutate: async ({ id, delta }) => {
      await client.cancelQueries({ queryKey: STATE_KEY });
      const previous = client.getQueryData<AppState>(STATE_KEY);
      if (previous) {
        client.setQueryData<AppState>(STATE_KEY, {
          ...previous,
          products: previous.products.map((product) => {
            if (product.id !== id) return product;
            const quantity = Math.max(0, Math.round((product.quantity + delta) * 1000) / 1000);
            return { ...product, quantity, status: statusOf(quantity, product.lowStockThreshold) };
          }),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(STATE_KEY, context.previous);
    },
    onSettled: invalidate,
  });
}

export function useWriteOff() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({
      id,
      amount,
      reason,
    }: {
      id: string;
      amount: number;
      reason: WriteOffReason;
    }) => api.writeOff(id, amount, reason),
    onSettled: invalidate,
  });
}

export function useCreateProduct() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (input: ProductInput) => api.createProduct(input),
    onSettled: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) =>
      api.updateProduct(id, input),
    onSettled: invalidate,
  });
}

export function useArchiveProduct() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => api.archive(id),
    onSettled: invalidate,
  });
}

export function useRestoreProduct() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => api.restore(id),
    onSettled: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSettled: invalidate,
  });
}

export function useUpdateSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<SettingsDTO>) => api.updateSettings(patch),
    onSuccess: (settings) => {
      const previous = client.getQueryData<AppState>(STATE_KEY);
      if (previous) client.setQueryData<AppState>(STATE_KEY, { ...previous, settings });
    },
  });
}
