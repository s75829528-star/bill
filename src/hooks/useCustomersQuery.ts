/**
 * useCustomersQuery — React Query hooks for the Customers module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customersService,
  type Customer,
  type CustomerInsert,
  type CustomerUpdate,
} from "../services/customers";

// ── Query keys ─────────────────────────────────────────────────────

export const customerKeys = {
  all: ["customers"] as const,
  byBusiness: (businessId: string) => ["customers", businessId] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
  notes: (customerId: string) => ["customer_notes", customerId] as const,
};

// ── Fetch hooks ────────────────────────────────────────────────────

export function useCustomers(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? customerKeys.byBusiness(businessId) : customerKeys.all,
    queryFn: () => customersService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 30, // 30 s
  });
}

export function useCustomerById(customerId: string | null) {
  return useQuery({
    queryKey: customerId ? customerKeys.detail(customerId) : ["customers", "detail", "_none"],
    queryFn: () => customersService.getById(customerId!),
    enabled: !!customerId,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useCustomerNotes(customerId: string | null) {
  return useQuery({
    queryKey: customerId ? customerKeys.notes(customerId) : ["customer_notes", "_none"],
    queryFn: () => customersService.getNotes(customerId!),
    enabled: !!customerId,
    staleTime: 1000 * 30,
  });
}

// ── Mutation hooks ─────────────────────────────────────────────────

export function useCreateCustomer(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerInsert) => customersService.create(payload),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: customerKeys.byBusiness(businessId) });
    },
  });
}

export function useUpdateCustomer(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerUpdate }) =>
      customersService.update(id, payload),
    onSuccess: (updated: Customer) => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: customerKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: customerKeys.detail(updated.id) });
      }
    },
  });
}

export function useDeleteCustomer(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersService.delete(id),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: customerKeys.byBusiness(businessId) });
    },
  });
}

export function useDeleteManyCustomers(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => customersService.deleteMany(ids),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: customerKeys.byBusiness(businessId) });
    },
  });
}

export function useBulkUpdateCustomers(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, payload }: { ids: string[]; payload: CustomerUpdate }) =>
      customersService.bulkUpdate(ids, payload),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: customerKeys.byBusiness(businessId) });
    },
  });
}

export function useAddCustomerNote(customerId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, author }: { text: string; author?: string }) =>
      customersService.addNote(customerId!, text, author),
    onSuccess: () => {
      if (customerId) qc.invalidateQueries({ queryKey: customerKeys.notes(customerId) });
    },
  });
}
