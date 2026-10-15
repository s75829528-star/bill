import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  brandsService,
  type BrandListFilters,
  type DbBrand,
  type DbBrandInsert,
  type DbBrandUpdate,
  type BrandStatus,
} from "../services/brands";

export const brandKeys = {
  all: ["brands"] as const,
  byBusiness: (businessId: string) => ["brands", businessId] as const,
  page: (businessId: string, filters: BrandListFilters) =>
    ["brands", businessId, "page", filters] as const,
  options: (businessId: string) => ["brands", businessId, "options"] as const,
};

export function useBrands(businessId: string | null, filters: BrandListFilters = {}) {
  return useQuery({
    queryKey: businessId ? brandKeys.page(businessId, filters) : brandKeys.all,
    queryFn: () => brandsService.getPage(businessId!, filters),
    enabled: !!businessId,
    staleTime: 1000 * 30,
  });
}

export function useBrandOptions(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? brandKeys.options(businessId) : brandKeys.all,
    queryFn: () => brandsService.getAll(businessId!, "active"),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5,
  });
}

function invalidateBrands(qc: ReturnType<typeof useQueryClient>, businessId: string | null) {
  if (businessId) qc.invalidateQueries({ queryKey: brandKeys.byBusiness(businessId) });
}

export function useCreateBrand(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DbBrandInsert) => brandsService.create(payload),
    onSuccess: () => invalidateBrands(qc, businessId),
  });
}

export function useUpdateBrand(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DbBrandUpdate }) =>
      brandsService.update(id, payload),
    onSettled: () => invalidateBrands(qc, businessId),
  });
}

export function useDeleteBrand(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brandsService.remove(id, businessId!),
    onSettled: () => invalidateBrands(qc, businessId),
  });
}

export function useDuplicateBrand(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (brand: DbBrand) => brandsService.duplicate(brand, businessId!),
    onSuccess: () => invalidateBrands(qc, businessId),
  });
}

export function useSetBrandStatus(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BrandStatus }) =>
      brandsService.setStatus(id, status),
    onSettled: () => invalidateBrands(qc, businessId),
  });
}

export type { DbBrand };