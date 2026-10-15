/**
 * useProductsQuery — React Query hooks for the Inventory Products module.
 *
 * Keeps server state (fetch / mutate) separate from UI state.
 * Products, Categories, and Suppliers all follow the same pattern.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsService,
  categoriesService,
  suppliersService,
  type DbProduct,
  type DbProductInsert,
  type DbProductUpdate,
  type DbCategory,
  type DbCategoryInsert,
  type DbSupplier,
  type DbSupplierInsert,
} from "../services/products";

// ── Query keys ─────────────────────────────────────────────────────

export const productKeys = {
  all: ["products"] as const,
  byBusiness: (id: string) => ["products", id] as const,
};

export const categoryKeys = {
  all: ["inv_categories"] as const,
  byBusiness: (id: string) => ["inv_categories", id] as const,
};

export const supplierKeys = {
  all: ["inv_suppliers"] as const,
  byBusiness: (id: string) => ["inv_suppliers", id] as const,
};

// ── Products: fetch ─────────────────────────────────────────────────

export function useProducts(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? productKeys.byBusiness(businessId) : productKeys.all,
    queryFn: () => productsService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 30, // 30 s
  });
}

// ── Products: mutations ─────────────────────────────────────────────

export function useCreateProduct(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DbProductInsert) => productsService.create(payload),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: productKeys.byBusiness(businessId) });
    },
  });
}

export function useUpdateProduct(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DbProductUpdate }) =>
      productsService.update(id, payload),
    // Optimistic update
    onMutate: async ({ id, payload }) => {
      if (!businessId) return;
      await qc.cancelQueries({ queryKey: productKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbProduct[]>(productKeys.byBusiness(businessId));
      qc.setQueryData<DbProduct[]>(productKeys.byBusiness(businessId), (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, ...payload } : p))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData(productKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: productKeys.byBusiness(businessId) });
    },
  });
}

export function useDeleteProduct(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onMutate: async (id) => {
      if (!businessId) return;
      await qc.cancelQueries({ queryKey: productKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbProduct[]>(productKeys.byBusiness(businessId));
      qc.setQueryData<DbProduct[]>(productKeys.byBusiness(businessId), (old) =>
        (old ?? []).filter((p) => p.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData(productKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: productKeys.byBusiness(businessId) });
    },
  });
}

export function useDeleteManyProducts(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => productsService.deleteMany(ids),
    onMutate: async (ids) => {
      if (!businessId) return;
      const idSet = new Set(ids);
      await qc.cancelQueries({ queryKey: productKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbProduct[]>(productKeys.byBusiness(businessId));
      qc.setQueryData<DbProduct[]>(productKeys.byBusiness(businessId), (old) =>
        (old ?? []).filter((p) => !idSet.has(p.id))
      );
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData(productKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: productKeys.byBusiness(businessId) });
    },
  });
}

export function useBulkUpdateProducts(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: DbProductUpdate }) =>
      productsService.bulkUpdate(ids, payload),
    onMutate: async ({ ids, payload }) => {
      if (!businessId) return;
      const idSet = new Set(ids);
      await qc.cancelQueries({ queryKey: productKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbProduct[]>(productKeys.byBusiness(businessId));
      qc.setQueryData<DbProduct[]>(productKeys.byBusiness(businessId), (old) =>
        (old ?? []).map((p) => (idSet.has(p.id) ? { ...p, ...payload } : p))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData(productKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: productKeys.byBusiness(businessId) });
    },
  });
}

// ── Categories ──────────────────────────────────────────────────────

export function useCategories(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? categoryKeys.byBusiness(businessId) : categoryKeys.all,
    queryFn: () => categoriesService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 min — categories change rarely
  });
}

export function useCreateCategory(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DbCategoryInsert) => categoriesService.create(payload),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: categoryKeys.byBusiness(businessId) });
    },
  });
}

export function useUpdateCategory(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DbCategoryInsert> }) =>
      categoriesService.update(id, payload),
    onMutate: async ({ id, payload }) => {
      if (!businessId) return;
      await qc.cancelQueries({ queryKey: categoryKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbCategory[]>(categoryKeys.byBusiness(businessId));
      qc.setQueryData<DbCategory[]>(categoryKeys.byBusiness(businessId), (old) =>
        (old ?? []).map((c) => (c.id === id ? { ...c, ...payload } : c))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData(categoryKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: categoryKeys.byBusiness(businessId) });
    },
  });
}

export function useDeleteCategory(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onMutate: async (id) => {
      if (!businessId) return;
      await qc.cancelQueries({ queryKey: categoryKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbCategory[]>(categoryKeys.byBusiness(businessId));
      qc.setQueryData<DbCategory[]>(categoryKeys.byBusiness(businessId), (old) =>
        (old ?? []).filter((c) => c.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData(categoryKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: categoryKeys.byBusiness(businessId) });
    },
  });
}

// ── Suppliers ───────────────────────────────────────────────────────

export function useSuppliers(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? supplierKeys.byBusiness(businessId) : supplierKeys.all,
    queryFn: () => suppliersService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useCreateSupplier(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DbSupplierInsert) => suppliersService.create(payload),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: supplierKeys.byBusiness(businessId) });
    },
  });
}

export function useUpdateSupplier(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DbSupplierInsert> }) =>
      suppliersService.update(id, payload),
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: supplierKeys.byBusiness(businessId) });
    },
  });
}

export function useDeleteSupplier(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersService.delete(id),
    onMutate: async (id) => {
      if (!businessId) return;
      await qc.cancelQueries({ queryKey: supplierKeys.byBusiness(businessId) });
      const previous = qc.getQueryData<DbSupplier[]>(supplierKeys.byBusiness(businessId));
      qc.setQueryData<DbSupplier[]>(supplierKeys.byBusiness(businessId), (old) =>
        (old ?? []).filter((s) => s.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (businessId && ctx?.previous) {
        qc.setQueryData(supplierKeys.byBusiness(businessId), ctx.previous);
      }
    },
    onSettled: () => {
      if (businessId) qc.invalidateQueries({ queryKey: supplierKeys.byBusiness(businessId) });
    },
  });
}
